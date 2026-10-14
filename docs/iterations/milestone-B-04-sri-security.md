# Milestone B-04 · SRI 与 CSP 违规上报

> 阶段：2026-07-22 ~ 2026-07-23 · 状态：**Completed（历史里程碑）**
> 证据基准：`701e09d` → `3111acc`
> 关联：[B-03](./milestone-B-03-garden-identity.md) · 后续 [B-05](./milestone-B-05-arch-upgrade.md)

---

## 1. 目标

CSP 保留 per-request nonce 的前提下，新增 **collect-only** 违规上报；评估并门控 **SRI**（Subresource Integrity）；清生产依赖漏洞。

## 2. 关键提交

| 日期       | commit    | 做了什么                                                        |
| ---------- | --------- | --------------------------------------------------------------- |
| 2026-07-22 | `701e09d` | `feat(security): T3 CSP violation reporting + SRI flag gating`  |
| 2026-07-22 | `55a75e2` | 简化 T3 CSP 上报 + SRI 门                                       |
| 2026-07-22 | `4e5dfff` | `perf(security): keep csp-report off the search barrel`         |
| 2026-07-22 | `1097c32` | 接受生产 SRI + 标记 Giscus env 完成                             |
| 2026-07-22 | `2aea2a4` | 吸收 Dual-B Codex 本地 SRI checker（wave7）                     |
| 2026-07-22 | `3111acc` | `fix(deps): override sharp>=0.35 and fast-uri>=3.1.4 for audit` |
| 2026-07-23 | `7cc4b18` | `fix(deps): bump next to 16.2.11 for high audit CVEs`           |
| 2026-07-22 | `078a056` | Merge PR #15                                                    |

## 3. 实现步骤

### 3.1 CSP 违规上报（`701e09d`）

- 新增 `src/app/api/csp-report/route.ts`：collect-only 上报端点，**不落库、不外发、不回显**。
- `next.config.ts` 加 `ENABLE_SRI` 门控开关。
- `4e5dfff`：把 csp-report 从 search barrel 拆出 + 提前丢 Content-Length，避免它被搜索模块牵连。

### 3.2 SRI 评估与启用（`1097c32` · ADR-0005）

`docs/adr/0005-sri-over-nonce-evaluation.md`：

> **Status: Accepted**（enabled in production via `ENABLE_SRI=1`）

生产证据：Vercel Production `ENABLE_SRI=1`；deploy `dpl_2EcxgkhP84U7jE3BuQAnFipef6DD`；首页 `/_next/static` scripts 带 `integrity="sha384-…"`，同时保留 CSP nonce。

`docs/ops/ch-w1-sri-2026-07-23.md`：`pnpm audit --audit-level=high` 初跑 4× high on `next@16.2.9`（GHSA-6gpp-xcg3-4w24 等）→ 升 16.2.11 后 **0 known vulns**；`pnpm test:sri` 6/6；build 后 `check:sri` `total=8 protected=6 unprotected=2`。

### 3.3 本地 SRI checker（`2aea2a4`）

吸收 Dual-B Codex 的本地 SRI 检查脚本，形成 `pnpm check:sri` / `check:sri-smoke` / `test:sri` 三件套。沿用至今（`docs/ops/sri-smoke.md`）。

## 4. 涉及文件

**新增**：`src/app/api/csp-report/route.ts` · `src/lib/csp.ts`（CSP 构建器）· `scripts/check-sri*.mjs` · `docs/adr/0005-sri-over-nonce-evaluation.md` · `docs/ops/sri-smoke.md`
**修改**：`next.config.ts`（`ENABLE_SRI`）· `src/proxy.ts`（`report-to`/`report-uri`）· `pnpm-workspace.yaml`（overrides）· `package.json`

## 5. 数据或接口变化

- **新增 API**：`POST /api/csp-report`（collect-only）。
- 环境变量：`ENABLE_SRI=1` 门控。

## 6. 验收结果

| 时点       | 命令/指标       | 结果                                | 出处                               |
| ---------- | --------------- | ----------------------------------- | ---------------------------------- |
| 2026-07-22 | `pnpm audit`    | 4× high → 升 16.2.11 后 0 vulns     | `docs/ops/ch-w1-sri-2026-07-23.md` |
| 2026-07-22 | `pnpm test:sri` | 6/6                                 | 同上                               |
| 2026-07-22 | `check:sri`     | total=8 protected=6 unprotected=2   | 同上                               |
| 生产       | SRI 生效        | 首页 `integrity="sha384-…"` + nonce | ADR-0005                           |

## 7. 遗留问题

- SRI 与 PPR 分轨（未合并评估）。
- 回滚方式：去掉 Production `ENABLE_SRI` 后 redeploy。

## 8. 与今日的差异

| 项       | 本阶段（2026-07-23） | 今日（2026-10-14）                            |
| -------- | -------------------- | --------------------------------------------- |
| SRI      | 生产开启             | 沿用（`ENABLE_SRI=1`）                        |
| CSP 上报 | `/api/csp-report`    | 沿用 + 新增 `/api/client-error`（2026-10-09） |
| CSP 指令 | nonce + report-to    | 沿用                                          |
