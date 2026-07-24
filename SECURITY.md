# Security Policy

## Supported versions

Security fixes are applied to the default branch of **Chronicle** on a best-effort basis.

## Reporting a vulnerability

Please **do not** open a public issue for security reports.

1. Prefer **GitHub Security Advisories**: repository → **Security** → **Report a vulnerability**
2. Or open a private channel via the maintainer account [@xvyimu](https://github.com/xvyimu)

We aim to acknowledge reports within **48 hours** and share a remediation plan within **14 days** for confirmed issues. High-severity issues are prioritized.

## Scope notes

- Do not include secrets, production credentials, or personal data in reports beyond what is needed to reproduce.
- Out of scope: denial-of-service against third-party infrastructure, social engineering, physical attacks.

## Public API surface (rate limits)

Unauthenticated Route Handlers (`GET /api/search`, `GET /api/preview/[slug]`, `POST /api/csp-report`) use an **in-process fixed-window Map** per Node isolate. Counts are **not** shared across serverless isolates; missing `x-vercel-forwarded-for` falls back to a shared `anonymous` bucket. Application limits are best-effort — production hard quotas belong on **Vercel Firewall / WAF**.

Operator checklist (no secrets): [`docs/ops/public-api-rate-limit-boundary.md`](./docs/ops/public-api-rate-limit-boundary.md). HTTP contract: [`docs/API.md`](./docs/API.md).
