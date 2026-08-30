import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/server';
import { invalidateCached } from '@/lib/cache/memoryCache';

const PLAN_DURATION_DAYS: Record<string, number> = { monthly: 30, yearly: 365 };
const PLAN_LABELS: Record<string, string> = {
  monthly: 'TIVERA PRO (Monthly)',
  yearly: 'TIVERA PRO (Yearly)'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification fields.' },
        { status: 400 }
      );
    }

    let plan: 'monthly' | 'yearly' = 'monthly';
    let orderAmount: number | null = null;
    let orderCurrency: string | null = null;

    if (keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { success: false, error: 'Invalid Razorpay payment signature' },
          { status: 400 }
        );
      }

      // Read the plan from the order we created (via Razorpay), not from client input,
      // so a verified signature can't be replayed to activate a different plan.
      if (keyId) {
        try {
          const Razorpay = (await import('razorpay')).default;
          const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const order: any = await instance.orders.fetch(razorpay_order_id);
          plan = order?.notes?.plan === 'yearly' ? 'yearly' : 'monthly';
          orderAmount = typeof order?.amount === 'number' ? order.amount : null;
          orderCurrency = order?.currency || null;
        } catch (fetchErr) {
          console.error('Failed to fetch Razorpay order during verification:', fetchErr);
          return NextResponse.json(
            { success: false, error: 'Could not verify order with Razorpay.' },
            { status: 502 }
          );
        }
      }
    } else {
      // No Razorpay secret configured on the server: this is local/demo mode only
      // (create-order also returns a mock order in that case, so no real payment occurred).
      plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
    }

    const now = new Date();
    const durationDays = PLAN_DURATION_DAYS[plan];
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const planName = PLAN_LABELS[plan];

    const admin = await getSupabaseAdmin();
    if (admin) {
      const session = await getSessionUser();
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'You must be signed in to activate a subscription.' },
          { status: 401 }
        );
      }
      const { user } = session;

      // Idempotency: record this payment_id in the audit trail before activating
      // anything. UNIQUE(provider, payment_id) means a retried/duplicate call for
      // the same payment can't re-run the activation (e.g. reset activated_at).
      const { error: eventErr } = await admin.from('payment_events').insert({
        user_id: user.id,
        provider: 'razorpay',
        event_source: 'verify',
        event_type: 'payment.verified',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        plan_name: planName,
        amount: orderAmount,
        currency: orderCurrency
      });

      const alreadyProcessed = eventErr?.code === '23505'; // unique_violation

      if (alreadyProcessed) {
        console.warn(`Razorpay payment ${razorpay_payment_id} already processed — skipping duplicate activation.`);
      } else {
        if (eventErr) {
          console.error('Failed to record payment audit event:', eventErr);
        }

        const { error: dbErr } = await admin.from('subscriptions').upsert(
          {
            user_id: user.id,
            user_email: user.email || '',
            plan_name: planName,
            status: 'active',
            payment_provider: 'razorpay',
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            activated_at: now.toISOString(),
            expires_at: expiresAt,
            updated_at: now.toISOString()
          },
          { onConflict: 'user_id' }
        );

        if (dbErr) {
          console.error('Failed to persist verified subscription:', dbErr);
        } else {
          invalidateCached(`sub:${user.id}`);
        }
      }
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not configured — verified payment was not persisted to the database.');
    }

    return NextResponse.json({
      success: true,
      message: 'Razorpay payment verified successfully.',
      planName,
      expiresAt,
      paymentId: razorpay_payment_id
    });
  } catch (err: any) {
    console.error('Razorpay payment verification error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
