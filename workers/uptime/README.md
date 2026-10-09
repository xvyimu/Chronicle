# Chronicle Uptime Worker

Cloudflare Worker with a Cron Trigger that replaces the GitHub Actions
`schedule` workflow (which never fired — see
[D-039](../../docs/14-decision-log.md)).

## Why a Worker, not GitHub Actions

GitHub Actions `schedule` events silently never triggered for 2+ hours after
the workflow was merged to master, despite correct YAML, `state=active`, and
no fork. Community reports show this is a known platform-side issue with no
reliable fix. Cloudflare Cron Triggers run on Cloudflare's own machines and
are dependable.

A same-zone Worker `fetch()` to the site's origin also bypasses Bot Fight
Mode by default (no `global_fetch_strictly_public`), so it sees the real
origin — not a Cloudflare challenge page.

## Deploy

```bash
cd workers/uptime
npx wrangler deploy
```

Then set secrets:

```bash
# Fine-grained PAT with issues:write on xvyimu/Chronicle
npx wrangler secret put GITHUB_TOKEN
# Repository in owner/repo format
npx wrangler secret put GITHUB_REPO    # → xvyimu/Chronicle
# Optional: Vercel alias for secondary probe
npx wrangler secret put VERCEL_ORIGIN_URL  # → https://blog-aijiai520.vercel.app
```

`SITE_URL` defaults to `https://incca.ccwu.cc` in the Worker code.

## Behavior

- Runs every 10 minutes via Cron Trigger (`*/10 * * * *`)
- Probes the CF domain (primary) + Vercel alias (secondary, if set)
- `2xx/3xx/403/429` → up; `5xx/000` → down
- Down → opens issue (label `uptime`), comments throttled to 1/hour
- Up → closes any open uptime issue

## Related

- [D-039](../../docs/14-decision-log.md) — decision and rationale
- [scripts/probe-health.ts](../../scripts/probe-health.ts) — the GitHub
  Actions version, kept as a fallback
- [.github/workflows/uptime.yml](../../.github/workflows/uptime.yml) —
  the GitHub Actions workflow (still in repo; `schedule` may never fire)
