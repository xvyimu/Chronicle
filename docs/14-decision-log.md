# 14 · 决策日志

> 状态：持续维护
> 格式：日期 · 决策 · 背景 · 可选方案 · 选择原因 · 影响 · 复查

---

## 2026-10-06 · D-001 · 保留 Next 16 栈，重写内部实现

- **背景**：用户要求「彻底重构」，需确定范围。
- **可选**：A 整站换栈 / B 保留栈重写内部 / C 只清理。
- **选择**：**B**。用户明确选 B。
- **原因**：现有栈无结构性问题；内容快照 / CSP nonce / 搜索等决策有 ADR 支撑。
- **影响**：`docs/PROJECT.md`（栈 SSOT）不变。
- **复查**：迭代 06。

## 2026-10-06 · D-002 · 分支并行，不改 master

- **背景**：重写风险高。
- **选择**：全部改动在 `feature/architecture-rebuild-2026-10-06`。
- **原因**：master 保持绿，可随时回滚；符合「功能走 feature 分支」纪律。
- **影响**：重写完成并人工验收后合入。

## 2026-10-06 · D-003 · 删除评论 / 数字花园 / 收藏导航（上一轮）

- **背景**：用户上一轮要求精简。
- **选择**：删 Giscus 评论、数字花园、收藏导航（`/links`）。
- **原因**：站规模小，功能超配。
- **影响**：导航死链待清；`data/links.json` 物理保留。
- **复查**：本轮（新方案要求「搜索」回归，但「评论/花园/导航」不恢复）。

## 2026-10-06 · D-004 · 搜索以轻量客户端方案回归

- **背景**：新方案把搜索立为「首页视觉核心」；但上一轮刚删了 `/api/search`。
- **可选**：A 恢复服务端 Fuse + `/api/search` / B 客户端轻量搜索 / C 不做搜索。
- **选择**：**B**（迭代 03 实现）。
- **原因**：20 篇规模，服务端引擎过重（ADR-0006 已定「不上外部引擎」）；客户端方案匹配规模且有升级路径。
- **影响**：不恢复 `search-docs.json`；索引来源 `posts-meta`。
- **复查**：内容 >200 篇时评估服务端。

## 2026-10-06 · D-005 · Token 渐进迁移（保留旧变量名为别名）

- **背景**：`tokens.css` 是暖纸色，需改中性灰；但 17 个 CSS 文件 4880 行引用旧变量。
- **可选**：A 一次性全改 / B 旧名保留为别名，新增语义层。
- **选择**：**B**。
- **原因**：一次性改 4880 行风险高，且违反「渐进式重构」。
- **影响**：新代码用语义名，旧 CSS 继续工作。
- **复查**：迭代 06 清理。

## 2026-10-06 · D-006 · 新 ADR 顺延 0007，不用 `ADR-001` 命名

- **背景**：用户文档结构示例用 `adr/ADR-001-architecture-baseline.md`，但仓内既有约定是 `NNNN-slug.md`（0001–0006）。
- **选择**：遵循**仓内既有约定**，新 ADR 编号 `0007`。
- **原因**：避免与既有编号冲突、避免双源；`docs/README.md` 已声明 ADR 用 `NNNN-slug.md`。
- **影响**：用户示例的 `ADR-001` 落为 `0007-architecture-baseline.md`。

## 2026-10-06 · D-007 · 不加新 frontmatter 字段

- **背景**：用户需求列了 `publishedAt`/`authors`/`canonicalUrl` 等候选。
- **选择**：**不加**（除明确需求）。
- **原因**：避免为「模型完整」破坏 20 篇兼容、引入无用字段。
- **影响**：`docs/06-content-model.md` §4 记录理由。
- **复查**：有实际需求时。

## 2026-10-06 · D-008 · Node engines 改 `>=24`

- **背景**：本机 Node 24，仓 `engines: 22.x` 致 pnpm warning。
- **选择**：`package.json` `engines.node` → `>=24`；`.nvmrc`/`.node-version` → `24`。
- **影响**：pnpm warning 消失；CI 钉 22 的差异待单独评估。

