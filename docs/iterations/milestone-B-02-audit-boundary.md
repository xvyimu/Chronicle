# Milestone B-02 · 审计加固与前后端逻辑边界

> 阶段：2026-07-16 ~ 2026-07-18 · 状态：**Completed（历史里程碑）**
> 证据基准：`569a54f` → `d1fa877`
> 关联：[B-01](./milestone-B-01-content-ops-search.md) · 后续 [B-03](./milestone-B-03-garden-identity.md)

---

## 1. 目标

落地 codex review 与 2026-07-17 全栈审计的跟进项；在同一 Next.js 应用内建立**可执行的逻辑前后端边界**（页面经 `src/server` 访问内容）；把根 TODO 里仅依赖账号或规模门槛的事项变成可执行手册 + 可自动分类的就绪门禁。

## 2. 关键提交

| 日期       | commit                | 做了什么                                                                            |
| ---------- | --------------------- | ----------------------------------------------------------------------------------- |
| 2026-07-16 | `569a54f`             | `fix(audit): land codex review follow-ups for search, cache, events, deploy`        |
| 2026-07-16 | `af6a919`             | `fix(perf): reduce article lab CLS and unstick lighthouse CI`                       |
| 2026-07-17 | `2f90b9d` · `b8df1ad` | 2026-07-17 全栈审计跟进                                                             |
| 2026-07-18 | `b99b279`             | `feat: finalize documentation gates and release hardening`（68 files, +2091/−1418） |
| 2026-07-18 | `a91a07d`             | `feat: establish frontend-backend logical boundary`                                 |
| 2026-07-18 | `96e0214`             | `feat: engineer deferred ops readiness and blur triggers`                           |
| 2026-07-18 | `815c212`             | `fix: focus first mobile navigation link`                                           |

## 3. 实现步骤

### 3.1 审计跟进（`569a54f` · `2f90b9d` · `b8df1ad`）

搜索、缓存、事件、部署的 codex review 项逐条落地。`af6a919` 单独修文章页实验室 CLS 并疏通 Lighthouse CI。

### 3.2 逻辑前后端边界（`a91a07d`）

- `src/lib/search/*` → `src/server/search/*`（服务端搜索移到 `server` 层）。
- 新增 `src/server/content/index.ts`：页面与 Route Handler 经 `src/server/content` 访问内容。
- 边界由测试守门（后来的 `src/lib/module-boundaries.test.ts`）：客户端与 `src/lib` 不得导入 `@/server`。

> 这条边界沿用至今，是 HANDOFF §3「不可破坏的架构边界」的一条。

### 3.3 运维就绪工程化（`96e0214`）

- 新增 `scripts/check-ops-readiness.ts`（`pnpm check:ops-readiness`）。
- 新增 `src/lib/ops-readiness.ts`：把延后事项自动分类为 `blocked_auth` / `not_triggered` / `engineering_ready_waiting_samples`。
- 新增 `docs/ops-deferred-work-plan.md`（157 行）：GSC/Bing/RUM 执行手册。

> 这套「延后事项不得伪装成无条件工程任务」的机制沿用至今，是 HANDOFF §6 与 TODO 的基础。

### 3.4 文档门禁（`b99b279`）

68 files, +2091/−1418：文档门禁收口 + 发布加固。`src/lib/check-production-content-script.test.ts`（+163）随此落地。

## 4. 涉及文件

**新增**：`src/server/content/index.ts` · `src/server/search/*` · `scripts/check-ops-readiness.ts` · `src/lib/ops-readiness.ts` · `docs/ops-deferred-work-plan.md`
**移动**：`src/lib/search/*` → `src/server/search/*`
**修改**：`.github/workflows/ci.yml` · `docs/*`

## 5. 数据或接口变化

无对外 API 变化。内部：内容访问入口收敛到 `src/server/content`。

## 6. 验收结果

`docs/archive/superpowers-runs/2026-07-18-frontend-backend-boundary/task_plan.md`：

> 状态：Completed / Archived（2026-07-18）
> 生产提交：`a91a07dc361392eef882a59993a6eb0017cb8a40`
> CI：`29631593044` success（quality / bundle-analyze / e2e / deploy）

`docs/archive/superpowers-runs/2026-07-18-deferred-ops-readiness/task_plan.md`：

> 状态：Completed / Archived（2026-07-18）· 工程提交：`96e0214`

## 7. 遗留问题

- 延后运营（GSC/Bing/RUM）仍 `blocked_auth` —— 至今未解，需真人账号。
- 逻辑边界测试（`module-boundaries.test.ts`）在本阶段建立，后于工作台重构期继续沿用。

## 8. 与今日的差异

| 项         | 本阶段（2026-07-18）  | 今日（2026-10-14）       |
| ---------- | --------------------- | ------------------------ |
| 服务端搜索 | `src/server/search/*` | **已删除**（2026-10-07） |
| 内容入口   | `src/server/content`  | 沿用                     |
| 运维就绪   | `check:ops-readiness` | 沿用                     |
