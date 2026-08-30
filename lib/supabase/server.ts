import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Server-side Supabase client bound to the request's cookies. Safe to use in
 * Route Handlers and Server Actions (both may mutate cookies); if ever called
 * from a Server Component, cookie writes are no-ops (Next.js throws on
 * mutation there) — the try/catch below matches Supabase's documented
 * pattern for that case.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing).');
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — cookies are refreshed by middleware instead.
        }
      }
    }
  });
}

/**
 * Resolves the currently signed-in user from the request's cookies.
 * Uses auth.getUser() (round-trips to Supabase Auth), never getSession()
 * (which only decodes the cookie locally and isn't safe to authorize a write with).
 */
export async function getSessionUser(): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return { user: data.user, supabase };
}
