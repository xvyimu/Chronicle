# CH-PERF-007 · /links 客户端全量目录 — evidence

**Date:** 2026-07-24  
**Branch:** `xvyimu/ch-perf-links`  
**Scope:** `src/app/links/**`, `src/components/links/**`, `src/lib/links.ts` (+ CSS `links.css`)

## Problem

`/links` rendered the full 10-category / 123-link directory as a single `'use client'` tree. Every card used `MagneticCard` (pointer listeners + rAF), so first paint paid for hydrating ~123 interactive cards even when the user only needed to read or jump via category chips.

## Change

| Layer      | Before                           | After                                                      |
| ---------- | -------------------------------- | ---------------------------------------------------------- |
| Shell      | Client-only `LinksDirectory`     | Server `LinksDirectory` (metrics + nav + catalog)          |
| Search     | Same client component as catalog | `LinksDirectoryClient` island only                         |
| Cards      | `MagneticCard` per item          | Static `LinkCard` (server-safe `<li>` + CSS hover)         |
| Filter     | Inline `useMemo` in client tree  | Pure helpers in `src/lib/links.ts` + `useDeferredValue`    |
| Off-screen | Full layout for all sections     | `content-visibility: auto` on `.links-directory__category` |

### Files

- `src/components/links/LinksDirectory.tsx` — server shell
- `src/components/links/LinksDirectoryClient.tsx` — search/filter island; unfiltered SSR catalog as `children`
- `src/components/links/LinksCatalog.tsx` — category sections
- `src/components/links/LinkCard.tsx` — presentational card
- `src/lib/links-filter.ts` — client-safe pure helpers (`getLinkHost`, filter, count)
- `src/lib/links.ts` — repository + re-export helpers (no client import of fs path)
- `src/app/styles/links.css` — content-visibility
- `src/app/links/page.tsx` — comment only
- tests: `src/lib/links.test.ts` filter helpers

### First-paint story (narrative)

1. HTML still ships **all 123 links** (SEO, no-JS, jump links `#category` work).
2. Client JS for the directory is **search + filter only**, not 123 magnetic cards.
3. Below-fold category sections can skip layout/paint until near the viewport via `content-visibility`.
4. Filtering still covers title / host / tags / useCase / priority / official (same keyword surface as before).

## Verification

| Command                                                 | Result                                 |
| ------------------------------------------------------- | -------------------------------------- |
| `pnpm typecheck`                                        | exit 0                                 |
| `pnpm test`                                             | **719** passed / 95 files (full suite) |
| `vitest` links slice                                    | 39 passed                              |
| `NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` | exit 0; `/links` dynamic ƒ             |

### Manual acceptance

- [x] ≥123 curated links still loadable via page tests
- [x] Filter by keyword; clear restores full catalog
- [x] Empty filter state copy + empty-match empty state
- [x] External links keep `target="_blank"` + `rel="noopener noreferrer"`
- [x] Category nav `#id` anchors remain

## Out of scope (per task bound)

- No push
- No `data/links.json` schema change
- No new virtualization dependency (`react-window` / virtuoso)
- MagneticCard retained for blog/project cards elsewhere
