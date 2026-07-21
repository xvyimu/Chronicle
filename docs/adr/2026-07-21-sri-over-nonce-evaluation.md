# ADR: Evaluate Subresource Integrity (SRI) alongside CSP nonce

- Status: Evaluation (not yet enabled in production)
- Date: 2026-07-21
- Updated: 2026-07-21 (T3 — `ENABLE_SRI` env gate added; local on/off trial verified; no production enable)
- Related: `docs/adr/2026-07-17-csp-nonce-over-ssg.md`, `next.config.ts`, `src/proxy.ts`, `docs/architecture-optimization-research-2026-07-21-v3.md` R-E, `content/blog/2026-07-csp-nonce-and-sri.mdx`

## Context

Next.js 16.2 introduced experimental Subresource Integrity (SRI) support for static assets emitted to `/_next/static/*`. SRI adds an `integrity` attribute (SHA hash) to `<script>` and `<link rel="stylesheet">` tags so browsers refuse to execute resources whose hash mismatches, defending against CDN or build-cache tampering.

The project currently uses a strict per-request CSP nonce model (see `2026-07-17-csp-nonce-over-ssg.md`): document routes render dynamically, `script-src 'nonce-...' 'strict-dynamic'` gates inline hydration scripts, and static assets are independently cacheable at the edge. This model gives a strong XSS baseline but does not verify static asset integrity at the browser level.

### SRI vs nonce, complementary not substitutive

| Concern                 | CSP nonce                          | SRI                                     |
| ----------------------- | ---------------------------------- | --------------------------------------- |
| Inline script injection | Blocked (nonce required)           | N/A (inline scripts are not SRI-scoped) |
| External script tamper  | Allowed if nonce/allowlist present | Blocked if hash mismatches              |
| Stylesheet tamper       | Covered by `style-src` policy      | Blocked if hash mismatches              |
| Build-cache poisoning   | Not covered                        | Covered (hash is per-build)             |
| CDN tamper              | Not covered                        | Covered                                 |

SRI does **not** replace nonce CSP; it adds a layer for static resources that nonce CSP does not cover.

## Decision

**Evaluation only.** Do not enable `experimental.sri` in production yet. SRI is recorded as a condition-triggered candidate with the following assessment:

1. **No conflict with current CSP nonce model.** SRI targets `/_next/static/*` resources; nonce targets inline + allowlisted scripts. They operate on disjoint surfaces.
2. **Marginal additional benefit at current scale.** The site runs on Vercel's managed edge (TLS-terminated, signed deploys). CDN tamper risk is low. The primary XSS defense remains nonce CSP.
3. **Experimental status carries regression risk.** Next 16.2 SRI is flagged experimental; enabling it in production would require a full Lighthouse + bundle + e2e regression pass and a rollback path.
4. **Cost is non-trivial.** Build time increases (hash computation for every chunk), HTML payload grows (`integrity` attributes on every script/link tag), and the benefit is defence-in-depth rather than user-visible.

## Config shape (Next 16.2.9, verified in `config-shared.d.ts`)

```ts
// CORRECT — object with optional algorithm
experimental: {
  sri: {
    algorithm?: 'sha256' | 'sha384' | 'sha512'; // default implementation-defined; prefer sha384
  };
}

// WRONG — boolean is NOT the type of experimental.sri in 16.2.9
// experimental: { sri: true }
```

Do not copy older blog posts or untyped snippets that say `sri: true` without checking the installed Next types.

## Trigger conditions for re-evaluation

Revisit this ADR and move toward enabling SRI when **any** of the following becomes true:

- Next.js promotes SRI from `experimental` to stable (check release notes).
- A security audit or compliance requirement mandates static resource integrity verification.
- The site moves to a multi-CDN or self-hosted static asset origin where tamper risk is higher.
- Evidence of build-cache or CDN-level script tampering emerges.

## Preview verification checklist (when triggered)

Before enabling in production, run on a **preview branch** (not `master`):

