# 全站背景架构优化设计

> 日期：2026-06-29
> 范围：SiteBackdrop 性能优化（D）+ globals.css 拆分（A）合并实施
> 状态：待用户审阅

---

## 1. 背景与动机

### 当前状态

上一轮将首页 EditorialHero 的 stage 视觉（深蓝渐变 + 紫色光晕 + 网格遮罩 + 飞机条/网格圈/代码块 + 鼠标视差跟随）提取为全站共享的 `<SiteBackdrop/>` 组件，所有页面统一深色 stage 背景。

实现存在两个架构问题：

| 问题 | 根因 | 影响 |
|---|---|---|
| 首屏白屏风险 | `SiteBackdrop` 是 `'use client'`，背景需等 React hydration 才渲染 | 首屏短暂无背景 |
| 客户端 JS 浪费 | 装饰元素 DOM（飞机条/网格圈/代码块）在 client 渲染 | JS 体积 ~2-3KB，本可 SSG |
| CSS 单文件难维护 | `globals.css` 2913 行，令牌/布局/组件/背景/首页/响应式混在一起 | 与 AGENTS.md 声称的 `src/app/styles/` 目录不符 |
| `body::before` 机会未利用 | 静态背景层本可纯 CSS（伪元素）实现，零 JS | 性能可进一步优化 |

### 目标

把全站背景拆为三层（静态 CSS + 静态 DOM + 视差 client），并把 `globals.css` 拆为 8 个语义模块文件。

### 非目标

- 不改变视觉外观（颜色、装饰元素、动画效果保持不变）
- 不重构内容层组件（Header / Footer / main 内的页面组件）
- 不引入新的依赖
- 不改变主题切换逻辑（亮/暗模式切换仍由 `<html class="dark">` 控制）

---

## 2. 架构概览

### 三层背景架构

```
┌─ body::before / body::after  (纯 CSS 伪元素，SSG 随 HTML 发送)
│  渐变 + 紫色光晕 + 1px 网格遮罩
│  零 JS、零 FOUC、首屏立即可见
│  position: fixed; z-index: -2; pointer-events: none
│
├─ <SiteBackdropStage/>         (server component，SSG 静态 DOM)
│  装饰元素: 飞机条 × 2 + 网格圈 + 代码块 × 2
│  无 'use client'、无 useEffect、无 hydration
│  position: fixed; z-index: -1; pointer-events: none
│  transform: translate(var(--parallax-x), var(--parallax-y))
│
└─ <SiteBackdropParallax/>      (client component，仅视差跟随)
   仅 1 个 useEffect + mousemove/mouseleave 监听
   写 CSS 变量到 .site-backdrop__stage 节点
   returns null（无 DOM 输出）
   prefers-reduced-motion → return early，不挂监听
   JS 体积 < 1KB gz
```

### CSS 模块拆分

```
src/app/
├── globals.css          (入口，~10 行，仅 @import 8 个模块 + tailwindcss)
└── styles/
    ├── tokens.css       (~80 行)  CSS 变量: 亮/暗主题 + 间距 + 阴影 + 字体变量 + View Transitions
    ├── base.css         (~140 行) 全局 reduced-motion + skip-link + Header + Footer + Reading Progress + Back to Top + Touch target + Section
    ├── components.css   (~340 行) Card + Cards grid + Hero(旧) + Stat-pill + Buttons + Blog List + Pagination + Tag-link + Project Card + TOC + Search + Theme Toggle + Tag Cloud + Reading Prefs + Image Zoom + 404 + Reveal on scroll + Page Transitions + Loading Intro
    ├── backdrop.css     (~115 行) .site-backdrop 全套 + .editorial-hero 全套 + body::before/after + hero-mesh-rotate / hero-code-float keyframes
    ├── home.css         (~340 行) Home Manifesto + Reading Path + Article Rail + Links Preview + Home Projects + Home CTA
    ├── prose.css        (~280 行) Prose 排版 + Code block + Code toolbar + Code line + Code highlighted
    ├── project-detail.css (~80 行) Project Detail (back/header/title/meta/year/tag/image/desc/actions)
    └── responsive.css   (~440 行) 移动优先适配 (≥1024 / 768-1023 / ≤767 / ≤374 / print)
```

