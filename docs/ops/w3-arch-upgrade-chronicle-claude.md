# W3 · Chronicle · Claude 实现报告

| Field                | Value                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| Agent                | **claude**（solo）                                                                  |
| Wave                 | **W3** · `portfolio-arch-upgrade-2026h2`                                            |
| Product              | Chronicle                                                                           |
| Worktree（绝对路径） | `C:\Users\yuanjia\orca\workspaces\Chronicle\w3-ch-claude`                           |
| Branch               | `xvyimu/w3-ch-claude`                                                               |
| Tip（开工 / HEAD）   | `e07086d` · merge(master): integrate form-stack SSOT before W2 land                 |
| 报告路径             | `docs/ops/w3-arch-upgrade-chronicle-claude.md`（本文件）                            |
| 共享题单             | `D:\orca\.planning\portfolio-arch-upgrade-2026h2\prompts\w3-shared.md` · `w3-ch.md` |
| 分仓卡               | `repos/ch.md` · W2 报告 `docs/ops/w2-arch-upgrade-chronicle-claude.md`              |

---

## 1. 做了什么

### 1.1 性能预算表

| 项       | 说明                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| 文档     | **`docs/ops/perf-budget-2026-07.md`**（新）                                                                         |
| 内容     | 核心/扩展路由 × Lab LCP/CLS/TBT/Perf；RUM 字段目标；静态 JS/CSS/SRI 策略；渲染/数据路径；可跑 check 表 + 本 wt exit |
| 对齐     | 阈值与 `lighthouse.config.js` · `check-bundle-budget.ts` · `performance-baseline.md` 一致                           |
| 本波范围 | **文档 + 门禁复验**；未做路由/样式大改、未重跑全量 LH（CI 权威；本机 Node 24 EPERM 风险）                           |

### 1.2 IA 收口（seriesSlug 残余）

| 项   | 说明                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| 残余 | `docs/content-workflow.md` §9「写文章时」仍只写「相同 series」，未提 `seriesSlug`                            |
| 修复 | 写作指引对齐 W2 约定：同 `series` + 同 `seriesSlug` + 递增 `seriesOrder`；改名不改 slug；新连载建议显式 slug |
| 草案 | `content-ia-draft-2026-07.md`：性能预算行标 **W3 已做**；变更记录补 W3                                       |
| 代码 | schema / series / 存量 5 篇 frontmatter **无需再改**（W2 已齐）                                              |

### 1.3 SRI + audit high 复跑

