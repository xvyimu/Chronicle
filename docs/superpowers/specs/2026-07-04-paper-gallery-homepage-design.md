# Paper Gallery Homepage Redesign

> Status: implemented. Current component and CSS ownership is documented in `docs/architecture.md` and `docs/css-conventions.md`.
> Scope: homepage only.
> Reference: https://shijiucode.cn/

## Design Read

This is a personal technical blog redesign for long-form readers and personal
knowledge navigation. The visual language should be simple, artistic, and
low-saturation, leaning toward an editorial Paper Gallery style rather than a
dark technical stage.

Design dials:

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 3`

The page should feel quiet and intentional. The art direction comes from
typography, whitespace, thin rules, muted imagery, and archive rhythm, not from
heavy animation or saturated gradients.

## Goals

1. Make the homepage default to a light paper-like visual identity.
2. Keep the site useful as a technical blog, project index, and curated link
   collection.
3. Reduce the current purple-blue tech-stage feeling.
4. Improve perceived calm, readability, and long-term maintainability.
5. Lower motion and background complexity to reduce Lighthouse risk.

## Non-Goals

- Do not redesign article list pages, article detail pages, project detail
  pages, link directory pages, or about pages in this phase.
- Do not change route slugs, primary navigation labels, RSS, sitemap, metadata,
  or content data structures.
- Do not introduce a heavy animation library.
- Do not turn the blog into a photography-first site.
- Do not change copy voice beyond small homepage labels needed for layout.

## Reference Takeaways

The reference site works because it is restrained:

- Large empty space before content appears.
- Serif-like title treatment for brand memory.
- Low-saturation images and muted hover states.
- Thin typographic navigation.
- Blog content arranged as featured cards, latest lists, and archive timeline.
- Personal signature block near the end.

This project should borrow those patterns, not copy the reference site content,
routes, or visual assets.

## Homepage Information Architecture

The homepage should keep the current content purpose but change the rhythm.

1. Header
   - Keep existing navigation destinations.
   - Make visual treatment lighter and less capsule-like.
   - Desktop nav should stay on one line.

2. Hero
   - Default to light paper background.
   - Use a large editorial headline aligned left or slightly asymmetric.
   - Include one short Chinese supporting sentence.
   - Include no more than two primary actions.
   - Add one muted image or abstract paper/ink block as visual counterweight.

3. Entry Index
   - Show Articles, Links, and Projects as thin-rule index entries.
   - Avoid three heavy equal cards.
   - Each entry has label, one sentence, and link target.

4. Featured Article
   - Promote one article as the current lead note.
   - Pair it with date, category, and concise summary.
   - Use a quiet image/tonal block only if it improves hierarchy.

5. Latest Notes
   - Present latest articles as a compact list or archive rail.
   - Prefer date/category rhythm over card grid density.

6. Reading Path
   - Keep current topic/series value.
   - Restyle as an index or timeline rather than high-contrast cards.

7. Curated Links Preview
   - Keep the curated links entry.
   - Restyle as a calm link index with muted badges and thin separators.

8. About Signature
   - End with a small personal block.
   - A single-character mark or signature is acceptable.
   - Keep links to GitHub, RSS, and About if already present.

## Visual System

### Theme

Default theme is light Paper Gallery.

The light theme should use a cool paper palette rather than warm beige:

- Background: cold paper gray, near `#eeede8` or `#f2f1ec`
- Surface: slightly lifted paper, near `#f8f7f2`
- Text: ink gray, near `#242827`
- Muted text: gray-green, near `#70756e`
- Rule: soft gray, near `rgba(40, 42, 42, 0.14)`
- Accent: one low-saturation blue-gray or sage tone

Dark mode can remain available, but this phase optimizes the default light
homepage first. It should not invert individual homepage sections mid-page.

### Typography

- Keep Chinese body text on the existing sans-serif stack.
- Use the existing display-font direction for large English headings if already
  configured.
- Avoid oversized decorative serif everywhere. Serif or display treatment is
  limited to the hero and small signature moments.
- Do not use negative letter spacing.
- Keep body line length readable, around 60 to 72 Chinese characters where
  possible.

### Layout

