# Local SRI operator steps (wave7 · absorb Dual-B Codex)

> **No production env flip.** Use local/preview builds only.

## Scripts

| Command                                            | Role                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm check:sri-smoke`                             | Offline gate on `next.config` + optional `--live` production homepage (Dual-B Claude)             |
| `pnpm check:sri -- --file <html> --expect on\|off` | Assert sha384 presence/absence on `/_next/static/` script + stylesheet tags (Dual-B Codex absorb) |
| `pnpm test:sri`                                    | Unit tests for `scripts/check-sri.mjs`                                                            |

## Local on/off build (optional · heavy)

```bash
# SRI on
pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc ENABLE_SRI=1 pnpm build
pnpm check:sri -- --file .next/server/pages/500.html --expect on

# SRI off
pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc ENABLE_SRI=0 pnpm build
pnpm check:sri -- --file .next/server/pages/500.html --expect off
```

Notes:

- On builds may show **mixed** protected/unprotected static tags — `expect on` only requires ≥1 `sha384` on in-scope tags.
- Preload/font links are out of scope (not stylesheet SRI evidence).
- Production `ENABLE_SRI` remains an **owner gate** (see ADR / ops boards).
