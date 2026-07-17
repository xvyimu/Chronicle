# shadcn Visual Architecture Consolidation

Status: implemented on 2026-07-04.

> Historical snapshot: current CSS ownership lives in
> `docs/css-conventions.md` and `docs/architecture.md`.

This document records the current UI composition layer after the low-saturation
Paper Gallery redesign and shadcn consolidation. It is a handoff note for agents
that need to continue visual or component architecture work.

## Context

The site uses a hybrid UI strategy:

- shadcn source components live in `src/components/ui/`.
- BEM classes define the project-specific visual language.
- Tailwind utility classes are used only for small layout adjustments.
- The visual direction is simple, editorial, artistic, and low saturation.

The shadcn CLI currently fails in this local environment on Node 24 with a zod
exports error from `@modelcontextprotocol/sdk`. Because of that, the implemented
path is to compose existing local shadcn source files instead of running CLI
install or overwrite commands.

## Current primitives

### shadcn-backed primitives

- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/skeleton.tsx`

`Card` has been extended with `asChild` so linked cards can preserve semantic
navigation while still using the shared card primitive.

### Local wrapper primitives

- `src/components/ui/MetaBadge.tsx`
  Wraps shadcn `Badge` and adds the shared `meta-badge` class.

- `src/components/layout/PageSection.tsx`
  Provides the common section shell for archive, list, about, and index pages.

- `src/components/layout/ArchiveCard.tsx`
  Composes `Card`, `CardHeader`, `CardTitle`, `CardAction`, `CardContent`, and
  `MetaBadge` for linked category and series cards.

## Where MetaBadge is used

`MetaBadge` is the default choice for small metadata chips, counts, tags, and
featured markers. Current consumers include:

- `src/app/tags/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/components/blog/BlogCard.tsx`
- `src/components/blog/SearchBar.tsx`
- `src/components/home/FeaturedArticleRail.tsx`
- `src/components/layout/ArchiveCard.tsx`
- `src/components/links/LinksDirectory.tsx`
- `src/components/projects/ProjectCard.tsx`

The older class names are intentionally preserved, for example
`blog__tag`, `article-related__badge`, `project-detail__tag`,
`tag-cloud__count`, `archive-card__tag`, and `card__tag`. This keeps visual
ownership in the existing CSS modules and limits test churn.

## CSS ownership

CSS modules are imported explicitly in `src/app/layout.tsx`. Do not move these
imports back into `globals.css`; Tailwind v4 with `@tailwindcss/postcss` can
silently drop nested `@import` rules.

Current module ownership:

- `tokens.css`: design tokens, light/dark variables, scrollbar
- `base.css`: document base, skip link, header, footer
- `components.css`: shared section/card/button/archive primitives
- `links.css`: links directory page
- `blog-ui.css`: blog cards, search, article panels, related posts, TOC
- `backdrop.css`: body backdrop and decorative stage
- `home.css`: homepage sections and article rail
- `prose.css`: MDX article typography
- `project-detail.css`: project detail view
- `animations.css`: reveal/loading/fade motion
- `responsive.css`: breakpoint overrides, loaded last

## Composition rules

- Use `MetaBadge` instead of custom styled `span` chips.
- Use `ArchiveCard` for category and series archive cards.
- Use `PageSection` for standard section shells.
- Preserve existing BEM class names when migrating markup.
- Keep new page-level visual styles in the relevant CSS module, not inline.
- Use `cn()` for conditional class merging.
- Keep all new component primitives covered by Vitest tests.

## Verification baseline

Last verified on 2026-07-04:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 63 files / 514 tests
- `pnpm build`
- Chrome browser check on `http://localhost:7897` for `/`, `/blog`,
  `/blog/docker-deploy-guide`, `/tags`, `/links`, and `/projects/nav-site`

Observed browser state:

- no console errors or warnings
- no horizontal overflow
- badge metadata rendered through `[data-slot="badge"]`
