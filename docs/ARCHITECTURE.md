# 项目架构说明

> 状态：当前维护版（2026-10-07，Iteration 07 后）
>
> 这份文档是面向接手者的架构摘要：说明内容从哪里来、如何被解析、页面如何渲染、样式和安全边界在哪里，以及新增能力时应该落在哪一层。更细的运行状态与后续方向见 [`docs/HANDOFF.md`](./HANDOFF.md)，具体设计决策见 `docs/specs/` 与 `docs/adr/`。历史全栈审查快照：[`docs/archive/full-stack-audit-2026-07-17.md`](./archive/full-stack-audit-2026-07-17.md)。
>
> **2026-10-07 重构（分支 `feature/architecture-rebuild-2026-10-06`，未合并）**：本文已同步删除项 —— 移除 `/api/search`、`/api/preview`、`/garden`、`/links`、Giscus 评论、`server/search`、`search-text.ts`、`link-graph.ts`、`force-layout.ts`；搜索改为客户端 Fuse；新增 `/archive`、`/favorites` 与工作台外壳。

## 0. 五问速答

| #            | 答                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| 是什么？     | MDX 驱动的个人博客 / 作品集站点                                                                       |
| 为谁？       | 读者 · 作者本人                                                                                       |
| 不做？       | 运行时 DB 内容源 · 第二前端框架 · 桌面壳 · 为 SSG 放宽 CSP                                            |
| 怎样算过？   | `pnpm typecheck` · `pnpm test` · `pnpm build`（生产构建须提供非 localhost 的 `NEXT_PUBLIC_SITE_URL`） |
| 扩展点在哪？ | 内容加 `content/blog/*.mdx`；能力加 `src/lib/**` + `src/app/**`；见 §10「新增能力落点」               |

> 本节原在 `architecture-design-structured.md`（2026-09-17 合并入本文，该文件已删除）。

---

## 1. 项目定位

这是一个本地内容驱动的个人博客与作品集站点，核心目标是：

- 用 MDX 管理博客与关于页内容；
- 用 JSON 管理作品集；
- 用 Next.js App Router 渲染页面、RSS、sitemap、OG image 与 PWA manifest；
- 用严格 CSP nonce、安全响应头和内容校验保证静态博客也能按生产站点标准运行；
- 用 Vitest、Playwright、SEO 检查、Bundle 预算和生产内容 smoke test 守住回归。

**渲染模型（重要）**

| 层        | 行为                                            | 原因                                                          |
| --------- | ----------------------------------------------- | ------------------------------------------------------------- |
| HTML 文档 | **动态**（`headers()` + per-request CSP nonce） | 严格 `script-src` + `strict-dynamic`，优先于全站 SSG 边缘缓存 |
| 内容数据  | 本地 MDX/JSON，进程内缓存                       | 无运行时数据库                                                |
| 静态资产  | feed / 图片 / `_next/static` 可边缘缓存         | 与 HTML 策略分离                                              |
| 搜索      | **纯客户端**（Fuse，无服务端往返）              | 见 §5.1                                                       |

**不要**为了 HTML 静态化而把脚本 CSP 放宽到 `unsafe-inline`。

当前技术栈（2026-10-07 实测 `package.json`）：

| 层         | 选型                                                    |
| ---------- | ------------------------------------------------------- |
| Framework  | Next.js 16.3.8 App Router                               |
| UI         | React 19.3.0, Tailwind CSS 4, BEM CSS                   |
| Content    | MDX, `next-mdx-remote`, `js-yaml`, local JSON           |
| Validation | Zod schemas + custom frontmatter parser                 |
| Search     | fuse.js **客户端**（`src/lib/search/` + `SearchPanel`） |
| Tests      | Vitest + Testing Library, Playwright                    |
| Deploy     | Vercel + GitHub Actions                                 |

## 2. 总体分层

