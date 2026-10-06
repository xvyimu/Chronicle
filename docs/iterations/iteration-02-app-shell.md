# Iteration 02 · App Shell

## 1. 迭代名称

App Shell

## 2. 当前状态

**Completed**

## 3. 目标

新顶部栏 + 新侧边栏 + 主内容面板 + 移动端导航 + 全局响应式框架 + 页面滚动策略 + 当前路由高亮。

## 4. 背景

现状每页各自 Header/Footer，无统一应用外壳（审计 D3）；且导航含死链（审计 E1/E2）。

## 5. 范围

- TopBar（品牌 + 搜索入口 + 主题 + 移动按钮）
- Sidebar（主导航）
- MainPanel（大圆角浅色面板）
- 路由高亮（复用 `x-pathname`）
- 清死链（导航 / 页脚 / 错误页 / 首页组件）
- 同步测试断言

## 6. 非范围

- 不改数据层。
- 不改文章正文排版（迭代 04）。
- 首页 Paper Gallery 主题与布局留迭代 03。

## 7. 前置条件

Iteration 01。

## 8. 具体任务

- [x] 清死链（`navigation.ts` / `error.tsx` / `not-found.tsx` / `EditorialHero` / `ManifestoSection`）
- [x] 新增 `Sidebar`（RSC）
- [x] `Header` 瘦身为 TopBar（移除桌面导航）
- [x] `layout.tsx` 包 workspace 外壳
- [x] `workspace.css`（外壳样式 + 响应式）
- [x] 清 `header__nav--desktop` 死规则
- [x] 抽共享 `NavLinks`（Sidebar + MobileNav 复用，消除重复渲染）
- [x] 同步测试断言 + 新增 Sidebar 测试
- [x] 四门验证

## 9. 涉及文件

**新增**：`src/components/layout/Sidebar.tsx` · `src/components/layout/Sidebar.test.tsx` · `src/components/layout/NavLinks.tsx` · `src/app/styles/workspace.css`
**修改**：`src/app/layout.tsx` · `src/components/layout/Header.tsx` · `src/components/layout/Header.test.tsx` · `src/components/layout/MobileNav.tsx` · `src/lib/navigation.ts` · `src/lib/navigation.test.ts` · `src/app/error.tsx` + test · `src/app/not-found.tsx` + test · `src/components/home/EditorialHero.tsx` + test · `src/components/home/ManifestoSection.tsx` + test · `src/app/page.test.tsx` · `src/app/styles/responsive.css`
**删除**：无（清的是死规则/死链，非文件）

## 10. 数据或接口变化

无。

## 11. 设计变化

- 引入工作台外壳：TopBar（sticky）+ 左 Sidebar（sticky，232px）+ 主面板（大圆角 `--radius-panel` 18px，`--surface` 白）。
- 导航从「顶栏横向 8 项」改为「左栏纵向 7 项」。
- 移动端（<1024）侧栏隐藏，导航走 MobileNav Sheet（复用现有）。
- 主面板宽度上限 1440px，外壳间距 12px。

## 12. 测试计划

四门 + dev 冒烟。

## 13. 验收标准

统一外壳；路由高亮正确；无死链；移动端 Sheet 可用；四门全绿。

## 14. 风险

R1（布局回归）——已 dev 冒烟 7 路由 200。

## 15. 回滚方式

`git revert` 本迭代提交。

## 16. 实际完成情况

- 死链全清：`MAIN_NAV_ITEMS` 去 `/garden` `/links`；`error.tsx` / `not-found.tsx` / `EditorialHero` / `ManifestoSection` 的 `/links` 入口改为有效路由。
- 新增 `Sidebar`（RSC，复用 `x-pathname` 高亮）；`Header` 瘦身为 TopBar。
- 抽共享 `NavLinks`（Sidebar + MobileNav 复用同一「MAIN_NAV_ITEMS + isNavItemActive + aria-current」渲染，消除重复）。
- `layout.tsx` 包成 `.workspace > Sidebar + .workspace__main > main + Footer`。
- 新增 `workspace.css`（外壳 + 响应式）；清 `header__nav--desktop` 死规则。
- 验证：`typecheck` 0 · `lint` 0 · `test` 573/573 · `build` 0（105 静态页）· dev 7 路由 200 · DOM 含 `sidebar` / `workspace` / `workspace__panel`。

## 17. 遗留问题

- **首页仍是 Paper Gallery 暖色**（未变，留迭代 03）。
- **Sidebar 的 `top: 76px`** 与 TopBar 高度（64px）耦合——已加注释，改 TopBar 高度时须同步。
- **e2e spec 仍引用已删路由**（`/api/search` `/api/preview` `/links`）——未在本次修（e2e 需生产构建 + Playwright，留迭代 06 或单独处理）。
- `fuse.js` 死依赖、`ops-readiness.ts` 文案、`docs/API.md`——仍归迭代 06。
- 主面板「独立滚动」未做（当前走页面滚动）——工作台常见做法是面板内滚动，但会改变 `sticky` 语义；**评估后决定不做**（内容站页面滚动更自然，且避免 sticky TOC 失效）。记录于此。

## 18. 下一迭代建议

Iteration 03：首页工作台 + 站内搜索。
