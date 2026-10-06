# Iteration 08 · 代码审核与清理

## 1. 迭代名称

代码审核与清理

## 2. 当前状态

**Completed**

## 3. 目标

对重构分支做双轴 review（Standards + Spec）→ 修掉查实的缺陷 → 清理死代码 → 把**过期的当前维护文档**同步到实现。

## 4. 背景

Iteration 00–07 完成重构主体，但改动全部留在工作区未提交，且未做系统性复审。`docs/HANDOFF.md`、`docs/ARCHITECTURE.md`、`docs/README.md` 三份**当前维护文档**一字未改，与实现严重脱节（还在描述已删的 `/api/search`、`server/search`、`/garden`、`/links`、Giscus 等）。

## 5. 范围

- 双轴 review：Standards（违反仓库约定）+ Spec（不符规格）。
- 修**真 bug**：搜索 URL 写错路径致结果不渲染。
- 清死代码：`rate-limit` 的预览残留。
- 修 CSS 归属：`ws-section__*` 在 `/favorites` 无样式。
- 修视觉遗留：`theme-color` 与 OG 图仍用旧暖纸色。
- 同步三份过期文档 + ADR-0006 状态修订。
- **修 CI 红灯**（用户授权后追加）：R8（CI Node 22 → 24）+ R11（3 条生产依赖漏洞，含 critical）。
- 提交 / 推送 / 开 PR。

## 6. 非范围

- 不改 `docs/archive/`、`docs/ops/`、`docs/specs/`、`docs/superpowers/` —— 按 `docs/README.md`「一条纪律」，日期型快照不追改。
- 不改 `data/links.json`（内容决策，文件保留）。
- **不改 Lighthouse 预算阈值**（R12）：既有基线红灯，改阈值等于拿标准迁就实现，待定。
- **不修 dev 树 audit 13 条**（R13）：CI 该步 `continue-on-error`。
- 不合并 master / 不部署（须人审）。

## 7. 前置条件

Iteration 07。

## 8. 具体任务

- [x] 修搜索 URL 契约：`SearchPanel` 写回**当前路径**（原写 `/blog?q=` 会卸载面板）
- [x] `TopicCloud` 用 `tag.slug` 而非重算 `slugifyTag(tag.tag)`
- [x] 删 `checkPreviewRateLimit` + `PREVIEW_RATE_LIMIT_MAX`（死代码）+ 修模块头注释
- [x] `ws-section__*` 由 `home.css` 下沉到 `workspace.css`（`/favorites` 曾无样式）
- [x] `layout.tsx`：`theme-color` 旧暖纸色 → 中性灰；修过时 CSS 注释
- [x] 两个 OG 图配色跟到中性灰（`#f1f0eb`/鼠尾草绿 → `#fafafa`/克制蓝）
- [x] 同步 `docs/HANDOFF.md` / `docs/ARCHITECTURE.md` / `docs/README.md`
- [x] `docs/adr/0006` 加状态修订注记（引擎不变，交付形态改客户端）
- [x] 清调试遗留 `probe-tmp.mjs`（阻塞 lint）
- [x] 修 R11：next 16.3.5 → 16.3.8（critical RCE）+ sharp / source-map-js override
- [x] 修 R8：CI 4 处 `node-version: 22` → `24`
- [x] 全量回归（升级后重跑）
- [x] 提交（2 个）· 推送 · 开 PR #37

## 9. 涉及文件

**修改（代码）**：`src/components/search/SearchPanel.tsx` · `src/components/home/TopicCloud.tsx` · `src/server/rate-limit.ts` · `src/app/styles/{home,workspace}.css` · `src/app/layout.tsx` · `src/app/opengraph-image.tsx` · `src/app/blog/[slug]/opengraph-image.tsx`
**修改（文档）**：`docs/HANDOFF.md` · `docs/ARCHITECTURE.md` · `docs/README.md` · `docs/adr/0006-search-engine-keep-fuse.md` · `docs/13-risk-register.md` · 本文件 · `docs/14-decision-log.md` · `docs/15-acceptance-checklist.md` · `README.md`
**修改（依赖/CI）**：`package.json`（next 16.3.8 · bundle-analyzer ^16.3.8）· `pnpm-lock.yaml` · `pnpm-workspace.yaml`（sharp `>=0.35.5` · 新增 `source-map-js >=1.2.2`）· `.github/workflows/ci.yml`（4 处 node 24）
**删除**：`probe-tmp.mjs`（本轮调试遗留，非仓库文件）

