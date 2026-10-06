# 01 · 项目审计（Iteration 00 基线）

> 状态：Completed（审计完成，未改业务代码）
> 日期：2026-10-06
> 分支：`feature/architecture-rebuild-2026-10-06`
> 审计人：Claude Code（耐心师姐）
> 关联：`docs/PROJECT.md`（形态与栈 SSOT）· `docs/ARCHITECTURE.md`（运行时边界）· `docs/specs/2026-10-06-architecture-rebuild-design.md`（本轮重构 Spec）

---

## 0. 审计范围与前提

本审计**在既有重构分支上执行**。该分支此前已完成一轮「删功能 + 数据层裁剪」（删评论 / 搜索 / 数字花园 / 收藏导航），审计记录的是**该分支的当前状态**，并明确标注哪些是「既有债」、哪些是「上一轮重构引入的过渡态」。

**审计未做的事**：未开始视觉重构；未改任何业务代码（仅修了 3 个因删功能而失效的测试断言 + 格式化）。

---

## 1. 项目概览

| 项       | 值                                                              |
| -------- | --------------------------------------------------------------- |
| 产品名   | 西江月（工程身份 Chronicle）                                    |
| 形态     | 个人博客 + 作品集（内容站，非管理面板 / 非网关）                |
| GitHub   | [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)         |
| 本地路径 | `D:\projects\Chronicle`（Windows 原生；2026-10-06 从 WSL 迁回） |
| 生产     | https://incca.ccwu.cc（Vercel）                                 |
| 许可     | MIT · Copyright 2026 雨天狂奔                                   |
| 默认分支 | `master`（实测 `git rev-parse --abbrev-ref origin/HEAD`）       |

---

## 2. 当前技术栈（实测自 `package.json` / 配置文件）

| 层            | 选型                                                         | 版本                                        |
| ------------- | ------------------------------------------------------------ | ------------------------------------------- |
| 框架          | Next.js App Router                                           | `16.3.5`                                    |
| UI 库         | React                                                        | `19.3.0`                                    |
| 语言          | TypeScript strict                                            | `^5`（实际 5.9.3）                          |
| 样式          | Tailwind CSS v4（`@tailwindcss/postcss`）+ BEM 语义 CSS 模块 | `^4.3.3`                                    |
| 内容          | MDX（`next-mdx-remote`）+ `js-yaml` + 本地 JSON              | `^6.0.0` / `4.3.2`                          |
| 校验          | Zod                                                          | `^4.4.3`                                    |
| 高亮          | Shiki（经 `rehype-pretty-code`）                             | `^4.2.0`                                    |
| 搜索          | fuse.js                                                      | `^7.4.2`（**已无代码引用，待移除，见 §9**） |
| 包管理        | pnpm                                                         | 钉 `11.8.0`（`packageManager`）             |
| Node          | `engines: >=24`（2026-10-06 从 `22.x` 改，本机 24.16.0）     | —                                           |
| 部署          | Vercel + GitHub Actions                                      | —                                           |
| 测试          | Vitest（单元/组件）+ Playwright（E2E）+ Stryker（变异）      | `4.1.11` / `1.63.0` / `9.6.1`               |
| Lint / Format | ESLint 9（`eslint-config-next`）+ Prettier 3                 | —                                           |
| 图标          | **无独立图标库**（内联 SVG / 文本）                          | —                                           |
| 状态管理      | **无**（RSC 为主，客户端仅局部 `useState`/hooks）            | —                                           |

**依赖规模**：dependencies 21 · devDependencies 33。

---

## 3. 运行方式（完整命令）

```bash
# 安装（仓内自动用钉住的 pnpm 11.8.0）
pnpm install

# 开发
pnpm dev                      # localhost:3000

# 生产构建（必须给非 localhost 的站点 URL，否则 next.config.ts:27 抛错）
$env:NEXT_PUBLIC_SITE_URL='https://incca.ccwu.cc'; pnpm build

# 质量门
pnpm typecheck                # tsc --noEmit
pnpm lint                     # eslint
pnpm test                     # vitest run
pnpm test:e2e                 # Playwright（生产构建后）
pnpm check:seo                # SEO / 内容门禁
pnpm check:production-content # 生产内容 smoke（需线上或 --base-url）
pnpm check:docs               # 文档死链
pnpm format:check             # prettier
```

**环境变量**（`.env.example`）：`NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_GISCUS_*`（Giscus 已删，env 待清）。

---

## 4. 当前目录结构（实测）

