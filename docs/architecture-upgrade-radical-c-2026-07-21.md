# 架构升级总计划 · 档 C 激进重构（表单决议）

> **状态**：规划 SSOT（2026-07-21）· **T1–T3 已合 master** · tip 见 `docs/handoff-to-agent.md`  
> **表单**：升级野心 = **C**；渲染/安全/内容/体验 **全选**  
> **生产锚点**：以 handoff / launch-baseline 为准（2026-07-22：`6b4937b`）  
> **路径**：`D:\Chronicle`（junction `D:\blog`）

---

## 1. 表单原文归档

| 维度      | 用户选择                                                                     |
| --------- | ---------------------------------------------------------------------------- |
| 野心档    | **C 激进重构**                                                               |
| 渲染/安全 | SRI 真预览验证 · **SRI 目标生产启用** · PPR/缓存组件 · CSP 报告端点          |
| 内容/搜索 | 构建期快照 · Fuse 固化索引 · 评估 Orama/Pagefind · **libSQL/Turso 只读副本** |
| 体验/花园 | E1 popover a11y · preview 契约+限流 · 力导向 Worker+预坐标 · 花园导出/多布局 |

---

## 2. 冲突消解（全选时的「真优先级」）

全选不是并行开 12 条战线，而是 **有序列车**。冲突与裁定：

| 冲突                        | 裁定                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Fuse 保持 vs Orama/Pagefind | **阶段 1 固化 Fuse 快照**；阶段 3 **A/B 评估** Orama 或 Pagefind，用延迟与中文召回证据二选一，禁止双引擎长期并存 |
| 构建快照 vs libSQL 副本     | **先快照文件**（CI artifact），再 **同步写入 libSQL**；Git 仍为内容 SSOT，libSQL 为只读服务面                    |
| SRI 预览 vs 立即生产启用    | **必须先 preview 绿** 再生产；生产启用与 PPR 分 PR                                                               |
| PPR vs 现有 nonce 动态文档  | 先做 **CSP report + 路由缓存审计**；PPR 用 **独立实验分支**，nonce 槽位方案写 ADR 后再合                         |
| 激进 C vs 仍要可回滚        | 采用 **monorepo 渐进** 或 **目录级管道左移**，禁止「一天删掉 repository」                                        |
| 花园导出 vs Worker          | **先 Worker + 预坐标**（正确性/性能），导出/多布局后置为兴奋型                                                   |

---

## 3. 目标架构（C 档终态）

```text
Git content/ (SSOT, PR 写作)
        │
        ▼
 content pipeline (CI)
  - validate Zod
  - emit snapshot/ (meta, html/ast, search docs, graph, positions)
  - upsert libSQL read replica (optional remote Turso)
        │
        ▼
 Next App Router (thin runtime)
  - static-ish article body from snapshot
  - dynamic chrome + CSP nonce (until PPR experiment lands)
  - SRI on static assets (after preview)
  - CSP report endpoint
        │
  ┌─────┴─────┐
  ▼           ▼
 /api/search  /api/preview   (统一 envelope；全局限流 → 先内存后 Upstash)
  Fuse→(后) Orama/Pagefind  投影无 content
        │
        ▼
 Client islands: popover (a11y) · garden (Worker, layouts, export)
```

**产品边界（C 档仍建议）**：主域仍是工程博客+作品集；花园可增强，**不**默认变成第二大脑 SaaS/多租户。

---

## 4. 列车编排（Merge Train）

### T0 · 宪章与护栏（0.5–1 天）· **已收口**

- [x] 本文件落盘
- [x] ADR：`2026-07-21-radical-upgrade-charter.md`（目标/非目标/回滚）
- [x] 成功度量方向与回滚矩阵（本文件 §5–§6；RUM p75 仍外部阻塞）
- [x] 明确：**每列车单独 PR + 可 revert**；生产部署另授权

### T1 · 体验与契约速赢（2–4 天）· 低破坏 · **已合**

不依赖 monorepo，立刻改善生产质量：

1. **E1** popover：视口防裁切、对比度、`aria`、触屏文案 — **已合**
2. **preview 契约**：与 search 对齐 `error`+`code`；try/catch 500；进程限流 120/60s — **已合**
3. **e2e**：文章页 wikilink hover 冒烟 — **已合**（`e2e/blog.spec.ts`）
4. 文档：`API.md` 错误码对称 — **已合**

**验收**：单元 **708**/95 绿（2026-07-22）；e2e 含 popover；生产 CSP 无新增违规。  
**状态**：**PR#14 MERGED**。

### T2 · 内容计算左移（1–2 周）· 中破坏 · **已合**

1. `pnpm content:build` → `generated/content-snapshot/` — **已合**
2. runtime `CONTENT_BACKEND`（prod 默认 snapshot / dev·test 默认 fs）— **已合**
3. CI rebuild + `git diff --exit-code generated/content-snapshot` — **已合**
4. 搜索经 postRepository 读固化 meta — **已合**

**验收**：`pnpm content:build` 幂等；旗标可回滚 fs。  
**状态**：**PR#14 MERGED**（与 T1 同列车）。

### T3 · 安全增强（1 周）· 中高破坏 · **门控已合；生产 SRI 未开**

