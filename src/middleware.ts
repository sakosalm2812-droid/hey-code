import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isOnAuth = ['/signin', '/signup', '/forgot-password', '/reset-password', '/verify', '/verify-request'].includes(req.nextUrl.pathname);
  const isOnApi = req.nextUrl.pathname.startsWith('/api');
  const isPublicApi = req.nextUrl.pathname.startsWith('/api/auth') || 
                      req.nextUrl.pathname.startsWith('/api/push') ||
                      req.nextUrl.pathname.startsWith('/api/stripe/webhook') ||
                      req.nextUrl.pathname.startsWith('/api/health') ||
                      req.nextUrl.pathname.startsWith('/api/openapi.json');

  // Redirect unauthenticated users from dashboard
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/signin', req.nextUrl));
  }

  // Redirect authenticated users from auth pages (except verify/reset)
  if (isOnAuth && isLoggedIn && 
      !req.nextUrl.pathname.includes('verify') && 
      !req.nextUrl.pathname.includes('reset-password')) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Protect API routes
  if (isOnApi && !isPublicApi && !isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.next();

  // Add security headers
  securityHeaders.forEach((header) => {
    response.headers.set(header.key, header.value);
  });

  // Add CSP for non-API routes
  if (!isOnApi) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.stripe.com https://api.openai.com https://api.anthropic.com https://*.sentry.io wss:",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    );
  }

  return response;
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify',
    '/verify-request',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|icon-*.png|og-image.png).*)',
  ],
};
