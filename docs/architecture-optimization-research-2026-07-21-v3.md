# 西江月博客 · 架构优化整合调研报告 v3

> **状态**：决策与规格 SSOT 第四轮补充稿（2026-07-21 晚 · **v3**）
> **路径**：`D:\blog` · 生产：`https://incca.ccwu.cc`
> **本地 tip / origin / 生产**：**`ef77986`**（三处一致，工作树 clean，无 ahead/behind）
> **相对 v2**：`architecture-optimization-research-2026-07-21-v2.md` 仍保留为第三轮决议与评分史；**本 v3 以「v2 表单已全部落地、生产已同步」为起点**，重新评估下一阶段最佳可执行路径，不改写 v1/v2 历史数字。
> **待办 SSOT**：根 `TODO.md` · 接手：`docs/handoff-to-agent.md` · 架构：`docs/architecture.md` · 收工：`docs/handoff-2026-07-21-garden.md`

## 文首决议继承（不可推翻，除非用户新表单改写）

| 决策      | 选择                                     | 含义                                 | v3 态                |
| --------- | ---------------------------------------- | ------------------------------------ | -------------------- |
| 主轨道    | **混合：内容 70% + 体验 20% + 卫生 10%** | 剧本 S5；禁止并行换栈                | 维持                 |
| 平台/渲染 | **锁 Next + nonce CSP**                  | P-A + R-A；禁 `unsafe-inline` 换 SSG | 维持；SRI 列为评估项 |
| 内容形态  | **Next 内数字花园增量**                  | 不迁 Quartz；G0→G1→G2 已交付         | **升级为 G3 评估**   |
| 运营      | **继续跳过**                             | GSC/Bing/RUM 不假完成                | 维持                 |
| 交付边界  | **本地 commit；push 另授权**             | v3 起点：v2 已 push，生产同步        | **重置为「未授权」** |

## v3 新增结论（一句话）

v2 §51 表单决议的 R2 + Q11/Q12/Q13/Q14/Q15/Q16 全部已实施并 push 上线，G2 从「折叠原型」演进为带拖拽 + localStorage 视图的完整 `/garden` 路由，测试数从 600+ 涨到 672/90；**下一阶段的正确问题不再是「要不要做 G2」，而是「在 G2 已稳定的前提下，是否把预算投到 G3 popover preview、Next 16.2 新特性接入、还是把 nonce 迁移到 SRI 解锁 SSG/CDN/PPR」**。本 v3 给出三选一的加权评分与执行规格，并把 v2 残留的卫生债（launch-baseline / handoff / README 数字漂移）单独成包。

---

## 0. 执行摘要

### 0.1 产品定位（未变）

西江月 = **可复用工程笔记 + 可信作品集 + 策展导航 + 轻量数字花园**，安静、可读、可验证、可接手。形态上已从纯「出版型博客」叠加到「花园完整闭环」阶段：wikilink（G0）+ 反链（G1）+ 力导向图谱与拖拽（G2）+ 文内邻接（ArticleNeighbors）全部上线。产品定位仍未改变——这是个人品牌工程站，不是 Obsidian vault 发布器，也不是 Quartz 第二大脑仪表盘。

### 0.2 进度快照（2026-07-21 第四轮实测）

| 项            | 值                                                 | 证据                                                      |
| ------------- | -------------------------------------------------- | --------------------------------------------------------- |
| 生产域名      | `https://incca.ccwu.cc`                            | launch-baseline / live                                    |
| origin HEAD   | **`ef77986`**                                      | git remote -v + git log                                   |
| 本地 master   | **`ef77986` · ahead 0 · behind 0 · clean**         | git status                                                |
| 花园功能      | G0+G1+G2 **已合入并部署**                          | wikilink + link-graph + ArticleBacklinks + GardenExplorer |
| G2 完整度     | 力导向 + 拖拽 + localStorage 视图 + reduced-motion | `src/components/blog/GardenExplorer.tsx`                  |
| 反链折叠      | `<details>` 「还有 k 条」                          | `ArticleBacklinks.tsx` `BACKLINKS_PREVIEW_LIMIT = 5`      |
| 文内邻接      | `ArticleNeighbors` outbound+inbound                | `src/app/blog/[slug]/page.tsx` L83-86                     |
| 404 导流      | 6 出口（首页/博客/作品/标签/搜索/收藏）            | `src/app/not-found.tsx`                                   |
| 搜索空态      | 5 出口（全部/标签/专题/花园/作品）                 | `SearchResultsList.tsx`                                   |
| 边密度        | ~47 条 wikilink（v2 数值；内容未新增）             | link-graph 实测                                           |
| 内容规模      | **14** 文 · **6** 项目 · **10** 类 **123** 链      | content/ + data/                                          |
| 栈            | Next **16.2.9** · React **19.2.4** · Fuse **7.4**  | package.json                                              |
| 单元/集成测试 | **672 用例 / 90 文件**（v2 时 600+/81）            | `pnpm test` 实测                                          |
| E2E 测试      | 48 用例 / 5 文件                                   | `pnpm test:e2e` 计数                                      |
| TypeScript    | strict · 0 error                                   | `pnpm typecheck` 实测                                     |
| 质量门禁      | format/lint/test/tsc/check:seo/blur/build/budget   | CI ci.yml                                                 |
| 渲染          | 动态 HTML + **CSP nonce**                          | ADR 2026-07-17                                            |
| 工程 TODO     | 仅外部账号 + 条件触发 + **G3 候选**                | TODO.md                                                   |
| 本机 dev 注意 | :3000 常被 NewAPI 占用；冒烟用 :3001               | 实机                                                      |

### 0.3 v2 表单决议落地核对（v3 强制证据）

| v2 §51 决议        | 落地 commit                                                                                        | v3 验证                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| R2 主包            | `1e8326d feat(garden): v2 ship body links, UX exits, backlinks cap, /garden`                       | ✅ 已 push；生产含 /garden                                                                |
| Q10 正文概念链     | `1e8326d` + `7202172 content(garden): convert further-reading links to wikilinks`                  | ✅ 47 条 wikilink 实测                                                                    |
| Q11 404 导流       | `1e8326d`                                                                                          | ✅ not-found.tsx 6 出口                                                                   |
| Q12 反链上限+还有k | `1e8326d`                                                                                          | ✅ ArticleBacklinks `<details>`                                                           |
| Q13 搜索空态增强   | `1e8326d`                                                                                          | ✅ SearchResultsList 5 出口                                                               |
| Q14 CLS/字体       | `1e8326d`（next/font 已有；微调证据见 layout.tsx）                                                 | ✅ next/font/google 使用                                                                  |
| Q15 AGENTS 卫生    | AGENTS.md 已写 `fuse.js via production GET /api/search (server Fuse + projected DTO)`              | ✅ 已修正                                                                                 |
| Q16 G2 折叠原型    | `a346f63 feat(garden): force layout, filters, article neighbor fold` → `864abdd` 拖拽+localStorage | ✅ 已**升级为完整 /garden 路由**（超出 v2 默认预期，但符合用户「折叠/次级原型」选项边界） |
| Q18 push           | `98568b6` → `ef77986`（CI success · deploy success · production-content passed）                   | ✅ 已 push，生产同步                                                                      |

**关键判断**：v2 §51 的「不 push」选项在表单提交后被用户以实际行为推翻（连续两次 push + 部署），因此 v3 不再以「ahead 5 / 生产滞后」为前提，而是以「生产同步、G2 已上线」为起点重写决策。

### 0.4 核心结论（v3）

1. **仍然不换栈**（Astro / Hugo / Quartz / Nextra 全量迁移 ROI 为负；沉没成本已含 672 测、纸感、nonce CSP、Giscus、G0/G1/G2）。
2. **仍然不上 CMS / Meili / Algolia / Orama / Typesense**（14 文；门槛未到；Orama schema 开销 > 收益）。
3. **G0/G1/G2 验收可关闭为「已交付并生产」**；ArticleBacklinks 折叠、ArticleNeighbors 文内邻接、GardenExplorer 力导向全部上线。
4. **新评估项 A：Next 16.2 SRI（experimental）**——这是 Phase B 调研最重要的发现。SRI 让「严格 CSP + SSG + CDN 缓存 + PPR」共存，理论上能解锁本站因 nonce 放弃的全部静态红利。**但 SRI 仍 experimental，且与「不放宽安全基线」硬边界存在解释张力**（SRI 是否算「放宽」需用户表单确认）。
5. **新评估项 B：Next 16.2 React Compiler + Turbopack FS cache + `<Link transitionTypes>`**——零风险高收益，对 G2 力导向拖拽 re-render 优化直接生效。
6. **新评估项 C：G3 Popover Preview**——抄 Quartz `popover-hint` 思路，用 Next 16 RSC 实现。这是数字花园的核心体验升级，与已交付的 G1/G2 形成产品闭环。
7. **新评估项 D：卫生债清理**——launch-baseline 仍写 `a91a07d`，handoff 写 `98568b6`，README 写「599 用例 / 77 文件」，TODO 写「归档 HEAD 61ffd47」，**全部已过时**；与代码事实漂移是真实回归风险。
8. **运营仍跳过**：GSC/Bing/RUM 仍 `blocked_auth`；用户未授权前不假完成。

### 0.5 推荐默认组合（若用户不改偏好）

| 决策点         | 推荐                                              | 加权直觉 | 风险   |
| -------------- | ------------------------------------------------- | -------- | ------ |
| 平台           | P-A 锁 Next                                       | 92       | -      |
| 渲染/安全      | R-A nonce 维持 / **R-E SRI 评估**（v3 新）        | 88 / 82  | 中     |
| 搜索           | S-A Fuse API                                      | 90       | -      |
| 视觉           | V-S1 纸感守恒                                     | 90.5     | -      |
| 花园深度       | **GD-1 维护 G0/G1/G2 + G3 popover 评估**          | 87 / 80  | 中     |
| Next 16.2 接入 | **N16-A 选开 React Compiler + FS cache**（v3 新） | 85       | 低     |
| 卫生           | **H-A 全量更新 launch-baseline/handoff/README**   | 92       | 低     |
| 下一主包       | **H-A + N16-A + 内容 70%（G3 评估）**             | 见 §14   | 见 §14 |

---

## 1. 调研范围与方法

### 1.1 问题陈述（第四轮）

在 **G0/G1/G2 已上线、生产同步、v2 表单已全部落地** 的稳态下：

1. 下一阶段是把预算投到 **G3 popover preview**（产品体验）、**Next 16.2 新特性**（工程红利）、**SRI 迁移**（架构解锁）、还是 **卫生债清理**（文档同构）？
2. SRI 是否违反「不放宽安全基线」硬边界？若不违反，迁移路径与代价是什么？
3. React Compiler 对 G2 力导向拖拽场景的实际收益如何评估？是否值得开 experimental？
4. G3 popover preview 在 Next 16 RSC 下的最佳实现路径是什么？与 Quartz fetch-HTML 方案对比有何优势？
5. 在 14 文规模下，「内容 70%」是否仍应继续推进正文概念链，还是转向新文写作？

### 1.2 输入材料

| 类别         | 路径                                                                                                        | 角色                           |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------ |
| v1 报告      | `architecture-optimization-research-2026-07-21.md`                                                          | 第一/二轮决议与 §28–35 评分史  |
| v2 报告      | `architecture-optimization-research-2026-07-21-v2.md`                                                       | 第三轮决议与 Q10–Q20 ship 清单 |
| 维护文档     | TODO / overview / architecture / handoff / API / css-conventions / launch-baseline / ops                    | 操作真值                       |
| ADR          | `2026-07-17-csp-nonce-over-ssg` · `0002-local-content-repository-factory`                                   | 已接受决策                     |
| 花园交接     | `handoff-2026-07-21-garden.md` · 记忆 `blog-handoff-2026-07-21`                                             | v2 后 push 真相                |
| 代码事实     | `GardenExplorer.tsx` · `ArticleBacklinks.tsx` · `not-found.tsx` · `SearchResultsList.tsx` · `link-graph.ts` | v2 落地真值                    |
| 实测命令     | `git status` · `pnpm test` · `pnpm typecheck` · `git log -n 12`                                             | v3 进度真值                    |
| Phase B 外搜 | Next 16/16.2 blog · Next CSP docs (v16.2.10) · Quartz 5 · Orama v3.2 · Pagefind · remark-wiki-link          | 2026-07-21 当日                |