### 渲染流程

```
SSG build (next build):
  HTML 字符串生成时:
    - body::before/after 由 <style> 标签内的 CSS 提供
    - <SiteBackdropStage/> 渲染为静态 <div> 字符串
    - <SiteBackdropParallax/> 在 SSR 时返回 null
    - <Header> <main> <Footer> 正常渲染
  输出: 完整 HTML 含背景视觉 + 内容

浏览器接收 HTML:
  解析 <head> → 应用 <style>
    ↓
  body::before/after 立即渲染 (首屏背景可见，零白屏)
    ↓
  解析 <body> → 渲染静态 DOM
    ↓
  .site-backdrop__stage 装饰元素立即可见
    ↓
  <main> 内容立即可见 (首屏完整)

React hydration:
  <SiteBackdropParallax/> 挂载
    - 检查 prefers-reduced-motion
      - true:  return (不挂监听)
      - false: addEventListener('mousemove')
    - 视差跟随生效 (鼠标移动时装饰元素 8px 视差)
```

---

## 3. 组件设计细节

### 3.1 `body::before` / `body::after` 静态 CSS 层

**纯 CSS，无组件**。承载最关键的视觉基底。

```css
/* backdrop.css */

body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 42%),
    radial-gradient(circle at 74% 28%, rgba(84, 87, 224, 0.34), transparent 28%),
    linear-gradient(135deg, #111426, #070913);
}

body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(180deg, transparent 0%, black 36%, black 100%);
  opacity: 0.55;
}
```

**为什么用两个伪元素**：一个承载渐变（不透明），一个承载网格遮罩（半透明 + mask）。CSS 伪元素在 SSG HTML 中以 `<style>` 标签随 HTML 一起发送，首屏立即可见。

### 3.2 `<SiteBackdropStage/>` server component

```tsx
// src/components/layout/SiteBackdropStage.tsx
// 无 'use client'，纯 server component

export default function SiteBackdropStage() {
  return (
    <div className="site-backdrop__stage" aria-hidden="true">
      <div className="site-backdrop__plane site-backdrop__plane--back" />
      <div className="site-backdrop__plane site-backdrop__plane--front" />
      <div className="site-backdrop__mesh" />
      <div className="site-backdrop__code site-backdrop__code--one">pnpm test</div>
      <div className="site-backdrop__code site-backdrop__code--two">deploy --quiet</div>
    </div>
  );
}
```

**职责**：渲染装饰元素的静态 DOM 节点。SSG 时随 HTML 发送，无需 hydration。

### 3.3 `<SiteBackdropParallax/>` client component

```tsx
// src/components/layout/SiteBackdropParallax.tsx
'use client';

import { useEffect } from 'react';

export default function SiteBackdropParallax() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) return;

    const stage = document.querySelector('.site-backdrop__stage');
    if (!stage) return;

    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      stage.style.setProperty('--parallax-x', `${x * 8}px`);
      stage.style.setProperty('--parallax-y', `${y * 8}px`);
    };

    const handleLeave = () => {
      stage.style.setProperty('--parallax-x', '0px');
      stage.style.setProperty('--parallax-y', '0px');
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, []);
  return null;
}
```

**职责**：挂载 `mousemove` 监听，更新 `--parallax-x/y` CSS 变量驱动 `.site-backdrop__stage` transform。

**JS 体积估算**：~50 行源码，minified+gzip 后约 600-800 字节，< 1KB gz。

### 3.4 layout.tsx 整合

```tsx
<body className="flex min-h-full flex-col text-[var(--text)]" style={...}>
  {/* 静态背景层 (body::before/after 由 CSS 自动渲染，无需组件) */}

  {/* 装饰元素静态 DOM (SSG) */}
  <SiteBackdropStage />

  {/* 视差跟随 client (hydration 后生效) */}
  <SiteBackdropParallax />

  <a href="#main-content" className="skip-link">跳到主要内容</a>
  <Header />
  <main id="main-content" className="flex-1 animate-fade-in">{children}</main>
  <BackToTop />
  {renderVercelInsights ? (<><Analytics /><SpeedInsights /></>) : null}
  <Footer />
</body>
```