## 2026-10-06 · D-009 · 首页暖纸色主题保留到迭代 03

- **背景**：Iteration 01 把 `tokens.css` 改成中性灰，但发现 `home.css` 有 `body:has(.home-paper)` 局部覆盖块，把首页 token 回退成暖纸色 + 纸质纹理背景。
- **可选**：A 本轮直接删该覆盖块 / B 保留到迭代 03。
- **选择**：**B**。
- **原因**：首页布局（Editorial Hero / 多 section）本为纸质纹理设计；单独删 token 覆盖会让布局裸在中性灰上，反而更差。且违反「不一次性替换所有页面」。
- **影响**：本轮首页仍暖色，其余页面已中性灰——**有意的过渡态**，记录在迭代 01 遗留问题。
- **复查**：迭代 03（首页重建）。

## 2026-10-06 · D-010 · 基础 UI 组件状态补齐延后到迭代 02

- **背景**：Iteration 01 目标含「基础 UI 组件统一交互状态」。
- **选择**：本轮不逐一改造现有 primitive（button/badge/card/sheet 等已具备大部分状态），随迭代 02 App Shell 一起处理。
- **原因**：避免范围外改动（现有组件在旧布局下工作正常）；App Shell 会新增 TopBar/Sidebar 组件，届时统一状态规范更合理。
- **影响**：迭代 01 验收清单该项标为未完成，转迭代 02。

## 2026-10-06 · D-011 · 主面板不做独立滚动

- **背景**：工作台外壳常见做法是主面板内独立滚动（`overflow: auto`）；用户需求也提到「支持独立滚动或合理的页面滚动」。
- **可选**：A 面板内滚动 / B 页面滚动。
- **选择**：**B**。
- **原因**：内容站页面滚动更自然；面板内滚动会让 `position: sticky`（TOC 侧栏、Sidebar、TopBar）的包含块改变，易失效。用户需求原文允许「合理的页面滚动」。
- **影响**：Sidebar / TopBar 用 `position: sticky`（相对视口），非面板内固定。
- **复查**：若后续确需面板内滚动，须同时复核所有 sticky 元素。

## 2026-10-06 · D-012 · 导航项调整（去花园/导航，加标签，博客→文章）

- **背景**：清死链时需确定新导航集。
- **选择**：`首页 / 文章 / 专题 / 分类 / 标签 / 作品 / 关于`（7 项）。
- **原因**：去 `/garden` `/links`（已删）；补 `/tags`（原桌面导航漏了它但存在该路由）；`博客`→`文章`（与产品文案统一）。
- **影响**：`MAIN_NAV_ITEMS` 变更；Header/Sidebar/MobileNav 同步；测试断言更新。
- **复查**：迭代 05 新增 `/archive` 时再增一项。

## 2026-10-06 · D-013 · 抽共享 `NavLinks` 组件

- **背景**：Iteration 02 新增 `Sidebar` 后，`Sidebar` 与 `MobileNav` 各写了一遍「map MAIN_NAV_ITEMS + isNavItemActive + aria-current」——同一模式的第二份实现。
- **可选**：A 保留两份 / B 抽共享组件。
- **选择**：**B**。
- **原因**：仓库规矩「只抽第二次重复」；两份逻辑易漂移（如改高亮规则要改两处）。`NavLinks` 无 hooks，server/client 两侧可渲染，路径与类名由调用方传入。
- **影响**：`Sidebar` / `MobileNav` 各减约 12 行；高亮逻辑单点。
- **复查**：迭代 05 若加归档项，只改 `navigation.ts` 一处。

## 2026-10-06 · D-014 · 搜索落地为客户端 Fuse（保留 fuse.js 依赖）

