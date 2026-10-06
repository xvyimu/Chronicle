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

## 6. 非范围

- 不改 `docs/archive/`、`docs/ops/`、`docs/specs/`、`docs/superpowers/` —— 按 `docs/README.md`「一条纪律」，日期型快照不追改。
- 不改 `data/links.json`（内容决策，文件保留）。
- 不改 CI（Node 22 与 `engines >=24` 的矛盾登记为 R8，未修）。
- 不提交 / 不推送 / 不合并 / 不部署。

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
- [x] 全量回归

## 9. 涉及文件

**修改（代码）**：`src/components/search/SearchPanel.tsx` · `src/components/home/TopicCloud.tsx` · `src/server/rate-limit.ts` · `src/app/styles/{home,workspace}.css` · `src/app/layout.tsx` · `src/app/opengraph-image.tsx` · `src/app/blog/[slug]/opengraph-image.tsx`
**修改（文档）**：`docs/HANDOFF.md` · `docs/ARCHITECTURE.md` · `docs/README.md` · `docs/adr/0006-search-engine-keep-fuse.md`
**删除**：`probe-tmp.mjs`（本轮调试遗留，非仓库文件）

## 10. 数据或接口变化

无。搜索 URL 契约由 `/blog?q=` 改为 `<当前路径>?q=`（同一页面写回，**行为更正确**，非接口变更）。

## 11. 设计变化

- `ws-section__*`（面板内通用 section 头）提升为全站可用（`workspace.css`），消费者跨首页与 `/favorites`。
- 站点 `theme-color` 与 OG 分享图统一到中性灰 token。

## 12. 测试计划

四门（typecheck / lint / test / build）+ e2e + check:seo + check:docs + format:docs:check + Playwright 搜索行为实测。

## 13. 验收标准

搜索 6 项行为全通过；死代码零残留；四门 + e2e + seo + docs 全绿；三份当前维护文档与实际一致。

## 14. 风险

R1（视觉大改回归）——本轮只改配色与 CSS 归属，回归通过。

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
- **`HANDOFF.md`**：本地路径去 junction、GitHub Actions 改为如实记「近期 failure」、内容规模、Node 版本、搜索落点、修改落点表、剩余边界（Giscus 已删 + 新增 R8）。
- **`docs/README.md`**：公开 API 行订正；新增「2026-10 重构文档」索引（01–15 + iterations + ADR-0007）。
- **`adr/0006`**：按 ADR 纪律**保留历史正文**，仅加状态修订注记（引擎决策不变，交付形态改客户端；原「`/api/search` p95 触发」失效）。

### 回归结果

| 命令                               | 结果                   | exit |
| ---------------------------------- | ---------------------- | ---- |
| `npx tsc --noEmit`                 | 通过（增量与全量均 0） | 0    |
| `npx eslint`                       | 通过                   | 0    |
| `npx vitest run`                   | 72 文件 / 547 测试     | 0    |
| `pnpm build`                       | 107 静态页             | 0    |
| `pnpm test:e2e`                    | 45 passed / 0 failed   | 0    |
| `pnpm check:seo`                   | passed                 | 0    |
| `pnpm format:docs:check`           | passed                 | 0    |
| `node scripts/check-doc-links.mjs` | 138 文件 passed        | 0    |
| Playwright 搜索实测                | 6/6 通过               | —    |

## 17. 遗留问题

- **R8 未修**：`engines >=24` 与 CI `node-version: 22` 矛盾，CI 会出现 `Unsupported engine` warning。本轮不动 CI，保持记录。
- **master 主 CI 近期 failure**（2026-09-30 起，Dependabot 依赖升级提交）——非本次重构引入，已如实写入 HANDOFF，未追查。
- **`data/links.json` 无消费方**：功能已删，物理文件保留（内容决策）。`content-dirs.ts` 仍列其路径，属残留。
- **`docs/ARCHITECTURE_TARGET.md` / `docs/03-information-architecture.md` 等**未逐篇复核（本轮只覆盖三份「当前维护文档」）。
- 全站装饰背景层、详情页衬线标题（D-019 / D-022）维持原状。
- **未提交 / 未推送**：分支 `feature/architecture-rebuild-2026-10-06` 全部改动仍在工作区。

## 18. 下一迭代建议

提交 / 推送 / PR（须用户授权）→ 人工验收 → 合并 master → 部署（须人审）。建议合并前先处置 R8（CI Node 版本）与 master CI 的 failure 状态。
