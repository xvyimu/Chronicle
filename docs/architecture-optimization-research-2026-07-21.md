# 西江月博客 · 架构优化与同类项目整合调研报告

> **状态**：当前决策参考稿（2026-07-21）· **用户决议已录入**  
> **路径**：`D:\blog` · 生产：`https://incca.ccwu.cc` · HEAD：`dfc057b`  
> **用途**：在现有生产基线上整合历史文档、同类项目经验、技术债、目标/约束/边界、多方案对比与验收标准；**不替代** `TODO.md` 作为待办 SSOT，也不改写已归档 run 中的历史数字。  
> **阅读入口**：先读本文件结论 → 再按需跳到章节。执行时仍以 `TODO.md`、`docs/handoff-to-agent.md`、`docs/architecture.md` 为准。

### 用户决议（2026-07-21 交互表单）

| 决策           | 选择                                     | 执行含义                                                           |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| 下一主轨道     | **混合：内容 70% + 体验 20% + 卫生 10%** | 默认剧本 S5；禁止并行换栈大改                                      |
| 平台与渲染     | **锁定 Next + 维持 nonce CSP**           | P-A + R-A；不接受 `unsafe-inline` 换 SSG                           |
| 搜索与内容形态 | **数字花园化（wikilink / 图谱方向）**    | **不迁 Quartz**；在 Next 内增量做双向链接与关系图（见 §25）        |
| 运营与文档     | **继续跳过运营 + 仅本调研报告**          | GSC/Bing/RUM 保持 pending；本文件为决策 SSOT 补充，overview 已挂链 |

**决议与报告推荐的张力**：报告默认「出版型博客 IA」；用户显式选择数字花园能力。仲裁：**平台/安全/搜索引擎仍按推荐锁定**；**内容形态在 O-A 内增加花园能力（wikilink→内链、反链、轻量图谱）**，分阶段验收，避免一次做成第二套站点。

### Ship 表单决议（2026-07-21 第二轮）

| 决策      | 选择                          | 执行含义                                             |
| --------- | ----------------------------- | ---------------------------------------------------- |
| Ship 范围 | **Q1–Q4 推荐包**              | G0 wikilink + G1 反链 + 2–3 篇现有文互链 + 文档/TODO |
| 坏链策略  | **测试/CI 失败**              | 缺失目标使建图/检查非零；不渲染红色死链、不静默吞掉  |
| 样例内容  | **改现有工程文补 `[[slug]]`** | 不新建 meta 文                                       |
| 交付边界  | **本地 commit，不 push**      | 无远程部署；push 另授权                              |

---

---

## 0. 执行摘要（先读）

### 0.1 一句话定位

西江月是一个**本地 MDX/JSON 驱动、Next.js App Router 渲染、严格 CSP nonce 动态 HTML、Vercel 部署**的个人技术博客兼作品集。工程侧 P0–P10 与 2026-07-18 前后端逻辑分层、延后运营门禁、2026-07-19 视觉/身份修复均已落地；**无条件工程任务已关闭**。

### 0.2 当前进度快照（2026-07-21 实测）

| 项        | 值                                                                  | 证据                                |
| --------- | ------------------------------------------------------------------- | ----------------------------------- |
| 生产域名  | `https://incca.ccwu.cc`                                             | launch-baseline / live smoke        |
| Git HEAD  | `dfc057b`（真截图 + 专题全量 + GitHub 身份）                        | `git log`                           |
| 功能基线  | `a91a07d` `src/server` 逻辑分层                                     | run `frontend-backend-boundary`     |
| 运营工程  | `96e0214` + 硬阻塞 `fa3e579`                                        | run `deferred-ops-readiness`        |
| 内容规模  | **14** 文 · **6** 项目 · **10** 类 **123** 链                       | `content/blog` + `data/*`           |
| 质量门禁  | Vitest ~618 · Playwright 48 · Lighthouse desktop CI · SEO/blur/docs | launch-baseline                     |
| 渲染模型  | HTML **动态**（CSP nonce）· 数据本地缓存 · 资产可边缘缓存           | ADR `2026-07-17-csp-nonce-over-ssg` |
| 工程 TODO | 仅外部账号 + 条件触发                                               | 根 `TODO.md`                        |

### 0.3 本报告核心结论

1. **不要换栈**（Astro/Hugo/Quartz/Nextra 全量迁移 ROI 为负）。
2. **不要上 CMS / 数据库 / Meili/ES**（规模与 ADR 门槛未到）。
3. **保持 CSP nonce 优先于全站 SSG**（已有 Accepted ADR；无 RUM 证据前不回退）。
4. **下一阶段不是「再造架构」**，而是在用户偏好下三选一主轨道：
   - **A 内容与品牌增长**（写文、作品叙事、链接策展）
   - **B 体验细节打磨**（移动阅读、CLS/字体、交互岛减负）
   - **C 工程卫生与文档保鲜**（基线更新、工具链瘦身、条件门禁维护）
5. 运营（GSC/Bing/RUM）用户已明确可跳过；工程上只维护 `check:ops-readiness`，**禁止伪装完成**。

### 0.4 推荐默认组合（若用户未改偏好）

| 决策点     | 推荐                                                 | 理由（摘要）                                        |
| ---------- | ---------------------------------------------------- | --------------------------------------------------- |
| 平台策略   | 锁定 Next 16 + 本地内容 + Vercel                     | 沉没成本与门禁已生产级；换栈无产品收益              |
| 渲染/安全  | 维持 nonce CSP + 动态 HTML                           | XSS 基线 > 边缘 HTML 缓存；与 Giscus/Analytics 兼容 |
| 搜索       | 维持 `GET /api/search` + Fuse + 投影 DTO             | 14 文远低于 200 文/ p95 门槛                        |
| 内容层     | MDX 文章 + JSON 项目/链接                            | 已有 Zod + repository + fail-fast                   |
| 下一里程碑 | **A 内容增长为主，B 体验为辅，C 随手维护**           | 产品可见价值最大；工程已过工程化峰值                |
| 明确不做   | CMS、独立后端、搜索集群、为 SSG 放宽 `unsafe-inline` | YAGNI + 安全 ADR                                    |

---

## 1. 调研范围与方法

### 1.1 问题陈述

在工程侧「可无条件推进事项已关闭」之后，如何基于：

- 当前生产事实与文档体系
- 历史审查 / roadmap / ADR / salesdex 改版经验
- 同类个人博客与作品集架构（2025–2026）

给出**可决策**的架构优化、技术债、目标/约束/边界、输入输出、验收标准，并提供**多方案对比与最佳方案解释**，再以交互表单收敛下一阶段方向。

### 1.2 输入材料（已整合）

| 类别       | 路径/记忆                                                                                                                                                                                                                                     | 角色                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 当前维护   | `TODO.md`、`docs/overview.md`、`architecture.md`、`handoff-to-agent.md`、`launch-baseline.md`、`performance-baseline.md`、`ops-deferred-work-plan.md`、`content-workflow.md`、`API.md`、`cache-components-migration.md`、`css-conventions.md` | 现行操作真值           |
| ADR        | `docs/adr/2026-07-17-csp-nonce-over-ssg.md`、`0002-local-content-repository-factory.md`                                                                                                                                                       | 已接受决策             |
| 历史报告   | `full-stack-audit-2026-07-17.md`、`optimization-roadmap-2026-07-06.md`、`frontend-ui-optimization-report-2026-07-12.md`、`bem-search-architecture-2026-07-12.md`、`salesdex-inspired-redesign.md`、`codex-review-2026-07-13.md` 等            | 时间点快照，数字不追改 |
| 实施 run   | `docs/superpowers/runs/2026-07-18-*`                                                                                                                                                                                                          | 分层与运营工程化证据   |
| Agent 记忆 | `blog-2026-07-18-production-baseline`、`blog-2026-07-19-visual-identity-fix`、`blog-deferred-ops-hard-blocks`、`blog-user-self-drive-ops`                                                                                                     | 跨会话偏好与阻塞       |
| 同类调研   | Astro Content Collections、Hugo、Quartz、Nextra、Next MDX 实践、Pagefind/Fuse/Algolia、CSP nonce vs SSG                                                                                                                                       | 外部对照               |

### 1.3 方法

1. **仓库事实优先**：内容计数、HEAD、分层目录、TODO 状态以本机 2026-07-21 扫描为准。
2. **文档分层**：维护文档 vs 历史快照（见 `docs/overview.md` 规则）。
3. **多方案矩阵**：每决策点 ≥3 方案，含复杂度/风险/收益/与约束匹配度。
4. **门槛驱动**：条件触发项未到门槛 = 正确终态，不是欠账。
5. **冲突标注**：同类项目「静态优先」与本站「nonce 优先」存在张力，下文单独处理。

### 1.4 非目标

- 不在本文件中伪造 GSC/RUM 已完成。
- 不把历史报告的未勾选项自动复活为当前 TODO。
- 不交付代码重构（本报告为决策与规格层）。
- 不代用户登录 Google / 写 Cloudflare DNS。

---

## 2. 项目现状深度扫描

### 2.1 产品能力地图

| 能力           | 状态     | 实现要点                                                   |
| -------------- | -------- | ---------------------------------------------------------- |
| 博客 MDX       | 已上线   | frontmatter Zod、slug 去日期前缀、draft 生产过滤           |
| 专题/标签/分类 | 已上线   | series/seriesOrder、tag/category 聚合                      |
| 作品集         | 已上线   | `data/projects.json` + 真截图 + blur                       |
| 收藏导航       | 已上线   | 10 类 123 链 + 客户端筛选                                  |
| 搜索           | 已上线   | 生产 API Fuse；测试可嵌客户端；投影无 searchText           |
| 评论           | 已上线   | Giscus + CSP 白名单                                        |
| SEO            | 工程完成 | sitemap/robots/JSON-LD/OG/RSS；GSC 账号未接                |
| 安全           | 已上线   | nonce CSP、安全头、无 remotePatterns                       |
| 主题/纸感      | 已上线   | Paper Gallery + tokens 双主题                              |
| 质量门禁       | 已上线   | format/lint/type/test/e2e/Lighthouse/bundle/SEO/docs/smoke |

首页叙事顺序（现行）：

```text
EditorialHero → Manifesto → ReadingPath → FeaturedArticleRail
→ CuratedLinksPreview → ProjectsSection → HomeCtaSection
```

### 2.2 技术分层（现行）

```text
content/ + data/
  → src/lib/*   repositories, schemas, cache, shared search contract
  → src/server/* content facade + search service/engine/rate-limit
  → src/app/*   routes, metadata, API
  → src/components/*  UI（仅共享 DTO + HTTP）
  → public/*    feed/images/static
```

依赖方向：

- `components/hooks → lib（共享契约）+ HTTP`
- `app → server + lib`
- `server → lib`
- **禁止** client / `lib` 反向导入 `@/server`（`module-boundaries.test.ts`）

### 2.3 渲染与缓存模型（关键不变量）

| 层        | 行为                                  | 原因                                 |
| --------- | ------------------------------------- | ------------------------------------ |
| HTML 文档 | 动态，`headers()` + per-request nonce | 严格 `script-src` + `strict-dynamic` |
| 内容数据  | 本地 MDX/JSON + `createCache<T>`      | 无 DB                                |
| 静态资产  | feed / 图片 / `_next/static` 可缓存   | 与 HTML 策略分离                     |
| 搜索 API  | Node runtime + `s-maxage=60`          | 公开投影 + 限流 best-effort          |

**硬约束**：不得为恢复 SSG 将脚本 CSP 放宽到 `unsafe-inline`。

### 2.4 内容规模明细

**文章（14）** 主题簇：VPS/运维、Next.js、性能、Postgres/Redis、Docker/Nginx、CI/CD、TS、Go CLI、Cloudflare/Supabase 等——偏「可复用工程笔记」。

**项目（6）**

