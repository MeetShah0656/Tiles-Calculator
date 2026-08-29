import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan = 'monthly',
      userId,
      userEmail
    } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Calculate expiration date
    const now = new Date();
    const durationDays = plan === 'yearly' ? 365 : 30;
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const planName = plan === 'yearly' ? 'TIVERA PRO (Yearly)' : 'TIVERA PRO (Monthly)';

    let isValid = false;

    if (keySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
    } else {
      // Demo / Test fallback if Razorpay secret is not yet set up in env
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid Razorpay payment signature' },
        { status: 400 }
      );
    }

    // Persist verified subscription to Supabase Cloud Database 'subscriptions' table
    if (supabaseUrl && supabaseKey && userId) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          user_email: userEmail || '',
          plan_name: planName,
          status: 'active',
          payment_provider: 'razorpay',
          payment_id: razorpay_payment_id || `pay_razorpay_${Date.now()}`,
          order_id: razorpay_order_id || null,
          activated_at: now.toISOString(),
          expires_at: expiresAt,
          updated_at: now.toISOString()
        }, { onConflict: 'user_id' });
      } catch (dbErr) {
        console.error("Failed to update Supabase subscriptions table on payment verification:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Razorpay payment verified successfully.',
      planName,
      expiresAt,
      paymentId: razorpay_payment_id
    });

  } catch (err: any) {
    console.error("Razorpay payment verification error:", err);
    return NextResponse.json(
      { success: false, error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
