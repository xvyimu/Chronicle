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
- **复查**：后续追加（2026-10-09，D-040）新增第二个消费者 `/api/client-error`，注释已再次更新。

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

## 2026-10-07 · D-035 · R12 根因定位与修法实测；本轮不修、另开跟进

- **背景**：合并前审查要求把 R12（Lighthouse 间歇失败）的既有记录（「正文在 DOMContentLoaded 后入 DOM」）验实到可操作粒度。
- **可选**：A 我按实测值改骨架屏高度 / B 只把根因与修法落文档，视觉取值留待合并后定 / C 先合并，R12 另开跟进。**用户选 C**。
- **根因**：文章页流式渲染，先发 `src/app/blog/[slug]/loading.tsx` 骨架屏（约 520px，10 个占位块），真实正文（8880px）随后到。首帧 `body=940px`、**页脚 `.footer` 落在 `top=599px`——就在首屏内**；正文到达后页脚被推到 `y=10022`，这一次「顶走」即 0.0733 的位移。**并非字体切换**（先前文档的猜测方向对但归因不准）。
- **修法已实测**：给骨架屏外层加 `minHeight: '100vh'`，页脚首帧即 `top=1019px`（移出首屏），**CLS 0.0745 → 0.0012**；`next build` exit 0。实验文件已还原。
- **选择 C 的理由**：① 非本次重构引入（`loading.tsx` 与 `next.config.ts` 本 PR 均未改，master 同页更差 0.332）；② R12 间歇失败，不阻塞；③ 取 `100vh` 会有「一屏骨架 → 整页重排」的观感，最终取值（如 `60vh`）是设计判断，且需合并后在真机看。
- **影响**：`docs/13-risk-register.md`（新增「R12 跟进」节，含实测数据表与 diff）、`docs/iterations/iteration-08-...md` §17/§18、`docs/HANDOFF.md` §6、`docs/15-acceptance-checklist.md`。**源码未动**。
- **复查**：合并后按 R12 跟进节改 `loading.tsx`，复测 CLS 应落 0.002 内；同时订正 `lighthouse.config.js` 第 40 行过期的「历史 CLS ~0.13」注释。

## 2026-10-07 · D-036 · 拉丁字体自托管、中文走系统字体栈

- **背景**：合并 PR #37（`913c8cf`）时 Vercel Production 部署失败，实测生产站点仍跑重构前版本（首页含 `home-paper` / `Paper Gallery`）。根因是 `next/font/google` 在**构建期**从 Google 下载字体，拉不到时 Next 生成的虚拟模块 `@vercel/turbopack-next/internal/font/google/font` 解析失败 → build 挂。同 commit 一挂一过（CI 07:54 fail / Vercel 07:07、07:08 success），属间歇性。
- **可选**：A 全自托管（112 个 woff2，4.43 MB） / B 拉丁自托管 + 中文系统字体（3 个 TTF，192 KB） / C 只加字体缓存（仍依赖网络）。
- **选择**：**B**。详见 [ADR-0008](./adr/0008-self-hosted-latin-fonts.md)。
- **原因**：实测 `Noto Sans SC` 被切成 101 个 woff2 分片共 4.29 MB，全自托管不划算；且中文那条 `font-family` 原本就有 `system-ui` 兜底，去掉 webfont 不需改任何 CSS。拉丁字体仅 3 个文件，一次到位。选 TTF 而非 woff2 分片：文件少（3 vs 11）、代码简洁，仅多 52 KB（本机无 woff2 压缩工具）。
- **影响**：`src/app/fonts/` 新增 3 个 TTF；`layout.tsx` 改 `next/font/local` 并改 `body` 字体栈；`docs/adr/0008`、`docs/13-risk-register.md` R15。**构建不再依赖外网**——断网构建（无效代理强制失败）实测 exit 0。
- **取舍**：中文渲染随访客 OS 变化（Windows 微软雅黑 / macOS 苹方 / Android 思源），属有意选择。
- **复查**：若要求各平台字形完全一致 → 回到方案 A；中文系统字体在某平台出现明显缺陷 → 评估自托管中文子集。

