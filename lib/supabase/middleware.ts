import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase session cookie on every matched request (see root
 * middleware.ts for the matcher). Must set cookies on BOTH the mutated
 * request (so downstream Route Handlers in this same request see the fresh
 * token) and the response (so the browser receives it) — this dual-write is
 * why middleware can't just reuse lib/supabase/server.ts's simpler pattern.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // Must call getUser() (not getSession()) to actually trigger a token
  // refresh round-trip against Supabase Auth when the access token is stale.
  await supabase.auth.getUser();

  return response;
}