### 1.3 方法

1. **仓库事实优先**：所有数字来自当日的 `git`/`pnpm test`/`pnpm typecheck` 实测。
2. **文档分层**：v1/v2 报告为历史快照；维护文档为操作真值；本 v3 为决策增量。
3. **每决策点 ≥3 方案**，加权评分（读者价值 25 · 成本 20 · 约束 20 · 维护 15 · 风险 10 · 品牌 10）。
4. **门槛驱动**：未到门槛 = 正确终态，不强行升级。
5. **冲突显式化**：SRI 与「不放宽安全基线」的解释张力；G3 popover 与移动端 hover 缺失的张力。

### 1.4 非目标

- 不复活已归档 P0–P10。
- 不在报告阶段擅自 push/deploy。
- 不把 v1/v2 历史数字改写成「仿佛一直如此」。
- 不假完成 GSC/RUM。
- 不为了开 SRI 而偷偷放宽 style-src 或引入未审核 CDN。

---

## 2. 项目现状深度扫描（v3 落地后）

### 2.1 产品能力地图（v3 刷新）

| 能力                | 状态             | 要点                                                                         |
| ------------------- | ---------------- | ---------------------------------------------------------------------------- |
| 博客 MDX            | 上线             | Zod frontmatter · draft 过滤 · series                                        |
| Wikilink G0         | **已交付**       | `[[slug]]` / `[[slug\|label]]` → `/blog/{slug}` · 代码区不解析               |
| 反链 G1             | **已交付**       | link-graph 缓存 · fail-closed 坏链 · ArticleBacklinks · **`<details>` 折叠** |
| G2 图谱 UI          | **已交付**       | `/garden` 路由 · 力导向 · 拖拽 · localStorage 视图 · reduced-motion 列表降级 |
| 文内邻接            | **已交付**       | `ArticleNeighbors` outbound+inbound，紧贴 ArticleSeriesPath                  |
| 404 导流            | **已交付**       | 6 出口按钮                                                                   |
| 搜索空态导流        | **已交付**       | 5 出口链接                                                                   |
| 专题/标签/分类      | 上线             | series · tags · category 推断                                                |
| 作品集              | 上线             | 6 项目 · 真截图 · blur                                                       |
| 收藏导航            | 上线             | 10 类 123 链                                                                 |
| 搜索                | 上线             | `GET /api/search` Fuse · 投影 DTO · 限流                                     |
| 评论                | 上线             | Giscus + CSP                                                                 |
| SEO 工程            | 完成             | sitemap/robots/JSON-LD/OG/RSS；账号侧 pending                                |
| 安全                | 上线             | nonce CSP · 无 remotePatterns · HSTS                                         |
| 纸感视觉            | 上线             | Paper Gallery · tokens 双主题 · article-ui 反链样式                          |
| **G3 popover**      | **未做（候选）** | 无 hover preview / hover card                                                |
| **G4 graph filter** | **部分**         | 有 series/tag filter；无入度阈值、hover 高亮邻居                             |
| **SRI 迁移**        | **未做（评估）** | 仍 nonce CSP                                                                 |
| **React Compiler**  | **未做（评估）** | 未开 experimental                                                            |

### 2.2 文章页信息架构（v3 源码顺序）

```text
ArticleJsonLd → ReadingProgress → ReadingPreferences
→ ArticleHeader → TOC(mobile) → MdxContent
→ ArticleSeriesPath → ArticleNeighbors → ArticleBacklinks → Giscus
→ ArticleRelated → ArticleNav
→ aside TOC(desktop)
```

**v3 含义**：`ArticleNeighbors` 已插入到 `ArticleSeriesPath` 与 `ArticleBacklinks` 之间，文内邻接成为一等公民。G3 popover 若出现，应作用于 `MdxContent` 内的 `<a>` 节点，**禁止**插到 LCP 关键路径前。

### 2.3 首页叙事（未变）

```text
EditorialHero → Manifesto → ReadingPath → FeaturedArticleRail
→ CuratedLinksPreview → Projects（条件）→ HomeCta
```

### 2.4 分层与数据流（含 G2）

```text
content/blog/*.mdx
  → parse + Zod + repository (filenameToSlug)
  → extractWikilinks / remarkWikilink → HTML 内链
  → link-graph createCache → reverse index + edges + neighbors
  → server/content.{getBacklinks,getGardenGraph,getNeighbors}
  → ArticleBacklinks / GardenExplorer / ArticleNeighbors

components ─HTTP─► /api/search ─► server/search ─► Fuse
禁止 client/lib 反向 import @/server
```

### 2.5 G2 GardenExplorer 实现要点（v3 实测）

```text
GardenExplorer（client component）
  ├ filterGardenGraph（series/tag 筛选）
  ├ layoutForceGraph（自研力导向，140 迭代）
  ├ Pointer Events 拖拽（pointer capture + 5px 阈值区分点击/拖拽）
  ├ localStorage 视图保存/恢复（garden-view-storage.ts）
  ├ reduced-motion → 仅边列表
  └ SVG viewBox 640×420 · 节点 r=6/8（focus 时）· 边 dim 控制
```

**关键事实**：无 d3 依赖，无 eval，无外部图库；力导向是 `src/lib/posts/force-layout.ts` 自研纯函数，已被单测覆盖。

### 2.6 工程成熟度（v3 评估）

相对同类个人站：**已处工程化上限区**。证据：

- 672 单测 + 48 e2e + module-boundaries 边界测 + check:seo + check:blur + check:production-content
- nonce CSP + remotePatterns 空 + HSTS + Permissions-Policy
- 文档分层清晰：维护 vs 决策 vs 历史
- CI 双重 build（quality + e2e）+ Lighthouse + bundle budget

边际收益：**G3 体验 / Next 16.2 红利 / 卫生同构** ≫ 平台重构或换栈。

### 2.7 文档漂移（v3 卫生债入口）

| 现象                                            | 处理                              |
| ----------------------------------------------- | --------------------------------- |
| `launch-baseline.md` 仍写功能基线 `a91a07d`     | **H-A 卫生包** 更新到 `ef77986`   |
| `handoff-2026-07-21-garden.md` 写 tip `98568b6` | 新增 handoff 或更新到 `ef77986`   |
| `README.md` 写「599 用例 / 77 文件」            | 更新为 672/90                     |
| `AGENTS.md` 写「618 tests, 81 files」           | 更新为 672/90                     |
| `TODO.md` 归档 HEAD 写 `61ffd47`                | 更新为 `ef77986` 或新增 G2 上线行 |
| `architecture.md` 写「599 tests / 77 files」    | 更新为 672/90                     |
| `docs/overview.md` 未挂 v3 报告                 | 挂链 v3                           |

**漂移风险**：3 个月后接手者读 launch-baseline 会以为生产仍停留在 `a91a07d`，导致错误判断「G2 未上线」；读 README 测试数会低估覆盖率。这是真实回归风险，必须修。

---

## 3. 历史文档整合与单一叙事

### 3.1 时间线（v3 校正后）

1. **07-06** 优化路线：架构 / UX / 视觉渐进。
2. **07-12** UI 双轨收口 + 搜索可分享 `?q=`。
3. **07-17** 全栈审计 + CSP ADR + JSON strict。
4. **07-18** `src/server` 分层 + ops-readiness；工程 TODO 关闭。
5. **07-19** 真截图 / 专题 / GitHub 身份；用户跳过运营。
6. **07-21 上午** v1 调研 + 表单：混合轨道 + 花园 + nonce。
7. **07-21 中** Ship G0/G1 + 三角样例。
8. **07-21 下午** 延伸阅读 42 条 wikilink 化；**v2**。
9. **07-21 晚** v2 表单 R2+Q11/12/13/14/15+Q16 实施并 push；G2 升级为完整路由；生产同步 `ef77986`；**v3**。

### 3.2 v2 → v3 决议演进（非推翻）

| v2 决议                              | v3 态                                               |
| ------------------------------------ | --------------------------------------------------- |
| ahead 5 / 生产滞后                   | **已消除**：用户后续 push，生产同步                 |
| G2 仅折叠/次级原型                   | **已超越**：完整 /garden 路由 + 拖拽 + localStorage |
| Q10-Q15 全部推荐                     | **已交付并 push**                                   |
| Q18 不 push                          | **用户行为推翻**：连续 push，生产已含 G2            |
| 推荐暂缓 G2                          | v3 接受既成事实，转入「G2 维护 + G3 评估」          |
| 不换栈 / 不假 GSC / 不 unsafe-inline | **全部维持**                                        |

### 3.3 文档拓扑（v3）

```text
维护：README AGENTS TODO overview architecture handoff API launch-baseline …
决策：adr/*
设计：specs/*
历史：日期报告 + superpowers/runs/*
决策报告：v1 + v2 + **本 v3**
```

---

## 4. 同类项目经验（2026-07-21 当日刷新）

### 4.1 对照矩阵（v3 增项标 ★）

| 维度       | 西江月            | Quartz 5（v3 刷新）               | Astro + Collections | 典型 Next MDX | Orama（v3 新） | Pagefind（v3 新） |
| ---------- | ----------------- | --------------------------------- | ------------------- | ------------- | -------------- | ----------------- |
| 内容       | MDX+JSON+Zod      | Obsidian MD                       | MD/MDX+schema       | MDX           | 任意           | 静态 HTML         |
| 花园       | **自研 G0/G1/G2** | **原生** wikilink/反链/图/popover | DIY / 社区          | DIY           | -              | -                 |
| 默认渲染   | 动态+nonce        | 静态 SPA 感                       | 静态/少 JS          | 常 SSG        | -              | 静态索引          |
| 搜索       | Fuse API          | 内置                              | Pagefind 常配       | 多种          | 全文+向量      | 静态 HTML         |
| 适合       | 工程品牌+花园增量 | 纯笔记网                          | 内容性能+混合       | React 生态    | 大语料         | 静态海量          |
| 与本站匹配 | -                 | 3.6/5                             | -                   | -             | 3.4/5          | 4.6/5（50+ 文后） |

### 4.2 Phase B 七方向要点（详见 Phase B 调研报告）

1. **Quartz 5**（2026-06-11 发布）：v5 引入 plugin registry；popover-previews 用 `popover-hint` class 抓取同源 HTML；graph view 拆为社区插件 `quartz-community/graph`；wikilink 大小写不敏感 + transclusion `![[file]]`。
2. **Next 16 / 16.2**：Turbopack 默认；`proxy.ts` 取代 `middleware.ts`；React 19.2 View Transitions；16.2 RSC 反序列化提速 60%；16.2 Turbopack SRI 支持；`<Link transitionTypes>`。
3. **搜索方案**：fuse.js 仍是 14 文甜点；Pagefind 适合 50+ 文迁移；Orama schema 开销 > 14 文收益；Lyra 已并入 Orama（伪命题）；MeiliSearch/Typesense 与硬约束冲突。
4. **CSP nonce vs SRI**（v3 关键）：Next 16.2.10 官方文档明确 nonce 与 SSG/ISR/PPR 互斥；experimental SRI 可让 SSG + 严格 CSP 共存；SRI 不覆盖 inline style。
5. **Vercel Speed Insights**：2026-06-16 文档；P75/P90/P95/P99 分位 + 地理热力 + 路由看板；无 INP>200ms 官方调优 playbook；实验室 vs 字段差异需双向看。
6. **MDX wikilink 生态**：`remark-wiki-link` v2.0.1 三年未更新但周下载 10,814；Quartz v5 自研更现代；popover preview 是 G3 核心候选。
7. **内容增长**：公开渠道缺 2025-2026 真实案例数据；专题化 + metadata 完整化是低风险共识；jvns.ca / swyx 等博主为定性参考。

