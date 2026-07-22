# Chronicle deps hygiene wave report · 2026-07-22

| Field     | Value                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Task      | **T-CH-002** (Orca `task_74714fdecc5e` / dispatch `ctx_95906533e34f`)                                                              |
| Node      | `/ch/ops/deps`                                                                                                                     |
| Agent     | QA                                                                                                                                 |
| Priority  | P0                                                                                                                                 |
| Repo      | `D:\Chronicle` · branch `master` · base tip `5b75391` (T-CH-001)                                                                   |
| Scope     | Dependency & CI hygiene re-scan only — **no** product source changes, **no** broad dependency upgrades, **no** fabricated GSC/Bing |
| Prior     | [wave-hygiene-2026-07-22.md](./wave-hygiene-2026-07-22.md) (T-CH-001)                                                              |
| Board     | [L2-P0-action-board-2026-07-22.md](./L2-P0-action-board-2026-07-22.md)                                                             |
| Checklist | [L2-hygiene-checklist.md](./L2-hygiene-checklist.md)                                                                               |

---

## 1. Commands run

| #   | Command                                                               | Exit code | Result                                                                                            |
| --- | --------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| 1a  | `pnpm audit --audit-level=high` (default registry / npmmirror)        | **1**     | `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS` — mirror has no audit bulk endpoint                          |
| 1b  | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high` | **0**     | `No known vulnerabilities found`                                                                  |
| 2   | `pnpm check:ops-readiness`                                            | **0**     | Readiness report printed; GSC/Bing remain **blocked-human**                                       |
| 3   | `pnpm outdated` (report only)                                         | **1**     | Outdated packages listed (exit 1 is expected when any package is behind; **no upgrades applied**) |
| 4   | `gh api repos/xvyimu/Chronicle/dependabot/alerts`                     | **403**   | Dependabot alerts **disabled** for this repository                                                |

### 1.1 Audit (P0-Audit)

**Default registry (failed — not a vuln finding):**

```text
[WARN] Unsupported engine: wanted: {"node":"22.x"} (current: {"node":"v24.16.0","pnpm":"11.8.0"})
[ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS] The audit endpoint (at https://registry.npmmirror.com/-/npm/v1/security/advisories/bulk) doesn't exist.
This issue is probably because you are using a private npm registry and that endpoint doesn't have an implementation of audit.
AUDIT_EXIT=1
```

**Official npm registry (authoritative for this wave):**

```text
[WARN] Unsupported engine: wanted: {"node":"22.x"} (current: {"node":"v24.16.0","pnpm":"11.8.0"})
No known vulnerabilities found
AUDIT_EXIT=0
```

| Metric                         | Value                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| High+ known vulnerabilities    | **0** (via `registry.npmjs.org`)                                                            |
| Default-registry audit usable? | **No** — npmmirror lacks security advisories bulk endpoint                                  |
| Engine note                    | Local Node **v24.16.0** vs `package.json` engines `22.x` — warning only; CI targets Node 22 |

**Ops note for CI/docs:** Prefer documenting  
`pnpm audit --registry=https://registry.npmjs.org --audit-level=high`  
when the machine default registry is a Chinese mirror (npmmirror / similar). A bare `pnpm audit` on mirror is a **tooling false failure**, not a package vulnerability.

### 1.2 Ops readiness

Script: `package.json` → `check:ops-readiness` → `tsx scripts/check-ops-readiness.ts`  
Mode: default (no `--live`); production probe intentionally skipped this wave.

| Item                        | Status                              | Notes                                                                                         |
| --------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Google Search Console       | **blocked-human**                   | Engineering/SEO surface ready (sitemap/robots); DNS verify + submit still needs account owner |
| Bing Webmaster              | **blocked-human**                   | Prefer import after GSC; no separate fake completion                                          |
| Vercel Speed Insights p75   | engineering-ready / waiting samples | No token + insufficient samples → **must not** Lighthouse-substitute                          |
| External search engine eval | not triggered                       | 20 published posts; threshold 200                                                             |
| Body-image LQIP             | not triggered                       | `public/images/blog` empty; project blur OK                                                   |
| prose/article-ui CSS sink   | not triggered                       | Shared about+blog consumers                                                                   |
| Cache Components            | not triggered                       | No external data/ISR need                                                                     |

`OPS_EXIT=0` (script exit 0; blocked-human items are reported, not failed as code defects).

---

## 2. Human / account items (still **blocked-human**)

| Board ID | Item                           | Status            | Why not auto-closed                                                                                                       |
| -------- | ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| P0-GSC   | Google Search Console property | **blocked-human** | Requires domain DNS verification and sitemap submit under the owner’s Google account. **Not** claimed complete this wave. |
| P0-Bing  | Bing Webmaster                 | **blocked-human** | Depends on GSC path (import). **Not** claimed complete; no fabricated index/coverage numbers.                             |

Explicit non-actions: no large dependency upgrades, no lockfile churn, no GardenExplorer refactor, no fake GSC/Bing metrics.

---

## 3. Outdated / major drift (report only — **not upgraded**)

`pnpm outdated` exit **1** (packages behind latest). **No** `pnpm update` / lockfile write in this wave.

### 3.1 Patch/minor behind (low risk if ever triaged)

| Package                  | Current | Latest  |
| ------------------------ | ------- | ------- |
| next                     | 16.2.9  | 16.2.10 |
| eslint-config-next       | 16.2.9  | 16.2.10 |
| @next/bundle-analyzer    | 16.2.9  | 16.2.10 |
| react / react-dom        | 19.2.4  | 19.2.7  |
| playwright / @playwright | 1.61.0  | 1.61.1  |
| vitest / @vitest/ui      | 4.1.9   | 4.1.10  |
| tailwindcss / postcss    | 4.3.1   | 4.3.3   |
| radix-ui                 | 1.6.1   | 1.6.4   |
| prettier                 | 3.9.3   | 3.9.6   |
| fuse.js                  | 7.4.2   | 7.5.0   |
| lint-staged              | 17.0.8  | 17.1.0  |
| shiki                    | 4.2.0   | 4.3.1   |
| tsx                      | 4.22.4  | 4.23.1  |
| rehype-pretty-code       | 0.14.3  | 0.14.4  |

### 3.2 Major version drift (do **not** auto-bump without ADR)

| Package                   | Current | Latest | Notes                                      |
| ------------------------- | ------- | ------ | ------------------------------------------ |
| eslint                    | 9.39.x  | 10.x   | Major; ecosystem plugin readiness first    |
| typescript                | 5.9.x   | 7.x    | Major; large type-check surface            |
| @types/node               | 20.x    | 26.x   | Align with engines `node: 22.x` if bumping |
| @testing-library/jest-dom | 6.x     | 7.x    | Major                                      |
| feed                      | 5.x     | 6.x    | Major                                      |
| js-yaml                   | 4.x     | 5.x    | Major                                      |

### 3.3 Dependabot / GitHub alerts

| Check                          | Result                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `.github/dependabot.yml`       | Present — weekly npm + github-actions; PR limit 5; groups next/react/playwright |
| Open Dependabot **alerts** API | **403** — “Dependabot alerts are disabled for this repository”                  |
| Open Dependabot PRs            | Not enumerated this wave (alerts API unavailable; no upgrade action)            |

Optional P1 for maintainers: enable Dependabot security alerts on `xvyimu/Chronicle` if desired for signal; config file already schedules update PRs.

---

## 4. Secrets / sensitive data hygiene (spot check)

| Check                             | Result                                                 |
| --------------------------------- | ------------------------------------------------------ |
| Report fabricates credentials     | **No** — none introduced                               |
| This report / docs commit payload | Contains **no** secret values, tokens, or private keys |
| Wave scope                        | Ops docs only; no product source or env file edits     |

**Conclusion for T-CH-002:** no key material written into `docs/ops/wave-hygiene-deps-2026-07-22.md` or other deliverables of this task.

---

## 5. Scope discipline

| Constraint                   | Observed                                         |
| ---------------------------- | ------------------------------------------------ |
| No product / business source | Only `docs/ops/wave-hygiene-deps-2026-07-22.md`  |
| No large dependency upgrades | Audit + outdated report only; lockfile untouched |
| No fake GSC/Bing             | Human items left **blocked-human**               |
| No stack rewrite             | Next 16 / React 19 retained as-is                |
| Working tree pre-commit      | Clean at `5b75391` before report write           |

---

## 6. Verdict (task acceptance)

| Gate                                                           | Pass?               |
| -------------------------------------------------------------- | ------------------- |
| Audit result recorded (incl. mirror failure + official exit 0) | **Yes**             |
| High+ vulns via npmjs.org                                      | **0**               |
| `pnpm check:ops-readiness` exit 0 with honest blocked-human    | **Yes**             |
| GSC/Bing not falsely marked done                               | **Yes**             |
| Report on disk with exit codes                                 | **Yes** (this file) |
| No business source edits                                       | **Yes**             |
| No broad upgrades                                              | **Yes**             |

**Overall:** T-CH-002 deps hygiene wave is **green** for automated gates. Residual: GSC → Bing (**blocked-human**); optional P1 (enable Dependabot alerts, patch/minor triage, major ADR backlog). CI authors should pin audit to `registry.npmjs.org` when local default is npmmirror.
