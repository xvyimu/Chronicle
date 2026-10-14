# Chronicle · 项目历史（从创建到完成）

> 状态：**当前维护版**（2026-10-14）
> 范围：2026-06-21 建仓 → 2026-10-13（HEAD `d792c21`），共 **293 个 commit**
> 定位：一条时间线，把分散在 `docs/`、`docs/ops/`、`docs/adr/`、`docs/archive/` 的材料串成「这个项目怎么长起来的」
> 性质：本文件是**总览与索引**。每个阶段的实现细节、验收数字在对应的 `milestone-*.md`；本文不重复正文，只给结论与指针。

---

## 0. 一句话

Chronicle（产品名「西江月博客」）是一个基于 Next.js 16 App Router 的个人博客兼作品集站点，MDX 本地内容驱动、严格 CSP nonce、Vercel 部署。它经历了**六次形态级演进**：从零搭骨架 → 编辑式内容站 → 数字花园 → 性能与安全加固 → 工作台重构 → 收尾精简。

## 1. 时间线总览

| 里程碑 | 时间窗             | 主题                              | 结果                                                                   |
| ------ | ------------------ | --------------------------------- | ---------------------------------------------------------------------- |
| A-01   | 2026-06-21 ~ 06-24 | 建站与内容体系                    | Next 16 骨架 + 分类体系 + CI/Lighthouse + Vercel 部署                  |
| A-02   | 2026-06-25 ~ 06-27 | 结构性重组与 CSP                  | 内容源抽象层 + `proxy.ts` + `/links` 导航                              |
| A-03   | 2026-06-28 ~ 06-30 | 编辑式首页与性能门禁              | 编辑式首页 + 首份性能基线 + 修生产空内容回归                           |
| A-04   | 2026-07-03 ~ 07-05 | 文档治理、shadcn 与 Paper Gallery | shadcn 视觉层 + Paper Gallery 首页 + 上线就绪收尾                      |
| B-01   | 2026-07-06 ~ 07-12 | 内容运营基线与服务端搜索          | UI/CSS 拆模块 + `launch-baseline.md` + 服务端 Fuse API                 |
| B-02   | 2026-07-16 ~ 07-18 | 审计加固与前后端逻辑边界          | `src/server/content` + 运维就绪门禁                                    |
| B-03   | 2026-07-19 ~ 07-22 | 数字花园与 Chronicle 身份         | wikilink/反链/力导向 + 内容快照 T2 + 包名独立                          |
| B-04   | 2026-07-22 ~ 07-23 | SRI 与 CSP 违规上报               | 生产 SRI 开启 + `csp-report` collect-only                              |
| B-05   | 2026-07-23         | 架构升级 Wave W1–W4               | 栈矩阵 + 性能预算 + 运营清单 + `PROJECT.md` SSOT                       |
| B-06   | 2026-07-24 ~ 08-04 | 性能 Wave CH-PERF-001~012         | 8 切片并行优化 + content pipeline 稳定化                               |
| C-01   | 2026-08-22 ~ 09-19 | 文档标准化、a11y 与提交门         | jsx-a11y 四条规则 + commitlint + ADR 统一 + 死链门禁                   |
| C-02   | 2026-09-20 ~ 09-30 | 依赖安全升级                      | next 16.3.5 修 critical RCE，prod audit 归零                           |
| D-01   | 2026-10-06 ~ 10-07 | **工作台重构**                    | 中性灰工作台 + 客户端 Fuse + 删评论/花园/links（详见 iteration-00~08） |
| D-02   | 2026-10-08 ~ 10-10 | 合并后收尾                        | a11y 对比度 + R12 CLS + 清死 CSS + post-deploy 改造 + 错误上报         |
| D-03   | 2026-10-10 ~ 10-13 | 搜索高亮、依赖合并与精简          | R14 词高亮 + 全仓精简 862 行 + TS6 修复                                |

## 2. 各阶段速览

### A-01 · 建站与内容体系（2026-06-21 ~ 06-24）