- **背景**：D-004 定「客户端轻量搜索」，Iteration 03 落实。
- **选择**：`src/lib/search/`（`SearchDoc` 投影 + `searchDocs` 纯函数）+ `SearchPanel` 客户端岛；`fuse.js` **保留**在 `dependencies`。
- **原因**：20 篇规模客户端内存索引足够；权重 标题(0.5)>标签(0.25)>分类(0.15)>描述(0.1)；`ignoreLocation` 适配中文。
- **影响**：不再有 `/api/search`；搜索无服务端往返；索引文档仅含元信息（不含正文）。
- **复查**：内容 >200 篇时评估服务端（ADR-0006）。

## 2026-10-06 · D-015 · 首页重写，删除 Paper Gallery 主题

- **背景**：Iteration 01 因「布局与纸质纹理绑死」保留的首页暖色覆盖块（D-009），在迭代 03 首页重建时处理。
- **选择**：删除 6 个旧首页组件（EditorialHero/ManifestoSection/ReadingPathSection/FeaturedArticleRail/HomeCtaSection/RevealOnScroll）+ 2 个 CSS（home-hero/home-sections），`home.css` 重写为工作台样式。
- **原因**：首页布局本就为纸质纹理设计，重建后暖色覆盖块失去意义；D-009 的「留到迭代 03」到期。
- **影响**：**首页转中性灰**（迭代 01 遗留闭环）；首页 CSS 929 行 → 约 300 行。
- **复查**：迭代 06 复核全站视觉一致性。

## 2026-10-06 · D-016 · 首页保留装饰背景层的隐藏规则

- **背景**：旧首页有 `body:has(.home-paper) .site-backdrop__stage { display: none }`（首页隐藏全站装饰背景层）。迭代 03 删除 `.home-paper` 后该规则失效 → 首页会重新显示背景层（旋转平面带 + 圆环 + 网格，含旧鼠尾草绿）。
- **选择**：改为 `body:has(.workspace-home) .site-backdrop__stage { display: none }`，**首页继续隐藏背景层**。
- **原因**：新工作台首页设计为「干净阅读面 + 大留白」，装饰背景与之冲突；且背景层是用户明令避免的「复杂纹理」。
- **影响**：首页无背景层；**全站其他页仍有背景层**（去留留迭代 06 决策）。
- **复查**：迭代 06「删废弃代码」时决定背景层整体去留。

## 2026-10-06 · D-017 · `ArticleList` 与 `BlogCard` 并存（形态差异）

- **背景**：Iteration 03 新建 `ArticleList`（首页紧凑横向行），既有 `BlogCard`/`BlogList`（列表页卡片网格，用于 `/blog` `/categories` `/tags` 六页）。自查发现二者职责相近。
- **可选**：A 合并为一个组件带 variant / B 保留两个。
- **选择**：**B**。
- **原因**：形态差异真实——首页用高信息密度紧凑行，列表页用留白卡片；合并会引入 variant 分支与样式纠缠，收益低。二者共享 `PostMeta` 类型与 `formatDate`，无逻辑重复。
- **影响**：两个列表组件并存；迭代 04 复核列表页视觉时再评估是否统一。
- **复查**：迭代 04。

## 2026-10-06 · D-018 · 文章卡片去装饰动画（移除 MagneticCard）

- **背景**：`BlogCard` 用 `MagneticCard`（3D 倾斜 + 光斑跟随）+ `stagger-in` 入场动画 + 悬停 `translateY`，属用户明令禁止的装饰性动画。
- **选择**：重写为静态卡片（低对比边界 + 悬停背景 + 轻箭头）。
- **原因**：用户要求「动效克制、无大面积弹跳、无长入场」；3D 倾斜与工作台「calm interface」气质冲突。
- **影响**：`BlogCard` 不再 import `MagneticCard`；`blog-ui.css` 删相关规则。**`ProjectCard` 仍用**（留迭代 05/06）。
- **复查**：迭代 06 评估 `MagneticCard` 是否整体退役。

## 2026-10-06 · D-019 · 保留 Cormorant 衬线标题（本轮不改字体）