```text
content/ + data/
  -> src/lib/* repositories, schemas, cache, shared search contract
  -> src/server/content（内容访问 facade）+ rate-limit
  -> src/app/* route pages, metadata
  -> src/components/* UI composition（仅共享 DTO/纯函数 + HTTP）
  -> src/app/styles/* design tokens and CSS modules
  -> public/feed.* + sitemap + robots + OG images
```

| 层       | 目录                               | 职责                                                                                               |
| -------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| 内容源   | `content/`, `data/`                | 原始 MDX、关于页、作品集 JSON                                                                      |
| 数据层   | `src/lib/`                         | 文件读取、frontmatter 解析、Zod 校验、缓存、查询、共享搜索模块、SEO/JSON-LD 辅助                   |
| 服务端层 | `src/server/`                      | 内容访问 facade（`content/`）+ 进程内限流（`rate-limit.ts`）；仅供 App Router / Route Handler 使用 |
| 路由层   | `src/app/`                         | App Router 页面、动态 metadata、sitemap、robots、manifest、OG image、csp-report                    |
| 组件层   | `src/components/`                  | 页面结构、交互组件、通用 UI primitive                                                              |
| 样式层   | `src/app/styles/`                  | 设计令牌、全局基础、页面/组件 CSS、响应式覆盖                                                      |
| 验证层   | `*.test.ts(x)`, `e2e/`, `scripts/` | 单元/集成/E2E/SEO/Bundle/生产内容检查、模块边界测试                                                |

依赖方向：`components/hooks -> lib（共享契约）`；`app -> server + lib`；`server -> lib`。禁止 client/`src/lib` 反向导入 `@/server`（见 `src/lib/module-boundaries.test.ts`）。

### 样式加载

- **根 layout**：tokens / base / components / controls / backdrop / animations / workspace / responsive。
- **路由下沉**：`home.css` → `app/page.tsx`；`archive.css` / `blog-ui.css` / `article-ui.css` / `prose.css` / `reading.css` / `project-detail.css` 各自下沉到最近的路由 `layout.tsx` 或页面。

### JSON 数据 fail-fast

`createJsonContentRepository`：生产默认 `strict`（缺文件/坏 JSON **抛错**）；开发与测试默认 `lenient`（fallback）。CI `check:seo` 是另一道硬门禁。

## 3. 内容数据流

### 3.1 博客文章

```text
content/blog/*.mdx
  -> lib/parse-frontmatter.ts
  -> lib/schemas/post-frontmatter.ts
  -> lib/posts/repository.ts
  -> lib/posts/query.ts
  -> server/content（页面统一入口）
  -> app/blog/* pages
  -> components/blog/*
```

#### 3.1.1 Wikilink（仅渲染层）

```text
MDX body [[slug]] / [[slug|label]]
  -> lib/posts/wikilink.ts (纯解析)
  -> lib/posts/remark-wikilink.ts + MdxContent remark pipeline
  -> 渲染为普通 <a href="/blog/<slug>">
```

- 语法仅支持 `[[slug]]` 与 `[[slug|label]]`；slug 为 `filenameToSlug` 结果（作者直接写最终 slug，不带日期前缀）。
- 插件跳过代码块与行内 `code`（`splitCodeRegions`），故 TOML 里的 `[[kv_namespaces]]` 不会被误转。
- **反链 / 数字花园已删**：`link-graph.ts`、`force-layout.ts`、`garden-view-storage.ts`、`/garden` 与相关组件已于 2026-10-07 重构移除；wikilink 只做正文链接，不再构图。

关键规则：

- 文件名采用 `YYYY-MM-topic.mdx`，slug 会去掉日期前缀；
- frontmatter 至少需要 `title`、`description`、`date`；
- `published: false` 在生产环境过滤；
- `category` 可显式填写，不填时通过 `category-rules` 从 tags 推断；
- `series` / `seriesOrder` 驱动专题页与相关文章排序；
- `excerpt`（= `frontmatter.description`）与 `readingTime` 由仓库层派生。

关键文件：

