# ADR: Radical upgrade charter (档 C)

- Status: Accepted
- Date: 2026-07-21
- Updated: 2026-07-22 (T1–T3 merged; T4 keep-Fuse; T7 positions seed)
- Related: `docs/architecture-upgrade-radical-c-2026-07-21.md`, production `https://incca.ccwu.cc`

## Context

User form chose ambition **C** across render/security/content/experience. That is a multi-week merge train, not a single PR. This charter freezes non-goals and rollback so agents do not expand scope mid-train.

## Goals

1. Move content computation left (`content:build` snapshot) while Git remains content SSOT.
2. Keep strict CSP nonce; add collect-only reporting; evaluate then gate SRI.
3. Harden public API envelopes (search / preview) and garden UX without second-brain SaaS scope.
4. Each train is one PR-class change, independently revertable; production deploy needs separate auth.

## Non-goals (unless a new form)

- Multi-tenant accounts / CMS replacing Git
- Full-site SSG via `unsafe-inline`
- Monorepo (T8) before T2–T5 stabilize
- Production SRI + PPR same week
- Dual long-lived search engines

## Success metrics (directional)

| Metric           | Direction                                             |
| ---------------- | ----------------------------------------------------- |
| Vitest           | No regression on critical suites                      |
| Production smoke | `/` `/blog` `/garden` + feeds stay green              |
| CSP              | Nonce retained; report endpoint collect-only          |
| Search           | Fuse until T4 re-open triggers                        |
| Garden           | Snapshot positions seed client; optional Worker later |

## Rollback

Per-train matrix lives in radical-c §6. Default: revert PR + flag off (`CONTENT_BACKEND`, `ENABLE_SRI`).

## Authority

Detailed sequencing: radical-c plan SSOT. This ADR only charters boundaries.