- Prefer asymmetric editorial composition over centered hero.
- Use generous whitespace.
- Use thin borders, separators, and timestamp rhythm before box shadows.
- Use cards only where the content is genuinely grouped.
- Keep one radius scale: soft cards around 10 to 14px, buttons or icon controls
  can be pill-shaped only if they have a clear interactive role.

### Color Discipline

- One accent color across the homepage.
- Remove or greatly reduce purple/blue glow effects from the homepage.
- Images and decorative blocks should be desaturated.
- Avoid warm beige plus brass as the dominant palette.

## Motion

Motion should be subtle:

- Initial content fade-in is acceptable.
- Hover states can shift color, border, or image saturation.
- Images may scale very slightly on hover.
- Avoid strong parallax, scroll hijacking, long loading sequences, and animated
  background complexity.
- Respect `prefers-reduced-motion`.

## Technical Approach

This phase should be a targeted homepage evolution.

Likely touched areas:

- `src/app/page.tsx`
- `src/components/home/*`
- `src/app/styles/home.css`
- `src/app/styles/backdrop.css`
- `src/app/styles/tokens.css`
- `src/app/styles/responsive.css`
- related homepage tests

Existing data sources should be reused:

- Posts from the current posts repository.
- Projects from current project data.
- Curated links from `data/links.json`.
- Series/reading path from existing series or post metadata.

No new data source is required.

## Component Plan

### Editorial Hero

Refactor the current hero into a light editorial hero:

- Large headline.
- Short supporting line.
- Two links maximum.
- One muted visual block.
- Optional small metrics only if they do not crowd the hero.

### Home Index Strip

Create or restyle an index section for Articles, Links, and Projects:

- Three entries divided by thin rules.
- Each entry links to the existing route.
- No nested cards.

### Featured Note And Latest List

Replace the current strong horizontal rail emphasis with:

- One featured note.
- A compact latest list.
- Low-saturation image or tonal placeholder for the featured note.

### Reading Path Index

Keep the concept but reduce card weight:

- List/timeline style.
- Small topic tags.
- Clear link target.

### Curated Links Index

Keep shadcn primitives where useful, but restyle toward:

- Quiet link rows.
- Muted count badges.
- Thin separators.

### About Signature

End with a simple personal block:

- Single-character visual mark.
- One paragraph.
- Small set of text links.

## Accessibility

- Preserve one clear `h1`.
- Keep visible focus states.
- Maintain color contrast for text and links.
- Do not encode important text into images.
- Keep keyboard navigation order consistent with visual order.
- Avoid hover-only disclosure.

## Performance

This redesign should improve or at least not worsen homepage performance.

Constraints:

- No remote hero media.
- No new heavy animation package.
- No large canvas or video in phase one.
- Decorative background should be CSS-light.
- Existing Lighthouse performance regression should not be worsened.

## Testing Plan

Unit and integration:

- Homepage renders the new hero headline and primary links.
- Featured/latest article section renders expected posts.
- Curated links preview still renders categories and item links.
- Reading path entries remain reachable.

E2E:

- Homepage loads.
- Main nav links work.
- Homepage CTAs navigate to existing routes.
- Mobile viewport has no horizontal overflow.
- Theme toggle still works.

Visual checks:

- Chrome desktop `1440x1000`.
- Chrome mobile `390x844`.
- Light default homepage.
- Dark mode homepage for regressions.

Quality gates:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e` if the implementation touches navigation or hydration

## Risks

- Current worktree has a large line-ending normalization batch. The visual
  redesign should be implemented in a separate commit after that mechanical
  change is resolved.
- A light default theme may expose components that were tuned for dark
  backgrounds.
- Paper-like palettes can become too beige if not kept cool.
- Reducing background spectacle may make the page feel plain unless typography
  and spacing are carefully tuned.

## Acceptance Criteria

- Homepage default visual direction clearly reads as light Paper Gallery.
- The page remains a practical technical blog homepage.
- Route structure and SEO behavior are unchanged.
- No horizontal overflow on mobile.
- Motion is subtle and respects reduced-motion preferences.
- Purple-blue glow is no longer the dominant homepage impression.
- Validation commands pass.

## Implementation Gate

Do not implement until this design document is reviewed and approved.
