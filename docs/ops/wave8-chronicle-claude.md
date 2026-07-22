# Wave8 · Chronicle · Claude 实现报告

| Field       | Value                                                                             |
| ----------- | --------------------------------------------------------------------------------- |
| Agent       | **claude**                                                                        |
| Wave        | Wave8 crosscut                                                                    |
| Product     | Chronicle                                                                         |
| Worktree    | `C:\Users\yuanjia\orca\workspaces\Chronicle\wave8-ch-claude`                      |
| Branch      | `xvyimu/wave8-ch-claude`                                                          |
| Tip (start) | `2aea2a4` feat(scripts): absorb Dual-B Codex local SRI checker (wave7)            |
| Scope       | docs 链 SRI 三脚本 + 本地验证 exit code                                           |
| Forbidden   | 真 publish · D7 · 生产 CSP/RLS · ISS 功能 · 生产 `ENABLE_SRI` flip · push/合 main |

---

## 1. 做了什么（一刀）

### 1.1 `docs/overview.md` 链入 SRI 脚本

- 当前维护文档表新增行 → [`docs/ops/sri-smoke.md`](./sri-smoke.md)
- 新增小节 **「SRI 本地验证命令（不改生产 env）」**：
  - `pnpm check:sri-smoke`
  - `pnpm check:sri -- --file <html> --expect on|off`
  - `pnpm test:sri`
- 明确 **禁止** 未授权切换生产 `ENABLE_SRI`；本地 on/off build 指向既有 `sri-smoke.md`

### 1.2 验证既有 wave7 资产

脚本与 package scripts 已在 tip `2aea2a4` 就绪（本波不改脚本实现）：

| Script            | package.json | 实现                          |
| ----------------- | ------------ | ----------------------------- |
| `check:sri-smoke` | ✓            | `scripts/check-sri-smoke.mjs` |
| `check:sri`       | ✓            | `scripts/check-sri.mjs`       |
| `test:sri`        | ✓            | `scripts/check-sri.test.mjs`  |

---

## 2. 没做什么

| 项                                                | 原因                                  |
| ------------------------------------------------- | ------------------------------------- |
| 生产 `ENABLE_SRI` / Vercel env flip               | Wave8 禁；owner gate                  |
| 全量 `pnpm build` + on/off `check:sri` 对 `.next` | 可选重活；本波用 unit + offline smoke |
| D7 / 生产 CSP·RLS / ISS 功能 / 真 publish         | 共享禁区                              |
| `git push` / 开 PR / merge 默认分支               | 总控合入                              |
| 改 `next.config` 默认 SRI 行为                    | 不在范围                              |

---

## 3. 验证命令 + exit code

在 **本 worktree** 执行（`C:\Users\yuanjia\orca\workspaces\Chronicle\wave8-ch-claude`）。

| #   | Command                          | Exit code | Result                                                      |
| --- | -------------------------------- | --------- | ----------------------------------------------------------- |
| 1   | `pnpm test:sri`                  | **0**     | 6 pass · 0 fail（`node --test scripts/check-sri.test.mjs`） |
| 2   | `pnpm check:sri-smoke`           | **0**     | offline gate PASS；无 `.next` 时 skip artifacts             |
| 3   | `pnpm check:sri -- --help`       | **0**     | usage 打印正常                                              |
| 4   | overview 含三脚本链接 / ops 表项 | **n/a**   | 见 diff                                                     |

### 3.1 `pnpm test:sri` 摘录

```text
✔ extracts only next-static script and stylesheet link tags
✔ expect on passes when at least one sha384 integrity present
✔ expect on fails when no integrity
✔ expect off passes with zero integrity attrs
✔ expect off fails when integrity present
✔ absolute next static urls are in scope
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

### 3.2 `pnpm check:sri-smoke` 摘录

```text
Chronicle SRI smoke
mode: offline
PASS  next-config-sri-gate: ENABLE_SRI=1 gate + sha384 + sriExperiment present
PASS  local-build-artifacts: skip (no .next); offline gate-only mode
SRI_SMOKE_EXIT=0
```

### 3.3 环境注记

- Node **v24.16.0** vs engines `22.x` → pnpm engine **WARN only**
- 本 worktree 首次安装依赖后跑测；脚本无额外 runtime 依赖

---

## 4. 变更文件清单（相对 tip `2aea2a4`）

```text
docs/overview.md                    (edit · SRI 表项 + 三命令)
docs/ops/wave8-chronicle-claude.md  (new · 本报告)
```

---

## 5. 总控合入提示

- 分支：`xvyimu/wave8-ch-claude`
- 仅 docs 一刀；与 wave7 SRI checker 正交、无生产 env 触碰
- 建议 squash/merge 后由总控 push；本 agent **不** push
