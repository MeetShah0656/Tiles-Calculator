import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Scoped to exactly one use case in this app:
 * kicking off Google OAuth (lib/usecases/auth/signInWithGoogle.ts). It must
 * be this client (not a plain @supabase/supabase-js client) because its
 * cookie-based storage adapter is what lets app/auth/callback/route.ts read
 * back the PKCE code_verifier on the server. Do not use it for anything else
 * — all other reads/writes go through the API routes.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing).');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
