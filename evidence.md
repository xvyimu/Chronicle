# Evidence · W2 ch-cwv-home · 2026-07-24

| 项     | 值                                            |
| ------ | --------------------------------------------- |
| wt     | `ch-cwv-home`                                 |
| branch | `xvyimu/ch-cwv-home`                          |
| module | M-CH-cwv-home · WEEK-BACKLOG W2               |
| base   | master tip `1f52af9` 链（含已合 CH-PERF-003） |
| push   | **否**                                        |

## Diff 摘要

- `src/components/home/EditorialHero.tsx` — quality 70→65 · sizes 三档 · aspect-ratio 16/9 · decoding async
- `src/components/home/EditorialHero.test.tsx` — LCP 属性 + frame 比例断言
- `src/test/mocks/next-image.tsx` — 透传 data-quality / data-sizes
- `src/app/page.tsx` — 注释（无行为变）
- `docs/ops/ch-cwv-home-2026-07-24.md` — 本 ops

## 命令 + exit

| Command                                                                     | Exit                              |
| --------------------------------------------------------------------------- | --------------------------------- |
| `pnpm typecheck`                                                            | **0**                             |
| `pnpm test`                                                                 | **0**（98 files / **750** tests） |
| `pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` | **0**（108 routes；Turbopack）    |

**Node：** v24.16.0 · engines 要 22.x → **WARN** only

## 风险（一句）

quality 下调无 lab LCP 复测；画质与 LCP 权衡依赖部署后 RUM/LH。

## NOOP？

**否** — 有可验证最小代码+测试 diff（非 docs-only）。
