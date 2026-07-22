# ADR: Evaluate Subresource Integrity (SRI) alongside CSP nonce

- Status: **Accepted (enabled in production via `ENABLE_SRI=1`)**
- Date: 2026-07-21
- Updated: 2026-07-22 (production enable authorized; Vercel Production env `ENABLE_SRI=1`; deploy `dpl_2EcxgkhP84U7jE3BuQAnFipef6DD`; homepage `/_next/static` scripts carry `integrity="sha384-…"` while CSP nonce retained)
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

**Enable SRI in production** behind the existing `ENABLE_SRI=1` env gate (`experimental.sri: { algorithm: 'sha384' }`), while **keeping** the CSP nonce model. SRI and nonce remain complementary:

1. **No conflict with current CSP nonce model.** SRI targets `/_next/static/*` resources; nonce targets inline + allowlisted scripts. They operate on disjoint surfaces.
2. **Defence-in-depth accepted.** Vercel edge already signs deploys; SRI adds browser-side verification of static chunks against build-time hashes.
3. **Experimental risk accepted with rollback.** Next 16.2 SRI is still experimental; rollback is unset/remove Production `ENABLE_SRI` and redeploy (no code revert required).
4. **Cost accepted.** Slightly larger HTML (`integrity` attrs) and hash work at build time.

### Production evidence (2026-07-22)

| Check                          | Result                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Vercel Production `ENABLE_SRI` | set to `1`                                                                                                 |
| Deploy                         | `dpl_2EcxgkhP84U7jE3BuQAnFipef6DD` · build log shows `Experiments · sri` · aliased `https://incca.ccwu.cc` |
| HTML `/_next/static` scripts   | multiple `integrity="sha384-…"` (sample verified via HTTP + Playwright)                                    |
| CSP                            | still per-request `nonce-…` + `strict-dynamic` + `report-to`/`report-uri`                                  |
| Preview                        | same flag on Preview; earlier preview deploy also logged `· sri`                                           |

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

Before enabling in production, run on a **preview branch / Vercel Preview env**
(not production `master` env). Do **not** set `ENABLE_SRI` on production until
this checklist is green and the user explicitly authorizes a separate enable PR
or Vercel Production env flip.

### Operator checklist (copy/paste)

| #   | Step                                 | Pass criteria                                                                                                      | Owner         |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------- |
| 0   | Branch from current master           | clean working tree                                                                                                 | agent/user    |
| 1   | Local SRI-on build                   | `integrity="sha384-…"` present under `.next`                                                                       | agent         |
| 2   | Local SRI-off build                  | **zero** `integrity=` under `.next`                                                                                | agent         |
| 3   | CSP / unit gates                     | `pnpm check:seo` + `pnpm test` green; CSP still nonce + no `unsafe-inline` for scripts                             | agent         |
| 4   | Bundle budget                        | `pnpm exec tsx scripts/check-bundle-budget.ts` within budget                                                       | agent         |
| 5   | E2E                                  | `pnpm test:e2e` green with SRI-on preview build if practical                                                       | agent         |
| 6   | Vercel **Preview** env               | set `ENABLE_SRI=1` **only** on Preview (not Production); deploy preview URL                                        | **user auth** |
| 7   | Browser DevTools on preview          | `<script>` / CSS links for `/_next/static/*` show `integrity`; document CSP still has nonce/`strict-dynamic`       | user/agent    |
| 8   | Optional tamper smoke (preview only) | alter a static chunk hash in DevTools → browser blocks; never on production                                        | user/agent    |
| 9   | CSP report noise                     | `/api/csp-report` does not flood from legitimate SRI loads                                                         | agent         |
| 10  | Production enable                    | **separate** authorization: Production env `ENABLE_SRI=1` **or** dedicated PR + deploy; update this ADR → Accepted | **user**      |

### Commands (PowerShell)

```powershell
# 1) SRI on — production-shaped local build (do not commit polluted feeds)
$env:NEXT_PUBLIC_SITE_URL = 'https://incca.ccwu.cc'
$env:ENABLE_SRI = '1'
pnpm build
rg -n "integrity=" .next -g "*.html"
Remove-Item Env:\ENABLE_SRI

# 2) SRI off control
$env:NEXT_PUBLIC_SITE_URL = 'https://incca.ccwu.cc'
pnpm build
# expect: no integrity= hits

# 3–5) gates
pnpm check:seo
pnpm test
pnpm exec tsx scripts/check-bundle-budget.ts
pnpm test:e2e
```

### Vercel Preview only (blocked without user auth)

1. Vercel Project → Settings → Environment Variables
2. Add `ENABLE_SRI=1` scoped to **Preview** (not Production, not Development unless intentional)
3. Redeploy a preview deployment from a non-master branch or Preview rebuild
4. Open preview URL → View Source / DevTools → confirm `integrity=` on static assets
5. Confirm Production still has **no** `ENABLE_SRI` until step 10

If any step regresses, abandon the enable attempt and record the failure here. After a successful preview, update this ADR Status to Accepted (enable prod) or keep Evaluation with notes.

## Local prep status (2026-07-22)

| Step                            | Status                                                                   |
| ------------------------------- | ------------------------------------------------------------------------ |
| Types verified in Next 16.2.9   | Done — `sri?: { algorithm?: … }`                                         |
| Flag mechanism landed           | Done — `ENABLE_SRI=1` gates `sri: { algorithm: 'sha384' }`               |
| Local on/off trial              | Done                                                                     |
| Vercel Preview `ENABLE_SRI`     | Done — Preview env set; preview deploy logged `Experiments · sri`        |
| Vercel Production `ENABLE_SRI`  | **Done** — Production env set; deploy `dpl_2EcxgkhP84U7jE3BuQAnFipef6DD` |
| Production HTML integrity check | **Done** — homepage 6/13 `/_next/static` scripts with `sha384-…`         |
| CSP nonce retained              | **Done** — still `nonce-…` + `strict-dynamic` + report endpoints         |

### T3 gating mechanism

SRI is wired through an env flag in `next.config.ts`. Code default remains off;
Production/Preview enablement is **env-only** (no master code flip required):

```ts
const sriExperiment =
  process.env.ENABLE_SRI === '1' ? ({ sri: { algorithm: 'sha384' } } as const) : {};
// experimental: { ...sriExperiment }  — key omitted entirely when off
```

**Rollback:** remove Production `ENABLE_SRI` (or set ≠ `1`) and redeploy.

## Alternatives considered

1. **Keep Evaluation forever.** Rejected after user authorization + green production deploy with verified `integrity=` + retained nonce CSP.
2. **SRI + drop nonce for `unsafe-inline`.** Rejected: would weaken the existing XSS baseline (see `2026-07-17-csp-nonce-over-ssg.md`).
3. **Do nothing, never evaluate.** Rejected: Next 16.2 SRI is a meaningful new capability worth recording so future maintainers do not re-research from scratch.

## Consequences

- Production static assets from `/_next/static/*` now include SRI `integrity` hashes when built with `ENABLE_SRI=1`.
- CSP nonce model is unchanged; both layers run together.
- Rollback is env-only (remove Production `ENABLE_SRI` + redeploy), no code revert required.
- Concept explainer for humans: `/blog/csp-nonce-and-sri`.
