# AGENTS.md

> This file helps AI coding assistants understand the project structure and conventions.

## Identity

| 项                  | 值                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| GitHub              | [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)                                                      |
| 产品显示名          | 西江月博客                                                                                                   |
| 本地路径 / npm name | `D:\projects\Chronicle` · package `"name": "chronicle"`（private）                                           |
| 生产                | https://incca.ccwu.cc                                                                                        |
| License             | MIT · `LICENSE` · Copyright 2026 雨天狂奔                                                                    |
| 作品集 GitHub 链接  | `data/projects.json`（公益API导航站 / 个人博客 / RelayCheck Desktop / Domain Check / QingHome / Hermes Hug） |

## Project Overview

A personal blog built with Next.js 16.3.8 (App Router), React 19.3, and Tailwind CSS 4. Content is authored in MDX, stored in `content/blog/`. Projects data is in `data/projects.json`. Production reads `generated/content-snapshot/` by default (`CONTENT_BACKEND=snapshot`); after editing MDX run `pnpm content:build` and commit the snapshot.

## 形态与栈（先读）

- **SSOT：** [`docs/PROJECT.md`](./docs/PROJECT.md) — 产品形态（个人博客 Web）+ 唯一技术栈 + 防漂移
- 实现分层：[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- 全局门闩：未定形态 / 栈未入档 → 禁业务编码（`~/.claude/specs/principle.md`「形态与技术栈」）
- 小修沿用本栈；换栈先 ADR + 改 PROJECT.md

## Tech Stack

- **Framework**: Next.js 16.3.8 (App Router; local-content driven, dynamic rendering for CSP nonce)
- **UI**: React 19.3, Tailwind CSS 4, BEM custom CSS
- **Content**: MDX with custom frontmatter parser (`lib/parse-frontmatter.ts`, js-yaml 4.x), next-mdx-remote
- **Syntax Highlighting**: Shiki via rehype-pretty-code
- **Search**: fuse.js, **client-side only** (`src/lib/search/` + `src/components/search/SearchPanel.tsx`); no `/api/search` since the 2026-10-07 rebuild
- **Testing**: Vitest (unit/integration), Playwright (E2E, 5 spec files) — 计数以实跑为准（`find src -name '*.test.ts*' | wc -l` · `find e2e -name '*.spec.ts' | wc -l`）；数字会漂，本行不写死
- **CI**: GitHub Actions (audit / format / lint / tsc / test / seo / build / bundle-budget / e2e); Node 24
- **Deployment**: Vercel

## Key APIs

- Use `next/font/local` for fonts (self-hosted; not CSS @font-face, not `next/font/google`) — see ADR-0008
- Use `next/og` `ImageResponse` for dynamic OG images
- Use `next/link` for navigation (supports `transitionTypes` prop)
- Use `Metadata` type for SEO metadata
- Use `MetadataRoute.Sitemap` / `MetadataRoute.Robots` for sitemap/robots

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── blog/[slug]/        # Blog post detail (with opengraph-image.tsx)
│   ├── projects/[id]/      # Project detail
│   ├── tags/[tag]/         # Tag archive
│   ├── series/[series]/    # Series archive
│   ├── about/              # About page
│   ├── styles/             # Semantic CSS modules (15 files; longest article-ui.css 668 lines)
│   │   ├── tokens.css      # Design tokens (light/dark theme vars, spacing, shadows)
│   │   ├── base.css        # Global base (skip-link, header, footer, not-found)
│   │   ├── components.css   # Generic layout and card components
│   │   ├── archive.css      # Archive grids/cards/lists (archive + categories + series layouts)
│   │   ├── controls.css     # CTA buttons, pagination, tag links, project card controls
│   │   ├── blog-ui.css     # Blog list, TOC, tag cloud, image zoom (blog/tags/categories)
│   │   ├── article-ui.css  # Article detail (blog/[slug]/layout)
│   │   ├── reading.css     # Reading prefs/actions + favorites list (blog/[slug] + favorites layouts)
│   │   ├── workspace.css   # App shell (TopBar + Sidebar + MainPanel) + shared section head
│   │   ├── backdrop.css    # Backdrop layer (body::before/after + .site-backdrop__stage)
│   │   ├── home.css        # Workspace home (page.tsx only)
│   │   ├── prose.css      # MDX typography (blog/[slug] + about layouts)
│   │   ├── project-detail.css # Project detail (projects/[id]/layout)
│   │   ├── animations.css # Animations (reveal, fade-in-up)
│   │   └── responsive.css  # Responsive breakpoints (loaded last, overrides above)
│   ├── globals.css         # CSS entry (Tailwind v4 only, ~12 lines, NO @import chain)
│   ├── layout.tsx          # Root layout (global CSS only; route CSS in segment layouts)
│   ├── manifest.ts         # PWA manifest (from site config)
│   ├── page.tsx            # Home page
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── robots.ts           # Robots.txt
│   └── error.tsx           # Error boundary (production-safe)
├── proxy.ts                # CSP headers (per-request)
├── components/
│   ├── blog/               # Blog-specific (BlogCard, CodeBlock, TOC, MdxContent, ReadingActions…)
│   ├── home/               # Home-only (WorkspaceHero, TopicCloud, ArticleList)
│   ├── search/             # SearchPanel (client Fuse island)
│   ├── layout/             # Header, Sidebar, NavLinks, Footer, PageSection, SiteBackdropStage/Parallax
│   ├── projects/           # ProjectCard
│   └── ui/                 # Reusable UI (ThemeToggle, MetaBadge, Card, BackToTop, DarkModeScript, JsonLd)
├── hooks/                  # React hooks (useInView, usePersistedEnum, usePrefersFinePointer, usePrefersReducedMotion)
├── lib/                    # Business logic
│   ├── posts/              # Post modules (schema, repository, query, wikilink + remark plugin)
│   ├── search/             # Client search contract (types, Fuse engine)
│   ├── content-snapshot/   # Snapshot backend (build/read/write/repository)
│   ├── schemas/            # Zod schemas (post-frontmatter)
│   ├── test-utils/         # Test fixtures (in-memory ContentSource)
│   ├── projects.ts         # Project data (uses createCache<T>, zod validation)
│   ├── tags.ts             # Tag management
│   ├── series.ts           # Series aggregation and routes
│   ├── categories.ts       # Category aggregation
│   ├── category-rules.ts   # Category inference helper
│   ├── category-rules-data.ts # TAG_TO_CATEGORY mapping
│   ├── about.ts            # About page content
│   ├── content-source.ts   # ContentSource interface (fs abstraction) + createPostRepository factory
│   ├── json-content-repository.ts # Shared JSON read/parse/cache repository factory
│   ├── parse-frontmatter.ts # MDX frontmatter parser (js-yaml 4.x, gray-matter parity)
│   ├── route-adapter.ts    # createDynamicRoute adapter for [slug|id|tag|category] routes
│   ├── metadata.ts         # SEO metadata helpers
│   ├── observability.ts    # Logging / telemetry helpers
│   ├── cache.ts            # createCache<T> utility + resetAllCaches() for test isolation
│   ├── storage.ts          # safeLocalStorage wrapper (SSR-safe)
│   ├── jsonld.ts           # JSON-LD structured data
│   ├── site.ts             # Site config and env-aware site URL
│   ├── content-dirs.ts     # Content file paths, Vercel tracing includes, and page size
│   └── utils.ts            # slugify, formatDate
└── types/                  # TypeScript types (PostMeta, PostFull, Project, TagInfo)
```

## Conventions

- **CSS**: BEM for structural components, Tailwind for utilities. See `docs/css-conventions.md`
- **CSS Module Loading**: ⚠️ Tailwind v4 `@tailwindcss/postcss` silently drops `@import "./styles/xxx.css"` in `globals.css`. Every CSS module MUST be explicitly imported from a root/segment `layout.tsx` or its owning `page.tsx`: global modules stay in the root layout (tokens → base → components → controls → backdrop → animations → workspace → responsive last); route-only `home`, `archive`, `blog-ui`, `article-ui`, `prose`, `reading`, and `project-detail` modules stay with their owning route. See `docs/specs/2026-06-29-css-import-fix-design.md`
- **shadcn Visual Composition**: Keep primitive shadcn-style components in `src/components/ui/` and page/archive composition helpers in `src/components/layout/`. Current shared pieces are `MetaBadge`, `ArchiveCard`, and `PageSection`. See `docs/specs/2026-07-04-shadcn-visual-architecture-design.md`
- **Background Architecture**: Three-layer separation — `body::before/after` (CSS pseudo-elements) + `<SiteBackdropStage />` (server-rendered decorative DOM) + `<SiteBackdropParallax />` (client component, returns null, only side effects). See `docs/specs/2026-06-29-site-backdrop-architecture-design.md`
- **Caching**: Use `createCache<T>` from `lib/cache.ts`. Use `resetAllCaches()` for test isolation. See `docs/cache-components-migration.md`
- **Testing**: Unit tests in `*.test.tsx` alongside components. E2E in `e2e/` directory
- **Security**: CSP headers via `src/proxy.ts` (per-request nonce). `layout.tsx` and JSON-LD scripts read `x-nonce` via `src/lib/csp.ts`, so routes render dynamically on demand. Security headers also live in `next.config.ts`. No remote images (`remotePatterns: []`)
- **Fonts**: `next/font/local` only (self-hosted; ADR-0008). CSS variables: `--font-noto-sans-sc`, `--font-jetbrains-mono`
- **SEO**: JSON-LD via `lib/jsonld.ts`. OG images via `opengraph-image.tsx` file convention
- **Site Config**: `SITE_CONFIG` lives in `src/lib/site.ts`; content paths, Vercel tracing includes, and `PAGE_SIZE` live in `src/lib/content-dirs.ts`

## Commands

```bash
pnpm dev          # Start dev server (port 3000; Turbopack)
pnpm build        # Generate RSS + production build; document routes are dynamic due CSP nonce
pnpm test         # Run unit/integration tests (测试数以实跑为准，不写死)
pnpm test:e2e     # Run E2E tests (5 spec files; auto-starts server on port 3001)
pnpm test:e2e:raw # Playwright raw (pass-through flags, e.g. --ui)
pnpm lint         # ESLint
pnpm check:docs   # Internal Markdown link check
pnpm check:seo    # SEO audit (tsx scripts/check-seo.ts)
pnpm check:ops-readiness # Deferred ops readiness (GSC/Bing/RUM/triggers; optional --live)
pnpm check:production-content # Production content smoke test against NEXT_PUBLIC_SITE_URL
pnpm analyze      # Bundle size analysis (ANALYZE=true next build)
tsc --noEmit      # TypeScript check
```

## E2E Testing Notes

- Playwright config uses port 3001 with `reuseExistingServer: true`
- To test against an already-running local server, set `PLAYWRIGHT_BASE_URL`, for example `pnpm exec cross-env PLAYWRIGHT_BASE_URL=http://localhost:7897 pnpm test:e2e`
- Blog card `::after` overlays can intercept clicks — use `focus()` + `keyboard.type()` for search inputs, `dispatchEvent('click')` for buttons, and `page.goto()` for navigation
- React hydration in dev mode requires waiting for `button[aria-label="切换主题"]` to have a `title` attribute
- Use `getByRole('heading', { name: '...', exact: true })` to avoid substring matches on Chinese headings

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to master:

1. **quality** — pnpm audit → format → check:docs → lint → test → tsc → generate-rss → build → bundle-budget
2. **bundle-analyze** — builds with analyzer, uploads report as artifact
3. **e2e** — installs Chromium, builds production once, then sequentially runs Playwright and Lighthouse CI (`lighthouse.config.js`)
4. **deploy** — Vercel production deploy + production content smoke test (needs quality + e2e; master push only)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
