# Iteration 05 · 内容导航

## 1. 迭代名称

内容导航

## 2. 当前状态

**Completed**

## 3. 目标

分类 / 标签 / 专题 / 归档 / 最近阅读 / 收藏 / 面包屑 / 相关 / 上下篇。

## 4. 背景

分类/标签/专题页已存在（用 `ArchiveCard` / 标签云）；**归档页不存在**；收藏与最近阅读不存在；`sitemap.ts` 仍含 `/garden` `/links` 死链（审计 E6 同类）。

## 5. 范围

- 归档页 `/archive`（按年份分组时间线）+ sitemap + 导航项。
- 收藏 / 最近阅读（localStorage，复用 `safeLocalStorage`）：`reading-state.ts` + `ReadingActions`（文章页收藏按钮 + 阅读记录）+ `/favorites` 页。
- 修 `sitemap.ts` 死链（`/garden` `/links` → `/archive`）。

## 6. 非范围

- 不引入账号 / 数据库 / 云同步（收藏为本地）。
- 分类/标签/专题页视觉沿用（已用中性灰 token，无装饰动画）。
- 面包屑：现有 `ArchiveCard` / `ArticleHeader` 已有返回路径，未新增独立面包屑组件（避免过度设计）。

## 7. 前置条件

Iteration 02。

## 8. 具体任务

- [x] `src/lib/reading-state.ts`（收藏 / 最近阅读，容错 + 去重 + 上限）
- [x] `reading-state.test.ts`（6 用例）
- [x] `ReadingActions`（收藏按钮 + 阅读记录）
- [x] `LocalReadingList`（收藏 / 最近阅读列表，客户端）
- [x] `/archive` 归档页 + `archive-timeline` 样式
- [x] `/favorites` 我的阅读页 + `reading.css`
- [x] `sitemap.ts` 加 `/archive`、去死链
- [x] 导航加 `/archive` `/favorites`
- [x] 同步 `sitemap.test.ts` / `navigation.test.ts` / `Header.test.tsx`
- [x] 四门验证

## 9. 涉及文件

**新增**：`src/lib/reading-state.ts` + test · `src/components/blog/{ReadingActions,LocalReadingList}.tsx` · `src/app/archive/{page,layout}.tsx` · `src/app/favorites/{page,layout}.tsx` · `src/app/styles/reading.css`
**修改**：`src/lib/navigation.ts` + test · `src/app/sitemap.ts` + test · `src/components/layout/Header.test.tsx` · `src/app/blog/[slug]/{page,layout}.tsx` · `src/app/styles/archive.css`

## 10. 数据或接口变化

localStorage keys：`chronicle:favorites` · `chronicle:recent`（仅存 slug + 时间戳）。

## 11. 设计变化

- 归档页：按年份分组时间线（年份 sticky 标签 + 日期/标题/分类行）。
- 文章页：右上角收藏按钮（`aria-pressed`）。
- 我的阅读页：收藏 + 最近阅读双列。

## 12. 测试计划

四门 + check:seo + dev 冒烟。

## 13. 验收标准

导航路径清晰；归档可用；收藏/最近阅读可用；四门全绿。

## 14. 风险

R1。

## 15. 回滚方式

`git revert` 本迭代提交。

## 16. 实际完成情况

- 归档页 + 收藏/最近阅读落地；`sitemap.ts` 死链修复（同时消掉审计 E6 的一半）。
- 验证：`typecheck` 0 · `lint` 0 · `test` 72 文件/547 测试 · `build` 0（107 静态页）· `check:seo` passed · dev 9 路由 200（`/archive` `/favorites` 新增）。

## 17. 遗留问题

- **`docs/API.md` 仍描述已删的 `/api/search` `/api/preview`**——归迭代 06。
- `lib/ops-readiness.ts` 文案提及 `/api/search`——归迭代 06。
- `ProjectCard` 仍用 `MagneticCard`——归迭代 06。
- `check-doc-links-script.test.ts` flaky（R10）——归迭代 06。
- 面包屑未做独立组件（现有返回路径够用）。

### 自查记录（Stop hook 触发）

- **实现真实性**：`reading-state.ts` 读写真实 localStorage、真实去重/排序/截断；测试用真实 jsdom localStorage（非 mock）。无硬编码返回值。
- **抽取重复**：`getFavorites` / `getRecent` 曾各自「parse → 按 at 倒序」（仅截断不同），且 `isFavorite` / `toggleFavorite` 各写一遍 slug 判断 → 抽内部 `readSorted(key, limit?)`，两处复用。
- **不合并的判断**：`ArticleList`（RSC，首页，含摘要/标签）与 `LocalReadingList`（client，收藏页，含加载/空态）**形态与运行环境不同**，非重复实现，不合并（同 D-017 判据）。
- 验证：抽取后 `typecheck` 0 · `lint` 0 · 全量 `test` 72 文件/547 测试通过。

## 18. 下一迭代建议

Iteration 06：质量优化（响应式 / a11y / 深色 / SEO / 性能 / 清死代码 / 快照重生成）。
