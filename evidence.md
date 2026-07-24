# Evidence · M-CH-fix-rate-limit-docs · 2026-07-24

> Branch: `xvyimu/ch-fix-rate-limit-docs`  
> Findings: **CH-CR-001** · **CH-CR-002**  
> Scope: docs/ops rate-limit boundary + Vercel WAF checklist; comment clarifications only in `src` (no algorithm change).

## Commands / exit codes

| #   | Command                                                                                                                                    | Exit                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 1   | `pnpm typecheck`                                                                                                                           | **0**                      |
| 2   | `pnpm check:docs`                                                                                                                          | **0**                      |
| 3   | `pnpm test src/server/search/rate-limit.test.ts src/app/api/search/route.test.ts src/app/api/preview src/app/api/csp-report/route.test.ts` | **0** (4 files / 25 tests) |

Notes:

- Node runtime on this machine: `v24.16.0` (engines declare `22.x`; engine warn only).

## Artifacts

| Path                                               | Role                                             |
| -------------------------------------------------- | ------------------------------------------------ |
| `docs/ops/public-api-rate-limit-boundary.md`       | Public API in-process Map limits + WAF checklist |
| `docs/ops/ch-fix-rate-limit-docs-2026-07-24.md`    | Ops evidence                                     |
| `docs/API.md`                                      | Cross-link to boundary                           |
| `SECURITY.md`                                      | Public API rate-limit note                       |
| `src/server/search/rate-limit.ts`                  | Header comment only                              |
| `src/app/api/{search,preview,csp-report}/route.ts` | Top comments only                                |

## Not done (by design)

- No Redis/KV / cross-isolate global limiter
- No preview auth
- No CSP / fuse / master push
