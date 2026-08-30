import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/server';
import { invalidateCached } from '@/lib/cache/memoryCache';

export async function POST() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const { user, supabase } = session;
  const now = new Date().toISOString();

  // Matches the self-downgrade RLS policy on subscriptions exactly
  // (status='canceled' AND plan_name='Free Tier' AND payment_provider='manual') —
  // this is the one write a user's own session is permitted to make.
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan_name: 'Free Tier',
      status: 'canceled',
      payment_provider: 'manual',
      expires_at: now,
      updated_at: now
    })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel subscription.' }, { status: 500 });
  }

  invalidateCached(`sub:${user.id}`);

  return NextResponse.json({ success: true });
}
