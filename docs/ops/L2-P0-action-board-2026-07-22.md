# Chronicle L2 · P0 hygiene action board · 2026-07-22

Derived from `docs/ops/L2-hygiene-checklist.md`. **No stack rewrite.**  
**W3 refresh (2026-07-23):** status only — see also [`ops-checklist-2026-07.md`](./ops-checklist-2026-07.md) · [`perf-budget-2026-07.md`](./perf-budget-2026-07.md).

## P0 (human / account)

| ID       | Item                            | Owner      | Status (W3)        | Action                                              |
| -------- | ------------------------------- | ---------- | ------------------ | --------------------------------------------------- |
| P0-GSC   | Google Search Console property  | You        | **`blocked_auth`** | Verify domain; submit sitemap; agent must not login |
| P0-Bing  | Bing Webmaster                  | You        | **`blocked_auth`** | Import from GSC after P0-GSC                        |
| P0-Audit | `pnpm audit --audit-level=high` | CI + local | re-run each wave   | Must stay 0 high; re-run on dependency PRs          |

## P0 automated (already green / keep green)

| Check              | Command / evidence                                                    |
| ------------------ | --------------------------------------------------------------------- |
| Audit              | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high` |
| CI quality         | `.github/workflows` quality job                                       |
| Production content | `pnpm check:production-content` (when networked)                      |
| CSP/SRI            | Production headers + `ENABLE_SRI=1`; `test:sri` + `check:sri-smoke`   |
| Ops readiness      | `pnpm check:ops-readiness` (+ `--live` when net)                      |

## P1 (optional next)

| ID      | Item                                             |
| ------- | ------------------------------------------------ |
| P1-RUM  | Read-only RUM/p75 if product wants; not blocking |
| P1-Deps | Dependabot PR triage                             |
| P1-PERF | Use `perf-budget-2026-07.md` when optimizing     |

## Explicit non-actions

- GardenExplorer large refactor
- Vue migration
- Fake GSC metrics
- Agent Google/Bing login

**Status**: Board + W3 ops checklist refresh; no production flip this wave.