## 2026-10-08 · D-037 · 移除 CI 的显式 `vercel deploy`，`deploy` job 改为 `post-deploy` 烟测

- **背景**：只读审计复核发现 master 主 CI 的 `deploy` job **自仓库有 CI 以来从未成功过一次**（连续 15 次 push run 全 failure），失败原文 `Error: The token provided via --token argument is not valid`（run `37751354760` 日志）。同期生产站点 HTTP 200 且跑的是重构后版本（首页命中 `workspace-home`）。
- **证据（2026-10-08 实测）**：`gh api repos/xvyimu/Chronicle/deployments` 显示 `vercel[bot]` 创建了 `d87050b` 的 Production deployment，08:40:42 状态 `success`——而该 run 的 `deploy` job 08:45:24 才启动、08:46:05 失败。说明生产部署由 Vercel Git 集成完成，CI 里这条 `npx vercel deploy --prod` 既非生产来源、又永远红灯。
- **可选**：A 删 `vercel deploy` 步，job 改名 `post-deploy`，只保留「等站点可达 + `check:production-content`」/ B 修 `VERCEL_TOKEN` secret 保留现状 / C 整个 job 删掉（连 production smoke 一起）。
- **选择**：**A**。
- **原因**：B 需要在 GitHub Settings 配一个与 Git 集成功能重复的部署通道，且显式 deploy 会绕过 Git 集成的构建缓存与预览流程；C 会丢掉 CI 里唯一的生产内容断言（首页标题、CSP 头、sitemap/RSS 等），而这是合并后唯一的端到端证据。A 保留断言、去掉死路径，不动生产部署方式（Git 集成）。
- **修订（同日）· 「等站点可达」不够，改为核对 revision**：初版 `wait-for-deployment.ts` 只轮询生产域名 HTTP 200。这**证明不了新 commit 已上线**——Vercel 在新部署构建期间仍服务上一版，200 恒定成立，smoke test 可能对着旧构建跑绿、新构建带病上线。改查 GitHub Deployments API：`GET /repos/{repo}/deployments?environment=Production` 里找 `sha === GITHUB_SHA` 且 `state=success` 才放行。**实测该 API 匿名可读**（repo public，`vercel[bot]` 提交记录含 sha；本地无 token 查 `d87050b` → `id=6931040077, state=success`）。
- **修订（同日）· token 权限与失败分类**：workflow 的 `permissions:` 只有 `contents: read`，而读 deployments 需要 `deployments: read`——把 `secrets.GITHUB_TOKEN` 发过去会 403。因 repo 是 public，脚本改为**带 token 收到 403 时自动改用匿名重试一次**，不依赖加 scope（也就不会因 scope 不匹配而红）。失败分三类：**401/404 等非 403 的 4xx 属配置错误**（repo 名错、凭据被撤销），重试无益，直接 exit 1，**不降级**——否则一个写错的 `GITHUB_REPOSITORY` 会让整步静默放行；**5xx / 429 / 403 属瞬时**（GitHub 把主限流与次限流都报 403），连犯两次且站点在线则降级为可达性探测并 exit 0（日志标 `revision NOT verified`），站点也不可达才算真失败。script 末尾用 `process.exitCode = 1` 而非 `process.exit(1)`——Windows 上后者会在 undici keep-alive 句柄关闭途中触发 libuv 断言（`UV_HANDLE_CLOSING`），以 `0xC0000409` 异常退出而非 1。
- **影响**：`.github/workflows/ci.yml` 的 `deploy` → `post-deploy`，删 `Deploy to Vercel` 步（含 `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` 三个 env），新增 `Wait for production deployment` 步（`scripts/wait-for-deployment.ts`）。文档同步：`ARCHITECTURE.md` §8/§9、`HANDOFF.md` §2/§4/§6、`launch-baseline.md` §2。
- **取舍**：删掉后 `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` 三个 secret 在 CI 中不再被引用，可在 GitHub Settings 中一并删除（本回合未动 secret，属仓库设置层）。
- **复查**：下一次 master push 后确认 `post-deploy` job 变绿且日志出现 `deployed to Production (id …)`；若出现 `degraded to HTTP probe`，说明 GitHub API 被限流或被网络阻断，需查 runner 出口。若 `wait-for-deployment` 因站点始终不可达而超时，说明 Git 集成部署失败——这正是该步要暴露的信号。