## 10. 数据或接口变化

无。搜索 URL 契约由 `/blog?q=` 改为 `<当前路径>?q=`（同一页面写回，**行为更正确**，非接口变更）。

## 11. 设计变化

- `ws-section__*`（面板内通用 section 头）提升为全站可用（`workspace.css`），消费者跨首页与 `/favorites`。
- 站点 `theme-color` 与 OG 分享图统一到中性灰 token。
- 依赖：`next` 16.3.8 · `sharp` 0.35.5 · `source-map-js` 1.2.2。

## 12. 测试计划

四门（typecheck / lint / test / build）+ e2e + check:seo + check:docs + format:docs:check + `audit --prod` + `content:verify` + Playwright 搜索行为实测。

## 13. 验收标准

搜索 6 项行为全通过；死代码零残留；四门 + e2e + seo + docs 全绿；`pnpm audit --prod` exit 0；三份当前维护文档与实际一致。

## 14. 风险

R1（视觉大改回归）——本轮只改配色与 CSS 归属，回归通过。
R11（依赖升级回归）——升 next 16.3.8 后全量重跑，四门 + e2e 全绿。

## 15. 回滚方式

分支未合并；`git revert` 单迭代提交；本轮改动均在未提交工作区，`git checkout -- <file>` 即可。

## 16. 实际完成情况

### 关键修复：搜索不可用的真 bug

**问题**：`SearchPanel` 挂在**首页** `/`，但其 URL 同步无条件写 `/blog?q=...`。空查询时首页会被自动跳走（实测 `URL after load: http://localhost:3001/blog`）；有查询时跨路径跳转会**卸载 SearchPanel 自身**，结果随即消失——搜索完全不可用。

**修法**：查询写回**当前路径**（`${location.pathname}?${qs}`），空查询时清掉 `?q=` 并停留原页。

**验证**（Playwright 实测 6 项）：

| #   | 检查项              | 结果                                                 |
| --- | ------------------- | ---------------------------------------------------- |
| 1   | 首页加载后不被跳走  | `http://localhost:3001/` ✓                           |
| 2   | 输入后 URL 写入查询 | `/?q=React` ✓                                        |
| 3   | 结果渲染            | 8 条，首条 href `/blog/react-compiler-in-practice` ✓ |
| 4   | 无结果空态          | shown ✓                                              |
| 5   | 清空后停留首页      | `/` ✓                                                |
| 6   | ↑↓ + Enter 打开首条 | `/blog/react-compiler-in-practice` ✓                 |

### 清理与修复

- **死代码**：`checkPreviewRateLimit` / `PREVIEW_RATE_LIMIT_MAX` 唯一消费者 `/api/search` 已删 → 整块移除；模块头注释「消费者：search / preview / csp-report」同步订正（现仅 csp-report）。
- **CSS 归属**：`ws-section__*` 原只定义在 `home.css`（仅首页加载），但 `LocalReadingList` 用在 `/favorites` → 该类在 `/favorites` **完全无样式**。下沉到全站加载的 `workspace.css`。
- **冗余计算**：`TopicCloud` 用 `slugifyTag(tag.tag)` 重算 slug，而 `TagInfo.slug` 就是它 → 改用 `tag.slug`。
- **视觉遗留**：`theme-color`（`#f1f0eb`/`#141716`）与两个 OG 图仍用重构前的暖纸色 + 鼠尾草绿，与已转中性灰的站点不一致 → 统一到 token 值。
- **调试遗留**：`probe-tmp.mjs`（本会话查搜索 bug 时写的探针）留在仓根，阻塞 `pnpm lint` → 删除。

