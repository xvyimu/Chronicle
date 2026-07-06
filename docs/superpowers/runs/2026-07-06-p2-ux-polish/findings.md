# Findings：P2 UX 收尾

## 已确认事实

- 工作树在开始时为 `master...origin/master` 且干净，最新提交为 `b48d57d feat: add content operations baseline`。
- `docs/optimization-roadmap-2026-07-06.md` 记录第一轮 Phase 1-3 已完成，建议下一轮优先处理 P2：链接目录筛选、404/error 导流、内容量增长后的搜索索引构建和移动 Lighthouse 常规化。
- `/links` 当前由 `src/components/links/LinksDirectory.tsx` 渲染，为静态目录、分类锚点和外链卡片，无关键词筛选。
- 搜索空状态在 `SearchResultsList.tsx` 中只有“没有匹配的文章”一句。
- 根级 `not-found.tsx` 只有回首页入口；`error.tsx` 只有重试按钮。
- 现有通用样式已有 `.empty-state`，可复用搜索和链接目录空状态语义。

## 设计判断

- 本轮不引入 Fuse 或新依赖到 `/links`，只做轻量关键词筛选，匹配标题、URL host、描述、用途和 tags。
- `/links` 筛选属于交互行为，`LinksDirectory` 需要改为 client component；数据仍由页面服务端读取后传入，不改变数据源。
- 异常页导流应保持简洁，不做营销式落地页；目标是让用户回到首页、博客或导航收藏。
- 内容量增长后的搜索索引构建和 Speed Insights p75 回填仍保留为长期项，不在本轮处理。
