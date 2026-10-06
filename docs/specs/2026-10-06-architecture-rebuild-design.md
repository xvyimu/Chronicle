# Spec: Chronicle 架构精简重写（2026-10-06）

> **状态**：DRAFT — 待人工审阅确认。未获批前不写业务代码。
> **性质**：本仓 `docs/specs/` 惯例（带日期设计文档）。
> **范围**：个人博客/作品集（西江月 · `xvyimu/Chronicle`）· Windows 原生 `D:\projects\Chronicle`。

---

## 0. ASSUMPTIONS（先摊开，等纠正）

1. **栈不变**：保留 Next.js 16 App Router + React 19 + TypeScript strict + Tailwind v4。栈级约束仍以 `docs/PROJECT.md` 为准。
2. **形态不变**：个人博客 + 作品集 + 阅读站；不引入管理面板、Go 网关、Python AI、SQL 内容源（`ARCHITECTURE_TARGET.md` L2 裁定继续有效）。
3. **安全模型不变**：CSP per-request nonce + `strict-dynamic`、SRI 门闩、HTML 动态渲染——**不动**。
4. **内容与数据**：`content/blog/*.mdx`（20 篇）、`content/about.mdx`、`data/projects.json` **保留**。`data/links.json` 内容保留但退出路由（收藏导航移除）。
5. **评论（Giscus）删除**：`components/comments/`、`blog/[slug]` 的 Giscus 块、`src/lib/site.ts` 的 Giscus 配置、相关样式一并移除。
6. **Node engines**：`package.json` `engines.node` → `">=24"`；`.nvmrc` / `.node-version` → `24`。CI 保持 Node 22（不在此次编码范围）。pnpm 双层版本（全局 12.9.1 vs 钉 11.8.0）不变。
7. **分支并行**：全部改动在 `feature/architecture-rebuild-2026-10-06` 分支；master 不动；重写完成并人工验收后合入。
8. **不保留**：全文搜索、数字花园、收藏导航（下述）。

---

## 1. Objective

- **做什么**：精简并重写 Chronicle 的实现——删除评论、全文搜索、数字花园、收藏导航四个已决定移除的功能；重写 `src/` 结构为更小的阅读核心；清理死代码与技术债。**不换栈、不改安全模型、不动内容数据。**
- **为什么**：现有实现偏重（19 个 CSS 文件 / 4880 行、`GardenExplorer.tsx` 529 行、4 个 API、2 套搜索链路），站只有 20 篇文章，功能超配。重写后成为纯粹、精简、好维护的个人阅读站。
- **用户**：作者本人维护内容；读者阅读。
- **成功长什么样**：重写后 `src/` 结构更小更清晰、删除四个功能、lint/test/build 全绿、dev server 正常、生产路由无死链。

## 2. Tech Stack（来自现有 `package.json`，不臆造）

- Next.js 16.3.5 · React 19.3 · TypeScript 5 strict · Tailwind CSS 4（postcss）
- MDX（`next-mdx-remote` + `remark-gfm` + `rehype-slug` + `rehype-autolink-headings` + `rehype-pretty-code`）
- Shiki · `js-yaml`（frontmatter）· Zod（校验）· fuse.js（**依赖保留但移出主代码路径**，若不再使用则从依赖移除——见 Boundaries Ask-first）
- Vitest + Testing Library · Playwright · ESLint 9 · Prettier · pnpm 11.8.0（钉）

## 3. Commands（真实 npm scripts，来自 `package.json`）

```
pnpm dev           # 本地开发
pnpm typecheck     # tsc --noEmit
pnpm test          # vitest run
pnpm build         # 生产构建（须 NEXT_PUBLIC_SITE_URL 非 localhost）
pnpm lint          # eslint
pnpm format:check  # prettier --check
pnpm check:seo     # SEO 检查
pnpm test:e2e      # Playwright（生产构建后）
pnpm test:mutation # Stryker（可选）
pnpm content:build # 重写后快照生成
```