1. **Enable the flag** — no manual `next.config.ts` edit needed. As of T3
   (`feat/t3-csp-report-sri-preview`) the flag is env-gated: `next.config.ts`
   spreads `sri: { algorithm: 'sha384' }` into `experimental` **only** when
   `ENABLE_SRI=1`. Merging to `master` never enables it — CI/production build
   with the var unset. Set it just for the trial build/preview deploy.

2. **Production-shaped local build** (never commit feed pollution from localhost):

   ```bash
   # PowerShell — flag on for this build only
   $env:NEXT_PUBLIC_SITE_URL = 'https://incca.ccwu.cc'
   $env:ENABLE_SRI = '1'
   pnpm build
   # search build output / .next for integrity=
   rg -n "integrity=" .next -g "*.html"
   Remove-Item Env:\ENABLE_SRI   # leave the flag off afterwards
   ```

3. **CSP regression** — document routes still emit per-request nonce; no `unsafe-inline` introduced:

   ```bash
   pnpm check:seo
   pnpm test
   ```

4. **Bundle budget**:

   ```bash
   pnpm exec tsx scripts/check-bundle-budget.ts
   ```

5. **E2E**:

   ```bash
   pnpm test:e2e
   ```

6. **Deploy Vercel preview** (requires explicit user auth) and verify in browser DevTools that script tags carry `integrity` and CSP still has nonce. Simulate tamper only in preview (never production).

If any step regresses, abandon the branch and record the failure here. After a successful preview, update this ADR Status to Accepted (enable prod) or keep Evaluation with notes.

## Local prep status (2026-07-21, updated T3)

| Step                             | Status                                                            |
| -------------------------------- | ----------------------------------------------------------------- |
| Types verified in Next 16.2.9    | Done — `sri?: { algorithm?: … }`                                  |
| ADR checklist corrected          | Done (this file)                                                  |
| Flag mechanism landed            | Done — `ENABLE_SRI=1` gates `sri: { algorithm: 'sha384' }`        |
| Production config changed        | **No** — flag defaults off; master/CI build emits no `integrity=` |
| Local build with SRI on (trial)  | Done — `ENABLE_SRI=1 pnpm build` emitted `integrity="sha384-…"`   |
| Local build with SRI off (trial) | Done — default build emits **zero** `integrity=` in `.next`       |
| Vercel preview deploy            | **Blocked** — no deploy authorization                             |

### T3 gating mechanism

SRI is wired through an env flag in `next.config.ts` so a `master` merge can never
turn it on:

```ts
const sriEnabled = process.env.ENABLE_SRI === '1';
const sriExperiment = sriEnabled ? ({ sri: { algorithm: 'sha384' } } as const) : {};
// experimental: { ...sriExperiment }  — key omitted entirely when off
```

Local trial evidence (production-shaped `NEXT_PUBLIC_SITE_URL`):

- `ENABLE_SRI=1 pnpm build` → chunks carry `integrity="sha384-…"` (verified via `rg integrity= .next`).
- default `pnpm build` → no `integrity=` attributes anywhere in `.next`.

Production enable remains a **separate, explicitly-authorized PR** — setting the flag
on a Vercel preview environment first, running steps 3–6, then flipping master only
after a clean preview.

## Alternatives considered

1. **Enable SRI now (experimental).** Rejected: experimental flag in production violates the "stability > functionality" principle; no current threat model justifies the regression surface.
2. **SRI + drop nonce for `unsafe-inline`.** Rejected: would weaken the existing XSS baseline (see `2026-07-17-csp-nonce-over-ssg.md`).
3. **Do nothing, never evaluate.** Rejected: Next 16.2 SRI is a meaningful new capability worth recording so future maintainers do not re-research from scratch.

## Consequences

- SRI remains documented but disabled. No production behavior change.
- Future maintainers can fast-track to preview verification when a trigger condition fires.
- This ADR should be updated (status to Accepted or Rejected) once a preview run completes.
- Concept explainer for humans: `/blog/csp-nonce-and-sri`.
