# SalesDex 风格改版方案

> 状态：Phase 1-3 已实施。当前实现已拆分为 `src/components/home/` 组件和
> `src/app/styles/` 语义 CSS 模块；本文件保留设计意图、验收标准和后续复查清单。

## 背景

参考站点：[sales-dex.jp](https://sales-dex.jp/)

本项目当前首页是克制的个人博客结构：居中 Hero、粒子背景、文章卡片、作品卡片。参考站点的核心价值不在具体文案，而在更强的叙事节奏：

- 首屏以大字号口号、深色媒体层和固定导航建立强记忆点。
- 页面滚动像章节推进，每一屏只讲一个观点。
- 大面积留白与低饱和背景让关键文字更有重量。
- 重复短语、细线、圆形轨迹、横向内容流制造品牌节奏。
- 案例、新闻、联系入口被整合成连续滚动故事，而不是普通列表。

目标是把这些模式转译为个人博客，而不是复制企业站内容。

## 改版目标

1. 让首页第一屏更像一个“个人知识品牌”入口，而不是普通博客目录。
2. 保留博客的实际用途：快速进入文章、导航收藏、作品、关于页。
3. 用更强的视觉秩序展示主题：云原生、全栈、自动化、个人收藏。
4. 在不引入重型动画库的前提下，实现高质感滚动体验。
5. 保持现有 SEO、RSS、MDX、测试、暗色主题和可访问性能力。

## 参考页可迁移模式

### 首屏

参考页表现：

- 顶部悬浮胶囊导航，左右保留品牌和标语。
- 大面积空白后进入深色视觉块。
- 超大衬线英文标题覆盖在深色媒体上。
- 底部细线分隔三个信息点。
- 移动端保留同样构图，只压缩标题和导航。

博客转译：

- 顶部保留现有 Header 的路由能力，但首页可使用更强的悬浮胶囊样式。
- Hero 口号改成大字号两行：
  - `Build Quiet Systems,`
  - `Write Useful Notes.`
- 中文副标放在右下或标题旁：`云原生 · 全栈 · 自动化 · 个人收藏`
- Hero 媒体层使用本地生成或 CSS/Canvas 视觉，不使用远程图。
- 底部信息点改成：
  - `Technical Notes`
  - `Open Source Work`
  - `Curated Links`

### 滚动叙事

参考页表现：

- “What / Why / How / Service” 以章节方式逐屏展开。
- 大字标题与轻文本形成对比。
- 圆形轨迹和浮动对象作为滚动过程的空间线索。

博客转译：

- 首页新增三个叙事段：
  - `Why`：为什么写这个站，强调记录实践、减少重复踩坑。
  - `How`：内容组织方式，文章、专题、项目、收藏相互连接。
  - `What`：读者能获得什么，配置清单、性能实践、工具入口。
- 每段只保留一个核心标题、一段短说明和一个跳转入口。
- 使用细线、编号、淡色大字背景增强章节感。

### 横向内容流

参考页表现：

- 案例区使用横向重复卡片流，形成运动感。
- 卡片不是普通网格，而是滚动中的内容轨道。

博客转译：

- 最新文章可以从 2 列卡片改为“横向精选轨道 + 次级列表”：
  - 首屏后展示 4 篇精选文章的横向轨道。
  - 每张文章卡片包含日期、分类、标题和一句摘要。
  - 桌面端支持横向滚动或 CSS marquee 式轻运动。
  - 移动端退化为纵向列表。
- 作品区可保留卡片，但加强图像比例和视觉层级。

### 媒体层

参考页表现：

- 页面中段有视频媒体块，辅助叙事而非单纯装饰。

博客转译：

- 不使用外部视频。
- 采用本地 Canvas 或 CSS 生成“技术地形”背景：
  - 细网格
  - 慢速粒子
  - 代码片段剪影
  - 文章标签流
- 如后续需要真实媒体，可放在 `public/images/hero/`，并使用 `next/image` 或原生 `<video>`。

## 信息架构

首页建议改为以下顺序：

1. Hero
   - 强口号、中文副标、三个入口、底部细线信息点。
2. Manifesto
   - 一屏讲站点定位：少一点噪音，多一点可复用经验。
3. Reading Path
   - 展示专题：VPS/DevOps、Web 性能、数据库、TypeScript。
4. Featured Articles
   - 横向精选文章轨道。
5. Curated Links
   - 展示导航页的几类收藏：AI、工程文档、自托管、VPS。
6. Projects
   - 展示作品，用更大媒体卡片承接视觉节奏。
7. Footer CTA
   - 引导到关于页、GitHub、RSS、导航收藏。

## 视觉规范

### 色彩

保留现有设计令牌，但新增一组“Editorial Hero”变量：

```css
--hero-ink: var(--text);
--hero-muted: var(--text-dim);
--hero-panel: #111426;
--hero-line: rgba(255, 255, 255, 0.72);
--hero-accent: var(--brand);
```

避免把页面做成单一紫色主题。紫色只用于品牌强调、按钮和小面积光效；主体仍以黑白灰、蓝黑媒体层和低饱和背景为主。

### 字体

当前使用 `Noto Sans SC` 与 `JetBrains Mono`，可以继续保留。为了接近参考页的大标题质感，建议只在 Hero 英文标题引入一个展示字体：

- 首选：`Cormorant Garamond` 或 `Playfair Display`
- 获取方式：`next/font/google`
- 使用范围：Hero 大标题和少量章节英文，不用于正文。

中文标题继续使用 `Noto Sans SC`，避免中英文混排失衡。

### 排版

- Hero 英文标题桌面端高度接近首屏下半区，字号可在 `clamp(4rem, 10vw, 9rem)`。
- 字间距保持 `0`，不使用负字距。
- 中文副标使用中等字重，控制在两行以内。
- 章节标题使用大号淡色背景字 + 正常标题组合。

### 圆角与卡片

参考页大量使用胶囊导航，但内容区并不是堆叠卡片。本项目应遵守：

- 顶部导航可使用胶囊。
- 普通内容区避免卡片套卡片。
- 文章卡片和项目卡片圆角不超过现有 `--radius-sm` 或 `--radius`。
- 页面 section 使用全宽布局和留白，不做漂浮大卡片容器。

## 动效规范

### 可实现动效

1. 页面加载进度
   - 可实现轻量 `LoadingIntro` 客户端组件。
   - 首次访问显示 0-100 的短进度，之后通过 sessionStorage 跳过。
2. Hero 媒体视差
   - 使用 CSS transform + scroll progress。
   - 尊重 `prefers-reduced-motion`。
3. 横向文章轨道
   - 桌面端使用 CSS scroll-snap。
   - 不自动高速滚动，避免影响阅读。
4. 章节进入动画
   - 使用 IntersectionObserver 添加 `is-visible`。
   - 保持 150-300ms 的短动画。

### 不建议实现

- 不引入 GSAP、Lenis 等重型滚动动画库，除非后续明确要做整站动效系统。
- 不做不可控的滚动劫持。
- 不做长时间 loading。
- 不把正文内容隐藏到动画完成之后。

## 技术落点

### 推荐新增组件

```text
src/components/home/
├── EditorialHero.tsx
├── ManifestoSection.tsx
├── ReadingPathSection.tsx
├── FeaturedArticleRail.tsx
├── CuratedLinksPreview.tsx
├── HomeCtaSection.tsx
├── RevealOnScroll.tsx
└── LoadingIntro.tsx
```

### 推荐新增样式块

当前项目的 CSS 已从 `globals.css` 拆到 `src/app/styles/`，首页相关样式主要在：

- `home.css`：首页 Hero、Manifesto、ReadingPath、ArticleRail、LinksPreview、CTA
- `backdrop.css`：全站三层背景 stage
- `animations.css`：加载和 reveal 动画
- `responsive.css`：响应式覆盖

`globals.css` 只保留 Tailwind v4 入口；CSS 模块在 `src/app/layout.tsx` 显式导入。

### 数据来源

优先复用现有数据：

- 文章：`getAllPosts()`
- 作品：`getFeaturedProjects()`
- 站点配置：`SITE_CONFIG`
- 链接收藏：`getAllLinkCategories()` / `data/links.json`
- 专题：文章 frontmatter 的 `series` 字段经 `src/lib/series.ts` 聚合

如果首页要展示专题，可以从现有文章 frontmatter 的 `series` 字段派生，不新增独立数据源。

## 迁移步骤

### Phase 1：低风险视觉改造

目标：只改首页首屏和基础 section 节奏。

范围：

- 新增 `EditorialHero`
- 替换当前 `hero` 结构
- 保留现有最新文章和精选作品数据
- 不改博客详情页、列表页、导航页

验收：

- 首页桌面首屏有明显品牌记忆点。
- 移动端标题不溢出。
- `pnpm test`、`pnpm lint`、`pnpm exec tsc --noEmit` 通过。
- Chrome 截图确认无重叠、无横向滚动。

### Phase 2：滚动叙事与内容轨道

目标：把首页从列表式改成叙事式。

范围：

- 新增 Manifesto/Reading Path/Curated Links Preview
- 最新文章改为横向精选轨道
- 项目区视觉升级

验收：

- 首页信息架构完整。
- 所有入口可达。
- 键盘导航顺序合理。
- `prefers-reduced-motion` 下无强制动画。

### Phase 3：动效与精修

目标：增加轻动效和更精致的媒体层。

范围：

- LoadingIntro
- Hero 视差
- Section reveal
- 文章轨道动效

验收：

- Lighthouse 不出现明显性能退化。
- 控制台无错误。
- 移动端不卡顿。
- E2E 至少覆盖首页关键入口。

## 测试计划

### 单元/组件测试

- 首页渲染站点名称、主口号和主要入口。
- FeaturedArticleRail 渲染指定数量文章。
- CuratedLinksPreview 渲染来自 `data/links.json` 的分类。

### E2E

- 首页首屏加载。
- 点击 Blog/Links/Projects/About 入口可跳转。
- 移动菜单可打开并跳转。
- reduced motion 模式下页面仍可阅读。

### 浏览器视觉检查

使用 Chrome 复查：

- `1440x1000` 首页首屏
- `390x844` 首页首屏
- 滚动到文章轨道
- 滚动到项目区
- 暗色主题首页

当前自动化覆盖：

- Vitest：首页和 home 组件测试。
- Playwright：首页关键入口、背景 stage、视差变量、reduced-motion、专题入口。

## 风险与约束

### 性能风险

大字号、视频、Canvas、滚动动画都可能增加首屏成本。第一版不引入视频，不新增远程图片，不使用大型动画库。

### 可访问性风险

强视觉页面容易忽略语义结构。实现时必须保留：

- 单一 `h1`
- 可见焦点
- `prefers-reduced-motion`
- 真实文本，不用纯图片承载关键信息

### 内容风险

参考页是企业销售咨询站，本项目是个人技术博客。只迁移视觉叙事模式，不迁移销售话术、案例结构和联系转化逻辑。

### 维护风险

首页不能变成难维护的动画实验场。组件要按数据驱动，文章和项目仍来自现有数据层。

## 验收清单

- [x] 首页 Hero 完成 SalesDex 风格转译，但保留本站身份。
- [x] 首页不是营销落地页，第一屏仍能进入文章和导航收藏。
- [x] 桌面与移动端无文本溢出、无横向滚动。
- [x] 动画尊重 `prefers-reduced-motion`。
- [x] 没有远程图片依赖。
- [x] 不破坏 RSS、sitemap、SEO 元数据。
- [x] 全量测试、lint、typecheck 通过。
- [x] Chrome 视觉复查通过。

复查记录（2026-07-03）：

- Chrome production 模式复查 `1440x1000` 首页首屏、`390x844` 首页首屏、专题列表/详情、导航页和暗色主题首页。
- CSP nonce 已覆盖 Next 水合脚本与 JSON-LD；控制台无 CSP 错误。
- 移动端隐藏装饰代码标签，避免遮挡 Hero 文案；专题卡片补 `min-w-0`，避免窄屏横向滚动。

## 决策建议

后续只建议做小步视觉复查和内容补充，不再继续扩大动画复杂度。
