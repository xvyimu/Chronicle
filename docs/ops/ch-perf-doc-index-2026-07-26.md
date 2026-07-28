# Chronicle · 性能文档目录索引 · 2026-07-26

> **波次：** `ch-opt-a11y-budget-doc`（WAVE-2）  
> **目的：** 本仓已有性能相关文档较多，本文提供导航索引，按标准层次排列。

---

## 1. 导航索引

### 1.1 性能基线与预算（权威 SSOT）

| 文档                            | 路径                                              | 内容摘要                                                             |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| **性能基线**                    | `docs/performance-baseline.md`                    | LH desktop/mobile 历史分数、CWV 记录、Baseline Log                   |
| **性能预算表**                  | `docs/ops/perf-budget-2026-07.md`                 | 路由 LCP/CLS/TBT 目标、静态策略、可跑 check 表、W3/W4 实测 exit code |
| **启动基线**                    | `docs/launch-baseline.md`                         | 上线前全量审计基线                                                   |
| **a11y + budget + RUM 索引**    | `docs/ops/ch-a11y-budget-index-2026-07-26.md`     | 无障碍门禁、LH 预算、RUM 数据面、CI 对齐表                           |
| **RUM / mobile LH residual 卡** | `docs/ops/ch-rum-ci-residual-board-2026-07-28.md` | 软 residual 下一波：mobile 探针 · RUM 人闸 · P0/P1/P2                |

### 1.2 性能优化波次（W1–W10 + FIX + INTEGRATE）

| 波次               | 文档                                                     | 内容摘要                         |
| ------------------ | -------------------------------------------------------- | -------------------------------- |
| **W1 架构升级**    | `docs/ops/w1-arch-upgrade-chronicle-claude.md`           | 首波架构升级：SRI 门闩分析       |
| **W2 架构升级**    | `docs/ops/w2-arch-upgrade-chronicle-claude.md`           | 第二波架构升级                   |
| **W3 架构升级**    | `docs/ops/w3-arch-upgrade-chronicle-claude.md`           | 第三波架构升级                   |
| **W4 架构升级**    | `docs/ops/w4-arch-upgrade-chronicle-claude.md`           | 第四波收口验证                   |
| **W6 Dual-B**      | `docs/ops/wave6-dual-b-chronicle-claude.md`              | SRI 双分支本地验证               |
| **W8 跨切**        | `docs/ops/wave8-chronicle-claude.md`                     | SRI 三脚本 + 本地验证、docs 链入 |
| **WAVE-2（本波）** | `docs/ops/ch-opt-a11y-budget-doc-evidence-2026-07-26.md` | 本波证据                         |

### 1.3 专项性能文档

| 文档              | 路径                                       | 内容摘要                             |
| ----------------- | ------------------------------------------ | ------------------------------------ |
| **Perf Scout**    | `docs/ops/ch-perf-scout-2026-07-24.md`     | Phase0 性能探查发现                  |
| **CSS 路由优化**  | `docs/ops/ch-perf-002-font-2026-07-24.md`  | 字体优化（CH-PERF-002）              |
| **CSP 守卫**      | `docs/ops/ch-perf-csp-guard-2026-07-24.md` | CSP 构建器 + 回归测试（CH-PERF-004） |
| **SRI W1**        | `docs/ops/ch-w1-sri-2026-07-23.md`         | SRI 门闩规格                         |
| **SRI Smoke**     | `docs/ops/sri-smoke.md`                    | SRI 本地验证命令                     |
| **安全/依赖索引** | `docs/ops/ch-security-deps-index.md`       | 安全依赖检查索引                     |

### 1.4 运营与组合

| 文档            | 路径                                | 内容摘要                            |
| --------------- | ----------------------------------- | ----------------------------------- |
| **运营门禁表**  | `docs/ops/ops-checklist-2026-07.md` | OPS-RUM/PERF/SRI 等状态             |
| **运营待办**    | `docs/ops-deferred-work-plan.md`    | 下半年 backlog（B2 RUM、B3 Garden） |
| **栈矩阵**      | `docs/ops/stack-matrix-2026-07.md`  | 技术栈终态                          |
| **L2 卫生清单** | `docs/ops/L2-hygiene-checklist.md`  | L2 级卫生检查                       |

### 1.5 架构与缓存

| 文档             | 路径                                                                | 内容摘要               |
| ---------------- | ------------------------------------------------------------------- | ---------------------- |
| **架构**         | `docs/architecture.md`                                              | 系统架构（含渲染路径） |
| **缓存组件迁移** | `docs/cache-components-migration.md`                                | 缓存组件迁移记录       |
| **架构优化研究** | `docs/architecture-optimization-research-2026-07-21.md`（v2/v3/v4） | 架构优化调研           |
| **激进架构升级** | `docs/architecture-upgrade-radical-c-2026-07-21.md`                 | 激进方案评估           |

---

## 2. 文档拓扑

```text
docs/
├── performance-baseline.md          # 历史基线（LH desktop/mobile）
├── launch-baseline.md               # 上线前基线
├── architecture.md                   # 架构（含渲染路径）
├── ops/
│   ├── perf-budget-2026-07.md       # ⭐ 性能预算 SSOT（路由预算 + 可跑 check）
│   ├── ch-a11y-budget-index-2026-07-26.md  # ⭐ a11y / LH / RUM / CI 索引
│   ├── ops-checklist-2026-07.md     # 运营门禁状态
│   ├── stack-matrix-2026-07.md      # 栈终态
│   ├── w1-arch-upgrade-*.md         # W1 实现报告
│   ├── w2-arch-upgrade-*.md         # W2 实现报告
│   ├── w3-arch-upgrade-*.md         # W3 实现报告
│   ├── w4-arch-upgrade-*.md         # W4 收口报告
│   ├── wave6-dual-b-*.md            # W6 Dual-B 报告
│   ├── wave8-*.md                   # W8 跨切报告
│   ├── ch-perf-scout-*.md           # Phase0 探查
│   ├── ch-perf-002-font-*.md        # 字体优化
│   ├── ch-perf-csp-guard-*.md       # CSP 守卫
│   ├── ch-w1-sri-*.md               # SRI 门闩
│   ├── sri-smoke.md                 # SRI 验证
│   └── ch-security-deps-index.md    # 安全依赖索引
```

---

## 3. 快速链接

| 场景                           | 首读文档                                                 |
| ------------------------------ | -------------------------------------------------------- |
| CWV 目标是多少？               | `perf-budget-2026-07.md` §2                              |
| a11y 门禁多严？                | `ch-a11y-budget-index-2026-07-26.md` §1                  |
| RUM 有数据吗？                 | `ch-a11y-budget-index-2026-07-26.md` §3 · residual board |
| mobile LH / RUM 下一波怎么做？ | `ch-rum-ci-residual-board-2026-07-28.md`                 |
| 上次优化波次做了什么？         | `w4-arch-upgrade-chronicle-claude.md`                    |
| 静态体积预算在哪？             | `scripts/check-bundle-budget.ts`                         |
| 运营还有哪些待办？             | `ops-checklist-2026-07.md`                               |
| 下半年性能优化计划？           | `ops-deferred-work-plan.md`                              |

---

## 4. 变更记录

| 日期       | 变更                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| 2026-07-26 | 首版：性能文档目录索引，含 W1–W8 + FIX + INTEGRATE 链接                 |
| 2026-07-28 | 链入 `ch-rum-ci-residual-board-2026-07-28.md`（mobile LH / RUM 下一波） |
