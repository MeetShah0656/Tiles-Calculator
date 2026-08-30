import { createClient } from '@/lib/supabase/client';

/**
 * The one use-case that talks to Supabase directly from the browser — see
 * lib/supabase/client.ts for why (PKCE code_verifier must land in a cookie
 * the server-side /auth/callback route can read).
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });

  if (error || !data?.url) {
    return { ok: false, error: error?.message || 'Failed to start Google sign-in.' };
  }

  window.location.href = data.url;
  return { ok: true };
}