从零搭出 Next.js 16 个人博客：文章列表/详情、标签、项目页、Giscus 评论、分页、回到顶部。随后补 10 篇文章、建 6 分类体系、接 Lighthouse CI 与 Vercel 部署。
**关键证据**：`f2bf13b` 自报 115 单测 / 30 E2E / 69 页；`cbbcbbc` 自报 136 测试 / 90 静态页。
**→ 详见** [milestone-A-01-bootstrap.md](./milestone-A-01-bootstrap.md)

### A-02 · 结构性重组与 CSP（2026-06-25 ~ 06-27）

抽内容源抽象层（`parse-frontmatter.ts` / `content-source.ts`）；`middleware.ts` → `proxy.ts`（跟 Next 16.2 弃用）；给 14 篇文章补 source/license；上线 `/links`。
**埋雷**：CSP 中间件让根布局用上 `headers()` → 全站动态化 → 生产内容为空（A-03 才修）。
**→ 详见** [milestone-A-02-restructure-csp.md](./milestone-A-02-restructure-csp.md)

### A-03 · 编辑式首页与性能门禁（2026-06-28 ~ 06-30）

首页转编辑式叙事（`EditorialHero` + 4 个 section）；建立**首份性能基线** `docs/performance-baseline.md`；`posts.ts` 拆模块、4 动态路由收敛到 adapter、`globals.css`（2804 行）拆 10 模块；修生产空内容回归（91 页全静态）。
**关键证据**：Lighthouse CI run `28362770380`（`/` 0.85、文章页 CLS 0.13）。
**→ 详见** [milestone-A-03-editorial-home.md](./milestone-A-03-editorial-home.md)

### A-04 · 文档治理、shadcn 与 Paper Gallery（2026-07-03 ~ 07-05）

shadcn 视觉架构落地（ui/ 原语 + layout/ 组合）；首页重设计为 Paper Gallery；`/links` 扩到 10 类 123 条；加生产内容烟测 + 移动端 E2E。
**验收**：`493ba96` 时点 523 tests / 65 files / 47 E2E 全绿。
**→ 详见** [milestone-A-04-docs-shadcn.md](./milestone-A-04-docs-shadcn.md)

### B-01 · 内容运营基线与服务端搜索（2026-07-06 ~ 07-12）

博客 UI/CSS 拆模块；新增 `docs/launch-baseline.md`；搜索从纯客户端改为**服务端 Fuse API**（`/api/search`）以减首屏 payload。
**→ 详见** [milestone-B-01-content-ops-search.md](./milestone-B-01-content-ops-search.md)

### B-02 · 审计加固与前后端逻辑边界（2026-07-16 ~ 07-18）

`src/lib/search/*` → `src/server/search/*`；新增 `src/server/content`（页面经 server 层访问内容）；`check:ops-readiness` 运维就绪门禁 + `ops-deferred-work-plan.md`。
**验收**：`a91a07d` 生产部署；CI `29631593044` success。
**→ 详见** [milestone-B-02-audit-boundary.md](./milestone-B-02-audit-boundary.md)

### B-03 · 数字花园与 Chronicle 身份（2026-07-19 ~ 07-22）

实现 wikilink（G0）→ 反链（G1）→ 力导向图（G2）→ popover（G3）整条数字花园链路；内容快照 T2（`generated/content-snapshot/`）；包名 `blog` → `chronicle`。
**注**：花园整条链路在 D-01 工作台重构中**已删除**；wikilink 行内渲染保留。
**→ 详见** [milestone-B-03-garden-identity.md](./milestone-B-03-garden-identity.md)

### B-04 · SRI 与 CSP 违规上报（2026-07-22 ~ 07-23）

`POST /api/csp-report`（collect-only）；SRI 门控评估（ADR-0005，**生产开启**）；清 4 条 high 生产漏洞。
**→ 详见** [milestone-B-04-sri-security.md](./milestone-B-04-sri-security.md)

### B-05 · 架构升级 Wave W1–W4（2026-07-23）

栈矩阵、内容 IA（`seriesSlug`）、性能预算、运营清单收口；`docs/PROJECT.md` 确立为**形态与栈 SSOT**；补齐 SECURITY/CoC/CHANGELOG。
**→ 详见** [milestone-B-05-arch-upgrade.md](./milestone-B-05-arch-upgrade.md)

### B-06 · 性能 Wave CH-PERF-001~012（2026-07-24 ~ 08-04）

