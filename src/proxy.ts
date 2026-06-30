import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy (replaces deprecated middleware) — sets per-request CSP headers.
 *
 * Dark mode script moved from inline <script nonce> in layout.tsx
 * to a client component (DarkModeScript), eliminating the need for
 * headers() in root layout — allowing all pages to SSG.
 *
 * Since layout no longer uses nonce, CSP script-src uses 'self' only.
 * Giscus iframe scripts are handled by frame-src + connect-src allowances.
 */
export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  // In dev, skip CSP — Turbopack HMR needs inline scripts and websocket
  if (isDev) return NextResponse.next();

  const csp = [
    "default-src 'self'",
    "script-src 'self' https://giscus.app",
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

  const response = NextResponse.next();

  // CSP goes on response only
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
