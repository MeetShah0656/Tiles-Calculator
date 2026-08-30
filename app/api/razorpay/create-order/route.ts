import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const amount = body.amount || 19900; // in paise (₹199)
    const currency = body.currency || 'INR';

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      // Return order format for Razorpay Checkout
      const mockOrderId = 'order_mock_' + Math.random().toString(36).substring(2, 10);
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: amount,
        currency: currency,
        message: "Demo Razorpay Order generated."
      });
    }

    const Razorpay = (await import('razorpay')).default;
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await instance.orders.create({
      amount: amount,
      currency: currency,
      receipt: `tivera_pro_${Date.now()}`,
      notes: {
        plan: body.plan || 'monthly'
      }
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (err: any) {
    console.error("Razorpay order creation error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to create Razorpay order"
    }, { status: 500 });
  }
}
