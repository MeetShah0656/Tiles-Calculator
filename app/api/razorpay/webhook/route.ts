import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { invalidateCached } from '@/lib/cache/memoryCache';

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      // Without a configured secret we have no way to verify this request actually
      // came from Razorpay, so refuse to act on it rather than trusting it blindly.
      console.warn('RAZORPAY_WEBHOOK_SECRET not configured — ignoring unverifiable webhook.');
      return NextResponse.json({ success: false, error: 'Webhook not configured' }, { status: 503 });
    }

    if (!signature) {
      return NextResponse.json({ success: false, error: 'Missing webhook signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyText || '{}');

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const paymentId = payment?.id;
      const userEmail = payment?.email;

      const admin = await getSupabaseAdmin();
      if (admin && userEmail && paymentId) {
        const { data: subData } = await admin
          .from('subscriptions')
          .select('*')
          .eq('user_email', userEmail)
          .maybeSingle();

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Idempotency: Razorpay retries webhook delivery on timeout/non-2xx, and the
        // same event can arrive more than once. UNIQUE(provider, payment_id) means a
        // repeat delivery for the same payment can't re-run the activation below.
        const { error: eventErr } = await admin.from('payment_events').insert({
          user_id: subData?.user_id || null,
          provider: 'razorpay',
          event_source: 'webhook',
          event_type: event.event,
          payment_id: paymentId,
          order_id: orderId,
          plan_name: subData?.plan_name || null,
          amount: typeof payment?.amount === 'number' ? payment.amount : null,
          currency: payment?.currency || null
        });

        const alreadyProcessed = eventErr?.code === '23505'; // unique_violation

        if (alreadyProcessed) {
          console.warn(`Razorpay webhook payment ${paymentId} already processed — skipping duplicate update.`);
        } else {
          if (eventErr) {
            console.error('Failed to record webhook payment audit event:', eventErr);
          }

          if (subData) {
            const { error: updateErr } = await admin
              .from('subscriptions')
              .update({
                status: 'active',
                payment_id: paymentId,
                order_id: orderId,
                activated_at: now.toISOString(),
                expires_at: expiresAt,
                updated_at: now.toISOString()
              })
              .eq('id', subData.id);

            // Best-effort only: the serverless instance handling this webhook is
            // frequently not the one that will later serve GET /api/subscription,
            // so this doesn't guarantee a fresh read — the cache's short TTL is
            // the real correctness backstop, not this invalidation call.
            if (!updateErr && subData.user_id) {
              invalidateCached(`sub:${subData.user_id}`);
            }
          }
        }
      } else if (!admin) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not configured — webhook could not persist subscription update.');
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('Razorpay webhook error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