```
content/                 blog/*.mdx（20 篇）+ about.mdx
data/                    projects.json · links.json（links 已退出路由）
generated/content-snapshot/   posts-meta.json · posts-full.json · manifest.json
src/
├── app/                 路由页面 + api/csp-report
├── components/          blog/ · home/ · layout/ · projects/ · ui/
├── hooks/               useInView · usePersistedEnum · usePrefersFinePointer · usePrefersReducedMotion
├── lib/                 数据层（posts/ · content-snapshot/ · schemas/）+ 站点配置
├── server/              content/（facade）· rate-limit.ts
├── types/               PostMeta / PostFull / Project / TagInfo / CategoryInfo
└── test/                测试 mocks
e2e/                     5 个 Playwright spec
scripts/                 构建/检查脚本（RSS、snapshot、SEO、SRI、blur…）
docs/                    文档体系（见 docs/README.md）
```

---

## 5. 路由与页面清单（实测）

### 页面路由（`src/app/**/page.tsx`）

| 路由                                   | 文件                         | 数据来源             | 状态                       |
| -------------------------------------- | ---------------------------- | -------------------- | -------------------------- |
| `/`                                    | `app/page.tsx`               | posts + projects     | 保留（待重构为工作台首页） |
| `/about`                               | `app/about/page.tsx`         | `content/about.mdx`  | 保留                       |
| `/blog`                                | `app/blog/page.tsx`          | 分页 posts           | 保留                       |
| `/blog/[slug]`                         | `app/blog/[slug]/page.tsx`   | post detail          | 保留                       |
| `/projects`                            | `app/projects/page.tsx`      | `data/projects.json` | 保留                       |
| `/projects/[id]`                       | `app/projects/[id]/page.tsx` | project detail       | 保留                       |
| `/tags` `/tags/[tag]`                  | `app/tags/*`                 | tag 聚合             | 保留                       |
| `/categories` `/categories/[category]` | `app/categories/*`           | category 聚合        | 保留                       |
| `/series` `/series/[series]`           | `app/series/*`               | series 聚合          | 保留                       |
| `/garden`                              | ~~`app/garden/`~~            | —                    | **已删（上一轮）**         |
| `/links`                               | ~~`app/links/`~~             | —                    | **已删（上一轮）**         |

### API 路由

| 路由                      | 状态                                       |
| ------------------------- | ------------------------------------------ |
| `POST /api/csp-report`    | 保留（CSP 上报，依赖 `server/rate-limit`） |
| `GET /api/search`         | **已删（上一轮）**                         |
| `GET /api/preview/[slug]` | **已删（上一轮）**                         |

### 特殊文件

`sitemap.ts` · `robots.ts` · `manifest.ts` · `opengraph-image.tsx` · `error.tsx` · `not-found.tsx` · `proxy.ts`（CSP nonce 中间件）。

---

## 6. 现有功能矩阵

| 功能                               | 状态               | 说明                                         |
| ---------------------------------- | ------------------ | -------------------------------------------- |
| 博客文章（MDX）                    | 保留               | 20 篇，`content/blog/*.mdx`                  |
| 作品集                             | 保留               | `data/projects.json`，6 项目                 |
| 关于页                             | 保留               | `content/about.mdx`                          |
| 分类 / 标签 / 专题                 | 保留               | 聚合页 + 详情页                              |
| RSS / sitemap / robots             | 保留               | `scripts/generate-rss.ts` + `app/sitemap.ts` |
| SEO / JSON-LD / OG image           | 保留               | `lib/metadata.ts` · `lib/jsonld.ts`          |
| CSP nonce + 安全头                 | 保留               | `src/proxy.ts`（ADR-0003）                   |
| SRI（`ENABLE_SRI=1` 门闩）         | 保留               | ADR-0005                                     |
| 内容快照（生产默认）               | 保留               | `generated/content-snapshot/`                |
| 深色模式                           | 保留               | `tokens.css` `.dark` + `DarkModeScript`      |
| 阅读进度 / 目录 / 阅读偏好         | 保留               | `components/blog/*`                          |
| 代码高亮 + 复制                    | 保留               | `CodeBlock` + `CodeBlockCopyButton`          |
| 图片放大                           | 保留               | `ImageZoom`                                  |
| **评论（Giscus）**                 | **已删（上一轮）** | 连带样式 / env 待清                          |
| **全文搜索（Fuse + /api/search）** | **已删（上一轮）** | fuse.js 依赖待移除                           |
| **数字花园（wikilink 网络）**      | **已删（上一轮）** | 连带 lib / 快照字段已清                      |
| **收藏导航（/links）**             | **已删（上一轮）** | `data/links.json` 物理保留                   |
| 收藏 / 最近阅读                    | **不存在**         | 新方案拟新增（localStorage）                 |

---

## 7. 内容数据流

