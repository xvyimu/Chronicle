import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // HSTS: force HTTPS for 1 year, include subdomains
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // CSP: only in production — dev needs Turbopack HMR websocket
  ...(isDev ? [] : [{
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://giscus.app",
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
    ].join('; '),
  }]),
];

const nextConfig: NextConfig = {
  /* Enable View Transitions API (experimental) */
  experimental: {
    viewTransition: true,
  },
  /* Security headers */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  /* Image optimization: all images are local — no remote patterns needed.
     If remote images are added in the future, add specific hostnames here. */
  images: {
    remotePatterns: [],
  },
};

export default withBundleAnalyzer(nextConfig);
