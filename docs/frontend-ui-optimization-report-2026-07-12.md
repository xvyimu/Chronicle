# 个人博客前端优化实施报告 · 2026-07-12

路径：`D:\blog` · 域名：`https://incca.ccwu.cc` · 分支：`master`

---

## 0. 结论摘要

本站**不是**「陈旧、无组件化」的起点项目，而是已经过多轮工程化与 shadcn 部分落地的 Next.js 16 博客。
本轮主矛盾是 **BEM 自定义 `.btn` 与 shadcn Button 双轨并存**；已在不改内容结构的前提下，把交互层收敛到 `components/ui/*`，并补齐 Sheet 移动导航、阅读设置 Popover、可分享搜索 query 与 E2E 回归。

| 门禁             | 结果              |
| ---------------- | ----------------- |
| `pnpm test`      | 556 / 71 files ✅ |
| `pnpm typecheck` | ✅                |
| `pnpm lint`      | ✅                |
| `pnpm build`     | 93 routes ✅      |
| `pnpm test:e2e`  | 47 / 47 ✅        |

---

## 1. 第一阶段 · 审计

### 1.1 技术栈现状

| 层        | 现状                                                       | 评价             |
| --------- | ---------------------------------------------------------- | ---------------- |
| Framework | Next.js 16.2 App Router + React 19                         | 现代             |
| 样式      | Tailwind v4 + 17 个语义 CSS 模块 + Paper Gallery token     | 成熟、偏重 BEM   |
| 组件库    | shadcn radix-nova：button/card/badge/separator/skeleton    | 已接入但覆盖不全 |
| 工程化    | Vitest + Playwright + Prettier/Husky + Lighthouse CI + CSP | 生产级           |
| 设计系统  | `tokens.css` 双主题 + `@theme` 映射 shadcn 语义色          | 可用             |

### 1.2 问题清单（按优先级）

| ID  | 问题                                                           | 严重度 | 处置                                                        |
| --- | -------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| A1  | `.btn` / `.btn--primary` / `.btn--ghost` 与 shadcn Button 双轨 | P0     | ✅ 本轮清零                                                 |
| A2  | Pagination 当前页 `text-white` 硬编码，不走 token              | P1     | ✅ 改 Button default                                        |
| A3  | Skeleton 已安装但 loading 页面手写 pulse                       | P1     | ✅ 接入 Skeleton                                            |
| A4  | 搜索 / 筛选原生 input，无共享 Input primitive                  | P1     | ✅ 新增 Input                                               |
| A5  | Header / ThemeToggle / BackToTop 原生 button                   | P2     | ✅ 改 Button                                                |
| A6  | TagLink 手写 badge 样式                                        | P2     | ✅ 改 Badge asChild                                         |
| A7  | ReadingPreferences 原生 button                                 | P2     | ✅ 改 Button                                                |
| A8  | 17 份 CSS 模块体量大（~3800 行），BEM 与 utility 混用          | P3     | 保留：Paper Gallery 视觉仍依赖                              |
| A9  | 无 Sheet/Dialog；移动导航靠 CSS drawer                         | P3     | ✅ Sheet 移动导航                                           |
| A10 | 搜索仍为客户端 fuse，无持久化索引                              | Future | 部分增强：`?q=` 可分享 + Fuse 实例缓存；真·服务端搜索仍排除 |

### 1.3 审计前后对比（组件采用）

| 维度              | 审计前                               | 审计后                                                     |
| ----------------- | ------------------------------------ | ---------------------------------------------------------- |
| shadcn primitives | button card badge separator skeleton | + **input / sheet / popover**；button 增 **size=cta**      |
| `.btn` 业务引用   | 6 个 TSX                             | **0**                                                      |
| Skeleton 使用     | 仅定义                               | blog/list + post loading                                   |
| Button 使用面     | 主要 CuratedLinksPreview             | Hero/CTA/404/error/分页/Header/搜索/阅读设置…              |
| 移动导航          | CSS drawer + 手写 Escape             | Radix Dialog-based **Sheet**（focus trap / Esc / overlay） |
| 阅读设置          | 常驻 portal 面板                     | 触发器 + **Popover** 面板                                  |
| 搜索              | 纯本地 state                         | `?q=` history.replaceState 可分享 + Fuse WeakMap 缓存      |