## 4. Project Structure（Target）

### 4.1 保留（现状 → 目标）

**UI 层重写**为更小更清晰的阅读核心：

```
src/components/
├── layout/       # Header / Footer / MobileNav / PageSection / EmptyState / ArchiveCard
├── blog/         # BlogCard / BlogList / Article* / MdxContent / Pagination / TagLink / Reading*（保留阅读所需）
├── ui/           # 通用 primitive（button / badge / card / MetaBadge / ThemeToggle / BackToTop / DarkModeScript）
└── home/         # EditorialHero / FeaturedArticleRail / 等等（按内容需要合并，删 CuratedLinksPreview）
```

**数据层**（仓库模式保留，移入重写后的 `src/lib/`）——**保留**的核心：

```
src/lib/
├── posts/           # repository.ts / query.ts（保留，去掉 search-text / wikilink / link-graph / force-layout / garden-view）
├── content-snapshot/  # build / write / read / types / paths（保留；payload 去掉 search-docs / gardenGraph / positions）
├── schemas/         # post-frontmatter.ts
├── content-source.ts / content-dirs.ts / cache.ts          # 保留
├── metadata.ts / jsonld.ts / site.ts（去 Giscus）/ csp.ts / utils.ts / route-adapter.ts  # 保留
├── categories.ts / category-rules*.ts / tags.ts / series.ts / projects.ts / about.ts     # 保留
├── image-blur-data.ts / image-blur-map.ts                  # 保留
└── navigation.ts / observability.ts / ops-readiness.ts（按需保留）
```

**删除**：`src/lib/posts/wikilink.ts`、`link-graph.ts`、`force-layout.ts`、`garden-view-storage.ts`、`search-text.ts`；`src/lib/search/` 整个；`src/lib/links*.ts`、`link-preview.ts`。

### 4.2 删除（整目录/文件）

```
src/components/comments/               # Giscus
src/app/garden/                        # 数字花园
src/app/links/                         # 收藏导航
src/app/api/search/                    # 全文搜索 API
src/app/api/preview/[slug]/            # 预览 API（依赖 link-preview）
src/lib/search/                        # 共享搜索契约
src/server/search/                     # 搜索服务端（引擎/限流）
src/lib/posts/{wikilink,link-graph,force-layout,garden-view-storage,search-text}.ts
src/lib/links*.ts / link-preview.ts
e2e/*garden* e2e/*search* e2e/*links* e2e/*comments*（若有）
```

### 4.3 API 面（删除后）

- `POST /api/csp-report` **保留**（CSP 上报，无搜索依赖——已核 `csp-report/route.ts` 只依赖 `server/search/rate-limit`，rate-limit 拆出来复用即可）。
- `/api/preview/[slug]` **删除**（依赖 link-preview）。
- `/api/search` **删除**。

### 4.4 CSS 收敛

- `src/app/styles/*` 从 19 文件收敛到约 9–10 个：`tokens` / `base` / `components` / `controls` / `blog-ui` / `article-ui` / `prose` / `animations` / `responsive`。
- 删除：`search-ui.css`、`links.css`、`backdrop.css`(若仅花园/首页特效用)、`garden.css`、`home-sections/css` 中收藏预览专属段、`blog-ui.css` 中评论/搜索专属段。
- 根 layout 全局加载顺序保持（见 `docs/ARCHITECTURE.md` §6），**CSS 显式 import 纪律不变**（Tailwind v4 静默丢 `@import`）。

## 5. Code Style

- 对齐 `AGENTS.md` / `CLAUDE.md`：TypeScript strict、React Server Components 默认、组件边界 `components ↛ @/server`（`src/lib/module-boundaries.test.ts` 守门）。
- 命名/注释密度跟仓库现状；不引入新风格。
- 不改 `docs/PROJECT.md`（栈不变）；如需记重写决策另开 ADR。

