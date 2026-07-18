# 进度记录：前后端逻辑分层优化

## 2026-07-18

### 规划与设计

- 读取 `AGENTS.md`、既有架构与搜索实现。
- 产出并确认设计：`docs/superpowers/specs/2026-07-18-frontend-backend-boundary-design.md`。
- pipeline 规格写入 `.pipeline/2026-07-18-frontend-backend-boundary/spec.md`（gitignore）。

### 实现（Coder）

- 新增 `src/server/content` 与 15 个页面/sitemap 内容 import 迁移。
- 迁移搜索 engine/rate-limit 至 `src/server/search`，新增 service + barrel。
- 收窄 `src/lib/search`；改造 `src/app/api/search/route.ts` 与测试。
- 新增 `src/lib/module-boundaries.test.ts`。
- 更新 `docs/architecture.md`、`docs/API.md`、`docs/handoff-to-agent.md`。
- 交接：`.pipeline/.../changes.md`。

### 独立验证

- Tester：定向 31 tests + typecheck + lint + 静态边界验收 → `PASS_WITH_ENV_NOTES`（`test-results.md`，gitignore）。
- Reviewer：对照规格与 diff → `APPROVE_WITH_NOTES`（`review.md`，gitignore）。

### 本地全量门禁（Coder）

- `pnpm test`：81 files / 618 tests
- `pnpm test:e2e`：48 tests
- format / format:docs / check:docs / lint / typecheck / check:seo / build / `git diff --check`：通过

### 上线

- 提交：`a91a07d` `feat: establish frontend-backend logical boundary`
- 推送：`master` → `origin/master`
- CI：`https://github.com/xvyimu/blog/actions/runs/29631593044`  
  quality / bundle-analyze / e2e / deploy 全部 success
- 生产冒烟：`pnpm exec tsx scripts/check-production-content.ts --base-url=https://incca.ccwu.cc` 通过
- 线上搜索：`GET /api/search?q=Redis` 返回 `source=server`，无内部字段泄露

### 归档

- 本 run 目录写入 task_plan / findings / progress
- 更新 runs/specs 索引、TODO、launch-baseline、handoff 生产基线