## 2026-10-08 · D-038 · 体积门禁加按路由首屏预算

- **背景**：只读审计判「体积门禁形同虚设」（悬案 2.4）——`check-bundle-budget.ts` 只有 chunks/CSS 单文件 300 KB 与总量 2048 KB 三条，实测 883.7 KB / 2048 KB → 留白 57%。一个路由多装一个重依赖（日期库、整包图标）总量都不到 2 MB，门禁不会变红。
- **可选**：A 加按路由首屏预算 / B 把总量阈值压到更贴 / C 不动。**选 A**。
- **原因**：B 只是调数字，不解决「一个路由悄悄变重不影响总量」这一真实回归路径；总量留白大本身不是缺陷，是字体子集化后的正常态。A 直接盯首屏：一个路由的 gzipped JS+CSS（浏览器第一帧真正下载的字节）若超阈值，即回归。
- **实现**：`scripts/check-bundle-budget.ts` 新增 `collectRouteAssets()` 与纯函数 `evaluateRouteBudgets()`。数据来源是 Next 的 per-route `page_client-reference-manifest.js`（`entryJSFiles` + `entryCSSFiles`）并 `build-manifest.json` 的 `rootMainFiles`/`polyfillFiles`——这是 Next 用来生成 `<script>`/`<link>` 标签的同一份清单。**验证过**：对 `/blog/nextjs-app-router` 起生产服抓 HTML，列出的 14 JS + 5 CSS 与脚本计算的并集**逐文件一致**（approach 1 over-counts by 0 files）。
- **阈值**：`ROUTE_BUDGET_KB = 285`（gzipped）。实测最重路由 `/blog/[slug]` 248 KB gz，其次 `/` 230.7 KB，中位 181.5 KB。285 留 ~15% 给内容增长；**实测压到 200 KB 时门禁正确变红 exit 1**（15 条 violation，全为 `[ROUTE EXCEEDED]`）。
- **影响**：`scripts/check-bundle-budget.ts`（新增 `collectRouteAssets`、`evaluateRouteBudgets`、`parseClientReferenceManifest`、`ROUTE_BUDGET_KB`、`ROUTE_BUDGET_EXEMPT`）；`src/lib/check-bundle-budget-script.test.ts`（7 例 → 16 例，新增 9 例覆盖 per-route 闸与 manifest 解析，含嵌套大括号）。CI `quality` job 的 `pnpm exec tsx scripts/check-bundle-budget.ts` 步无需改——脚本内部已加 per-route 报告。
- **取舍**：`/_global-error/page` 被免检（`ROUTE_BUDGET_EXEMPT`）——它不挂 app layout、不载 route CSS，数字不可比，也不是用户会到的页面。
- **复查**：若某路由因新增依赖超 285 KB，门禁会变红——此时要么移除该依赖，要么（有理由时）调高 `ROUTE_BUDGET_KB` 并记录依据。

## 2026-10-09 · D-039 · 生产探活改双链 + 判定表；`check:production-content` 对 WAF 403 降级

