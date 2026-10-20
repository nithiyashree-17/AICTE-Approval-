import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { isRouteAllowedForRole, getRoleLandingRoute } from '@flowguard/shared';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    'change-this-to-a-secure-random-secret-for-jwt-and-session-signing-at-least-32-chars'
);

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api',
  '/_next',
  '/favicon.ico',
  '/logo.png',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/')) ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const sessionCookie = request.cookies.get('flowguard_session')?.value;

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Cryptographic signature verification with jose at Edge
  let payload: any;
  try {
    const verified = await jwtVerify(sessionCookie, JWT_SECRET);
    payload = verified.payload;
  } catch (err: any) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('flowguard_session');
    return response;
  }

  // 4. Role Authorization Check
  const userRole = (payload.primaryRole || payload.roles?.[0] || '') as string;
  if (!userRole) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if current route is allowed for the user's role
  const isAllowed = isRouteAllowedForRole(pathname, userRole);
  if (!isAllowed) {
    // Cross-role URL blocked: redirect to the user's canonical landing route
    const landingRoute = getRoleLandingRoute(userRole);
    return NextResponse.redirect(new URL(landingRoute, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
