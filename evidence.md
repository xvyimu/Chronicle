# CH-PERF-003 · 首页 LCP evidence

Date: 2026-07-24  
Worktree: `ch-perf-cwv-home` · branch `xvyimu/ch-perf-cwv-home`  
Scope: `src/components/home/**`, `src/app/page.tsx`, hero blur-aware image mock (tests only)

## Changes

1. **EditorialHero LCP candidate** (`src/components/home/EditorialHero.tsx`)
   - `priority` + redundant `loading="eager"` → Next 16 `preload` + `fetchPriority="high"`
   - `sizes`: `(max-width: 1023px) 92vw, 420px` (aligns with home breakpoint where stage becomes 1-col)
   - `quality={70}` for smaller optimized bytes on hero screenshot
   - keep `fill` + `imageBlurProps(HERO_IMAGE)` (no new unsized image)
2. **Homepage first-paint client stack** (`src/app/page.tsx`)
   - remove 5× `RevealOnScroll` islands from below-fold sections (server-only sections now)
   - drop `ProjectCard priority={index < 2}` so below-fold project images do not preload against hero LCP
3. **Tests**
   - mock `next/image` accepts `preload` / `fetchPriority`
   - EditorialHero asserts LCP preload markers

## Commands

| Command | Exit |
| ------- | ---- |
| `pnpm typecheck` | **0** |
| `pnpm test` | **0** (95 files · **717** tests) |
| `pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` | **0** |

Node note: local engine warning `wanted 22.x / current v24.16.0` (WARN only; CI targets 22).

## Lighthouse

Not re-run in this worktree (no new LH numbers). Prior mobile lab baseline for `/` remains in `docs/performance-baseline.md` (2026-07-17). Optional follow-up: desktop/mobile LH on `/` after deploy preview.

## Residual (one line)

**CH-PERF-006**: optional reintroduction of deferred scroll-reveal (or other non-critical client islands) without competing with hero LCP; **CH-PERF-009**: source hero asset weight / formats beyond next/image quality if field LCP still high.
