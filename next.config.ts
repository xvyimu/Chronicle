import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';
import { CONTENT_TRACE_INCLUDES } from './src/lib/content-dirs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isDev = process.env.NODE_ENV === 'development';

/*
 * T3: Subresource Integrity (SRI) for /_next/static/* assets.
 *
 * Gated behind ENABLE_SRI so merging to master never turns it on in production.
 * Flip ENABLE_SRI=1 only on a preview branch/deploy to run the ADR verification
 * checklist (docs/adr/0005-sri-over-nonce-evaluation.md). Production enable
 * is a separate, explicitly-authorized change — not a side effect of this flag.
 *
 * Next 16.2.11 type: experimental.sri is `{ algorithm?: 'sha256'|'sha384'|'sha512' }`,
 * NOT a boolean. Omit the key entirely when disabled so the experiment is inert.
 */
const sriExperiment =
  process.env.ENABLE_SRI === '1' ? ({ sri: { algorithm: 'sha384' } } as const) : {};

// Fail fast if production URL is missing — SEO metadata, OG images,
// canonical URLs, RSS, sitemap, and JSON-LD must not point to localhost.
if (!isDev && !process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SITE_URL is required for production builds. Set it in Vercel project settings or .env.production.',
  );
}

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
  // CSP is set dynamically per-request in src/proxy.ts
];

const nextConfig: NextConfig = {
  /* React Compiler (stable in Next 16): automatic memoization, no manual useMemo needed.
     Requires babel-plugin-react-compiler (installed as devDependency). */
  reactCompiler: true,
  /*
   * NOTE (Next 16.3.5): `experimental.viewTransition` was removed — App Router now
   * enables React view transitions with no configuration (bundled docs:
   * node_modules/next/dist/docs/01-app/02-guides/view-transitions.md — "View
   * transitions work in the App Router with no configuration"). The old flag made
   * `tsc --noEmit` fail with TS2322 ("'viewTransition' does not exist in type
   * 'ExperimentalConfig'"). ThemeToggle's `document.startViewTransition()` is the
   * browser API and never depended on this flag.
   */
  experimental: {
    // Persist Turbopack's filesystem cache across dev sessions (Next 16.2).
    // Speeds up cold dev starts; no effect on production build.
    turbopackFileSystemCacheForDev: true,
    // SRI is spread in only when ENABLE_SRI=1 (see sriExperiment above).
    ...sriExperiment,
  },
  /*
   * The content repositories read local MDX/JSON files with fs at request time.
   * Vercel's serverless file tracing cannot infer those dynamic paths, so keep
   * them in every route bundle explicitly.
   */
  outputFileTracingIncludes: CONTENT_TRACE_INCLUDES,
  /*
   * 2026-10-10：作品集从 6 条精简到 1 条（chronicle），删掉的 5 条中
   * chrono-portal / chrono-relay / domain-check / qy-home / hermes-hug 的
   * `/projects/<id>` 都曾对外可达，旧外链与搜索引擎缓存仍会打过来。
   * permanent: false（307）而非 true —— 这是内容整理不是永久搬家，
   * 以后同 id 可能被重新占用，永久重定向会把它钉死在 /projects。
   */
  async redirects() {
    const retiredProjectIds = [
      'chrono-portal',
      'chrono-relay',
      'domain-check',
      'qy-home',
      'hermes-hug',
    ];

    return retiredProjectIds.map((id) => ({
      source: `/projects/${id}`,
      destination: '/projects',
      permanent: false,
    }));
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
     If remote images are added in the future, add specific hostnames here.

     `qualities` MUST enumerate every non-default value used by <Image quality={…}/>.
     Next 16 defaults to `[75]`; any other value triggers a build-time warn and,
     more importantly, the /_next/image optimizer rejects the request at runtime
     (q parameter validation), so the browser falls back to the raw source and
     LCP collapses. Keep this in sync with grep -rn 'quality={' src/.

     当前全仓没有 `<Image quality={...}>`（唯一命中是测试替身），故只列默认值 75。
     原先还列了 65/70，但没有任何调用方请求它们——留着会让人以为某处在用。 */
  images: {
    remotePatterns: [],
    qualities: [75],
  },
};

export default withBundleAnalyzer(nextConfig);