```
content/blog/*.mdx
  → lib/parse-frontmatter.ts
  → lib/schemas/post-frontmatter.ts（Zod）
  → lib/posts/repository.ts（缓存 + 校验 + readingTime）
  → lib/posts/query.ts（筛选/排序/分页）
  → server/content/index.ts（facade）
  → app/blog/* · app/tags/* · app/categories/* · app/series/*

data/projects.json → lib/json-content-repository.ts → lib/projects.ts → server/content → app/projects/*
content/about.mdx  → lib/about.ts → server/content → app/about/*

生产：CONTENT_BACKEND=snapshot → lib/content-snapshot/read.ts（读 posts-meta / posts-full）
```

---

## 8. 当前内容模型（实测自 `src/types/index.ts` + `post-frontmatter.ts`）

**PostMeta**（列表用）：`PostFrontmatter` 全部字段 + `slug` + `readingTime` + `wordCount` + `excerpt`。
**PostFull**（详情用）：PostMeta + `content`。

**frontmatter 字段**（Zod schema）：`title`（必填）· `description`（必填，min 1）· `date`（必填）· `tags`（默认 `[]`）· `published`（默认 true）· `featured`（默认 false）· `category`（可选，缺省从 tags 推断）· `series` / `seriesSlug` / `seriesOrder`（可选）· `image`（可选）· `license`（可选）。

**上一轮已删字段**：`searchText`（搜索索引）· `headings`（曾派生自正文，实际无消费者）。

**历史兼容**：`filenameToSlug` 去掉 `YYYY-MM-` 前缀；`published:false` 生产过滤；`category` 由 `category-rules` 从 tags 推断。

---

## 9. 当前设计问题

| #   | 维度       | 问题                                                                                 | 证据                                                            |
| --- | ---------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| D1  | 视觉一致性 | 视觉是「Paper Gallery / Atelier」纸质暖色调，与新目标「AI 工作台中性灰」**风格冲突** | `tokens.css` `--bg:#f1f0eb` 暖纸色 + `--brand:#59756d` 鼠尾草绿 |
| D2  | 信息架构   | 导航项与已删路由不一致（死链）                                                       | `lib/navigation.ts:10` 仍含 `/garden` `/links`                  |
| D3  | 布局       | 每页各自 header/footer，**无统一应用外壳**                                           | `app/layout.tsx` 直接 Header+main+Footer                        |
| D4  | 圆角/阴影  | 半径已收 4/8，但阴影系统仍有 5 档（`--shadow-xs…xl`）偏重                            | `tokens.css:75-80`                                              |
| D5  | 密度       | 首页是「Editorial Hero + 多 section」营销式结构，非工作台                            | `app/page.tsx`                                                  |
| D6  | 搜索       | **无搜索入口**（上一轮删了，新方案要求它是核心）                                     | —                                                               |

---

## 10. 当前工程问题 / 技术债

| #   | 类别   | 问题                                                                                                                                     | 严重度 | 来源                                       |
| --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------ |
| E1  | 死链   | `MAIN_NAV_ITEMS` 含已删 `/garden` `/links`，Header/MobileNav 渲染死链                                                                    | 高     | 上一轮引入                                 |
| E2  | 死链   | `error.tsx:42` / `not-found.tsx:29` / `EditorialHero.tsx:35` / `ManifestoSection.tsx:15` 链到 `/links`                                   | 高     | 上一轮引入                                 |
| E3  | 死链   | `e2e/blog.spec.ts` / `mobile.spec.ts` / `home.spec.ts` 引用已删的 `/api/search` `/api/preview` `/links`                                  | 中     | 上一轮引入                                 |
| E4  | 死代码 | `scripts/check-production-content.ts:173` 仍探 `/api/search`                                                                             | 中     | 上一轮引入                                 |
| E5  | 死依赖 | `fuse.js` 仍在 `dependencies`，无代码引用                                                                                                | 低     | 上一轮引入                                 |
| E6  | 死文档 | `docs/API.md` 仍描述 `/api/search` `/api/preview`                                                                                        | 中     | 上一轮引入                                 |
| E7  | 死配置 | `.env.example` 的 Giscus 三项仍存                                                                                                        | 低     | 上一轮引入                                 |
| E8  | 死代码 | `lib/ops-readiness.ts:197` 提及 `/api/search`                                                                                            | 低     | 上一轮引入                                 |
| E9  | 内容   | `content/blog/2026-07-21-digital-garden-*.mdx` 等 2 篇花园相关文章，正文含 wikilink 语法（`[[...]]`）但渲染插件已删 → **会显示为字面量** | 中     | 上一轮引入（新方案须决定保留/改写）        |
| E10 | 快照   | `generated/content-snapshot/` 仍是旧版本产物（含 searchDocs/gardenGraph/positions），schema version 已改 2                               | 中     | 上一轮引入，需 `pnpm content:build` 重生成 |