### 文档同步（约束 #7）

三份「当前维护文档」此前**一字未改**，描述的还是已删架构。本轮按实现改写：

- **`ARCHITECTURE.md`**：技术栈版本（16.2→16.3.5 / React 19.2→19.3.0）、样式加载表、组件分包、路由表（+`/archive` `/favorites`，−`/api/search` `/links`）、首页组合、§5.1 搜索整节、测试基线（708/95 → 547/72）。删除 `/links` 整节与反链/花园链路。
- **`HANDOFF.md`**：本地路径去 junction、GitHub Actions 改为如实记「近期 failure」、内容规模、Node 版本、搜索落点、修改落点表、剩余边界（Giscus 已删）。
- **`docs/README.md`**：公开 API 行订正；新增「2026-10 重构文档」索引（01–15 + iterations + ADR-0007）。
- **`adr/0006`**：按 ADR 纪律**保留历史正文**，仅加状态修订注记（引擎决策不变，交付形态改客户端；原「`/api/search` p95 触发」失效）。

### 依赖与 CI 修复（R8 + R11）

CI 的 `quality` job 挂在第 5 步 `pnpm audit --prod --audit-level=high`，此后 format / lint / test / typecheck / build **全部 skip**。查实根因是三条生产依赖 advisory：

| 严重度       | 包              | advisory                                           | 受影响区间         | 处理                                 |
| ------------ | --------------- | -------------------------------------------------- | ------------------ | ------------------------------------ |
| **critical** | `next`          | GHSA-vcvr-r3jv-pc5j（`next/og` ImageResponse RCE） | `>=16.2.0 <16.3.6` | 16.3.5 → **16.3.8**                  |
| high         | `source-map-js` | GHSA-68fv-2mgg-jv7q（事件循环 DoS）                | `>=1.0.0 <1.2.2`   | 1.2.1 → **1.2.2**（新增 override）   |
| high         | `sharp`         | CVE-2026-96889（librsvg）                          | `<0.35.5`          | 0.35.4 → **0.35.5**（收紧 override） |

**本站跑的 `next@16.3.5` 正落在 critical 区间内**——不是「间接依赖的老问题」。

路径依据：Dependabot PR #32 正是这条 next 升级，其 CI（quality / e2e / bundle-analyze）实测全 pass，属已验证可行的升级路径。

`sharp` 那条特别说明：原 override 写 `>=0.35.4`，把解析结果摁在 `0.35.4`——**恰落在新 advisory 的受影响区间**。`next@16.3.8` 的 `optionalDependencies` 仍声明 `^0.35.4` 不会自己抬，故必须显式收紧。

CI Node 对齐（R8 闭环）：`.github/workflows/ci.yml` 4 处 `node-version: 22` → `24`。

### 回归结果

| 命令                                   | 结果                         | exit |
| -------------------------------------- | ---------------------------- | ---- |
| `npx tsc --noEmit`                     | 通过（增量与全量均 0）       | 0    |
| `npx eslint`                           | 通过                         | 0    |
| `npx vitest run`                       | 72 文件 / 547 测试           | 0    |
| `pnpm build`                           | 107 静态页                   | 0    |
| `pnpm test:e2e`                        | 45 passed / 0 failed         | 0    |
| `pnpm check:seo`                       | passed                       | 0    |
| `pnpm format:docs:check`               | passed                       | 0    |
| `node scripts/check-doc-links.mjs`     | 139 文件 passed              | 0    |
| `pnpm audit --prod --audit-level=high` | **No known vulnerabilities** | 0    |
| `content:verify`                       | snapshot in sync (20 篇)     | 0    |
| Playwright 搜索实测                    | 6/6 通过                     | —    |

以上为**升级 next 16.3.8 之后**的全量重跑。

### CI 结果（PR #37，commit `46b8bd8` → `eb8abc5`）

