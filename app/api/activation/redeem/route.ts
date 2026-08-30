import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/server';
import { invalidateCached } from '@/lib/cache/memoryCache';

// Master/support override keys. Kept server-only (never sent to the browser).
// Override via ACTIVATION_MASTER_KEYS="KEY_ONE,KEY_TWO" to rotate without a deploy.
const DEFAULT_MASTER_KEYS = [
  'TIVERA-UNLIMITED-PRO',
  'TIVERA-VIP-UNLIMITED',
  'TIVERA-MASTER-ACCESS',
  'TIVERA-UNLIMITED-MEET'
];

function getMasterKeys(): Set<string> {
  const fromEnv = process.env.ACTIVATION_MASTER_KEYS;
  const keys = fromEnv ? fromEnv.split(',').map((k) => k.trim()).filter(Boolean) : DEFAULT_MASTER_KEYS;
  return new Set(keys.map((k) => k.toUpperCase()));
}

// Mirrors the deterministic key shown to a user in the Settings tab
// (store.js#getOrGenerateUserKey) so a user's own displayed key stays valid.
function deterministicKeyForEmail(email: string): string {
  const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const hash1 = cleanEmail.slice(0, 4).padEnd(4, 'X');

  let checksum = 0;
  for (let i = 0; i < email.length; i++) {
    checksum = (checksum * 31 + email.charCodeAt(i)) & 0xffffffff;
  }
  const hash2 = Math.abs((checksum % 9000) + 1000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');

  return `TIVERA-7D-${hash1}-${hash2}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputKey = typeof body.key === 'string' ? body.key.trim().toUpperCase() : '';

    if (!inputKey) {
      return NextResponse.json({ success: false, error: 'Please enter an activation key.' }, { status: 400 });
    }

    const admin = await getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Activation is not configured on the server.' },
        { status: 503 }
      );
    }

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'You must be signed in to redeem a key.' }, { status: 401 });
    }
    const { user } = session;

    const isMasterKey = getMasterKeys().has(inputKey);
    const ownKey = user.email ? deterministicKeyForEmail(user.email) : null;
    const isMatch = isMasterKey || (ownKey && inputKey === ownKey) || inputKey.startsWith('TIVERA-7D-');

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid activation key. Please check your key format.' },
        { status: 400 }
      );
    }

    if (!isMasterKey) {
      const { data: existingSub } = await admin
        .from('subscriptions')
        .select('payment_provider, payment_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const alreadyRedeemed =
        existingSub?.payment_provider === 'activation_key' || existingSub?.payment_id?.startsWith('key_redeem_');

      if (alreadyRedeemed) {
        return NextResponse.json(
          { success: false, error: 'This code can only be used once per account.' },
          { status: 409 }
        );
      }
    }

    const now = new Date();
    const expiresAt = isMasterKey
      ? new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const planName = isMasterKey ? 'TIVERA PRO (Unlimited Master Access)' : 'TIVERA PRO (7-Day Trial)';
    const paymentId = isMasterKey ? 'key_master_unlimited' : `key_redeem_${inputKey}`;

    const { error: dbErr } = await admin.from('subscriptions').upsert(
      {
        user_id: user.id,
        user_email: user.email || '',
        plan_name: planName,
        status: 'active',
        payment_provider: 'activation_key',
        payment_id: paymentId,
        activation_key: isMasterKey ? 'TIVERA-UNLIMITED-PRO' : ownKey || inputKey,
        activated_at: now.toISOString(),
        expires_at: expiresAt,
        updated_at: now.toISOString()
      },
      { onConflict: 'user_id' }
    );

    if (dbErr) {
      console.error('Failed to persist activation key redemption:', dbErr);
      return NextResponse.json({ success: false, error: 'Failed to activate key. Please try again.' }, { status: 500 });
    }

    invalidateCached(`sub:${user.id}`);

    return NextResponse.json({
      success: true,
      message: isMasterKey
        ? 'Congratulations! Unlimited TIVERA PRO Master Access activated successfully.'
        : 'Congratulations! 7-Day TIVERA PRO Trial activated successfully.',
      planName,
      expiresAt
    });
  } catch (err: any) {
    console.error('Activation key redemption error:', err);
    return NextResponse.json({ success: false, error: 'Failed to redeem activation key.' }, { status: 500 });
  }
}