1. CSP **`report-to` / report-uri 端点**（收集 only）— **已合** PR#15
2. `ENABLE_SRI=1` 门控 `experimental.sri: { algorithm: 'sha384' }` — **已合**；默认关
3. 本地 on/off 构建已验证；**Vercel Preview 仍需用户授权**
4. 生产 enable SRI = **独立授权**（ADR checklist）
5. 禁止同 PR 改 CSP 放宽 — 守住

**验收**：预览 HTML 含 integrity；CSP 仍 nonce；无大规模 report 噪音误报。  
**状态**：工程门控 **PR#15**；生产 SRI **未启用**。

### T4 · 搜索阶梯评估 · **已决策：维持 Fuse**

1. 现状：snapshot 固化 search docs + Fuse WeakMap（n=20）
2. Orama / Pagefind 全量 spike **不做**（规模门槛未到）
3. 中文查询集 / 双跑 **延后** 至 re-open 触发
4. ADR：**`2026-07-22-search-engine-keep-fuse.md` Accepted**（维持 Fuse）
5. 重开条件：≥200 文或 p95 证据（见 ADR）

### T5 · libSQL 只读副本（1–2 周）· 高破坏

1. Schema：posts / edges / search_docs
2. CI：snapshot → upsert Turso/local libSQL
3. `getPostBySlug` / graph 可选走 SQL（旗标 `CONTENT_BACKEND=fs|sqlite`）
4. 边缘读评估（若 runtime 允许）
5. 备份与「Git 重建副本」剧本

**验收**：从空库仅用 Git+pipeline 可重建；与快照 diff 为零关键字段。

### T6 · PPR / 缓存组件（1–2 周实验）· 高破坏

1. 独立分支 `exp/ppr-csp`
2. 文档：静态壳 vs 动态 nonce 洞设计 ADR
3. 仅 1–2 条路由试验
4. 失败则 **整支丢弃**，不污染 master

### T7 · 花园进阶（与 T2 坐标衔接）· **部分完成**

1. force layout **Worker** — 未做（n=20 主线程可接受；seed 后首屏不再全量迭代）
2. 使用 T2 预坐标，客户端只拖拽覆盖 — **已做**（`getGardenPositions` + `GardenExplorer.initialPositions`）
3. 多布局：力导向 / 径向 / 时间线 — 未做（兴奋型，见 TODO G2）
4. 导出 PNG/SVG（client）— 未做（兴奋型）
5. 节点规模阈值：>200 再谈 Canvas / Worker — 记入 TODO

### T8 · C 档结构（可选 monorepo，2–4 周）

**仅当 T2–T5 稳定后**：

```text
apps/web          # Next
packages/content  # pipeline + schema
packages/garden   # layout algorithms pure
packages/search   # engine adapters
```

或保持单仓 **packages 目录渐进**，避免过早 Nx/Turborepo 仪式。

### T9 · 明确非本计划默认（除非新表单）

- 多租户 / 账号系统
- Sanity 等 CMS 取代 Git SSOT
- 全站迁 Quartz/Astro
- AI 站内问答（可另开研究）
- `unsafe-inline` 换 SSG

---

## 5. 成功度量

| 指标               | 基线（约）   | C 档目标                       |
| ------------------ | ------------ | ------------------------------ |
| `pnpm test`        | 685/93       | 不降；关键新管线有测           |
| production build   | 107 页级     | 可增；时长监控                 |
| `/api/preview` p95 | 未建         | 建仪表；回归不恶化             |
| 搜索               | Fuse 内存    | 快照后稳定；换引擎需证明       |
| CSP                | nonce        | +report；SRI 后静态资产带 hash |
| 花园 INP           | 未系统采     | Worker 后拖拽更稳              |
| 重建               | 需全量读 MDX | Git+pipeline 可重建 SQL/快照   |

---

## 6. 回滚矩阵

| 列车   | 回滚                                 |
| ------ | ------------------------------------ |
| T1     | revert PR；无数据                    |
| T2     | 旗标回 fs runtime；删 generated 依赖 |
| T3 SRI | config 关 sri；重新部署              |
| T4     | 引擎适配器切回 Fuse                  |
| T5     | `CONTENT_BACKEND=fs`                 |
| T6     | 删除实验分支                         |
| T7     | 关 Worker 旗标，回主线程布局         |

---

## 7. 建议立即执行的下一步（需你点头）

**当前（2026-07-22）**：T0–T4 决策面已收口；T7 预坐标已接线。  
下一可选：Vercel Preview 跑 SRI checklist · T7 Worker/多布局（兴奋型）· T5 libSQL（高破坏，另授权）。

不推荐 monorepo 或生产 SRI+PPR 同周落地。

---

## 8. 授权检查表（执行前勾选）

| 动作                       | 默认                      |
| -------------------------- | ------------------------- |
| 写 ADR / 本计划 / 本地代码 | 需会话授权                |
| push / PR                  | 需明确                    |
| 生产 enable SRI            | **单独授权**              |
| 创建 Turso/外部 DB         | **单独授权 + 密钥不入库** |
| 合 master                  | 需明确                    |

---

_表单 C 全选的工程含义是「路线图最大化」，不是「本周全部写完」。执行以列车为单位。_
