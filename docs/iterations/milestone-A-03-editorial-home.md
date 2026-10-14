# Milestone A-03 · 编辑式首页与性能门禁

> 阶段：2026-06-28 ~ 2026-06-30 · 状态：**Completed（历史里程碑）**
> 证据基准：`7a2a727` → `8fc58a6`
> 关联：[A-02](./milestone-A-02-restructure-csp.md) · 后续 [A-04](./milestone-A-04-docs-shadcn.md)

---

## 1. 目标

首页从「技术舞台」转向编辑式（editorial）叙事；建立性能基线文档；搜索加 `Ctrl+K` 召唤与高亮；把 `posts.ts` 拆模块、4 个动态路由收敛到 adapter、`globals.css` 拆成语义模块；修掉 A-02 留下的生产空内容回归。

## 2. 关键提交

| 日期       | commit    | 做了什么                                                                  |
| ---------- | --------- | ------------------------------------------------------------------------- |
| 2026-06-28 | `29aac3c` | `chore: add seo content quality gate`                                     |
| 2026-06-28 | `95348ee` | **首次建立 `docs/performance-baseline.md`**                               |
| 2026-06-28 | `44da2fc` | `feat: add editorial homepage hero` — `EditorialHero` + 设计草稿          |
| 2026-06-28 | `d771502` | `feat: add narrative homepage sections` — 4 个首页 section                |
| 2026-06-29 | `9fda2cc` | `ci: add lighthouse as deploy gate`                                       |
| 2026-06-29 | `9a165b9` | 抽 frontmatter zod schema 到共享模块                                      |
| 2026-06-29 | `0523a8a` | `feat(cache): add resetAllCaches for test isolation`                      |
| 2026-06-29 | `ea24c82` | `posts.ts` 拆模块 + 注入 in-memory source                                 |
| 2026-06-29 | `971044e` | `createDynamicRoute` adapter 收敛 4 个动态路由                            |
| 2026-06-29 | `6a36bdb` | `globals.css`（2804 行）拆为 10 个语义模块                                |
| 2026-06-29 | `8fc58a6` | `feat(search): add Ctrl+K summon and match highlighting`                  |
| 2026-06-30 | `b615283` | **`fix(critical): 修复生产环境内容为空 — 移除 headers() 实现全站静态化`** |

## 3. 实现步骤

### 3.1 首页编辑式重写（`44da2fc` · `d771502`）

- `EditorialHero.tsx`（96 行）+ `globals.css`（+346 行）。
- 4 个叙事 section：`CuratedLinksPreview`、`FeaturedArticleRail`、`ManifestoSection`、`ReadingPathSection`（`globals.css` +416 行）。

### 3.2 架构深化（`9a165b9` ~ `971044e`）

- frontmatter zod schema 抽到共享模块。
- `createCache<T>` + `resetAllCaches()`：统一缓存，测试隔离。
- `posts.ts` 拆成 `src/lib/posts/` 模块 + 注入 in-memory `ContentSource`（测试夹具）。
- `src/lib/route-adapter.ts`（73 行）：`blog/[slug]`、`categories/[category]`、`projects/[id]`、`tags/[tag]` 四个路由收敛到 `createDynamicRoute`。

### 3.3 CSS 语义模块拆分（`6a36bdb`）

`src/app/globals.css` 从 **2804 行**拆为 12 行入口 + `src/app/styles/` 10 个模块：`tokens/base/components/blog-ui/home/prose/project-detail/backdrop/animations/responsive.css`。

> 这次拆分引入一个坑：Tailwind v4 的 `@tailwindcss/postcss` 会**静默丢弃** `globals.css` 里的 `@import "./styles/xxx.css"`。修法与设计记录见 `docs/specs/2026-06-29-css-import-fix-design.md`——每个 CSS 模块必须由 layout 显式导入。

### 3.4 修复生产空内容（`b615283`）

A-02 的 CSP 中间件让根布局用上 `headers()` → 全站动态化 → 生产内容为空。修法：

- `src/app/layout.tsx` 移除 `headers()`。
- `src/proxy.ts` 的 CSP `script-src` 改 `'self'`。
- 新增 `DarkModeScript`（内联主题脚本）。

结果：91 页全静态。

## 4. 涉及文件

**新增**：`src/lib/route-adapter.ts` · `src/lib/posts/*` · `src/app/styles/*`（10 模块）· `src/components/home/{EditorialHero,CuratedLinksPreview,FeaturedArticleRail,ManifestoSection,ReadingPathSection}.tsx` · `docs/performance-baseline.md` · `docs/specs/2026-06-29-css-import-fix-design.md`
**修改**：`src/app/globals.css`（2804 行 → 12 行）· `src/app/layout.tsx` · `src/proxy.ts` · `src/components/blog/SearchBar.tsx`
**新增（缓存）**：`src/lib/cache.ts`

## 5. 数据或接口变化

无对外 API。内部：`createCache<T>` 统一缓存；`ContentSource` 接口 + `createPostRepository` 工厂。

## 6. 验收结果

| 时点      | 命令/指标   | 结果                                                                 | 出处                                            |
| --------- | ----------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| `b615283` | 静态构建    | **91 页全静态**                                                      | commit body                                     |
| `b615283` | 测试        | **187 tests 全绿**                                                   | commit body                                     |
| `b615283` | 内容追踪    | `content/*` 与 `projects.json` 进入 NFT trace                        | commit body                                     |
| 06-28     | bundle 基线 | 最大单 JS chunk **272.5 KB / 300 KB** · 总静态产物 1.08 MB / 2.00 MB | `docs/performance-baseline.md`（2026-06-28 表） |

### Lighthouse CI 基线（2026-06-29 · desktop preset · 2 runs 平均）

来源标注 CI `lighthouse` job **run `28362770380`**：

| 页面                      | Perf | A11y | CLS  |
| ------------------------- | ---- | ---- | ---- |
| `/`                       | 0.85 | 0.96 | 0.00 |
| `/blog/nextjs-app-router` | 0.83 | —    | 0.13 |
| `/about`                  | 0.97 | —    | —    |
| `/projects`               | 0.97 | —    | —    |

> 这是本仓**第一份 Lighthouse 基线**。文章页 CLS 0.13 那个值，就是后来 2026-10 的 R12 风险（间歇失败 0.298）的历史源头。

## 7. 遗留问题

- CSS 拆分后的 `@import` 静默丢弃坑—— 修法进了 `docs/specs/2026-06-29-css-import-fix-design.md`。
- 文章页 CLS 0.13 基线—— 2026-10 演化为 R12。

## 8. 与今日的差异

| 项         | 本阶段（2026-06-30）         | 今日（2026-10-14）                          |
| ---------- | ---------------------------- | ------------------------------------------- |
| 首页形态   | 编辑式叙事（Editorial Hero） | 工作台（WorkspaceHero，2026-10-07 重写）    |
| 渲染模式   | 全静态（91 页）              | 每请求动态（CSP nonce，ADR-0003）           |
| CSS 模块数 | 10 个                        | 15 个（新增 controls/workspace/reading 等） |
| 搜索       | 客户端 + `Ctrl+K`            | 客户端 Fuse（同方向，契约重建）             |
