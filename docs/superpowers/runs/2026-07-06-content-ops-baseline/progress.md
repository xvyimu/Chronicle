# 进度记录：内容运营基线与收藏资产系统

## 2026-07-06

- 已确认工作树干净：`master...origin/master`。
- 已读取 `superpower`、`planning-with-files-zh`、`test-driven-development`、`review` 技能说明。
- 已读取 `package.json`、`data/links.json`、`src/lib/links.ts`、`src/lib/links.test.ts`、`LinksDirectory`、`check-seo`、`check-production-content`、`docs/performance-baseline.md`、`docs/content-workflow.md`、README 和 CI 配置。
- 已建立本阶段任务计划、发现记录和进度记录。
- 已按 TDD 写入 links 数据层和 LinksDirectory 组件测试。
- RED 结果符合预期：`parseLinks` 尚未保留运营元信息、`getLinkAssetIssues` 不存在、链接卡片尚未展示官网/优先级/使用场景。
- 已实现 `official`、`priority`、`useCase`、`lastChecked` 可选字段，新增 `getLinkAssetIssues`，并在 `/links` 卡片展示官网/优先级/检查日期/用途。
- Targeted tests 已通过：`src/lib/links.test.ts`、`src/components/links/LinksDirectory.test.tsx`、`src/app/links/page.test.tsx` 共 32 项通过。
- 已将链接资产校验接入 `scripts/check-seo.ts`，本地 `pnpm check:seo` 通过。
- 已为 `data/links.json` 的工程文档、自托管、VPS、博客参考等核心收藏补充运营元信息。本地统计：14 篇文章、10 个收藏分类、123 条收藏链接、32 条已带运营元信息。
- 已新增 `docs/launch-baseline.md`，并更新 `docs/content-workflow.md`、`docs/overview.md`、README 文档索引。
- 线上只读核验：最新 CI run `28781033610` 成功，生产内容 smoke 对 `https://incca.ccwu.cc` 通过；PowerShell `ConvertFrom-Json` 因默认编码读取中文 JSON 出现乱码解析失败，已改用 Node `fs.readFileSync(..., 'utf8')` 完成统计。
- 验证通过：`pnpm format:check`、`pnpm format:docs:check`、`pnpm lint`、`pnpm typecheck`、`pnpm check:seo`、`pnpm test`（542 项 / 68 文件）、`pnpm build`、`pnpm exec tsx scripts/check-bundle-budget.ts`、`pnpm test:e2e`（47 项 / 5 文件）。
- `pnpm format:docs:check` 初次发现 4 个 Markdown 文件需要 Prettier，已运行 `pnpm format:docs` 修复并复查通过。
- 已同步当前状态文档中的 Vitest 基线为 542 tests / 68 files；历史 specs 和 architecture-review 快照不改。
- 已复查 diff 规模和关键实现，`rtk git diff --check` 通过；本轮未提交，工作树保留待用户确认。