**z-index 层级**：
- `body::before/after`: `z-index: -2`（最底）
- `.site-backdrop__stage`: `z-index: -1`（中间，含装饰元素）
- `main` / `Header` / `Footer`: `z-index: 0+`（内容）

### 3.5 与当前实现对比

| 维度 | 当前 | 优化后 |
|---|---|---|
| 首屏渲染 | client hydration 后才看到背景 | SSG HTML 已含背景 |
| 客户端 JS | ~2-3KB（含装饰 DOM 渲染 + 视差） | ~0.7KB（仅视差） |
| 装饰元素 | client 渲染 5 个 div | SSG 静态 5 个 div |
| 视觉 | 不变 | 不变 |
| `prefers-reduced-motion` | useEffect 内 return | useEffect 内 return（不变） |

---

## 4. CSS 拆分映射表

### globals.css 现状：2913 行单文件 → 拆分为 8 个文件

| 目标文件 | 行数估算 | 来源行段 | 内容 |
|---|---|---|---|
| `styles/tokens.css` | ~80 | 1-87 | `@theme` + `:root`（亮） + `.dark`（暗） + View Transitions + scrollbar |
| `styles/base.css` | ~140 | 89-425 | 全局 reduced-motion、skip-link、Header、Footer、Reading Progress、Back to Top、Touch target、Section、Section head/eyebrow/title/subtitle/action/link |
| `styles/components.css` | ~340 | 427-1378 + 1430-1830 | Card、Cards grid、Hero(旧)、Stat-pill、Buttons、Blog List、Pagination、Tag-link、Project Card、TOC、Search、Theme Toggle、Tag Cloud、Reading Prefs、Image Zoom、404、Reveal on scroll、Page Transitions、Loading Intro、Touch target 扩展 |
| `styles/backdrop.css` | ~115 | 679-791 + 794-1042 | `.site-backdrop` 全套 + `.editorial-hero` 全套 + `body::before/after`（新增）+ `hero-mesh-rotate` / `hero-code-float` keyframes |
| `styles/home.css` | ~340 | 1043-1429 | Home Manifesto、Reading Path、Article Rail、Links Preview、Home Projects、Home CTA |
| `styles/prose.css` | ~280 | 2176-2475 | Prose 排版、Code block、Code toolbar、Code line、Code highlighted |
| `styles/project-detail.css` | ~80 | 1880-1951 | Project Detail (back/header/title/meta/year/tag/image/desc/actions) |
| `styles/responsive.css` | ~440 | 2477-2913 | 移动优先适配 (≥1024 / 768-1023 / ≤767 / ≤374 / print) |