- `src/lib/schemas/post-frontmatter.ts`
- `src/lib/posts/repository.ts`
- `src/lib/posts/query.ts`
- `src/lib/posts/wikilink.ts`
- `src/lib/posts/remark-wikilink.ts`
- `src/lib/content-source.ts`
- `src/lib/content-snapshot/`（快照后端）
- `src/lib/test-utils/in-memory-source.ts`

### 3.2 作品集

```text
data/projects.json
  -> lib/json-content-repository.ts
  -> lib/projects.ts
  -> server/content
  -> app/projects/* pages
  -> components/projects/ProjectCard
```

作品数据适合放结构化摘要、链接、标签、年份、封面与精选状态。若后续项目需要长篇复盘，建议新增 `content/projects/`，让 JSON 继续只承担索引职责。

> **收藏链接已删（2026-10-07）**：`/links` 路由、`lib/links.ts`、`LinksDirectory`、`CuratedLinksPreview` 与 `links.css` 均已移除。`data/links.json` 物理文件保留但**无消费方**（`content-dirs.ts` 仍列出路径，属残留）。

## 4. 路由与页面组合

| 路由                                    | 入口                              | 数据来源                                         |
| --------------------------------------- | --------------------------------- | ------------------------------------------------ |
| `/`                                     | `src/app/page.tsx`                | posts、projects、tags（工作台首页）              |
| `/about`                                | `src/app/about/page.tsx`          | `content/about.mdx`                              |
| `/blog`                                 | `src/app/blog/page.tsx`           | paginated posts                                  |
| `/blog/[slug]`                          | `src/app/blog/[slug]/page.tsx`    | post detail + related posts                      |
| `/archive`                              | `src/app/archive/page.tsx`        | posts 按年份时间线                               |
| `/favorites`                            | `src/app/favorites/page.tsx`      | posts + localStorage（收藏/最近阅读，客户端）    |
| `/projects`                             | `src/app/projects/page.tsx`       | projects JSON                                    |
| `/projects/[id]`                        | `src/app/projects/[id]/page.tsx`  | project detail                                   |
| `/tags`, `/tags/[tag]`                  | `src/app/tags/*`                  | tag aggregation                                  |
| `/categories`, `/categories/[category]` | `src/app/categories/*`            | category aggregation                             |
| `/series`, `/series/[series]`           | `src/app/series/*`                | series aggregation                               |
| `/api/csp-report`                       | `src/app/api/csp-report/route.ts` | CSP 违规收集（collect-only，唯一 Route Handler） |

动态路由优先使用 `src/lib/route-adapter.ts` 的 `createDynamicRoute` 收敛参数处理、404 和静态参数生成模式。

首页当前组合顺序：

```text
WorkspaceHero（含站内搜索 SearchPanel）
TopicCloud
ArticleList（最近更新）
```

## 5. 组件边界

| 目录                   | 职责                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `components/home/`     | 工作台首页：WorkspaceHero、TopicCloud、ArticleList                                                                                |
| `components/blog/`     | BlogCard、BlogList、Pagination、MdxContent、TOC、ReadingProgress、ReadingPreferences、ImageZoom、ReadingActions、LocalReadingList |
| `components/layout/`   | Header（TopBar）、Sidebar、NavLinks、Footer、PageSection、ArchiveCard、EmptyState、SiteBackdropStage、SiteBackdropParallax(+Gate) |
| `components/search/`   | SearchPanel（客户端 Fuse 搜索岛）                                                                                                 |
| `components/projects/` | ProjectCard                                                                                                                       |
| `components/ui/`       | ThemeToggle、MetaBadge、Card/Button/Badge primitive、BackToTop、popover、sheet、skeleton、DarkModeScript、JsonLd                  |

约定：

