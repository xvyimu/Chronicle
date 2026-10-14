# Milestone B-01 · 内容运营基线与服务端搜索

> 阶段：2026-07-06 ~ 2026-07-12 · 状态：**Completed（历史里程碑）**
> 证据基准：`37163a0` → `9b9aaf0`
> 关联：[A-04](./milestone-A-04-docs-shadcn.md) · 后续 [B-02](./milestone-B-02-audit-boundary.md)

---

## 1. 目标

把单文件的博客 UI/CSS 拆成模块；建立内容运营字段与上线基线文档；把搜索从纯客户端改为**服务端 Fuse API**（当时为减首屏 payload）；收敛 shadcn 组件层；加固内容校验。

## 2. 关键提交

| 日期       | commit    | 做了什么                                                                  |
| ---------- | --------- | ------------------------------------------------------------------------- |
| 2026-07-06 | `37163a0` | `refactor(architecture): split blog UI and CSS modules`                   |
| 2026-07-06 | `110dd3a` | 优化博客架构与阅读 UX（32 files, +1015/−112）                             |
| 2026-07-06 | `b48d57d` | 内容运营基线（18 files, +777；**新增 `docs/launch-baseline.md`**）        |
| 2026-07-06 | `0e1fc8f` | 打磨内容发现 UX（22 files, +585）                                         |
| 2026-07-09 | `58552e3` | `feat(search): highlight result descriptions`                             |
| 2026-07-10 | `7c26e3a` | 加固内容校验与 sitemap URL                                                |
| 2026-07-12 | `38e7951` | `feat(search): server Fuse API and drop full-index blog payload`          |
| 2026-07-12 | `9b9aaf0` | `feat(audit): P8 search projection, rate limit, CSP, particles, CI reuse` |
| 2026-07-12 | `1bfb313` | shadcn 层收敛：sheet / popover / shareable search                         |

## 3. 实现步骤

### 3.1 架构拆分（`37163a0` · `110dd3a`）

- 博客 UI 与 CSS 拆模块：`src/app/styles/*`（components/home/prose/responsive/search-ui/tokens）。
- 组件拆分：`src/components/blog/{CodeBlock,SearchBar,TableOfContents,BlogList,SearchResultsList}.tsx`。

### 3.2 内容运营基线（`b48d57d`）

- 新增 `docs/launch-baseline.md`（上线运营基线，沿用至今）。
- `src/components/links/LinksDirectory.tsx`：`/links` 目录组件。
- 扩展 `data/links.json` 的可选资产元信息，保持旧数据兼容。

### 3.3 服务端搜索（`38e7951`）

- 新增 `src/lib/search/{engine,index,types}.ts`：共享搜索契约 + Fuse 引擎。
- 新增 `src/components/blog/useServerSearch.ts`（82 行）：防抖的服务端搜索路径。
- 新增 `GET /api/search`（`src/app/api/search/route.ts`，65 行）。
- `SearchBar` 默认走防抖服务端路径。

> 关键决策（当时）：服务端 Fuse 是为了**不再把全量索引塞进客户端**。这个决策在 2026-10-07 被**反向**——20 篇规模下客户端 Fuse 更轻（ADR-0006），`/api/search` 被删。方向反了两次，但每次都有当时的规模理由。

### 3.4 P8 审计加固（`9b9aaf0`）

- 搜索投影（`src/lib/search/project.ts`）：API 与客户端路径都只返回投影后的 `SearchResultItem`。
- 限流：`src/lib/search/rate-limit.ts`（70 行）+ 测试，`/api/search` 加进程级限流与结构化错误。
- CSP 放行 `va.vercel-scripts.com`（Vercel Speed Insights）。
- `ParticleCanvas` 桌面 fine-pointer + 可见性暂停。
- 共享 `next/image` mock；`check:blur` 进 quality CI。

## 4. 涉及文件

**新增**：`src/lib/search/{engine,index,types,project,rate-limit}.ts` · `src/app/api/search/route.ts` · `src/components/blog/{useServerSearch.ts,useFuseSearch.ts}` · `src/components/links/LinksDirectory.tsx` · `src/lib/image-blur-data.ts` · `scripts/check-project-blur-coverage.ts` · `docs/launch-baseline.md` · `docs/bem-search-architecture-2026-07-12.md`
**修改**：`src/app/styles/*` · `src/components/blog/SearchBar.tsx` · `src/proxy.ts` · `.github/workflows/ci.yml`

## 5. 数据或接口变化

- **新增 API**：`GET /api/search`（防抖服务端搜索，带限流）。
- `SearchResultItem` 投影契约（`src/lib/search/types.ts`）。

## 6. 验收结果

| 时点       | 命令/指标 | 结果                                 | 出处                                              |
| ---------- | --------- | ------------------------------------ | ------------------------------------------------- |
| 2026-07-06 | 路线图    | Phase 1-3 + P2 UX polish implemented | `docs/archive/optimization-roadmap-2026-07-06.md` |
| 2026-07-10 | 上线检查  | 基线提交 `7c26e3a`                   | `docs/archive/launch-readiness-2026-07-10.md`     |

**未找到证据**：本阶段多数 commit body 只列功能清单，未附测试/构建数字。

## 7. 遗留问题

- `/api/search` 与客户端搜索双路径并存 —— 2026-10-07 删除服务端路径，统一为客户端 Fuse。
- `/links` 目录 —— 2026-10-07 删除。

## 8. 与今日的差异

| 项       | 本阶段（2026-07-12）          | 今日（2026-10-14）                      |
| -------- | ----------------------------- | --------------------------------------- |
| 搜索     | 服务端 Fuse API + 客户端双路  | **纯客户端 Fuse**（`/api/search` 已删） |
| 索引位置 | `src/lib/search/`（双端共用） | `src/lib/search/`（纯客户端）           |
| `/links` | 活跃                          | 已删除                                  |