---

## 2. 第二阶段 · 方案与落地

### 2.1 原则

1. **渐进式**：不推翻 Paper Gallery BEM 布局/排版。
2. **按需 shadcn**：只补真正复用的 Input / Sheet / Popover；CTA 用 `size="cta"` 而非再写一套 `.btn`。
3. **视觉守恒**：胶囊圆角、44px 触控高、brand hover 阴影保留在 `controls.css` 的 `[data-size=cta]`。
4. **测试护栏**：改完先跑受影响测试，再全量 + typecheck + lint + build + E2E。

### 2.2 关键改动

#### Button · `size="cta"`

```tsx
// button.tsx size 变体新增
cta: 'min-h-11 gap-1.5 rounded-full px-[22px] text-[0.9rem] font-extrabold shadow-none',
```

CSS 侧用属性选择器替代死 `.btn`：

```css
[data-slot='button'][data-size='cta'] { min-height: 44px; border-radius: var(--radius-full); ... }
[data-slot='button'][data-size='cta'][data-variant='outline']:hover { ... brand-soft ... }
```

#### Pagination / Loading / Input

- Pagination：`Button asChild` + `variant={isCurrent ? 'default' : 'ghost'}`
- Loading：`<Skeleton />`
- Input：`forwardRef` + cva size，SearchBar / LinksDirectory 接入

#### Sheet 移动导航

- 新增 `components/ui/sheet.tsx`（基于 `radix-ui` Dialog）
- `Header`：桌面 `header__nav--desktop`；移动端 `Sheet` + `SheetContent side="top"`，overlay 保留 `.header__backdrop` 类名供测试/样式
- 保留 `aria-expanded` / `aria-controls="mobile-nav"` / Escape / 路径切换关闭
- `e2e/mobile.spec.ts` 改为先点开菜单再断言导航链接

#### Popover 阅读设置

- 新增 `components/ui/popover.tsx`
- `ReadingPreferences`：左下角触发器显示当前字号/栏宽；面板内循环切换；localStorage 与 CSS 变量逻辑不变
- 单测改为先打开 Popover 再断言控件

#### 搜索增强（非服务端）

- `useFuseSearch`：导出 `FUSE_SEARCH_OPTIONS`；Fuse 构造函数单例 + 按 `posts` 引用 WeakMap 缓存
- `SearchBar`：本地 state 为源；`history.replaceState` 同步 `?q=`（可分享/可刷新恢复）；不依赖 `useSearchParams` 回写（避免 replaceState 与 Next 快照打架）；`popstate` 同步浏览器后退
- 单测覆盖 `?q=` hydrate 与 replaceState 写入

### 2.3 文件清单