- **背景**：D-037 改造后 `post-deploy` job 的 `check:production-content` 从 GitHub Actions runner 访问生产站点，8 个用例**全部** HTTP 403。查 Cloudflare zone 的 `firewallEventsAdaptive` 拿到证据：`action=managed_challenge · ruleId=bot_fight_mode · source=botFight`，命中 IP 为 `20.161.30.244` / `48.217.25.151` / `172.203.196.190`（均为 Azure 段）。伪装 Claude/Chrome UA 无效——**CF 按 IP 评分，不看 UA**。同时新增的 `uptime.yml` 首跑也报 403 并开了 issue #43（已关，误报）。
- **可选**：A 让探活绕过 CF / B 探活判据放宽为「任一状态码即视为可达」/ C 加第二条绕过 CF 的探针，两条链各答一个问题。**选 C**。
- **为什么 A 做不到**：Free plan 的 Bot Fight Mode **不可被 WAF custom rule 的 Skip/Bypass/Allow 豁免**——它不在 Ruleset Engine 上运行（`developers.cloudflare.com/bots/get-started/bot-fight-mode` 的 Limitations → Rules，及 `waf/feature-interoperability`「Bot Fight Mode cannot be skipped」）。唯一逃生口是 IP Access Rules（Allow），但它**只按 IP/ASN/国家匹配、不支持 UA**，而 GHA runner 是 Azure 动态 IP，覆盖整个 ASN 等于关掉 BFM。想按 UA 豁免需升 Pro（Super Bot Fight Mode）。
- **为什么 B 不够**：把「拿到任何状态码」当健康，等于放弃了「origin 是否活着」这一问。CF 挑战的 403 证明边缘活着，**不证明源站活着**。
- **选择 C 的机制**：探两条链，各答一个问题——
  1. CF 域名（`SITE_URL`）→「Cloudflare 边缘 + 回源链路是否活着」
  2. Vercel 生产别名（`VERCEL_ORIGIN_URL`，绕过 CF）→「origin 本身是否活着」

  判定表（两条链同一套）：`2xx/3xx` → ok（正常应答/重定向）；`403/429` → ok（CF 挑战/限流，边缘在服务）；`5xx` → fault；`000`（连不上/超时）→ fault；其余 4xx（404 路由没了、401 要鉴权）→ fault。

