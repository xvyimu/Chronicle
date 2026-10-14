# Milestone B-03 · 数字花园与 Chronicle 身份

> 阶段：2026-07-19 ~ 2026-07-22 · 状态：**Completed（历史里程碑；花园功能已于 2026-10-07 删除）**
> 证据基准：`dfc057b` → `c3ac83a`
> 关联：[B-02](./milestone-B-02-audit-boundary.md) · 后续 [B-04](./milestone-B-04-sri-security.md)

---

## 1. 目标

按架构调研 v3 的「数字花园增量路径」实现 wikilink → 反链 → 关系图（G0–G3），坚持「出版型博客 + 花园能力，不换栈、不迁 Quartz」；从原名独立为 `Chronicle` 身份，去掉前名叙事；落地 T2 内容快照。

## 2. 关键提交

| 日期       | commit    | 做了什么                                                     |
| ---------- | --------- | ------------------------------------------------------------ |
| 2026-07-19 | `dfc057b` | `fix(projects): real screenshots, series list, github links` |
| 2026-07-21 | `b96b3c3` | G0/G1 wikilink + 反链（24 files, +2655）                     |
| 2026-07-21 | `1e8326d` | G2 `/garden` 路由上线（33 files, +2040）                     |
| 2026-07-21 | `a346f63` | G2 力导向布局 + 筛选 + 邻接折叠（16 files, +910）            |
| 2026-07-21 | `864abdd` | 节点拖拽 + localStorage 保存视图                             |
| 2026-07-21 | `70c323f` | G3 wikilink popover + hover 邻居高亮 + `/api/preview/[slug]` |
| 2026-07-21 | `75ae45e` | T2 构建期内容快照 + 运行时后端切换（25 files, +3558）        |
| 2026-07-21 | `6543a91` | 加 6 篇概念文章（14 → 20 篇）+ 本地 SRI 准备                 |
| 2026-07-21 | `bc39c03` | 包名 `blog` → `chronicle`（身份独立）                        |
| 2026-07-21 | `5eef5de` | Merge PR #13 `feat/v3-ship`                                  |
| 2026-07-22 | `63fe155` | T7 position seed + T4 keep-Fuse + Giscus/SRI 基线            |

## 3. 实现步骤

### 3.1 数字花园 G0–G3

- **wikilink（G0）**：`src/lib/posts/wikilink.ts`（纯函数，支持 `[[slug]]` / `[[slug|title]]`）+ `src/lib/posts/remark-wikilink.ts`（remark 插件）；坏链构建期警告。
- **反链（G1）**：`src/lib/posts/link-graph.ts` 扫描全站链接图 → `src/components/blog/ArticleBacklinks.tsx` 挂到文章页。
- **力导向图（G2）**：`src/lib/posts/force-layout.ts` + `src/components/blog/GardenExplorer.tsx`（力导向 + 专题/标签筛选，`prefers-reduced-motion` 降级为列表）；`/garden` 路由（`src/app/garden/{page.tsx,garden.css}`）。
- **节点拖拽 + 保存视图**：`src/lib/posts/garden-view-storage.ts`（localStorage）。
- **popover（G3）**：`src/components/blog/WikilinkPopover.tsx` + `/api/preview/[slug]`（悬停预览 + 邻居高亮）。

新增依赖：`unist-util-visit@^5.1.0`。

### 3.2 内容快照 T2（`75ae45e`）

- 新增 `generated/content-snapshot/*` + `scripts/build-content-snapshot.ts`。
- 运行时后端切换：`CONTENT_BACKEND=snapshot`（生产默认）。
- `6338dca` 修 `contentHash` 纳入 MDX 正文指纹。

> 快照机制沿用至今，是生产一致性的基石。

### 3.3 Chronicle 身份独立（`fc0a239` ~ `bc39c03`）

- `package.json`：`name` `blog` → `chronicle`，加 `description` / `license: MIT` / `homepage` / `repository` / `engines.node: 22.x`。
- 新增 `GITHUB_IDENTITY.md`。
- `bc39c03`：去掉前名叙事，独立为 Chronicle。

## 4. 涉及文件

**新增**：`src/lib/posts/{wikilink,remark-wikilink,link-graph,force-layout,garden-view-storage}.ts` · `src/components/blog/{ArticleBacklinks,GardenExplorer,WikilinkPopover,ArticleNeighbors}.tsx` · `src/app/garden/{page.tsx,garden.css}` · `src/app/api/preview/[slug]/route.ts` · `generated/content-snapshot/*` · `scripts/build-content-snapshot.ts` · `GITHUB_IDENTITY.md`
**修改**：`package.json`（name/engines/repository）· `data/projects.json` · `src/lib/site.ts` · `src/lib/navigation.ts`
**新增依赖**：`unist-util-visit@^5.1.0` · `babel-plugin-react-compiler@^1.0.0`（`462bc9c` React Compiler）· `@types/mdast@^4` · `unified@^11`

## 5. 数据或接口变化

- **新增 API**：`GET /api/preview/[slug]`（wikilink 悬停预览）。
- **新增路由**：`/garden`。
- 内容快照 schema v1（`generated/content-snapshot/`）。

## 6. 验收结果

`docs/archive/handoff-2026-07-21-garden.md`：

> tip `ef77986` · CI success · deploy success · `pnpm check:production-content` passed · 冒烟 `/garden` docker/vps 邻接+反链 200

Vitest 基线：`6c64a12 docs(hygiene): baseline Vitest 701 after contentHash fix`（2026-07-21）。

E2E：5 spec 文件（`git ls-tree b96b3c3 e2e/` = blog/extended/home/mobile/navigation）。

## 7. 遗留问题

- 数字花园整条链路（`/garden`、力导向、反链、link-graph、popover、positions）**在 2026-10-07 工作台重构中整体删除**（决策 D-003 / D-012）。**wikilink 行内渲染保留**（`wikilink.ts` + `remark-wikilink.ts` 恢复），但图谱/反链/popover 链路移除。
- 删除**没有独立 ADR**——只在 `docs/14-decision-log.md` D-003/D-012 与 `913c8cf` commit body 记录。这是本次整理发现的一个文档缺口。

## 8. 与今日的差异

| 项                    | 本阶段（2026-07-22）           | 今日（2026-10-14）                          |
| --------------------- | ------------------------------ | ------------------------------------------- |
| `/garden`             | 已上线（力导向 + 筛选 + 拖拽） | **已删除**（2026-10-07）                    |
| 反链 / popover        | 文章页有反链、悬停预览         | **已删除**；wikilink 行内渲染保留           |
| `/api/preview/[slug]` | 存在                           | **已删除**                                  |
| 内容快照              | 刚建立                         | 沿用（生产默认 `CONTENT_BACKEND=snapshot`） |
| 包名                  | `chronicle`                    | 沿用                                        |
| 文章数                | 20 篇                          | 20 篇                                       |