| #   | Command                                                               | Exit  | Result                         |
| --- | --------------------------------------------------------------------- | ----- | ------------------------------ |
| 1   | `pnpm test:sri`                                                       | **0** | 6 pass · 0 fail                |
| 2   | `pnpm check:sri-smoke`                                                | **0** | offline gate PASS              |
| 3   | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high` | **0** | No known vulnerabilities found |

未改 `next.config` SRI 默认；未触碰生产 / Vercel `ENABLE_SRI` 以外的 flip 动作。

### 1.4 运营清单刷新

| 项                    | 说明                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| 新清单                | **`docs/ops/ops-checklist-2026-07.md`**：GSC/Bing 仍 **`blocked_auth`**；工程可自动命令表；明确不做 |
| P0 board              | `L2-P0-action-board-2026-07-22.md` 补 W3 状态列 + 链到 ops-checklist / perf-budget                  |
| `check:ops-readiness` | **exit 0**（GSC/Bing 阻塞项为预期人账，非工程失败）                                                 |

### 1.5 stack-matrix W3 列

- 更新 [`docs/ops/stack-matrix-2026-07.md`](./stack-matrix-2026-07.md)：波次标到 W3；表增 **W3 已做**；架构主刀勾选性能预算 + 运营刷新。

### 1.6 聚焦验证

| #   | Command                                                           | Exit  | Result                      |
| --- | ----------------------------------------------------------------- | ----- | --------------------------- |
| 4   | `pnpm exec vitest run`（series / frontmatter / content-snapshot） | **0** | 3 files · **28** tests pass |
| 5   | `pnpm typecheck`                                                  | **0** | 全绿                        |
| 6   | `pnpm check:ops-readiness`                                        | **0** | 见上                        |

---

## 2. 没做什么（题单 + 共享禁止）

| 项                                                      | 原因                                                    |
| ------------------------------------------------------- | ------------------------------------------------------- |
| 换 Astro / Vue / 框架                                   | 红线                                                    |
| 生产 SRI / CSP 策略代码 flip                            | 人 gate · W3 默认禁；生产 env 侧 SRI 已存在不属本波改动 |
| GSC / Bing 代登                                         | blocked-human                                           |
| 伪造 p75 / sitemap「已提交」                            | 证据纪律                                                |
| GardenExplorer 大重构                                   | 题单禁止                                                |
| 全量 production build + 本地 Lighthouse / bundle-budget | 非验收强制；CI 仍强制；本机 Node 24 风险                |
| `git push` / 合 master / 开 PR                          | 总控 · 用户要求 no push                                 |
| monorepo / 换栈 rewrite                                 | 禁止                                                    |

**延期书（非沉默 DEFER）：**

| 项                          | 阻塞                                    | 解除条件                                          |
| --------------------------- | --------------------------------------- | ------------------------------------------------- |
| GSC 域名验证 + 提交 sitemap | 用户 Google 账号 + DNS 写权限           | 人在场按 ops-deferred §3                          |
| Bing 导入                   | 依赖 GSC                                | GSC 成功后同窗口导入                              |
| RUM 六页 p75                | 只读 Vercel 权限 + 足够样本             | 授权后回填 performance-baseline；**禁用 LH 代填** |
| 本地 LH / bundle 再实测     | 需 production build；Node 24 EPERM 风险 | CI Node 22 或本机切 22 后按需                     |

---

## 3. 验证摘录

### 3.1 `pnpm test:sri`

```text
✔ extracts only next-static script and stylesheet link tags
✔ expect on passes when at least one sha384 integrity present
✔ expect on fails when no integrity
✔ expect off passes with zero integrity attrs
✔ expect off fails when integrity present
✔ absolute next static urls are in scope
ℹ tests 6 · pass 6 · fail 0
TEST_SRI_EXIT=0
```

### 3.2 `pnpm check:sri-smoke`

```text
Chronicle SRI smoke
mode: offline
PASS  next-config-sri-gate: ENABLE_SRI=1 gate + sha384 + sriExperiment present
PASS  local-build-artifacts: skip (no .next); offline gate-only mode
SRI_SMOKE_EXIT=0
```

### 3.3 audit

```text
No known vulnerabilities found
AUDIT_EXIT=0
```

### 3.4 vitest / typecheck / ops

```text
Test Files  3 passed (3)
Tests  28 passed (28)
VITEST_EXIT=0
TSC_EXIT=0
OPS_EXIT=0
```

### 3.5 环境注记

| 项           | 值                                                        |
| ------------ | --------------------------------------------------------- |
| 本机 Node    | **v24.16.0** → engines `22.x` **WARN only**               |
| pnpm         | **11.8.0**                                                |
| CI 目标 Node | **22**                                                    |
| Worktree     | `C:\Users\yuanjia\orca\workspaces\Chronicle\w3-ch-claude` |
| 开工 tip     | `e07086d`                                                 |

---

## 4. 变更文件清单（相对 tip `e07086d`）

```text
# 性能预算
docs/ops/perf-budget-2026-07.md

# 运营清单
docs/ops/ops-checklist-2026-07.md
docs/ops/L2-P0-action-board-2026-07-22.md

# IA 残余 + 草案
docs/content-workflow.md
docs/ops/content-ia-draft-2026-07.md

# 栈矩阵
docs/ops/stack-matrix-2026-07.md

# 本报告
docs/ops/w3-arch-upgrade-chronicle-claude.md
```

无业务代码 / 无 frontmatter / 无 snapshot 变更（W2 已齐）。

---

## 5. 验收对照（w3-ch.md）

| 验收项                                       | 状态                                       |
| -------------------------------------------- | ------------------------------------------ |
| 性能预算表 `docs/ops/perf-budget-2026-07.md` | ✓                                          |
| 能跑的 check 记 exit                         | ✓ SRI · smoke · audit · vitest · ops · tsc |
| IA seriesSlug 残余修复                       | ✓ content-workflow 写作指引                |
| SRI + audit high = 0                         | ✓                                          |
| 运营清单刷新（GSC 仍人）                     | ✓ ops-checklist + P0 board                 |
| 报告在本 worktree                            | ✓                                          |
| 无 push / 无 stack rewrite / 无生产 flip     | ✓                                          |

---

## 6. 总控合入提示

- 分支：`xvyimu/w3-ch-claude`
- 纯 docs 增量；与 W2 代码正交
- 可本地 commit；**本 agent 不 push**
- 建议 commit message：

```text
docs(ops): W3 perf budget + ops checklist + SRI/audit re-run
```
