# Performance Baseline Monitoring Design

> Date: 2026-07-05
> Project: `D:\blog`
> Purpose: establish a lightweight production performance monitoring loop.
> Status: implemented. Current budgets and measurements live in `docs/performance-baseline.md`.

## 1. Goal

Create a low-risk performance baseline process for the already-deployed blog.
The project already has desktop Lighthouse CI, bundle budgets, production smoke
tests, and `@vercel/speed-insights` installed. The next step is to make real
user performance data operational without doubling CI time or adding brittle
release blockers.

This design keeps CI unchanged at first. It adds a documented workflow for
collecting Vercel Speed Insights p75 metrics, introduces mobile Lighthouse as a
manual evaluation path, and defines when a measurement should become an
optimization task.

## 2. Current State

The current production state is healthy:

- `master` is deployed to `https://incca.ccwu.cc`.
- GitHub Actions quality, E2E, Lighthouse, deploy, and production content smoke
  checks are green.
- `docs/performance-baseline.md` tracks five key pages and desktop Lighthouse
  results.
- `lighthouse.config.js` enforces the desktop synthetic budget in CI.
- `scripts/check-bundle-budget.ts` enforces static JS/CSS output budgets.
- `@vercel/speed-insights` is already present in `package.json`.

The remaining gap is operational rather than architectural: Speed Insights p75
values need enough production traffic before they can become the real-user
baseline, and mobile Lighthouse should be evaluated before deciding whether it
belongs in CI.

## 3. Source Notes

Authoritative references:

- Vercel Speed Insights is based on Core Web Vitals and can be inspected in the
  Vercel dashboard.
- Vercel's dashboard defaults to p75 for time-based metric views and can segment
  by mobile/desktop, environment, route, path, country, and element.
- Vercel documents target values of LCP <= 2.5s, INP <= 200ms, and CLS <= 0.1.
- The Vercel CLI can query p75 values using metrics such as
  `vercel.speed_insights.lcp_ms`, `vercel.speed_insights.inp_ms`, and
  `vercel.speed_insights.cls`.
- Count metrics such as `vercel.speed_insights.lcp_count` should be checked
  before treating a p75 value as representative.

## 4. Proposed Approach

### 4.1 Keep Desktop Lighthouse As CI Gate

The existing `lighthouse.config.js` remains the only Lighthouse CI gate. It
continues to protect the five established pages:

- `/`
- `/blog`
- `/blog/nextjs-app-router`
- `/projects`
- `/about`

No CI threshold changes are part of this design. This avoids destabilizing the
current green deploy path.

### 4.2 Add Mobile Lighthouse As Manual Baseline

Mobile Lighthouse should initially be a local or ad hoc CI artifact, not a
blocking job. It should cover:

- `/`
- `/blog`
- `/blog/nextjs-app-router`
- `/projects`
- `/about`
- `/links`

The `/links` page is included because it is now a larger curated directory with
10 categories and 123 links.

The first implementation can choose either:

1. A separate `lighthouse.mobile.config.js` with relaxed warning thresholds.
2. A documented command that runs Lighthouse with mobile settings and records
   results manually.

Option 1 is preferred if it can be added without CI changes. It makes the manual
run repeatable while preserving the current deploy pipeline.

### 4.3 Treat Speed Insights As Source Of Truth

Real-user metrics should override synthetic Lighthouse results when they
disagree. The refresh procedure should record p75 LCP, INP, and CLS per tracked
route after enough production traffic exists.

Suggested Vercel CLI queries:

```bash
vercel metrics vercel.speed_insights.lcp_ms --aggregation p75 --group-by route --since 7d --project blog --prod
vercel metrics vercel.speed_insights.inp_ms --aggregation p75 --group-by route --since 7d --project blog --prod
vercel metrics vercel.speed_insights.cls --aggregation p75 --group-by route --since 7d --project blog --prod
vercel metrics vercel.speed_insights.lcp_count --aggregation sum --group-by route --since 7d --project blog --prod
```

If the local Vercel project name is not `blog`, replace `--project blog` with
the actual Vercel project name.

## 5. Data Model In Documentation

`docs/performance-baseline.md` should become the single place for performance
records.

Add or revise these sections:

- "Synthetic Baselines": desktop CI and manual mobile Lighthouse.
- "Real-User Baselines": Speed Insights p75 values and data point counts.
- "Refresh Cadence": after major deploys and monthly while traffic exists.
- "Escalation Rules": when a metric becomes a fix task.

Baseline log columns should include:

| Date | Source | Device | Page | LCP p75 | INP p75 | CLS p75 | Count | Notes |
| ---- | ------ | ------ | ---- | ------- | ------- | ------- | ----- | ----- |

For Lighthouse rows, use `INP p75 = n/a` and include TBT in notes.

## 6. Escalation Rules

Open an optimization task when any of these happen:

- A core route has enough data points and LCP p75 is above 3.0s.
- A core route has enough data points and INP p75 is above 300ms.
- A core route has enough data points and CLS p75 is above 0.1.
- Mobile Lighthouse shows the same warning on the same page in two separate
  manual runs.
- A production content or deploy smoke test remains green but users report
  loading or interaction issues.

Do not treat one low-count p75 value as a regression. First verify count,
device, route, and time range.

## 7. Implementation Boundary

The implementation plan that follows this design may:

- Update `docs/performance-baseline.md`.
- Add a manual mobile Lighthouse config or documented command.
- Add an npm script only if it does not affect CI.
- Update `README.md` or the project backlog only if the new workflow needs a
  pointer.

The implementation plan must not:

- Add a blocking mobile Lighthouse CI job yet.
- Change existing Lighthouse desktop thresholds.
- Add new third-party monitoring packages.
- Change production deployment behavior.
- Query or store private Vercel tokens in the repository.

## 8. Verification Plan

For the design document:

```bash
rg -n "T[B]D|T[O]D[O]|F[I]XME" docs/superpowers/specs/2026-07-05-performance-baseline-monitoring-design.md
pnpm exec prettier --check docs/superpowers/specs/2026-07-05-performance-baseline-monitoring-design.md
```

For the later implementation:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

If a mobile Lighthouse config is added, also run the manual mobile command once
and record whether it is green, noisy, or blocked by local environment.

## 9. Done Criteria

This design is complete when:

- The spec exists under `docs/superpowers/specs/`.
- The spec contains no placeholders or contradictory scope.
- The spec is committed.
- The next step is limited to an implementation plan, not immediate coding.

The future implementation is complete when:

- `docs/performance-baseline.md` clearly separates desktop CI, manual mobile
  Lighthouse, and Speed Insights p75.
- The workflow explains how to evaluate data point counts.
- Existing CI and deployment behavior remain unchanged.
- The project still passes the standard checks relevant to documentation and
  configuration changes.
