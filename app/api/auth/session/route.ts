import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/server';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const { user, supabase } = session;

  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (!profile) {
    const businessName = user.user_metadata?.business_name || 'TIVERA Natural Stone';
    const phoneNumber = user.user_metadata?.phone_number || '';

    const { data: created } = await supabase
      .from('profiles')
      .upsert({ id: user.id, business_name: businessName, phone_number: phoneNumber })
      .select()
      .maybeSingle();

    profile = created || null;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        ...user.user_metadata,
        business_name: profile?.business_name ?? user.user_metadata?.business_name ?? '',
        phone_number: profile?.phone_number ?? user.user_metadata?.phone_number ?? ''
      }
    }
  });
}