- **背景**：`--font-display`（Cormorant Garamond 衬线）用于 5 处标题，与「工作台无衬线」气质存差异。
- **可选**：A 本轮改无衬线 / B 保留。
- **选择**：**B**。
- **原因**：字体属设计系统层（迭代 01 已定「保留 Cormorant 展示标题」）；改动牵动 `layout.tsx` 的 LCP preload 配置与 5 个 CSS 文件，属较大视觉决策，且非文章系统范围。
- **影响**：标题仍为衬线体。
- **复查**：迭代 06（视觉一致性复核）。

## 2026-10-06 · D-020 · 收藏 / 最近阅读用 localStorage，不引入账号

- **背景**：用户需求列了「收藏」；但明确禁止自动引入账号系统 / 数据库。
- **选择**：localStorage（`chronicle:favorites` / `chronicle:recent`），复用既有 `safeLocalStorage` 容错封装。
- **原因**：无账号体系下 localStorage 是唯一合理载体；只存 slug + 时间戳，读取时与可见文章求交（过滤已删/草稿）。
- **影响**：收藏与最近阅读**仅本浏览器可见**，不跨设备。
- **复查**：若将来引入账号，迁移到服务端。

## 2026-10-06 · D-021 · 归档页 `/archive` + 导航增 `/archive` `/favorites`

- **背景**：迭代 05 新增归档页与我的阅读页。
- **选择**：`MAIN_NAV_ITEMS` 增 `/archive`（归档）、`/favorites`（我的阅读），共 9 项。
- **原因**：二者是工作台侧栏的导航目的地；`/favorites` 虽为本地态，仍作为一级入口。
- **影响**：导航 7 → 9 项；`sitemap.ts` 同步（并顺手修 `/garden` `/links` 死链）。
- **复查**：迭代 06 复核导航密度。

## 2026-10-06 · D-022 · 全站装饰背景层保留

- **背景**：`SiteBackdropStage`（旋转平面带 + 圆环 + 网格）是装饰性视觉，含旧鼠尾草绿；首页已隐藏（D-016），非首页仍渲染。
- **可选**：A 全站移除 / B 保留。
- **选择**：**B**。
- **原因**：移除要动 `layout.tsx` + 删 `backdrop.css` + `SiteBackdropParallax` + 相关 e2e，成本中等而收益有限（已属低对比装饰，非阻塞）；用户未明确要求移除。
- **影响**：非首页仍有背景层。
- **复查**：若后续要求彻底中性灰，再清。

## 2026-10-06 · D-023 · `--text-dim` 调值达 WCAG AA

- **背景**：对比度核验发现三级文字 `--text-dim` 浅 3.24:1 / 深 4.12:1，**未达 AA 4.5:1**。
- **选择**：浅 `#8b8b93`→`#6f6f77`（4.77）、深 `#71717a`→`#7d7d86`（4.88）。
- **原因**：辅助文字（日期/元信息/计数）用得多，可读性优先；调后仍是三级灰（淡于二级）。
- **影响**：全站 `--text-dim` 变深一档。
- **复查**：迭代 07 复核视觉。

## 2026-10-06 · D-024 · MagneticCard 退役

- **背景**：迭代 04 去 `BlogCard` 的 MagneticCard，迭代 06 去 `ProjectCard` 的；此后无消费者。
- **选择**：删除 `MagneticCard.tsx` + test + `components.css` 的 `.magnetic-card` 规则。
- **原因**：3D 倾斜 + 光斑跟随是用户明令禁止的装饰动画；无引用即死代码。
- **影响**：`components/ui/` 少一个组件。
- **复查**：—

## 2026-10-06 · D-025 · CSP 去 Giscus 白名单（安全面收窄）

- **背景**：评论功能（Giscus）已删，但 `csp.ts` 仍在 `script-src`/`connect-src`/`frame-src` 放行 `https://giscus.app`；`site.ts` 仍存 `giscus` 配置；`.env.example` 仍存三项 env。均无消费者。
- **选择**：全清——CSP 去掉 giscus 放行与 `frame-src` 指令，删 `SITE_CONFIG.giscus`，清 `.env.example`。
- **原因**：给已删功能留的第三方放行是**实际攻击面冗余**（任何 giscus.app 出站内容都在白名单内）；且 `frame-src` 指令失去唯一目的。
- **影响**：CSP 更严；`csp.test.ts` 断言同步（改为「不得含 giscus.app」）。
- **复查**：—（安全面只收紧不放松，符合 ADR-0003「不放宽」原则）

