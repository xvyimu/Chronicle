# P2 UX 收尾：搜索、链接目录与异常导流

日期：2026-07-06
状态：in_progress
范围：`/links` 收藏筛选、搜索空状态、404/error 导流与交接文档同步。

## 目标

完成 `docs/optimization-roadmap-2026-07-06.md` 中尚未落地的低风险 P2 用户体验项：

- U-06：搜索结果空状态补充下一步入口。
- U-07：错误页和 404 增加回首页、看博客、导航收藏等导流。
- U-08：链接目录增加关键词筛选，降低 123 条收藏的扫描成本。

## 任务清单

- [x] T0：确认当前工作树、路线图和相关组件边界。
- [x] T1：为 LinksDirectory 筛选、搜索空状态、异常页导流补测试。
- [x] T2：实现 `/links` 客户端关键词筛选与空状态。
- [x] T3：实现搜索无结果的建议入口。
- [x] T4：实现 not-found/error 导流 UI。
- [x] T5：更新文档和进度记录。
- [x] T6：运行目标测试与必要质量门禁。
- [x] T7：review diff 并整理最终交接。

## 涉及文件

- `src/components/links/LinksDirectory.tsx`
- `src/components/links/LinksDirectory.test.tsx`
- `src/components/blog/SearchResultsList.tsx`
- `src/components/blog/SearchBar.test.tsx`
- `src/app/not-found.tsx`
- `src/app/error.tsx`
- `src/app/styles/links.css`
- `src/app/styles/search-ui.css`
- `src/app/styles/blog-ui.css`
- `docs/optimization-roadmap-2026-07-06.md`
- `TODO.md`
- `docs/handoff-to-agent.md`

## 风险与回滚

| 风险                                                          | 等级 | 缓解                                     | 回滚                 |
| ------------------------------------------------------------- | ---- | ---------------------------------------- | -------------------- |
| LinksDirectory 从服务端组件变为客户端组件导致 bundle 小幅增加 | 低   | 只使用 React 内置状态，不新增依赖        | 恢复为静态服务端渲染 |
| 筛选隐藏分类后锚点导航语义变化                                | 低   | 保留分类导航，筛选时展示可见数量和空状态 | 移除筛选控件         |
| 错误页样式影响全局                                            | 低   | 复用现有 `.not-found` 和轻量 BEM 类      | 恢复原 Tailwind 布局 |
| 搜索空状态文案过重                                            | 低   | 只给少量可操作入口                       | 回退为空短句         |

## 验收方式

- 组件测试覆盖新增行为。
- `pnpm test -- src/components/links/LinksDirectory.test.tsx src/components/blog/SearchBar.test.tsx`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm check:seo`
- `pnpm build`
- `pnpm exec tsx scripts/check-bundle-budget.ts`
- `pnpm test:e2e`