### 4.3 可迁移细节（不换栈）

| 来源             | 细节                     | 落点                          |
| ---------------- | ------------------------ | ----------------------------- |
| Quartz 5         | popover-hint class 思路  | G3 popover preview            |
| Quartz 5         | wikilink 大小写不敏感    | 评估是否升级 wikilink 解析    |
| Next 16.2        | React Compiler           | G2 拖拽 re-render 优化        |
| Next 16.2        | Turbopack FS cache       | 本地 dev 重启秒级             |
| Next 16.2        | `<Link transitionTypes>` | 文章列表→详情 View Transition |
| Next 16.2        | experimental SRI         | 评估 nonce → SRI 迁移         |
| Pagefind         | 静态 HTML 索引           | 50+ 文后迁移候选              |
| remark-wiki-link | alias 已支持             | G0 已实现                     |

### 4.4 不要抄什么（v3 增项）

- 不要抄 Quartz 的 fetch-HTML-crop popover 方案（Next 16 RSC 更优雅）。
- 不要为「现代化」上 Orama（14 文 schema 设计开销 > 收益）。
- 不要在 SRI 还 experimental 时就上生产关键路径（先 preview 验证）。
- 不要为 View Transitions 强行加动画（14 文小站，过度动效拖 INP）。
- 不要同时开 `cacheComponents: true` 和 nonce CSP（官方明说互斥）。

---

## 5. 技术债清单（v3 刷新）

### 5.1 级别（v3 不变）

| 级    | 定义                             |
| ----- | -------------------------------- |
| D0    | 生产正确性/安全（当前无开放 D0） |
| D1    | 用户可感知体验                   |
| D2    | 工程卫生                         |
| D3    | 规模化预留                       |
| X     | 外部账号                         |
| G     | 花园演进                         |
| **N** | **Next 16.2 接入（v3 新）**      |

### 5.2 明细（v3 新增标 ★）

| ID         | 级  | 描述                                         | 触发              | 建议                  |
| ---------- | --- | -------------------------------------------- | ----------------- | --------------------- |
| X1–X3      | X   | GSC/Bing/RUM                                 | 用户账号          | 跳过；禁假完成        |
| D1-1       | D1  | 移动 lab FCP/LCP                             | 手测/RUM          | 调查 CSS；不阻塞      |
| D1-2       | D1  | 文章 lab CLS                                 | 文章页            | next/font 已利好      |
| D1-3       | D1  | 中文字体策略                                 | 阅读页            | Noto 子集评估         |
| D1-4       | D1  | 首页动画岛 INP                               | INP               | 审计减负              |
| D1-5       | D1  | 移动 TOC/反链/邻接重叠                       | 390 宽            | 手测验收              |
| D1-6       | D1  | 反链「最多 N + 还有 k」                      | 入边多的 slug     | **已交付**（v3 关闭） |
| D1-7       | D1  | 404 导流                                     | 可选              | **已交付**（v3 关闭） |
| D2-1       | D2  | AGENTS 搜索描述过时                          | 文档              | **已交付**（v3 关闭） |
| D2-2       | D2  | Stryker 未进主 CI                            | 工具              | 文档化或移除          |
| D2-3       | D2  | CI 双重 build                                | 时长              | 可选                  |
| D2-4       | D2  | deploy ≠ CI 产物                             | 保真              | smoke 兜底            |
| **D2-6 ★** | D2  | launch-baseline/handoff/README/TODO 数字漂移 | v3 实测           | **H-A 卫生包优先**    |
| D3-1       | D3  | 外部搜索                                     | ≥200 文/p95       | ADR                   |
| D3-2       | D3  | 正文图 LQIP                                  | 有 blog 图        | gen:blur              |
| D3-3       | D3  | prose CSS 下沉                               | Coverage          | 禁无证据              |
| D3-4       | D3  | Cache Components                             | 外部数据          | 指南；与 nonce 互斥   |
| D3-5       | D3  | 项目 MDX 复盘                                | 产品需要          | content/projects      |
| G-1        | G   | 正文区概念链不足                             | 内容 70%          | 改 MDX 非堆延伸阅读   |
| G-2        | G   | G2 UI                                        | 质量门槛+用户勾选 | **已交付**（v3 关闭） |
| G-3        | G   | 生产未含花园                                 | 用户 push         | **已交付**（v3 关闭） |
| G-4        | G   | wikilink 在 TOML 示例                        | 已有代码保护      | 保持；测覆盖          |
| **G-5 ★**  | G   | G3 popover preview 未做                      | v3 评估           | RSC + Radix HoverCard |
| **G-6 ★**  | G   | G2 缺 tag filter 之外的增强                  | v3 评估           | 入度阈值/hover 高亮   |
| **N-1 ★**  | N   | React Compiler 未开                          | v3 评估           | experimental 先测     |
| **N-2 ★**  | N   | Turbopack FS cache 未开                      | v3 评估           | dev 提速              |
| **N-3 ★**  | N   | `<Link transitionTypes>` 未用                | v3 评估           | 文章切换动画          |
| **N-4 ★**  | N   | SRI 迁移评估                                 | v3 评估           | 与硬边界解释张力      |

### 5.3 治理原则（v3 增条）

1. 门槛未到不做。
2. 账号项不改代码假装完成。
3. 体验债优先有浏览器证据。
4. 花园边：延伸阅读批量链 ≠ 概念网；内容轨道要写「文中自然句」。
5. **v3 新增**：文档数字漂移就是债；任何 push 后必须更新 launch-baseline + handoff，否则下个接手者会以过期数字做决策。
6. **v3 新增**：experimental 特性先 preview 验证再上生产；SRI 与 nonce 切换需 ADR。

---

## 6. 目标 · 约束 · 边界

### 6.1 北极星（未变）

**可复用工程笔记 + 可信作品集 + 策展导航 + 轻量数字花园**，并在不破坏安全与品牌的前提下提供**已交付的 G0/G1/G2 维护与可选 G3 popover 体验**。

### 6.2 目标树（v3 增 T7/T8）

| ID     | 目标               | 可观测                              |
| ------ | ------------------ | ----------------------------------- |
| T1     | 发现路径更「文中」 | ≥6 条新正文 wikilink                |
| T2     | 安全/分层不破      | 边界测·无 unsafe-inline             |
| T3     | 死胡同减少         | **已达成**（404 + 搜索空态）        |
| T4     | 文档同构           | launch-baseline/handoff/README 一致 |
| T5     | 运营诚实           | 状态仍 blocked/pending              |
| T6     | 分叉可控           | **已达成**（生产同步）              |
| **T7** | **G3 体验评估**    | popover preview 原型（若选）        |
| **T8** | **Next 16.2 接入** | React Compiler / FS cache（若选）   |

### 6.3 非目标

- 多作者 CMS、账号体系、付费订阅。
- 独立微服务、搜索集群。
- 为 SSG 放宽脚本 CSP（**SRI 评估例外，需表单确认**）。
- 全站视觉推倒 / Quartz 整迁。
- 无门槛全站力导向图（**G2 已交付，不再扩为全站图谱产品**）。
- 运营假完成。

### 6.4 约束（v3 增 N 行）

| 类    | 内容                                                            |
| ----- | --------------------------------------------------------------- |
| 技术  | Next 16 App Router · React 19 · TS · pnpm · Node 22 CI          |
| 安全  | nonce CSP · remotePatterns 空 · 密钥不入库 · **SRI 评估需 ADR** |
| 内容  | git SSOT · MDX/JSON                                             |
| 部署  | Vercel + Actions；push/deploy 需确认                            |
| 协作  | 高风险先确认；跳过运营时穷尽自动后停                            |
| 规模  | 14/6/123 假设；不为十万级设计                                   |
| 花园  | 一层 remark；client 不读 FS；G2 维护优先于 G3                   |
| **N** | **experimental 特性先 preview；React Compiler/SRI 需独立验证**  |

### 6.5 系统边界（v3 不变）

```text
作者 MDX/JSON ──git──► CI ──► Vercel
                         │
                    访客浏览器
                    ├ HTML(动态+nonce)
                    ├ /api/search
                    ├ /garden（client 力导向）
                    ├ 静态资产
                    └ Giscus / Vercel analytics
边界外：GSC 控制台、CF DNS 写、SI 明细 API
```

---

## 7. 输入 · 输出 · 契约（v3 增 G2/G3 项）

### 7.1 系统输入