### globals.css 改造后（~10 行入口）

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@import "./styles/tokens.css";
@import "./styles/base.css";
@import "./styles/components.css";
@import "./styles/backdrop.css";
@import "./styles/home.css";
@import "./styles/prose.css";
@import "./styles/project-detail.css";
@import "./styles/responsive.css";
```

### 拆分原则

1. **顺序保持原文件相对顺序**（tokens → base → components → backdrop → home → prose → project-detail → responsive），避免层叠优先级变化
2. **`@media` 块就近归属**：组件相关的 `prefers-reduced-motion` 跟组件走（如 `.site-backdrop` 的 reduced-motion 进 `backdrop.css`），全局 reduced-motion 进 `base.css`，响应式断点统一进 `responsive.css`
3. **`@keyframes` 跟主用途走**：
   - `hero-mesh-rotate` / `hero-code-float` → `backdrop.css`
   - `reveal-stagger-in` / `fade-in-up` / `stagger-in` → `components.css`
   - `loading-intro-bar` → `components.css`
4. **`responsive.css` 集中所有断点**：拆出时把原文件里散落的 `@media (max-width: ...)` 全部移过来。代价是同一组件的响应式覆盖跨文件（base 里写桌面，responsive 里写移动），但好处是"看一眼就知道全站断点策略"
5. **`backdrop.css` 同时含 `.site-backdrop` 和 `.editorial-hero`**：两者共用 `--hero-*` 变量、共用 `hero-mesh-rotate` keyframe、共用装饰元素样式，放一起避免变量重复定义
6. **行数约束**：每个文件 ≤ 500 行（验收标准）。最大文件 `components.css` ~340 行、`home.css` ~340 行、`responsive.css` ~440 行，全部在限内

### 关键改动点

- **`body` 背景从 `bg-[var(--bg)]` 改为透明**（已在上一轮做），由 `body::before/after` 提供视觉。`backdrop.css` 里新增这两个伪元素样式
- **`.site-backdrop` 容器 div 移除**：原 `<div className="site-backdrop">` 改为 `<div className="site-backdrop__stage">`（去掉外层 wrapper，stage 直接是装饰元素容器）。`backdrop.css` 中 `.site-backdrop` 选择器删除，渐变 + 网格遮罩移到 `body::before/after`
- **`.editorial-hero__stage` 透明背景**（已做）保持，让全站背景透出

---

## 5. 数据流 + SSG/CSR 边界

### 组件树与渲染边界

```
<RootLayout>                           [server component, SSG]
├── <head>
│   ├── <meta theme-color>
│   └── <script nonce> (CSP inline, theme bootstrap)
│
├── <body class="flex min-h-full flex-col ...">
│   │  ─── 背景层 3 层 ───────────────────────────────
│   ├─ body::before                    [CSS pseudo, SSG]
│   ├─ body::after                     [CSS pseudo, SSG]
│   ├─ <SiteBackdropStage />           [server component, SSG]
│   ├─ <SiteBackdropParallax />        [client component, CSR]
│   │  ─── 内容层 ───────────────────────────────────
│   ├─ <a class="skip-link">
│   ├─ <Header />                      [client component (theme toggle)]
│   ├─ <main>{children}</main>         [server/client mix per page]
│   ├─ <BackToTop />                   [client component]
│   ├─ <Footer />                      [server component]
│   └─ <Analytics /> <SpeedInsights /> [client component, prod only]
```

### 渲染阶段时序

```
T0: SSG build
    HTML 字符串生成时:
    - body::before/after 由 <style> 标签内的 CSS 提供
    - <SiteBackdropStage/> 渲染为静态 <div> 字符串
    - <SiteBackdropParallax/> 在 SSR 时返回 null
    - <Header> <main> <Footer> 正常渲染
    输出: 完整 HTML 含背景视觉 + 内容

T1: 浏览器接收 HTML
    解析 <head> → 应用 <style>
    ↓
    body::before/after 立即渲染 (首屏背景可见，零白屏)
    ↓
    解析 <body> → 渲染静态 DOM
    ↓
    .site-backdrop__stage 装饰元素立即可见
    ↓
    <main> 内容立即可见 (首屏完整)

T2: React hydration
    <SiteBackdropParallax/> 挂载
    - prefers-reduced-motion 检查
      - true:  return (不挂监听)
      - false: addEventListener('mousemove')
    视差跟随生效 (鼠标移动时装饰元素 8px 视差)
```

### 数据流（无外部数据，纯视觉层）

| 组件 | Props | State | 副作用 |
|---|---|---|---|
| `body::before/after` | — | — | — |
| `<SiteBackdropStage/>` | 无 | 无 | 无（纯 server component） |
| `<SiteBackdropParallax/>` | 无 | 无 | `window.addEventListener('mousemove')` 写 CSS 变量到 `.site-backdrop__stage` |

**通信方式**：`<SiteBackdropParallax/>` 通过 `document.querySelector('.site-backdrop__stage')` 找到 stage 节点，写入 `--parallax-x/y` CSS 变量。stage 节点由 `<SiteBackdropStage/>` 渲染。**两个组件无 props 传递、无 context 共享**，纯靠 DOM 选择器 + CSS 变量解耦。

**取舍**：用 DOM 选择器而非 ref，是因为两个组件分处 SSG/CSR 边界——server component 无法向 client component 传 ref。用 `useRef` + props 会强制 `<SiteBackdropStage/>` 也变成 client component，违背分层设计。CSS 变量 + DOM 选择器是 SSG/CSR 跨边界通信的最干净方式。

### SSG/CSR 边界规则

| 规则 | 原因 |
|---|---|
| `<SiteBackdropStage/>` 不能是 `'use client'` | 装饰元素 DOM 是静态的，无需 hydration。SSG 渲染省 JS、省 hydration 时间 |
| `<SiteBackdropParallax/>` 必须是 `'use client'` | `useEffect` + `window`/`document` 仅在浏览器可用 |
| `<SiteBackdropParallax/>` `return null` | 不渲染 DOM，避免与 `<SiteBackdropStage/>` 输出冲突 |
| `<SiteBackdropStage/>` 不接受 props | 全站背景无配置差异，硬编码装饰元素 |
| `<SiteBackdropParallax/>` 不接受 props | 视差幅度 (8px) 硬编码在组件内 |

### CSS 变量作用域

```css
/* backdrop.css */

