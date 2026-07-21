# 西江月博客 · 架构优化整合调研报告 v2

> **状态**：决策与规格 SSOT 补充稿（2026-07-21 下午 · **第三轮**）  
> **路径**：`D:\blog` · 生产：`https://incca.ccwu.cc`  
> **本地 tip**：`3fc3632` · 功能基线花园 **`b96b3c3`** · 边密度 **`7202172`** · origin/生产 **`dfc057b`** · **ahead 5 未 push**  
> **相对 v1**：`architecture-optimization-research-2026-07-21.md` 仍保留为第一/二轮决策与评分史；**本 v2 以落地后事实重扫 + 下一阶段决策为主**，不改写 v1 历史数字。  
> **待办 SSOT**：根 `TODO.md` · 接手：`docs/handoff-to-agent.md` · 架构：`docs/architecture.md` · 收工：`docs/handoff-2026-07-21-garden.md`

### 文首决议继承（不可推翻，除非用户新表单改写）

| 决策      | 选择                                     | 含义                                 |
| --------- | ---------------------------------------- | ------------------------------------ |
| 主轨道    | **混合：内容 70% + 体验 20% + 卫生 10%** | 剧本 S5；禁止并行换栈                |
| 平台/渲染 | **锁 Next + nonce CSP**                  | P-A + R-A；禁 `unsafe-inline` 换 SSG |
| 内容形态  | **Next 内数字花园增量**                  | **不迁 Quartz**；G0→G1→（条件）G2    |
| 运营      | **继续跳过**                             | GSC/Bing/RUM 不假完成                |
| 交付边界  | **本地 commit；push 另授权**             | 生产仍 `dfc057b`                     |

### v2 新增结论（一句话）

G0/G1 已闭环且边密度从「三角 5 边」跃到 **约 47 条 wikilink**；下一阶段的正确问题**不再是「要不要花园」**，而是：**在锁架构前提下，把 70% 预算砸在「可读的下一篇」与诚实的体验打磨，还是过早画 G2 玩具图 / 换栈幻想。**

---

## 0. 执行摘要

### 0.1 产品定位（未变）

西江月 = **可复用工程笔记 + 可信作品集 + 策展导航**，安静、可读、可验证、可接手。  
形态上已从纯「出版型博客」**叠加**数字花园能力（wikilink / 反链），但信息架构仍是个人品牌站，不是 Obsidian vault 发布器。

### 0.2 进度快照（2026-07-21 第三轮实测）

| 项            | 值                                                | 证据                                     |
| ------------- | ------------------------------------------------- | ---------------------------------------- |
| 生产域名      | `https://incca.ccwu.cc`                           | launch-baseline / live                   |
| origin HEAD   | `dfc057b`                                         | 真截图 + 专题 + GitHub 身份              |
| 本地 master   | tip `3fc3632` · **ahead 5**                       | `git status`                             |
| 花园功能      | G0+G1 **已合入** `b96b3c3`                        | wikilink + link-graph + ArticleBacklinks |
| 边密度        | **47** 条 `[[…]]`（14 篇全覆盖）                  | 正文三角 + 延伸阅读 42 条迁移 `7202172`  |
| 内容规模      | **14** 文 · **6** 项目 · **10** 类 **123** 链     | `content/` + `data/`                     |
| 栈            | Next **16.2.9** · React **19.2.4** · Fuse **7.4** | package.json                             |
| 质量门禁      | Vitest 600+ · Playwright 48 · LH/SEO/docs/smoke   | handoff / launch-baseline                |
| 渲染          | 动态 HTML + **CSP nonce**                         | ADR 2026-07-17                           |
| 工程 TODO     | 仅外部账号 + 条件触发 + **G2 开**                 | TODO.md                                  |
| 本机 dev 注意 | **:3000 常被 NewAPI 占用**；博客冒烟用 **:3001**  | 实机                                     |

### 0.3 核心结论（v2）

1. **仍然不要换栈**（Astro / Hugo / Quartz / Nextra 全量迁移 ROI 为负；沉没成本含 600+ 测、纸感、nonce CSP、Giscus）。
2. **仍然不要上 CMS / Meili / Algolia / 独立后端**（14 文；门槛未到）。
3. **G0/G1 验收可关闭为「已交付」**；延伸阅读 wikilink 化使 **G1 反链面板从样例三角变成全站有信号**。
4. **G2 仍默认不做**：边已够「有图可画」，但**首屏力导向图**对品牌与性能的边际收益仍低；若做，必须是**次级/折叠 + reduced-motion 列表降级**。
5. **下一里程碑默认包**（待表单确认）：**内容互链加深 + 体验打磨（搜索/404/反链细节/CLS）+ 文档卫生（AGENTS 搜索描述）**；运营与换栈仍禁。
6. **push 仍门控**：未授权不推；生产与本地分叉需在总结中诚实写清。

### 0.4 推荐默认组合（若用户不改偏好）

| 决策点   | 推荐                                   | 加权直觉        |
| -------- | -------------------------------------- | --------------- |
| 平台     | P-A 锁 Next                            | 92              |
| 渲染     | R-A nonce                              | 88              |
| 搜索     | S-A Fuse API                           | 90              |
| 视觉     | V-S1 纸感守恒 + 花园融 article-ui      | 90.5            |
| 花园深度 | G0+G1 维护；G2 条件触发                | 86 / G2 全量 55 |
| 下一主包 | **内容深化 70 + UX 可选 20 + 卫生 10** | 见 §14          |

---

## 1. 调研范围与方法

### 1.1 问题陈述（第三轮）

在 **G0/G1 已实现、边密度已抬升、生产未含花园** 的分叉状态下：

1. 如何把 v1 决议、落地事实、同类 2025–2026 经验整合为**可决策**的下一阶段规格？
2. 架构优化 / 技术债 / UX / 视觉各有哪些**多方案**？如何评分？
3. 目标、约束、边界、输入输出、验收如何写成 **ship 可执行** 的问题清单？
4. 用交互表单收敛后，如何用 `/ship` 把选定项做到最佳效果？

### 1.2 输入材料

| 类别     | 路径                                                                                                         | 角色                          |
| -------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| v1 报告  | `architecture-optimization-research-2026-07-21.md`                                                           | 第一/二轮决议与 §28–35 评分史 |
| 维护文档 | TODO / overview / architecture / handoff / API / css-conventions / launch-baseline / ops / performance       | 操作真值                      |
| ADR      | `2026-07-17-csp-nonce-over-ssg` · `0002-local-content-repository-factory`                                    | 已接受决策                    |
| 花园交接 | `handoff-2026-07-21-garden.md` · 记忆 `blog-handoff-2026-07-21`                                              | 本轮 git 真相                 |
| 代码事实 | `wikilink.ts` · `remark-wikilink.ts` · `link-graph.ts` · `ArticleBacklinks` · `page.tsx` · tokens/article-ui | 实现真值                      |
| 历史     | full-stack-audit / frontend-ui / salesdex / runs 2026-07-18                                                  | 不改写数字                    |
| 外部对照 | Quartz 哲学与特性、Astro 花园实践、Next MDX 个人站、CSP/SSG 张力、Fuse/Pagefind 规模                         | 2025–2026                     |

### 1.3 方法

1. **仓库事实优先**（git / 计数 / 冒烟 / 单测）。
2. **文档分层**：维护 vs 历史快照 vs 决策报告。
3. **每决策点 ≥3 方案**，加权评分（读者价值 / 成本 / 约束 / 维护 / 风险 / 品牌）。
4. **门槛驱动**：未到门槛 = 正确终态。
5. **冲突显式化**：行业「静态优先」vs 本站「nonce 优先」；「Quartz 原生花园」vs「作品集品牌站」。

### 1.4 非目标

- 不伪造 GSC/RUM 完成。
- 不复活已归档 P0–P10。
- 不在报告阶段擅自 push/deploy。
- 不把 v1 正文历史数字改写成「仿佛一直如此」。

---

## 2. 项目现状深度扫描（落地后）

### 2.1 产品能力地图

