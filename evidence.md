# Evidence · ch-css-route-split (W6)

日期：2026-07-24  
分支：`xvyimu/ch-css-route-split`  
模块：M-CH-css-route-split · 增量于 CH-PERF-001

## Diff 范围

- `src/app/styles/responsive.css` — 仅留 chrome/section/cards/print
- `src/app/styles/controls.css` — 仅 CTA + theme-toggle
- `src/app/styles/components.css` — 删 hero/stat-pill；并入 card--project
- `src/app/styles/{blog-ui,archive,article-ui,prose,project-detail}.css` — 接收路由断点 / 控件
- `src/app/layout.tsx` — 注释
- `src/app/blog/[slug]/layout.tsx` — 注释
- `src/app/styles/css-route-ownership.test.ts` — 新增
- `docs/css-conventions.md` · `docs/architecture.md` · `AGENTS.md`
- `docs/ops/ch-css-route-split-2026-07-24.md`

## 行数（approx）

| 文件 | before | after |
| ---- | -----: | ----: |
| responsive.css | 404 | 197 |
| controls.css | 154 | 52 |
| components.css | 343 | 308 |
| blog-ui.css | 334 | 387 |
| archive.css | 202 | 229 |
| article-ui.css | 686 | 787 |
| prose.css | 363 | 411 |
| project-detail.css | 96 | 109 |
| styles/** total | 4880 | 4786 |

## 验证

| 命令 | exit | 备注 |
| ---- | ---: | ---- |
| `pnpm typecheck` | _pending_ | |
| `pnpm test` | _pending_ | 期望 ≥721（+5 ownership） |

## 残留

见 `docs/ops/ch-css-route-split-2026-07-24.md`。
