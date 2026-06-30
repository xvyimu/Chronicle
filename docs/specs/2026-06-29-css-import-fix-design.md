# CSS 模块拆分失效修复设计

> 日期:2026-06-29
> 状态:已批准
> 关联:`docs/specs/2026-06-29-site-backdrop-architecture-design.md` (P2 阶段引入的回归)

## 1. 问题陈述

P2 阶段将 `globals.css` (2913 行) 拆分为 12 行入口 + 10 个语义模块文件 (`src/app/styles/*.css`),入口通过标准 CSS `@import "./styles/xxx.css"` 引入模块。

**回归现象**:拆分后所有页面文字堆叠、无背景、无定位 — CSS 规则完全未生效。

**诊断证据** (dev + build 双重验证):

| 检查项 | dev CSS bundle (377KB) | build CSS bundle (279KB+49KB) |
|--------|------------------------|-------------------------------|
| `@font-face` (字体) | ✅ 存在 | ✅ 存在 |
| Tailwind `@property` | ✅ 存在 | ✅ 存在 |
| `.editorial-hero` | ❌ NOT FOUND | ❌ NOT FOUND |
| `.site-backdrop__stage` | ❌ NOT FOUND | ❌ NOT FOUND |
| `body::before` | ❌ NOT FOUND | ❌ NOT FOUND |
| `--hero-ink` 变量 | ❌ NOT FOUND | ❌ NOT FOUND |

所有元素的 computed style 均为默认值 (`position: static`, `color: rgb(0,0,0)`, `fontSize: 16px`)。

**根因**:`postcss.config.mjs` 配置了 `postcss-import` 在 `@tailwindcss/postcss` 之前,但 Tailwind v4 的 `@tailwindcss/postcss` 插件接管整个 CSS 处理 pipeline,把 `@import "tailwindcss"` 和 `@plugin` 当作自己的指令处理,却**丢弃了标准的 `@import "./styles/xxx.css"` 语句** (不报错也不内联)。Turbopack dev 模式同样不执行 `postcss-import`。

**之前的 P2/P3 "build 成功" 验证是假的** — 只看了编译不报错 + SSG HTML 有 stage DOM,没验证 CSS 规则实际进入 bundle。这是验证缺失。

## 2. 修复方案

采用 **layout.tsx 显式 import** 方案 (Next.js App Router 官方做法)。

### 2.1 架构

```
src/app/layout.tsx (CSS import 入口)
├── ./globals.css              (Tailwind v4 入口: @import "tailwindcss" + @plugin)
├── ./styles/tokens.css        (设计令牌: --brand, --text, --hero-ink 等变量)
├── ./styles/base.css          (全局基础: skip-link, header, footer, reduced-motion)
├── ./styles/components.css    (通用组件: card, button, hero 容器)
├── ./styles/blog-ui.css       (博客 UI: SearchBar, TOC, CodeBlock 等)
├── ./styles/backdrop.css      (背景层: body::before/after + .site-backdrop__stage)
├── ./styles/home.css          (首页: Manifesto, ReadingPath, CTA)
├── ./styles/prose.css        (文章排版: .prose, code block)
├── ./styles/project-detail.css (项目详情)
├── ./styles/animations.css    (动画: reveal, fade-in-up, loading-intro)
└── ./styles/responsive.css    (响应式断点,最后加载覆盖前面)
```

### 2.2 关键改动

**`src/app/globals.css`** — 删除 10 行 `@import "./styles/xxx.css"`,只保留 Tailwind v4 入口:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

**`src/app/layout.tsx`** — 在 `import './globals.css'` 之后按顺序 import 10 个模块:

```tsx
import './globals.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/blog-ui.css';
import './styles/backdrop.css';
import './styles/home.css';
import './styles/prose.css';
import './styles/project-detail.css';
import './styles/animations.css';
import './styles/responsive.css';
```

### 2.3 顺序约束

- `tokens.css` 最先:定义 CSS 变量 (`--brand`, `--text`, `--hero-ink` 等),供后续模块引用
- `responsive.css` 最后:集中所有 `@media` 断点,覆盖前面模块的默认样式
- 其余按依赖顺序:base → components → blog-ui → backdrop → home → prose → project-detail → animations

## 3. 验证策略

### 3.1 静态验证

- `tsc --noEmit`:0 errors
- `eslint`:0 errors
- `pnpm build`:91 静态页面生成成功

### 3.2 CSS bundle 内容验证 (关键)

```powershell
# 检查 build 产物 CSS bundle 是否包含关键选择器
$f = Get-ChildItem .next/static/chunks/*.css | Select-Object -First 2
$f | ForEach-Object {
  $c = Get-Content $_.FullName -Raw
  Write-Host "$($_.Name): editorial-hero=$($c -match 'editorial-hero') site-backdrop=$($c -match 'site-backdrop') body-before=$($c -match 'body::before')"
}
```

**验收标准**:三个选择器全部为 `True`。

### 3.3 Dev 模式 computed style 验证

```js
// Playwright 验证
const cs = window.getComputedStyle(document.querySelector('.editorial-hero__content'));
// 验收: position === 'absolute', color !== 'rgb(0, 0, 0)'
```

### 3.4 视觉验证 (Playwright 截图)

- 首页 desktop: hero 区域有深色背景 + 装饰元素,文字不堆叠
- 首页 mobile: 响应式布局正确
- /blog、/about: 背景视觉一致

### 3.5 回归测试

- `pnpm test`:291 tests 全绿 (CSS 改动不影响 vitest)
- `pnpm test:e2e`:42 tests 全绿 (含新增的 4 个 backdrop E2E)

## 4. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 10 个独立 stylesheet 请求 | HTTP/2 多路复用,无性能影响。build 时 Turbopack 可能合并 |
| 模块间无 `@layer` 声明 | 按 import 顺序自然层叠,与原单文件效果一致 |
| import 顺序错误导致样式被覆盖 | 严格按 2.3 节顺序,代码注释标注顺序约束 |

## 5. 回滚

如修复失败:`git revert <commit>` 即可回到当前拆分但失效的状态,再考虑方案 B (合并回单文件)。

## 6. 范围

**本次只修 CSS 加载机制**,不改动:
- 组件代码 (`SiteBackdropStage.tsx` 等)
- CSS 规则内容 (10 个模块文件内容不变)
- 测试代码 (现有 291 + 4 E2E 测试无需改动)

## 7. 非目标

- 不引入 `@layer` 显式层叠声明 (YAGNI)
- 不调整 postcss.config.mjs (方案 A 不依赖 postcss-import)
- 不重构组件结构 (本次只修 CSS 入口)