---

## 11. 重构约束（不可破坏）

1. 20 篇文章 slug **不变**；URL 结构保持（`/blog/<slug>` 等）。
2. 现有内容 frontmatter 向后兼容；不删字段、不改语义。
3. CSP nonce + SRI 安全模型**不动**（ADR-0003 / 0005）。
4. 内容快照机制保留；生产仍读 snapshot。
5. SEO（metadata / sitemap / RSS / JSON-LD）不退化。
6. 不引入账号系统 / 数据库 / AI 服务 / 付费服务。
7. 每步可回滚；不一次性推翻。

---

## 12. 可复用资产

| 资产                   | 位置                                                                                                     | 复用判断                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 数据层仓库模式         | `lib/posts/repository.ts` + `query.ts`                                                                   | **直接复用**（干净）                       |
| 内容快照机制           | `lib/content-snapshot/`                                                                                  | 复用                                       |
| Zod frontmatter schema | `lib/schemas/post-frontmatter.ts`                                                                        | 复用                                       |
| 站点配置               | `lib/site.ts`                                                                                            | 复用（清 Giscus 段）                       |
| Metadata / JSON-LD     | `lib/metadata.ts` · `lib/jsonld.ts`                                                                      | 复用                                       |
| CSP / 安全头           | `src/proxy.ts` · `lib/csp.ts`                                                                            | 复用                                       |
| UI primitive           | `components/ui/`（button/badge/card/sheet/popover/separator/skeleton）                                   | 复用 + 扩 design token                     |
| 文章组件               | `components/blog/`（MdxContent/CodeBlock/ImageZoom/TOC/Pagination/ArticleHeader/Nav/Related/SeriesPath） | 复用                                       |
| 布局组件               | `components/layout/`（Header/Footer/MobileNav/PageSection/EmptyState/ArchiveCard）                       | 改造                                       |
| 设计令牌               | `app/styles/tokens.css`                                                                                  | **改造**（暖色 → 中性灰，语义 token 保留） |
| 测试基建               | Vitest + Playwright + 74 测试文件                                                                        | 复用                                       |
| 脚本门禁               | `scripts/`（SEO/snapshot/SRI/docs-link）                                                                 | 复用 + 修死链                              |

---

## 13. 不应破坏的行为

- 全部 20 篇文章可访问，URL 不变。
- RSS / sitemap 输出完整。
- CSP nonce 每请求下发；生产 SRI 按 env 门闩。
- 深色模式可用。
- 键盘可达性（skip-link / focus）不退化。
- 构建必须 `NEXT_PUBLIC_SITE_URL`（fail-fast 保留）。

---

## 14. 初步风险

| 风险                           | 概率 | 影响 | 缓解                            |
| ------------------------------ | ---- | ---- | ------------------------------- |
| 视觉大改导致回归               | 高   | 高   | 分支并行 + 每迭代跑全量验证     |
| 花园文章正文 wikilink 渲染退化 | 中   | 中   | 决策：改写这 2 篇或恢复轻量渲染 |
| 快照 schema 变更导致生产不一致 | 中   | 高   | 重跑 `content:build` 并提交     |
| 搜索回归（新方案要求）         | 中   | 中   | 轻量客户端搜索，规模匹配 20 篇  |
| 死链未清导致 SEO/UX 退化       | 高   | 中   | 迭代 02/06 专门清               |

---

## 15. 建议优先级

1. **P0**：清死链（E1–E4、E6–E8）+ 重生成快照（E10）——先让站「自洽」。
2. **P1**：设计系统重建（中性灰 token）+ App Shell（工作台布局）。
3. **P1**：首页 + 搜索（新方案核心）。
4. **P2**：文章系统 / 内容导航重构。
5. **P3**：质量优化 + 发布。

---

## 附：本轮基线验证结果

| 命令                                      | 结果                   | exit |
| ----------------------------------------- | ---------------------- | ---- |
| `pnpm typecheck`                          | 通过                   | 0    |
| `pnpm lint`                               | 通过（0 error）        | 0    |
| `pnpm test`                               | 74 文件 / 574 测试全过 | 0    |
| `pnpm build`（带 `NEXT_PUBLIC_SITE_URL`） | 成功，105 静态页       | 0    |
| `pnpm format`                             | 已修复 CRLF / 格式     | 0    |

**未验**：`pnpm test:e2e`（依赖生产构建 + Playwright 浏览器，且当前 spec 引用已删路由，预期失败——留到迭代 02 修）；`pnpm check:production-content`（需线上）。
