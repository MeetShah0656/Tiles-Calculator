import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyText)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(bodyText || '{}');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const paymentId = payment?.id;
      const userEmail = payment?.email;

      if (supabaseUrl && supabaseKey && userEmail) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_email', userEmail)
          .maybeSingle();

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        if (subData) {
          await supabase.from('subscriptions').update({
            status: 'active',
            payment_id: paymentId,
            order_id: orderId,
            activated_at: now.toISOString(),
            expires_at: expiresAt,
            updated_at: now.toISOString()
          }).eq('id', subData.id);
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
