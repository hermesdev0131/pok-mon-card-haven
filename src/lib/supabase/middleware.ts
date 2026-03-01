import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip Supabase session refresh if not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Read the session from cookies (local read, no network call to Supabase).
  // Previously used getUser() which hits the Supabase Auth API and can trigger
  // a server-side token refresh. On Vercel (high latency to Supabase), this
  // races with the browser client's own auto-refresh on visibility change:
  // both send the same single-use refresh token → one fails → _signOut() fires
  // → SIGNED_OUT → page freeze. All token refresh is handled by the browser
  // client via onAuthStateChange. The middleware only needs to forward the
  // current cookies so Server Components can read the session if needed.
  await supabase.auth.getSession();

  return supabaseResponse;
}