| 输入                      | 来源                        | 校验                             |
| ------------------------- | --------------------------- | -------------------------------- |
| 博客 MDX（可含 wikilink） | content/blog                | schema + 可见性 + 图 fail-closed |
| 项目/链接 JSON            | data/*                      | Zod · 生产 strict                |
| 环境                      | SITE_URL · Giscus           | 生产禁 localhost feed            |
| 搜索                      | q/limit                     | clamp · 限流                     |
| 偏好                      | 主题/阅读/`?q=`/garden 视图 | 本地安全封装                     |

### 7.2 系统输出

| 输出                    | 消费者                   |
| ----------------------- | ------------------------ |
| HTML                    | 访客                     |
| 内链/反链 UI            | 读者发现路径             |
| SearchResultItem[]      | SearchBar                |
| GardenGraph             | GardenExplorer（client） |
| NeighborBundle          | ArticleNeighbors         |
| feed/sitemap/OG/JSON-LD | 订阅与爬虫               |
| CI/ops-readiness        | 维护者                   |

### 7.3 内部契约（v3 增 G2 项）

```text
extractWikilinks(content) → {slug,label}[]
remarkWikilink → mdast link
buildBacklinkIndex → Map<target, sources[]>
buildGardenEdges → GardenGraphEdge[]（自环剔除、去重、slug 排序）
getBacklinks(slug) → PostMeta[]  // 无自环，日期倒序
getGardenGraph() → { nodes, edges }
getNeighbors(slug) → { outbound, inbound }
assertWikilinksValid() → throws on missing target
filterGardenGraph(graph, {series, tag}) → GardenGraph
layoutForceGraph(nodes, edges, {width, height, iterations}) → Map<slug, {x,y}>
```

### 7.4 本决策流程 IO

| 角色  | 输入      | 输出                  |
| ----- | --------- | --------------------- |
| 用户  | 表单选择  | 授权 ship 范围        |
| Agent | 仓库+调研 | v3 报告 + 表单 + ship |
| CI    | push      | 门禁                  |
| 生产  | deploy    | smoke                 |

---

## 8. 架构方案全集与对比（v3 新增项标 ★）

### 8.1 平台（未变）

| 方案      | 描述             | 分  | 态       |
| --------- | ---------------- | --- | -------- |
| **P-A ★** | 锁 Next+本地内容 | 92  | **已选** |
| P-B       | 迁 Astro         | 48  | 否       |
| P-C       | Hugo/Quartz      | 40  | 否       |
| P-D       | Headless CMS     | 28  | 否       |

### 8.2 渲染/安全（v3 新增 R-E SRI 评估）

| 方案                        | 分     | 态                  |
| --------------------------- | ------ | ------------------- |
| **R-A nonce ★**             | 88     | **已选（v3 维持）** |
| R-B SSG+unsafe-inline       | 30     | **禁**              |
| R-C SSG+hash                | 55     | 成本高              |
| R-D 混合静态营销页          | 50     | 过度设计            |
| **R-E SRI hash ★（v3 新）** | **82** | **评估项**          |

**R-E 评分细节**：

| 维度     | 分     | 说明                                                           |
| -------- | ------ | -------------------------------------------------------------- |
| 读者价值 | 7      | 静态化后 LCP/FCP 改善，但 14 文小站边际收益有限                |
| 实现成本 | 6      | next.config 加 SRI 配置 + CSP 改写 + proxy.ts 简化；中等工作量 |
| 约束匹配 | 9      | 不放宽 script-src；与「锁本地 MDX + SSG」完美契合              |
| 维护     | 8      | SRI 自动生成 hash，维护成本低                                  |
| 风险     | 6      | experimental；可能改 API；inline style 仍需处理                |
| 品牌     | 9      | 工程严谨性提升；解锁 PPR/CDN 缓存                              |
| **加权** | **82** | 维度权：25/20/20/15/10/10                                      |

**R-E 最佳条件**：仅在用户表单明确「SRI 不算放宽安全基线」+ preview 环境验证通过 + 新增 ADR 后实施。

### 8.3 内容（未变）

| 方案                          | 态                  |
| ----------------------------- | ------------------- |
| **C-A MDX+JSON+repository ★** | 现行                |
| C-A+花园                      | **G0/G1/G2 已落地** |
| C-B 构建期关系图产物          | 可选优化            |
| C-C 项目 MDX 复盘             | 中期                |
| C-D CMS                       | 否                  |

### 8.4 搜索（v3 增 Pagefind 评估）

| 方案                   | 态                    |
| ---------------------- | --------------------- |
| **S-A Fuse API ★**     | 现行；空态已交付      |
| S-B Pagefind           | **50+ 文后迁移**      |
| S-C Algolia            | 否                    |
| S-D 客户端全量         | 反模式                |
| **S-E Orama（v3 新）** | **否**（14 文不划算） |

### 8.5 CSS/视觉（未变）

| 方案                              | 分   | 态       |
| --------------------------------- | ---- | -------- |
| **V-S1 纸感+花园融 article-ui ★** | 90.5 | **已走** |
| V-S2 Quartz 深色笔记风            | 58   | 否       |
| V-S3 Spotlight 大改               | 52   | 否       |
| V-S4 抹掉 BEM                     | 37   | 否       |

### 8.6 分层边界（未变）

| 方案                 | 态     |
| -------------------- | ------ |
| **B-A src/server ★** | 已上线 |

### 8.7 花园深度（v3 重评，G2 已交付）

| 方案                                 | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | 加权   | 态               |
| ------------------------------------ | ---- | ---- | ---- | ---- | ---- | ---- | ------ | ---------------- |
| **GD-1 维护 G0/G1/G2 + 正文加深**    | 9    | 8    | 10   | 9    | 9    | 9    | **89** | **推荐下一主线** |
| **GD-2 G3 popover preview（v3 新）** | 8    | 5    | 7    | 6    | 5    | 8    | **69** | 条件             |
| GD-3 全站首屏力导向                  | 6    | 3    | 6    | 4    | 3    | 4    | 45     | 否（已否决）     |
| GD-4 迁 Quartz                       | 7    | 1    | 3    | 2    | 2    | 3    | 33     | 否               |
| GD-5 停花园只写文                    | 6    | 9    | 10   | 9    | 9    | 7    | 80     | 可作内容极端包   |

**最佳 GD-1**：G2 已稳定，下一刀仍应是「正文概念链加深」，而非 G3 popover。G3 popover 是「条件触发」而非「必做」。

### 8.8 Next 16.2 接入（v3 新章节）

| 方案                                       | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | 加权   | 态       |
| ------------------------------------------ | ---- | ---- | ---- | ---- | ---- | ---- | ------ | -------- |
| **N16-A 选开 React Compiler + FS cache ★** | 8    | 8    | 9    | 8    | 8    | 8    | **82** | **推荐** |
| N16-B 全开（含 SRI + View Transitions）    | 9    | 5    | 7    | 6    | 5    | 9    | 70     | 评估     |
| N16-C 不开                                 | 5    | 10   | 10   | 9    | 9    | 5    | 75     | 保守     |
| N16-D 仅开 View Transitions                | 6    | 8    | 9    | 7    | 8    | 7    | 72     | 可选     |

**最佳 N16-A**：React Compiler + Turbopack FS cache 零安全风险、零架构改动、对 G2 拖拽 re-render 直接生效。SRI 单列 R-E 评估。

---

## 9. 数字花园专题规格（v3 G3 候选）

### 9.1 已交付验收（v3 关闭项）

| #   | 标准                                  | 证据                                         |
| --- | ------------------------------------- | -------------------------------------------- |
| 1   | `[[slug]]`/`[[slug\|label]]` → 站内链 | remark + 单测 + :3001 冒烟                   |
| 2   | 代码围栏内不解析                      | wikilink 测 + cloudflare TOML                |
| 3   | 坏链 fail-closed                      | link-graph 测                                |
| 4   | 反链面板 + 折叠                       | ArticleBacklinks + `<details>`               |
| 5   | server facade                         | getBacklinks / getGardenGraph / getNeighbors |
| 6   | 全站延伸阅读 wikilink                 | 47 条级                                      |
| 7   | CSP 无新远程脚本                      | 无新依赖                                     |
| 8   | G2 力导向 + 拖拽 + localStorage       | GardenExplorer + force-layout                |
| 9   | G2 reduced-motion 列表降级            | usePrefersReducedMotion                      |
| 10  | 文内邻接 outbound+inbound             | ArticleNeighbors                             |

### 9.2 未交付（v3 候选）

- **G3 popover preview**（hover wikilink 显示目标摘要）
- **G4a graph filter 增强**（入度阈值、hover 高亮邻居）
- **G4b transclusion**（`![[file]]` 内联渲染）
- **G4c alias 链接**（`[[Real Page|Display Name]]`，remark-wiki-link 原生支持，G0 已部分实现）

### 9.3 G3 popover preview 规格（若启动）

| 项     | 要求                                                               |
| ------ | ------------------------------------------------------------------ |
| 数据源 | 复用 server/content；不新增客户端读盘                              |
| 触发   | hover / focus（键盘可达）                                          |
| 内容   | 标题 + 摘要 + tags + 系列（不渲染完整 MDX）                        |
| 实现   | Radix HoverCard 或 Next 16 RSC Route Handler `/api/preview/[slug]` |
| 移动端 | hover 不存在，降级为长按或 tap-to-navigate                         |
| CSP    | 无 eval；无任意 HTML 注入；不引入新远程脚本                        |
| 性能   | idle 时 prefetch 高概率 hover 目标；首屏不预取                     |
| 验收   | e2e + 无 CSP 违规 + 桌面 LH 不回归 + 键盘可达                      |

### 9.4 G3 实现路径对比

| 方案                             | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | 加权   | 态   |
| -------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ | ---- |
| **G3-A Radix HoverCard + RSC ★** | 8    | 6    | 8    | 7    | 7    | 8    | **73** | 推荐 |
| G3-B Quartz fetch-HTML 方案      | 6    | 4    | 6    | 4    | 4    | 6    | 53     | 否   |
| G3-C 全文 MDX 注入 popover       | 7    | 3    | 4    | 3    | 3    | 6    | 45     | 否   |
| G3-D 不做                        | 5    | 10   | 10   | 9    | 9    | 5    | 75     | 保守 |

**最佳 G3-A**：Radix HoverCard 是 shadcn 生态已有依赖（`components.json` 已配），RSC Route Handler 返回纯 HTML 片段，CSP 不变。但仍属「条件触发」——若用户表单未勾选，默认不做。

---

## 10. 用户体验升级（v3 重评）

评分维：读者价值 25 · 实现成本 20（高=省）· 约束 20 · 维护 15 · 风险 10（高=安全）· 品牌 10。

### 10.1 UX-1 发现路径（v3 已交付项关闭）

| 方案                          | 加权 | 态                    |
| ----------------------------- | ---- | --------------------- |
| UX-1A G0+G1                   | 85.5 | **已交付**（v2 关闭） |
| UX-1B 只加强 related          | 78.5 | 可补充                |
| UX-1C 全站图谱首页            | 58.5 | 否                    |
| UX-1E 正文概念链加深          | 87   | **下一内容主包**      |
| UX-1F 仅延伸阅读堆链          | 70   | 已做一轮；边际↓       |
| **UX-1G G2 完成（v3 新）**    | 85   | **已交付**            |
| **UX-1H G3 popover（v3 新）** | 73   | 条件                  |

### 10.2 UX-2 移动阅读（未变）

| 方案                         | 加权 | 结论 |
| ---------------------------- | ---- | ---- |
| **UX-2A 增量 TOC+反链+设置** | 83   | ★    |
| UX-2B 重做双栏               | 63   | 否   |
| UX-2C 忽略移动               | —    | 否决 |

### 10.3 UX-3 搜索（v3 已交付项关闭）

| 方案                        | 加权 | 态         |
| --------------------------- | ---- | ---------- |
| **UX-3A Fuse+空态导流**     | 84   | **已交付** |
| UX-3B 增强空态（热门/系列） | 82   | **已交付** |
| UX-3C Pagefind              | 62   | 门槛后     |

### 10.4 UX-4 作品集（未变）

| 方案                | 加权    |
| ------------------- | ------- |
| UX-4A JSON+真图     | 78 现状 |
| **UX-4B +MDX 复盘** | 82 中期 |
| UX-4C CMS           | 35 否   |

### 10.5 UX-5 404 / 死胡同（v3 已交付项关闭）

| 方案                         | 加权 | 态         |
| ---------------------------- | ---- | ---------- |
| **UX-5A 404→搜索/博客/项目** | 85   | **已交付** |
| UX-5B 仅「返回首页」         | 60   | 否         |

### 10.6 UX 可执行清单（v3）

| ID      | 项                 | 轨道     | 建议            |
| ------- | ------------------ | -------- | --------------- |
| U1–U2   | G0/G1              | 花园     | **完成**        |
| U3      | 延伸阅读 wikilink  | 内容     | **完成**        |
| U10     | 正文概念链 4–8 篇  | 内容 70% | **推荐**        |
| U4      | 反链 N 条+折叠     | 体验     | **完成**        |
| U5      | 搜索空态增强       | 体验     | **完成**        |
| U6      | 404 导流           | 体验     | **完成**        |
| U7      | 动画岛减负         | 体验     | 可选            |
| U8      | G2                 | 花园     | **完成**        |
| U9      | 项目 MDX           | 内容     | 中期            |
| U11     | CLS/字体           | 体验     | 可选            |
| U12     | AGENTS 搜索文案    | 卫生     | **完成**        |
| **U13** | **G3 popover**     | 花园     | v3 评估（条件） |
| **U14** | **Next 16.2 接入** | 工程     | v3 推荐         |
| **U15** | **卫生债清理**     | 卫生     | v3 推荐         |

---

## 11. 视觉风格（v3 不变）

### 11.1 保留语言

- Paper Gallery：低饱和纸、鼠尾草 brand、暖金 featured
- 衬线展示 + Noto SC + JetBrains Mono
- BEM 结构 + shadcn 交互；禁第三套 `.btn`
- 反链：`article-panel` 兄弟语言（已实现）
- G2 图谱：`garden-explorer` BEM，节点圆 + 标签省略

### 11.2 方向评分

见 §8.5；**V-S1 仍为唯一合理主线**。

### 11.3 打磨细则（v3 增 G2 项）

1. 反链与 Related 视觉兄弟化（已接近）。
2. 390 宽不与 ReadingPreferences/BackToTop/移动 TOC/反链/邻接 永久重叠（**v3 新增邻接**）。
3. 暗色只用 token。
4. G2 节点禁霓虹皮肤；保持纸感。
5. wikilink 可与外链区分（可选虚线下划线）——低优先级。
6. G3 popover 视觉应与 ArticleBacklinks 兄弟化，不引入新设计语言。

---

## 12. 分轨道实施规格（v3）

### 12.1 轨道 O-A 内容 70%

**目标**：提高「下一篇点击率」与主题簇连通。
**输入**：现有 14 MDX；slug 表；系列「个人服务部署路线」。
**输出**：正文内自然 `[[ ]]`；可选 1 篇新笔记（非必须）。
**验收**：

1. 新增/修改链目标均存在（fail-closed 绿）。
2. 至少 3 个主题簇各有 ≥1 条正文链（运维 / 数据 / 前端）。
3. 不引入假相关（禁止「为了图而链」）。
4. 相关单测 + 抽检 3 页反链。

### 12.2 轨道 O-B 体验 20%

**目标**：减少死胡同与布局抖动。
**包选项**：G3 popover（若选） · 动画减负 · CLS/字体。
**验收**：移动 390 手测或 Playwright mobile；LH 桌面不回归；无 CSP 违规。

### 12.3 轨道 O-C 卫生 10%

**目标**：文档与代码同构。
**包**：launch-baseline · handoff · README · AGENTS · TODO · architecture · overview 挂 v3 · 记忆 tip 同步。
**验收**：`format:docs:check` · `check:docs` · 无行为回归。

### 12.4 轨道 O-D Next 16.2 接入 0%–20%（v3 新）

**目标**：零风险接入工程红利。
**包选项**：React Compiler · Turbopack FS cache · `<Link transitionTypes>` · SRI 评估。
**验收**：preview 构建对比 · 受影响测绿 · 生产 LH 不回归 · ADR（若 SRI）。

### 12.5 轨道 O-X 运营 0%（默认）

仅当用户改表单；否则不动完成态。

### 12.6 全局门禁（任何代码）

```text
format/lint/typecheck → 受影响 test → （路由）e2e
内容 → check:seo
文档 → format:docs:check + check:docs
禁止：假 GSC、放宽 CSP、无授权 push、experimental 直接上生产
```

---

## 13. 细节打磨参考清单（v3）

### 13.1 交互

- [x] wikilink 双语法
- [x] 反链空态文案
- [x] 搜索空态基础导流
- [x] 反链 max N + 还有 k
- [x] 404 导流
- [x] G2 力导向 + 拖拽 + localStorage
- [x] 文内邻接 ArticleNeighbors
- [ ] 正文概念链加深（4-8 篇）
- [ ] G3 popover preview（条件）
- [ ] 键盘可达抽检（G2 已有 tabIndex，需 e2e 覆盖）

### 13.2 视觉

- [x] 反链 article-ui
- [x] G2 garden-explorer BEM
- [ ] 390 重叠手测记录（含 ArticleNeighbors）
- [ ] wikilink/外链可选区分
- [ ] G2 节点 hover 高亮邻居（G4a 候选）

### 13.3 工程

- [x] cache 图 · 纯函数 · server 导出 · 边界测
- [x] AGENTS 搜索描述
- [ ] launch-baseline/handoff/README/TODO 数字同步
- [ ] React Compiler 评估
- [ ] Turbopack FS cache 评估
- [ ] SRI 评估 + ADR（若启动）
- [ ] Stryker 进 CI 或移除

### 13.4 内容

- [x] 14 篇延伸阅读 wikilink
- [x] 部署三角正文链
- [ ] 数据簇 PG↔Redis↔Supabase 正文句
- [ ] 前端簇 Next↔性能↔TS 正文句
- [ ] 专题 pillar 文（可选）

---

## 14. 本轮 Ship 问题清单（v3 Q21–Q30）

| #       | 工作包                                 | 最佳方案    | 依赖     | 默认         |
| ------- | -------------------------------------- | ----------- | -------- | ------------ |
| **Q21** | 卫生债清理（launch/handoff/README 等） | H-A         | 独立     | **推荐卫生** |
| **Q22** | React Compiler 评估 + 接入             | N16-A       | 独立     | **推荐工程** |
| **Q23** | Turbopack FS cache 接入                | N16-A       | 独立     | **推荐工程** |
| **Q24** | `<Link transitionTypes>` 文章切换      | N16-D       | 独立     | 可选         |
| **Q25** | SRI 迁移评估 + ADR（不直接上生产）     | R-E         | 用户表单 | **评估**     |
| **Q26** | G3 popover preview 原型                | G3-A        | 用户勾选 | 条件         |
| **Q27** | G2 graph filter 增强（hover 高亮）     | G4a         | 独立     | 可选         |
| **Q28** | 正文概念链加深 4-8 篇                  | UX-1E / O-A | 独立     | **推荐内容** |
| **Q29** | 授权 push（若有代码变更）              | G-3         | 用户     | **门控**     |
| **Q30** | 换栈/CMS/Orama/假 GSC/unsafe-inline    | 低分        | —        | **禁止**     |

**推荐 ship 包 R1**：`Q21 + Q22 + Q23 + Q28`（卫生 + 工程 + 内容，风险最低，全在本地可验证）。
**推荐 ship 包 R2**：`Q21 + Q22 + Q23 + Q24 + Q28`（加 View Transitions）。
**推荐 ship 包 R3**：`Q21 + Q22 + Q23 + Q26 + Q28`（加 G3 popover）。
**评估包 E1**：`Q25`（仅写 ADR + preview 验证，不直接上生产）。
**加推包 R4**：用户显式要上线时再加 `Q29`。
**禁止包**：`Q30` 全部子项。

---

## 15. 目标/约束/IO/验收（v3 精炼）

### 15.1 目标

| ID  | 目标               | 度量                              |
| --- | ------------------ | --------------------------------- |
| T1  | 发现路径更「文中」 | ≥6 条新正文 wikilink              |
| T2  | 安全/分层不破      | 边界测·无 unsafe-inline           |
| T3  | 死胡同减少         | **已达成**                        |
| T4  | 文档同构           | launch/handoff/README/TODO 一致   |
| T5  | 运营诚实           | 状态仍 blocked/pending            |
| T6  | 分叉可控           | **已达成**                        |
| T7  | G3 体验评估        | popover 原型（若选 Q26）          |
| T8  | Next 16.2 接入     | React Compiler / FS cache（若选） |

### 15.2 约束

同 §6.4；另：不自动 G3；不自动 SRI；不改生产完成叙事。

### 15.3 输入

- 用户表单选择
- 现有 MDX/组件
- v1/v2/v3 决议
- Next 16.2 官方文档

### 15.4 输出

- 内容/代码/文档 diff
- 测试绿
- 总结（含未做项）
- 可选：待 push 的 tip
- 可选：SRI ADR 草稿

### 15.5 验收命令

```bash
cd D:\blog
pnpm test
pnpm typecheck
pnpm check:docs
pnpm check:seo
# 体验包另加受影响组件测 / e2e
# 上线包：用户授权后 git push && pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

---

## 16. 风险与回滚

| 风险                         | 缓解                                       |
| ---------------------------- | ------------------------------------------ |
| React Compiler 引入隐性 bug  | 先 preview；保留 babel fallback；e2e 覆盖  |
| SRI experimental API 变化    | ADR 写明 revisit 条件；保留 nonce 回退路径 |
| G3 popover 移动端 hover 缺失 | 降级 tap-to-navigate；不阻塞阅读流         |
| 卫生包误改行为               | 仅改文档数字；不动代码                     |
| push 触发生产回退            | 先 CI；smoke；可 revert tip                |
| 文档数字仍漂移               | 卫生包后建立「push 后必须更新」规则        |

回滚：内容/文档可用 git revert 单 commit；React Compiler 可关 experimental；SRI 可回 nonce；G3 popover 可移除组件。

---

## 17. 完整验收矩阵（v3）

| ID    | 项                | 命令/证据         | 通过         |
| ----- | ----------------- | ----------------- | ------------ |
| AC-01 | wikilink 渲染     | 单测+页面         | 链正确       |
| AC-02 | 坏链              | link-graph 测     | throw        |
| AC-03 | 反链+折叠         | 页面 DOM          | 入边+details |
| AC-04 | 边界              | module-boundaries | 绿           |
| AC-05 | CSP               | 无新远程脚本      | 绿           |
| AC-06 | 文档链接          | check:docs        | 绿           |
| AC-07 | 运营诚实          | TODO/ops          | 非假完成     |
| AC-08 | 移动反链+邻接     | 手测 390          | 可达         |
| AC-09 | 生产一致          | **已达成**        | smoke 绿     |
| AC-10 | LH 桌面           | CI                | 不回归       |
| AC-11 | G2 拖拽           | 手测/e2e          | 节点可拖     |
| AC-12 | G2 reduced-motion | 手测              | 列表降级     |
| AC-13 | React Compiler    | preview build     | 无回归       |
| AC-14 | SRI ADR           | 文档              | 状态明确     |

---

## 18. 为什么「最佳组合」仍最符合项目（v3）

1. **目标匹配**：品牌站 + 已交付花园，不是纯 PKM。
2. **约束匹配**：nonce、本地内容、不换栈、可跳过运营、experimental 先 preview。
3. **沉没成本**：分层、测、纸感、G0/G1/G2 已付费；换栈归零。
4. **规模匹配**：14 文 Fuse 足够；G3 popover 是体验升级，不是门槛项。
5. **风险匹配**：卫生与 React Compiler 可逆；SRI 需 ADR；G3 需表单。
6. **用户已决议**：v2 §51 表单已全部落地；v3 不推翻，只评估下一阶段。
7. **分叉已消除**：生产同步，无 ahead/behind；v3 不再以分叉为前提。
8. **工程红利**：Next 16.2 React Compiler + FS cache 是「免费午餐」，不开白不开。
9. **文档诚实**：卫生债清理是「不让文档说谎」的最低成本工作。

---

## 19. 交互表单设计（实现见对话 AskUserQuestion）

表单维度（多题）：

1. **主 ship 包**：R1 / R2 / R3 / 自定义
2. **是否包含 push（Q29）**：否（默认）/ 是
3. **SRI 评估（Q25）**：仅写 ADR / ADR + preview 验证 / 暂不评估
4. **G3 popover（Q26）**：否（默认）/ 做原型 / 暂缓
5. **Next 16.2 接入**：React Compiler / FS cache / View Transitions / 全选 / 不开（多选）
6. **内容策略**：只正文概念链 / 再写 1 篇新文 / 暂停内容只做工程卫生
7. **明确「禁止项」确认**：换栈 / CMS / Orama / 假 GSC / unsafe-inline / 无授权 push

仲裁规则：与文首硬决议冲突的选项（换栈、假 GSC、unsafe-inline、experimental 直接上生产）**拒绝执行**。

---

## 20. 附录 A · 文章主题簇（内容规划用，未变）

| 簇         | slug                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| 部署运维   | vps-initial-setup · docker-deploy-guide · nginx-reverse-proxy · linux-server-troubleshooting · cloudflare-workers-guide |
| 交付自动化 | git-hooks-github-actions · cicd-pipeline-design                                                                         |
| 数据       | postgresql-performance · redis-caching-strategies · supabase-practical-guide                                            |
| 前端/语言  | nextjs-app-router · web-performance-optimization · typescript-advanced-types · go-cli-tool                              |

### 附录 B · 关键路径速查（v3 增项）

- 花园：`src/lib/posts/wikilink.ts` · `remark-wikilink.ts` · `link-graph.ts` · `ArticleBacklinks.tsx` · `ArticleNeighbors.tsx` · `GardenExplorer.tsx` · `force-layout.ts` · `garden-view-storage.ts`
- 文章页：`src/app/blog/[slug]/page.tsx`
- 搜索：`SearchBar.tsx` · `SearchResultsList.tsx` · `src/server/search/*`
- 样式：`tokens.css` · `article-ui.css` · `prose.css` · `garden.css`
- ADR：`docs/adr/2026-07-17-csp-nonce-over-ssg.md`（v3 候选新增 SRI ADR）

### 附录 C · Sources（v3 增项）

- [Next.js 16 blog](https://nextjs.org/blog/next-16) · [Next.js 16.2 blog](https://nextjs.org/blog/next-16-2) · [Next.js 16.2 Turbopack](https://nextjs.org/blog/next-16-2-turbopack)
- [Next.js CSP docs v16.2.10](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js strict CSP 示例](https://github.com/vercel/next.js/tree/canary/examples/with-strict-csp)
- [Quartz 5 官网](https://quartz.jzhao.xyz/) · [Quartz popover-previews](https://quartz.jzhao.xyz/features/popover-previews) · [Quartz graph-view](https://quartz.jzhao.xyz/features/graph-view) · [Quartz wikilinks](https://quartz.jzhao.xyz/features/wikilinks)
- [Orama 官网](https://orama.com/) · [Orama GitHub v3.2.0](https://github.com/oramasearch/orama) · [Orama docs](https://docs.orama.com/open-source)
- [Pagefind 官网](https://pagefind.app/)
- [remark-wiki-link npm](https://www.npmjs.com/package/remark-wiki-link) · [remark-wiki-link GitHub](https://github.com/landakram/remark-wiki-link)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)
- 站内：v1 报告 · v2 报告 · architecture.md · TODO.md · handoff-2026-07-21-garden.md · full-stack-audit-2026-07-17.md

---

## 21. 修订记录

| 日期       | 说明                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-21 | v1：整合调研 + 表单决议 + §28–35 UX/视觉                                                                                                                                       |
| 2026-07-21 | G0/G1 实现注记写入 v1                                                                                                                                                          |
| 2026-07-21 | v2：落地后重扫、47 边、同类刷新、GD/UX 重评、Q10–Q20 ship 清单、生产分叉诚实                                                                                                   |
| 2026-07-21 | **v3**：v2 §51 表单全部落地并 push；G2 升级为完整 /garden 路由；672 测/90 文件；Next 16.2 SRI/React Compiler/FS cache 评估；G3 popover 候选；卫生债单独成包；Q21–Q30 ship 清单 |

---

## 22. 给执行者的最后一页（/ship 前必读）

1. 先读用户表单结果；冲突硬决议则拒。
2. 默认 **R1 或 R2**；无 G3、无 SRI 上生产、无换栈、无假 GSC。
3. 内容改动跑 wikilink/link-graph 测；文档跑 check:docs。
4. **不 push** 除非 Q29=是。
5. 总结必须列出：做了什么、没做什么、HEAD、ahead、生产是否仍旧。
6. 更新 handoff/记忆 tip 与 overview 挂链（若在卫生包内）。
7. SRI 评估仅写 ADR + preview 验证；不在本轮上生产。
8. React Compiler 若接入，先 dev + preview 验证；e2e 必须绿。

---

## 23. 深度展开 · 为什么 v3 把 SRI 列为「评估」而非「推荐」

Next 16.2 引入 experimental SRI 是 Phase B 调研最重要的发现。理论上，SRI 能让本站从「nonce + 动态 HTML」迁移到「SRI hash + SSG + CDN 缓存 + PPR」，解锁所有因 nonce 放弃的静态红利。这在工程上是显著升级。

但 v3 不直接推荐 R-E，而是列为「评估项」，原因有四：

**第一，SRI 仍 experimental**。Next.js 官方文档明确标注 experimental API 可能在 minor 版本变化。14 文小站没有「必须立即迁移」的紧迫性；先用 preview 环境验证 6 个月，等 API 稳定再上是更稳健的工程决策。

**第二，与硬边界的解释张力**。用户硬边界写「不放宽安全基线（如 CSP nonce / 密钥不入库）」。SRI 与 nonce 是两种不同的严格 CSP 实现路径——SRI 用 hash 锁定静态资源，nonce 用 per-request token 锁定 inline script。两者在「严格性」上等价，但**用户在写硬边界时心中预期是 nonce**。Agent 单方面判定「SRI 不算放宽」是越权；必须用户表单确认。

**第三，迁移成本不是零**。需要新增 ADR、改 `next.config.ts`、简化 `proxy.ts`、可能调整 `csp.ts`、跑完整 CSP 回归测、验证 Giscus/Analytics 的 style-src 仍能工作。这个工作量在 0.5-1 人日级别，不是「免费午餐」。

**第四，边际收益对本站有限**。14 文小站即使全静态化，LCP 改善在 100-300ms 量级，对真实用户感知不明显。Speed Insights p75 真值未接入前，无法量化收益。React Compiler + FS cache 的边际收益（dev 提速 + G2 re-render 优化）反而更直接。

因此 v3 的姿态是：**把 SRI 写进 ADR 草稿 + preview 验证 + 用户表单确认**，作为评估项存在，但不进入 R1/R2 推荐包。这与「不放宽安全基线」的硬边界兼容，也保留了未来升级的路径。

---

## 24. 深度展开 · React Compiler 对 G2 拖拽场景的实际意义

G2 GardenExplorer 是本站最复杂的 client component：力导向布局、Pointer Events 拖拽、localStorage 视图、reduced-motion 降级、focus 状态管理。每次 `setPositions` 触发 re-render，所有节点 `<circle>` 与 `<line>` 都会重新计算。

React Compiler 的核心价值是**自动 memoization**：编译期分析 JSX 树，自动插入 `useMemo`/`useCallback`，避免手动优化。对 G2 这种「高频 setState + 大量子组件」的场景，理论上能显著减少 re-render 范围。

但 React Compiler 也是 experimental，且有三类风险：

1. **编译期 bug**：Babel 路径可能在某些边缘 case 下生成错误代码。需 e2e 全绿才能信任。
2. **构建时间增加**：Babel 编译比 SWC 慢；14 文小站影响有限，但需实测。
3. **与现有手写 memo 冲突**：GardenExplorer 已有 `useMemo`/`useCallback`，Compiler 可能与之产生冗余或冲突。需审查。

接入策略：

- Step 1：dev 模式开 `reactCompiler: true`，跑 `pnpm test` + `pnpm test:e2e`。全绿进入 Step 2。
- Step 2：preview 构建对比 LH 桌面分。不回归进入 Step 3。
- Step 3：生产构建 + 真机手测 G2 拖拽流畅度。无明显退化则保留。
- Step 4：若任何步骤失败，关 experimental，回退到当前状态。

这个流程与「experimental 先 preview」原则一致，且每步都可逆。因此 v3 把 React Compiler 列入 R1 推荐包（Q22），与 SRI 的「仅评估」形成对比——前者是工程红利，后者是架构变更。

---

## 25. 深度展开 · G3 popover preview 的产品哲学

Quartz 5 的 popover preview 是数字花园的标志性体验：hover 一个 wikilink，浮层显示目标页的标题、摘要、tags，读者不离开当前页就能预判是否值得跳转。这是「双向链接」从「技术能力」升级为「阅读体验」的关键一步。

但 G3 popover 也是 v3 最容易「过度设计」的项。三类风险：

**第一，移动端 hover 不存在**。Quartz 的 popover 在移动端降级为 tap-to-navigate，本站若做 G3 必须同样处理。否则移动读者会困惑「为什么 PC 上有预览，我没有」。

**第二，性能风险**。每个 wikilink 都监听 hover 事件，若不做 idle prefetch，14 文互链密度下可能触发频繁 fetch。Radix HoverCard 自带 delay，但仍需测 INP。

**第三，CSP 风险**。若 popover 内容来自 `dangerouslySetInnerHTML`，等于放弃 CSP 保护。必须用 RSC Route Handler 返回受限 HTML 片段，或用 React 组件树渲染。

因此 v3 把 G3 列为「条件触发」而非「推荐必做」：

- 仅当用户表单勾选 Q26 时启动。
- 实现路径选 G3-A（Radix HoverCard + RSC），不用 Quartz fetch-HTML 方案。
- 移动端降级为 tap-to-navigate，不阻塞阅读流。
- 验收必须含 e2e + 无 CSP 违规 + LH 桌面不回归。

这与 v2 把 G2 列为「折叠/次级原型」的思路一致：**花园能力升级必须以不破坏阅读体验为前提**。G0/G1/G2 已交付，G3 不是「必做」，而是「条件触发」。

---

## 26. 深度展开 · 卫生债为什么是 v3 的最低成本高收益项

v2 §51 表单已全部落地，但**文档数字漂移**问题在 v3 实测中暴露无遗：

- `launch-baseline.md` 仍写功能基线 `a91a07d`（实际 `ef77986`）
- `handoff-2026-07-21-garden.md` 写 tip `98568b6`（实际 `ef77986`）
- `README.md` 写「599 用例 / 77 文件」（实际 672/90）
- `AGENTS.md` 写「618 tests, 81 files」（实际 672/90）
- `TODO.md` 归档 HEAD 写 `61ffd47`（实际 `ef77986`）
- `architecture.md` 写「599 tests / 77 files」（实际 672/90）

这不是「文档过时」的小问题，而是**真实回归风险**：3 个月后接手者读 launch-baseline 会以为生产仍停留在 `a91a07d`，错误判断「G2 未上线」；读 README 测试数会低估覆盖率；读 TODO 归档 HEAD 会以为还有未 push 的提交。每个误判都会触发不必要的「重新验证」工作，浪费接手时间。

卫生包的最小集（H-A）：

1. `launch-baseline.md` 更新到 `ef77986` + 672/90 + 新 bundle 数字 + G2 上线行
2. `handoff-2026-07-21-garden.md` 更新到 `ef77986` 或新增 `handoff-2026-07-21-v3.md`
3. `README.md` 测试数 599/77 → 672/90
4. `AGENTS.md` 测试数 618/81 → 672/90
5. `TODO.md` 归档 HEAD `61ffd47` → `ef77986` + 新增 G2 上线行
6. `architecture.md` 测试数 599/77 → 672/90
7. `docs/overview.md` 挂链 v3 报告
8. 记忆 `blog-handoff-2026-07-21` tip 同步

总工作量：0.5 人日。风险：零（纯文档改动）。收益：消除 6+ 处文档漂移，重建接手者信任。

**卫生包禁止夹带**：换栈、依赖大升级、格式化全仓库无关文件、SRI 迁移、React Compiler 接入。这些项即使在本轮启动，也应独立成包，不混入卫生包。

---

## 27. 深度展开 · 安全与信任边界（v3 增 SRI 项）

v3 引入 SRI 评估，安全边界有新的注意点：

1. **MDX 仍是信任内容**：作者可控；wikilink 只生成站内路径，不开放任意 URL 协议。
2. **fail-closed 是安全特性也是可用性特性**：坏链在 CI 爆掉，好过生产给读者 404 内链。
3. **G3 popover 若做**：必须走 RSC Route Handler 返回受限 HTML 片段，禁止 `dangerouslySetInnerHTML` 全量 MDX。
4. **Giscus 与 Analytics 的 CSP allowlist 不因花园而扩张**。
5. **搜索投影继续禁止 searchText 泄露**；反链只暴露 PostMeta 公共字段。
6. **SRI 若迁移**：需新增 ADR 明确「SRI 不放宽 script-src，仅切换实现路径」；保留 nonce 回退路径；style-src 仍需处理。
7. **experimental 特性先 preview**：React Compiler/SRI 任何一项上生产前，必须有 preview 环境验证记录。

若未来做 G3 popover hover 预览，必须走服务端已渲染摘要或受限组件，而不是 `dangerouslySetInnerHTML` 全量 MDX。这与 v2 §27 的要求一致。

---

## 28. 深度展开 · 性能模型与「动态 HTML」的再辩护（v3 增 SRI 视角）

v2 §28 已论证「无 RUM，不回退 CSP」。v3 在 SRI 评估视角下补充：

批评者常说：个人博客应当全静态。本站回答分三层：

1. **资产静态**：图片、字体子集、`_next/static`、feed 仍可边缘缓存。
2. **文档动态**：因 nonce，HTML 带 per-request 策略；在 14 文规模下，成本通常可忽略。
3. **数据本地**：无数据库往返；TTFB 主要来自函数与框架，而非查询。

在缺少 Speed Insights p75 真值时，用 Lighthouse 实验室分驱动「放弃 nonce」是不道德的优化——它用不可比指标换安全基线。ADR 已写 revisit 条件；v2 重申：**无 RUM，不回退 CSP**。

**v3 补充**：SRI 是另一种「不放宽 CSP」的路径。若 SRI 在 preview 验证后证明能保持严格性 + 解锁 SSG/CDN/PPR，则它是 nonce 的**升级替代**而非「回退」。但这个判定需要：

1. ADR 明确 SRI 与 nonce 的严格性等价论证
2. preview 环境 CSP 回归测全绿
3. 用户表单确认「SRI 不算放宽安全基线」
4. 保留 nonce 回退路径

在以上四项全部满足前，v3 维持 R-A nonce 为已选；R-E SRI 仅评估。

花园 G0/G1/G2 对性能的影响（v3 不变）：

- 构图在服务端缓存，watch 内容目录；
- 反链是轻量列表，无客户端图布局；
- G2 力导向是 client component，但 reduced-motion 降级 + 自研纯函数 + 无 d3 依赖；
- 不增加搜索 payload。

因此花园不是性能敌人；**React Compiler 对 G2 的优化才是 v3 的性能焦点**。

---

## 29. 深度展开 · 与 v1/v2 评分的连续性说明

v1 §28–35 的 UX-1A、V-S1、P-A、R-A、S-A 在 v2 全部保留为已选或已交付。v2 新增 UX-1E 正文概念链、GD-1 维护 G0/G1、Q10–Q20 ship 清单。v3 在此基础上：

- **UX-1G G2 完成**（v3 关闭）；
- **UX-1H G3 popover** 列为条件触发；
- **N16-A React Compiler + FS cache** 列为推荐工程项；
- **R-E SRI** 列为评估项；
- **H-A 卫生债** 列为推荐卫生项；
- **Q21–Q30** 替换已完成的 Q10–Q20 作为 ship 清单。

这不是推翻 v1/v2 决议，而是决议落地后的**再规划**。任何试图把「已选 nonce」重开成 SSG/SRI 辩论的选项，应在用户表单确认前拒绝。

---

## 30. 工作量与排期假想（v3 供表单参考）

| 包                 | 人日量级      | 风险 | 产物                                    |
| ------------------ | ------------- | ---- | --------------------------------------- |
| R1 Q21+Q22+Q23+Q28 | 1–1.5         | 低   | 卫生 + React Compiler + FS cache + 内容 |
| R2 +Q24            | +0.25         | 低   | View Transitions                        |
| R3 +Q26            | +1–2          | 中   | G3 popover 原型                         |
| E1 Q25 SRI 评估    | 0.5–1         | 低   | ADR 草稿 + preview 验证记录             |
| Q27 G2 filter      | 0.25–0.5      | 低   | hover 高亮邻居                          |
| Q29 push           | 0.1 + 观察 CI | 发布 | 生产对齐                                |

建议同一次 ship **不超过 R3**；SRI 评估独立成包；G3 与 push 拆开决策。

---

## 31. 测试策略（v3 与 ship 对齐）

| 变更               | 最低测试                                        |
| ------------------ | ----------------------------------------------- |
| 仅 MDX 链          | wikilink + link-graph；抽检 getBacklinks        |
| 反链/邻接 UI       | ArticleBacklinks + ArticleNeighbors 测 + 页面测 |
| G3 popover         | 组件测 + e2e + CSP 违规检查                     |
| 文档               | format:docs:check + check:docs                  |
| React Compiler     | 全量 vitest + e2e + LH 桌面对比                 |
| Turbopack FS cache | dev 启动测 + build 测                           |
| SRI 评估           | preview CSP 回归测 + 手测 Giscus/Analytics      |
| View Transitions   | e2e + 手测 reduced-motion                       |

禁止：为了绿而删 fail-closed 测试；为了过 CI 而 `published: false` 藏坏链；为了开 React Compiler 而删手写 memo。

---

## 32. 发布与分叉剧本（v3 重置）

### 剧本 A · 继续本地（默认）

- 本地 tip 前进；生产不变（v3 起点已同步）。
- 记忆与 handoff 写清 ahead。
- 适合内容试验 + 工程评估。

### 剧本 B · 授权 push

1. 确认工作树 clean。
2. `git push`（用户明确同意）。
3. 盯 GitHub Actions。
4. `pnpm check:production-content -- --base-url=https://incca.ccwu.cc`。
5. 抽检一篇带反链 + 邻接的文章 HTML。
6. 抽检 `/garden` 力导向渲染。
7. 更新 launch-baseline / 记忆生产 HEAD。

### 剧本 C · 回滚

- 内容问题：revert 内容 commit。
- 功能问题：revert 功能 commit 并热修（需再授权）。
- React Compiler 问题：关 experimental，无需 revert。
- SRI 问题：未上生产，仅删 ADR 草稿。
- 禁止在未理解 diff 时 force push。

---

## 33. 读者旅程用例（v3 增 G2 场景）

1. **运维学习者**：读 VPS 初始化 → 文中/文末到 Docker → 反链看到 Nginx 与排障手册 → 完成「从装机到入口层」心智模型。
2. **前端学习者**：读 Next App Router → 链到性能文理解 LCP → 反链看到 TS 文 → 形成类型与运行时指标闭环。
3. **迷茫访客**：首页 ReadingPath → 精选文 → 搜索失败 → 空态回标签/列表/花园 → 不落到 404 死胡同。
4. **回访者**：从外部搜索进 Postgres 文 → 反链发现 Redis/Supabase → 停留时长上升。
5. **图谱爱好者（v3 新）**：进 `/garden` → 选「部署运维」专题 → 拖拽节点重排 → 保存视图 → 下次回访恢复。
6. **作者自己（v3 新）**：3 个月后回 handoff → 看到 `ef77986` + G2 已上线 → 30 分钟内知道下一刀是 G3 还是 React Compiler。

若 ship 包无法改善其中至少两条旅程，则包选小了或选歪了。

---

## 34. 决策树（v3 Agent 自检）

```text
用户是否要求换栈/CMS/Orama/现在 Pagefind/假 GSC/unsafe-inline？
  是 → 拒绝并引用本报告硬边界
  否 → 读表单 ship 包
       → 含 Q25 SRI 上生产？
            是且无 ADR + preview → 拒绝或降级为评估
            否 → 继续
       → 含 Q26 G3 popover？
            是 → 实施前确认移动端降级 + CSP 不变
            否 → 继续
       → 含 Q22 React Compiler？
            是 → dev + preview 验证全绿才保留
            否 → 继续
       → 含 Q29 push？
            是 → 实施后停等明确 push 授权语句
            否 → 只本地 commit
       → 实施 R* → 测 → 总结
```

---

## 35. 术语表（v3 增项）

| 术语               | 含义                                                  |
| ------------------ | ----------------------------------------------------- |
| G0                 | wikilink 解析与渲染                                   |
| G1                 | 反链索引与面板                                        |
| G2                 | 图谱可视化 UI（力导向 + 拖拽）                        |
| **G3**             | **popover preview（v3 候选）**                        |
| **G4**             | **graph filter 增强（v3 候选）**                      |
| fail-closed        | 坏链使检查失败而非静默                                |
| 延伸阅读链         | 文末列表型互链                                        |
| 概念链             | 正文叙述中的语义互链                                  |
| 混合轨道           | 内容 70 / 体验 20 / 卫生 10                           |
| nonce CSP          | 每请求脚本 nonce，优先于全站 SSG                      |
| **SRI**            | **Subresource Integrity，hash 锁定静态资源（v3 新）** |
| **React Compiler** | **React 编译期自动 memoization（v3 新）**             |
| ahead N            | 本地相对 origin 超前提交数                            |
| 生产分叉           | 访客看到的 commit ≠ 本地 tip                          |
| **卫生债**         | **文档数字与代码事实漂移（v3 新）**                   |

---

## 36. 长附录 · 逐方案「为何不选」备忘（v3 增项）

**迁 Astro**：Lighthouse 幻想收益 < 重写成本；Giscus/纸感/测试归零；与用户「锁 Next」冲突。
**迁 Quartz**：花园完整但作品集/策展/工程门禁错位；品牌重做。
**迁 Hugo**：技能栈断裂。
**Nextra 整站**：文档 IA 绑死。
**CMS**：单人 git 工作流被破坏。
**Algolia**：隐私/成本/YAGNI。
**Orama**：14 文 schema 开销 > 收益；与「锁本地」勉强兼容但不划算。
**MeiliSearch/Typesense**：需后端，违反硬约束。
**客户端全量 Fuse**：已淘汰的 payload 与 API 架构回退。
**unsafe-inline SSG**：安全基线崩坏。
**首屏力导向 G2**：品牌违和 + 性能风险 + 14 文玩具感（v3 已交付次级 `/garden`，不再扩为全站）。
**运营假完成**：违反用户跳过决议与诚实原则。
**SRI 直接上生产**：experimental + 需 ADR + 需用户表单确认（v3 新）。
**React Compiler 不验证直接上**：experimental + 需 preview 全绿（v3 新）。

把这些写进 v3，是为了让三个月后的 Agent 不必重新辩论。

---

## 37. 长附录 · 与历史审计条目的映射（v3 增项）

| 历史项             | v3 态度                                               |
| ------------------ | ----------------------------------------------------- |
| FE CSP vs SSG      | 维持 R-A；SRI 列为评估                                |
| BE JSON strict     | 保持                                                  |
| 搜索服务端化       | 保持 S-A；Orama 否决                                  |
| 文章 CLS           | next/font 已利好；O-B 可选                            |
| 运营 GSC           | X 级跳过                                              |
| 前后端分层         | 不可逆资产                                            |
| 纸感双轨收口       | V-S1 延续                                             |
| 花园               | G0→G1→G2 全交付；G3 评估                              |
| **Next 16.2 接入** | **React Compiler + FS cache 推荐；SRI 评估（v3 新）** |
| **卫生债**         | **H-A 推荐包（v3 新）**                               |

---

## 38. 长附录 · Ship 包到文件落点映射（v3 增项）

| 包项                 | 主要落点                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q21 卫生             | `docs/launch-baseline.md` · `docs/handoff-2026-07-21-garden.md` · `README.md` · `AGENTS.md` · `TODO.md` · `docs/architecture.md` · `docs/overview.md` · 记忆 |
| Q22 React Compiler   | `next.config.ts` · 受影响组件测                                                                                                                              |
| Q23 FS cache         | `next.config.ts` · dev 测                                                                                                                                    |
| Q24 View Transitions | `next.config.ts` · `<Link transitionTypes>`                                                                                                                  |
| Q25 SRI ADR          | `docs/adr/2026-07-21-sri-over-nonce-evaluation.md`（新建）                                                                                                   |
| Q26 G3 popover       | `src/components/blog/WikilinkPopover.tsx`（新建）· `src/app/api/preview/[slug]/route.ts`（新建）· 测                                                         |
| Q27 G2 filter        | `GardenExplorer.tsx` · `force-layout.ts`                                                                                                                     |
| Q28 正文概念链       | `content/blog/*.mdx`                                                                                                                                         |
| Q29 push             | git 远程（需授权）                                                                                                                                           |

---

## 39. 长附录 · 成功指标（v3 增 G2 项）

短期（本周 ship 后）：

- 本地抽检 5 篇文章，反链非空比例上升或保持；
- 无坏链；
- 文档数字与 git/test 实测一致（卫生包验收）；
- React Compiler 若接入：dev + preview 全绿。

中期（push 后）：

- 生产 HTML 含 article-backlinks + article-neighbors；
- `/garden` 可访问且力导向渲染正常；
- 搜索与 404 出口可用；
- CI 持续绿。

长期（内容增长）：

- 主题簇连通度上升；
- 仍不需要外部搜索；
- 仍不需要换栈；
- SRI 若迁移：CSP 严格性等价 + SSG 解锁 + ADR 状态明确。

---

## 40. 结束语（v3）

西江月已经越过「能不能做个人站」「能不能做花园最小闭环」「能不能做完整 G2 路由」三个阶段。现在的主问题是**克制与升级的平衡**：克制换栈冲动、克制图谱炫耀、克制用实验室分数绑架安全、克制把运营账号工作写成代码胜利；同时在「不放宽硬边界」前提下，评估 Next 16.2 工程红利（React Compiler + FS cache）与架构升级（SRI）的真实收益。

把 70% 的精力还给句子与链接的质量，把 20% 还给 G3 popover 等体验升级（条件触发），把 10% 还给文档同构与工程红利接入——这就是 v3 认为最符合目标、约束与已付成本的最佳方案。

用户表单将从第 14 章清单中选择；`/ship` 只执行被选且不与硬边界冲突的项。生产是否跟上，仍握在用户的 push 授权里。SRI 是否启动，握在用户的「SRI 不算放宽安全基线」确认里。

---

## 41. 补充评分表 · Next 16.2 接入策略细案（v3 新）

| 方案        | 描述                                | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | 加权   |
| ----------- | ----------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ |
| **N16-A ★** | React Compiler + FS cache，不开 SRI | 8    | 8    | 9    | 8    | 8    | 8    | **82** |
| N16-B       | 全开（含 SRI + View Transitions）   | 9    | 5    | 7    | 6    | 5    | 9    | 70     |
| N16-C       | 不开                                | 5    | 10   | 10   | 9    | 9    | 5    | 75     |
| N16-D       | 仅开 View Transitions               | 6    | 8    | 9    | 7    | 8    | 7    | 72     |

**最佳 N16-A**：React Compiler + FS cache 是「免费午餐」；SRI 单列 R-E 评估；View Transitions 可选。

---

## 42. 补充评分表 · SRI 迁移策略细案（v3 新）

| 方案       | 描述                              | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | 加权   | 结论               |
| ---------- | --------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ | ------------------ |
| **R-E1 ★** | 仅写 ADR + preview 验证，不上生产 | 7    | 9    | 10   | 9    | 9    | 8    | **85** | **评估推荐**       |
| R-E2       | 直接上生产（含 ADR）              | 9    | 5    | 6    | 6    | 4    | 9    | 65     | 否（experimental） |
| R-E3       | 暂不评估                          | 4    | 10   | 10   | 9    | 9    | 5    | 70     | 保守               |
| R-E4       | 等 Next 16.3 stable 再评估        | 7    | 9    | 9    | 8    | 9    | 7    | 80     | 可作 R-E1 后续     |

**最佳 R-E1**：把 SRI 写成 ADR 草稿 + preview 验证记录，作为评估项存在，不在本轮上生产。这与「experimental 先 preview」原则一致。

---

## 43. 补充评分表 · G3 popover 实现路径细案（v3 新）

| 方案       | 描述                                | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | 加权   | 结论           |
| ---------- | ----------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ | -------------- |
| **G3-A ★** | Radix HoverCard + RSC Route Handler | 8    | 6    | 8    | 7    | 7    | 8    | **73** | 推荐（若启动） |
| G3-B       | Quartz fetch-HTML 方案              | 6    | 4    | 6    | 4    | 4    | 6    | 53     | 否             |
| G3-C       | 全文 MDX 注入 popover               | 7    | 3    | 4    | 3    | 3    | 6    | 45     | 否             |
| G3-D       | 不做                                | 5    | 10   | 10   | 9    | 9    | 5    | 75     | 保守           |

**最佳 G3-A**：Radix HoverCard 是 shadcn 生态已有依赖；RSC Route Handler 返回受限 HTML 片段；移动端降级 tap-to-navigate。但仍属「条件触发」——用户表单未勾选则不做。

---

## 44. 执行检查单（v3 打印级）

- [ ] 读完 v3 文首硬决议
- [ ] 读完 v2 §51 落地核对（已全部交付）
- [ ] 读完用户表单
- [ ] 确认无 Q30
- [ ] 列出将改文件
- [ ] 实装
- [ ] 跑最低测试集
- [ ] 更新 TODO/文档（若在范围）
- [ ] 本地 commit（若有变更）
- [ ] 无授权则不 push
- [ ] SRI 评估仅 ADR + preview，不上生产
- [ ] React Compiler 接入前 dev + preview 全绿
- [ ] 输出总结：HEAD / ahead / 生产 / 完成项 / 未做项

---

## 45. 场景剧本 · v3 三种读者与三条失败路径（增 G2）

### 45.1 读者甲：要上线个人服务的工程师

他从搜索引擎或首页精选进入「VPS 初始化」。若正文只有清单没有出口，他会以为站点只是碎片笔记；若文末有 Docker/Nginx 链接且反链在 Docker 页能指回来，他会形成「路线」感。**v3 新增**：他也可以从 `/garden` 选「部署运维」专题，看到 5 篇运维文的力导向图，理解整个簇的拓扑。失败路径仍是：链接存在但打不开（坏链）——这正是 fail-closed 要消灭的。

### 45.2 读者乙：只关心前端的访客

他读 Next App Router，对 VPS 无感。若我们为了图谱把前端文强链到 VPS，他会感受到噪音。正确做法是链到性能与 TypeScript，形成「写组件 → 懂渲染成本 → 用类型约束接口」的闭环。**v3 新增**：G2 `/garden` 让他可以筛选「前端」标签，只看 Next/性能/TS 三节点 + 互边，不被运维文干扰。失败路径是「全站强行一张图」，让前端文和运维文缠成毛线球——G2 的 tag filter 已部分缓解。

### 45.3 读者丙：迷路者

他乱点搜索、点过期外链、或手打错误 slug。体验包的意义是让他在两次点击内回到有意义的列表。**v3 已交付**：404 有 6 出口、搜索空态有 5 出口、反链空态有说明文案。失败路径已基本消灭。

### 45.4 作者自己

作者三个月后回来，应在三十分钟内从 handoff 知道：花园已交付到 G2、生产同步 `ef77986`、下一刀是 G3 还是 React Compiler。**v3 卫生包（Q21）就是为这个场景而存在**。失败路径是文档仍写 `a91a07d`、仍写 599 测、TODO 归档 HEAD 仍是 `61ffd47`——作者会误判状态。

---

## 46. 反链产品细节 · 交互规格补充（v3 增邻接项）

### 46.1 排序

保持日期倒序、同日 slug 升序，与 `getBacklinks` 现行实现一致。不要改为「按相关度」除非引入可测算法。

### 46.2 数量

当入边 ≤5，全部展示。当入边 >5，默认展示 5，提供「还有 k 条」展开（**已交付**）。展开仍是服务端已给的列表切片，不需要二次请求。

### 46.3 空态

维持一句说明，不使用大插画抢文章结尾阅读余韵。空态不是错误。

### 46.4 与系列、相关、上下篇、邻接的分工（v3 增邻接）

| 模块     | 语义                             |
| -------- | -------------------------------- |
| 系列路径 | 编辑排好的线性课程               |
| **邻接** | **本文出/入边直接邻居（v3 新）** |
| 反链     | 他人（文）引用我                 |
| 相关     | 算法/标签相似                    |
| 上下篇   | 时间线邻接                       |

五者并存可以，但文案与视觉权重应递减：系列 ≈ 邻接 ≈ 反链 > 相关 > 上下篇。不要五个一样大的卡片墙。

### 46.5 G3 popover 与反链的关系（v3 新）

G3 popover 是 wikilink 的 hover 预览；反链是「谁指向我」的列表。两者互补：popover 服务「我要去哪里」，反链服务「谁来到我这里」。G3 若做，不替换反链，只增强 wikilink 体验。

---

## 47. 文中 wikilink 的编辑手册（v3 不变）

1. 先写清论点，再考虑链接；链接是论点的支架，不是装饰。
2. 显示名用读者能懂的短语，避免 `[[slug]]` 裸露技术 id 在中文段落中跳戏；必要时 `[[slug|中文名]]`。
3. 同一段落不超过两条站内链，以免变成蓝字海洋。
4. 代码块、配置示例中的双方括号必须保持在围栏内，依赖解析器保护。
5. 新增 slug 前先确认文件名去日期前缀后的结果。
6. 改 slug 等于改链——本站无自动重定向层；改前全局搜旧 slug。
7. 合并前本地打开被链页，看反链是否出现自己。

---

## 48. 与「销售向改版」文档的边界（v3 不变）

历史上的 SalesDex 启发改版解决的是首页叙事与纸感气质，不是知识网络。v3 明确：**首页不再为花园让路**。G2 `/garden` 已是次级路由，不替换 EditorialHero。品牌承诺仍是「安静可读的工程站」，不是「第二大脑仪表盘」。

---

## 49. 成本会计 · v3 增项

假设作者时间是唯一货币：

- 卫生包 Q21：0.5 人日，收益「文档同构 + 接手者信任」。
- React Compiler Q22：0.25-0.5 人日，收益「G2 re-render 优化 + dev 提速」。
- FS cache Q23：0.1 人日，收益「dev 重启秒级」。
- View Transitions Q24：0.25 人日，收益「文章切换动画」。
- SRI 评估 Q25：0.5-1 人日，收益「ADR + preview 记录，未来升级路径明确」。
- G3 popover Q26：1-2 人日，收益「数字花园核心体验升级」。
- G2 filter Q27：0.25-0.5 人日，收益「图谱可用性提升」。
- 正文概念链 Q28：0.5-1 人日，收益「主题簇连通度 + 读者下一篇点击率」。
- 重写到 Astro/Quartz 并恢复测试、CSP、Giscus、纸感、作品集、G0/G1/G2：周到月级，且有回归空洞。

在没有「多人协作写库」或「十万 PV 性能灾难」的前提下，用周级成本换实验室分或花园皮肤，是不理性的。v3 把最佳方案钉在增量与工程红利，是成本会计结果，不只是品味。

---

## 50. 观测与日志 · 我们故意不做什么（v3 不变）

- 不在客户端对每条 wikilink 打点（隐私与噪音）。
- 不用 Lighthouse 分代替 RUM p75。
- 不把 GSC「已验证」写进代码注释。
- 不建独立分析库统计图谱点击，除非未来单独立项。
- **v3 新增**：不为 React Compiler 接入引入额外性能打点；信任 e2e + LH 桌面对比。
- **v3 新增**：不为 SRI 评估引入生产 CSP 违规日志；preview 验证足够。

需要数据时，优先：生产 smoke 列表、CI 产物、作者手测清单。

---

## 51. 最终推荐声明（v3 可引用）

> 在锁 Next、锁 nonce CSP（SRI 列为评估）、锁本地 MDX、跳过运营、不迁 Quartz 的前提下，西江月下一阶段最佳方案是：**优先清理 v2 落地后的文档卫生债（Q21），接入 Next 16.2 React Compiler + Turbopack FS cache 工程红利（Q22/Q23），继续推进正文概念链内容（Q28）；G3 popover preview 仅在用户表单勾选时启动（Q26）；SRI 迁移仅写 ADR + preview 验证，不在本轮上生产（Q25）；任何换栈、CMS、搜索集群、假运营完成、experimental 直接上生产均拒绝。生产对齐仅在用户授权 push 后执行。**

该声明与文首决议、第 8/10/14 章评分、第 18 章论证一致，作为 `/ship` 与后续 Agent 的仲裁锚点。

---

## 52. 交互表单决议录入（占位，待用户填写）

v3 表单将在对话中以 AskUserQuestion 形式呈现。用户提交后，本节录入决议；执行阶段严格按本节与硬边界交集实施。

| 决策       | 用户选择 | 执行含义 |
| ---------- | -------- | -------- |
| 主 Ship 包 | _待填_   | _待填_   |
| SRI 评估   | _待填_   | _待填_   |
| G3 popover | _待填_   | _待填_   |
| Next 16.2  | _待填_   | _待填_   |
| 内容策略   | _待填_   | _待填_   |
| Push       | _待填_   | _待填_   |
| 禁止项确认 | _待填_   | _待填_   |

---

**字数说明**：本 v3 在结构完整的前提下以中文论述为主体，正文汉字数经统计 ≥ 10000（统计命令：`grep -oP '[\x{4e00}-\x{9fff}]' D:\blog\docs\architecture-optimization-research-2026-07-21-v3.md | wc -l`），供决策与 ship 引用；与 v1/v2 合计构成完整证据链。实施时以本章清单与用户表单交集为准。

---

_本报告为决策与规格层。实施以用户表单 + `/ship` 流水线为准；TODO.md 仍是未完成事项 SSOT。_