## 2026-10-06 · D-026 · 清 `check-production-content` 的 search JSON 死代码

- **背景**：`PageExpectation.json` 字段的唯一生产者是 `/api/search` 探针（已删）；清探针后该字段（类型 + 消费逻辑 + 2 个测试）无生产者。
- **选择**：整块删除，search 用例改为「home-search」（首页含搜索框）。
- **原因**：无生产者的分支是死代码；保留会让 smoke 脚本误导后续读者。
- **影响**：`PageExpectation` 少一个可选字段。
- **复查**：—

## 2026-10-06 · D-027 · 恢复 remark-wikilink（修阅读体验退化）

- **背景**：重构删除 `remark-wikilink` 后，20 篇文章正文共 131 处 `[[slug|label]]` 语法**以字面量渲染**给读者（实测 `<p>...见 [[web-performance-optimization|Web 性能优化实战]]。</p>`），违反「不得牺牲阅读体验」硬约束。
- **可选**：A 恢复插件（渲染层修） / B 把 131 处语法改写成标准 Markdown 链接（内容层修）。
- **选择**：**A**。
- **原因**：插件是纯渲染转换，**内容不动**（符合「不擅自改内容格式」）；B 要动 20 个文件 131 处内容，风险与工作量都更大。
- **影响**：恢复 `wikilink.ts`（纯函数）+ `remark-wikilink.ts`（插件，去掉已删 popover 的 `data-wikilink` 属性）；`MdxContent` 重新挂载。**不恢复**花园 / 反链 / link-graph（独立链路）。
- **复查**：迭代 07 已验证渲染为 `<a href="/blog/...">`，字面量残留 0。

## 2026-10-07 · D-028 · 搜索 URL 写回当前路径

- **背景**：`SearchPanel` 挂在首页，却把查询写成 `/blog?q=...`。跨路径跳转会**卸载面板自身**，结果永不显示；空查询时首页还会被自动跳走（实测）。
- **可选**：A 保持首页搜索、URL 写回当前路径 / B 把 `SearchPanel` 也挂到 `/blog` / C 单独建 `/search` 路由。
- **选择**：**A**。
- **原因**：搜索的视觉定位是「首页核心入口」（迭代 03 已定），B/C 都要新增挂载点或路由，属范围扩张；URL 契约指向**面板所在页**才是自洽的。可分享性不降（`/?q=` 仍可分享）。
- **影响**：`SearchPanel` 的 `useEffect` 改 `location.pathname`；Playwright 6 项行为实测全过。
- **复查**：若后续搜索要独立成页，改 C 并同步 sitemap。

## 2026-10-07 · D-029 · `ws-section__*` 下沉到 `workspace.css`

- **背景**：`ws-section__title/head/link` 只定义在 `home.css`（仅首页加载），但 `LocalReadingList` 用在 `/favorites` → 该类在 `/favorites` 无样式。
- **可选**：A 只搬 `__title` 到 `reading.css` / B 整块 BEM block 下沉到全站加载的 `workspace.css`。
- **选择**：**B**。
- **原因**：拆散一个 BEM block 的两个元素到不同文件，正是这次 bug 的成因；该 block 语义就是「面板内通用 section 头」，消费者跨路由，理应全站可用。
- **影响**：`home.css` 少 24 行；`/favorites` 标题恢复样式。
- **复查**：—

## 2026-10-07 · D-030 · 删 rate-limit 的预览死代码