/* 全局变量 (body 级) */
body {
  --parallax-x: 0px;     /* 由 SiteBackdropParallax 动态更新 */
  --parallax-y: 0px;
}

/* Stage 局部变量 */
.site-backdrop__stage {
  --hero-panel: #111426;
  --hero-panel-deep: #070913;
}

/* 视差 transform */
.site-backdrop__stage {
  transform: translate(var(--parallax-x), var(--parallax-y));
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .site-backdrop__stage {
    transition: none;
    transform: none;
  }
}
```

### z-index 层级图

```
z-index: -2  body::before / body::after          (背景静态层)
z-index: -1  .site-backdrop__stage               (装饰元素层)
z-index:  0  默认 (main/Header/Footer 内容)      (内容层)
z-index: 100 .header.is-scrolled                 (sticky header)
z-index: 200 .skip-link:focus                    (a11y skip)
z-index: 999 .back-to-top.is-visible             (浮动按钮)
```

**与现有 z-index 兼容**：`-1`/`-2` 不影响 `0+` 的内容层，且 `pointer-events: none` 确保不拦截交互。

### 与 next.config.ts / CSP 的兼容性

| 配置项 | 影响 |
|---|---|
| `next.config.ts` `remotePatterns: []` | 无远程图片，背景全 CSS，无影响 |
| CSP nonce | `<SiteBackdropStage/>` 是 server component，无 inline script，无 nonce 需求 |
| `<SiteBackdropParallax/>` 的 useEffect | 无 inline script，无 CSP 冲突 |
| `body::before` 伪元素 | 在 `<style>` 标签内，由 nonce 保护，无额外 CSP 规则 |

### SSG 验证方式

验收标准 "SSG 首屏背景已渲染" 的具体验证：

```bash
pnpm build && pnpm start
curl http://localhost:3000/ > /tmp/home.html
grep "site-backdrop__stage" /tmp/home.html      # 应匹配 (静态 DOM 已渲染)
grep "site-backdrop__plane" /tmp/home.html      # 应匹配
grep "site-backdrop__mesh" /tmp/home.html       # 应匹配
grep "site-backdrop__code" /tmp/home.html       # 应匹配
grep "linear-gradient" /tmp/home.html           # 应匹配 (CSS 已注入)
```

---

## 6. 错误处理 + 边界情况

### 故障模式与应对

| 故障 | 触发条件 | 影响 | 应对 |
|---|---|---|---|
| `document.querySelector('.site-backdrop__stage')` 返回 null | SSR 阶段、stage 组件未渲染 | 视差不生效，背景静止 | `if (!stage) return;` 提前退出，不抛错。视觉降级：背景仍是静态渐变 + 网格 + 装饰，仅缺视差跟随 |
| `window.matchMedia` 抛错 | IE 等不支持 matchMedia | useEffect 内未捕获 | 不额外处理——项目目标现代浏览器，`prefers-reduced-motion` 是渐进增强 |
| `mousemove` 监听未清理 | 组件 unmount 时未 removeEventListener | 内存泄漏 | useEffect return 清理函数，StrictMode 双调用测试覆盖 |
| CSS `@import` 加载失败 | 网络问题、构建错误 | 背景样式缺失 | CSS 是 SSG HTML 内联 `<style>`，随 HTML 一起到达，无网络请求 |
| 装饰元素遮挡内容 | z-index 设置错误 | 内容被装饰盖住 | z-index: -1 确保装饰在内容下，`pointer-events: none` 不拦截点击 |
| 主题切换时背景闪烁 | dark/light 切换导致 CSS 变量重新计算 | 视觉抖动 | body::before/after 用硬编码色值（`#111426` / `#070913`），不读 CSS 变量，主题切换时背景不变 |
| `prefers-reduced-motion` 用户仍看到装饰动画 | mesh 旋转、code 浮动 | 违反无障碍偏好 | `@media (prefers-reduced-motion: reduce)` 块覆盖 animation: none |

