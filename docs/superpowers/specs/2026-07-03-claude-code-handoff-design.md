# Claude Code Handoff Readiness Design

> Date: 2026-07-03
> Project: `D:\blog`
> Purpose: make the current repository safe and easy for Claude Code to continue.
> Status: implemented. This document preserves the original design snapshot; current handoff state lives in `docs/handoff-to-agent.md`.

## 1. Goal

Create a practical handoff path for Claude Code before any more product work. The handoff should help the next agent understand the dirty worktree, identify the real blockers, continue the SalesDex-inspired visual direction, and then repair known stability issues without disturbing unrelated user changes.

This is not a full architecture encyclopedia. It is a working playbook for the next coding session.

## 2. Current State

The repository is on `master...origin/master` with a large uncommitted worktree. The changes include infrastructure, docs, App Router pages, CSS modules, home components, blog components, data repositories, tests, E2E specs, and generated feeds. Claude Code must treat all existing changes as user or prior-agent work and must not revert them.

Existing docs say previous validation passed:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm check:seo`
- `pnpm build`
- `pnpm test:e2e`

That historical green state is useful but not sufficient. A later review found defects and test gaps that should be fixed before pushing or merging.

## 3. Handoff Entry Sequence

Claude Code should start with this order:

1. Read `AGENTS.md`.
2. Read `docs/handoff-to-agent.md`.
3. Read `docs/salesdex-inspired-redesign.md`.
4. Read `TODO.md`.
5. Read this document.
6. Run `git status --short --branch`.
7. Inspect only the files involved in the next task before editing.
8. Preserve unrelated dirty files.

If using the user's runtime rules, prefer `rtk` for shell commands.

## 4. Immediate Defects To Fix

These are the first stability fixes after the handoff is accepted.

### 4.1 Blog Pagination

Problem: `src/app/blog/page.tsx` always calls `getPaginatedPosts(1, PAGE_SIZE)`, while `src/components/blog/Pagination.tsx` generates `?page=2` links. Visiting or clicking `/blog?page=2` changes the URL but still renders the first page.

Expected design:

- Accept `searchParams` in the App Router page.
- Parse `page` defensively.
- Pass the parsed page to `getPaginatedPosts`.
- Keep invalid, negative, and out-of-range values clamped by existing pagination logic.
- Add a unit or integration test that renders page 2.
- Strengthen E2E to assert that page 2 content differs from page 1, not just that the URL changes.

### 4.2 LoadingIntro Fallback

Problem: `src/components/home/LoadingIntro.tsx` reads `requestIdleCallback` directly. Browsers without that global can throw `ReferenceError` before the fallback runs.

Expected design:

- Check support through `window.requestIdleCallback` or `typeof requestIdleCallback`.
- Fall back to `setTimeout`.
- Clean up pending timers or idle callbacks on unmount if needed.
- Add a test where `requestIdleCallback` is absent.

### 4.3 Category Consistency

Problem: `src/lib/posts/repository.ts` normalizes `post.category` from explicit frontmatter or inferred tags, but `src/lib/categories.ts` ignores `post.category` and recomputes `inferCategory(post.tags)`. Explicit categories can appear on article cards/details while missing from category pages, sitemap, and SEO checks.

Expected design:

- Make category aggregation and filtering use `post.category` as the source of truth.
- Continue collecting mapped tags for display when available.
- Add tests with an in-memory post that has explicit `category` and empty or unmapped tags.

### 4.4 Article Metadata Badges

Problem: `src/app/blog/[slug]/page.tsx` wraps series, category, and tags badges in `post.tags.length > 0`. Posts with `series` or `category` but no tags hide those badges.

Expected design:

- Render the badge container when any of `post.series`, `category`, or `post.tags.length` exists.
- Keep current tag rendering unchanged.
- Add a focused test for category or series without tags.

## 5. Visual Experience Direction

After the handoff and stability fixes are understood, continue the visual work in this order.

### 5.1 Navigation Page

The `/links` page should become the next visual priority. It is now part of the personal collection system and should feel like a useful workbench, not a marketing page.

Design direction:

- Keep dense, scan-friendly groups.
- Improve category wayfinding.
- Add better contrast between official links, docs, VPS, self-hosted tools, and AI resources.
- Avoid more hero animation. The page should be practical.

### 5.2 Blog List

The blog list should support discovery better.

Design direction:

- Keep search prominent.
- Make pagination behavior correct first.
- Improve visual hierarchy between featured posts, series, category, and tag chips.
- Consider a compact filter strip only if it uses existing tag/category data.

### 5.3 Article Detail

Article detail should remain reading-first.

Design direction:

- Keep reading preferences, TOC, related posts, and series path.
- Fix metadata badge rendering first.
- Do not add heavy motion inside article content.
- Improve comments verification before changing Giscus behavior.

### 5.4 Mobile Experience

Mobile should be audited as a first-class target.

Design direction:

- Add a mobile Playwright project or a small mobile E2E suite.
- Cover header open/close behavior, search, article page, and links page.
- Consider Escape close, focus management, and scroll lock for the mobile menu.

## 6. Verification Plan

After implementation, run the checks in this order:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm check:seo
pnpm build
pnpm test:e2e
```

For targeted work, run narrower tests first:

```bash
pnpm test -- src/app/blog/page.test.tsx
pnpm test -- src/components/home/LoadingIntro.test.tsx
pnpm test -- src/lib/categories.test.ts
pnpm test -- src/app/blog/[slug]/page.test.tsx
pnpm test:e2e -- e2e/blog.spec.ts
```

The full verification story should be recorded before any push.

## 7. Caution Zones

Claude Code must avoid accidental churn in these areas:

- Do not reorder CSS imports in `src/app/layout.tsx` unless fixing a CSS loading issue.
- Do not collapse the three-layer backdrop architecture without a new design.
- Do not loosen CSP in `src/proxy.ts` without testing production build behavior.
- Do not edit generated `public/feed.xml` or `public/feed.json` manually; regenerate through the build script.
- Do not revert unrelated dirty files.
- Do not assume the historical "all green" statement means the reviewed code has no defects.

## 8. Done Criteria

The handoff is ready when:

- This design is reviewed and accepted.
- `docs/handoff-to-agent.md` is updated or cross-linked with the known defect list.
- `TODO.md` reflects the new Phase order: handoff readiness, visual direction, stability repair.
- Stability fixes have tests before push.
- Full verification passes or any failure is documented with exact command output and next step.

## 9. Implementation Boundary

This document only defines the handoff and next direction. It does not implement fixes. After review approval, the next step is to create an implementation plan and then apply changes in small batches.