- **背景**：`checkPreviewRateLimit` / `PREVIEW_RATE_LIMIT_MAX` 的唯一消费者 `/api/preview` 已删；模块外零引用（实测）。模块头注释也过期（仍写「消费者：search / preview / csp-report」与「模块仍放在 `server/search`」）。
- **选择**：整块删除 + 订正注释为「当前唯一消费者：`/api/csp-report`」。
- **原因**：无消费者的导出是死代码；过期注释会误导后续读者。
- **影响**：`rate-limit.ts` 少 13 行；`checkCspReportRateLimit` 保留（仍在用）。
- **复查**：—

## 2026-10-07 · D-031 · 站点配色遗留在 OG 图与 theme-color

- **背景**：`tokens.css` 已改中性灰，但 `theme-color`（`#f1f0eb`/`#141716`）与两个 `opengraph-image.tsx`（暖纸底 + 鼠尾草绿 `#425c55`）仍是重构前配色。satori 不支持 CSS 变量，必须硬编码，故遗漏。
- **选择**：按 token 浅色值对齐 —— 底 `#fafafa`、主文字 `#18181b`、二级 `#52525b`、三级 `#6f6f77`、强调 `#4f6bed`、强调底 `rgba(79,107,237,0.1)`。
- **原因**：浏览器状态栏与社交分享卡片显示错误配色，与站内不一致。
- **影响**：两处 OG 图 + `layout.tsx` 的 `theme-color`。
- **复查**：—

## 2026-10-07 · D-032 · 三份「当前维护文档」按实现改写（ADR 例外）

- **背景**：`docs/HANDOFF.md` / `docs/ARCHITECTURE.md` / `docs/README.md` 三份**当前维护文档**在重构中一字未改，仍在描述已删架构（`/api/search`、`server/search`、`/garden`、`/links`、Giscus…）。违反用户硬约束 #7「不得只创建文档而不让文档与实际实施同步」。
- **可选**：A 只改这三份当前维护文档 / B 连 `docs/archive/`、`docs/ops/`、`docs/specs/` 一起刷成新架构。
- **选择**：**A**。
- **原因**：`docs/README.md` §「一条纪律」明文规定 —— 日期型报告、specs、archive 是**当时快照**，「不为了对齐当前统计而被改写，改写历史记录等于销毁证据」。B 违反仓库自身纪律。
- **影响**：三份文档同步实现；`adr/0006` 按 ADR 纪律**保留历史正文**，仅加状态修订注记（原「`/api/search` p95」触发条件随端点删除失效，改为客户端指标口径）。`docs/README.md` 另增 01–15 重构文档索引。
- **复查**：合并前若实现再变，需再同步一次。

## 2026-10-07 · D-033 · 修 3 条生产依赖漏洞（含 critical RCE）+ CI Node 对齐 24

- **背景**：CI `quality` job 挂在 `pnpm audit --prod --audit-level=high`，此后全部步骤 skip。查实三条 advisory，其中 **critical 命中本站所跑版本**：GHSA-vcvr-r3jv-pc5j「`next/og` ImageResponse RCE」（vulnerable `>=16.2.0 <16.3.6`），本站跑 `next@16.3.5`。另两条：`source-map-js` 事件循环 DoS（原 1.2.1）、`sharp` librsvg（原 0.35.4）。
- **可选**：A 只把 CI Node 改 24 / B A + 修三条依赖 / C 都不修只记录。**用户选 B**。
- **选择**：`next` 16.3.5 → **16.3.8**；新增 override `source-map-js: '>=1.2.2'`；`sharp` override 由 `>=0.35.4` **收紧**为 `>=0.35.5`。CI 4 处 `node-version: 22` → `24`（闭环 R8）。
- **原因**：
  1. critical 落在本站版本区间内，属**真实可利用面**，非「间接依赖的老问题」。
  2. 升级路径有独立验证：Dependabot PR #32 正是这条 next 升级，其 CI（quality / e2e / bundle-analyze）实测全 pass。
  3. `sharp` 原 override `>=0.35.4` 会把解析结果**摁在** `0.35.4` —— 恰落在新 advisory 受影响区间；`next@16.3.8` 的 `optionalDependencies` 仍声明 `^0.35.4` 不会自己抬，故必须显式收紧。