Phase 0 测绘 → 8 个互斥切片并行 → 集成；CSS 路由下沉、字体瘦身、RSC 边界收敛、搜索冷路径缓存；content pipeline 稳定化（`content:verify` fail-closed 进 CI）。
**诚实边界**：本波**未产出 post-wave Lighthouse 复测数字**（口径「CI 权威，本地默认不重跑」）。
**→ 详见** [milestone-B-06-perf-waves.md](./milestone-B-06-perf-waves.md)

### C-01 · 文档标准化、a11y 与提交门（2026-08-22 ~ 09-19）

补 4 条 jsx-a11y 规则；commitlint 提交信息门；按全局文档标准收敛文档落点、统一 ADR 命名编号（MADR 4）、交接文档统一为 `docs/HANDOFF.md`；死链门禁加 `file:///` 校验。
**→ 详见** [milestone-C-01-doc-standard.md](./milestone-C-01-doc-standard.md)

### C-02 · 依赖安全升级（2026-09-20 ~ 09-30）

next 16.3.5 修两条 critical RCE（`GHSA-p293-qw3h-jr36` / `GHSA-2xp9-vwfh-vxw4`）；prod audit 从 9 条 → **0**。
**→ 详见** [milestone-C-02-depsec.md](./milestone-C-02-depsec.md)

### D-01 · 工作台重构（2026-10-06 ~ 10-07）

站点从暖纸色 Paper Gallery 重构为中性灰 AI 工作台：删评论/花园/links/服务端搜索，加工作台外壳/客户端 Fuse/`/archive`/`/favorites`。**按 8 个迭代（00–07）+ 收尾迭代 08 推进**。
**→ 详见** [milestone-D-01-workspace-rebuild.md](./milestone-D-01-workspace-rebuild.md) 及 [iteration-00~08](./README.md)

### D-02 · 合并后收尾（2026-10-08 ~ 10-10）

处置 2026-10-07 审计的 P0/P1：修深色对比度（F1）、补页面测试（F5）、移动端点击区 40px（F6）、**修 R12 CLS**（`loading.tsx` 加 `minHeight: 100vh`）、清 43 个死类；CI `deploy` → `post-deploy`；探活上线又退役；客户端错误上报；作品集精简到 1 条。
**→ 详见** [milestone-D-02-closeout.md](./milestone-D-02-closeout.md)

### D-03 · 搜索高亮、依赖合并与全仓精简（2026-10-10 ~ 10-13）

R14 处置（词高亮补齐，正文索引/范围筛选定案不做）；R13 qs 范围化（audit 3→1）；合并 5 个 dependabot PR + 对齐 eslint-config-next；修 TS 6.0.3 mock；补 wikilink 门禁；**全仓精简净删 862 行**。
**→ 详见** [milestone-D-03-merge-cleanup.md](./milestone-D-03-merge-cleanup.md)

## 3. 技术栈演进

| 层    | 起点（2026-06）                             | 现在（2026-10-14）                   | 变化节点                       |
| ----- | ------------------------------------------- | ------------------------------------ | ------------------------------ |
| 框架  | Next 16.2.9                                 | Next 16.4.0                          | C-02 升 16.3.5；D-03 升 16.4.0 |
| React | 19.2.4                                      | 19.3.0                               | 2026-09-30 react 组升级        |
| 语言  | TypeScript 5                                | TypeScript 6.0.3                     | D-03（含 mock 修复）           |
| 样式  | Tailwind v4 + 单文件 globals.css（2804 行） | Tailwind v4 + 15 个语义 CSS 模块     | A-03 拆 10 模块；后增至 15     |
| 内容  | MDX + gray-matter                           | MDX + js-yaml + 内容快照             | A-02 换解析器；B-03 加快照     |
| 搜索  | 纯客户端 Fuse                               | **纯客户端 Fuse**（绕了一圈）        | B-01 改服务端；D-01 改回客户端 |
| 字体  | `next/font/google`                          | `next/font/local`（自托管）          | ADR-0008（2026-10-07，R15）    |
| 包名  | `blog`                                      | `chronicle`                          | B-03（2026-07-21）             |
| 部署  | Vercel + 显式 deploy                        | Vercel Git 集成 + `post-deploy` 烟测 | D-02（D-037）                  |