- **谁决定结论（审查后修订）**：**主探针 = CF 域名**。CF 探针 fault 即整体 `down`；CF 探针 ok 即整体 `up`，**不看**第二条链。理由：Vercel 别名是同一条 runner 上的第二条网络路径，它失败可能只是 DNS（本机对 `*.vercel.app` 就有污染，解析到 Facebook 段）、区域路由或 Deployment Protection，而站点其实在正常服务。若按「任一链 fault 即 down」，叠加评论节流前会每 10 分钟刷一次误报。「origin 是否活着」由第二条链提供**证据**写进 issue，而不是第二次投票。代价：origin 单独挂而 CF 仍 200 的场景不会告警——但本站源站设了 `Cache-Control: private, no-cache, no-store`（`cf-cache-status: DYNAMIC`），**CF 不缓存、每请求回源**，所以 CF 拿不到 2xx 时第二条链必被触发，该场景实际被覆盖。
- **评论节流**：故障持续时不在同一 issue 上每 10 分钟追加评论（一天 144 条会埋掉真更新）。同 issue 上两条评论至少隔 1 小时。
- **为什么 CF 的 200 就等价于 origin 活着**：本站在源站设了 `Cache-Control: private, no-cache, no-store`，实测响应头 `cf-cache-status: DYNAMIC`——**CF 不缓存任何页面，每个请求都回源**。所以拿到 2xx 即已穿透到 origin；只有拿不到时，第二条链才需要出场去区分「CF 拦了我们」与「origin 真挂了」。
- **别名选型**：用 `blog-aijiai520.vercel.app`（项目生产别名，稳定），**不用** Vercel 每次部署生成的 `<project>-<hash>.vercel.app`——实测 8 次部署 URL 全不同，拿它做探活必炸。Vercel Deployment Protection 默认 Standard 只保护 preview/hash URL，生产别名公开。
- **实现**：`scripts/probe-health.ts`（新增，纯函数 `classifyStatus` / `overallState` / `buildReport` 可单测；写入 `$GITHUB_OUTPUT` 的 `state` 与 `$GITHUB_ENV` 的 `PROBE_REPORT`）。`uptime.yml` 改为 `node scripts/probe-health.ts`（Node 24 原生跑 TS，**不装 pnpm/依赖**，每 10 分钟拉一次全量依赖不值得）。`check-production-content.ts` 两处改：`fetchResponseWithRetry` 对 403 **不重试**直接返回（原来 5 次重试 × 8 页全是浪费），`main()` 在**全部用例都 403** 时 warn 并 exit 0。
- **诚实记账（降级 = 盲区）**：`check:production-content` 降级那一刻起，**部署后的内容正确性未被验证**（只验证了可达性）。这条不藏着——脚本日志明写 `Content CORRECTNESS was NOT verified this run`，本文件与 `HANDOFF.md` 同步记录。恢复真正的验证需二选一：允许探针身份（升 Pro 用 SBFM skip，或给探针挂 DNS-only 灰云的自定义域名）或改从 CF zone 内探测。归入延后运营。
- **影响**：`.github/workflows/uptime.yml`（重写）、`scripts/probe-health.ts`（新增）、`src/lib/probe-health-script.test.ts`（新增 13 例）、`scripts/check-production-content.ts` + 其测试（`fetchResponseWithRetry` 对 403 短路不重试、`checkPage` 遇 403 快速返回、新增纯函数 `isEveryPageBlocked` 仅在**全部 8 条用例**都被拦时降级 exit 0；测试 7 例 → 14 例）。Vitest 77 files / 608 tests（本机实测 exit 0）。
- **验证证据（本回合实跑）**：`actionlint` exit 0；`pnpm typecheck` exit 0；`lint` exit 0；`format:check` + `format:docs:check` exit 0；`check:docs` exit 0；`pnpm test` 77 files / 608 tests exit 0；对真实 `https://incca.ccwu.cc` 实跑 → `state: up`，`GITHUB_OUTPUT` 写入 `state=up`、`GITHUB_ENV` 写入 heredoc 格式的 `PROBE_REPORT`。
  - **可复现的证据**：上面几条命令都在仓里，谁都能重跑。`src/lib/probe-health-script.test.ts` 的 13 例锁定判定表与主/辅探针划分；`check-production-content-script.test.ts` 新增的 `isEveryPageBlocked` 5 例锁定「全部被拦才降级、部分被拦仍报错」。
  - **一次性的证据（未落盘，如实标明）**：三组本地假服务器端到端验证跑过并通过——probe-health 7 例（`cf403+vercel200→up`、`cf200+vercel-dead→up`、`cf522+vercel200→down`、`cf301→up`、`cf404→down`、`cf-dead→down`、`cf200+vercel500→up`）；`check:production-content` 全 403 → exit 0 + 降级告警；部分 403（首页 200）→ **exit 1 不降级**。脚本写在 `/tmp` 未进仓，**下一人无法重跑**。其中判定表那 7 例已由单测等价覆盖，`isEveryPageBlocked` 的区分度现也进了单测。
  - **未验**：Vercel 别名在 GitHub Actions runner 网络上是否可达（本机 DNS 污染，无法验证），属 UNVERIFIED。
- **复查**：master push 后确认 `post-deploy` 变绿且 `Check production content` 步出现 `all 8 checks returned HTTP 403` 的 warn（而非每条 `Missing expected content`）。
  - **后续实测（2026-10-09，合入 master `81bd1b0` 之后）**：`post-deploy` 已转绿，日志原文 `all 8 checks returned HTTP 403 ... Content CORRECTNESS was NOT verified this run (reachability only). Exiting 0.`——降级路径按预期生效。手动 `workflow_dispatch` 跑 `uptime` 两次（run `37918706738` / `37925731718`）均得到 `state: up` 且不开 issue。
  - **仍未闭环**：`uptime` 的 **`schedule` 事件从未触发过**。合入后等了两小时以上（12:49、13:21 UTC 均查），`event=schedule` 的全仓 run 数始终为 **0**；只有两次 `workflow_dispatch`。仓库无 fork、未归档、Actions enabled、workflow `state=active`、YAML 解析出的 `on.schedule` 正确、默认分支 `master` 上文件确实有 `*/10 * * * *`。**根因未定位**；社区有大量同类报告（`schedule` 注册可能因平台侧同步问题失效，官方建议推一个动到该 workflow 文件的 commit 触发 resync）。Cron 本身又是尽力而为（高峰可延迟甚至丢弃），不能当作精确计时器。**因此「站点持续探活」这条目前实际是不生效的**——文件在，但没人按点叫它。要真闭环，下一步要么推一个 resync commit 看是否恢复，要么把探活挪出 GitHub 的 cron（如 CF Worker 定时 / 外部 uptime 服务）。

