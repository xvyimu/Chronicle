# Iteration 03 · 首页与搜索

## 1. 迭代名称

首页与搜索

## 2. 当前状态

**Completed**

## 3. 目标

工作台式首页（欢迎区 / 热门主题 / 搜索 Composer / 最近更新）+ 站内搜索。

## 4. 背景

现状首页是 Paper Gallery 编辑式多 section（929 行 CSS + 暖纸色覆盖块，审计 D5/D1）；搜索已删但新方案要求它是核心（决策 D-004）。

## 5. 范围

- 工作台首页（欢迎区 + 主题云 + 轻量文章列表 + 搜索入口）
- 站内搜索（客户端 Fuse，标题/描述/标签/分类；键盘；URL 可分享；空/无结果状态）
- 删旧首页组件与 CSS（含 Paper Gallery 暖色覆盖块）

## 6. 非范围

- 不做服务端搜索引擎（规模不匹配）。
- 不做 AI 聊天。
- 文章列表页与详情页留迭代 04。

## 7. 前置条件

Iteration 02。

## 8. 具体任务

- [x] `src/lib/search/`（types / engine / index，纯函数可测）
- [x] `SearchPanel`（客户端岛：键盘 `/` `Ctrl+K`、↑↓、Enter、Esc、URL 同步）
- [x] `WorkspaceHero`（欢迎区 + 计数 + 搜索入口）
- [x] `TopicCloud`（热门主题胶囊）
- [x] `ArticleList`（无大图轻量卡片）
- [x] 重写 `page.tsx` 与 `home.css`
- [x] 删旧首页组件（6 个 + 测试）与 2 个 CSS
- [x] 四门验证

## 9. 涉及文件

**新增**：`src/lib/search/{types,engine,index,engine.test}.ts` · `src/components/search/{SearchPanel.tsx,SearchPanel.test.tsx}` · `src/components/home/{WorkspaceHero,TopicCloud,ArticleList}.tsx`
**修改**：`src/app/page.tsx` · `src/app/page.test.tsx` · `src/app/styles/home.css`
**删除**：`src/components/home/{EditorialHero,ManifestoSection,ReadingPathSection,FeaturedArticleRail,HomeCtaSection,RevealOnScroll}.tsx` + 各自 `.test.tsx` · `src/app/styles/{home-hero,home-sections}.css`

## 10. 数据或接口变化

搜索走客户端 Fuse（无 API）；搜索文档为 `SearchDoc` 投影（`toSearchDoc`）。

## 11. 设计变化

- 首页从「编辑式多 section」改为「工作台：欢迎区 + 主题 + 列表 + 搜索」。
- **暖纸色覆盖块（`body:has(.home-paper)`）随旧 CSS 删除** → 首页转为中性灰（迭代 01 遗留项闭环）。
- 搜索面板为首页视觉核心（大圆角输入框 + `/` 快捷键提示）。

## 12. 测试计划

四门 + dev 冒烟。

## 13. 验收标准

首页非传统模板；搜索可用（键盘/URL/无结果）；四门全绿。

## 14. 风险

R5/R6（搜索过重 / 首屏 JS）——客户端 Fuse 仅索引 20 篇的轻投影，未显著增大首屏。

## 15. 回滚方式

`git revert` 本迭代提交。

## 16. 实际完成情况

- 新首页三组件 + 搜索面板落地；`page.tsx` / `home.css` 重写（929 行 Paper Gallery CSS → 约 300 行工作台 CSS）。
- 删 6 个旧首页组件 + 2 个 CSS。
- 搜索：客户端 Fuse，权重 标题>标签/分类>描述；键盘 `/` `Ctrl+K` 聚焦、↑↓ 选择、Enter 打开、Esc 清空；URL `?q=` 可分享。
- 验证：`typecheck` 0 · `lint` 0（0 warning）· `test` 71 文件/541 测试 · `build` 0（105 静态页）· dev 4 路由 200 + DOM 确认（`workspace-home`/`ws-hero`/`search-panel` 存在，`home-paper` 消失）。

## 17. 遗留问题

- **`check-doc-links-script.test.ts` 间歇性 flaky**：全量并发下 spawn `pnpm check:docs` 扫 138 文件偶发超时（单独跑稳定通过、全量重跑通过）。属**既有测试脆弱点**（非本迭代引入）；建议迭代 06 提超时或改结构。
- 文章列表页（`/blog`）与详情页仍是旧视觉——迭代 04。
- 首页「最近阅读」（localStorage）未做——归迭代 05。
- `fuse.js` 依赖**保留**（搜索在用），决策 D-004 落实。

## 18. 下一迭代建议

Iteration 04：文章系统（列表 + 卡片 + 详情 + 阅读排版）。