- 组件不直接读文件系统，也不导入 `@/server`；内容读取经 `src/server/content`，底层 repository 仍在 `src/lib/`；
- 归档页与列表页优先复用 `PageSection`、`ArchiveCard`、`MetaBadge`；
- shadcn CLI 在当前 Node 24 + zod exports 组合下不可用，继续维护本地已落地的 shadcn-style primitive，不运行 CLI 覆盖。
- 布局用 BEM CSS；交互用 `components/ui/*`；禁止业务侧再写 `.btn` / `.icon-btn`。

## 5.1 搜索

```text
SearchPanel（客户端岛，首页挂载）
  -> 接收 docs: SearchDoc[]（由 app/page.tsx 从文章元信息投影）
  -> lib/search.searchDocs(docs, query) —— 客户端 Fuse，无服务端往返
  -> 渲染结果列表；`?q=` 写回当前路径（可分享）
```

- 全部实现：`src/lib/search/`（`types.ts` / `engine.ts` / `index.ts`）
- 客户端 UI：`src/components/search/SearchPanel.tsx`
- 键盘：`/` 或 `Ctrl/Cmd+K` 聚焦；↑↓ 选择；Enter 打开；Esc 清空
- 无 `/api/search`、无服务端引擎、无限流（该端点已删）
- 边界门禁：`src/lib/module-boundaries.test.ts` 阻断 client/lib → server
- 规模：当前 20 文不上外部引擎；定案见 [`docs/adr/0006-search-engine-keep-fuse.md`](./adr/0006-search-engine-keep-fuse.md)

## 6. CSS 与视觉架构

Tailwind v4 的 `@tailwindcss/postcss` 会静默丢弃 `globals.css` 内的 CSS `@import`，所以所有 CSS 模块必须在拥有该样式的根/segment `layout.tsx` 或页面中显式 import。

根 layout 的全局加载顺序必须保持：

```text
tokens.css
base.css
components.css
controls.css
backdrop.css
animations.css
workspace.css
responsive.css
```

路由专属模块下沉到最近入口（2026-10-07 实测）：

| 样式文件             | 导入位置                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| `home.css`           | `app/page.tsx`                                                                 |
| `archive.css`        | `app/archive/layout.tsx`、`app/categories/layout.tsx`、`app/series/layout.tsx` |
| `blog-ui.css`        | `app/blog/layout.tsx`、`app/categories/layout.tsx`、`app/tags/layout.tsx`      |
| `article-ui.css`     | `app/blog/[slug]/layout.tsx`                                                   |
| `prose.css`          | `app/blog/[slug]/layout.tsx`、`app/about/layout.tsx`                           |
| `reading.css`        | `app/blog/[slug]/layout.tsx`、`app/favorites/layout.tsx`                       |
| `project-detail.css` | `app/projects/[id]/layout.tsx`                                                 |

职责分配：

- `tokens.css`：设计令牌、浅色/深色主题变量（旧变量名保留为兼容别名）；
- `base.css`：html/body、skip link、header/footer、reduced-motion；
- `components.css`：section、通用卡片与基础布局；
- `controls.css`：按钮、分页、标签链接和轻量控制；
- `workspace.css`：工作台外壳（TopBar + Sidebar + MainPanel）与面板内通用 section 头；
- `archive.css`：归档网格、归档卡片与归档列表；
- `blog-ui.css`：博客列表、目录、标签云、图片放大和 not-found；
- `article-ui.css`：文章详情布局、阅读面板、相关文章和文章导航；
- `prose.css`：MDX 正文排版与代码块；
- `reading.css`：收藏按钮与收藏/最近阅读列表；
- `home.css`：工作台首页（欢迎区、主题云、文章列表、搜索）；
- `backdrop.css`：全站背景层；
- `project-detail.css`：项目详情；
- `animations.css`：reveal、fade motion；
- `responsive.css`：移动端覆盖，最后加载。

颜色应通过 CSS 变量引用，避免硬编码；结构类使用 BEM，自定义状态或布局可配合少量 Tailwind utility。

## 7. 全站背景架构

背景采用三层分离：

