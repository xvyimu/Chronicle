# CH-PERF-005 / 009 · images-mdx evidence

- **Branch:** `xvyimu/ch-perf-images-mdx`
- **Date:** 2026-07-24
- **Scope:** MDX/Shiki 主线程（CodeBlock 懒挂载）+ 图片组件尺寸/懒加载/blur

## Changes

| Area                      | What                                                                          |
| ------------------------- | ----------------------------------------------------------------------------- |
| `CodeBlock.tsx`           | Server shell only; highlighted HTML stays SSR via rehype-pretty-code          |
| `CodeBlockCopyButton.tsx` | Client island; copy button mounts via `useInView` (`rootMargin: 240px`)       |
| `ImageZoom.tsx`           | Parses width/height; default 1200×630; `sizes` + lazy; `blurDataFor` fallback |
| `prose.css`               | `.copy-btn-slot` absolute slot (no CLS when button mounts)                    |
| tests / next-image mock   | Cover deferred copy + explicit dims / loading                                 |

## Commands

| Command                 | Exit    | Notes                                                                                 |
| ----------------------- | ------- | ------------------------------------------------------------------------------------- |
| `pnpm typecheck`        | **0**   | `tsc --noEmit`                                                                        |
| `pnpm test`             | **0**   | 95 files · **719** tests pass                                                         |
| `pnpm check:blur`       | **0**   | projects=6, blogImages=0                                                              |
| `content:build`         | n/a     | snapshot untouched                                                                    |
| production `pnpm build` | not run | optional; recommend `cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` |

## Residual

正文图资产仍 0（`public/images/blog/**` 无文件）；组件已加固，有图后 `pnpm gen:blur && pnpm check:blur` 即可覆盖 LQIP。Shiki 仍在服务端/构建期跑（rehype-pretty-code），未迁客户端高亮。
