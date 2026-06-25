import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy (replaces deprecated middleware) — generates per-request CSP nonce.
 *
 * Next.js automatically reads the `x-nonce` header and adds it to
 * all framework-generated <script> tags. Inline scripts in layout.tsx
 * also receive the nonce via the `headers()` API.
 *
 * This eliminates `script-src 'unsafe-inline'`, closing the XSS
 * injection vector while keeping Next.js hydration functional.
 */
export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  // In dev, skip CSP — Turbopack HMR needs inline scripts and websocket
  if (isDev) return NextResponse.next();

  // Generate cryptographically random nonce
  const nonce = btoa(crypto.randomUUID());

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://giscus.app`,
    // style-src keeps 'unsafe-inline' — Tailwind v4 injects inline styles
    // that are harder to nonce. Styles are lower risk than scripts for XSS.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self' https://giscus.app",
    "frame-src https://giscus.app",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // CSP goes on response only — setting it on request headers is unnecessary
  // and can cause double-processing in Next.js internals.
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.webmanifest
     * - public assets (*.png, *.svg, *.ico, *.xml, *.webp)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:png|svg|ico|xml|webp|jpg|jpeg|gif|txt|rss)$).*)',
  ],
};
