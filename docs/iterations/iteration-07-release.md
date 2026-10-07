# Iteration 07 · 发布准备

## 1. 迭代名称

发布准备

## 2. 当前状态

**Completed**

## 3. 目标

最终回归 · 构建检查 · 链接检查 · 路由兼容 · SEO 检查 · 部署说明 · 回滚方案 · 版本记录 · 发布清单。

## 4. 背景

前 6 个迭代完成后收尾。本轮**发现并修复了一个严重遗留**：wikilink 语法退化（见 §16）。

## 5. 范围

- 全量回归（四门 + e2e + seo + docs）。
- **修复 wikilink 渲染退化**（重构中删除 `remark-wikilink` 导致正文 `[[...]]` 字面量裸露）。
- CHANGELOG 记录本次重构。
- 根 README 更新（实施状态 / 路由 / 功能 / 命令 / 文档索引）。
- 发布清单与回滚方案。

## 6. 非范围

- 不改 `data/projects.json` 内容（含已删产品条目，属内容决策）。
- 不推送 / 不合并 / 不部署（须用户授权）。

## 7. 前置条件

Iteration 06。

## 8. 具体任务

- [x] 恢复 `src/lib/posts/wikilink.ts`（纯函数）
- [x] 恢复 `src/lib/posts/remark-wikilink.ts`（去掉已删 popover 的 `data-wikilink` 属性）
- [x] `MdxContent` 重新挂载 `remarkWikilink`
- [x] 补 `wikilink.test.ts`（11 用例）+ `MdxContent.test.tsx` 恢复 wikilink 断言
- [x] CHANGELOG 记录重构
- [x] 根 README 更新
- [x] 全量回归

## 9. 涉及文件

**新增**：`src/lib/posts/wikilink.ts` + test · `src/lib/posts/remark-wikilink.ts`
**修改**：`src/components/blog/MdxContent.tsx` + test · `CHANGELOG.md` · `README.md`

## 10. 数据或接口变化

无（wikilink 恢复的是渲染层，内容未动）。

## 11. 设计变化

无（wikilink 渲染为普通正文链接，不带 popover）。

## 12. 测试计划

全量：typecheck / lint / test / build / e2e / check:seo / check:docs + 渲染实测。

## 13. 验收标准

20 篇文章可读（wikilink 正常渲染）；四门 + e2e 全绿；CHANGELOG/README 与实现一致。

## 14. 风险

R2（wikilink）——**本轮已闭环**。

## 15. 回滚方式

分支未合并；`git revert` 单迭代提交即可。

## 16. 实际完成情况

### 关键修复：wikilink 渲染退化（R2 闭环）

**问题**：重构中删除了 `remark-wikilink` 插件，导致 20 篇文章正文里 **131 处** `[[slug|label]]` 语法**以字面量显示给读者**（实测渲染：`<p>...见 [[web-performance-optimization|Web 性能优化实战]]。</p>`）。违反「不得牺牲阅读体验」硬约束。

**修法**：恢复 `wikilink.ts`（纯解析函数）+ `remark-wikilink.ts`（remark 插件，去掉已删 popover 的 `data-wikilink` 属性），`MdxContent` 重新挂载。**不恢复花园/反链**（那是独立链路）。

**验证**：实测渲染 → `<a href="/blog/web-performance-optimization">Web 性能优化实战</a>`，字面量残留 **0**。

### 回归结果

| 命令              | 结果               | exit |
| ----------------- | ------------------ | ---- |
| `pnpm typecheck`  | 通过               | 0    |
| `pnpm lint`       | 通过               | 0    |
| `pnpm test`       | 72 文件 / 547 测试 | 0    |
| `pnpm build`      | 107 静态页         | 0    |
| `pnpm test:e2e`   | 45 passed          | 0    |
| `pnpm check:seo`  | passed             | 0    |
| `pnpm check:docs` | 138 文件           | 0    |

### 文档

- CHANGELOG 记录 Added/Changed/Removed/Fixed。
- 根 README 更新实施状态、路由表、功能摘要、命令、文档索引。

## 17. 遗留问题

- **`data/projects.json` 含已删产品条目**（`chrono-portal` / `chrono-relay`）——属内容决策，未动。
- 全站装饰背景层保留（D-022）。
- 详情页标题衬线体（D-019）。
- CI Node 版本（R8）——未动 CI。
- **未提交 / 未推送**：分支 `feature/architecture-rebuild-2026-10-06` 有大量未提交改动。

## 18. 下一迭代建议

**重构完成**。后续：提交/推送（需用户授权）→ PR → 合并 master → 部署（须人审）。