## 2026-10-09 · D-040 · 客户端错误边界上报（补上运行时盲区）

- **背景**：只读审计指出「运行时可观测性」是本仓最大的工程盲区——`src/app/error.tsx` 捕获到异常后只做 `console.error`，然后给用户看一个错误码。**生产环境用户撞到错误，站点维护者完全不知道**。同批还有 CSP 上报只 `console.log` 不聚合、无 RUM、无 uptime 探活（后者已在 D-039 补）。
- **可选**：A 接 Sentry 等第三方 SDK / B 自建同源收集端点 + 客户端组装 / C 只改前端 UI 提示，不做上报。**选 B**。
- **原因**：A 的免费额度够用，但会把用户错误消息与堆栈发给第三方、需要加 CSP 白名单、并引入一个常驻依赖；对一个无后端、20 篇文章的静态内容站，代价与收益不成比例。C 等于什么都没解决。B 完全落在既有模式里——与 `/api/csp-report` 一样 collect-only、同样限流、同样白名单投影，**CSP 的 `connect-src 'self'` 已经允许这条路径，不需要放宽任何指令**。
- **实现**：`src/app/api/client-error/route.ts`（新增端点，Node runtime、8 KiB 上限、字段白名单 + 512 截断、204/429、不落库）；`src/lib/error-report.ts`（客户端组装与发送：`shouldReport` / `buildReport` / `sendErrorReport` / `reportError`）；`src/app/error.tsx` 的 `useEffect` 加一行 `reportError(error)`；`src/server/rate-limit.ts` 加 `checkClientErrorRateLimit`（`client-error:` 前缀，与 CSP 配额互不挤占，模块头注释同步更新）。
- **删除隐私的取舍**：只发 `pathname`，**查询串被丢弃**（可能含用户输入或 token）；不发 cookie、不发 referrer。字段白名单之外的东西（哪怕上报体里有 `email` / `cookie`）一律不进日志——有测试锁定这一点。
- **传输选择**：优先 `navigator.sendBeacon`（页面卸载也能送达），退回 `fetch({keepalive:true})`，两条路径都包在 try/catch 里。**上报失败绝不影响错误页渲染**——在 `useEffect` 里二次抛错会比丢掉一条遥测严重得多。
- **仅生产**：`NODE_ENV !== 'production'` 直接返回 false，本地开发的错误看终端即可。
- **诚实记账（这不是完整的可观测性）**：本方案只覆盖**客户端**错误边界。服务端渲染错误、Route Handler 异常、构建期问题都不经这里；也没有错误聚合与告警——日志留在 Vercel 函数日志里，要看还得人去翻。它是「从零到有痕迹」，不是「有监控」。真要闭环仍需 Sentry 一类或 Vercel 的日志产品。
- **影响**：新增 4 个文件（端点 + 端点测试 + 客户端模块 + 客户端测试），改 `error.tsx`、`rate-limit.ts`、`docs/API.md`、`docs/ARCHITECTURE.md`、本文件（含 D-030 复查行订正）。Vitest 79 files / 629 tests（本机实测 exit 0）。
- **复查**：生产环境制造一次错误（如访问一个会抛的页面）确认 Vercel 函数日志出现 `[client-error] {...}`。若要升级为真正的监控，评估 Sentry 或 Vercel 日志导出，并同步改本文件的安全面描述。
