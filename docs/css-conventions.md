# CSS 范式统一规范

## 架构概览

本项目采用 **双层 CSS 策略**：BEM 自定义类用于结构性组件，Tailwind 工具类用于原子化调整。

```
globals.css                   ← Tailwind v4 入口，不承载 @import 链
src/app/layout.tsx            ← 显式 import 语义 CSS 模块
├── styles/tokens.css         ← 设计令牌、明暗主题变量、滚动条
├── styles/base.css           ← 全局基础、skip-link、Header、Footer
├── styles/components.css     ← Section / Card 等通用布局组件
├── styles/archive.css        ← ArchiveCard / 归档网格 / 归档列表
├── styles/controls.css       ← Button / Pagination / TagLink / 小型控制
├── styles/links.css          ← 个人收藏导航目录
├── styles/blog-ui.css        ← BlogCard / TOC / Tag cloud / Image zoom
├── styles/search-ui.css      ← SearchBar / Search results
├── styles/article-ui.css     ← Article layout / Article panels / Related posts
├── styles/backdrop.css       ← Paper Gallery 背景层
├── styles/home.css           ← 首页主题覆盖、共享样式、首页响应式
├── styles/home-hero.css      ← 首页 EditorialHero
├── styles/home-sections.css  ← 首页叙事区块与 CTA
├── styles/prose.css          ← MDX 文章排版样式
├── styles/project-detail.css ← 项目详情
├── styles/animations.css     ← reveal / loading / fade motion
└── styles/responsive.css     ← 响应式断点覆盖，最后加载
```

不要在 `globals.css` 里写 `@import "./styles/xxx.css"`。Tailwind v4 的
`@tailwindcss/postcss` 可能静默丢弃这些导入；CSS 模块必须在
`src/app/layout.tsx` 顶部显式 import。

## 决策树：BEM 还是 Tailwind？

```
这个样式是否跨页面/组件复用？
├── 是 → 写 BEM 自定义类，放入对应的 .css 文件
└── 否 → 这个样式是否超过 3 个工具类组合？
    ├── 是 → 考虑写 BEM 类（避免 className 过长）
    └── 否 → 直接用 Tailwind 工具类
```

### 使用 BEM 自定义类的场景

- **结构性布局**：`.section`、`.header`、`.hero`、`.cards`
- **跨页面复用组件**：`.card`、`.btn`、`.blog__item`、`.tag-link`
- **需要 `:hover`/`:focus`/状态变化的复杂交互**：`.header--scrolled`、`.header__nav.is-open`
- **需要响应式 media query 覆盖的样式**：放入 `responsive.css`

### 使用 Tailwind 工具类的场景

- **一次性布局微调**：`flex items-center gap-3`
- **间距/尺寸**：`mt-4`、`px-6`、`max-w-3xl`
- **响应式工具**：`md:flex`、`lg:grid-cols-3`
- **颜色引用令牌**：`text-[var(--text-dim)]`、`bg-[var(--surface)]`

### 禁止混用的场景

```tsx
// ❌ 不要在 BEM 类上叠加重复的 Tailwind
<div className="section p-64px max-w-1200px">

// ✅ BEM 类已包含这些样式，不需要重复
<div className="section">

// ✅ Tailwind 用于 BEM 未覆盖的微调
<div className="section mt-8">
```

## 设计令牌系统

所有颜色、阴影、圆角必须通过 CSS 变量引用，禁止硬编码。

### 令牌清单

| 令牌                | 用途       | 亮色值                  | 暗色值                   |
| ------------------- | ---------- | ----------------------- | ------------------------ |
| `--bg`              | 页面背景   | `#ffffff`               | `#0f0f1a`                |
| `--bg-soft`         | 次级背景   | `#f7f8fa`               | `#181828`                |
| `--surface`         | 卡片表面   | `#ffffff`               | `#1a1a2e`                |
| `--text`            | 主文字     | `#1a1a2e`               | `#e4e4f0`                |
| `--text-soft`       | 次级文字   | `#4a4a68`               | `#b0b0c0`                |
| `--text-dim`        | 弱化文字   | `#8e8ea0`               | `#6e6e88`                |
| `--border`          | 默认边框   | `#e8e8ef`               | `#2a2a40`                |
| `--brand`           | 品牌色     | `#6366f1`               | `#818cf8`                |
| `--brand-soft`      | 品牌色浅底 | `rgba(99,102,241,0.08)` | `rgba(129,140,248,0.12)` |
| `--shadow-sm/md/lg` | 阴影层级   | —                       | —                        |
| `--radius`          | 默认圆角   | `12px`                  | `12px`                   |
| `--radius-sm`       | 小圆角     | `8px`                   | `8px`                    |

### 引用规则

```css
/* ✅ 正确：使用令牌 */
color: var(--text-dim);
background: var(--surface);
border: 1px solid var(--border);

/* ❌ 禁止：硬编码颜色 */
color: #8e8ea0;
background: #ffffff;
```

```tsx
// ✅ Tailwind 中引用令牌
<span className="text-[var(--text-dim)]">
<div className="bg-[var(--surface)]">

// ❌ 禁止：硬编码
<span className="text-gray-400">
<div className="bg-white">
```

## BEM 命名规范

遵循 `block__element--modifier` 模式：

```css
/* Block：独立组件 */
.card {
}

/* Element：组件内部部件 */
.card__title {
}
.card__desc {
}
.card__foot {
}

/* Modifier：状态或变体 */
.card--project {
} /* 项目卡片变体 */
.card--featured {
} /* 精选状态 */

/* 状态类：用 .is- 前缀 */
.header__nav.is-open {
}
```