## 4. 被删除的功能（形态级取舍）

| 功能                      | 引入          | 删除                                  | 决策                              |
| ------------------------- | ------------- | ------------------------------------- | --------------------------------- |
| Giscus 评论               | A-01（06-21） | D-01（10-07）                         | D-003 / D-025（去 Giscus 白名单） |
| 数字花园 `/garden` + 反链 | B-03（07-21） | D-01（10-07）                         | D-003 / D-012                     |
| 收藏导航 `/links`         | A-02（06-27） | D-01（10-07）功能 / D-03（10-13）文件 | D-003 / D-012                     |
| 服务端搜索 `/api/search`  | B-01（07-12） | D-01（10-07）                         | D-004 / ADR-0006                  |
| 预览 API `/api/preview`   | B-03（07-21） | D-01（10-07）                         | D-003                             |
| `MagneticCard` 3D 倾斜    | A-01          | D-01（10-07）                         | D-018 / D-024                     |
| Pagination 分页           | A-01（06-21） | D-02（10-08）                         | 清死类                            |
| 探活监控                  | D-02（10-09） | D-02（10-09）                         | D-042（上线即退役）               |

> **注意**：wikilink（`[[slug]]`）**保留**——只删了花园图谱链路，行内渲染在 D-01 恢复。

## 5. 当前基线（2026-10-14，HEAD `5422aab`）

| 项            | 值                                                                                    | 出处                          |
| ------------- | ------------------------------------------------------------------------------------- | ----------------------------- |
| 生产域名      | `https://incca.ccwu.cc`                                                               | HANDOFF §2                    |
| origin/master | `c09d9cf`                                                                             | `git rev-parse` + HANDOFF §2  |
| Vitest        | **81 files / 684 tests**                                                              | 本机实测（2026-10-14）        |
| Playwright    | 6 spec files / **55 tests**                                                           | `playwright test --list` 实测 |
| 内容规模      | 22 篇文章、1 个项目                                                                   | HANDOFF §2                    |
| Node / pnpm   | Node ≥24 · pnpm 11.8.0                                                                | `package.json`                |
| CI            | 4 job：quality / bundle-analyze / e2e / post-deploy（Node 24）                        | `.github/workflows/ci.yml`    |
| bundle 预算   | max JS ≤300KB · max CSS ≤300KB · 总 ≤2MB · 每路由首屏 ≤285KB gz                       | `performance-baseline.md`     |
| Lighthouse 门 | perf ≥0.80 · a11y ≥0.90 · BP ≥0.90 · SEO ≥0.90 · LCP ≤3500ms · CLS ≤0.15 · TBT ≤300ms | `lighthouse.config.js`        |
| SRI           | 生产开启（`ENABLE_SRI=1`）                                                            | ADR-0005                      |
| 生产漏洞      | 0（prod）· dev 树剩 1 条 braces high（无解，R13）                                     | `d6c0584` / R13               |

## 6. 风险登记状态（`docs/13-risk-register.md`）

| ID  | 内容                             | 状态                             |
| --- | -------------------------------- | -------------------------------- |
| R8  | CI Node 版本不一致               | 已闭环（iteration-08）           |
| R11 | 生产依赖 3 条漏洞（含 critical） | 已闭环（iteration-08）           |
| R12 | Lighthouse 间歇失败（CLS 0.298） | **已闭环**（PR #39 `736e601`）   |
| R13 | dev 树 audit                     | 部分闭环（剩 1 条 braces，无解） |
| R14 | 搜索规格-实现差                  | 已闭环（D-045，定案）            |
| R15 | `next/font/google` 构建期联网    | 已闭环（ADR-0008）               |
| R16 | 降级门叠加                       | 监控中（剩「CF 拦 CI」1 条盲区） |
| R17 | wikilink 坏链无门禁              | 已闭环（`ff8ac71`）              |

## 7. 已知漂移与缺口

整理过程中核对了文档与实现，发现以下项。**2026-10-13 已回填第 1 条**（维护文档漂移）；其余为设计取舍或历史快照，按 `docs/README.md`「一条纪律」不改写。