### 边界情况清单

1. **首屏 SSR 阶段**：HTML 含静态 DOM + CSS，无 JS 即可呈现
2. **React hydration 失败**：背景仍可见（CSS + 静态 DOM 已在 HTML 中），仅视差不生效
3. **JavaScript 禁用**：背景完整可见（零 JS 依赖），视差不生效。SEO 无影响
4. **主题切换**：`body::before/after` 用硬编码色值，主题切换时背景不变；内容层 `--text` / `--surface` 切换
5. **视窗尺寸变化**：`position: fixed; inset: 0` 自适应；装饰元素用百分比 + 偏移
6. **打印模式**：`@media print` 在 responsive.css 保留原行为
7. **View Transitions API**：`@view-transition { navigation: auto; }` 在 tokens.css 保留；背景 `position: fixed` 不闪烁
8. **StrictMode 双调用**：useEffect add + return remove，监听不重复
9. **页面路由切换**：背景层在 RootLayout，跨路由不 unmount，持续生效
10. **CSP 严格模式**：CSS 由 Next.js 注入带 nonce；DOM 无 inline script；JS 是外部 chunk

### 回滚策略

| 问题 | 回滚方式 |
|---|---|
| SSG 背景未渲染（白屏） | layout.tsx 恢复 `<SiteBackdrop/>`（client component 原版），移除 body::before/after |
| Lighthouse 性能退化 | 检查 `SiteBackdropParallax` JS 体积是否超标；如超标，临时移除视差功能 |
| CSS 拆分导致样式丢失 | globals.css 恢复单文件版本（git revert） |

**Git 单提交策略**：所有改动在 3 个 commit 内完成（背景架构 / CSS 重构 / 行为切换），便于整体回滚。

---

## 7. 测试策略

### 测试金字塔

```
              ┌─────────────────────┐
              │  E2E (Playwright)   │  ← 视觉回归 + SSG 验证
              ├─────────────────────┤
              │  集成测试 (Vitest)  │  ← layout 渲染 + 三层协同
              ├─────────────────────┤
              │  单元测试 (Vitest)  │  ← SiteBackdropParallax 行为
              └─────────────────────┘
              静态校验 (curl HTML)     ← SSG 首屏验证
```

### 7.1 单元测试：`SiteBackdropParallax.test.tsx`

**目标**：覆盖视差逻辑的 3 个分支 + 清理。

测试用例：
1. returns null (no DOM output)
2. attaches mousemove listener when motion allowed
3. updates CSS variables on mousemove
4. resets to 0px on mouseleave
5. skips listener when prefers-reduced-motion
6. handles missing stage element gracefully
7. removes listeners on unmount

**测试数**：7 tests。

### 7.2 单元测试：`SiteBackdropStage.test.tsx`

**目标**：验证 server component 静态 DOM 输出完整。

测试用例：
1. renders stage container
2. renders 2 plane elements
3. renders mesh element
4. renders 2 code labels
5. marks container as aria-hidden

**测试数**：5 tests。

### 7.3 E2E 验证（扩展现有 home.spec.ts）

**目标**：SSG 首屏背景已渲染（验收标准）+ 视差跟随生效。

测试用例：
1. SSG HTML contains backdrop DOM (curl 验证)
2. backdrop visible on home page
3. backdrop visible on blog post
4. backdrop visible across routes (/about, /projects, /tags, /categories, /links)

**测试数**：4 tests 追加到现有 home.spec.ts。

### 7.4 静态校验

```bash
pnpm build && pnpm start
curl -s http://localhost:3000/ | grep -c "site-backdrop__stage"  # 期望 ≥ 1
curl -s http://localhost:3000/about | grep -c "site-backdrop__stage"  # 期望 ≥ 1
```

**集成到 CI**：可选。本轮先手动验证，CI 改造留下一轮。

### 7.5 Lighthouse 回归验证

```bash
pnpm build && pnpm start
# 浏览器跑 Lighthouse 5 页
# 或触发 CI Lighthouse job
git push origin codex/blog-hardening-tooling
```

