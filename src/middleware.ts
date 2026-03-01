import { NextResponse, type NextRequest } from 'next/server';

// Do not interact with the Supabase session here. The @supabase/ssr server
// client calls setAll() to write cookie values back to the response — when it
// sees an expired token it writes cookie-clearing Set-Cookie headers, which
// the browser executes on every navigation, deleting auth cookies before the
// browser client's own refresh has a chance to run. All route protection is
// handled client-side by RequireAuth; all token refresh is handled by the
// browser Supabase client. The middleware only needs to be a pass-through.
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    // Match all routes except static files and api
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