| 路径                                                                                          | 变更                                |
| --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `src/components/ui/button.tsx`                                                                | +cta size                           |
| `src/components/ui/input.tsx`                                                                 | 新建                                |
| `src/components/ui/sheet.tsx`                                                                 | 新建（Dialog-based）                |
| `src/components/ui/popover.tsx`                                                               | 新建                                |
| `src/components/ui/skeleton.tsx`                                                              | 补 React 类型 import                |
| `src/components/ui/BackToTop.tsx` / `ThemeToggle.tsx`                                         | → Button                            |
| `src/components/blog/Pagination.tsx`                                                          | → Button                            |
| `src/components/blog/SearchBar.tsx`                                                           | → Input + Button + `?q=`            |
| `src/components/blog/useFuseSearch.ts`                                                        | 缓存 + 导出 options                 |
| `src/components/blog/ReadingPreferences.tsx`                                                  | → Popover + Button                  |
| `src/components/blog/TagLink.tsx`                                                             | → Badge asChild                     |
| `src/components/home/EditorialHero.tsx` / `HomeCtaSection.tsx`                                | → Button cta                        |
| `src/components/links/LinksDirectory.tsx`                                                     | → Input + Button                    |
| `src/components/layout/Header.tsx`                                                            | Sheet 移动导航                      |
| `src/app/not-found.tsx` / `error.tsx`                                                         | → Button cta                        |
| `src/app/blog/loading.tsx` / `[slug]/loading.tsx`                                             | → Skeleton                          |
| `src/app/projects/[id]/page.tsx`                                                              | → Button cta                        |
| `src/app/styles/controls.css` / `home.css` / `base.css` / `responsive.css` / `article-ui.css` | 死 `.btn` 清理 + Sheet/Popover 样式 |
| `src/components/ui/BackToTop.test.tsx` 等                                                     | 断言适配                            |
| `e2e/mobile.spec.ts`                                                                          | Sheet 菜单 + 搜索 `?q=`             |
| `TODO.md`                                                                                     | P4 + P5 完成记录                    |

---

## 3. 第三阶段 · 体验与工程边界（仍排除）

| 项                         | 原因                                              |
| -------------------------- | ------------------------------------------------- |
| 全量 BEM → utility 重写    | 会动 Paper Gallery 视觉与大量 CSS 回归，ROI 低    |
| 真·服务端搜索 / 索引持久化 | 架构与内容规模侧；本轮仅客户端可分享 `?q=` + 缓存 |
| lucide 图标统一            | 现有 inline SVG 零依赖、无包体积压力              |
| 内容/MDX 改动              | 约束：不改核心内容结构                            |

---

## 4. 验收清单

### 已完成

- [x] 全站无业务侧 `.btn` 类
- [x] CTA 视觉 token 化（primary / outline + cta size）
- [x] Pagination / loading / search / links filter 组件化
- [x] Sheet 移动导航 + Popover 阅读设置
- [x] 搜索 `?q=` 可分享 + Fuse 实例缓存
- [x] 556 unit tests + lint + typecheck + production build
- [x] E2E 47/47
- [x] WCAG 相关：保留 skip-link、aria-label、aria-current、combobox；Sheet/Popover 提供 focus 管理

### 待办 / 风险

| 项                          | 风险       | 建议                                       |
| --------------------------- | ---------- | ------------------------------------------ |
| `icon-btn` 仍叠在 Button 上 | 低         | 三期可把 icon-btn 尺寸收进 Button size     |
| search-ui BEM 仍厚          | 无功能风险 | 三期再吃掉 padding/focus 到 Input variants |
| 未 commit / 未 push         | —          | 等你确认后提交                             |

### 怎么验

```powershell
cd D:\blog
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
pnpm dev   # 目视：首页 CTA、/blog 分页与 ?q=、移动菜单 Sheet、文章阅读设置 Popover、/links 筛选、404、主题切换
```

---

## 5. 优化清单总表

| 状态 | 项                                                                           |
| ---- | ---------------------------------------------------------------------------- |
| ✅   | A1–A7 交互层 shadcn 收敛                                                     |
| ✅   | 死 CSS `.btn` 清理                                                           |
| ✅   | Input primitive                                                              |
| ✅   | Sheet 移动导航                                                               |
| ✅   | Popover 阅读设置                                                             |
| ✅   | 搜索 `?q=` + Fuse 缓存                                                       |
| ✅   | E2E 47 全绿                                                                  |
| ✅   | TODO P4/P5 记录                                                              |
| ⏳   | 远期：服务端搜索 / 索引持久化、图片 blur、Speed Insights 基线、全量 BEM 重写 |

---

_P4/P5 已入库 `1bfb313`。后续服务端搜索 + BEM 卫生见 `docs/bem-search-architecture-2026-07-12.md`（P6）。_
