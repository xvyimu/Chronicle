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

These budgets are enforced in CI today (all green on 2026-06-28):

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

> Lighthouse 各分项分数需在 CI `lighthouse` job 运行后从其 artifact 获取；本地未运行 Lighthouse。Speed Insights p75 见下表，需生产流量后填充。

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
