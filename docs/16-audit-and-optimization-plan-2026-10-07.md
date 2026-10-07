# 16 · 审核报告与优化计划（2026-10-07）

> 状态：一次性审核快照（**只读审核产物，未改任何既有文件**）
> 审核对象：`D:\projects\Chronicle` @ `6326724`（master，工作区干净）
> 审核日期：2026-10-07 · 审核方式：只读命令 + 本地实跑门禁 + 生产构建产物解析
> 关联：[`13-risk-register.md`](./13-risk-register.md) · [`14-decision-log.md`](./14-decision-log.md) · [`15-acceptance-checklist.md`](./15-acceptance-checklist.md)

本文件是**时间点快照**。其中的测试数、体积、对比度均为 2026-10-07 本机实测值，引用前请重新跑一遍命令。

---

## 1. 现状核对（实跑基线）

### 1.1 仓库状态

| 项         | 命令                        | 结果                                                 |
| ---------- | --------------------------- | ---------------------------------------------------- |
| HEAD       | `git rev-parse HEAD`        | `6326724720518953be5baa28473915392caf42ba`           |
| 分支/同步  | `git status --porcelain -b` | `## master...origin/master`（无输出 = 工作区干净）   |
| 最近提交   | `git log --oneline -3`      | `6326724` (#38) → `913c8cf` (#37) → `692e7b3`        |
| 本机运行时 | `node -v` / `pnpm -v`       | `v24.16.0` / `pnpm 11.8.0`（与 `engines >=24` 一致） |

**结论**：任务书所述「HEAD = 6326724（master，工作区应干净）」与实测一致；`913c8cf`（PR #37）已并入 master，不再是未合并分支。

### 1.2 门禁实跑结果（全部在本机、在 HEAD 工作区上执行）

| 门禁               | 命令                                                    | exit  | 关键输出                                                                                              |
| ------------------ | ------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| typecheck          | `pnpm typecheck`                                        | 0     | `tsc --noEmit` 无输出                                                                                 |
| lint               | `pnpm lint`                                             | 0     | `eslint` 无输出                                                                                       |
| unit/integration   | `pnpm test`                                             | 0     | **73 files / 551 tests passed**，15.44s                                                               |
| build（生产）      | `NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` | 0     | 107 静态页；文档路由全为 `ƒ`（动态，符合 CSP nonce 设计）                                             |
| bundle budget      | `pnpm exec tsx scripts/check-bundle-budget.ts`          | 0     | JS chunks 890.3 KB（最大 223.6 KB）· CSS 101.7 KB · 总 891.2 KB / 2.00 MB                             |
| SEO 内容门禁       | `pnpm check:seo`                                        | 0     | `SEO/content check passed.`                                                                           |
| 图片 blur 覆盖     | `pnpm check:blur`                                       | 0     | `blur coverage ok (projects=6, blogImages=0)`                                                         |
| 内容快照漂移       | `pnpm content:verify`                                   | 0     | `snapshot in sync (posts=20, hash=ec03c7dabca8…)`                                                     |
| 文档链接           | `pnpm check:docs`                                       | 0     | `Documentation link check passed (140 Markdown files).`                                               |
| 代码格式           | `pnpm format:check`                                     | 0     | 全部符合 Prettier                                                                                     |
| 文档格式           | `pnpm format:docs:check`                                | 0     | 全部符合 Prettier                                                                                     |
| 生产依赖漏洞       | `pnpm audit --prod`                                     | 0     | `No known vulnerabilities found`                                                                      |
| 全树漏洞（含 dev） | `pnpm audit`（`--registry=https://registry.npmjs.org`） | 1     | **4 条**：1 high（`braces`，经 eslint-config-next）+ 3 moderate（`qs` ×2、`postcss-selector-parser`） |
| e2e                | `pnpm test:e2e`                                         | **1** | **未跑成**，见 1.3                                                                                    |

`git status --porcelain` 在 build 后仍为空 → `pnpm build` 未产生意外的 `public/feed.*` 或快照 diff（因为显式提供了生产 `NEXT_PUBLIC_SITE_URL`）。

### 1.3 未跑成的项：Playwright e2e

```
EXIT=1
Error: browserType.launch: Executable doesn't exist at
  C:\Users\yuanjia\AppData\Local\ms-playwright\chromium_headless_shell-1243\chrome-headless-shell-win64\chrome-headless-shell.exe
  → 43 failed · 2 passed (15.7s)
```

- **原因**：本机从未安装 Playwright 浏览器（`$env:LOCALAPPDATA\ms-playwright` 下无任何已装版本）。失败发生在 `browserType.launch`，**与仓库代码无关**：测试用例被逐个启动失败，不是断言失败。
- 已尝试 `npx playwright install chromium`（195.6 MiB 从 `cdn.playwright.dev` 拉取），至审核结束时下载进度约 **10%**，仍未装完，故 e2e 无本机实测结论。补装后即可复现：`npx playwright install chromium` → `pnpm test:e2e`。
- **替代证据（非本次实跑，来自仓库文档）**：`docs/iterations/iteration-08-code-review-cleanup.md` 与 `15-acceptance-checklist.md:82,109` 记录 e2e `45 passed / 0 failed`；`e2e/` 静态统计为 5 spec files、46 个 `test(` 用例，其中 `e2e/blog.spec.ts:128` 为 `test.skip(csp === '', …)`（dev 跳过 CSP 时不计入），故「46 tests」与「45 passed」是同一事实的两种口径，**不构成矛盾**。

### 1.4 首屏资源实测（生产构建 + `next start`，解析 HTML 内引用的静态 chunk）

| 路由                      | JS（raw / gzip）        | CSS（gzip） | script 数 |
| ------------------------- | ----------------------- | ----------- | --------- |
| `/`                       | 685.1 KB / **215.8 KB** | 15.4 KB     | 13        |
| `/blog`                   | 656.8 KB / 205.6 KB     | 15.4 KB     | 12        |
| `/blog/nextjs-app-router` | 720.5 KB / **229.7 KB** | 19.7 KB     | 14        |
| `/archive`                | 656.8 KB / 205.6 KB     | 15.3 KB     | 12        |
| `/favorites`              | 659.4 KB / 206.9 KB     | 14.8 KB     | 13        |
| `/projects`               | 671.2 KB / 211.0 KB     | 14.2 KB     | 13        |

统计口径：`next start --port 3002` 下抓取渲染后 HTML，提取全部 `/_next/static/**/*.js|css` 引用，读取磁盘字节并对每文件做 gzip（Node `zlib` 默认级别）求和。**这是首屏必须加载集合的近似上界**，不含懒加载 chunk。

### 1.5 深色/浅色 token 对比度实测

脚本按 WCAG 相对亮度公式计算（`#rrggbb` → sRGB 线性化 → 加权和）。

| 组合                                               | 对比度    | 判定                         |
| -------------------------------------------------- | --------- | ---------------------------- |
| light `--text` `#18181b` on `#fafafa`              | 16.974    | AA ✓                         |
| light `--text-soft` `#52525b` on `#fafafa`         | 7.406     | AA ✓                         |
| light `--text-dim` `#6f6f77` on `#fafafa`          | 4.772     | AA ✓（token 注释 4.77 准确） |
| light `--text-dim` on `--bg-soft` `#f4f4f5`        | 4.532     | AA ✓（余量极小）             |
| **light `--brand` `#4f6bed` on `#fafafa`**         | **4.319** | **不达 AA 正文阈值 4.5**     |
| dark `--text` `#fafafa` on `#09090b`               | 19.061    | AA ✓                         |
| dark `--text-soft` `#a1a1aa` on `#09090b`          | 7.763     | AA ✓                         |
| dark `--text-dim` `#7d7d86` on `#09090b`           | 4.879     | AA ✓                         |
| **dark `--text-dim` on `--surface` `#18181b`**     | **4.345** | **不达 AA 正文阈值 4.5**     |
| **dark `--text-dim` on `--bg-elevated` `#1f1f23`** | **4.028** | **不达 AA 正文阈值 4.5**     |
| dark `--text-soft` on `--surface` `#18181b`        | 6.913     | AA ✓                         |
| dark `--brand` `#7c93f5` on `#18181b`              | 6.200     | AA ✓                         |
| dark `--destructive` `#f87171` on `#18181b`        | 6.405     | AA ✓                         |

**重构前对照**（`git show 913c8cf^:src/app/styles/tokens.css`）：

| 组合                                      | 对比度 | 判定    |
| ----------------------------------------- | ------ | ------- |
| dark `--text-dim` `#8e978f` on `#1a1f1d`  | 5.545  | AA ✓    |
| light `--text-dim` `#737b72` on `#f8f7f2` | 4.074  | 不达 AA |

> 即：**深色辅助文字在重构后从 5.545 掉到 4.345（回退）**；浅色 `--text-dim` 则从 4.074 提升到 4.772（改善）。两条方向相反，须分别记账。

### 1.6 CSS 下沉与代码边界（抽查）

- `ARCHITECTURE.md:230-240` 的 CSS 下沉表**逐项命中**：`home.css`→`src/app/page.tsx:11`；`archive.css`→`src/app/{archive,categories,series}/layout.tsx:2`；`blog-ui.css`→`src/app/{blog,tags,categories}/layout.tsx`；`article-ui.css`+`prose.css`+`reading.css`→`src/app/blog/[slug]/layout.tsx:2-4`；`prose.css` 另见 `src/app/about/layout.tsx:2`；`reading.css` 另见 `src/app/favorites/layout.tsx:2`；`project-detail.css`→`src/app/projects/[id]/layout.tsx:1`。
- `src/lib/module-boundaries.test.ts` 实跑通过（`pnpm test` 的 73 文件之一），且其扫描范围覆盖 `src/**` 生产源码。抽查 `src/app/**` 中 `from '@/lib/{posts,projects,tags,categories,series,about}'` 的命中**只出现在 `*.test.tsx` 文件**（页面全部经 `@/server/content`），边界未被破坏。

### 1.7 模块级零引用扫描

方法：临时脚本遍历 `src/`、`scripts/`、`e2e/` 共 **226** 个 `.ts/.tsx/.mjs` 文件，提取全部静态与动态 `import`（把 `@/` 别名与相对路径解析到实际文件，按 `.ts/.tsx/index.*` 依次尝试），统计每个文件的入度。

结论：**入度为 0 的文件全部是框架约定文件或 CLI 入口**——`page/layout/route/loading/error/not-found/sitemap/robots/manifest/opengraph-image`、`*.test.*`、`src/proxy.ts`、`scripts/*`、`e2e/*`。**没有任何未被引用的生产模块或组件**。

- 唯一非约定的零引用脚本：`scripts/_apply-content-seo-p9.mjs`（2026-07-13 一次性内容补丁脚本，下划线前缀，未挂在任何 `pnpm` script 上；`git log` 显示最后改动为 `ec110f0`）。
- 数据文件侧：`data/links.json` 在 `src/**` 内的唯一引用是 `src/lib/content-dirs.ts:11`（用于派生 Vercel 文件追踪配置），无消费方——与 `docs/ARCHITECTURE.md:150` 的注记一致。
- 密钥核对：`src/**` 中匹配 `(api_key|secret|token|password)\s*[:=]\s*'…'` 仅命中一处测试 fixture（`src/app/api/csp-report/route.test.ts:75`，用于断言「不回显原始 body」）；`.env.example` 只声明 `NEXT_PUBLIC_SITE_URL`；`vercel.json` 无密钥字段；CI 中 `VERCEL_TOKEN` 走 `${{ secrets.VERCEL_TOKEN }}`。**未发现硬编码凭据。**

---

## 2. 发现的问题

按严重度排序。每条标明**归属**：`重构引入` = 2026-10-07 的 `913c8cf` / `6326724` 造成；`既有债` = 此前就存在。

### F1 · 深色模式辅助文字对比度不达 AA（重构引入，高）

**位置**

- `src/app/styles/tokens.css:151` — `.dark { --text-dim: #7d7d86; }`
- `src/app/styles/tokens.css:79` — `--muted-foreground: var(--text-dim);`
- 使用点举例：`src/app/styles/blog-ui.css:33-37`（`.blog__date`，`0.8rem`）、`blog-ui.css:95-98`（`.blog__tag`，`0.75rem`）、`blog-ui.css:147-153`（`.toc__link`，`0.84rem`）
- 背景：`src/app/styles/blog-ui.css:13` — `.blog__item { background: var(--surface); }`，深色下 `--surface = #18181b`（`tokens.css:143`）

**证据**

- 1.5 节实测：`dark --text-dim on surface = 4.345`、`on --bg-elevated = 4.028`，均 < 4.5。
- 对照（重构前同 token 用途）：`5.545`。
- `docs/13-risk-register.md:14`（R7「中性灰 token 对比度不足」）状态标「已闭环」。

**影响**

WCAG 2.1 AA 1.4.3 要求正文（含 12–13px 辅助文字）≥ 4.5:1。深色模式下所有卡片内的日期、标签、目录项、文章列表元信息都不达标。Lighthouse 的 accessibility 分数**不会**稳定抓到这类「大量小文本略低」的问题（其对比度审计按元素抽样），故 CI 有 `categories:accessibility ≥ 0.9` 门槛也不足以兜住。

**归属**：**重构引入**。`tokens.css` 在 `913c8cf` 中改动 186 行，深色 `--text-dim` 由 `#8e978f` 变为 `#7d7d86`、`--surface` 由 `#1a1f1d` 变为 `#18181b`，组合对比度从 5.545 降到 4.345。

**同时指出（同源、较轻）**：浅色 `--brand #4f6bed` 作文字色（`src/app/styles/prose.css:61`、`controls.css:138`、`reading.css:40` 等）在 `#fafafa` 上为 4.319，也低于 4.5；深色下的品牌色（6.200）达标。**重构引入**（新 token 值）。

---

### F2 · 栈 SSOT（`PROJECT.md`）与实际实现脱节（重构引入，高）

**位置与证据**

| 文档位置             | 原文                                                   | 实际（证据）                                                                                                                                          |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/PROJECT.md:47` | 「**Node 22**」                                        | `package.json:17` `"engines": {"node": ">=24"}`；`.node-version`/`.nvmrc` = `24`；本机 `node -v` = v24.16.0                                           |
| `docs/PROJECT.md:50` | 「搜索 **fuse.js**（生产 `GET /api/search`）」         | `src/app/api/` 下只有 `csp-report/`；搜索实现在 `src/lib/search/{engine,index,types}.ts` + `src/components/search/SearchPanel.tsx`（客户端）          |
| `docs/PROJECT.md:51` | 「评论 **Giscus**（env 可覆）」                        | `src/components/comments/` 不存在；`src/lib/csp.ts:30` 注释「Giscus was removed with the comments feature」；`.env.example` 仅 `NEXT_PUBLIC_SITE_URL` |
| `docs/PROJECT.md:35` | 形态表「博客、专题、作品集、搜索 API、严格 CSP nonce」 | 「搜索 API」已不存在                                                                                                                                  |

**影响**

`docs/PROJECT.md` 自述「本产品形态与唯一技术栈权威」「未读本文 + `AGENTS.md` 不写业务代码」。AI/接手者按它行动会：去找一个不存在的 `/api/search`、误以为评论功能仍在、按 Node 22 排障。这是**门闩级文档的错误**，比一般文档过期更严重。

**归属**：**重构引入**（`913c8cf` 删功能但未同步 SSOT；文档在同提交被改过，只是没改这三处）。

---

### F3 · 合并状态在 4 份文档中未回填（重构引入，中高）

**位置**：`docs/HANDOFF.md:38`、`docs/ARCHITECTURE.md:7` 与 `:315`、`docs/README.md:72`、`TODO.md:4` 与 `:39`。

**原文**：`origin/master` **`692e7b3`**（`feature/architecture-rebuild-2026-10-06` 尚未合并；重构改动全部在工作区未提交）／「**未合并**」／「PR #37 待合并」。

**证据**：`git rev-parse --short HEAD` = `6326724`；`git status --porcelain` 无输出；`913c8cf` 在 master 上（HEAD 的父提交）；`692e7b3` 是 HEAD~2。

**影响**：接手者会以为重构还在分支上、可能重复开分支或重复实现；`HANDOFF.md:38` 更把「未提交」写进了生产基线表。

**归属**：**重构引入**（PR #37 合并后未回填；`6326724` 改了这两份文档但只改了别的段落）。

---

### F4 · 测试基线数字过期且三处互不一致（重构引入，中）

**位置与实测**

| 位置                                 | 文档值               | 实测（本机 `pnpm test`，exit 0） |
| ------------------------------------ | -------------------- | -------------------------------- |
| `docs/HANDOFF.md:41`                 | 72 files / 547 tests | **73 files / 551 tests**         |
| `docs/ARCHITECTURE.md:312`           | 72 files / 547 tests | 同上                             |
| `AGENTS.md:34`、`:135`               | 72 test files        | 同上                             |
| `README.md:82`                       | 547 tests / 72 文件  | 同上                             |
| `docs/15-acceptance-checklist.md:11` | **574**              | 同上（第三个互不相同的数字）     |

**差异来源（可复现）**：`6326724` 新增 `src/components/ui/JsonLd.test.tsx`（4 个用例）→ 文件 72→73、用例 547→551。`574` 则与任何时点都不吻合，属 Iteration 00 记录错误。

`AGENTS.md:34` 自带免责句「计数以实跑为准…数字会漂，别把本行当基线」，但同一行仍写死了数字，实际效果是误导。

**归属**：**重构引入**（末次提交后未回填）。

---

### F5 · 本次重构新增的代码缺少测试守门（重构引入，中）

**完全无测试文件、也不在本机 e2e 断言中的新增文件**（`913c8cf` 新增，`git show --stat 913c8cf` 可核）：

| 文件                                                             | 新增行      | 现状                                                              |
| ---------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `src/app/archive/page.tsx`                                       | +71         | 无 `page.test.tsx`；e2e 有 `mobile.spec.ts:77` 打开该页           |
| `src/app/favorites/page.tsx`                                     | +34         | 无 `page.test.tsx`；e2e 仅断言侧栏链接存在（`home.spec.ts:54`）   |
| `src/components/blog/LocalReadingList.tsx`                       | +70         | 无测试（`/favorites` 的核心渲染与空态逻辑）                       |
| `src/components/blog/ReadingActions.tsx`                         | +53         | 无测试（收藏/最近阅读的写入入口）                                 |
| `src/components/layout/NavLinks.tsx`                             | +49         | 无独立测试（经 `Header.test.tsx` / `Sidebar.test.tsx` 间接覆盖）  |
| `src/components/home/{WorkspaceHero,TopicCloud,ArticleList}.tsx` | +48/+37/+60 | 无独立测试（经 `src/app/page.test.tsx` 间接渲染，仅覆盖首页组合） |

**说明（避免夸大）**：`src/lib/reading-state.ts` 有 6 个用例、`src/components/search/SearchPanel.tsx` 有 6 个用例、`src/lib/search/engine.ts` 有 7 个用例、`src/components/layout/Sidebar.tsx` 有 5 个用例——这四个新增单元**是有守门**的。缺口集中在**页面级与列表渲染/写入路径**。

**影响**：`/favorites` 的「收藏 / 最近阅读」是纯 localStorage 驱动的唯一写路径，无单测也无 e2e 交互断言；`/archive` 的年份分组排序同样无断言。回归时 `pnpm test` 会全绿。

**归属**：**重构引入**。

---

### F6 · 移动端点击区小于本项目自己的标准（重构引入，中）

**文档要求**：`docs/11-accessibility.md:23` —「移动端点击区 ≥40px」，现状列写「迭代 02 保证」。

**实测偏差**：`src/app/styles/home.css:215-220`

```css
.ws-topics__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 5px 12px;
  ...
}
```

- 该项是链接：`src/components/home/TopicCloud.tsx:25-31`（`<Link href={/tags/…} className="ws-topics__item">`），首页默认渲染 12 个（`limit = 12`）。
- `src/app/styles/responsive.css` 中 **没有** `ws-topics` 相关覆盖（该文件内 grep `ws-topics` 无命中；`responsive.css:48` 的 `min-height: 46px` 属 `.header__nav--sheet .header__link`）。
- 同表其它目标：`controls.css:3`（44px）、`blog-ui.css:192`（44px）达标；`workspace.css:38`（`.sidebar__link` 38px，桌面侧栏）与 `reading.css:17`（36px）也低于 40px。

**影响**：移动端首页的主题入口是本页主要交互目标之一，32px 高在触屏上偏小，与文档承诺不符。

**归属**：**重构引入**（`TopicCloud.tsx` 与 `home.css` 均在 `913c8cf` 中新增/大改）。

---

### F7 · 首屏 JS 体积偏大，且体积门禁留白过大（既有债为主，中）

**证据**

- 1.4 节：`/` gzip **215.8 KB**、文章页 **229.7 KB**、其余路由 205–211 KB；CSS gzip 14–20 KB。
- 体积门禁：`scripts/check-bundle-budget.ts:36-42` — 单文件 300 KB、总量 `2048 KB`；实测 `891.2 KB / 2.00 MB`（余量 ≈56%）。即该门禁在当前规模下几乎不可能触发。
- Lighthouse 门禁存在但管的是分数：`lighthouse.config.js:32-46`（performance ≥ 0.8、LCP ≤3500ms、CLS ≤0.15、TBT ≤300ms）。
- 客户端岛数量：`src/**` 中 `'use client'` 共 **21 个文件**（含 `layouts` 复用的 `ThemeToggle`、`MobileNav`、`HeaderScrollState`、`BackToTop`、`SiteBackdropParallax(Gate)`、`SearchPanel`、阅读相关 4 个、`ImageZoom`、`TableOfContents` 等）。

**影响**：中低端移动网络下 TBT/LCP 有压力；当前唯一的体积类门禁形同留白，新增客户端依赖（例如搜索索引变大、再加一个客户端库）不会触发任何红灯。

**归属**：**既有债为主**——React 19 + Next 16 运行时占据主体，非本次重构造成；本次重构**新增**了 `SearchPanel`（引入 `fuse.js`）、`MobileNav`、阅读状态等客户端岛，属叠加。**本审核未做重构前后同口径对比**（需 checkout 旧 commit 重新构建，超出只读范围），故不给出「重构使首屏增加 X KB」的结论。

---

### F8 · 搜索面板缺 combobox/listbox 语义（重构引入，中低）

**位置**：`src/components/search/SearchPanel.tsx:103-121`

```tsx
<input
  id="site-search"
  type="search"
  aria-controls="search-results"
  aria-label="搜索文章"
  ...
/>
<div id="search-results" className="search-panel__results" aria-live="polite">
```

- 输入框有 `aria-controls`，但无 `role="combobox"` / `aria-expanded` / `aria-activedescendant`；结果容器是普通 `div`，列表项是 `Link`（非 `role="option"`）。
- 键盘高亮 `activeIndex`（`SearchPanel.tsx:67-81`）只改变视觉 class（`search-panel__item--active`，`home.css:178-181`），与真实焦点不一致。

**影响**：屏幕阅读器用户输入后听不到「有几个结果、当前选中第几个」；`aria-live="polite"` 会在结果整体更新时朗读新内容，属**部分补偿**，故定为中低而非高。纯键盘用户可用 Tab 遍历结果链接，功能未阻断。

**归属**：**重构引入**（`SearchPanel.tsx` 为 `913c8cf` 新增）。

---

### F9 · 无自动化可访问性断言（重构引入的未闭环计划，中低）

**文档**：`docs/11-accessibility.md:39` —「工具：迭代 06 评估引入 `@axe-core/playwright` 或 `eslint-plugin-jsx-a11y`（已装）」；`:18`「对比度…中性灰方案需实测」；`:20,21`「屏幕阅读器 待复核」「标题层级 待复核」。

**实测**：`package.json` 无 `@axe-core/*` 依赖；`eslint-plugin-jsx-a11y` 仅在 devDependencies，`eslint.config.mjs` 未确认启用其全部规则；e2e 的 5 个 spec 中无 axe 断言（grep `axe` 无命中）。

**影响**：F1（对比度）与 F6（点击区）正是这类自动化能拦住的问题。文档把「实测对比度」列为待办却已在 `15-acceptance-checklist.md:74` 勾成 [`--text-dim` 对比度达 AA] → 说明缺自动化时容易误判完成。

**归属**：**重构引入**（新 token 体系 + 该计划条目属本次迭代范围）。

---

### F10 · 参考资料与内联注释的路径/事实错误（低）

| 位置                                                | 内容                                                                   | 实际                                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `next.config.ts:15`                                 | `docs/adr/2026-07-21-sri-over-nonce-evaluation.md`                     | 该路径不存在；实际为 `docs/adr/0005-sri-over-nonce-evaluation.md`                     |
| `AGENTS.md:40`、`:126`                              | 「Use `next/font/google` for fonts」「Fonts: `next/font/google` only」 | `src/app/layout.tsx:2` 用 `next/font/local`（ADR-0008）                               |
| `AGENTS.md:101`                                     | 「`links.ts` # Curated links repository (reads data/links.json)」      | `src/lib/links.ts` 不存在（`/links` 功能已删）                                        |
| `AGENTS.md:78`                                      | 结构树把 `proxy.ts` 画在 `app/` 子树内                                 | 实际 `src/proxy.ts`，在 `app/` 之上（同文件 `:125` 写法正确）                         |
| `AGENTS.md:56`                                      | `styles/`「15 files, each ≤500 lines」                                 | 文件数 15 ✓；`article-ui.css` 实测 **668 行** > 500                                   |
| `docs/13-risk-register.md:20`                       | R13 摘要「剩 4 条」                                                    | 实测 `pnpm audit` = 4 条 ✓，但 `15-acceptance-checklist.md:116` 写「13 条」，两处矛盾 |
| `src/lib/module-boundaries.test.ts:192,199,203,224` | fixture 使用 `@/server/search`（已删模块）                             | 仅字符串 fixture，不影响断言；属可清理的残留命名                                      |

**归属**：`next.config.ts:15`、`AGENTS.md` 四条为**重构引入**（SRI ADR 改名、字体改自托管、links 删除均发生在本次重构）；`AGENTS.md:78` 与 R13 数字矛盾为**既有债**。

---

### F11 · 已知未决项复核（不在本次「新发现」内）

按要求，以下为任务书列明的已知项，此处的价值是**用实测确认其现状**：

| 项               | 本次实测                                                                                                       | 与文档是否一致 |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | -------------- |
| R12 骨架屏 CLS   | `src/app/blog/[slug]/loading.tsx` 全文 32 行，`<section className="section">` 无高度下限（`minHeight` 0 命中） | 一致（未实施） |
| R13 dev 树 audit | `pnpm audit` exit 1，4 条                                                                                      | 一致           |
| R14 搜索规格差   | `toSearchDoc` 投影仅元信息（`src/app/page.tsx:17`），搜索结果无正文匹配与高亮                                  | 一致           |
| CI deploy token  | 未验证（GitHub Secret 层，只读范围外）                                                                         | 未核对         |

---

## 3. 优化计划

约定：`重构引入` 项优先修，`既有债` 按价值排。**不含**换栈、账号系统、数据库、AI 服务、付费服务、改 slug/文章内容、未说明的新依赖。

### P0 · 立即（当天可完成，风险低）

**P0-1 修深色模式辅助文字对比度（对应 F1）**

- 做什么：只改 token 值，不动结构。
  - `src/app/styles/tokens.css:151` `.dark --text-dim: #7d7d86` → 提升亮度至 ≥ `#8b8b94`（对 `#18181b` 约 4.9:1、对 `#1f1f23` 约 4.5:1，落在两处背景都达标的区间）。
  - 浅色品牌文字：`tokens.css:53` `--brand: #4f6bed` 若用于正文链接需略深（如 `#3f58dd`，对 `#fafafa` ≈ 5.0:1）；若只想动一处，可先只收 `--brand` 的文字用途（`prose.css:61`、`controls.css:138`、`reading.css:40`），保留装饰用途不动。
  - 同步 `tokens.css:46` 的注释，把「对比度 4.77:1 达 AA」改成「浅色 4.77 / 深色 surface 4.35 → 仅浅色达 AA」或直接删除该数字。
- 为什么：F1 —— 深色模式大量 12–13px 文本不达 WCAG AA 1.4.3；且该状态当前被错误标为已闭环。
- 怎么验：
  1. 用任意 WCAG 对比度计算器核对 `--text-dim` 与 `--surface` / `--bg-elevated`（深色）两组合 ≥4.5。
  2. `pnpm lint && pnpm typecheck && pnpm test` 全绿。
  3. `pnpm build` 后目视 `/blog` 深色卡片日期/标签。
  4. 可选：`npx @lhci/cli` 本地跑深色（当前 CI 只跑默认主题）——或至少人工 Tab + 目视。
- 风险与回滚：单文件改色值，`git revert` 一次提交即回滚。视觉上深色辅助文字会略亮，需人确认审美；不改结构类名，无回归面。

**P0-2 回填栈 SSOT 与合并状态（对应 F2、F3）**

- 做什么（纯文档）：
  - `docs/PROJECT.md:47` Node 22 → `Node ≥24`；`:50` 搜索行改为「fuse.js 客户端（`src/lib/search/` + `SearchPanel`），无 `/api/search`」；`:51` 删除评论（Giscus）行；`:35` 形态表去掉「搜索 API」。
  - `docs/HANDOFF.md:38` 写 `origin/master` 实测 SHA 与「PR #37/#38 已合并，工作区干净」；`docs/ARCHITECTURE.md:7`、`:315`；`docs/README.md:72`；`TODO.md:4`、`:39` 同步为已合并。
- 为什么：F2/F3 —— `PROJECT.md` 是形态与栈的 SSOT 门闩；`HANDOFF.md` 是接手基线的第一页，现状会直接误导执行者。
- 怎么验：`pnpm check:docs && pnpm format:docs:check && git diff --check`（与 `HANDOFF.md:80` 的「仅文档」验证矩阵一致）。
- 风险与回滚：纯文本，无风险。

**P0-3 应用 R12 已实测修法（对应 F11 · R12）**

- 做什么：`src/app/blog/[slug]/loading.tsx:5` 给 `.section` 加高度下限（根因与实测数据在 `docs/13-risk-register.md:24-46`，CLS 0.0745 → 0.0012）。
- 为什么：CI 的 Lighthouse 门是 `cumulative-layout-shift ≤ 0.15`（`lighthouse.config.js:43`）且**间歇失败**；根因已定位、修法已实测，只差落地。
- 怎么验：`pnpm build` → `pnpm start`（需 `NEXT_PUBLIC_SITE_URL`）→ 移动端节流下测 CLS；或本地 `npx @lhci/cli autorun --config=./lighthouse.mobile.config.js`；`pnpm test:e2e`（需先装浏览器）。
- 风险与回滚：文章页首帧骨架屏变高，观感变化（`docs/13-risk-register.md:44` 提示 `100vh` 可能「一屏骨架」较生硬，建议取中间值如 `60vh` 并复测）。单文件单行，`git revert` 即回滚。

### P1 · 本迭代

**P1-1 补 `/archive`、`/favorites` 的页面测试（对应 F5）**

- 做什么：新增 `src/app/archive/page.test.tsx`、`src/app/favorites/page.test.tsx`，参照既有 `src/app/blog/page.test.tsx` 的写法（mock `@/server/content`）。
  - `/archive`：断言按年份分组、年份倒序、一篇只出现一次。
  - `/favorites`：断言两个 `LocalReadingList` 渲染、localStorage 为空时的空态文案。
  - 追加 `src/lib/reading-state.test.ts` 的边界用例（损坏 JSON、超 `RECENT_LIMIT`、重复打卡去重）——该文件已有 6 例，补齐即可。
- 为什么：F5 —— 新增页面与唯一写路径无守门。
- 怎么验：`pnpm test`（期望 73 → 75 files、551 → 551+ 用例，exit 0）；`pnpm typecheck`。
- 风险与回滚：纯新增测试文件；若 mock 路径与实际不符，参照 `docs/HANDOFF.md:72`「页面测试 mock 路径」提示调整。

**P1-2 移动端点击区补到 40px（对应 F6）**

- 做什么：`src/app/styles/home.css:215-220` 的 `.ws-topics__item` 增到 `min-height: 40px`，或保留 32px 描述态、在 `src/app/styles/responsive.css` 的移动端点（例如 `@media (max-width: 767px)`，见 `responsive.css:84`）内覆盖为 ≥40px。同时复核 `workspace.css:38`（38px）与 `reading.css:17`（36px）是否为可点目标并一并调整。
- 为什么：F6 —— 与 `docs/11-accessibility.md:23` 的自家标准冲突。
- 怎么验：`pnpm test`（`mobile.spec.ts` 有横向滚动与导航断言，可作回归）；`pnpm build` 后移动端视口人工点验；`docs/11-accessibility.md:38` 的手工 Tab 清单。
- 风险与回滚：主题云高度变化可能影响首屏排布，需目视首页；CSS 单文件，`git revert` 回滚。

**P1-3 补可访问性自动化断言（对应 F9，同时守住 F1/F6）**

- 做什么：两选一（**均为新增 devDependency，需按仓库纪律在下单前说明**）：
  - 首选：给 `e2e/` 增加一个 `a11y.spec.ts`，用 `@axe-core/playwright` 扫描 `/`、`/blog`、`/blog/[slug]`、`/favorites`（浅色 + 深色两种主题）。
  - 备选（零依赖）：在 `src/app/blog/[slug]/page.test.tsx` 等现有测试里断言关键颜色变量经 `getComputedStyle` 得出的对比度，用 `src/lib/utils.test.ts` 同风格的纯函数实现计算。
- 为什么：F9 —— 本次 F1/F6 都是「文档写了要求、没有机器守门」的直接后果；`docs/11-accessibility.md:39` 已把该工具列为待评估项。
- 怎么验：新增 e2e spec 后 `pnpm test:e2e`（需先 `npx playwright install chromium`）；CI 的 `e2e` job 会自动带上。
- 风险与回滚：新增依赖需人审（`docs/HANDOFF.md:31` 要求依赖变更走确认）；axe 对既有页面可能报出存量问题——**先在 P0 修完 F1/F6 再加门禁**，否则门禁一上线就红。

**P1-4 回填测试数字（对应 F4）**

- 做什么：`docs/HANDOFF.md:41`、`docs/ARCHITECTURE.md:312`、`README.md:82`、`AGENTS.md:34,135` 统一为「2026-10-07 实测 73 files / 551 tests」；`docs/15-acceptance-checklist.md:11` 的 `574` 改为实测值或加注「Iteration 00 记录，已过时」。
- 为什么：F4 —— 三处数字互不相同，接手者无法判断哪个是真。
- 怎么验：`pnpm check:docs && pnpm format:docs:check`。
- 风险与回滚：纯文档。注意 `docs/README.md:109` 的纪律「历史记录不为对齐当前统计而改写」——`15-acceptance-checklist.md` 属迭代记录，**建议加注而非覆盖数字**。

### P2 · 排期（需要设计决策或更大改动）

**P2-1 首屏体积门禁与预算（对应 F7）**

- 做什么：给 `scripts/check-bundle-budget.ts` 增加 «单路由首屏 JS（gzip）» 条目（现有实现已把纯函数 `evaluateBudgets` 与文件系统分离，加一个「按路由 HTML 引用集合求和」的采集函数即可），初始阈值建议取当前实测 +10%（约 240 KB gzip）。
- 为什么：F7 —— 现有门禁（300 KB/文件、2 MB 总量）对着 891 KB 的实际量留白 56%，等于没有。
- 怎么验：`pnpm build && pnpm exec tsx scripts/check-bundle-budget.ts`；故意引入一个临时大依赖验证能变红（验证后移除）。
- 风险与回滚：新门禁可能因路由差异抖动，先在 `warn` 级观察一轮再升 `error`；脚本改动可单独 revert。

**P2-2 搜索面板补 ARIA 语义（对应 F8）**

- 做什么：`src/components/search/SearchPanel.tsx` 输入框补 `role="combobox"` / `aria-expanded={trimmed !== ''}` / `aria-activedescendant={activeId}`；结果 `ul` 补 `role="listbox"`、`li > Link` 补 `role="option"` + 稳定 `id`；保持现有 `aria-live` 与键盘行为不变。同步 `SearchPanel.test.tsx` 的断言。
- 为什么：F8 —— SR 用户拿不到结果数量与当前项。
- 怎么验：`pnpm test`（含 `SearchPanel.test.tsx`）；手工用 NVDA/VoiceOver 走一遍 `/` → 输入 → ↑↓ → Enter；新增的 axe 门禁（P1-3）应保持绿。
- 风险与回滚：ARIA 组合写错会退化 SR 体验，改动小、单文件可 revert。

**P2-3 注释与结构树纠错（对应 F10）**

- 做什么：`next.config.ts:15` 的 ADR 路径改为 `docs/adr/0005-sri-over-nonce-evaluation.md`；`AGENTS.md:40,126` 改为 `next/font/local`（并注明 ADR-0008）；`AGENTS.md:101` 删 `links.ts` 行；`AGENTS.md:78` 把 `proxy.ts` 移出 `app/` 子树；`AGENTS.md:56` 的「each ≤500 lines」改为实测口径（最长 `article-ui.css` 668 行）或删除该断言。
- 为什么：F10 —— `AGENTS.md` 是 AI 协作规则入口，指错路径会被逐字执行。
- 怎么验：`pnpm check:docs && pnpm format:docs:check`；对 `AGENTS.md` 中每条路径 `Test-Path` 抽查。
- 风险与回滚：文档 + 一行注释，无风险。

**P2-4 清理测试里的已删模块命名（对应 F10 末行）**

- 做什么：`src/lib/module-boundaries.test.ts` 的 4 处 fixture（`:192`、`:199`、`:203`、`:224`）由 `@/server/search` 改为现有模块名（如 `@/server/content`），保持断言语义不变。
- 为什么：F10 —— 避免后来者以为 `src/server/search` 仍存在。
- 怎么验：`pnpm test src/lib/module-boundaries.test.ts`（2 个用例通过）。
- 风险与回滚：测试内部字符串，零风险。

### P3 · 可做可不做

| 项                          | 说明                                                                                                                        | 现状判据                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `searchDocs` 复用 Fuse 实例 | `src/lib/search/engine.ts:39` 每次调用 `new Fuse(docs, …)`；20 篇规模下开销可忽略，超过 ~200 篇再优化                       | 代码位置 + `docs/adr/0006` 的规模触发条件 |
| 项目图源文件瘦身            | `public/images/projects/domain-check.png` 782,976 B 等 6 张；`next/image` 会在服务端转制，但入库体积已计入仓库              | `Get-ChildItem public -Recurse` 实测      |
| `feed.xml` 体积             | 实测 173,650 B（20 篇全量）；若读者量增长可裁剪为摘要                                                                       | 文件实测                                  |
| 搜索结果数上限说明          | `engine.ts:22` `SEARCH_RESULT_LIMIT = 8` 无 UI 文案提示（片段少于总数时）                                                   | 代码位置                                  |
| 一次性脚本归档              | `scripts/_apply-content-seo-p9.mjs`（2026-07-13 内容补丁，未挂任何 `pnpm` script）；移入 `docs/archive/` 或删除都不影响门禁 | 1.7 节零引用扫描                          |

---

## 4. 明确不做的

以下项**经本次审核判定为不该动**（避免后续被当作欠账）：

1. **CSP nonce + 动态 HTML 渲染**：`docs/adr/0003`、`0005` 已定案；不为 SSG/缓存放宽 `script-src unsafe-inline`。本次审核确认 `src/lib/csp.ts` 无第三方脚本白名单、`report-to`/`report-uri` 仅做收集、`/api/csp-report` 有速率限制（`src/server/rate-limit.ts`）、16 KB 体积上限与字段白名单、且不回显 —— 无需改动。
2. **搜索维持客户端 Fuse**：`docs/adr/0006` 已 ADR；20 篇规模不起服务端引擎。R14（正文/范围筛选/词高亮）属产品取舍，不在此次工程范围。
3. **`data/links.json` 的物理存在**：`src/lib/content-dirs.ts:11` 仍列该路径，但全仓唯一引用即此处（`src/**` 内 grep 仅此一处），且 `docs/ARCHITECTURE.md:150` 已注明「保留但无消费方（属残留）」。删除它会牵动 `CONTENT_TRACE_INCLUDES` 的 Vercel 追踪配置，收益极低、风险不为零，**建议保持现状并保留文档注记**。
4. **拉丁字体沿用 TTF**：`docs/adr/0008:50` 明确记录「选 TTF 而非 woff2 分片，代价多 52 KB，本机无 woff2 压缩工具」。实测构建产物 `.next/static/media/*.ttf` 与源文件字节完全相同（`cormorant_garamond_500-s.p.…ttf` = 76,756 B = 源文件大小），即 Next 未做格式转换或子集化 —— 与 ADR 描述一致，属**已记录的有意取舍**。附带发现（供参考，不作要求）：`src/app/layout.tsx:54` 的 `preload: true` 在实测首页 HTML 中**没有**产出 `<link rel="preload" as="font">`（`as="font"` 计数 0），字体预加载以 React `:HL` head-link 形式出现在 RSC payload 中；本地因缺浏览器未能验证其生效时机。**结论：不列为待办**，仅建议在 ADR-0008 的「复查触发条件」里补一条「若首屏拉丁字体成为 LCP 瓶颈，再评估 woff2 与 preload 实际生效」。
5. **`next/font/local` 的 `adjustFontFallback` 用法**：构建 CSS 中已生成 `jetbrainsMono Fallback`（`local(Arial)`，`size-adjust:131.49%`）与 `cormorantGaramond Fallback`（`local("Times New Roman")`，`size-adjust:96.44%`），与 `src/app/layout.tsx:46,57` 的声明一致 —— 正常，无需调整。
6. **`gen:blur` / 正文图 LQIP**：`pnpm check:blur` 实测 `blogImages=0`，`TODO.md:29` 的条件（`public/images/blog/**` 有图）未触发 —— 属正确终态。
7. **GSC/Bing/RUM 接入**：`TODO.md:16-24` 标 `blocked_auth`，需真人账号；不得用实验室 Lighthouse 分数代替真实 p75。
8. **`deploy` job 的 `VERCEL_TOKEN`**：GitHub Secret 层问题，不影响生产（生产走 Vercel Git 集成）；不在本次范围。
9. **R13 的剩余 4 条 dev 漏洞**：`braces` 修复版上游未发布、`qs`/`postcss-selector-parser` 需动精确钉或跨 major；CI 该步 `continue-on-error: true`（`.github/workflows/ci.yml:42-43`），属已知且已被治理的终态。
10. **不换栈、不加账号系统/数据库/AI 服务/付费服务、不改文章 slug 或正文、不无说明引入新依赖**（任务约束）。P1-3 若要引入 `@axe-core/playwright`，须先单独说明并取得确认。

---

## 5. 审核方法与限制

- 全程**只读**：未执行 `git commit` / `push` / 分支切换；除本文件外未新增或修改仓库内任何文件；所有临时脚本写在 `%TEMP%`。
- 生产构建 `pnpm build` 会重写 `.next/`（已被 `.gitignore:23` 忽略），也重跑 `scripts/generate-rss.ts` 与 `scripts/build-content-snapshot.ts`；两次构建后 `git status --porcelain` 均为空，未污染受版本控制的产物。
- **未执行**：`pnpm test:e2e`（本机缺 Playwright 浏览器，安装未完成，见 1.3）、Lighthouse 本地跑分、真实浏览器下的深色对比度与键盘走查、`pnpm test:mutation`（Stryker）、生产站点 `pnpm check:production-content`（会打生产域名，未授权故未跑）。
- 数字均为本机单次实测，非统计意义上的稳定值；引用请重跑文中给出的命令。
