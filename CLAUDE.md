@AGENTS.md

## 快速入口

- 栈：**Next 16** + **React 19** + **Tailwind v4** · MDX snapshot · Vercel · pnpm（单包仓，pnpm-workspace.yaml 仅放 overrides/allowBuilds）
- 测试：`pnpm typecheck` · `pnpm test` · `pnpm build`（Lighthouse budget CI）
- 红线：不放宽 CSP · 不运行时 DB 内容源 · 不第二前端框架 · 不桌面壳
- 先读：`docs/PROJECT.md` · `docs/ops/` 现有 perf/audit 卡片

## 常用命令（真实 npm scripts）

- install: `pnpm install`（worktree 由 `orca.yaml → scripts.setup` 自动跑）
- dev: `pnpm dev`
- content: `pnpm content:build`（改 MDX 后必跑 → commit `generated/content-snapshot/`）
- lint/format: `pnpm lint` · `pnpm format:check`（`pnpm format` 可写）
- test: `pnpm test`（Vitest）· `pnpm test:e2e`（Playwright）· `pnpm typecheck`
- build: `pnpm build` → Vercel 部署
- commit: commitlint 已接入（conventional 前缀 + 中文 body 可用）
- 其他：`pnpm check:seo` · `check:sri` · `check:production-content` · `lh:mobile`
