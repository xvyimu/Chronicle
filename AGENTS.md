# AGENTS.md

> This file helps AI coding assistants understand the project structure and conventions.

## Project Overview

A personal blog built with Next.js 16.2 (App Router), React 19, and Tailwind CSS 4. Content is authored in MDX, stored in `content/blog/`. Projects data is in `data/projects.json`.

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, SSG)
- **UI**: React 19.2, Tailwind CSS 4, BEM custom CSS
- **Content**: MDX with gray-matter frontmatter, next-mdx-remote
- **Syntax Highlighting**: Shiki via rehype-pretty-code
- **Search**: fuse.js (client-side fuzzy search)
- **Testing**: Vitest (unit/integration, 115 tests), Playwright (E2E, 30 tests)
- **CI**: GitHub Actions (lint / test / tsc / build / bundle-budget / e2e)
- **Deployment**: Vercel

## Key APIs

- Use `next/font/google` for fonts (not CSS @font-face)
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
│   ├── about/              # About page
│   ├── styles/             # CSS files (tokens / layout / components / prose / responsive)
│   ├── layout.tsx          # Root layout (fonts, theme, skip-link)
│   ├── manifest.ts         # PWA manifest (from constants.ts)
│   ├── page.tsx            # Home page
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── robots.ts           # Robots.txt
│   └── error.tsx           # Error boundary
├── components/
│   ├── blog/               # Blog-specific (SearchBar, BlogCard, CodeBlock, TOC, etc.)
│   ├── layout/             # Header, Footer
│   ├── projects/           # ProjectCard
│   ├── comments/           # Giscus comments
│   └── ui/                 # Reusable UI (ThemeToggle, BackToTop, MagneticCard, ParticleCanvas)
├── lib/                    # Business logic
│   ├── posts.ts            # Post CRUD (uses createCache<T>)
│   ├── projects.ts         # Project data (uses createCache<T>, zod validation)
│   ├── tags.ts             # Tag management
│   ├── about.ts            # About page content
│   ├── content-source.ts   # ContentSource interface (fs abstraction)
│   ├── cache.ts            # createCache<T> utility
│   ├── jsonld.ts           # JSON-LD structured data
│   ├── constants.ts        # Site config, content dirs, page size
│   └── utils.ts            # slugify, formatDate, validateFrontmatter
└── types/                  # TypeScript types (PostMeta, PostFull, Project, TagInfo)
```

## Conventions

- **CSS**: BEM for structural components, Tailwind for utilities. See `docs/css-conventions.md`
- **Caching**: Use `createCache<T>` from `lib/cache.ts`. See `docs/cache-components-migration.md`
- **Testing**: Unit tests in `*.test.tsx` alongside components. E2E in `e2e/` directory
- **Security**: CSP headers in `next.config.ts`. No remote images (`remotePatterns: []`)
- **Fonts**: `next/font/google` only. CSS variables: `--font-noto-sans-sc`, `--font-jetbrains-mono`
- **SEO**: JSON-LD via `lib/jsonld.ts`. OG images via `opengraph-image.tsx` file convention
- **Site Config**: Single source of truth in `src/lib/constants.ts` (`SITE_CONFIG`)

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Generate RSS + production build
pnpm test         # Run unit/integration tests (115 tests)
pnpm test:e2e     # Run E2E tests (30 tests, auto-starts dev server on port 3001)
pnpm lint         # ESLint
pnpm analyze     # Bundle size analysis
```

## E2E Testing Notes

- Playwright config uses port 3001 with `reuseExistingServer: true`
- Blog card `::after` overlays can intercept clicks — use `focus()` + `keyboard.type()` for search inputs, `dispatchEvent('click')` for buttons, and `page.goto()` for navigation
- React hydration in dev mode requires waiting for `button[aria-label="切换主题"]` to have a `title` attribute
- Use `getByRole('heading', { name: '...', exact: true })` to avoid substring matches on Chinese headings

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to main:
1. **quality** — lint → test → tsc → generate-rss → build → bundle-budget
2. **bundle-analyze** — builds with analyzer, uploads report as artifact
3. **e2e** — installs Chromium, runs Playwright tests
