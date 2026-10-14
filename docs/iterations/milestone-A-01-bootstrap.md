# Milestone A-01 · 建站与内容体系

> 阶段：2026-06-21 ~ 2026-06-24 · 状态：**Completed（历史里程碑）**
> 证据基准：`1bdfbd3`（建站）→ `fa1b133`（本段末）
> 关联：[PROJECT-HISTORY.md](./PROJECT-HISTORY.md) · 后续 [A-02](./milestone-A-02-restructure-csp.md)

---

## 1. 目标

从零搭出一个可部署的 Next.js 16 个人博客：文章列表与详情、标签、项目页、评论、分页、回到顶部；随后补足内容、建立分类体系、接上 CI 与 Lighthouse 门禁、打通 Vercel 部署。

## 2. 关键提交

| 日期       | commit                            | 做了什么                                                                           |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| 2026-06-21 | `1bdfbd3`                         | `feat: init personal blog with Next.js 16` — 首次提交，一次性落地整个骨架          |
| 2026-06-21 | `842cfac`                         | 接入 Giscus 评论（MutationObserver 同步主题）+ BackToTop + Pagination              |
| 2026-06-21 | `f784f04`                         | 填入真实 Giscus repo/category ID                                                   |
| 2026-06-24 | `f2bf13b`                         | 全面升级：修 30 个 E2E、ImageZoom 迁 `next/image`、加 LICENSE、10 篇文章、测试套件 |
| 2026-06-24 | `b3daad0`                         | 新增 3 篇文章 + Bundle 预算调优（CSS 100KB→300KB）+ 性能审计                       |
| 2026-06-24 | `dfd4059`                         | 删除重复的 PostgreSQL 文章                                                         |
| 2026-06-24 | `cbbcbbc`                         | 分类体系 + Lighthouse CI + 工程治理                                                |
| 2026-06-24 | `219ace7` · `b1897e0` · `fa1b133` | Vercel 部署 workflow 及其修复                                                      |

## 3. 实现步骤

### 3.1 骨架（`1bdfbd3`）

一次性落地 40 个文件：

- 路由：`src/app/{page,layout,sitemap}.tsx`、`src/app/blog/[slug]/page.tsx`、`src/app/tags/[tag]/page.tsx`。
- 数据层：`src/lib/{posts,projects,tags,constants}.ts`。
- 组件：`src/components/{blog,layout,projects,ui}/`。
- 脚本：`scripts/generate-rss.mjs`（当时是 `.mjs`，后改 `.ts`）。
- 规格：`BLOG_SPEC.md`（795 行）。

此时 `package.json` 的 `"name"` 是 **`blog`**（不是今天的 `chronicle`），scripts 只有 `dev/build/start/lint`——**没有 `test`**。

### 3.2 评论与交互（`842cfac` · `f784f04`）

- `src/components/comments/Giscus.tsx`（103 行）：嵌入 Giscus，用 MutationObserver 跟随站点明暗主题切换。
- `src/components/blog/Pagination.tsx`（48 行）、`src/components/ui/BackToTop.tsx`（46 行）。
- `f784f04` 填入真实的 repo/category ID，评论真正可用。

> 这三样（Giscus 评论、Pagination、BackToTop）里，**Giscus 与 Pagination 后来都被删除**（Giscus 于 2026-10-07 工作台重构；Pagination 类于 2026-10-08 清死类）。BackToTop 保留至今。

### 3.3 内容与测试体系（`f2bf13b`）

- 修复 30 个失效的 E2E。
- `ImageZoom` 从 `<img>` 迁到 `next/image`。
- 加 `LICENSE`（MIT）。
- 补 10 篇文章，建立 Vitest 单测 + Playwright E2E 套件。
- **首次引入 `next/font/google`**（`src/app/layout.tsx`）——这一点很关键，它埋下了 2026-10 的 R15 风险（构建期联网拉字体），后来由 ADR-0008 改为 `next/font/local` 自托管。

### 3.4 分类体系 + CI（`cbbcbbc`）

- `src/lib/categories.ts`（65 行）+ `src/lib/categories.test.ts`（138 行）：从标签推断出 6 个分类。
- 新增 `/categories` 与 `/categories/[category]` 路由。
- `lighthouse.config.js`（59 行）：建立 Lighthouse 门禁配置。
- `.github/workflows/ci.yml`（31 行）：首个 CI。
- `vercel.json`、`.nvmrc`（v24）、`CLAUDE_CODE_HANDOFF.md`（90 行，后删）。

## 4. 涉及文件

**新增**：`src/app/{page,layout,sitemap}.tsx` · `src/app/blog/[slug]/page.tsx` · `src/app/tags/[tag]/page.tsx` · `src/app/categories/{page.tsx,[category]/page.tsx}` · `src/lib/{posts,projects,tags,constants,categories}.ts` · `src/components/comments/Giscus.tsx` · `src/components/blog/Pagination.tsx` · `src/components/ui/BackToTop.tsx` · `scripts/generate-rss.mjs` · `lighthouse.config.js` · `.github/workflows/ci.yml` · `vercel.json` · `.nvmrc` · `LICENSE` · `BLOG_SPEC.md`
**删除**：重复的 PostgreSQL 文章（`dfd4059`）

## 5. 数据或接口变化

- `src/types/index.ts`：新增 `PostMeta` / `PostFull` / `Project` 等类型。
- 无对外 API。

## 6. 验收结果

| 时点      | 命令/指标      | 结果                                  | 出处        |
| --------- | -------------- | ------------------------------------- | ----------- |
| `f2bf13b` | 单元测试       | **115/115 通过**                      | commit body |
| `f2bf13b` | E2E 测试       | **30/30 通过**                        | commit body |
| `f2bf13b` | 生产构建       | **69 页面生成成功**                   | commit body |
| `f2bf13b` | ESLint         | 0 错误                                | commit body |
| `cbbcbbc` | 全量测试       | **136 测试 / 0 lint errors**          | commit body |
| `cbbcbbc` | 静态构建       | **90 静态页**                         | commit body |
| `b3daad0` | 构建产物       | JS 1.03 MB · CSS 316 KB               | commit body |
| `b3daad0` | 首页实验室指标 | TTFB 43ms · CLS 0.0000 · 总传输 590KB | commit body |

**未找到证据**：`1bdfbd3`（建站）本阶段无任何测试或构建数字记录——当时没有 `pnpm test` 脚本，无法跑测试。不编造。

## 7. 遗留问题

- 无测试的建站阶段：`1bdfbd3` 提交时 scripts 里没有 `test`，测试体系是 `f2bf13b` 才建的。
- `next/font/google` 已引入但未评估构建期联网风险（2026-10 才暴露为 R15）。
- `constants.ts` 作为站点配置入口——后于 2026-07-04（`cbdd23f`）迁移到 `src/lib/site.ts`。

## 8. 与今日的差异

| 项       | 本阶段（2026-06-24）       | 今日（2026-10-14）                    |
| -------- | -------------------------- | ------------------------------------- |
| 包名     | `blog`                     | `chronicle`                           |
| 评论     | Giscus 已接入              | **已删除**（2026-10-07）              |
| 分页     | `Pagination.tsx`           | **已删除**（2026-10-08 清死类）       |
| 字体     | `next/font/google`         | `next/font/local` 自托管（ADR-0008）  |
| 站点配置 | `src/lib/constants.ts`     | `src/lib/site.ts`                     |
| RSS 脚本 | `scripts/generate-rss.mjs` | `scripts/generate-rss.ts`             |
| 测试     | 136 测试（`cbbcbbc` 自报） | 80 files / 662 tests（见 HANDOFF §2） |