### 命名规则

1. **Block 名**：使用语义化名称，不用表现性名称（`.card` 不用 `.rounded-box`）
2. **Element 名**：描述角色，不用位置（`.card__title` 不用 `.card__top`）
3. **Modifier 名**：描述状态或变体，不用值（`.btn--primary` 不用 `.btn--indigo`）
4. **状态类**：用 `.is-` 前缀表示运行时状态（`.is-open`、`.is-active`、`.is-loading`）

## 文件归属规则

| 文件                 | 内容                                        | 示例                                        |
| -------------------- | ------------------------------------------- | ------------------------------------------- |
| `tokens.css`         | CSS 变量、reset、主题切换、滚动条、选中样式 | `:root`、`.dark`、`::selection`             |
| `base.css`           | 页面骨架和全局基础                          | `.header`、`.footer`、`.skip-link`          |
| `components.css`     | 可复用布局和基础卡片                        | `.section`、`.card`、`.cards`               |
| `archive.css`        | 归档页和 ArchiveCard                        | `.archive-grid`、`.archive-card`            |
| `controls.css`       | 按钮、分页、标签链接和轻量控制              | `.btn`、`.pagination`、`.tag-link`          |
| `links.css`          | 收藏导航目录                                | `.links-directory`                          |
| `blog-ui.css`        | 博客列表、目录和辅助界面                    | `.blog__item`、`.toc`、`.tag-cloud`         |
| `search-ui.css`      | 搜索输入与结果列表                          | `.search-bar`、`.search-results`            |
| `article-ui.css`     | 文章详情布局和阅读面板                      | `.article-layout`、`.article-panel`         |
| `backdrop.css`       | 背景视觉层                                  | `body::before`、`.site-backdrop__stage`     |
| `home.css`           | 首页主题覆盖、共享样式和响应式              | `.home-paper`、`body:has(.home-paper)`      |
| `home-hero.css`      | 首页首屏                                    | `.editorial-hero`                           |
| `home-sections.css`  | 首页内容区块                                | `.home-manifesto`、`.home-article-rail`     |
| `prose.css`          | MDX 渲染的文章排版                          | `.prose h2`、`.prose code`、`.code-toolbar` |
| `project-detail.css` | 项目详情页                                  | `.project-detail`                           |
| `animations.css`     | 动画关键帧和动效类                          | `.reveal`、`.loading-intro`                 |
| `responsive.css`     | 媒体查询覆盖                                | `@media (max-width: 768px)`                 |

**规则**：新组件的 CSS 放入最接近语义归属的模块。跨页面通用组件放入
`components.css` / `archive.css` / `controls.css`；博客专属放入 `blog-ui.css` /
`search-ui.css` / `article-ui.css`；首页专属放入 `home.css` / `home-hero.css` /
`home-sections.css`；
最后由 `layout.tsx` 显式导入新 CSS 文件。

## shadcn 与本地 BEM 的分工

- shadcn 组件负责可访问性、语义 slot、基础 variant。
- BEM 类负责本站 Paper Gallery 视觉语言。
- 小型元信息 chip 使用 `src/components/ui/MetaBadge.tsx`，不要再手写裸
  `span` 加边框圆角。
- 分类/专题归档卡片使用 `src/components/layout/ArchiveCard.tsx`。
- 标准 section 外壳使用 `src/components/layout/PageSection.tsx`。
- 迁移时优先保留旧 BEM 类名，避免扩大 CSS 和测试变更面。

## 响应式设计

### 断点

| 断点   | 宽度      | 用途               |
| ------ | --------- | ------------------ |
| 移动端 | `≤ 768px` | 单列布局、汉堡菜单 |
| 桌面端 | `≥ 769px` | 多列布局、完整导航 |

### 实现方式

1. **Tailwind 响应式工具**（优先）：`md:flex`、`lg:grid-cols-3`
2. **`responsive.css` 媒体查询**（覆盖）：当 Tailwind 工具无法满足时

```css
/* responsive.css 中覆盖 BEM 类的响应式样式 */
@media (max-width: 768px) {
  .section {
    padding: 40px 16px;
  }
  .cards--2,
  .cards--3 {
    grid-template-columns: 1fr;
  }
}
```

## 暗色主题

通过 `<html>` 上的 `.dark` 类切换。所有颜色通过 CSS 变量自动适配。

```tsx
// ✅ 正确：使用令牌，暗色自动适配
<div className="bg-[var(--surface)] text-[var(--text)]">

// ❌ 禁止：手动写暗色覆盖
<div className="bg-white dark:bg-gray-900">
```

## 反模式

| 反模式                  | 问题               | 正确做法                          |
| ----------------------- | ------------------ | --------------------------------- |
| 硬编码颜色              | 暗色主题失效       | 使用 `var(--*)` 令牌              |
| BEM + Tailwind 重复     | 样式冲突、维护困难 | BEM 类负责结构，Tailwind 负责微调 |
| 内联 style 写颜色       | 无法主题切换       | 用 CSS 变量或 Tailwind 令牌引用   |
| 在 JSX 中写 media query | 无法实现           | 放入 `responsive.css`             |
| 用 `!important` 覆盖    | 特异性战争         | 提高选择器精度或调整顺序          |
| 组件 CSS 散落多个文件   | 难以查找           | 按文件归属规则集中管理            |