| id                 | featured | 备注                |
| ------------------ | -------- | ------------------- |
| nav-site           | ✓        | 自有仓 `xvyimu`     |
| blog               | ✓        | 本站                |
| relaycheck-desktop | ✓        | 自有仓              |
| domain-check       |          | 上游参考 `yutian81` |
| qy-home            |          | 上游参考            |
| hermes-hug         |          | 上游参考            |

**链接**：10 分类，合计 123（AI / coding / engineering-docs / cloud / self-hosted / vps / blog-inspiration / dev-tools / design / fun）。

### 2.5 工程成熟度评估

相对同类个人博客，本站处于 **「工程化上限区」**：

- 已有：同仓逻辑前后端、边界测试、文档链接 CI、ops-readiness、生产 smoke、Lighthouse 进 e2e、RSS 一致性、JSON 生产 strict。
- 多数同类站点：**没有** 这套门禁深度。

含义：

- 继续堆「平台化重构」的边际收益很低。
- 真正缺口转向 **内容深度、作品叙事、移动体验细节、账号侧运营（可选）**。

### 2.6 与 2026-07-17 全栈审计的对照

审计当时 P1 项多数已落地或制度化：

| 审计项                      | 2026-07-21 状态                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------- |
| FE-1 路由拆 CSS             | 部分完成（home/search/links/project-detail 下沉）；prose/article 深度下沉仍条件触发 |
| FE-2 CSP vs SSG             | ADR Accepted；RUM 仍 pending                                                        |
| BE-1 JSON fail-fast         | 生产 strict 已落地                                                                  |
| BE-2 限流语义               | origin best-effort + 文档化                                                         |
| ARCH-3 CI 构建去重          | e2e+lighthouse 同 job 已合并；quality 仍独立 build                                  |
| MagneticCard rAF / 文章 CLS | 已有跟进；lab CLS 门禁 0.15                                                         |

**残余技术债见第 5 章**——均为「条件触发」或「体验打磨」，非架构危机。

---

## 3. 历史文档整合与漂移校正

### 3.1 文档拓扑（现行）

```text
当前维护（可操作）
  README / AGENTS / TODO
  docs/overview · architecture · handoff · API · content-workflow
  docs/css-conventions · launch-baseline · performance-baseline
  docs/ops-deferred-work-plan · cache-components-migration

决策层
  docs/adr/*

设计层（已实施，正文不追改数字）
  docs/specs/* · docs/superpowers/specs/*

历史快照
  日期型审查报告 · optimization-roadmap · salesdex · superpowers/runs/*
```

### 3.2 已知漂移与校正原则

| 现象                                            | 处理                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `AGENTS.md` 仍写「Search: fuse.js client-side」 | 生产已是 API 搜索；维护文档以 architecture/API 为准，AGENTS 宜在下次工程卫生轮次同步 |
| 历史报告测试数 569–597                          | 保留快照；当前以 handoff/launch-baseline 的 618 口径为准                             |
| `optimization-roadmap` 写搜索仍客户端           | 已被 bem-search + server 分层替代                                                    |
| TODO 归档 HEAD `61ffd47` vs 实际 `dfc057b`      | TODO 描述「工程关闭」仍真；HEAD 前进为视觉修复，不重新打开 P0–P10                    |
| links 文档写 10 类 123 链                       | 2026-07-21 复核正确                                                                  |

### 3.3 整合后的「单一叙事」

1. **2026-07-06**：优化目标与 Phase 1–3 架构/UX/视觉路线（渐进收口）。
2. **2026-07-12**：UI 双轨收口 + 服务端搜索方案落地。
3. **2026-07-17**：全栈审计 + CSP ADR + JSON strict + 性能跟进。
4. **2026-07-18**：`src/server` 逻辑分层 + ops-readiness + 工程 TODO 关闭。
5. **2026-07-19**：真截图 / 专题全量 / GitHub 身份 / 用户跳过运营。
6. **2026-07-21（本报告）**：同类对照 + 下一阶段决策矩阵 + 验收规格。

---

## 4. 同类项目经验对照

### 4.1 对照矩阵（架构维度）

| 维度     | 西江月（现行）     | Astro Content Collections | Hugo                  | Quartz v4            | Nextra    | 典型 Next MDX 个人站  |
| -------- | ------------------ | ------------------------- | --------------------- | -------------------- | --------- | --------------------- |
| 内容     | MDX+JSON+Zod       | MD/MDX+Zod 集合           | Markdown+front matter | Obsidian MD+wikilink | MDX       | MDX / Contentlayer 系 |
| 默认渲染 | 动态 HTML（nonce） | 默认静态/少 JS            | 全静态                | 静态数字花园         | Next 混合 | 常 SSG/ISR            |
| 交互     | RSC + 客户端岛     | Islands                   | 极少 JS               | 搜索/图谱            | React 重  | RSC/岛                |
| 搜索     | Fuse API           | Pagefind 常见             | Pagefind/Fuse         | 内置全文             | 文档搜索  | Fuse/Algolia/Pagefind |
| 安全 CSP | 严格 nonce         | 静态易 hash               | 静态易 hash           | 视托管               | 随 Next   | 常弱于本站            |
| 工程门禁 | 极强               | 中（因人而异）            | 中                    | 弱–中                | 中        | 多数弱于本站          |
| 作品集   | 一等公民 JSON      | 常另页                    | 主题驱动              | 弱                   | 非焦点    | 常见但浅              |
| 适合     | 工程品牌+交互      | 内容性能极致              | 海量 MD 速度          | 笔记网络             | 文档站    | React 生态            |

### 4.2 各栈优缺点（相对本站目标）

#### Astro Content Collections