| 能力            | 状态       | 要点                                                           |
| --------------- | ---------- | -------------------------------------------------------------- |
| 博客 MDX        | 上线       | Zod frontmatter · draft 过滤 · series                          |
| **Wikilink G0** | **已交付** | `[[slug]]` / `[[slug\|label]]` → `/blog/{slug}` · 代码区不解析 |
| **反链 G1**     | **已交付** | link-graph 缓存 · fail-closed 坏链 · ArticleBacklinks          |
| **G2 图谱 UI**  | **未做**   | 无 Graph 组件/路由占位；仅文档规划                             |
| 专题/标签/分类  | 上线       | series · tags · category 推断                                  |
| 作品集          | 上线       | 6 项目 · 真截图 · blur                                         |
| 收藏导航        | 上线       | 10 类 123 链                                                   |
| 搜索            | 上线       | `GET /api/search` Fuse · 投影 DTO · 空态已导流                 |
| 评论            | 上线       | Giscus + CSP                                                   |
| SEO 工程        | 完成       | sitemap/robots/JSON-LD/OG/RSS；账号侧 pending                  |
| 安全            | 上线       | nonce CSP · 无 remotePatterns                                  |
| 纸感视觉        | 上线       | Paper Gallery · tokens 双主题 · article-ui 反链样式            |

### 2.2 文章页信息架构（源码顺序）

```text
ArticleJsonLd → ReadingProgress → ReadingPreferences
→ ArticleHeader → TOC(mobile) → MdxContent
→ ArticleSeriesPath → ArticleBacklinks → Giscus
→ ArticleRelated → ArticleNav
→ aside TOC(desktop)
```

**含义**：反链已是一等公民，紧贴系列路径；G2 若出现，**禁止**插到 LCP 关键路径前。

### 2.3 首页叙事（源码顺序）

```text
EditorialHero → Manifesto → ReadingPath → FeaturedArticleRail
→ CuratedLinksPreview → Projects（条件）→ HomeCta
```

### 2.4 分层与数据流（含花园）

```text
content/blog/*.mdx
  → parse + Zod + repository (filenameToSlug)
  → extractWikilinks / remarkWikilink → HTML 内链
  → link-graph createCache → reverse index
  → server/content.getBacklinks
  → ArticleBacklinks

components ─HTTP─► /api/search ─► server/search ─► Fuse
禁止 client/lib 反向 import @/server
```

### 2.5 边密度实测（驱动 G2 门槛）

| slug（示意）             | `[[` 约数 | 备注                                                                        |
| ------------------------ | --------- | --------------------------------------------------------------------------- |
| docker-deploy-guide      | 5         | 正文 2 + 延伸 3                                                             |
| vps / nginx / cloudflare | 4         |                                                                             |
| 其余 10 篇               | 3         | 多为延伸阅读                                                                |
| **合计**                 | **47**    | 含 cloudflare 代码围栏内 `[[kv_namespaces]]` **不计入语义边**（代码区保护） |

**有向语义边粗估**：延伸阅读 42 + 正文互链若干 ≈ **40+ 有效边**，已超过 v1 建议的「≥15 边才谈 G2 原型」门槛的**数量**条件；但 **质量/导航价值**仍高度依赖「延伸阅读列表」形态——读者在文末才看到，不等于文中概念网。

**G2 门槛 v2 修订**：

| 条件   | v1     | v2                                                           |
| ------ | ------ | ------------------------------------------------------------ |
| 边数量 | ≥15    | **仍建议 ≥15**（已满足）                                     |
| 边质量 | 未强调 | **正文区概念链 ≥10** 或 **≥3 个强连通主题簇** 再做首屏外图谱 |
| UI     | 可原型 | **默认折叠/次级路由**；禁止首页力导向                        |

### 2.6 工程成熟度

相对同类个人站：仍处 **工程化上限区**（边界测试、docs CI、ops-readiness、生产 smoke、nonce CSP）。  
边际收益：**内容深度与阅读完成路径** ≫ 平台重构。

### 2.7 分叉风险（诚实）

| 面         | 状态                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| 生产访客   | **看不到** 花园与延伸阅读 wikilink                                     |
| 本地/CI 绿 | 功能与内容已在本地 tip                                                 |
| 风险       | 长期 ahead 导致记忆/文档与生产漂移；push 后需 production-content smoke |

---

## 3. 历史文档整合与单一叙事

### 3.1 时间线（校正后）

1. **07-06** 优化路线：架构 / UX / 视觉渐进。
2. **07-12** UI 双轨收口 + 搜索可分享 `?q=`（后演进 API 搜索）。
3. **07-17** 全栈审计 + CSP ADR + JSON strict。
4. **07-18** `src/server` 分层 + ops-readiness；工程 TODO 关闭。
5. **07-19** 真截图 / 专题 / GitHub 身份；用户跳过运营。
6. **07-21 上午** v1 调研 + 表单：混合轨道 + 花园 + nonce。
7. **07-21 中** Ship G0/G1 + 三角样例；commit 不 push。
8. **07-21 下午** 延伸阅读 42 条 wikilink 化；冒烟 :3001；**本 v2**。

### 3.2 已知漂移（卫生债入口）

| 现象                              | 处理                                      |
| --------------------------------- | ----------------------------------------- |
| `AGENTS.md` 仍写 client-side fuse | **D2-1 优先** 改为 API 搜索               |
| handoff 表仍写 Vitest 618 口径    | 以当前 `pnpm test` 为准，报告不伪造       |
| TODO 归档 HEAD 与 tip 不一致      | 描述「工程关闭」仍真；HEAD 前进是产品增量 |
| v1 写「边密度不足禁 G2」          | v2 改为「数量够、质量/位置不足则仍慎 G2」 |

### 3.3 文档拓扑

```text
维护：README AGENTS TODO overview architecture handoff API …
决策：adr/*
设计：specs/*（已实施不追改数字）
历史：日期报告 + superpowers/runs/*
决策报告：v1 + **本 v2**
```

---

## 4. 同类项目经验（2025–2026 刷新）

### 4.1 对照矩阵

| 维度     | 西江月            | Quartz 4/5                | Astro + Collections | Hugo     | Nextra    | 典型 Next MDX |
| -------- | ----------------- | ------------------------- | ------------------- | -------- | --------- | ------------- |
| 内容     | MDX+JSON+Zod      | Obsidian MD               | MD/MDX+schema       | MD       | MDX       | MDX           |
| 花园     | **自研 G0/G1**    | **原生** wikilink/反链/图 | DIY / 社区          | 主题插件 | 弱        | DIY           |
| 默认渲染 | 动态+nonce        | 静态 SPA 感               | 静态/少 JS          | 全静态   | Next 混合 | 常 SSG        |
| 作品集   | 一等 JSON         | 弱                        | 可做                | 主题     | 非焦点    | 常见偏浅      |
| 门禁     | 极强              | 弱–中                     | 中                  | 中       | 中        | 多数更弱      |
| 适合     | 工程品牌+花园增量 | 纯笔记网                  | 内容性能+混合       | 海量 MD  | 文档      | React 生态    |

### 4.2 分栈优缺点（对本站目标）

#### Quartz