| 层         | 实现                       | 职责                                  |
| ---------- | -------------------------- | ------------------------------------- |
| 静态背景层 | `body::before/after`       | 渐变、光晕、网格遮罩                  |
| 装饰元素层 | `<SiteBackdropStage />`    | server-rendered decorative DOM        |
| 视差跟随层 | `<SiteBackdropParallax />` | client-side CSS variables side effect |

关键文件：

- `src/components/layout/SiteBackdropStage.tsx`
- `src/components/layout/SiteBackdropParallax.tsx`
- `src/app/styles/backdrop.css`
- `docs/specs/2026-06-29-site-backdrop-architecture-design.md`

E2E 验证视差时，需要等待 hydration 后的 `useEffect` 监听器就绪；不要只等待 `.site-backdrop__stage` 出现。

## 8. 安全、渲染与部署边界

项目使用严格 CSP nonce：

- `src/proxy.ts` 为每个请求设置 nonce 与安全 header；
- `src/lib/csp.ts` 从 request headers 读取 nonce；
- `layout.tsx` 与 JSON-LD script 使用同一个 nonce；
- 因为 nonce 依赖请求，主要页面按需动态渲染是预期行为。

`next.config.ts` 还负责安全响应头、`outputFileTracingIncludes` 和 bundle analyzer 配置。远程图片配置保持关闭，图片资源优先放 `public/`。

部署链路：

```text
push master
  -> GitHub Actions quality + bundle-analyze
  -> e2e (production build + Playwright + Lighthouse)
  -> Vercel production deploy
  -> check-production-content against NEXT_PUBLIC_SITE_URL
```

生产内容 smoke 覆盖首页（文章标题 + 搜索入口）、博客、文章详情、关于、作品、RSS 与 sitemap。该脚本只在 `deploy` job 运行（合并到 master 后），改首页或内容结构时须本地对照跑一次，CI 四道门查不到它。

## 9. 缓存与测试

数据读取缓存统一使用 `src/lib/cache.ts` 的 `createCache<T>`，测试中用 `resetAllCaches()` 隔离状态。

当前测试基线：

| 层         | 基线                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Vitest     | **72 files / 547 tests**（2026-10-07 本机实测 `npx vitest run` exit 0）                                                                    |
| Playwright | 5 spec files / 46 tests                                                                                                                    |
| Build      | production build succeeds（107 静态页）；document routes remain dynamic                                                                    |
| CI         | **master 主 CI 近期 failure**（2026-09-30 起，挂在 `pnpm audit --prod`）；CI Node 已对齐 24（R8 闭环）。本分支 PR #37 的 `quality` 已 pass |

新增行为时优先补单元或组件测试；浏览器交互、移动端布局、CSP、搜索和导航路径需要 Playwright 覆盖。

## 10. 新增能力落点

| 需求                      | 优先修改位置                                                |
| ------------------------- | ----------------------------------------------------------- |
| 新增博客文章              | `content/blog/*.mdx`                                        |
| 新增关于页内容            | `content/about.mdx`                                         |
| 新增项目卡片              | `data/projects.json`                                        |
| 新增内容字段              | schema -> repository -> content workflow -> tests           |
| 新增页面                  | `src/app/*` + sitemap + navigation + tests                  |
| 新增归档/列表 UI          | `PageSection` / `ArchiveCard` / `MetaBadge`                 |
| 修改主题或视觉令牌        | `tokens.css`，再检查相关 CSS 模块                           |
| 修改文章正文排版          | `prose.css`                                                 |
| 修改搜索                  | `src/lib/search/` + `components/search/SearchPanel.tsx`     |
| 修改阅读状态（收藏/最近） | `src/lib/reading-state.ts` + `components/blog/Reading*.tsx` |
| 修改 CSP/security headers | `src/proxy.ts` + `src/lib/csp.ts` + ADR                     |

