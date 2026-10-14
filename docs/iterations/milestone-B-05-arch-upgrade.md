# Milestone B-05 · 架构升级 Wave（W1–W4）

> 阶段：2026-07-23 · 状态：**Completed（历史里程碑）**
> 证据基准：`44c10d0` → `b66af23`
> 关联：[B-04](./milestone-B-04-sri-security.md) · 后续 [B-06](./milestone-B-06-perf-waves.md)

---

## 1. 目标

组合包 `portfolio-arch-upgrade-2026h2` 的 W1–W4：收口栈矩阵、性能预算、运营清单（**文档 + 门禁复验，不做路由大改**）。同期做文档治理与开源身份补齐。

## 2. 关键提交

| 日期       | commit                | 做了什么                                                         |
| ---------- | --------------------- | ---------------------------------------------------------------- |
| 2026-07-23 | `44c10d0`             | W1 `docs(ops): stack-matrix + content IA draft + SRI regression` |
| 2026-07-23 | `9015ddf`             | W2 `feat(content): IA seriesSlug + snapshot hash harden`         |
| 2026-07-23 | `6d622ac` · `e07086d` | 形态与栈 SSOT（`PROJECT.md`）                                    |
| 2026-07-23 | `e256f5a`             | W3 `docs(ops): perf budget + ops checklist`                      |
| 2026-07-23 | `b66af23`             | W4 `docs(ops): stack-matrix closeout + perf/ops re-verify`       |
| 2026-07-23 | `0555824`             | `docs: add SECURITY.md vulnerability reporting policy`           |
| 2026-07-23 | `b1442e9`             | `docs: add CoC, CHANGELOG, editorconfig (OSS L1 P2)`             |
| 2026-07-23 | `4dba004`             | `feat(ui): V1a Atelier token alignment for Paper Gallery`        |
| 2026-07-23 | `3d19a2e`             | `docs: add Chronicle ARCHITECTURE_ASIS (ArchMap)`                |

## 3. 实现步骤

### 3.1 W1 栈矩阵（`44c10d0`）

新增 `docs/ops/stack-matrix-2026-07.md`、`docs/ops/content-ia-draft-2026-07.md`。

### 3.2 W2 IA 加固（`9015ddf`）

- `seriesSlug` schema 字段。
- `contentHash` 纳入 IA 字段，防止快照漂移漏检。

### 3.3 形态与栈 SSOT（`6d622ac` · `e07086d`）

`docs/PROJECT.md` 确立为「形态与唯一技术栈」SSOT。这是全局门闩（`~/.claude/specs/principle.md`「形态与技术栈」）在本仓的落点。

### 3.4 W3 性能预算 + 运营清单（`e256f5a`）

新增 `docs/ops/perf-budget-2026-07.md`、`docs/ops/ops-checklist-2026-07.md`。

### 3.5 开源身份补齐（`0555824` · `b1442e9`）

`SECURITY.md`（漏洞报告策略）、`CODE_OF_CONDUCT.md`、`CHANGELOG.md`、`.editorconfig`。

## 4. 涉及文件

**新增**：`docs/ops/{stack-matrix-2026-07,content-ia-draft-2026-07,perf-budget-2026-07,ops-checklist-2026-07}.md` · `docs/PROJECT.md` · `SECURITY.md` · `CODE_OF_CONDUCT.md` · `CHANGELOG.md` · `.editorconfig` · `docs/ops/ch-architecture-asis-2026-07.md`
**修改**：`src/lib/posts/schema.ts`（`seriesSlug`）· `src/lib/content-snapshot/build.ts`（contentHash）

## 5. 数据或接口变化

- 内容 schema：新增 `seriesSlug` 字段。
- `contentHash` 算法纳入 IA 字段。

## 6. 验收结果

`docs/ops/w4-arch-upgrade-chronicle-claude.md`：W4 复验 `pnpm test:sri` / `check:sri-smoke` / `audit high=0` / `typecheck` 全 exit 0；w3-scores CH **91**；本地 LH / bundle-budget 本 worktree **SKIP**（Node 24 风险，CI 仍强制）。

`docs/ops/perf-budget-2026-07.md` §5.1/§5.2 列 W3/W4 逐命令 exit code。

## 7. 遗留问题

- 本地 LH / bundle-budget 在 Node 24 下 SKIP —— 依赖 CI 强制。
- RUM p75 全程 `pending`（无 token）。

## 8. 与今日的差异

| 项          | 本阶段（2026-07-23）        | 今日（2026-10-14）    |
| ----------- | --------------------------- | --------------------- |
| PROJECT.md  | 刚确立为 SSOT               | 沿用（形态与栈 SSOT） |
| 开源文档    | SECURITY/CoC/CHANGELOG 补齐 | 沿用                  |
| 内容 schema | `seriesSlug`                | 沿用                  |