- **优点**：wikilink/backlink/graph/search **开箱**；Obsidian 工作流顺；构建轻。见 [Quartz 哲学](https://quartz.jzhao.xyz/philosophy)、[站点](https://quartz.jzhao.xyz/)。
- **缺点**：产品是「第二大脑发布」，不是「作品集 + 策展 + 严格 CSP 工程博客」；迁移 = 放弃纸感、Giscus 集成方式、600+ 测、Vercel 交互岛。
- **可借鉴**：反链默认存在、图谱**不**抢内容；popover 预览（远期可选）。
- **结论**：**不整迁**；本站已用「最小自研」吃到 80% 发现价值。

#### Astro Content Collections

- **优点**：默认少 JS、Lighthouse 友好、集合 Zod。社区有 Obsidian→Astro 花园实践（如 [emgoto 2025](https://www.emgoto.com/obsidian-digital-garden/)、[astro-digital-garden](https://github.com/stereobooster/astro-digital-garden)）。
- **缺点**：重写 React 组件树、测试、CSP 策略、品牌 CSS。
- **可借鉴**：集合即契约叙事；Pagefind 流程（**≥200 文**后再说）。
- **结论**：对照学习，不迁。

#### Hugo / PaperMod 类

- **优点**：极快静态、主题成熟。
- **缺点**：与 TS/React 技能与现有资产割裂。
- **结论**：否。

#### Nextra

- **优点**：文档 UX、TOC、搜索。
- **缺点**：文档站 IA；作品集/纸感需重做。
- **可借鉴**：阅读节奏（本站 TOC/阅读设置已有）。
- **结论**：不整迁。

#### 成功 Next 个人站（Comeau / Lee 等共性）

- 本地 MDX、重阅读体验、搜索保持简单、**诚实性能叙事**。
- Josh 自述个人博客几乎无测试；本站测试**更重**——差异化资产。
- 参考：[Josh 建站](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/)、[Lee stack](https://leerob.com/stack)、[Next CSP](https://nextjs.org/docs/app/guides/content-security-policy)。

### 4.3 搜索行业

| 方案          | 甜点          | 本站         |
| ------------- | ------------- | ------------ |
| Fuse API      | 数十–数百文   | **当前最优** |
| Pagefind      | 静态海量 HTML | 门槛后       |
| Algolia/Meili | 大语料/商业   | **不做**     |

### 4.4 CSP nonce vs SSG

行业爱静态 CDN；本站因 Giscus/Analytics、Accepted ADR、交互岛，**坚持 R-A**。资产层仍可缓存。无 RUM 前不臆测 Function 成本。

### 4.5 可迁移细节（不换栈）

| 来源     | 细节               | 落点                             |
| -------- | ------------------ | -------------------------------- |
| Quartz   | 反链默认、图不抢戏 | 已有反链；G2 折叠                |
| 文档站   | 下一步阅读         | ReadingPath / Related / 延伸阅读 |
| 静态站   | 字体 CLS           | D1-2/D1-3                        |
| Comeau   | 文内 demo 克制     | MDX 白名单                       |
| SalesDex | 章节首页           | 已落地，勿再堆装饰               |

---

## 5. 技术债清单（v2 刷新）

### 5.1 级别

| 级    | 定义                             |
| ----- | -------------------------------- |
| D0    | 生产正确性/安全（当前无开放 D0） |
| D1    | 用户可感知体验                   |
| D2    | 工程卫生                         |
| D3    | 规模化预留                       |
| X     | 外部账号                         |
| **G** | 花园演进（本站新增标签）         |

### 5.2 明细

| ID    | 级  | 描述                    | 触发              | 建议                |
| ----- | --- | ----------------------- | ----------------- | ------------------- |
| X1–X3 | X   | GSC/Bing/RUM            | 用户账号          | 跳过；禁假完成      |
| D1-1  | D1  | 移动 lab FCP/LCP        | 手测/RUM          | 调查 CSS；不阻塞    |
| D1-2  | D1  | 文章 lab CLS            | 文章页            | 字体/骨架           |
| D1-3  | D1  | 中文字体策略            | 阅读页            | Noto 子集评估       |
| D1-4  | D1  | 首页动画岛              | INP               | 审计减负            |
| D1-5  | D1  | 移动 TOC/反链重叠       | 390 宽            | 手测验收            |
| D1-6  | D1  | 反链「最多 N + 还有 k」 | 入边多的 slug     | 体验增强            |
| D1-7  | D1  | 404 导流                | 可选              | 链到搜索/热门       |
| D2-1  | D2  | AGENTS 搜索描述过时     | 文档              | **卫生包优先**      |
| D2-2  | D2  | Stryker 未进主 CI       | 工具              | 文档化或移除        |
| D2-3  | D2  | CI 双重 build           | 时长              | 可选                |
| D2-4  | D2  | deploy ≠ CI 产物        | 保真              | smoke 兜底          |
| D2-5  | D2  | baseline HEAD 钉 tip    | 文档              | push 后更新         |
| D3-1  | D3  | 外部搜索                | ≥200 文/p95       | ADR                 |
| D3-2  | D3  | 正文图 LQIP             | 有 blog 图        | gen:blur            |
| D3-3  | D3  | prose CSS 下沉          | Coverage          | 禁无证据            |
| D3-4  | D3  | Cache Components        | 外部数据          | 指南                |
| D3-5  | D3  | 项目 MDX 复盘           | 产品需要          | content/projects    |
| G-1   | G   | **正文区**概念链不足    | 内容 70%          | 改 MDX 非堆延伸阅读 |
| G-2   | G   | G2 UI                   | 质量门槛+用户勾选 | 次级/折叠           |
| G-3   | G   | 生产未含花园            | **用户 push**     | 门控                |
| G-4   | G   | wikilink 在 TOML 示例   | 已有代码保护      | 保持；测覆盖        |

### 5.3 治理原则

1. 门槛未到不做。
2. 账号项不改代码假装完成。
3. 体验债优先有浏览器证据。
4. 花园边：**延伸阅读批量链 ≠ 概念网**；内容轨道要写「文中自然句」。

---

## 6. 目标 · 约束 · 边界

### 6.1 北极星

**可复用工程笔记 + 可信作品集 + 策展导航**，并在不破坏安全与品牌的前提下提供**轻量数字花园导航**。

### 6.2 目标树

| ID     | 目标         | 可观测                            |
| ------ | ------------ | --------------------------------- |
| G1     | 可信工程     | strict JSON · SEO · smoke         |
| G2     | 安全基线     | 无 script `unsafe-inline`         |
| G3     | 阅读体验     | CLS/字体/TOC/反链可达             |
| G4     | 发现路径     | 2 次点击；wikilink+反链+系列+搜索 |
| G5     | 内容增长     | 文量/专题/项目叙事                |
| G6     | 可维护       | 30 分钟接手                       |
| G7     | 可选运营     | GSC/p75 真值                      |
| **G8** | **花园诚实** | 生产与文档一致；坏链 fail-closed  |

### 6.3 非目标

- 多作者 CMS、账号体系、付费订阅
- 独立微服务、搜索集群
- 为 SSG 放宽脚本 CSP
- 全站视觉推倒 / Quartz 整迁
- 无门槛全站力导向图
- 运营假完成

### 6.4 约束

| 类   | 内容                                                   |
| ---- | ------------------------------------------------------ |
| 技术 | Next 16 App Router · React 19 · TS · pnpm · Node 22 CI |
| 安全 | nonce CSP · remotePatterns 空 · 密钥不入库             |
| 内容 | git SSOT · MDX/JSON                                    |
| 部署 | Vercel + Actions；**push/deploy 需确认**               |
| 协作 | 高风险先确认；跳过运营时穷尽自动后停                   |
| 规模 | 14/6/123 假设；不为十万级设计                          |
| 花园 | 一层 remark；client 不读 FS                            |

### 6.5 系统边界

```text
作者 MDX/JSON ──git──► CI ──► Vercel
                         │
                    访客浏览器
                    ├ HTML(动态+nonce)
                    ├ /api/search
                    ├ 静态资产
                    └ Giscus / Vercel analytics
边界外：GSC 控制台、CF DNS 写、SI 明细 API
```

---

## 7. 输入 · 输出 · 契约

### 7.1 系统输入

| 输入                      | 来源              | 校验                             |
| ------------------------- | ----------------- | -------------------------------- |
| 博客 MDX（可含 wikilink） | content/blog      | schema + 可见性 + 图 fail-closed |
| 项目/链接 JSON            | data/*            | Zod · 生产 strict                |
| 环境                      | SITE_URL · Giscus | 生产禁 localhost feed            |
| 搜索                      | q/limit           | clamp · 限流                     |
| 偏好                      | 主题/阅读/`?q=`   | 本地安全封装                     |

### 7.2 系统输出

| 输出                    | 消费者       |
| ----------------------- | ------------ |
| HTML                    | 访客         |
| 内链/反链 UI            | 读者发现路径 |
| SearchResultItem[]      | SearchBar    |
| feed/sitemap/OG/JSON-LD | 订阅与爬虫   |
| CI/ops-readiness        | 维护者       |

### 7.3 内部契约

```text
extractWikilinks(content) → {slug,label}[]
remarkWikilink → mdast link
buildBacklinkIndex → Map<target, sources[]>
getBacklinks(slug) → PostMeta[]  // 无自环，日期倒序
assertWikilinksValid() → throws on missing target
```

### 7.4 本决策流程 IO

| 角色  | 输入      | 输出                  |
| ----- | --------- | --------------------- |
| 用户  | 表单选择  | 授权 ship 范围        |
| Agent | 仓库+调研 | v2 报告 + 表单 + ship |
| CI    | push      | 门禁                  |
| 生产  | deploy    | smoke                 |

---

## 8. 架构方案全集与对比（继承 v1，标注落地态）

### 8.1 平台

| 方案      | 描述             | 分  | 态       |
| --------- | ---------------- | --- | -------- |
| **P-A ★** | 锁 Next+本地内容 | 92  | **已选** |
| P-B       | 迁 Astro         | 48  | 否       |
| P-C       | Hugo/Quartz      | 40  | 否       |
| P-D       | Headless CMS     | 28  | 否       |

**最佳 P-A**：形态与资产同构；换栈无产品收益。

### 8.2 渲染/安全

| 方案                  | 分  | 态       |
| --------------------- | --- | -------- |
| **R-A nonce ★**       | 88  | **已选** |
| R-B SSG+unsafe-inline | 30  | **禁**   |
| R-C SSG+hash          | 55  | 成本高   |
| R-D 混合静态营销页    | 50  | 过度设计 |

### 8.3 内容

| 方案                          | 态               |
| ----------------------------- | ---------------- |
| **C-A MDX+JSON+repository ★** | 现行             |
| C-A+花园                      | **G0/G1 已落地** |
| C-B 构建期关系图产物          | 可选优化         |
| C-C 项目 MDX 复盘             | 中期             |
| C-D CMS                       | 否               |

### 8.4 搜索

| 方案               | 态                 |
| ------------------ | ------------------ |
| **S-A Fuse API ★** | 现行；空态已有导流 |
| S-B Pagefind       | 门槛后             |
| S-C Algolia        | 否                 |
| S-D 客户端全量     | 反模式             |

### 8.5 CSS/视觉

| 方案                              | 分   | 态                        |
| --------------------------------- | ---- | ------------------------- |
| **V-S1 纸感+花园融 article-ui ★** | 90.5 | **已走**（反链 BEM 已有） |
| V-S2 Quartz 深色笔记风            | 58   | 否                        |
| V-S3 Spotlight 大改               | 52   | 否                        |
| V-S4 抹掉 BEM                     | 37   | 否                        |

### 8.6 分层边界

| 方案                 | 态     |
| -------------------- | ------ |
| **B-A src/server ★** | 已上线 |

### 8.7 花园深度（v2 重评）

| 方案                             | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | 加权   | 态               |
| -------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ | ---------------- |
| **GD-1 维护 G0/G1 + 正文加深链** | 9    | 8    | 10   | 9    | 9    | 9    | **89** | **推荐下一主线** |
| GD-2 次级页/折叠 G2 子图         | 7    | 5    | 8    | 6    | 6    | 7    | 66     | 条件             |
| GD-3 全站首屏力导向              | 6    | 3    | 6    | 4    | 3    | 4    | 45     | 否               |
| GD-4 迁 Quartz                   | 7    | 1    | 3    | 2    | 2    | 3    | 33     | 否               |
| GD-5 停花园只写文                | 6    | 9    | 10   | 9    | 9    | 7    | 80     | 可作内容极端包   |

**最佳 GD-1**：边数量已够，**缺口在正文概念链与生产一致性**；G2 在 GD-1 做实后再谈。

---

## 9. 数字花园专题规格（落地后）

### 9.1 已交付验收（G0/G1）

| #   | 标准                                  | 证据                          |
| --- | ------------------------------------- | ----------------------------- |
| 1   | `[[slug]]`/`[[slug\|label]]` → 站内链 | remark + 单测 + :3001 冒烟    |
| 2   | 代码围栏内不解析                      | wikilink 测 + cloudflare TOML |
| 3   | 坏链 fail-closed                      | link-graph 测                 |
| 4   | 反链面板                              | ArticleBacklinks + article-ui |
| 5   | server facade                         | getBacklinks                  |
| 6   | 样例+全站延伸阅读                     | 47 条级                       |
| 7   | CSP 无新远程脚本                      | 无新依赖                      |

### 9.2 未交付

- G2 图谱 UI
- 生产部署含花园
- 正文区高密度概念网（相对延伸阅读）
- 反链分页/「还有 k 条」

### 9.3 G2 若启动（规格草稿，默认不 ship）

| 项   | 要求                                 |
| ---- | ------------------------------------ |
| 数据 | 复用 link-graph；不新建客户端读盘    |
| UI   | `/garden` 或文章折叠；**非**首页默认 |
| 动效 | `prefers-reduced-motion` → 列表      |
| CSP  | 无 eval；无任意 CDN 图库除非审核     |
| 验收 | e2e + 无 CSP 违规 + 桌面 LH 不回归   |

---

## 10. 用户体验升级（问题 · 多方案 · 评分）

评分维：读者价值 25 · 实现成本 20（高=省）· 约束 20 · 维护 15 · 风险 10（高=安全）· 品牌 10。

### 10.1 UX-1 发现路径（已部分完成）

| 方案                     | 加权   | 态               |
| ------------------------ | ------ | ---------------- |
| **UX-1A G0+G1**          | 85.5   | **已交付**       |
| UX-1B 只加强 related     | 78.5   | 可补充           |
| UX-1C 全站图谱首页       | 58.5   | 否               |
| **UX-1E 正文概念链加深** | **87** | **下一内容主包** |
| UX-1F 仅延伸阅读堆链     | 70     | 已做一轮；边际↓  |

**最佳下一刀 UX-1E**：在段落中自然插入 `[[ ]]`，让反链成为「读到一半想去的地方」，而非文末附录。

### 10.2 UX-2 移动阅读

| 方案                         | 加权 | 结论 |
| ---------------------------- | ---- | ---- |
| **UX-2A 增量 TOC+反链+设置** | 83   | ★    |
| UX-2B 重做双栏               | 63   | 否   |
| UX-2C 忽略移动               | —    | 否决 |

### 10.3 UX-3 搜索

| 方案                        | 加权 | 态             |
| --------------------------- | ---- | -------------- |
| **UX-3A Fuse+空态导流**     | 84   | **空态已存在** |
| UX-3B 增强空态（热门/系列） | 82   | 可选 polish    |
| UX-3C Pagefind              | 62   | 门槛后         |

### 10.4 UX-4 作品集

| 方案                | 加权    |
| ------------------- | ------- |
| UX-4A JSON+真图     | 78 现状 |
| **UX-4B +MDX 复盘** | 82 中期 |
| UX-4C CMS           | 35 否   |

### 10.5 UX-5 404 / 死胡同

| 方案                         | 加权 |
| ---------------------------- | ---- |
| **UX-5A 404→搜索/博客/项目** | 85   |
| UX-5B 仅「返回首页」         | 60   |

### 10.6 UX 可执行清单（v2）

| ID      | 项                    | 轨道     | 建议             |
| ------- | --------------------- | -------- | ---------------- |
| U1–U2   | G0/G1                 | 花园     | **完成**         |
| U3      | 延伸阅读 wikilink     | 内容     | **完成**         |
| **U10** | **正文概念链 4–8 篇** | 内容 70% | **推荐**         |
| U4      | 反链 N 条+折叠        | 体验     | 可选             |
| U5      | 搜索空态增强          | 体验     | 可选（已有基础） |
| U6      | 404 导流              | 体验     | 推荐体验包       |
| U7      | 动画岛减负            | 体验     | 可选             |
| U8      | G2                    | 花园     | 默认否           |
| U9      | 项目 MDX              | 内容     | 中期             |
| U11     | CLS/字体              | 体验     | 可选             |
| U12     | AGENTS 搜索文案       | 卫生     | 推荐卫生包       |

---

## 11. 视觉风格

### 11.1 保留语言

- Paper Gallery：低饱和纸、鼠尾草 brand、暖金 featured
- 衬线展示 + Noto SC + JetBrains Mono
- BEM 结构 + shadcn 交互；禁第三套 `.btn`
- 反链：`article-panel` 兄弟语言（已实现）

### 11.2 方向评分

见 §8.5；**V-S1 仍为唯一合理主线**。

### 11.3 打磨细则

1. 反链与 Related 视觉兄弟化（已接近）。
2. 390 宽不与 ReadingPreferences/BackToTop 永久重叠。
3. 暗色只用 token。
4. G2 若做：禁止霓虹节点默认皮肤。
5. wikilink 可与外链区分（可选虚线下划线）——低优先级。

---

## 12. 分轨道实施规格

### 12.1 轨道 O-A 内容 70%

**目标**：提高「下一篇点击率」与主题簇连通。  
**输入**：现有 14 MDX；slug 表；系列「个人服务部署路线」。  
**输出**：正文内自然 `[[ ]]`；可选 1 篇新笔记（非必须）。  
**验收**：

1. 新增/修改链目标均存在（fail-closed 绿）。
2. 至少 **3 个主题簇** 各有 ≥1 条正文链（运维 / 数据 / 前端）。
3. 不引入假相关（禁止「为了图而链」）。
4. 相关单测 + 抽检 3 页反链。

### 12.2 轨道 O-B 体验 20%

**目标**：减少死胡同与布局抖动。  
**包选项**：404 导流 · 反链列表上限 · CLS/字体 · 搜索空态增强 · 动画减负。  
**验收**：移动 390 手测或 Playwright mobile；LH 桌面不回归；无 CSP 违规。

### 12.3 轨道 O-C 卫生 10%

**目标**：文档与代码同构。  
**包**：AGENTS 搜索描述 · overview 挂 v2 · handoff HEAD ·（push 后）launch-baseline。  
**验收**：`format:docs:check` · `check:docs` · 无行为回归。

### 12.4 轨道 O-X 运营 0%（默认）

仅当用户改表单；否则 **不动完成态**。

### 12.5 全局门禁（任何代码）

```text
format/lint/typecheck → 受影响 test → （路由）e2e
内容 → check:seo
禁止：假 GSC、放宽 CSP、无授权 push
```

---

## 13. 细节打磨参考清单

### 13.1 交互

- [x] wikilink 双语法
- [x] 反链空态文案
- [x] 搜索空态基础导流
- [ ] 反链 max N + 还有 k
- [ ] 404 导流
- [ ] 正文概念链加深
- [ ] 键盘可达抽检

### 13.2 视觉

- [x] 反链 article-ui
- [ ] 390 重叠手测记录
- [ ] wikilink/外链可选区分

### 13.3 工程

- [x] cache 图 · 纯函数 · server 导出 · 边界测
- [ ] AGENTS 搜索描述
- [ ] production 含花园后的 smoke

### 13.4 内容

- [x] 14 篇延伸阅读 wikilink
- [x] 部署三角正文链
- [ ] 数据簇 PG↔Redis↔Supabase 正文句
- [ ] 前端簇 Next↔性能↔TS 正文句

---

## 14. 本轮 Ship 问题清单（供交互表单）

| #       | 工作包                    | 最佳方案    | 依赖     | 默认         |
| ------- | ------------------------- | ----------- | -------- | ------------ |
| **Q10** | 正文概念链加深（4–8 篇）  | UX-1E / O-A | G0       | **推荐**     |
| **Q11** | 404 导流                  | UX-5A       | 独立     | 推荐体验     |
| **Q12** | 反链列表上限+还有 k       | D1-6        | G1       | 可选         |
| **Q13** | 搜索空态增强（系列/热门） | UX-3B       | 独立     | 可选         |
| **Q14** | 文章 CLS/字体微调         | D1-2/3      | 独立     | 可选         |
| **Q15** | AGENTS+overview 卫生      | D2-1        | 独立     | **推荐卫生** |
| **Q16** | 次级 G2 原型              | GD-2        | 用户勾选 | 默认否       |
| **Q17** | 项目 MDX 复盘管道         | UX-4B       | 中期     | 否           |
| **Q18** | 授权 push + 生产 smoke    | G-3         | 用户     | **门控**     |
| **Q19** | 换栈/CMS/Pagefind 现在    | 低分        | —        | **禁止**     |
| **Q20** | 假完成 GSC                | —           | —        | **禁止**     |

**推荐 ship 包 R1**：`Q10 + Q15`（内容+卫生，风险最低）。  
**推荐 ship 包 R2**：`Q10 + Q11 + Q15`（内容+死胡同+卫生）。  
**推荐 ship 包 R3**：`Q10 + Q11 + Q12 + Q15`（完整体验小闭环）。  
**加推包 R4**：用户显式要上线时再加 `Q18`。  
**禁止包**：`Q16` 强行全站图、`Q19`、`Q20`。

---

## 15. 目标/约束/IO/验收（下一阶段精炼）

### 15.1 目标

| ID  | 目标               | 度量                       |
| --- | ------------------ | -------------------------- |
| T1  | 发现路径更「文中」 | ≥6 条新正文 wikilink       |
| T2  | 安全/分层不破      | 边界测·无 unsafe-inline    |
| T3  | 死胡同减少         | 404 有 ≥2 出口（若选 Q11） |
| T4  | 文档同构           | AGENTS 搜索描述正确        |
| T5  | 运营诚实           | 状态仍 blocked/pending     |
| T6  | 分叉可控           | push 仅在授权后            |

### 15.2 约束

同 §6.4；另：**不自动 G2**；**不改生产完成叙事**。

### 15.3 输入

- 用户表单选择
- 现有 MDX/组件
- v1/v2 决议

### 15.4 输出

- 内容/代码/文档 diff
- 测试绿
- 总结（含未做项）
- 可选：待 push 的 tip

### 15.5 验收命令

```bash
cd D:\blog
pnpm test src/lib/posts/wikilink.test.ts src/lib/posts/link-graph.test.ts
pnpm typecheck
pnpm check:docs   # 若改文档
# 体验包另加受影响组件测 / e2e
# 上线包：用户授权后 git push && pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

---

## 16. 风险与回滚

| 风险                 | 缓解                             |
| -------------------- | -------------------------------- |
| 假相关链伤害信任     | 人工语义审查；宁缺毋滥           |
| 坏链导致构建失败     | fail-closed 是特性；改前跑图断言 |
| push 触发生产回退    | 先 CI；smoke；可 revert tip      |
| G2 性能/CSP          | 默认不做；规格已写降级           |
| 3000 端口误测 NewAPI | 文档写死 :3001 冒烟              |

回滚：内容可用 git revert 单 commit；功能 G0/G1 已稳定，避免无故回退。

---

## 17. 完整验收矩阵（跨方案）

| ID    | 项            | 命令/证据         | 通过       |
| ----- | ------------- | ----------------- | ---------- |
| AC-01 | wikilink 渲染 | 单测+页面         | 链正确     |
| AC-02 | 坏链          | link-graph 测     | throw      |
| AC-03 | 反链          | 页面 DOM          | 入边标题对 |
| AC-04 | 边界          | module-boundaries | 绿         |
| AC-05 | CSP           | 无新远程脚本      | 绿         |
| AC-06 | 文档链接      | check:docs        | 绿         |
| AC-07 | 运营诚实      | TODO/ops          | 非假完成   |
| AC-08 | 移动反链      | 手测 390          | 可达       |
| AC-09 | 生产一致      | 仅 push 后        | smoke      |
| AC-10 | LH 桌面       | CI                | 不回归     |

---

## 18. 为什么「最佳组合」仍最符合项目

1. **目标匹配**：品牌站 + 轻花园，不是纯 PKM。
2. **约束匹配**：nonce、本地内容、不换栈、可跳过运营。
3. **沉没成本**：分层、测、纸感、G0/G1 已付费；换栈归零。
4. **规模匹配**：14 文 Fuse 足够；G2 全站图性价比低。
5. **风险匹配**：内容与卫生可逆；架构翻转不可逆。
6. **用户已决议**：混合轨道与花园增量；v2 只在增量内优化。
7. **分叉诚实**：最佳技术态在本地；最佳产品态需用户授权 push——报告不把两者混为一谈。

---

## 19. 交互表单设计（实现见对话 AskUserQuestion）

表单维度（多题）：

1. **主 ship 包**：R1 / R2 / R3 / 自定义
2. **是否包含 push（Q18）**：否（默认）/ 是
3. **G2（Q16）**：否（默认）/ 仅设计文档 / 折叠原型
4. **体验加选项**：404 / 反链上限 / 搜索增强 / CLS（多选）
5. **内容策略**：只正文概念链 / 再写 1 篇新文 / 暂停内容只卫生

仲裁规则：与文首硬决议冲突的选项（换栈、假 GSC、unsafe-inline）**拒绝执行**。

---

## 20. 附录 A · 文章主题簇（内容规划用）

| 簇         | slug                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| 部署运维   | vps-initial-setup · docker-deploy-guide · nginx-reverse-proxy · linux-server-troubleshooting · cloudflare-workers-guide |
| 交付自动化 | git-hooks-github-actions · cicd-pipeline-design                                                                         |
| 数据       | postgresql-performance · redis-caching-strategies · supabase-practical-guide                                            |
| 前端/语言  | nextjs-app-router · web-performance-optimization · typescript-advanced-types · go-cli-tool                              |

### 附录 B · 关键路径速查

- 花园：`src/lib/posts/wikilink.ts` · `remark-wikilink.ts` · `link-graph.ts` · `ArticleBacklinks.tsx` · `MdxContent.tsx`
- 文章页：`src/app/blog/[slug]/page.tsx`
- 搜索：`SearchBar.tsx` · `SearchResultsList.tsx` · `src/server/search/*`
- 样式：`tokens.css` · `article-ui.css` · `prose.css`
- ADR：`docs/adr/2026-07-17-csp-nonce-over-ssg.md`

### 附录 C · Sources

- [Quartz](https://quartz.jzhao.xyz/) · [Quartz philosophy](https://quartz.jzhao.xyz/philosophy)
- [Obsidian + Astro garden (2025)](https://www.emgoto.com/obsidian-digital-garden/)
- [astro-digital-garden](https://github.com/stereobooster/astro-digital-garden)
- [Josh Comeau blog v2](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/)
- [Lee Robinson stack](https://leerob.com/stack)
- [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy)
- [Nextra 4](https://the-guild.dev/blog/nextra-4) · [Pagefind](https://pagefind.app/docs/) · [Fuse performance](https://www.fusejs.io/performance.html)
- 站内：v1 报告 · architecture.md · TODO.md · handoff-2026-07-21-garden.md · full-stack-audit-2026-07-17.md

---

## 21. 修订记录

| 日期       | 说明                                                                             |
| ---------- | -------------------------------------------------------------------------------- |
| 2026-07-21 | v1：整合调研 + 表单决议 + §28–35 UX/视觉                                         |
| 2026-07-21 | G0/G1 实现注记写入 v1                                                            |
| 2026-07-21 | **v2**：落地后重扫、47 边、同类刷新、GD/UX 重评、Q10–Q20 ship 清单、生产分叉诚实 |

---

## 22. 给执行者的最后一页（/ship 前必读）

1. 先读用户表单结果；冲突硬决议则拒。
2. 默认 **R2 或 R1**；无 G2、无换栈、无假 GSC。
3. 内容改动跑 wikilink/link-graph 测；文档跑 check:docs。
4. **不 push** 除非 Q18=是。
5. 总结必须列出：做了什么、没做什么、HEAD、ahead、生产是否仍旧。
6. 更新 handoff/记忆 tip 与 overview 挂链（若在卫生包内）。

---

_本报告为决策与规格层。实施以用户表单 + `/ship` 流水线为准；TODO.md 仍是未完成事项 SSOT。_

---

## 23. 深度展开 · 为什么现在是「维护花园」而不是「重建花园」

第一轮调研时，花园还是决议与规格；第二轮把它做成了 G0/G1；第三轮（本 v2）面对的是**已上线能力与未上线生产**之间的张力。很多人在这个阶段会犯两类错误：

1. **能力幻觉**：本地能看到反链，就对外说「花园已上线」。这在工程上不诚实，也会让后续交接把生产 smoke 当成「已验证花园」。
2. **功能膨胀**：边数到了四十多，就立刻上力导向图、hover 预览、双向编辑器。这会把「轻量发现」做成「第二套产品」，直接违反混合轨道里 70% 应给内容的预算。

正确姿态是**维护者姿态**：把 G0/G1 当基础设施，像 repository 与 CSP 一样被测试锁住；把增量预算花在读者「下一篇点哪里」上。Quartz 之所以看起来「花园很完整」，是因为它从第一天就放弃了作品集品牌与严格 nonce 工程博客的约束；西江月不能用同一套成功标准。

对作者而言，花园的价值顺序应当是：

1. 写的时候能用 `[[slug]]` 随手连（作者体验）；
2. 读的时候能从一篇跳到语义相关的一篇（读者体验）；
3. 被连到的文章能显示「谁指向我」（反链信任）；
4. 最后才是「整张网长什么样」（图谱好奇）。

目前 1–3 已具备工程条件；4 仍是装饰层。v2 把预算压在 2 的质量（正文概念链），而不是 4 的视觉刺激，是刻意的产品排序。

---

## 24. 深度展开 · 内容 70% 如何真正执行（不是堆链接）

### 24.1 反模式

- 在文末复制三行延伸阅读并美其名曰「花园完成」。本轮 42 条迁移已经吃掉了这一刀的边际收益。
- 为了让图谱好看，把无关文章互链。读者一点就发现文不对题，长期损害品牌信任。
- 新建大量 meta 文（「本站导航」「链接说明」）而不增加工程知识密度。站点会变成自指游戏。

### 24.2 正模式（推荐写法）

在**叙述需要**的句子里插入 wikilink，例如：

- 讲 Docker 健康检查时，链到 Linux 排查手册的磁盘/内存章节语境：`[[linux-server-troubleshooting|服务器资源排查]]`。
- 讲 Supabase RLS 时，链到 PostgreSQL 索引与连接池：`[[postgresql-performance]]`。
- 讲 Next 流式渲染时，链到 Web Vitals：`[[web-performance-optimization|Core Web Vitals]]`。
- 讲 Actions 部署时，链到 Docker Compose 与 VPS 安全底座。

每条链应能回答：读者如果点出去，是否能**减少重复解释**或**补齐前置知识**？若不能，就不链。

### 24.3 主题簇操作手册

**部署运维簇**：已有三角 + 延伸阅读。下一刀优先在 `linux-server-troubleshooting` 正文加入对 vps/docker/nginx 的「故障场景回指」，以及 `cloudflare-workers-guide` 对 nginx 的「边缘 vs 源站」对比句。

**交付自动化簇**：`git-hooks-github-actions` 与 `cicd-pipeline-design` 应用正文互相引用「本地门禁 vs 远程门禁」，避免两篇读起来像同一教程的复制。

**数据簇**：Postgres / Redis / Supabase 最适合做「缓存与源真相」概念网。建议至少：

- Redis 文中链 Postgres「先测量再缓存」；
- Supabase 文中链 Postgres 性能与 RLS 相关段落；
- Postgres 文中链 Redis 作为读多写少的卸载层。

**前端/语言簇**：Next / 性能 / TypeScript 可形成「类型约束 → 框架边界 → 运行时指标」链；Go CLI 可与 CI 产物、服务器排障弱连接，但不要强行三角。

### 24.4 内容验收的「人话标准」

除了 fail-closed 测试，作者自检三问：

1. 去掉这条链，句子是否仍完整？若否，说明链承载了必要信息架构。
2. 读者从 B 回 A 的反链标题，是否能猜出为什么被链？
3. 一周后自己是否还认可这条边？

---

## 25. 深度展开 · 体验 20% 的优先级哲学

体验轨道很容易变成「设计师愿望清单」。本站约束把它收束为：**减少死胡同、减少抖动、减少误触**，而不是增加动效。

### 25.1 死胡同

- 搜索无结果：已有「全部文章 / 标签」出口；可增强为系列与精选，但不是必须。
- 404：若仍只有弱出口，应补博客列表、搜索、项目。
- 反链为空：空态文案已存在；不要为了「看起来丰富」塞假链。

### 25.2 抖动与布局

文章 lab CLS 门禁宽于 field 目标时，优先：

- 标题与代码块占位；
- 字体交换策略；
- 避免反链区异步插入造成跳动（服务端渲染已利好）。

### 25.3 移动完成率

390 宽上，ReadingPreferences、BackToTop、移动 TOC、反链列表必须**可滚动触及且不永久遮挡正文**。体验包若只改桌面图谱而忽略移动，直接否决。

### 25.4 动画岛

首页 Reveal / Magnetic 等是品牌，不是罪恶；但 INP 与 TBT 若恶化，应减「首屏必须水合」的岛，而不是删掉所有气质。决策需有性能证据，禁止审美清零。

---

## 26. 深度展开 · 卫生 10% 为什么值得单独成包

个人站最常见的腐化不是代码崩坏，而是**文档说谎**。AGENTS 仍写 client-side fuse，会诱导后续 Agent 把搜索改回客户端全量索引——这是真实回归风险。

卫生包的最小集：

1. AGENTS 搜索描述改为生产 API Fuse。
2. overview 挂 v2 报告。
3. handoff / 记忆 tip 与 ahead 数一致。
4. （可选）注明 dev 端口冲突。

卫生包**禁止**夹带换栈、依赖大升级、格式化全仓库无关文件。

---

## 27. 深度展开 · 安全与信任边界（花园增量后）

花园没有引入新的网络边界，但仍有注意点：

1. **MDX 仍是信任内容**：作者可控；wikilink 只生成站内路径，不开放任意 URL 协议。
2. **fail-closed 是安全特性也是可用性特性**：坏链在 CI 爆掉，好过生产给读者 404 内链。
3. **不要为预览弹层引入 `eval` 或任意 HTML 注入**。
4. **Giscus 与 Analytics 的 CSP allowlist 不因花园而扩张**。
5. **搜索投影继续禁止 searchText 泄露**；反链只暴露 PostMeta 公共字段。

若未来做 hover 预览，必须走服务端已渲染摘要或受限组件，而不是 `dangerouslySetInnerHTML` 全量 MDX。

---

## 28. 深度展开 · 性能模型与「动态 HTML」的再辩护

批评者常说：个人博客应当全静态。本站回答分三层：

1. **资产静态**：图片、字体子集、`_next/static`、feed 仍可边缘缓存。
2. **文档动态**：因 nonce，HTML 带 per-request 策略；在 14 文规模下，成本通常可忽略。
3. **数据本地**：无数据库往返；TTFB 主要来自函数与框架，而非查询。

在缺少 Speed Insights p75 真值时，用 Lighthouse 实验室分驱动「放弃 nonce」是不道德的优化——它用不可比指标换安全基线。ADR 已写 revisit 条件；v2 重申：**无 RUM，不回退 CSP**。

花园 G0/G1 对性能的影响：

- 构图在服务端缓存，watch 内容目录；
- 反链是轻量列表，无客户端图布局；
- 不增加搜索 payload。

因此花园不是性能敌人；**G2 力导向**才可能是。

---

## 29. 深度展开 · 与 v1 评分的连续性说明

v1 §28–35 的 UX-1A、V-S1、P-A、R-A、S-A 在 v2 全部保留为已选或已交付。v2 新增：

- **UX-1E 正文概念链**成为内容主线最高分增量；
- **GD-1 维护 G0/G1** 高于 **GD-2 立即 G2**；
- **Q10–Q20** 替换已完成的 Q1–Q4 作为 ship 清单；
- 边数量门槛「≥15」标记为**已满足数量、未满足质量位置**。

这不是推翻用户决议，而是决议落地后的**再规划**。任何试图把「已选 nonce」重开成 SSG 辩论的选项，应直接拒绝。

---

## 30. 工作量与排期假想（供表单参考，非承诺）

| 包          | 人日量级      | 风险 | 产物          |
| ----------- | ------------- | ---- | ------------- |
| R1 Q10+Q15  | 0.5–1         | 低   | 正文链 + 文档 |
| R2 +Q11     | +0.25         | 低   | 404           |
| R3 +Q12     | +0.5          | 中   | 反链 UI 行为  |
| Q14 CLS     | 0.5–1         | 中   | CSS/字体      |
| Q16 G2 原型 | 2–4           | 高   | 新交互面      |
| Q18 push    | 0.1 + 观察 CI | 发布 | 生产对齐      |

建议同一次 ship **不超过 R3**；G2 与 push 拆开决策。

---

## 31. 测试策略（与 ship 对齐）

| 变更      | 最低测试                                 |
| --------- | ---------------------------------------- |
| 仅 MDX 链 | wikilink + link-graph；抽检 getBacklinks |
| 反链 UI   | ArticleBacklinks 测 + 页面测             |
| 404       | 组件/路由测 + 可选 e2e                   |
| 搜索空态  | SearchResultsList 测                     |
| 文档      | format:docs:check + check:docs           |
| 样式 CLS  | 手测 + 不降桌面 LH 门禁                  |

禁止：为了绿而删 fail-closed 测试；为了过 CI 而 `published: false` 藏坏链。

---

## 32. 发布与分叉剧本

### 剧本 A · 继续本地（默认）

- 本地 tip 前进；生产不变。
- 记忆与 handoff 写清 ahead。
- 适合内容试验。

### 剧本 B · 授权 push

1. 确认工作树 clean。
2. `git push`（用户明确同意）。
3. 盯 GitHub Actions。
4. `pnpm check:production-content -- --base-url=https://incca.ccwu.cc`。
5. 抽检一篇带反链的文章 HTML。
6. 更新 launch-baseline / 记忆生产 HEAD。

### 剧本 C · 回滚

- 内容问题：revert 内容 commit。
- 功能问题：revert 功能 commit 并热修（需再授权）。
- 禁止在未理解 diff 时 force push。

---

## 33. 读者旅程用例（验收叙事）

1. **运维学习者**：读 VPS 初始化 → 文中/文末到 Docker → 反链看到 Nginx 与排障手册 → 完成「从装机到入口层」心智模型。
2. **前端学习者**：读 Next App Router → 链到性能文理解 LCP → 反链看到 TS 文 → 形成类型与运行时指标闭环。
3. **迷茫访客**：首页 ReadingPath → 精选文 → 搜索失败 → 空态回标签/列表 → 不落到 404 死胡同。
4. **回访者**：从外部搜索进 Postgres 文 → 反链发现 Redis/Supabase → 停留时长上升。

若 ship 包无法改善其中至少两条旅程，则包选小了或选歪了。

---

## 34. 决策树（Agent 自检）

```text
用户是否要求换栈/CMS/现在 Pagefind/假 GSC？
  是 → 拒绝并引用本报告硬边界
  否 → 读表单 ship 包
       → 含 Q16 G2？
            是且非折叠/次级 → 降级或二次确认
            否 → 继续
       → 含 Q18 push？
            是 → 实施后停等明确 push 授权语句
            否 → 只本地 commit
       → 实施 R* → 测 → 总结
```

---

## 35. 术语表（防交接漂移）

| 术语        | 含义                             |
| ----------- | -------------------------------- |
| G0          | wikilink 解析与渲染              |
| G1          | 反链索引与面板                   |
| G2          | 图谱可视化 UI                    |
| fail-closed | 坏链使检查失败而非静默           |
| 延伸阅读链  | 文末列表型互链                   |
| 概念链      | 正文叙述中的语义互链             |
| 混合轨道    | 内容 70 / 体验 20 / 卫生 10      |
| nonce CSP   | 每请求脚本 nonce，优先于全站 SSG |
| ahead N     | 本地相对 origin 超前提交数       |
| 生产分叉    | 访客看到的 commit ≠ 本地 tip     |

---

## 36. 长附录 · 逐方案「为何不选」备忘（防翻案）

**迁 Astro**：Lighthouse 幻想收益 < 重写成本；Giscus/纸感/测试归零；与用户「锁 Next」冲突。  
**迁 Quartz**：花园完整但作品集/策展/工程门禁错位；品牌重做。  
**迁 Hugo**：技能栈断裂。  
**Nextra 整站**：文档 IA 绑死。  
**CMS**：单人 git 工作流被破坏。  
**Algolia**：隐私/成本/YAGNI。  
**客户端全量 Fuse**：已淘汰的 payload 与 API 架构回退。  
**unsafe-inline SSG**：安全基线崩坏。  
**首屏力导向 G2**：品牌违和 + 性能风险 + 14 文玩具感。  
**运营假完成**：违反用户跳过决议与诚实原则。

把这些写进 v2，是为了让三个月后的 Agent 不必重新辩论。

---

## 37. 长附录 · 与历史审计条目的映射

| 历史项         | v2 态度                  |
| -------------- | ------------------------ |
| FE CSP vs SSG  | 维持 R-A                 |
| BE JSON strict | 保持                     |
| 搜索服务端化   | 保持 S-A；修 AGENTS 文案 |
| 文章 CLS       | O-B 可选                 |
| 运营 GSC       | X 级跳过                 |
| 前后端分层     | 不可逆资产               |
| 纸感双轨收口   | V-S1 延续                |
| 花园           | 从 0 到 G1；进入维护期   |

---

## 38. 长附录 · Ship 包到文件落点映射

| 包项         | 主要落点                                   |
| ------------ | ------------------------------------------ |
| Q10 正文链   | `content/blog/*.mdx`                       |
| Q11 404      | `src/app/not-found.tsx` 及样式/测          |
| Q12 反链上限 | `ArticleBacklinks.tsx` · article-ui · 测   |
| Q13 搜索空态 | `SearchResultsList.tsx`                    |
| Q14 CLS/字体 | tokens/layout/font 相关                    |
| Q15 卫生     | `AGENTS.md` · `docs/overview.md` · handoff |
| Q16 G2       | 新组件+路由（默认不建）                    |
| Q18 push     | git 远程（需授权）                         |

---

## 39. 长附录 · 成功指标（定性 + 可抽检）

短期（本周 ship 后）：

- 本地抽检 5 篇文章，反链非空比例上升或保持；
- 无坏链；
- 文档不再声称 client-side 搜索（若做 Q15）。

中期（push 后）：

- 生产 HTML 含 article-backlinks；
- 搜索与 404 出口可用；
- CI 持续绿。

长期（内容增长）：

- 主题簇连通度上升；
- 仍不需要外部搜索；
- 仍不需要换栈。

---

## 40. 结束语

西江月已经越过「能不能做个人站」和「能不能做花园最小闭环」两个阶段。现在的主问题是**克制**：克制换栈冲动，克制图谱炫耀，克制用实验室分数绑架安全，克制把运营账号工作写成代码胜利。把 70% 的精力还给句子与链接的质量，把 20% 还给不让读者迷路，把 10% 还给不让文档说谎——这就是 v2 认为最符合目标、约束与已付成本的最佳方案。

用户表单将从第 14 章清单中选择；`/ship` 只执行被选且不与硬边界冲突的项。生产是否跟上，仍握在用户的 push 授权里。

---

## 41. 补充评分表 · 内容策略细案

| 方案       | 描述                         | 价值 | 成本 | 约束 | 维护 | 风险 | 品牌 | 加权   |
| ---------- | ---------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ |
| **CS-1 ★** | 4–8 篇正文概念链，不新增长文 | 9    | 8    | 10   | 9    | 9    | 9    | **89** |
| CS-2       | 再写 1 篇「地图文」索引全站  | 6    | 6    | 9    | 7    | 7    | 6    | 68     |
| CS-3       | 只继续堆延伸阅读             | 5    | 9    | 10   | 8    | 8    | 6    | 73     |
| CS-4       | 停链只写无链新文             | 7    | 7    | 10   | 8    | 8    | 8    | 79     |
| CS-5       | 自动推荐插链（脚本）         | 4    | 5    | 6    | 4    | 3    | 4    | 45     |

**最佳 CS-1**：人工语义质量最高，且与 fail-closed 兼容；自动插链易产生假相关。

---

## 42. 补充评分表 · 上线策略细案

| 方案        | 描述                             | 加权 | 结论                |
| ----------- | -------------------------------- | ---- | ------------------- |
| **REL-1 ★** | 本地多 commit，集中一次授权 push | 88   | 默认                |
| REL-2       | 每完成小包就 push                | 70   | 需用户高频授权      |
| REL-3       | 长期不 push                      | 60   | 文档/生产漂移风险升 |
| REL-4       | force 对齐远程                   | 20   | 禁                  |

---

## 43. 执行检查单（打印级）

- [ ] 读完 v2 文首硬决议
- [ ] 读完用户表单
- [ ] 确认无 Q19/Q20
- [ ] 列出将改文件
- [ ] 实装
- [ ] 跑最低测试集
- [ ] 更新 TODO/文档（若在范围）
- [ ] 本地 commit（若有变更）
- [ ] 无授权则不 push
- [ ] 输出总结：HEAD / ahead / 生产 / 完成项 / 未做项

---

**字数说明**：本 v2 在结构完整的前提下以中文论述为主体，供决策与 ship 引用；与 v1 合计构成完整证据链。实施时以本章清单与用户表单交集为准。

---

## 44. 场景剧本 · 三种读者与三条失败路径

### 44.1 读者甲：要上线个人服务的工程师

他从搜索引擎或首页精选进入「VPS 初始化」。若正文只有清单没有出口，他会以为站点只是碎片笔记；若文末有 Docker/Nginx 链接且反链在 Docker 页能指回来，他会形成「路线」感。失败路径是：链接存在但打不开（坏链）——这正是 fail-closed 要消灭的。另一失败路径是生产还停留在无花园的 `dfc057b`，他在线上永远看不到反链，只在作者本地演示里看到——这是发布剧本问题，不是组件 bug。

### 44.2 读者乙：只关心前端的访客

他读 Next App Router，对 VPS 无感。若我们为了图谱把前端文强链到 VPS，他会感受到噪音。正确做法是链到性能与 TypeScript，形成「写组件 → 懂渲染成本 → 用类型约束接口」的闭环。失败路径是「全站强行一张图」，让前端文和运维文缠成毛线球。

### 44.3 读者丙：迷路者

他乱点搜索、点过期外链、或手打错误 slug。体验包的意义是让他在两次点击内回到有意义的列表。失败路径是 404 只有冷冰冰的「未找到」，或搜索空态只有「无结果」没有出口。

### 44.4 作者自己

作者三个月后回来，应在三十分钟内从 handoff 知道：花园已交付到哪一 G、生产是否包含、下一刀是正文链还是 G2。失败路径是文档仍写 client-side 搜索、TODO 复活 P0、记忆 tip 与 git 不符。

---

## 45. 反链产品细节 · 交互规格补充

### 45.1 排序

保持日期倒序、同日 slug 升序，与 `getBacklinks` 现行实现一致。不要改为「按相关度」除非引入可测算法。

### 45.2 数量

当入边 ≤5，全部展示。当入边 >5，默认展示 5，提供「还有 k 条」展开（Q12）。展开仍是服务端已给的列表切片，不需要二次请求——若未来文量极大再谈 API。

### 45.3 空态

维持一句说明，不使用大插画抢文章结尾阅读余韵。空态不是错误。

### 45.4 与系列、相关、上下篇的分工

| 模块     | 语义               |
| -------- | ------------------ |
| 系列路径 | 编辑排好的线性课程 |
| 反链     | 他人（文）引用我   |
| 相关     | 算法/标签相似      |
| 上下篇   | 时间线邻接         |

四者并存可以，但文案与视觉权重应递减：系列 ≈ 反链 > 相关 > 上下篇。不要四个一样大的卡片墙。

---

## 46. 文中 wikilink 的编辑手册（给作者）

1. 先写清论点，再考虑链接；链接是论点的支架，不是装饰。
2. 显示名用读者能懂的短语，避免 `[[slug]]` 裸露技术 id 在中文段落中跳戏；必要时 `[[slug|中文名]]`。
3. 同一段落不超过两条站内链，以免变成蓝字海洋。
4. 代码块、配置示例中的双方括号必须保持在围栏内，依赖解析器保护。
5. 新增 slug 前先确认文件名去日期前缀后的结果。
6. 改 slug 等于改链——本站无自动重定向层；改前全局搜旧 slug。
7. 合并前本地打开被链页，看反链是否出现自己。

---

## 47. 与「销售向改版」文档的边界

历史上的 SalesDex 启发改版解决的是首页叙事与纸感气质，不是知识网络。v2 明确：**首页不再为花园让路**。图谱入口若存在，应在博客列表次级或文章折叠区，而不是替换 EditorialHero。品牌承诺仍是「安静可读的工程站」，不是「第二大脑仪表盘」。

---

## 48. 成本会计 · 为什么换栈在财务上也不成立

假设作者时间是唯一货币：

- 维护 G0/G1 + 正文链：小时级到一天级。
- 体验小包（404/反链上限）：小时级。
- 重写到 Astro/Quartz 并恢复测试、CSP、Giscus、纸感、作品集：周到月级，且有回归空洞。

在没有「多人协作写库」或「十万 PV 性能灾难」的前提下，用周级成本换实验室分或花园皮肤，是不理性的。v2 把最佳方案钉在增量，是成本会计结果，不只是品味。

---

## 49. 观测与日志 · 我们故意不做什么

- 不在客户端对每条 wikilink 打点（隐私与噪音）。
- 不用 Lighthouse 分代替 RUM p75。
- 不把 GSC「已验证」写进代码注释。
- 不建独立分析库统计图谱点击，除非未来单独立项。

需要数据时，优先：生产 smoke 列表、CI 产物、作者手测清单。

---

## 50. 最终推荐声明（可引用）

> 在锁 Next、锁 nonce CSP、锁本地 MDX、跳过运营、不迁 Quartz 的前提下，西江月下一阶段最佳方案是：**维护已交付的 G0/G1，把内容预算投到正文概念链，把体验预算投到死胡同与布局抖动，把卫生预算投到文档与代码同构；G2 仅在质量门槛与用户显式选择下做折叠/次级原型；任何换栈、CMS、搜索集群、假运营完成均拒绝。生产对齐仅在用户授权 push 后执行。**

该声明与文首决议、第 8/10/14 章评分、第 18 章论证一致，作为 `/ship` 与后续 Agent 的仲裁锚点。

---

## 51. 交互表单决议录入（2026-07-21 第三轮）

| 决策       | 用户选择                 | 执行含义                                                     |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| 主 Ship 包 | **R2**                   | Q10 正文概念链 + Q11 404 + Q15 卫生                          |
| 体验加选   | **Q11+Q12+Q13+Q14 全选** | 与 R2 合并后：404、反链上限、搜索空态增强、CLS/字体          |
| G2         | **折叠/次级原型**        | 非首页；`prefers-reduced-motion` 可降级列表；复用 link-graph |
| Push       | **不 push**              | 仅本地 commit；生产仍 `dfc057b`                              |

**合并后的本轮工作包（去重）**：`Q10 · Q11 · Q12 · Q13 · Q14 · Q15 · Q16(折叠/次级) · ¬Q18 · ¬Q19 · ¬Q20`。

**与报告默认推荐的张力**：默认推荐暂缓 G2；用户显式选择折叠/次级原型 → **允许做窄实现**，禁止首屏力导向与换栈。仲裁：**做 GD-2 的最小可验收切片**，不升级为全站图谱产品。