## 11. 常用验证

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check:seo
pnpm test
pnpm build
pnpm test:e2e
pnpm check:production-content
```

改 CSS 后还应确认生产 CSS bundle 包含关键选择器；改内容源、RSS 或 sitemap 后至少运行 `pnpm check:seo` 与 `pnpm build`。

## 12. 相关文档

- [`docs/HANDOFF.md`](./HANDOFF.md) — 当前状态、接手顺序与后续方向
- [`docs/content-workflow.md`](./content-workflow.md) — 内容维护与发布流程
- [`docs/css-conventions.md`](./css-conventions.md) — CSS 分层与写法约定
- [`docs/cache-components-migration.md`](./cache-components-migration.md) — 缓存与未来迁移策略
- [`docs/specs/2026-06-29-css-import-fix-design.md`](./specs/2026-06-29-css-import-fix-design.md) — Tailwind v4 CSS import 限制
- [`docs/specs/2026-06-29-site-backdrop-architecture-design.md`](./specs/2026-06-29-site-backdrop-architecture-design.md) — 三层背景架构
- [`docs/specs/2026-07-04-shadcn-visual-architecture-design.md`](./specs/2026-07-04-shadcn-visual-architecture-design.md) — shadcn-style UI 收口
- [`docs/adr/0003-csp-nonce-over-ssg.md`](./adr/0003-csp-nonce-over-ssg.md) — 当前 CSP nonce 与 SSG 取舍

## 13. 更新触发条件

出现以下情况时回来改本文件：

- 新增或删除 `src/lib/**` 模块、`src/app/**` 路由、`src/components/**` 分包
- 改变 `components ↛ @/server` 这条边界（由 `src/lib/module-boundaries.test.ts` 守门）
- 改变内容读取链路（`ContentSource` / repository / cache 三层任一）
- 改变 CSP / SRI 策略或渲染模型（动态 HTML ↔ SSG）
- 改动部署形态（Vercel 配置、缓存头、`CONTENT_BACKEND` 默认值）

## 14. 已知技术债与风险

| 项                                | 影响                         | 现状                                                 | 触发条件 / 缓解                                                                        |
| --------------------------------- | ---------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| HTML 动态渲染换 CSP nonce         | 无法全站 SSG，缓存策略受限   | **有意为之**（安全优先于缓存）                       | 见 ADR-0003；不为 SSG 放宽 `unsafe-inline`                                             |
| CI Node 版本与 `engines` 不符     | CI 出现 engine warning       | **已修（2026-10-07）**：CI 4 处改 `node-version: 24` | 见 [HANDOFF §6](./HANDOFF.md) R8                                                       |
| `data/links.json` 无消费方        | 残留数据文件                 | 物理保留；功能已删                                   | 属内容决策，未删文件                                                                   |
| `pnpm build` 重写 `public/feed.*` | 工作区常脏                   | 已知；构建后检查无意外 diff                          | 生产构建须提供非 localhost 的 `NEXT_PUBLIC_SITE_URL`（否则会把生产域名写成 localhost） |
| GSC/Bing/RUM 未接入               | 无真实搜索与真实用户性能数据 | 需账号授权                                           | 见 `docs/ops-deferred-work-plan.md`；禁止用实验室分替代真实 p75                        |
| 日期型报告与 spec 中的旧测试数    | 易被误当现状                 | 全部带日期，`docs/README.md` 有分层纪律              | 引用前先看 `docs/README.md` 的「一条纪律」                                             |

---

_2026-09-17：合并原 `architecture-design-structured.md` 的「五问速答」，并补
「更新触发条件」「已知技术债与风险」两节；该文件已删除。同时文件名由 `architecture.md`
规范为 `ARCHITECTURE.md`（Windows 大小写不敏感掩盖了这个差异，Linux/CI 上会不同）。_

_2026-10-07：同步 2026-10-07 重构的删除项与新增项（见文首横幅）。技术栈版本、样式加载归属、
组件分包、路由表、首页组合、搜索实现与测试基线均按当前工作区实测改写；原「搜索 API」章节
已随 `/api/search` 删除而重写为客户端 Fuse。_