## 6. Testing Strategy

- **框架**：Vitest（单元/集成）+ Playwright（E2E）。位置不变（`*.test.ts(x)`、`e2e/`）。
- **删除**：Giscus / search / garden / links 相关测试（`components/comments/Giscus.test.tsx`、`src/lib/search/`、`src/server/search/`、`src/lib/posts/{wikilink,link-graph,force-layout,garden-view,search-text}.test.ts`、`links*.test.ts`、`link-preview.test.ts` 等）。
- **保留**：posts repository / query / content-snapshot / cache / csp / site / navigation / utils / module-boundaries 等阅读核心测试。
- **新增（若有）**：重写后的组件冒烟测试；`module-boundaries.test.ts` 更新（组件不再能触达已删模块）。
- **门禁**：`pnpm typecheck && pnpm test && pnpm build` 全绿；`pnpm lint` 无 error（允许既有 warning，若修可一并修）。

## 7. Boundaries

- **Always**：提交前跑 `typecheck` + `test` + `build`；新增代码遵循现有命名/注释密度；删文件前 grep 确认无残留引用。
- **Ask first**：改 `docs/PROJECT.md`（形态/栈 SSOT）；动 CI（`.github/workflows/ci.yml`）；改 Vercel 配置/环境变量（`vercel.json` 若要改）；加/删第三方依赖（如 fuse.js 是否从 dependencies 移除）；生产 cutover / push / merge / deploy——**一律先授权**。
- **Never**：提交密钥；删除失败测试来自证「通过」；越权改别的功能；未经授权 push / merge / 动 master。

## 8. Success Criteria

1. `src/` 里无 `Giscus / search / garden / links` 残留引用（`grep -rni` 核）。
2. `pnpm typecheck` exit 0 · `pnpm test` exit 0 · `pnpm build` exit 0（本回合实跑报 exit code）。
3. `pnpm lint` 无 error（warning 若修可修，但**不新增**）。
4. `pnpm dev` 后 `localhost:3000` 200；`/`、`/blog`、`/blog/<slug>`、`/about`、`/projects`、`/projects/<id>`、`/tags`、`/categories`、`/series` 全 200。
5. 删除的四个路由（`/garden`、`/links`、`/api/search`、`/api/preview/*`）返回 404（Next 默认）。
6. `ag``docs/PROJECT.md` 未变；`docs/ARCHITECTURE.md` 已同步删除项（A1/A2）。
7. `engines.node` = `">=24"`；`.nvmrc` / `.node-version` = `24`；`pnpm install` 后无 `Unsupported engine` warning。
8. 工作区干净（`git status` 无意外改动）。

## 9. Open Questions

1. **fuse.js 是否从 `dependencies` 移除？** 搜索删除后若无引用，倾向移除（Ask-first，等确认）。
2. **`/api/preview/[slug]` 是否保留？** 现状依赖 `link-preview`/搜索链路，倾向删除（见 4.2）。若想保留需重写实现（范围外）。
3. **`site.ts` 的 Giscus 配置**删掉后 `.env.example` 的 Giscus 三项是否也删？倾向删。
4. **`data/links.json` 物理文件**删除还是保留？倾向保留（内容存底，不妨碍路由层删除）。
5. **是否顺手修现有 `lint` 2 个既有 warning**（`GardenExplorer` 不涉及，另一处 `window.location.assign`）？倾向修。

## 10. Default Branch / Feature Branch

- **默认分支**：`master`（实测 `git rev-parse --abbrev-ref origin/HEAD` = `origin/master`）。
- **建议分支**：`feature/architecture-rebuild-2026-10-06`。

---

**裁决句**：保留 Next + React 阅读站、CSP/SRI 安全模型与内容数据；删除评论/搜索/花园/导航四功能；重写 UI 与数据层为更小的阅读核心。Spec 获批后按分支并行实施。
