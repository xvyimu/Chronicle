# Chronicle · Third-party dependency notice

> **Purpose**: Human-facing digest of **direct** dependencies for compliance review.  
> **Authority for full tree**: package manager lockfile + `pnpm licenses list`.  
> **Product license**: MIT — root [`LICENSE`](../LICENSE) · notices: root [`NOTICE`](../NOTICE).  
> **Date**: 2026-07-22 (Dual-B) · pins from `package.json` at tip of this worktree.

License IDs below are **as commonly declared by the package** at the version range used here. Always re-check with `pnpm licenses list` before redistribution or a legal audit; this table is not a substitute for the lockfile.

---

## 1. Production (`dependencies`)

| Package                                                | Role on Chronicle                                                           | License (SPDX, typical) |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------- |
| `next`                                                 | App Router framework, build, static asset pipeline (incl. experimental SRI) | MIT                     |
| `react` / `react-dom`                                  | UI runtime                                                                  | MIT                     |
| `zod`                                                  | Frontmatter / JSON / API schema validation                                  | MIT                     |
| `next-mdx-remote`                                      | MDX compile/render for posts                                                | MPL-2.0                 |
| `js-yaml`                                              | YAML frontmatter parse                                                      | MIT                     |
| `fuse.js`                                              | Client-compatible fuzzy search engine (server search)                       | Apache-2.0              |
| `feed`                                                 | RSS/JSON feed generation                                                    | MIT                     |
| `reading-time`                                         | Post reading-time estimate                                                  | MIT                     |
| `shiki`                                                | Syntax highlighting (via rehype-pretty-code)                                | MIT                     |
| `rehype-pretty-code`                                   | Code block pipeline                                                         | MIT                     |
| `rehype-slug` / `rehype-autolink-headings`             | Heading ids / anchors                                                       | MIT                     |
| `remark-gfm`                                           | GitHub-flavored markdown                                                    | MIT                     |
| `unist-util-visit`                                     | AST walk helpers                                                            | MIT                     |
| `clsx` / `tailwind-merge` / `class-variance-authority` | Class name composition                                                      | MIT                     |
| `radix-ui`                                             | Accessible UI primitives                                                    | MIT                     |
| `@vercel/analytics`                                    | Web analytics injection (production)                                        | MPL-2.0                 |
| `@vercel/speed-insights`                               | RUM / Speed Insights (production)                                           | Apache-2.0              |

---

## 2. Major development / CI tooling (`devDependencies`)

| Package                                            | Role                              | License (SPDX, typical) |
| -------------------------------------------------- | --------------------------------- | ----------------------- |
| `typescript`                                       | Typecheck                         | Apache-2.0              |
| `vitest` / `@vitest/ui`                            | Unit tests                        | MIT                     |
| `@playwright/test` / `playwright`                  | E2E                               | Apache-2.0              |
| `eslint` / `eslint-config-next` / prettier plugins | Lint/format                       | MIT                     |
| `tailwindcss` / `@tailwindcss/*`                   | CSS toolchain                     | MIT                     |
| `tsx`                                              | Run TS scripts                    | MIT                     |
| `husky` / `lint-staged`                            | Git hooks                         | MIT                     |
| `@testing-library/*` / `jsdom`                     | Component tests                   | MIT                     |
| `@next/bundle-analyzer`                            | Bundle analysis                   | MIT                     |
| `babel-plugin-react-compiler`                      | React Compiler                    | MIT                     |
| `@stryker-mutator/*`                               | Mutation testing (optional local) | Apache-2.0              |

---

## 3. Content / binary assets

| Asset                     | Notes                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Blog MDX under `content/` | First-party unless a post embeds third-party text with its own license (authors must attribute in-post). |
| Images under `public/`    | Prefer first-party or clearly licensed stock; do not commit uncleared third-party brand assets.          |
| Fonts                     | If self-hosted later, record OFL/SIL/etc. here and under `public/fonts/`.                                |

---

## 4. Services not vendored in-repo

| Service | Use                                  | License / terms       |
| ------- | ------------------------------------ | --------------------- |
| Vercel  | Hosting + Analytics / Speed Insights | Vercel customer terms |
| Giscus  | Comments (GitHub Discussions)        | giscus + GitHub terms |
| GitHub  | Source hosting, Actions, Discussions | GitHub terms          |

---

## 5. Refresh procedure

```powershell
# From repo root — full tree license inventory (authoritative for redistribute)
pnpm licenses list

# Optional: filter production-only when supported by your pnpm version
pnpm licenses list --prod
```

When adding a **direct** dependency:

1. Prefer OSI-approved licenses compatible with MIT redistribution.
2. Update this table’s row (name, role, SPDX).
3. If the package is copyleft with source-offer obligations (e.g. MPL/GPL), note the obligation in the PR description and keep this file accurate.

---

## 6. Explicit non-claims

- This document does **not** restate full license texts of third-party packages.
- This document does **not** grant rights beyond those of each package’s license and the project MIT license.
- Transitive dependency licenses are **not** exhaustively listed here by design.
