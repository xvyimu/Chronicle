# ADR 0001 — CSP per-request nonce vs SSG

- **Status**: Superseded by `2026-07-17-csp-nonce-over-ssg.md`
- **Date**: 2026-06-29
- **Supersedes**: none
- **Superseded by**: `2026-07-17-csp-nonce-over-ssg.md`
- **Related**: `src/proxy.ts`, `src/app/layout.tsx`, `next.config.ts`

## Context

The blog enforces a strict Content-Security-Policy to eliminate the inline-script XSS vector. The mechanism is:

1. `src/proxy.ts` (Next.js 16+ renamed middleware) generates a cryptographically random nonce per request via `btoa(crypto.randomUUID())`.
2. The nonce is attached to the outgoing response as `Content-Security-Policy: ... 'nonce-<value>' ...` and forwarded to the layout via the `x-nonce` request header.
3. `src/app/layout.tsx` is an `async` function that calls `await headers()` to read the nonce, then injects it into the inline theme-detection script via `<script nonce={nonce}>`.

**Verified (2026-06-29)** by running `pnpm build && pnpm start` on port 3456 and inspecting response headers:

```
content-security-policy: default-src 'self';
  script-src 'self' 'nonce-YTc1M2RmNTAtMDU1MC00MGM5LThhNjEtZDI1NTI1NWMxYjBi'
    https://giscus.app;
  style-src 'self' 'unsafe-inline'; ...
```

The CSP and per-request nonce are correctly delivered. `proxy.ts` is **not** dead code — Next.js 16+ officially renamed `middleware.ts` to `proxy.ts`, and the build output confirms `ƒ Proxy (Middleware)` is recognized.

### The trade-off

Because `RootLayout` calls `await headers()`, Next.js opts every route into **dynamic rendering**. The build output marks all routes with `ƒ` (Dynamic) — including `/about`, `/blog`, `/projects`, `/projects/[id]`, `/tags/[tag]` which conceptually should be static (their data sources are local MDX + JSON with no per-request variance).

## Decision

**Accept dynamic rendering** (current state). Do not externalize the theme-init script to a static asset.

Rationale:

1. **Security benefit is real.** Nonce-protected inline scripts close the XSS injection vector that `'unsafe-inline'` leaves open. The theme-init script reads `localStorage` and toggles a class on `<html>` — replacing it with a same-origin static file is technically safe but loses the uniform "every inline script must carry a nonce" guarantee that future contributors can rely on.
2. **Perf cost is negligible.** Lighthouse CI baseline (2026-06-29, desktop preset, 5 pages × 2 runs):
   - TBT: 0–3 ms (well under 300 ms budget)
   - LCP: 1142–1877 ms (well under 3500 ms budget)
   - Performance score: 0.83–0.97
   - The dynamic render path does not show up as a bottleneck because the data layer (`posts.ts`, `projects.ts`) is cached in-memory via `createCache<T>` and the route handlers do no I/O on the hot path.
3. **Vercel mitigates residual cost.** Deployments run on Vercel's edge network; dynamic rendering is served from the closest region with an already-warm Lambda.
4. **Alternative (externalize script) introduces new risks.** Moving theme detection to `/theme-init.js` as a static asset:
   - Adds a render-blocking or async script request before first paint → reintroduces FOUC (flash of unstyled content) on dark-mode users.
   - Requires either `display: block` until script loads (visible flash) or `display: none` until script loads (delayed first paint).
   - The static file would still need to be excluded from CSP `script-src` restrictions or listed under `'self'` — feasible, but loses the per-request rotation property.

## Consequences

### Positive

- CSP nonce rotates per request → defeats reflected/stored XSS that depends on injecting inline scripts.
- Inline theme-init script runs synchronously in `<head>` before React hydration → no FOUC, no flash.
- Single code path for all routes (no per-route opt-in/out of CSP).
- Future contributors can add any inline script by passing `nonce={nonce}` — no special configuration.

### Negative

- All routes render dynamically → no static HTML files in `.next/server/app/`.
- `next build` does not pre-render HTML to disk; pages are rendered on-demand at runtime.
- Slightly higher runtime CPU cost per request (negligible given cache hit ratio).
- Cannot use `generateStaticParams` + `export const dynamic = 'force-static'` to pre-render dynamic routes at build time. (We don't currently — `blog/[slug]` etc. rely on dynamic rendering by default, which works fine.)

### Neutral

- This decision is reversible. If SSG becomes a hard requirement (e.g., for self-hosting on a static-file server), the theme-init script can be externalized in a focused PR. The seam is small: one `<script>` block in `layout.tsx`.

## Alternatives considered

### B. Externalize theme-init script to `/public/theme-init.js`

- Reference via `<script src="/theme-init.js" defer></script>` in `<head>`.
- Restores SSG for all routes.
- Loses per-request nonce on that script (still `'self'`-allowed under CSP, but not nonce-protected).
- Introduces FOUC risk unless paired with `<html style="visibility: hidden">` + reveal-on-load — adds complexity.

**Rejected** because the perf benefit (SSG) is not measurable in current Lighthouse baselines and the FOUC risk is real for dark-mode users.

### C. Use Next.js `generateStaticParams` + opt routes back to static, keep CSP for dynamic routes only

- Would require splitting routes into static (no nonce) and dynamic (with nonce) sets.
- Static routes would lose CSP entirely or fall back to `'unsafe-inline'`.
- Adds configuration surface and mental model cost.

**Rejected** as uneven security posture — the CSP contract should be uniform across the site.

## References

- [Next.js 16 — Proxy (renamed from middleware)](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Content Security Policy Level 3 — nonce](https://www.w3.org/TR/CSP3/#security-nonces)
- `src/proxy.ts` — CSP nonce generation
- `src/app/layout.tsx` — nonce consumption
- `docs/performance-baseline.md` — Lighthouse CI baseline confirming negligible perf cost
