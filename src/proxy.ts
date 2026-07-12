import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy — sets per-request CSP headers.
 *
 * Next's App Router emits inline hydration payload scripts in production.
 * A strict CSP therefore needs a per-request nonce that is forwarded to
 * the request and response. Root layout reads x-nonce and applies it to
 * project-owned inline scripts; Next applies it to framework scripts.
 *
 * Vercel Analytics / Speed Insights load scripts from va.vercel-scripts.com
 * (debug) and same-origin /_vercel/* in production; connect stays 'self'.
 */
export function proxy(_request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  // In dev, skip CSP — Turbopack HMR needs inline scripts and websocket
  if (isDev) return NextResponse.next();

  const nonce = btoa(crypto.randomUUID());
  const csp = [
    "default-src 'self'",
    // strict-dynamic trusts nonce-tagged scripts; allow Vercel + Giscus hosts for their loaders
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://giscus.app https://va.vercel-scripts.com`,
    // style-src keeps 'unsafe-inline' — Tailwind v4 injects inline styles
    // that are harder to nonce. Styles are lower risk than scripts for XSS.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    // Analytics/vitals POST to same-origin /_vercel/*; Giscus API as needed
    "connect-src 'self' https://giscus.app",
    'frame-src https://giscus.app',
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  const requestHeaders = new Headers(_request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

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
