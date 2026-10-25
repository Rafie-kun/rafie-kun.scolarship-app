import { NextResponse, type NextRequest } from 'next/server';

/**
 * Coarse gate only. It checks for the presence of an Auth.js session cookie and
 * redirects anonymous visitors to the built-in sign-in page. It deliberately
 * does not import the auth config (which pulls in the Postgres driver and must
 * stay on the Node.js runtime). Real session/role checks happen server-side in
 * the protected layouts and route handlers.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession =
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token') ||
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  if (!hasSession) {
    const url = new URL('/api/auth/signin', req.url);
    url.searchParams.set('callbackUrl', pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