| Job              | 结果                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `quality`        | **pass**（1m55s / 1m59s / 1m41s）——audit 门已过，后续 format/lint/test/typecheck/build 全部实跑                                          |
| `bundle-analyze` | pass（1m11s / 51s / 1m7s）                                                                                                               |
| `Vercel`         | pass                                                                                                                                     |
| `e2e`            | **间歇**：run `37502665937` fail（Lighthouse），run `37505113109`、`37508576820` 连续 **pass**（4m15s / 3m34s）；Playwright 恒 45 passed |
| `deploy`         | skipping（仅 push 到 master 时运行）                                                                                                     |

CI 日志确认 R8 生效：`Found in cache @ /opt/hostedtoolcache/node/24.21.0/x64`；audit 门 `✓ Lockfile passes supply-chain policies (1083 entries)`。

## 17. 遗留问题

- **R12 · Lighthouse 间歇失败（未修）**：`/blog/nextjs-app-router` 两条断言 —— `categories:performance` 0.75（阈值 ≥0.8）、`cumulative-layout-shift` 0.2976（阈值 ≤0.15）。CI 中时红时绿，属**间歇性**，非稳定红灯。
  - **非本 PR 引入**：master `e178f07`（2026-09-26）同页同样两条失败，数值 0.74 / 0.3322 —— 本 PR 反而略好。
  - **根因实测定位**（本地生产服务器 + CDP 节流 + MutationObserver）：`DOMContentLoaded` 时 `body=940px`、`#main-content=522px`（样式表已加载）；**41ms 后**正文（`.prose` 8880px）才插入 DOM，整页撑到 10120px，页脚由 `y=599` 被推到 `y=10022`。即首帧只有外壳、正文随后到达。
  - 本地无节流 CLS = 0.0000；加 CDP 节流（150ms 延迟 / 1.6Mbps / 4× CPU）复现 0.0733；CI runner 更慢故放大到 0.29。
  - **未擅自改预算阈值**（改阈值等于拿标准迁就实现）；`lighthouse.config.js` 第 40 行注释「Article MDX 页历史 CLS ~0.13」已过期。
  - 修复方向（未实施）：给正文容器预留首屏空间，或查清正文为何晚于外壳到达。
- **R13 · dev 树 audit 13 条**（dot-prop / brace-expansion / braces）：CI 该步 `continue-on-error`，不阻断；其中 `brace-expansion@1` 是 `pnpm-workspace.yaml` 注释记录的结构性无解（上游从未发布 advisory 要求的 1.1.17）。
- **`data/links.json` 无消费方**：功能已删，物理文件保留（内容决策）。`content-dirs.ts` 仍列其路径，属残留。
- **`docs/ARCHITECTURE_TARGET.md` / `docs/03-information-architecture.md` 等**未逐篇复核（本轮只覆盖三份「当前维护文档」）。
- 全站装饰背景层、详情页衬线标题（D-019 / D-022）维持原状。

**已完成（本轮后半段，用户授权后）**：提交 2 个（`5d29bfc` 代码 + `9def4b5` 文档）→ 推送 `origin/feature/architecture-rebuild-2026-10-06` → 开 PR [#37](https://github.com/xvyimu/Chronicle/pull/37)。随后追加 `46b8bd8`（R8 + R11）、`4753271`（文档同步）、`eb8abc5`（R12 定性修正）。最终提交 `eb8abc5` 的 CI：quality / bundle-analyze / e2e / Vercel 全 pass。**未合并、未部署。**

## 18. 下一迭代建议

1. **R12（Lighthouse）**：`/blog/nextjs-app-router` 的 CLS 0.2976 与性能 0.75 需真修（非改阈值）。方向：查该页布局偏移源（字体切换？代码块？TOC？），`lighthouse.config.js` 第 40 行的「历史 CLS ~0.13」注释亦需据实更新。
2. **人工验收 PR #37** → 合并 master → 部署（均须人审）。
3. R13（dev 树 audit）按需评估。