- **影响**：`pnpm audit --prod` 由 exit 1 → **exit 0**；CI `quality` 由 fail → **pass**，后续 format/lint/test/typecheck/build 首次在本分支实跑。`package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` / `.github/workflows/ci.yml`。
- **未做**：未改 Lighthouse 阈值（R12，既有基线红灯，改阈值等于拿标准迁就实现）；未修 dev 树 13 条（R13，CI 该步 `continue-on-error`）。
- **复查**：合并前确认 `pnpm audit --prod` 仍 exit 0（advisory 会推进）。

## 2026-10-07 · D-034 · 合并前全量审查：修 8 项漂移 + 冒烟脚本错误归属

- **背景**：PR #37 提交后做合并前审查（双轴 review + 本机实跑生产冒烟）。审查发现两类问题：① 冒烟脚本 `check-production-content` 的 `home` 期望仍要求首页含项目标题，而重构后首页不再展示项目列表；② 多处文档/注释与实现漂移（含我自己这几轮新引入的）。
- **关键发现（`home` 期望，最重）**：该脚本**只在 `deploy` job 运行，而 deploy 只在合并到 master 后触发** —— CI 四道门全绿也查不到它，等于合并即部署失败。本机起生产服实跑复现：`home: Missing expected content "公益API导航站"`。
- **可选**：A 改脚本期望（项目内容由 `/projects` 用例覆盖，不丢覆盖） / B 往首页加回项目展示 / C 删该条断言。
- **选择**：**A**。删 `homeProject` 期望与 `getFeaturedProjects` 导入，`home` 只留文章标题；项目内容仍由 `projects` 用例覆盖。
- **原因**：迭代 03 白纸黑字把首页定义为「欢迎区 + 主题云 + 文章列表 + 搜索入口」，**有意不含项目列表**（旧 `ProjectsSection` 是明确删除项）。是**断言放错了页面**，不是标准该降 —— B 会把已删的设计加回来，C 会丢覆盖。
- **一并修的漂移**（审查发现）：
  - `AGENTS.md`：`16.2`→`16.3.8`、React `19.2`→`19.3`、搜索「`/api/search` 服务端」→「客户端 Fuse」、测试 `99 files`→`72`、CSS `17 files`→`15` 并重列（去 links/search-ui/home-hero/home-sections，加 reading/workspace）、组件树去 `comments/`+`MagneticCard`+`SearchBar`、作品集名单（去已删的 ChronoPortal/ChronoRelay）。
  - `docs/ARCHITECTURE.md`：`16.3.5`→`16.3.8`；smoke 覆盖描述订正（去「收藏链接」，并注明该脚本只在 deploy 跑）。
  - `src/app/globals.css`：头部注释的 CSS 加载链（仍列 4 个已删文件）按实际重写。
  - `src/components/layout/Sidebar.tsx`：注释「归档待 Iteration 05 加入」——已在 `navigation.ts` 里，删该句。
  - `src/components/search/SearchPanel.tsx`：注释称写 `?sel=<slug>`——代码从不写 sel，删该句。
  - `docs/specs/2026-10-06-...md`：按 spec 惯例**保留正文**，头部加「实施后订正」说明 §4.2 的 `src/lib/search/` 未删（改客户端 Fuse，D-004/D-014）。
- **新登记 R14**：PRD 要求搜索「正文 / 范围筛选 / 词高亮」，实现均无。**未擅自扩功能**；已在 `02-product-requirements.md` 逐条列明差异，待定。其中「防抖」经复核判为**决策变更后的合理省略**（原为 HTTP 每键请求设计，客户端 Fuse 后 <1ms，防抖只会让输入变钝），非缩水。
- **影响**：`scripts/check-production-content.ts` + 6 份文档 + 2 处源码注释。冒烟本机实跑由 `home` 失败 → 通过（余两条 sitemap 为本地 base-url 与构建域名不一致的假阳性）。
- **复查**：合并后 deploy job 的 `check:production-content` 是最终验证；若仍红，须查真实生产内容。
