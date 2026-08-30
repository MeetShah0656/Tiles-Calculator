import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }
  const { user, supabase } = session;

  const body = await request.json().catch(() => ({}));
  const businessName = typeof body.businessName === 'string' ? body.businessName : '';
  const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber : '';

  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: user.id, business_name: businessName, phone_number: phoneNumber });

  if (profileErr) {
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }

  const { data: updated, error: authErr } = await supabase.auth.updateUser({
    data: { business_name: businessName, phone_number: phoneNumber }
  });

  if (authErr || !updated?.user) {
    return NextResponse.json({ error: authErr?.message || 'Failed to update profile.' }, { status: 500 });
  }

  return NextResponse.json({ user: updated.user });
}
