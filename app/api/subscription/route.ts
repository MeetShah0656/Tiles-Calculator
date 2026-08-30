import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/server';
import { getCached, setCached } from '@/lib/cache/memoryCache';

const CACHE_TTL_MS = 30_000;

interface SubscriptionRow {
  status?: string;
  expires_at?: string | null;
  plan_name?: string;
  payment_id?: string | null;
  payment_provider?: string;
  activated_at?: string | null;
  activation_key?: string | null;
}

function computeSubscriptionState(row: SubscriptionRow | null) {
  if (!row) {
    return {
      isPro: false,
      planName: 'Free Tier',
      expiresAt: null,
      paymentId: null,
      paymentProvider: 'manual',
      activatedAt: null,
      activationKey: null,
      keyRedeemed: false
    };
  }

  const isStillValid = row.status === 'active' && (!row.expires_at || new Date(row.expires_at) > new Date());

  return {
    isPro: isStillValid,
    planName: isStillValid ? row.plan_name || 'Tivera Pro' : 'Free Tier',
    expiresAt: row.expires_at || null,
    paymentId: row.payment_id || null,
    paymentProvider: row.payment_provider || 'manual',
    activatedAt: row.activated_at || null,
    activationKey: row.activation_key || null,
    keyRedeemed: Boolean(
      row.payment_provider === 'activation_key' || (row.payment_id && row.payment_id.startsWith('key_'))
    )
  };
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const { user, supabase } = session;
  const cacheKey = `sub:${user.id}`;

  const cached = getCached<ReturnType<typeof computeSubscriptionState>>(cacheKey);
  if (cached) {
    return NextResponse.json({ subscription: cached });
  }

  const { data: row } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
  const subscription = computeSubscriptionState(row);

  setCached(cacheKey, subscription, CACHE_TTL_MS);

  return NextResponse.json({ subscription });
}