**验收**：5 页 Performance / LCP / TBT 不退化（≥ baseline）。

### 7.6 CSS 拆分验证

```bash
grep -n "^@media" src/app/styles/*.css       # 确认每个 @media 块都有归属
grep -n "^@keyframes" src/app/styles/*.css    # 确认每个 @keyframes 都有归属
wc -l src/app/globals.css                    # 期望 ~10 行
wc -l src/app/styles/*.css                   # 每个文件 ≤ 500 行
```

### 测试矩阵汇总

| 层级 | 文件 | 新增测试数 |
|---|---|---|
| 单元 | `SiteBackdropParallax.test.tsx` | 7 |
| 单元 | `SiteBackdropStage.test.tsx` | 5 |
| 集成 | 现有 `app/page.test.tsx` | 0（不改） |
| E2E | `e2e/home.spec.ts`（追加） | 4 |
| 静态 | SSG HTML grep | 手动 |
| Lighthouse | CI job | 自动 |
| 总计 | | **+16 新测试** |

**回归**：现有 279 vitest tests + 38 e2e tests 全部保持绿。

---

## 8. 实施顺序

### 7 个阶段（P1-P7），按依赖顺序

| 阶段 | 内容 | 依赖 | 验证点 |
|---|---|---|---|
| **P1** | 创建 `SiteBackdropStage.tsx`（server component，装饰 DOM）+ `SiteBackdropParallax.tsx`（client component，视差）。两个新文件，暂不接入 layout | 无 | tsc 通过；新组件单测全绿 |
| **P2** | `globals.css` 拆分为 `styles/` 8 个文件 + `globals.css` 入口。**此时 `.site-backdrop` 选择器保持原样**（未迁移到 body::before） | P1 | build 成功；样式视觉无变化；CSS 单文件 ≤ 500 行 |
| **P3** | `backdrop.css` 重构：`.site-backdrop` 容器样式迁移到 `body::before/after`；`.site-backdrop__stage` 装饰元素样式保留。删除外层 wrapper div 概念 | P2 | build 成功；视觉无变化 |
| **P4** | `layout.tsx` 接入新背景架构：移除旧 `<SiteBackdrop/>`，引入 `<SiteBackdropStage/>` + `<SiteBackdropParallax/>` | P1, P3 | tsc + lint + test + build 全绿；dev server 视觉正确 |
| **P5** | 单元测试 + E2E 追加：`SiteBackdropParallax.test.tsx`、`SiteBackdropStage.test.tsx`、`e2e/home.spec.ts` backdrop 块 | P4 | 279 + 12 vitest 全绿；e2e 4 个新 test 全绿 |
| **P6** | 删除旧 `SiteBackdrop.tsx`（client component 原版）。清理 `EditorialHero` 中残留的 stage 相关样式引用 | P4 | tsc + lint 全绿 |
| **P7** | 回归验证 + Lighthouse 检查 + SSG HTML grep 验证 | P5, P6 | 验收标准全满足；提交 + 推送 |

### 关键依赖图

```
P1 ──┬──→ P4 ──→ P5 ──→ P7
     │      ↑
P2 ──┴──→ P3 ──┘
              ↓
              P6
```

- P1（新组件）和 P2（CSS 拆分）可并行
- P3（backdrop.css 重构）依赖 P2（拆分完成）
- P4（layout 接入）依赖 P1（新组件就绪）+ P3（CSS 就绪）
- P5（测试）+ P6（清理）依赖 P4
- P7（验证）最后

### 单次提交策略

| Commit | 内容 |
|---|---|
| Commit 1 | P1 + P6（新组件 + 删除旧组件，单一架构变更） |
| Commit 2 | P2 + P3（CSS 拆分 + backdrop.css 重构，单一 CSS 重构） |
| Commit 3 | P4（layout 接入，行为切换） |
| Commit 4 | P5（测试追加） |
| 推送 | P7 验证后 |

**理由**：4 个 commit 对应架构变更/CSS 重构/行为切换/测试追加 4 个独立维度，便于 code review 和回滚。

---

## 9. 验收标准