- **优点**：零 JS 默认、Lighthouse 易冲高、Content Layer 类型安全、构建简单、Pagefind 生态顺。
- **缺点**：迁移成本高（React 组件、Giscus、现有测试/CI、纸感 CSS 体系）；本站已在 Next 上完成「产品级」交互与门禁。
- **可借鉴**：集合级 Zod schema 的「集合即契约」叙事（本站 posts schema 已接近）；Pagefind 作为 **≥200 文** 后的候选，而非现在。
- 参考：[Astro vs Next 静态站讨论](https://eastondev.com/blog/en/posts/dev/20251202-astro-vs-nextjs-static-site/)、[LogRocket 对比](https://blog.logrocket.com/astro-vs-next-js-ssg-vs-react/)。

#### Hugo

- **优点**：构建极快、主题成熟、纯静态 CDN 友好。
- **缺点**：模板语言与本站 React/TS 技能栈割裂；作品集/搜索/评论集成自由度不如 Next；现有 600+ 测试资产归零。
- **可借鉴**：内容即文件、发布即 git 的纪律（本站已有）；海量文章时的分区与 taxonomy 思路。

#### Quartz（Obsidian Publish 替代）

- **优点**：wikilink、backlink、图谱，适合第二大脑。
- **缺点**：产品形态是「数字花园」而非「工程作品集 + 策展导航」；本站信息架构不同。
- **可借鉴**：文章间双向链接可视化（可选远期）；**不建议**把博客改成 vault 发布。
- 参考：[Quartz 哲学](https://quartz.jzhao.xyz/philosophy)、[Obsidian Publish 替代综述](https://www.ssp.sh/brain/open-source-obsidian-publish-alternatives/)。

#### Nextra

- **优点**：文档 UX 优秀、MDX 组件化顺。
- **缺点**：默认「文档站」信息架构；作品集/策展/纸感品牌需大量定制，接近重写。
- **可借鉴**：侧栏 + TOC + 搜索的文档阅读节奏（文章页已有 TOC/阅读设置）。

#### 成功 Next 个人站模式（Lee Robinson / Delba / Josh Comeau 等共性）

- 本地 MDX 或内容层，而非一上来 CMS。
- 重度投资 **阅读体验与视觉系统**，而非微服务。
- 搜索在规模小时保持简单。
- 工程化因人而异；本站测试/CSP/CI **更重**，这是差异化资产，不是负担。
- 可借鉴：文章「互动实验室」组件（可选）；性能文案与真实指标诚实披露。

#### Next 系样板与内容层工具（2025–2026 补充调研）

| 选项                                       | 结论                                               | 对本站                                       |
| ------------------------------------------ | -------------------------------------------------- | -------------------------------------------- |
| 自定义 App Router + MDX（Lee / Josh 路径） | **主流成功路径**；内容即 git；RSC 读本地仍可偏静态 | **已在此盆地**                               |
| Nextra 4 blog/docs                         | 文档站强；内建 Pagefind；SSG 中心                  | **不整站迁入**；可抄 Pagefind 流程与 Callout |
| Tailwind Spotlight 模板                    | 视觉/IA 参考；付费闭源                             | 只参考信息架构，不换壳                       |
| 官方 `blog-starter`                        | 教学 Markdown 管线                                 | 能力弱于现状                                 |
| `timlrx` starter                           | 功能全家桶 + 曾绑 Contentlayer                     | **点菜式**抄安全头/标签，勿整仓              |
| Contentlayer                               | **上游弃维**，App Router 差                        | **禁止新建**                                 |
| Velite / Content Collections               | Zod 构建期集合，Contentlayer 精神续作              | 仅当 frontmatter 痛点变大再增量评估          |
| next-mdx-remote                            | 仓库 **archived**；RSC 路径仍可用                  | 本站已用；不因归档强迁，关注安全默认         |

Josh Comeau 自述：个人博客几乎无测试策略；课程平台才上 Playwright。本站 Vitest+Playwright **已超过多数成功个人站**——门闩应「加场景不加算力」，而不是为覆盖率空转。

Lee Robinson 栈习惯：Tailwind + shadcn、v4 global CSS、RSC 取数、注意序列化体积。与本站 V-A 一致。

**高价值可抄（投入小）**：

1. Shiki **构建期/服务端**高亮，客户端仅 lazy 动态 playground。
2. MDX 组件内聚样式（Callout 内代码变体）。
3. Metadata + RSS/sitemap 生成门闩（本站已有，保持）。
4. 安全头点菜，不整模板替换。
5. 视觉疲软时抄 Spotlight 级 IA（home/about/articles/projects），不换栈。

**明确不要**：为「更现代」迁 Nextra；新建 Contentlayer；14 文上 Algolia；复制 PartyKit/双动画库级复杂度。

参考：[Josh 2024 建站](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/)、[Lee stack](https://leerob.com/stack)、[Nextra 4](https://the-guild.dev/blog/nextra-4)、[Contentlayer abandoned](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives)、[You May Not Need Algolia](https://danlevy.net/you-might-not-need-algolia/)、[Next CSP](https://nextjs.org/docs/app/guides/content-security-policy)。

### 4.3 搜索方案行业对照

| 方案                       | 规模甜点             | 隐私/离线    | 成本 | 与本站匹配                         |
| -------------------------- | -------------------- | ------------ | ---- | ---------------------------------- |
| Fuse 内存（API 或 client） | 数十–数百文          | 高           | 0    | **当前最优**                       |
| Pagefind                   | 数百–数千页静态 HTML | 高           | 0    | 若未来 HTML 更静态或文量暴涨时评估 |
| Algolia/Meili              | 任意 + 高级相关性    | 低（第三方） | 有   | **明确不做**（当前）               |

Fuse 官方量级：1k 项索引约数毫秒级；博客实践通常在数百文内舒适。本站门槛写 **≥200 文或 p95 证据** 再 ADR，与行业经验一致。  
参考：[Fuse 性能](https://www.fusejs.io/performance.html)、[静态站搜索对比讨论](https://blog.openreplay.com/add-search-website-without-backend/)。

### 4.4 CSP nonce vs 静态 HTML（冲突与本站选择）

**行业张力**：

- Next 官方：nonce CSP 依赖请求，页面趋向动态渲染。
- 社区/内容站文章：个人博客常优先 SSG + hash/宽松 CSP，因 TTFB/CDN 收益更直观。  
  参考：[Next CSP 指南](https://nextjs.org/docs/app/guides/content-security-policy)、[静态页与 nonce 权衡](https://johnkavanagh.co.uk/articles/content-security-policy-in-nextjs/)。

**本站为何仍选 nonce（最佳匹配）**：

1. 已集成 Giscus + Vercel Analytics/Speed Insights，需要可控脚本策略。
2. 已有生产级交互岛；`unsafe-inline` 回退会削弱 XSS 基线。
3. 内容规模小，Function 成本在可忽略区间（缺 RUM 前不臆测）。
4. 资产层（feed/图片/static）仍可缓存，混合模型已文档化。
5. **Accepted ADR** + 明确 revisit 条件（Speed Insights p75 TTFB / invocations + 官方静态 CSP/SRI 路径）。

这不是「忽视行业建议」，而是在 **安全基线、第三方脚本、已建门禁** 约束下的有意识取舍。

### 4.5 可迁移的「细节打磨」清单（不换栈）

| 来源              | 细节               | 本站落点建议                              |
| ----------------- | ------------------ | ----------------------------------------- |
| Astro/Pagefind 站 | 搜索无全量 payload | 已做 API 投影；保持                       |
| Comeau 类站       | 文章内交互 demo    | 仅在主题需要时加 MDX 组件白名单           |
| SalesDex 参考     | 章节式首页叙事     | 已落地；避免再堆装饰                      |
| 文档站            | 清晰「下一步阅读」 | ReadingPath / 相关文章 / 404 导流再打磨   |
| 静态站            | 字体子集与 CLS     | 中文 Noto 子集策略、标题 clamp、code 骨架 |
| 工程博客          | 公开架构决策       | 继续 ADR + 本类研究报告                   |

---

## 5. 技术债清单（按优先级与触发条件）

### 5.1 债务分类

| 级别 | 定义                                     |
| ---- | ---------------------------------------- |
| D0   | 生产正确性/安全回归风险（当前无开放 D0） |
| D1   | 用户可感知体验债                         |
| D2   | 工程效率/卫生债                          |
| D3   | 规模化预留（未到门槛）                   |
| X    | 外部账号阻塞                             |

### 5.2 明细表

| ID   | 级别 | 描述                                  | 触发/前置                    | 建议动作                                |
| ---- | ---- | ------------------------------------- | ---------------------------- | --------------------------------------- |
| X1   | X    | GSC 域名验证 + sitemap                | 用户 Google 登录             | 按 ops 手册；可跳过                     |
| X2   | X    | Bing 导入                             | GSC 成功                     | 可跳过                                  |
| X3   | X    | Speed Insights p75 回填               | 控制台/metrics token + 样本  | 可跳过；禁 Lighthouse 代填              |
| D1-1 | D1   | 移动 lab FCP/LCP 偏高（实验室）       | 需要二次手测或 RUM 印证      | 调查 render-blocking CSS；不阻塞 deploy |
| D1-2 | D1   | 文章 lab CLS 门禁 0.15 vs field 0.1   | 文章页                       | 字体/标题/代码块骨架继续收敛            |
| D1-3 | D1   | 中文字体 subset 策略                  | 阅读页                       | 评估 Noto SC 加载策略                   |
| D1-4 | D1   | 首页多动画岛（Reveal/Magnetic/…）     | 首页性能/INP                 | 审计减负；保留品牌感                    |
| D1-5 | D1   | 移动 TOC / 阅读路径细节               | 长文                         | UX 打磨轨道                             |
| D2-1 | D2   | AGENTS 搜索描述过时                   | 文档卫生                     | 同步为 API 搜索                         |
| D2-2 | D2   | Stryker 未进主 CI                     | 工具链                       | 90 天不用则移除或文档化可选             |
| D2-3 | D2   | quality 与 e2e 仍双重 build           | CI 时长                      | 可选缓存/合并评估                       |
| D2-4 | D2   | deploy 远端再构建 ≠ CI 产物           | 部署保真                     | smoke 兜底；可选 prebuilt               |
| D2-5 | D2   | launch-baseline HEAD 未钉到 `dfc057b` | 文档                         | 下轮卫生更新证据表                      |
| D3-1 | D3   | 外部搜索引擎                          | ≥200 文或 p95                | ADR 后评估 Pagefind/其他                |
| D3-2 | D3   | 正文图 LQIP                           | `public/images/blog/**` 有图 | gen:blur + check:blur                   |
| D3-3 | D3   | prose/article CSS 深度下沉            | Coverage 证据                | 禁止无证据搬迁                          |
| D3-4 | D3   | Cache Components                      | 外部数据/ISR/失效            | 见迁移指南                              |
| D3-5 | D3   | projects 长文复盘 MDX                 | 产品需要                     | `content/projects/` + JSON 索引         |

### 5.3 债务治理原则

1. **门槛未到不做**（TODO 已写清）。
2. **账号项不改产品代码假装完成**。
3. **体验债优先有浏览器证据的项**。
4. **每次改动同步维护文档，不扩写历史快照正文**。

---

## 6. 目标 · 约束 · 边界

### 6.1 产品目标（分层）

#### 北极星

成为作者的 **「可复用工程笔记 + 可信作品集 + 策展导航」** 个人品牌站点：安静、可读、可验证、可接手。

#### 目标树

| 层          | 目标                     | 可观测                         |
| ----------- | ------------------------ | ------------------------------ |
| G1 可信工程 | 生产永不「绿部署空内容」 | strict JSON、SEO 门禁、smoke   |
| G2 安全基线 | 脚本 CSP 不回退          | 无 `unsafe-inline` script；ADR |
| G3 阅读体验 | 长文与移动可读           | CLS/字体/TOC/代码块反馈        |
| G4 发现路径 | 2 次点击内达核心内容     | 首页路径 + 归档互链 + 搜索     |
| G5 内容增长 | 笔记与作品持续沉淀       | 文章数、专题完整度、项目叙事   |
| G6 可维护   | Agent/人类 30 分钟接手   | handoff + TODO + 边界测试      |
| G7 可选运营 | 搜索引擎收录与 RUM       | GSC/Bing/p75（非必须）         |

### 6.2 非目标（硬边界）

- 不做多作者 CMS / 编辑后台。
- 不做用户账号体系 / 付费订阅。
- 不做独立后端微服务或跨仓 API。
- 不做搜索集群（未达门槛）。
- 不为边缘 HTML 缓存牺牲脚本 CSP。
- 不把运营账号工作伪装成代码里程碑。
- 不进行「全站视觉推倒重来」除非单独立项且有设计稿。

### 6.3 约束

| 类型 | 约束                                                          |
| ---- | ------------------------------------------------------------- |
| 技术 | Next 16 App Router · React 19 · TS strict · pnpm · Node 22 CI |
| 安全 | CSP nonce · `remotePatterns: []` · 密钥不入库                 |
| 内容 | 本地 git 为 SSOT；MDX/JSON                                    |
| 部署 | Vercel + GitHub Actions；push/deploy 需用户确认               |
| 协作 | 高风险外发/删除先确认；用户跳过运营时穷尽自动路径后停         |
| 文档 | 行为以源码为准；历史报告不改写数字                            |
| 规模 | 当前 14/6/123；优化假设不按十万级设计                         |

### 6.4 系统边界

```text
[作者本地编辑 MDX/JSON]
        │ git push（需确认）
        ▼
[GitHub Actions quality/e2e] ──► [Vercel deploy]
        │                              │
        │                              ▼
        │                     [浏览器访客]
        │                      ├─ HTML（动态+nonce）
        │                      ├─ /api/search
        │                      ├─ 静态资产
        │                      └─ 第三方：Giscus / Vercel analytics
        │
        └─ 不在边界内：GSC 控制台、CF DNS 写、Speed Insights 明细 API
```

**信任边界**：

- 内容仓库：构建/运行时 Zod 校验。
- 搜索 API：公开只读投影 + 参数限制 + origin 限流。
- 第三方脚本：CSP allowlist。
- MDX 组件白名单：防原始 HTML XSS。

---

## 7. 输入 · 输出 · 接口契约

### 7.1 系统输入

| 输入      | 来源                                        | 校验                               |
| --------- | ------------------------------------------- | ---------------------------------- |
| 博客 MDX  | `content/blog/*.mdx`                        | frontmatter schema；生产过滤 draft |
| 关于 MDX  | `content/about.mdx`                         | 解析管道                           |
| 项目 JSON | `data/projects.json`                        | Zod + 生产 strict                  |
| 链接 JSON | `data/links.json`                           | 分类/URL/追踪参数规则              |
| 环境变量  | `NEXT_PUBLIC_SITE_URL`、Giscus、Vercel 标志 | 生产禁 localhost feed              |
| 搜索查询  | `GET /api/search?q&limit`                   | 长度/limit clamp                   |
| 访客交互  | 主题、阅读偏好、搜索 `?q=`                  | localStorage 安全封装              |

### 7.2 系统输出

| 输出                     | 消费者       | 说明                       |
| ------------------------ | ------------ | -------------------------- |
| HTML 页面                | 访客         | 动态文档 + 安全头          |
| `SearchResultItem[]`     | SearchBar    | 无 searchText 泄露         |
| `feed.xml` / `feed.json` | 订阅器       | 构建期生成                 |
| `sitemap.xml` / robots   | 爬虫         | App Router metadata routes |
| OG images                | 社交预览     | `opengraph-image`          |
| JSON-LD                  | 搜索引擎     | `<` 转义                   |
| CI 报告                  | 维护者       | 测试/LH/bundle artifacts   |
| ops-readiness JSON       | Agent/维护者 | 延后项状态机               |

### 7.3 关键内部契约（摘要）

```text
ContentSource → Repository(+createCache) → server/content → page
PostMeta → projectSearchItem → SearchResultItem
client ──HTTP──► /api/search ──► server/search ──► Fuse
```

错误语义（搜索）：空查询、超长、`RATE_LIMITED`、内部错误映射——详见 `docs/API.md`。

### 7.4 人机输入输出（本决策流程）

| 角色  | 输入                             | 输出                         |
| ----- | -------------------------------- | ---------------------------- |
| 用户  | 进度诉求、运营偏好、交互表单选择 | 下一里程碑授权               |
| Agent | 仓库事实、历史文档、调研         | 本报告 + 表单 + 后续实施计划 |
| CI    | PR/push                          | 门禁通过/失败日志            |
| 生产  | 部署                             | smoke 可验证公开面           |

---

## 8. 架构优化方案全集与对比

下列每组方案均绑定 **目标/约束/验收**。推荐项标 ★。

### 8.1 平台策略（是否换栈）

| 方案      | 描述                                | 复杂度 | 风险                    | 与目标匹配                           |
| --------- | ----------------------------------- | ------ | ----------------------- | ------------------------------------ |
| **P-A ★** | **锁定 Next + 本地内容 + 现行分层** | 低     | 低                      | 完美匹配 G1–G6                       |
| P-B       | 迁移 Astro Content Collections      | 极高   | 高（测试/交互/CI 重写） | 利 G3 性能实验室分，损 G6 与沉没成本 |
| P-C       | 迁移 Hugo/Quartz                    | 极高   | 高                      | 形态错位（花园/纯静态）              |
| P-D       | 上 Headless CMS                     | 高     | 中高                    | 违反非目标与单人工作流               |

**最佳：P-A。**  
原因：产品形态（作品集+策展+Giscus+严格 CSP+深度门禁）与 Next 同构；换栈的「Lighthouse 分数想象收益」无法覆盖 618 测试与视觉系统重置成本；用户未提出性能灾难或内容协作瓶颈。

### 8.2 渲染与安全模型

| 方案      | 描述                            | 优点                               | 缺点                                                  |
| --------- | ------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| **R-A ★** | **维持 nonce CSP + 动态 HTML**  | XSS 基线；第三方脚本可控；ADR 已定 | HTML 难边缘缓存                                       |
| R-B       | 全站 SSG + `unsafe-inline` 脚本 | TTFB/CDN                           | **违反硬约束**                                        |
| R-C       | 全站 SSG + 构建时 hash CSP      | 静态+较严 CSP                      | Next 内联 hydration/第三方脚本工程难度大；Giscus 复杂 |
| R-D       | 混合：营销页静态、应用页动态    | 理论最优                           | 本站几乎全是内容页，拆分收益低、复杂度高              |

**最佳：R-A。**  
原因：硬约束禁止 R-B；R-C 在 Next+Giscus 现实中成本高且无官方「一键静态 nonce」；R-D 对 14 文站点过度设计。Revisit 仅当 RUM 证明 TTFB/成本不可接受 **且** 存在不削弱 XSS 的替代路径。

### 8.3 内容架构

| 方案      | 描述                                          | 何时                |
| --------- | --------------------------------------------- | ------------------- |
| **C-A ★** | **MDX 文 + JSON 项目/链接 + 现有 repository** | 现在–中期           |
| C-B       | 构建期内容索引产物（search index、关系图）    | 文量或构建变慢时    |
| C-C       | `content/projects/*.mdx` 长复盘 + JSON 索引   | 需要项目故事时      |
| C-D       | 外部 CMS/DB                                   | 多人或非 git 工作流 |

**最佳：C-A，预留 C-C 为产品增强、C-B 为规模增强。**  
原因：ADR 0002 已统一 JSON factory；posts 深度模块足够；C-D 非目标。

### 8.4 搜索架构

| 方案      | 描述                                           | 门槛                          |
| --------- | ---------------------------------------------- | ----------------------------- |
| **S-A ★** | **现行 API Fuse + 投影 + 限流 + CDN s-maxage** | 默认                          |
| S-B       | 构建期 Pagefind 静态索引                       | 文量↑ 或要离线分片索引        |
| S-C       | Algolia/Meili                                  | 高级分析/超大语料；引入第三方 |
| S-D       | 回退客户端全量 Fuse payload                    | 反模式（已移除）              |

**最佳：S-A。**  
原因：14 文；已消除列表页全量索引 payload；限流语义诚实；S-C 违反 YAGNI 与隐私偏好。

### 8.5 CSS / 视觉架构

| 方案      | 描述                                          | 评价                           |
| --------- | --------------------------------------------- | ------------------------------ |
| **V-A ★** | **tokens + BEM 结构 + shadcn 交互 primitive** | 现行最优平衡                   |
| V-B       | 全量 utility-only Tailwind                    | 破坏 Paper Gallery，回归成本高 |
| V-C       | CSS-in-JS                                     | 与 RSC/CSP/包体冲突风险        |
| V-D       | 立即全量 prose 下沉                           | 无 Coverage 证据，禁止         |

**最佳：V-A。**  
细节打磨在 V-A 内做：移动密度、暗色回归、动画岛审计、字体 CLS——而非换范式。

### 8.6 前后端边界

| 方案      | 描述                             | 状态                   |
| --------- | -------------------------------- | ---------------------- |
| **B-A ★** | **同仓 `src/server` + 边界测试** | 已实施                 |
| B-B       | 独立后端服务                     | 拒绝（CORS/部署/同步） |
| B-C       | 仅文档约定无测试                 | 拒绝（已证伪）         |

**最佳：B-A（保持）。** 无新动作除非边界测试被破坏。

### 8.7 缓存演进

| 方案      | 描述                          | 门槛                  |
| --------- | ----------------------------- | --------------------- |
| **K-A ★** | **`createCache<T>` 进程缓存** | 默认                  |
| K-B       | Next Cache Components         | 外部数据/ISR/tag 失效 |
| K-C       | Redis 等外置                  | 无                    |

**最佳：K-A。** 见 `cache-components-migration.md`。

### 8.8 部署与 CI

| 方案      | 描述                                | 建议                     |
| --------- | ----------------------------------- | ------------------------ |
| **D-A ★** | **现行 quality→e2e→deploy + smoke** | 保持                     |
| D-B       | `vercel build --prebuilt`           | 可选提升保真；需授权试验 |
| D-C       | mobile Lighthouse error 门禁        | **否**；先 warn/手测     |
| D-D       | 削弱测试换速度                      | 否                       |

**最佳：D-A**；D-B 作为工程卫生可选实验。

### 8.9 下一阶段产品焦点（三主轨道）

| 轨道      | 内容                                                       | 价值         | 风险               |
| --------- | ---------------------------------------------------------- | ------------ | ------------------ |
| **O-A ★** | **内容与品牌**：新文章、专题补强、项目长叙事、链接策展质量 | 访客直接感知 | 低工程风险         |
| **O-B**   | **体验打磨**：移动 TOC/字体/CLS/动画岛/404 导流            | 体验分       | 中（CSS 回归）     |
| **O-C**   | **工程卫生**：文档同步、工具链瘦身、CI 微调、基线更新      | 可维护       | 低，但产品不可见   |
| O-D       | 强推运营账号闭环                                           | SEO 长期     | 需真人；用户可跳过 |
| O-E       | 大重构/换栈                                                | 无           | 高，不匹配         |

**默认推荐：O-A 为主，O-B 为辅，O-C 随手做，O-D 按用户授权，O-E 否。**

---

## 9. 为什么「最佳组合」最符合项目要求

### 9.1 项目要求还原（从文档与行为推断）

1. 个人技术品牌，而非 SaaS。
2. 本地内容、git 工作流。
3. 生产级安全与质量，而非玩具站。
4. 作品集与策展与博客同等重要。
5. Agent 可接手、可验证。
6. 用户可跳过运营账号。
7. 拒绝过早平台化。

### 9.2 最佳组合

```text
P-A + R-A + C-A(+可选 C-C) + S-A + V-A + B-A + K-A + D-A
下一阶段默认 O-A + O-B(轻) + O-C(轻)
```

### 9.3 匹配论证

| 要求            | 组合如何满足                    | 若选错方案会怎样           |
| --------------- | ------------------------------- | -------------------------- |
| 个人品牌+作品集 | Next 组件化首页叙事 + JSON 项目 | Quartz/Nextra 偏笔记/文档  |
| 本地内容        | MDX/JSON + repository           | CMS 增加账号与故障面       |
| 安全            | nonce CSP ADR                   | SSG+unsafe-inline 削弱 XSS |
| 质量            | 现有 CI 全套                    | 换栈归零                   |
| 可接手          | server 边界+文档体系            | 大重构制造文档债           |
| 跳过运营        | ops-readiness 状态机            | 改代码假装 GSC 完成        |
| YAGNI           | Fuse/阈值门闩                   | 过早 Meili/ES              |
| 体验            | 在 V-A 内打磨                   | 全量 utility 重写毁纸感    |

### 9.4 反证（devil's advocate）

- **反证 1**：Astro 可能让移动 lab Lighthouse 更好看。
  - **回应**：移动 lab 高 FCP/LCP 部分来自本地仿真与 render-blocking CSS；field 数据缺失。换栈成本 ≫ 在 Next 内做 CSS/字体优化。
- **反证 2**：动态 HTML 增加 Vercel 费用。
  - **回应**：个人流量下通常可忽略；无 p75/调用量证据前不优化想象账单。
- **反证 3**：工程门禁过重拖慢写作。
  - **回应**：可通过「内容-only PR 最小验证矩阵」减轻，而不是拆门禁；写作轨道 O-A 主要改 `content/`/`data/`。

---

## 10. 分轨道实施规格（目标 / 输入 / 输出 / 验收）

### 10.1 轨道 O-A：内容与品牌增长

**目标**：提升站点「值得一读/一看」的密度，而不是再加框架。

**输入**：

- 新 MDX（frontmatter 完整）
- 可选：项目长文、更新 `projects.json`、链接健康
- `content-workflow.md` 规范

**输出**：

- 可访问文章/项目/链接
- RSS/sitemap 自动包含
- SEO 检查通过

**验收标准**：

1. `pnpm check:seo` 退出 0。
2. `pnpm build` 成功；`public/feed.*` 无 localhost。
3. 新文在 `/blog`、sitemap、相关专题/标签可见。
4. 项目若改图：`pnpm gen:blur && pnpm check:blur`。
5. 生产（若授权部署）`check:production-content` 绿。
6. 不引入新依赖、不改 CSP。

**任务包示例**：

| 任务 | 说明                                          | 优先级 |
| ---- | --------------------------------------------- | ------ |
| A1   | 新增 1–N 篇有真实踩坑的长文                   | P0     |
| A2   | 补强某专题系列顺序与互链                      | P1     |
| A3   | 精选项目增加「问题-方案-结果」字段或 MDX 复盘 | P1     |
| A4   | 链接 `lastChecked` / 死链清理                 | P2     |
| A5   | about 页与首页 Manifesto 对齐身份             | P2     |

### 10.2 轨道 O-B：体验细节打磨

**目标**：在不改信息架构前提下，提高阅读与移动完成率。

**输入**：问题页截图/Lighthouse、现有 CSS 模块、E2E。  
**输出**：CSS/组件小 diff、测试更新、性能基线备注。

**验收标准**：

1. 相关 Vitest + 受影响 Playwright 通过。
2. 桌面 Lighthouse 不跌破 CI 阈值。
3. 360/390 宽度：无横向滚动、TOC/设置不永久遮挡正文。
4. 暗色模式抽检通过。
5. 视觉变更有前后说明；无「为动画而动画」。

**任务包示例**：

| 任务 | 说明                                    | 优先级 |
| ---- | --------------------------------------- | ------ |
| B1   | 文章字体/标题/code 骨架 → lab CLS       | P1     |
| B2   | 移动目录入口                            | P1     |
| B3   | 首页动画岛审计（删/减 LoadingIntro 等） | P1     |
| B4   | 404/error 导流与搜索建议                | P2     |
| B5   | MagneticCard 等交互性能回归测试         | P2     |
| B6   | 中文 font 策略实验                      | P2     |

### 10.3 轨道 O-C：工程卫生

**目标**：降低文档漂移与工具噪音，不改变访客行为。

**验收标准**：

1. 访客 DOM/路由/视觉无变化（或仅文档）。
2. `pnpm check:docs`、`format:docs:check` 绿。
3. CI 仍全绿。
4. handoff/launch-baseline 证据与 HEAD 一致。

**任务包示例**：

| 任务 | 说明                                     |
| ---- | ---------------------------------------- |
| C1   | 同步 AGENTS 搜索描述与 server 分层       |
| C2   | 更新 launch-baseline 到 `dfc057b` 证据   |
| C3   | 评估移除 Stryker                         |
| C4   | ops-readiness 定期 live 巡检（不改产品） |

### 10.4 轨道 O-D：运营闭环（可选）

**输入**：用户在场 Google 登录；可选 CF DNS Edit token。  
**输出**：GSC/Bing 状态、p75 表回填。  
**验收**：仅真实控制台状态；`ops-readiness` 状态位更新；**无**假数据。

### 10.5 跨轨道「全局验收门禁」（任何代码变更）

| 变更类型  | 最低命令                                              |
| --------- | ----------------------------------------------------- |
| 仅文档    | `format:docs:check`、`check:docs`、`git diff --check` |
| 内容/JSON | 上 + `check:seo`、`build`                             |
| TS/组件   | format、lint、typecheck、相关 test                    |
| 路由/交互 | 上 + full test、e2e                                   |
| 部署      | 完整 CI + production-content（需授权）                |

---

## 11. 细节打磨参考手册（可执行 checklist）

### 11.1 阅读体验

- [ ] 正文行长与行高保持 prose 规范（见 css-conventions）
- [ ] 代码块：语言标签、复制反馈、移动横向滚动提示
- [ ] 标题层级不跳级；系列文有「上一篇/下一篇」
- [ ] 图片：宽高或 blur，避免 CLS
- [ ] 中英文混排：展示字体仅 Hero/少量英文

### 11.2 首页与品牌

- [ ] Hero 口号与三个信息点可扫读
- [ ] ReadingPath 指向真实专题/高价值文
- [ ] 项目卡片图为真界面，不靠色块
- [ ] CTA 指向 about / GitHub / RSS / links
- [ ] 减少首屏竞争：装饰不压过文字

### 11.3 搜索与发现

- [ ] `/blog` 搜索 debounce 与空状态有下一步
- [ ] `?q=` 可分享
- [ ] 结果高亮不泄漏内部 searchText
- [ ] 分类/标签/专题页有「这是什么」短说明

### 11.4 无障碍与键盘

- [ ] skip link
- [ ] 移动菜单 focus trap / Esc
- [ ] 搜索 listbox 键盘行为
- [ ] focus-visible 不靠颜色唯一表达

### 11.5 安全与隐私

- [ ] 不引入未消毒 MDX raw HTML
- [ ] 新第三方脚本必须改 CSP + ADR
- [ ] 链接拒绝追踪参数（现有校验）
- [ ] 密钥仅环境变量

### 11.6 内容运营质量

- [ ] 每文 description 非空且非标题重复
- [ ] date/updatedAt 合理
- [ ] 内链指向仍存在的 slug
- [ ] 项目 GitHub 非 404（身份已修到 xvyimu）

### 11.7 性能

- [ ] 守住 bundle budget
- [ ] 新 client 组件评估动态 import
- [ ] 大图放 `public/` 并压缩
- [ ] 不以 lab 分替代 RUM 决策

---

## 12. 风险登记册

| 风险                     | 可能性             | 影响 | 缓解                                 |
| ------------------------ | ------------------ | ---- | ------------------------------------ |
| 为分数换栈               | 中（外部建议诱惑） | 高   | 本报告 P-A 锁定；换栈需单独 ROI 论证 |
| 无证据下沉 CSS 致回归    | 中                 | 中   | Coverage + 条件触发                  |
| localhost feed 污染      | 低                 | 高   | 构建 fail-fast + CI diff             |
| 静默空 JSON（历史）      | 低                 | 高   | 生产 strict 已上                     |
| 限流被误认为全局安全     | 中                 | 中   | 文档诚实 + 可选 WAF                  |
| 文档漂移误导 Agent       | 中                 | 中   | overview 分层 + check:docs           |
| 用户期望运营完成但无登录 | 高                 | 低   | 硬阻塞记录；可跳过                   |
| 过度工程搜索             | 低                 | 中   | 200 文门槛                           |

---

## 13. 里程碑建议（90 天逻辑视图）

> 非承诺排期；依赖用户表单选择。

### M0 决策冻结（本报告 + 表单）

- 确认平台/渲染/搜索/下一轨道。
- 更新或确认 TODO 仍为「无无条件工程债」。

### M1 内容密度（若选 O-A）

- +N 篇高质量文或 1 个项目深复盘。
- 专题互链与首页 ReadingPath 更新。
- 验收：§10.1。

### M2 体验点修（若选 O-B）

- CLS/移动 TOC/动画岛 三选二落地。
- 验收：§10.2。

### M3 卫生小步（O-C 可并行）

- AGENTS/baseline 同步；可选依赖清理。
- 验收：§10.3。

### M4 运营（仅授权）

- GSC→Bing→p75。
- 验收：§10.4。

### M5 规模门槛复查（触发制）

- 文量、搜索 p95、CSS Coverage、外部数据需求 → 打开 D3-* ADR。

---

## 14. 交互决策点设计（供表单使用）

下列决策将通过会话内交互表单收集；结果应回写：

1. 本报告文首「用户决议」节（可另 commit）
2. 若改变执行轨道：根 `TODO.md` 增加**有条件**条目（勿复活已关闭 P0–P10）
3. 记忆层：项目偏好一条

| 决策 ID | 问题       | 选项摘要                                                   |
| ------- | ---------- | ---------------------------------------------------------- |
| D1      | 下一主轨道 | 内容 / 体验 / 卫生 / 运营 / 混合                           |
| D2      | 平台策略   | 锁定 Next / 评估 Astro / 其他                              |
| D3      | CSP/渲染   | 维持 nonce / 研究 hash 静态 / 接受 unsafe-inline（不推荐） |
| D4      | 搜索       | 维持 Fuse API / 预研 Pagefind / 上托管搜索                 |
| D5      | 内容形态   | 仅短中文 / 增加项目 MDX 复盘 / 数字花园化                  |
| D6      | 运营       | 继续跳过 / 准备 GSC / 只要 RUM                             |
| D7      | 文档产出   | 仅本报告 / 另写 ADR / 同步维护文档                         |

---

## 15. 用户旅程与信息架构再评估

### 15.1 关键访客画像

| 画像               | 动机              | 成功路径                         | 失败模式                                   |
| ------------------ | ----------------- | -------------------------------- | ------------------------------------------ |
| 招聘/合作方        | 快速判断工程能力  | 首页 → 作品 → 一篇代表文 → about | 项目图假、GitHub 404（已修）、无代表作叙事 |
| 同行工程师         | 搜具体问题解法    | 搜索/标签 → 长文 → 相关文/外链   | 搜索弱、内链断、文过时                     |
| 运维/自托管爱好者  | 找工具与 VPS 清单 | 首页链接预览 → `/links` 筛选     | 链接失效、分类过粗                         |
| 未来的自己 / Agent | 接手改一处        | handoff → architecture → TODO    | 文档漂移、历史报告当待办                   |

### 15.2 旅程步骤与当前缺口

```text
落地首页
  → 3 秒内理解「这是谁、写什么」   [基本满足：Hero+Manifesto]
  → 选择：读文 / 看作品 / 翻收藏     [满足：ReadingPath+Rails]
  → 深读一篇                         [满足：TOC/进度/设置/Giscus]
  → 扩散到系列或外链                 [部分：系列全量已修；外链质量靠策展]
  → 订阅或回访                       [RSS 有；GSC/推送无]
```

**缺口优先级（产品视角）**：

1. **代表作深度**：JSON 卡片够索引，不够「案例研究」。
2. **内容时间新鲜度**：14 文均 2026-06 前缀簇，需持续更新信号。
3. **移动完成率**：实验室 LCP 警告提示样式与字体仍是体验债。
4. **搜索引擎发现**：工程 sitemap 就绪，账号侧可选。

### 15.3 信息架构原则（保持）

1. **博客 ≠ 文档站**：不要强行左侧巨大目录树（Nextra 化）。
2. **作品集 ≠ 应用商店**：强调问题与技术选型，而非下载量。
3. **收藏 ≠ 广告墙**：官方链接、去追踪参数、分类可扫。
4. **首页是叙事，内页是工具**：Paper Gallery 品牌放首页；列表页干净。

### 15.4 若选「数字花园化」会破坏什么

Quartz 式 wikilink/图谱会把 IA 从「出版型博客」拉向「笔记网络」：

- 现有系列/标签/分类已覆盖结构化发现。
- 图谱增加客户端重量与认知噪音。
- 与「可复用工程笔记」的出版节奏不完全一致。

因此 **D5 选数字花园** 仅当用户明确要第二大脑公开化；否则维持出版型 IA。

---

## 16. 方案详细推演（含工作量与回滚）

### 16.1 内容增长轨道（O-A）细案

#### 方案 O-A1：只加文章（最小）

| 项     | 内容                            |
| ------ | ------------------------------- |
| 工作量 | 每文 0.5–2 人日（含配图与内链） |
| 改动面 | `content/blog/*.mdx` 为主       |
| 风险   | 极低                            |
| 回滚   | 删文或 `published: false`       |
| 验收   | §10.1                           |

#### 方案 O-A2：文章 + 项目案例 MDX（推荐增强）

| 项     | 内容                                            |
| ------ | ----------------------------------------------- |
| 工作量 | 2–5 人日搭建 `content/projects` 管道 + 首篇案例 |
| 改动面 | schema、repository、projects 路由、导航、测试   |
| 风险   | 中（新内容类型）                                |
| 回滚   | 隐藏路由；JSON 卡片仍可用                       |
| 验收   | 案例页 SSOT 字段完整；SEO 与返回作品列表        |

**对比**：O-A1 立刻有读者价值；O-A2 强化作品集差异化。若只能选一个工程增量，**先 O-A1 连载，再 O-A2**。

#### 方案 O-A3：链接目录产品化

| 项     | 内容                                                |
| ------ | --------------------------------------------------- |
| 工作量 | 1–3 人日                                            |
| 内容   | 死链抽检、`lastChecked`、useCase 补全、首页预览算法 |
| 风险   | 低                                                  |
| 说明   | 123 条已具规模，质量>数量                           |

### 16.2 体验打磨轨道（O-B）细案

#### 方案 O-B1：性能与 CLS 专项

聚焦文章页与首页：字体、标题 clamp、code toolbar 高度、关键图尺寸。  
**不做**：换框架、关 CSP、大拆 CSS。  
**验收**：桌面 LH 不回归；文章 lab CLS 趋势向下；手测 390 宽。

#### 方案 O-B2：移动阅读专项

移动 TOC、阅读设置与 BackToTop 空间竞争、代码块横滑提示。  
**验收**：`mobile.spec.ts` 扩展路径；真实手机或 Playwright mobile。

#### 方案 O-B3：交互减负专项

审计 LoadingIntro、RevealOnScroll、MagneticCard 是否全开；`prefers-reduced-motion` 全覆盖。  
**验收**：TBT 不升；减少无意义首屏 JS。

**推荐序**：B1 → B2 → B3（先稳定再花活）。

### 16.3 工程卫生轨道（O-C）细案

| 子项                | 收益                  | 是否动运行时     |
| ------------------- | --------------------- | ---------------- |
| 文档与 AGENTS 同步  | 防 Agent 误判搜索架构 | 否               |
| baseline HEAD 证据  | 接手可信              | 否               |
| 移除未用 Stryker    | 安装体积              | 否               |
| CI cache / prebuilt | 反馈时间              | 部署路径，需小心 |
| mobile LH warn job  | 可见性                | 否（warn）       |

**原则**：O-C 变更应使 `git diff` 对访客行为为零。

### 16.4 「研究 Astro 迁移」若被选中时的诚实成本

仅当表单选「评估 Astro」时执行 **研究**，不是迁移：

1. 列出必须重写的能力：CSP nonce 等价物、Giscus、搜索 API、纸感 CSS、618 测试、CI smoke。
2. 做 **一页 POC**（单文+首页），测 Lighthouse 与开发体验。
3. 写 ADR：迁移/不迁移。
4. 默认预期结论仍为不迁移——除非 POC 证明数量级体验差且用户接受 4–8 周重建。

### 16.5 错误组合预警

| 组合                     | 为何危险         |
| ------------------------ | ---------------- |
| 换栈 + 同时大改视觉      | 无法归因回归     |
| 上 Meili + 14 文         | 运维噪音，无收益 |
| 关边界测试换速度         | 分层回退         |
| 无 Coverage 搬 prose.css | 样式大回归       |
| 用 Lighthouse 填 RUM     | 决策污染         |

---

## 17. 度量体系与「完成」定义

### 17.1 工程健康度（已有）

| 指标            | 当前门槛      | 数据源                   |
| --------------- | ------------- | ------------------------ |
| 单测            | CI 全绿       | Vitest                   |
| E2E             | 48 用例       | Playwright               |
| LH desktop perf | ≥0.80         | CI                       |
| CLS lab         | ≤0.15         | CI                       |
| JS/CSS budget   | 300KB / 2MB   | check-bundle-budget      |
| SEO             | check:seo 0   | scripts                  |
| 生产公开面      | smoke 0       | check:production-content |
| 延后项状态      | ops-readiness | scripts                  |

### 17.2 产品健康度（建议开始记，不强制）

| 指标         | 记录方式           | 目标方向           |
| ------------ | ------------------ | ------------------ |
| 月新增原创文 | 手工/git log       | >0 持续            |
| 专题完整度   | 系列页篇数与顺序   | 无空洞 seriesOrder |
| 项目叙事覆盖 | 有深度复盘的项目数 | ≥1 旗舰            |
| 死链率       | 抽检 links         | 趋近 0             |
| 搜索有结果率 | 自测常见词         | 核心技术词可命中   |

### 17.3 真实用户性能（可选）

| 指标    | Good   | 行动线      |
| ------- | ------ | ----------- |
| LCP p75 | ≤2.5s  | >3.0s 调查  |
| INP p75 | ≤200ms | >300ms 调查 |
| CLS p75 | ≤0.1   | >0.1 调查   |

无样本时保持 pending，**不等于**工程失败。

### 17.4 里程碑完成定义（DoD）模板

任何宣称「某里程碑完成」必须同时具备：

1. 代码或内容变更已在 git 中可指认；
2. 对应验收命令输出可复现；
3. 维护文档已同步（若影响行为）；
4. 未完成的账号项不得标完成；
5. 条件未触发项保持 `not_triggered`。

---

## 18. 与历史 Roadmap 的显式映射

`optimization-roadmap-2026-07-06` 中的主题如何落位到今日：

| 2026-07-06 主题 | 今日状态                  | 去向       |
| --------------- | ------------------------- | ---------- |
| 导航配置收口    | 基本完成                  | 维持       |
| token 去重      | 持续卫生                  | O-C/O-B    |
| 搜索客户端负载  | 已 API 化                 | S-A 保持   |
| 移动 LH         | 有手测基线，未进 error CI | 条件/warn  |
| 移动 TOC 等 UX  | 部分完成，可继续          | O-B        |
| 内容发现路径    | 首页叙事已强              | O-A 补内容 |
| 外部搜索        | 门槛制                    | D3-1       |
| CMS             | 拒绝                      | 非目标     |

`full-stack-audit-2026-07-17` P1：

| 项                | 今日                 |
| ----------------- | -------------------- |
| 路由 CSS          | 部分下沉，其余门槛制 |
| RUM 确认动态 HTML | 用户可跳过；工程就绪 |
| JSON fail-fast    | 已做                 |
| 限流语义          | 已文档化             |

**结论**：历史 roadmap 的「架构债」主体已清偿；剩余是 **体验、内容、可选运营**。

---

## 19. 场景剧本（选定轨道后怎么干）

### 剧本 S1：用户选「内容为主」

```text
第 1 天：定 3 个题目（与现有标签互补，避免重复）
第 2–4 天：写 1 篇旗舰长文（含真实命令/踩坑/回滚）
第 5 天：内链到系列与相关项目；check:seo + build
第 6 天：更新 ReadingPath 或精选轨道
可选：授权部署 + production smoke
```

### 剧本 S2：用户选「体验为主」

```text
第 1 天：复现文章页 CLS 与移动 TOC 问题（截图/LH）
第 2–3 天：字体与布局最小 diff + 单测/E2E
第 4 天：首页动画岛审计，删除低价值 client 工作
第 5 天：暗色+390 宽回归；更新 performance-baseline 备注
```

### 剧本 S3：用户选「卫生为主」

```text
半天：AGENTS/handoff/launch-baseline 与 HEAD 对齐
半天：依赖与死文档链接
可选：CI 时长分析（只出数据，不贸然合并 job）
```

### 剧本 S4：用户选「运营」

```text
确认 Google 在场 → ops 手册 §3 GSC → §4 Bing → §5 p75
全程禁止代填密码；DNS 无 token 则停在硬阻塞
```

### 剧本 S5：用户选「混合」

```text
70% O-A + 20% O-B + 10% O-C
禁止并行开换栈研究
```

---

## 20. 术语表与决策词汇

| 词            | 含义                             |
| ------------- | -------------------------------- |
| 维护文档      | `docs/overview` 表内现行操作真值 |
| 历史快照      | 日期型报告/run，数字不追改       |
| 条件触发      | 未到门槛则正确终态               |
| 逻辑前后端    | 同仓 `src/server` 边界，非双部署 |
| nonce CSP     | 每请求脚本 nonce，导致动态 HTML  |
| 投影 DTO      | 搜索结果去掉内部字段             |
| ops-readiness | 延后运营与条件项状态机脚本       |
| Paper Gallery | 首页纸感视觉语言                 |
| fail-fast     | 生产缺内容抛错而非空页           |
| YAGNI         | 未证明前不上复杂子系统           |

---

## 21. 约束驱动的「输入—处理—输出」规格总表

本节把目标、约束、边界压成一张可执行规格，便于后续 Agent 不做发散重构。

### 21.1 输入规格（Input Spec）

| 输入 ID | 名称     | 格式                         | 必填                               | 校验规则                              | 失败行为（生产）                  |
| ------- | -------- | ---------------------------- | ---------------------------------- | ------------------------------------- | --------------------------------- |
| IN-01   | 博文     | `content/blog/YYYY-MM-*.mdx` | 是（站点可零文启动，但发布需合规） | title/description/date；Zod           | 构建/读取抛错或过滤 draft         |
| IN-02   | 关于页   | `content/about.mdx`          | 是                                 | 可解析 MDX                            | 页面错误边界                      |
| IN-03   | 项目     | `data/projects.json`         | 是                                 | Zod；id 唯一；图路径存在（blur 检查） | **strict 抛错**，禁止空数组假成功 |
| IN-04   | 链接     | `data/links.json`            | 是                                 | 分类非空；URL 唯一；拒追踪参数        | 同上                              |
| IN-05   | 站点 URL | `NEXT_PUBLIC_SITE_URL`       | 生产必填                           | 非 localhost（生产构建）              | RSS 生成失败                      |
| IN-06   | Giscus   | 三个 NEXT_PUBLIC_GISCUS_*    | 可选                               | 缺则评论不渲染                        | 降级无评论                        |
| IN-07   | 搜索查询 | `q`, `limit`                 | q 可空                             | 长度/limit clamp                      | 4xx JSON 错误码                   |
| IN-08   | 用户偏好 | localStorage 主题/阅读       | 否                                 | safeLocalStorage                      | 忽略损坏值                        |

### 21.2 处理规格（Process Spec）

| 步骤       | 负责模块                     | 不变量                      |
| ---------- | ---------------------------- | --------------------------- |
| 读盘       | ContentSource / json factory | 路径仅来自 `content-dirs`   |
| 解析       | frontmatter + MDX remote     | 组件白名单                  |
| 校验       | Zod schemas                  | 领域错误不吞                |
| 缓存       | `createCache<T>`             | 测试 `resetAllCaches`       |
| 服务端门面 | `server/content`             | 页面不直连 fs               |
| 搜索用例   | `server/search`              | 投影后无 searchText         |
| 限流       | 进程 Map                     | 文档写明 best-effort        |
| 渲染       | App Router + nonce           | layout 读同一 nonce         |
| 出站 HTML  | proxy 安全头                 | 与 next.config 头叠加不矛盾 |

### 21.3 输出规格（Output Spec）

| 输出 ID | 名称           | SLA/质量                    | 消费者    |
| ------- | -------------- | --------------------------- | --------- |
| OUT-01  | HTML 文档      | 200；安全头齐全；nonce 脚本 | 访客      |
| OUT-02  | 搜索 JSON      | ≤限流；字段白名单           | SearchBar |
| OUT-03  | RSS/JSON Feed  | 绝对 URL；与站点一致        | 订阅器    |
| OUT-04  | Sitemap/Robots | 覆盖核心路由                | 爬虫      |
| OUT-05  | OG 图          | 可请求                      | 社交      |
| OUT-06  | CI 状态        | push 后可查                 | 维护者    |
| OUT-07  | ops-readiness  | 状态枚举正确                | Agent     |

### 21.4 约束到设计的追溯

| 约束                      | 设计选择        | 若违反        |
| ------------------------- | --------------- | ------------- |
| 禁止 script unsafe-inline | R-A nonce       | XSS 基线崩    |
| 本地内容                  | C-A             | 引入 CMS 运维 |
| 单人可维护                | 不同 B-B 双部署 | 故障面翻倍    |
| 跳过运营可成立            | X 项非工程门禁  | 伪完成        |
| 小规模                    | S-A Fuse        | 过早集群      |
| Agent 可接手              | 文档分层+边界测 | 误改架构      |

### 21.5 边界外明确拒绝的输入

- 用户密码/Google cookie（Agent 不代填）。
- 未审核的 remote 图片主机。
- 任意 MDX 原始 HTML。
- 把历史 run 未勾选项当 IN 需求自动开工。
- 无 ADR 的「临时」放宽 CSP。

---

## 22. 附录

### 15.1 关键命令速查

```bash
pnpm check:ops-readiness
pnpm check:ops-readiness -- --live
pnpm check:seo
pnpm check:docs
pnpm test
pnpm test:e2e
pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

### 15.2 关键源码锚点

| 主题         | 路径                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| CSP          | `src/proxy.ts`、`src/lib/csp.ts`                                         |
| 内容 facade  | `src/server/content`                                                     |
| 搜索         | `src/server/search/*`、`src/lib/search/*`、`src/app/api/search/route.ts` |
| JSON factory | `src/lib/json-content-repository.ts`                                     |
| 边界测试     | `src/lib/module-boundaries.test.ts`                                      |
| 站点配置     | `src/lib/site.ts`、`src/lib/content-dirs.ts`                             |

### 21.3 外部参考链接

- [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy)
- [CSP vs 静态页权衡](https://johnkavanagh.co.uk/articles/content-security-policy-in-nextjs/)
- [Astro vs Next 静态](https://eastondev.com/blog/en/posts/dev/20251202-astro-vs-nextjs-static-site/)
- [Astro vs Next LogRocket](https://blog.logrocket.com/astro-vs-next-js-ssg-vs-react/)
- [Fuse 性能](https://www.fusejs.io/performance.html)
- [静态站搜索综述](https://blog.openreplay.com/add-search-website-without-backend/)
- [Quartz 哲学](https://quartz.jzhao.xyz/philosophy)
- [Obsidian Publish 替代](https://www.ssp.sh/brain/open-source-obsidian-publish-alternatives/)
- [Josh Comeau 2024 建站](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/)
- [Lee Robinson stack](https://leerob.com/stack)
- [Nextra 4 发布](https://the-guild.dev/blog/nextra-4)
- [Pagefind](https://pagefind.app/docs/)
- [You May Not Need Algolia](https://danlevy.net/you-might-not-need-algolia/)
- [Contentlayer abandoned](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives)
- [Dub → Content Collections](https://dub.co/blog/content-collections)
- [Velite](https://velite.js.org/guide/introduction)
- [Tailwind Spotlight](https://tailwindcss.com/plus/templates/spotlight)
- [timlrx starter](https://github.com/timlrx/tailwind-nextjs-starter-blog)

### 21.4 仓库内已整合文档索引

| 文档                                                  | 本报告使用方式          |
| ----------------------------------------------------- | ----------------------- |
| `TODO.md`                                             | 待办 SSOT；工程关闭事实 |
| `docs/architecture.md`                                | 分层与渲染不变量        |
| `docs/handoff-to-agent.md`                            | 接手顺序与边界          |
| `docs/overview.md`                                    | 文档分层规则            |
| `docs/launch-baseline.md` / `performance-baseline.md` | 质量与性能证据          |
| `docs/ops-deferred-work-plan.md`                      | 运营剧本与禁止项        |
| `docs/full-stack-audit-2026-07-17.md`                 | 技术债来源              |
| `docs/optimization-roadmap-2026-07-06.md`             | 早期目标映射            |
| `docs/bem-search-architecture-2026-07-12.md`          | 搜索演进                |
| `docs/salesdex-inspired-redesign.md`                  | 首页叙事                |
| `docs/adr/*`                                          | 已接受决策              |
| `docs/superpowers/runs/2026-07-18-*`                  | 分层与运营实施证据      |

### 21.5 修订记录

| 日期       | 说明                                                             |
| ---------- | ---------------------------------------------------------------- |
| 2026-07-21 | 首版：整合现状、历史文档、同类调研、多方案对比、验收与表单决策点 |
| 2026-07-21 | 增补用户旅程、方案细案、度量、历史映射、剧本、Next 系样板调研    |

---

## 22. 完整验收矩阵（跨方案）

| ID    | 验收项          | 适用轨道    | 命令/证据                                               | 通过标准                  |
| ----- | --------------- | ----------- | ------------------------------------------------------- | ------------------------- |
| AC-01 | 类型与静态检查  | 任何代码    | `pnpm typecheck` `pnpm lint`                            | 退出 0                    |
| AC-02 | 单元/组件测试   | 任何代码    | `pnpm test`                                             | 退出 0，无 skip 关键路径  |
| AC-03 | E2E 关键流      | 路由/交互   | `pnpm test:e2e`                                         | 48 基线不无故删减         |
| AC-04 | SEO/内容完整性  | 内容/JSON   | `pnpm check:seo`                                        | 退出 0                    |
| AC-05 | 文档链接        | 文档        | `pnpm check:docs`                                       | 退出 0                    |
| AC-06 | 生产构建与 feed | 内容/配置   | `NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` | 成功且 feed 非 localhost  |
| AC-07 | Bundle 预算     | 依赖/打包   | `check-bundle-budget`                                   | 不超过预算                |
| AC-08 | 模块边界        | server 相关 | `module-boundaries` 测                                  | client/lib 不引 server    |
| AC-09 | CSP 不回退      | 安全相关    | 代码审 + 头检查                                         | 无 script `unsafe-inline` |
| AC-10 | 生产 smoke      | 部署后      | `check:production-content`                              | 核心 URL 200 且标志存在   |
| AC-11 | ops 状态诚实    | 运营        | `check:ops-readiness`                                   | 状态与真实一致            |
| AC-12 | 视觉/移动手测   | O-B         | 截图/Playwright mobile                                  | 无挡字/横滚               |
| AC-13 | 新文可发现      | O-A         | 列表/sitemap/RSS                                        | 三处可见                  |
| AC-14 | 文档同步        | 行为变更    | handoff/architecture                                    | 与源码一致                |

---

## 23. 决策树（打印版）

```text
是否出现生产正确性/安全事故？
  是 → 热修，走最小 diff + AC-01..10
  否 ↓

用户是否授权运营账号？
  是 → O-D 剧本（GSC→Bing→p75）
  否 ↓

内容是否明显不足（<1 月无更新且作品无叙事）？
  是 → 优先 O-A
  否 ↓

是否有可复现的阅读/移动痛点？
  是 → O-B
  否 ↓

是否仅文档/工具噪音？
  是 → O-C
  否 → 保持观察，跑 ops-readiness 与生产 smoke 即可

任何时候：
  文量≥200 或搜索 p95 恶化 → 打开搜索 ADR（S-B 等）
  需要项目长文 → C-C
  需要外部数据缓存语义 → K-B ADR
  有人提议换栈 → 先 POC + ROI，默认拒绝
```

---

## 24. 结语

西江月博客当前最大的风险**不是架构落后**，而是在工程化已经过线之后：

1. 用「换栈/上平台」消耗本该用于**内容与体验**的注意力；或
2. 用「无门槛重构」破坏已验证的安全与门禁资产；或
3. 把**账号运营**与**工程完成度**混为一谈。

同类项目（Astro 极致静态、Hugo 海量构建、Quartz 数字花园、Nextra 文档站、Josh/Lee 式 Next MDX）共同证明：

- **solo 技术博客的收敛解**是本地内容 + 薄而硬的发布门闩 + 可读视觉；
- 本站在门闩与安全上已**位于上沿**；
- 下一单位努力的边际收益，在 **O-A 内容** 与 **O-B 体验**，不在第二套后端。

最佳路径是：**锁住已验证架构（P-A/R-A/S-A/V-A/B-A）→ 用门槛管理规模化债务 → 把下一份努力投给读者能感知的内容与细节。**

用户已完成交互表单；决议见文首。下一执行规格见 **§25 数字花园增量路径** 与 **§26 混合轨道 30 日执行包**。

---

## 25. 数字花园增量路径（用户已选 · 不换栈）

### 25.1 目标重述

在 **锁定 Next + nonce CSP + Fuse API** 的前提下，让文章之间具备：

1. **显式双向链接**（写作时用 wikilink 或等价语法）；
2. **反链面板**（「哪些文章提到了本文」）；
3. **可选轻量关系图**（专题/标签子图，而非全站力导向大盘默认展开）。

这是 **出版型博客 + 花园能力**，不是把全站改成 Obsidian Publish / Quartz 克隆。

### 25.2 三阶段方案对比

| 阶段              | 方案                                                                   | 工作量 | 风险 | 验收                     |
| ----------------- | ---------------------------------------------------------------------- | ------ | ---- | ------------------------ |
| **G0 语法与解析** | MDX/remark 支持 `[[slug]]` 或 `[[slug\|title]]` → 内链；坏链构建期警告 | M      | 中   | 单测 + 一篇样例文        |
| **G1 反链索引**   | 构建/缓存期扫描全站链接图 → `Backlinks` 组件挂文章页                   | M      | 中   | 反链正确；无 client 读盘 |
| **G2 图谱 UI**    | 专题或标签子图 SVG/Canvas；尊重 `prefers-reduced-motion`；CSP 无 eval  | L      | 中高 | E2E + 无 CSP 违规        |

**明确不做（本阶段）**：

- 迁 Quartz / 整站 SPA；
- 默认全站力导向图占首屏；
- 为图谱引入重型 D3 全家桶（优先轻量自绘或极小依赖）；
- 改变搜索为 Meili/Algolia。

### 25.3 与混合轨道的资源分配

```text
70% 内容：新文优先「可被链接」的概念笔记 + 既有工程文互链
20% 体验：反链区排版、移动端图谱降级为列表、CLS
10% 卫生：AGENTS 补花园术语；链接检查覆盖 wikilink
```

### 25.4 最佳落地顺序（为何不是一次做完）

1. **先 G0**：没有稳定链接语法，图谱是空壳。
2. **再 G1**：反链是花园 80% 价值，图谱是 20% 展示。
3. **最后 G2**：有真实边密度后再画图，避免「六个点的玩具图」。

### 25.5 输入 / 输出 / 验收（花园）

|      | 规格                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 输入 | MDX 内 `[[target]]`；target = 去日期 slug 或稳定 id                                    |
| 处理 | remark 插件 → 校验目标存在 → 构建 link graph 缓存                                      |
| 输出 | 正文内链、文章页反链列表、可选 `/graph` 或内嵌子图                                     |
| 验收 | 坏链 CI 失败或 warning 策略二选一（建议生产 fail）；反链与正文一致；nonce CSP 无新违规 |

### 25.6 与 Quartz 对照（借什么、不借什么）

| Quartz       | 借                 | 不借                             |
| ------------ | ------------------ | -------------------------------- |
| wikilink     | 语法体验           | vault 目录约定                   |
| contentIndex | 链接图数据结构思路 | FlexSearch 替换 Fuse（未到门槛） |
| 图谱         | 子图交互模式       | 默认全站 SPA                     |
| callout      | 可选 MDX 组件      | 整套主题                         |

---

## 26. 混合轨道 30 日执行包（按决议）

> 非强制日历；按你写作节奏可伸缩。未授权不 push/deploy。

### 第 1 周 · 定语法 + 卫生 10%

- [ ] 选定 wikilink 语法与 slug 规则；写 1 页 `docs/specs/` 短设计（或直接 ADR 草稿）。
- [ ] 同步：本决议已在调研报告；可选一行写入 `TODO.md`「数字花园 G0–G2（用户 2026-07-21 选定）」。
- [ ] AGENTS/architecture 搜索描述若仍写 client-only，在卫生窗口修正（不改运行时行为则仅文档）。

### 第 2–3 周 · 内容 70% + G0/G1

- [ ] 新增或改写 ≥2 篇「可链概念」文（或给旧文补 `[[ ]]`）。
- [ ] 落地 G0 解析 + 坏链策略。
- [ ] 落地 G1 反链组件（桌面/移动可读）。
- [ ] `check:seo` + `test` + 受影响 e2e。

### 第 4 周 · 体验 20% + 可选 G2 原型

- [ ] 反链区与 TOC/阅读设置的空间关系打磨。
- [ ] 若边数 ≥ 阈值（建议 ≥15 条有向边），再做 G2 子图原型。
- [ ] 暗色 + 390 宽回归。

### 完成定义（混合包）

1. 文首决议与实现一致：仍 Next + nonce + Fuse。
2. 至少一条真实双向链接路径可演示。
3. 反链在文章页可见且数据来自服务端索引。
4. 运营项仍为 skipped/pending，无假完成。
5. 门禁：AC-01–AC-09 按变更类型满足；部署另授权。

---

## 27. 决议后的「下一步你可直接说」

| 你说               | Agent 做什么                            |
| ------------------ | --------------------------------------- |
| `开始 G0`          | 出 wikilink 设计 + 最小 remark/测试实现 |
| `先写两篇互链文`   | 只动 content，链到现有 slug             |
| `同步 TODO`        | 在 TODO 增加花园条件项，不复活旧 P0–P10 |
| `做体验 B1`        | CLS/字体专项，与花园并行小心 CSS 冲突   |
| `暂停花园，只写文` | 花园降为 backlog，专攻 O-A1             |

---

**Sources（本报告调研）**:  
[Next CSP](https://nextjs.org/docs/app/guides/content-security-policy) · [Josh 2024](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/) · [Lee stack](https://leerob.com/stack) · [Nextra 4](https://the-guild.dev/blog/nextra-4) · [Pagefind](https://pagefind.app/docs/) · [Quartz Search](https://quartz.jzhao.xyz/features/full-text-search) · [Astro Collections](https://docs.astro.build/en/guides/content-collections/) · [Hugo Security](https://gohugo.io/about/security-model/)

---

## 28. 进度再扫描（2026-07-21 第二轮）

| 项        | 状态                                    | 说明                                                             |
| --------- | --------------------------------------- | ---------------------------------------------------------------- |
| 生产 HEAD | `dfc057b` = origin/master               | 视觉/身份已上线                                                  |
| 工作树    | `docs/overview.md` 已改；本报告未提交   | 文档增量，未改运行时                                             |
| TODO      | 工程无条件项仍关闭                      | 花园尚未写入 TODO（决议后可选）                                  |
| 花园代码  | **G0+G1 已实现（2026-07-21）**          | wikilink remark + link-graph cache + ArticleBacklinks；G2 仍延后 |
| 文章页    | TOC、系列、**反链**、相关、Giscus       | 反链紧接系列路径之后                                             |
| 用户决议  | 混合轨道 + 花园 + nonce 锁定 + 跳过运营 | 见文首                                                           |

**本轮报告升级焦点**：用户体验升级、视觉风格、**方案评分矩阵**、可 ship 问题清单。

> **实现注记（2026-07-21）**：G0（`[[slug]]` / `[[slug|label]]` + remark）与 G1（`getBacklinks` + fail-closed 构图 + 文章页反链面板）已在本仓落地；G2 图谱 UI 明确不做本轮。外部 ops（GSC/Bing/RUM）状态不变。

---

## 29. 用户体验升级（问题 · 多方案 · 评分）

评分维度（每维 1–10，加权总分 100）：

| 维度       | 权重 | 含义                         |
| ---------- | ---- | ---------------------------- |
| 读者价值   | 25   | 是否更快找到/读完/链到下一篇 |
| 实现成本   | 20   | 人日与回归面（越高=越省）    |
| 与约束匹配 | 20   | nonce/CSP/本地内容/不换栈    |
| 可维护     | 15   | Agent/测试可守               |
| 风险       | 10   | 回归与复杂度（越高=越安全）  |
| 品牌一致   | 10   | Paper Gallery / 出版+花园    |

### 29.1 UX-1 站内发现：如何从「一篇」到「一片」

| 方案        | 描述                                      | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | **加权** |
| ----------- | ----------------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | -------- |
| **UX-1A ★** | **G0 wikilink + G1 反链**（决议花园核心） | 9    | 7    | 10   | 8    | 8    | 9    | **85.5** |
| UX-1B       | 仅加强 related/tags/系列算法              | 6    | 8    | 10   | 9    | 9    | 7    | 78.5     |
| UX-1C       | 全站图谱首页入口（Quartz 味）             | 7    | 4    | 7    | 5    | 5    | 6    | 58.5     |
| UX-1D       | Algolia 推荐                              | 5    | 3    | 4    | 4    | 4    | 5    | 42.5     |

**最佳 UX-1A**：与用户「数字花园」决议一致；反链是花园 80% 价值；不破坏 CSP；数据仍本地。UX-1B 可作补充但不足以称为花园。UX-1C 过早、首屏重。

### 29.2 UX-2 移动阅读完成率

| 方案        | 描述                                                  | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | **加权** |
| ----------- | ----------------------------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | -------- |
| **UX-2A ★** | **现有 mobile TOC + 反链折叠列表 + 阅读设置不挡正文** | 8    | 8    | 10   | 8    | 8    | 8    | **83.0** |
| UX-2B       | 重做文章布局（双栏改单栏实验）                        | 7    | 4    | 9    | 6    | 5    | 7    | 63.5     |
| UX-2C       | 忽略移动，只做桌面图谱                                | 3    | 9    | 10   | 9    | 9    | 5    | 70.0*    |

\*UX-2C 加权虽被「成本/风险」抬高，但**读者价值过低**，一票否决。

**最佳 UX-2A**：在已有 mobile TOC 上增量，不推翻 article-layout。

### 29.3 UX-3 搜索与空状态

| 方案                                 | 加权   | 结论                    |
| ------------------------------------ | ------ | ----------------------- |
| **UX-3A 保持 Fuse API + 空状态导流** | **84** | 最佳；14 文             |
| UX-3B Pagefind                       | 62     | 门槛未到；WASM/CSP 成本 |
| UX-3C 回退客户端全量索引             | 40     | 反模式                  |

### 29.4 UX-4 作品集叙事

| 方案                                | 加权   | 结论                 |
| ----------------------------------- | ------ | -------------------- |
| UX-4A 继续 JSON 卡片 + 真图         | 78     | 现状可接受           |
| **UX-4B JSON 索引 + 可选 MDX 复盘** | **82** | 中期最佳；非本轮必须 |
| UX-4C 迁 CMS 作品库                 | 35     | 拒绝                 |

### 29.5 UX 升级优先级清单（可执行）

| ID  | 项                         | 轨道占比  | 本轮可 ship？        |
| --- | -------------------------- | --------- | -------------------- |
| U1  | wikilink → 内链            | 内容/花园 | 是（G0）             |
| U2  | 反链面板                   | 花园      | 是（G1）             |
| U3  | 2–3 篇互链样例文或旧文补链 | 内容 70%  | 是                   |
| U4  | 反链区移动折叠 + 样式      | 体验 20%  | 是（随 G1）          |
| U5  | 搜索空状态导流             | 体验      | 可选                 |
| U6  | 404 导流                   | 体验      | 可选                 |
| U7  | 动画岛减负                 | 体验      | 可选                 |
| U8  | 轻量子图 G2                | 花园后期  | **否**（边密度不足） |
| U9  | 项目 MDX 复盘管道          | 内容增强  | 可选/下轮            |

---

## 30. 视觉风格（问题 · 多方案 · 评分）

### 30.1 现状视觉语言（保留）

- Paper Gallery：低饱和纸感、鼠尾草 brand、暖金 featured 点缀
- 展示衬线（Hero 英文）+ Noto Sans SC 正文 + JetBrains Mono 代码
- BEM 结构 + shadcn 交互 primitive；禁止第三套 `.btn`
- 三层背景：伪元素 + Stage + Parallax

### 30.2 视觉方向方案

| 方案       | 描述                                   | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | **加权** |
| ---------- | -------------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | -------- |
| **V-S1 ★** | **纸感守恒 + 花园组件融入 article-ui** | 8    | 9    | 10   | 9    | 9    | 10   | **90.5** |
| V-S2       | 数字花园深色笔记风（Quartz 默认感）    | 6    | 5    | 8    | 6    | 5    | 4    | 58.5     |
| V-S3       | 全站 Spotlight 级营销重构              | 7    | 3    | 7    | 4    | 3    | 6    | 52.0     |
| V-S4       | 纯 utility 抹掉 BEM                    | 5    | 2    | 6    | 3    | 2    | 3    | 37.5     |

**最佳 V-S1**：花园 UI 必须看起来像「文章的一部分」，用 `--surface` / 细线 / MetaBadge，而不是突然出现霓虹图谱。

### 30.3 花园组件视觉规范（落地约束）

| 元素            | 规范                                                                                 |
| --------------- | ------------------------------------------------------------------------------------ |
| 正文 wikilink   | 沿用 prose `a` 色；可加虚线下划线区分外链（可选）                                    |
| 反链面板        | `article-ui` 区块：标题「反向链接」+ 列表标题/日期；空态一句「暂无其他文章链到此处」 |
| 坏链            | 构建/测试失败或 dev 警告；**不**在生产渲染红色死链惊吓读者（fail closed 在 CI）      |
| 图谱（未来 G2） | 次级页或折叠；默认不抢 LCP；`prefers-reduced-motion` 静态列表降级                    |
| 暗色            | 仅 token；禁止硬编码灰阶                                                             |

### 30.4 体验×视觉联合验收

1. 反链区在 390 宽不与 ReadingPreferences/BackToTop 永久重叠。
2. 明暗主题切换后链接对比度仍可读。
3. 无新增 client 瀑布动画。
4. Lighthouse 桌面门禁不回归（CI）。

---

## 31. 架构方案总评分表（整合 §8 + 决议）

| 决策域   | 方案                    | 加权分 | 地位     |
| -------- | ----------------------- | ------ | -------- |
| 平台     | P-A 锁 Next             | **92** | ★ 已选   |
| 平台     | P-B 迁 Astro            | 48     | 否       |
| 渲染     | R-A nonce               | **88** | ★ 已选   |
| 渲染     | R-B unsafe-inline SSG   | 30     | 禁       |
| 搜索     | S-A Fuse API            | **90** | ★ 已选   |
| 搜索     | S-B Pagefind            | 60     | 门槛后   |
| 内容     | C-A MDX+JSON + 花园增量 | **91** | ★ 已选   |
| 内容     | C-D CMS                 | 28     | 否       |
| CSS      | V-A BEM+shadcn          | **89** | ★        |
| 边界     | B-A src/server          | **93** | ★ 已上线 |
| 花园深度 | G0+G1 先                | **86** | ★ 本轮   |
| 花园深度 | G0+G1+G2 一次做完       | 55     | 否       |
| 花园深度 | 迁 Quartz               | 40     | 否       |

**为何最佳组合仍成立**：最高分方案全部落在「锁架构 + 增量花园 + 纸感守恒」；任何换栈/CMS/全量图谱都在 55 分以下。

---

## 32. 目标 · 约束 · 输入 · 输出 · 验收（花园+混合轨道精炼）

### 32.1 目标

| ID  | 目标            | 度量                        |
| --- | --------------- | --------------------------- |
| T1  | 文章可双向导航  | ≥1 对真实互链 + 反链可见    |
| T2  | 不破坏安全/分层 | AC-08/09；边界测试绿        |
| T3  | 体验不倒退      | 相关 e2e + 移动可点反链     |
| T4  | 文档与决议一致  | 报告文首 + 可选 TODO 条件项 |
| T5  | 运营仍可跳过    | 不改 GSC 状态为假完成       |

### 32.2 约束

- Next 16 / React 19 / 本地 MDX / nonce CSP / 无 `unsafe-inline` script
- client 不读 fs、不引 `@/server`
- 不引入搜索集群、不迁 Quartz
- 不自动 push/deploy（除非另授权）
- G2 图谱本轮不做除非边数门槛满足

### 32.3 输入

| 输入      | 来源                                 |
| --------- | ------------------------------------ |
| MDX 正文  | `content/blog/*.mdx` 可含 `[[slug]]` |
| slug 集合 | post repository                      |
| 设计决议  | 本文文首 + §25–32                    |

### 32.4 输出

| 输出      | 形态                      |
| --------- | ------------------------- |
| 内链 HTML | `<a href="/blog/{slug}">` |
| 链接图    | 服务端可查询结构（缓存）  |
| 反链 UI   | 文章页组件                |
| 测试      | unit + 页面/组件测        |
| 文档      | spec 或 architecture 短节 |

### 32.5 验收标准（本轮 ship 级）

1. `[[existing-slug]]` 渲染为正确站内链接。
2. 不存在的 slug：测试或 check 可失败（策略在 spec 写死）。
3. 文章 A 链到 B 时，B 页反链列表含 A。
4. `pnpm test` 相关用例通过；`typecheck`/`lint` 通过。
5. 无新 CSP 违规点；无新远程脚本。
6. 视觉符合 §30.3。
7. 不修改运营完成态。

---

## 33. 细节打磨参考（UX + 视觉联合清单）

### 33.1 交互

- [ ] wikilink 支持 `[[slug]]` 与 `[[slug|显示名]]`
- [ ] 同源 slug 与 `filenameToSlug` 规则一致
- [ ] 反链按日期倒序；最多展示 N 条 +「还有 k 条」可选
- [ ] 空反链不占巨大空白
- [ ] 键盘可 tab 到反链

### 33.2 视觉

- [ ] 反链标题层级 = 文章次级区块（非 Hero）
- [ ] 与 `ArticleRelated` 视觉兄弟化，避免两套卡片语言
- [ ] 暗色边框用 `--border`
- [ ] 移动 TOC 展开时反链仍可滚动触及

### 33.3 工程

- [ ] 链接图构建走 cache，测试 `resetAllCaches`
- [ ] 导出纯函数便于单测（解析 / 建图 / 查反链）
- [ ] server/content 暴露 `getBacklinks(slug)`
- [ ] module-boundaries 仍绿

### 33.4 内容

- [ ] 至少 2 篇文章形成互链示范
- [ ] 优先链「概念」而非硬塞
- [ ] frontmatter 不必为花园新增必填字段（零 schema 破裂优先）

---

## 34. 本轮 Ship 问题清单（供表单勾选）

| #   | 问题/工作包                                    | 对应最佳方案      | 依赖        |
| --- | ---------------------------------------------- | ----------------- | ----------- |
| Q1  | 实现 G0 wikilink remark 插件 + 测试            | UX-1A / G0        | —           |
| Q2  | 实现 G1 链接图 + 反链组件 + 样式               | UX-1A / G1 / V-S1 | Q1          |
| Q3  | 样例内容互链（改现有 MDX）                     | O-A 70%           | Q1          |
| Q4  | 文档：TODO 条件项 + architecture 短节 + 本报告 | O-C 10%           | Q1–2        |
| Q5  | 搜索空状态 / 404 导流                          | UX 可选           | 独立        |
| Q6  | 字体/CLS 微调                                  | UX-2 可选         | 独立        |
| Q7  | G2 图谱                                        | 低分暂缓          | Q2 + 边密度 |
| Q8  | 换栈/Pagefind/CMS                              | 低分              | **不做**    |

**推荐本轮 ship 包**：**Q1+Q2+Q3+Q4**（完整花园最小闭环 + 文档）。  
**加分可选**：Q5 或 Q6 择一。  
**禁止**：Q7 强行、Q8。

---

## 35. 修订记录（续）

| 日期       | 说明                                                           |
| ---------- | -------------------------------------------------------------- |
| 2026-07-21 | §28–35：第二轮进度扫描、UX/视觉评分、架构总评分、ship 问题清单 |
