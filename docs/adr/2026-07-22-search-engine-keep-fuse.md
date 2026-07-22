# ADR: Keep Fuse for in-site search (T4)

- Status: Accepted
- Date: 2026-07-22
- Related: `docs/architecture-upgrade-radical-c-2026-07-21.md` §T4, `src/server/search/engine.ts`, `src/lib/search/`, `generated/content-snapshot/search-docs.json`

## Context

Merge Train T4 asks whether to replace the current Fuse.js server search with Orama or Pagefind after content snapshots land (T2). The public surface is `GET /api/search` with a shared wire contract in `src/lib/search`, process-local rate limit, and Node runtime only.

Current facts (2026-07-22):

| Fact                      | Evidence                                                                |
| ------------------------- | ----------------------------------------------------------------------- |
| Corpus                    | 20 published posts                                                      |
| Index shape               | `PostMeta[]` (+ `searchText` / headings) from snapshot or fs repository |
| Engine                    | `fuse.js` with `WeakMap` cache keyed by posts array reference           |
| External search threshold | `TODO.md`: only re-evaluate at **≥200 posts** or measured p95 pain      |
| Ops readiness             | `pnpm check:ops-readiness` treats external search as `not_triggered`    |

Spike cost for Orama/Pagefind (new dep, dual adapter, Chinese tokenizer trial, CI artifact for Pagefind static index, shadow traffic) is large relative to a 20-post corpus that already has a snapshot-backed Fuse path.

## Decision

**Keep Fuse as the single production search engine.** Do not introduce Orama or Pagefind adapters now.

T4 is closed as an evaluation ADR with a keep decision, not as a multi-day dual-engine spike.

## Why not Orama / Pagefind now

1. **Scale trigger not met.** TODO and radical-c both gate engine change on ≥200 posts or p95 evidence. Neither exists.
2. **T2 already removed the expensive part.** Search docs are built at `content:build` time; runtime only builds a Fuse index over a stable in-memory array (cached).
3. **Pagefind is a different delivery model** (static prebuilt index + client or edge assets). It conflicts with the current Node `GET /api/search` + rate-limit envelope unless we redesign the public API.
4. **Orama adds dependency + Chinese tokenization work** without proven recall/latency wins on n=20.
5. **Single-engine rule.** radical-c forbids long-lived dual engines. A keep decision is cheaper than a reversible adapter layer nobody exercises.

## Re-open triggers

Revisit this ADR and allow a **single** successor engine only when **any** of:

- Visible post count **≥ 200**, or
- Production `/api/search` p95 (or CI bench under representative corpus) shows sustained regression beyond an agreed budget, or
- Product requires offline/static search without the Node API.

When reopened: run a time-boxed spike (≤2 days total) with a fixed Chinese query set (title / tag / body), pick **one** engine, and ship behind an adapter only if Fuse cannot meet the budget.

## Consequences

- No new search dependencies.
- `src/server/search/engine.ts` remains Fuse + WeakMap.
- T4 checklist items 2–5 (Orama/Pagefind spike, dual-run) are **deferred**, not debt.
- Future agents must not open Orama/Pagefind PRs without a new trigger firing and an updated ADR status.
