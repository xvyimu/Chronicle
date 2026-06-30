# Performance Baseline

This document records the performance guardrails for the blog and how to refresh them.

## Pages To Track

Track both synthetic Lighthouse data and real-user Vercel Speed Insights data for:

| Page | URL path | Why it matters |
| --- | --- | --- |
| Home | `/` | Landing page, project cards, hero canvas |
| Blog index | `/blog` | Search entry and article discovery |
| Article detail | `/blog/nextjs-app-router` | MDX, code blocks, table of contents, comments |
| Projects | `/projects` | Project images and card grid |
| About | `/about` | Static MDX content |

## Current CI Budgets

These budgets are enforced in CI today (all green on 2026-06-29):

| Gate | Current threshold | Enforced in |
| --- | --- | --- |
| Lighthouse performance | `>= 0.85` | `lighthouse.config.js` (error) → `.github/workflows/ci.yml` `lighthouse` job |
| Lighthouse accessibility | `>= 0.90` | `lighthouse.config.js` (error) → 同上 |
| Lighthouse best practices | `>= 0.90` | `lighthouse.config.js` (error) → 同上 |
| Lighthouse SEO | `>= 0.90` | `lighthouse.config.js` (error) → 同上 |
| Lighthouse LCP | `<= 3500 ms` | `lighthouse.config.js` (error) → 同上 |
| Lighthouse CLS | `<= 0.1` | `lighthouse.config.js` (error) → 同上 |
| Lighthouse TBT | `<= 300 ms` | `lighthouse.config.js` (error) → 同上 |
| Lighthouse FCP | `<= 2000 ms` | `lighthouse.config.js` (warn) → 同上 |
| Largest JS chunk | `<= 300 KB` | `scripts/check-bundle-budget.ts` → `ci.yml` `quality` job |
| Largest CSS bundle | `<= 300 KB` | `scripts/check-bundle-budget.ts` → 同上 |
| Total JS/CSS static output | `<= 2 MB` | `scripts/check-bundle-budget.ts` → 同上 |

> Lighthouse CI 通过 `treosh/lighthouse-ci-action@v12`（`configPath: ./lighthouse.config.js`）执行，`numberOfRuns: 2` 取中位数，`preset: 'desktop'`。Bundle analyzer 报告另由 `bundle-analyze` job 上传至 artifact `.next/analyze/`。

## CI Baseline Snapshot (2026-06-28)

`pnpm build && pnpm exec tsx scripts/check-bundle-budget.ts` 实测结果：

| 指标 | 实测 | 预算 | 余量 |
| --- | --- | --- | --- |
| 最大单 JS chunk | 272.5 KB | 300 KB | 27.5 KB (9%) |
| 最大单 CSS bundle | 272.5 KB | 300 KB | 27.5 KB (9%) |
| 总静态产物 (JS+CSS，不含字体) | 1.08 MB | 2.00 MB | 0.92 MB (46%) |

### Lighthouse CI Baseline (2026-06-29, desktop preset, 2 runs avg)

来源：CI `lighthouse` job (run `28362770380`) artifact `lighthouse-results`，5 页 × 2 次 desktop 预设取均值。

| Page | Perf | A11y | BestPrac | SEO | FCP | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 0.85 | 0.96 | 1.00 | 1.00 | 1617 ms | 1877 ms | 0.00 | 0 ms |
| `/about` | 0.97 | 1.00 | 1.00 | 1.00 | 932 ms | 1172 ms | 0.00 | 0 ms |
| `/blog` | 0.91 | 1.00 | 1.00 | 1.00 | 1320 ms | 1524 ms | 0.00 | 0 ms |
| `/blog/nextjs-app-router` | 0.83 | 0.96 | 1.00 | 1.00 | 1083 ms | 1795 ms | 0.13 | 3 ms |
| `/projects` | 0.97 | 1.00 | 1.00 | 1.00 | 872 ms | 1142 ms | 0.00 | 0 ms |

> 所有断言通过（CI success）。`/blog/nextjs-app-router` 的 perf=0.83 略低于 0.85 阈值、CLS=0.13 略超 0.1，但 CI 取 2 次中位数通过——值得在后续优化中关注该页 CLS 来源（疑似图片/字体加载）。TBT 全部 0–3 ms，远低于 300 ms 阈值，印证 SSG 静态站的响应性优势。Speed Insights p75 见下表，需生产流量后填充。

## Real-User Targets

Use Vercel Speed Insights as the source of truth after deployment:

| Metric | Good target | Action threshold |
| --- | --- | --- |
| LCP | `<= 2.5s` | Investigate if p75 is above `3.0s` |
| INP | `<= 200ms` | Investigate if p75 is above `300ms` |
| CLS | `<= 0.1` | Investigate if p75 is above `0.1` |

## Refresh Procedure

1. Wait for a production deployment to receive enough traffic in Vercel Speed Insights.
2. Record p75 LCP, INP, and CLS for each tracked page above.
3. Compare Lighthouse CI results with Speed Insights.
4. If Lighthouse is green but real-user data regresses, prioritize the real-user issue.
5. Update the table below with exact dates and values.

## Baseline Log

| Date | Source | Page | LCP p75 | INP p75 | CLS p75 | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-29 | Lighthouse CI (desktop) | `/` | 1877 ms | n/a (TBT 0 ms) | 0.00 | 2-run avg; all assertions green |
| 2026-06-29 | Lighthouse CI (desktop) | `/about` | 1172 ms | n/a (TBT 0 ms) | 0.00 | 2-run avg |
| 2026-06-29 | Lighthouse CI (desktop) | `/blog` | 1524 ms | n/a (TBT 0 ms) | 0.00 | 2-run avg |
| 2026-06-29 | Lighthouse CI (desktop) | `/blog/nextjs-app-router` | 1795 ms | n/a (TBT 3 ms) | 0.13 | 2-run avg; CLS 略超 0.1，CI 取中位数通过 |
| 2026-06-29 | Lighthouse CI (desktop) | `/projects` | 1142 ms | n/a (TBT 0 ms) | 0.00 | 2-run avg |
| 2026-06-28 | Pending Vercel Speed Insights | All tracked pages | TBD | TBD | TBD | Fill after PR deployment receives production traffic |

## Regression Playbook

If LCP regresses:

- Check image candidates on home and projects pages.
- Check MDX/code highlighting payload on article pages.
- Compare `.next/analyze/` artifacts for new large chunks.

If INP regresses:

- Check search interactions on `/blog`.
- Check theme toggle and reading preference controls.
- Inspect long tasks in a browser performance trace.

If CLS regresses:

- Check image dimensions and `next/image` usage.
- Check font loading and layout shifts around comments or code blocks.
- Confirm late-loaded UI does not push existing content.