| 标准 | 阈值 | 验证方式 |
|---|---|---|
| 客户端 JS ≤ 1KB gz | `SiteBackdropParallax` chunk minified+gzip < 1024 字节 | `pnpm analyze` 检查 chunk 体积 |
| SSG 首屏背景已渲染 | curl HTML 含 `site-backdrop__stage` / `site-backdrop__plane` / `site-backdrop__mesh` / `site-backdrop__code` / `linear-gradient` | curl + grep 验证 |
| CSS 单文件 ≤ 500 行 | `src/app/styles/*.css` 每个文件 ≤ 500 行（`globals.css` 入口除外） | `wc -l` 验证 |
| Lighthouse 不退化 | 5 页 desktop preset Performance / LCP / TBT ≥ baseline | CI Lighthouse job + 对比 `docs/performance-baseline.md` |
| 视觉无变化 | 首页/博客详情/项目详情/标签/分类/关于 6 页背景视觉与优化前一致 | 浏览器手动对比 |
| 现有测试不退化 | 279 vitest tests + 38 e2e tests 全绿 | `pnpm test && pnpm test:e2e` |
| 新增测试全绿 | +12 vitest + +4 e2e 全绿 | `pnpm test && pnpm test:e2e` |
| reduced-motion 守卫 | `prefers-reduced-motion: reduce` 下视差不挂监听、装饰动画停止 | 单元测试 + 浏览器 DevTools 模拟 |

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| `@import` 在 CSS 中影响加载顺序 | 低 | Tailwind v4 + Next.js 16 支持 `@import`，构建时合并 | build 后检查 `<style>` 标签内容完整 |
| `responsive.css` 跨组件断点可能漏拆 | 中 | 部分 `@media` 块遗漏 | 拆分后用 Grep 扫描验证 |
| `body::before/after` 与现有 body Tailwind 类冲突 | 低 | 伪元素不受 Tailwind 类影响 | 已验证无冲突 |
| SSG 阶段 `document.querySelector` 返回 null | 低 | 视差不生效，背景静止 | useEffect 内 `if (!stage) return` 提前退出 |
| Lighthouse Performance 退化 | 低 | CI 失败 | P7 阶段 Lighthouse 验证，退化则回滚 |

---

## 11. 非目标（明确不做）

- 不改变视觉外观（颜色、装饰元素、动画效果保持不变）
- 不重构内容层组件（Header / Footer / main 内的页面组件）
- 不引入新的依赖
- 不改变主题切换逻辑
- 不增加 mobile preset 的 Lighthouse job（留下一轮）
- 不改造 CI 配置（本轮 Lighthouse 验证走现有 job）

---

## 12. 关键文件清单

### 新建文件

| 文件 | 类型 | 职责 |
|---|---|---|
| `src/components/layout/SiteBackdropStage.tsx` | server component | 装饰元素静态 DOM |
| `src/components/layout/SiteBackdropParallax.tsx` | client component | 视差跟随 |
| `src/components/layout/SiteBackdropStage.test.tsx` | 单元测试 | DOM 输出验证 |
| `src/components/layout/SiteBackdropParallax.test.tsx` | 单元测试 | 视差逻辑验证 |
| `src/app/styles/tokens.css` | CSS | 主题变量 |
| `src/app/styles/base.css` | CSS | 基础布局 |
| `src/app/styles/components.css` | CSS | 通用组件 |
| `src/app/styles/backdrop.css` | CSS | 背景层 |
| `src/app/styles/home.css` | CSS | 首页专属 |
| `src/app/styles/prose.css` | CSS | 文章排版 |
| `src/app/styles/project-detail.css` | CSS | 项目详情 |
| `src/app/styles/responsive.css` | CSS | 响应式 |

### 修改文件

| 文件 | 改动 |
|---|---|
| `src/app/layout.tsx` | 引入 `<SiteBackdropStage/>` + `<SiteBackdropParallax/>`，移除旧 `<SiteBackdrop/>` |
| `src/app/globals.css` | 改造为入口文件，仅 `@import` 8 个模块 |
| `e2e/home.spec.ts` | 追加 4 个 backdrop 相关测试 |

### 删除文件

| 文件 | 原因 |
|---|---|
| `src/components/layout/SiteBackdrop.tsx` | 由 `SiteBackdropStage.tsx` + `SiteBackdropParallax.tsx` 替代 |