1. ~~**`docs/HANDOFF.md` §2 漂移**~~ —— **已回填（2026-10-13）**：`origin/master` `0efc7c8` → `d792c21`、Vitest `78/628` → `80/662`、Playwright `46` → `51`、`data/links.json` 标为已删除。`docs/launch-baseline.md` §1 同步回填并附 CI run `38424660803` 证据。
2. **数字花园删除无独立 ADR**：只在 `docs/14-decision-log.md` D-003/D-012 与 `913c8cf` commit body 记录。**未补**——属历史决策，追溯链已足。
3. **`docs/launch-baseline.md` §3** 保留 2026-07-22 快照（已加注，不改写，符合纪律）。
4. **探活退役后无持续可用性监控**（D-042）：有意取舍，非缺口。
5. **`post-deploy` 的 CF 403 降级**（D-039）：部署后内容正确性当前未被自动验证，只验证可达性。

## 8. 文档地图（本总览相关）

| 文档                                                                                                 | 内容                          |
| ---------------------------------------------------------------------------------------------------- | ----------------------------- |
| [docs/README.md](../README.md)                                                                       | 文档导航总入口                |
| [docs/HANDOFF.md](../HANDOFF.md)                                                                     | Agent 接手指南 · 当前生产基线 |
| [docs/PROJECT.md](../PROJECT.md)                                                                     | 形态与栈 SSOT                 |
| [docs/ARCHITECTURE.md](../ARCHITECTURE.md)                                                           | 当前架构说明                  |
| [docs/14-decision-log.md](../14-decision-log.md)                                                     | 决策日志 D-001…D-046          |
| [docs/13-risk-register.md](../13-risk-register.md)                                                   | 风险登记 R1…R17               |
| [docs/15-acceptance-checklist.md](../15-acceptance-checklist.md)                                     | 验收清单                      |
| [docs/16-audit-and-optimization-plan-2026-10-07.md](../16-audit-and-optimization-plan-2026-10-07.md) | 2026-10-07 审计报告           |
| [docs/iterations/README.md](./README.md)                                                             | 迭代文档索引（含本系列）      |

---

## 附：本系列文档清单

**早期阶段（本次新增）**

- [milestone-A-01-bootstrap.md](./milestone-A-01-bootstrap.md) — 建站与内容体系
- [milestone-A-02-restructure-csp.md](./milestone-A-02-restructure-csp.md) — 结构性重组与 CSP
- [milestone-A-03-editorial-home.md](./milestone-A-03-editorial-home.md) — 编辑式首页与性能门禁
- [milestone-A-04-docs-shadcn.md](./milestone-A-04-docs-shadcn.md) — 文档治理、shadcn 与 Paper Gallery
- [milestone-B-01-content-ops-search.md](./milestone-B-01-content-ops-search.md) — 内容运营基线与服务端搜索
- [milestone-B-02-audit-boundary.md](./milestone-B-02-audit-boundary.md) — 审计加固与前后端逻辑边界
- [milestone-B-03-garden-identity.md](./milestone-B-03-garden-identity.md) — 数字花园与 Chronicle 身份
- [milestone-B-04-sri-security.md](./milestone-B-04-sri-security.md) — SRI 与 CSP 违规上报
- [milestone-B-05-arch-upgrade.md](./milestone-B-05-arch-upgrade.md) — 架构升级 Wave W1–W4
- [milestone-B-06-perf-waves.md](./milestone-B-06-perf-waves.md) — 性能 Wave CH-PERF-001~012
- [milestone-C-01-doc-standard.md](./milestone-C-01-doc-standard.md) — 文档标准化、a11y 与提交门
- [milestone-C-02-depsec.md](./milestone-C-02-depsec.md) — 依赖安全升级

**工作台重构阶段（本次新增索引）**

- [milestone-D-01-workspace-rebuild.md](./milestone-D-01-workspace-rebuild.md) — 工作台重构（索引 iteration-00~08）
- [milestone-D-02-closeout.md](./milestone-D-02-closeout.md) — 合并后收尾
- [milestone-D-03-merge-cleanup.md](./milestone-D-03-merge-cleanup.md) — 搜索高亮、依赖合并与全仓精简

**工作台重构详细迭代（既有）**

- [iteration-00](./iteration-00-audit.md) ~ [iteration-08](./iteration-08-code-review-cleanup.md)
