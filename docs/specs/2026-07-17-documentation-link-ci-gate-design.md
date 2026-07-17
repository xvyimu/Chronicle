# 文档链接完整性 CI 门禁设计

> 状态：Implemented  
> 日期：2026-07-17  
> 需求：[下一里程碑增量 PRD](./2026-07-17-next-milestone-prd.md)

## 目标与边界

复用 `scripts/check-doc-links.mjs`，让本地开发、Vitest 和 GitHub Actions 使用同一套内部 Markdown 链接检查行为。实现不引入依赖或网络请求，不校验外部 URL，也不修改页面、样式、路由、内容模型、运行时或部署架构。

## 决策

1. `package.json` 提供 `check:docs`，固定执行 `node scripts/check-doc-links.mjs`。
2. 保留 `scripts/check-doc-links.test.mjs` 的 5 个 parser fixture；Vitest 继续桥接该 suite。
3. Vitest 通过标准 package 命令扫描真实仓库，断言成功日志中的 Markdown 文件数大于 0。
4. Vitest 在系统临时目录创建独立仓库 fixture，直接运行 CLI，断言坏链导致非零退出，且 stderr 包含来源文件、目标和 `target does not exist`。
5. CI quality job 在 `pnpm format:docs:check` 后运行 `pnpm check:docs`，确保 build 和后续部署依赖链前已阻断坏链。
6. README、AGENTS、Agent 接手指南和文档总览只展示 `pnpm check:docs` 这一维护入口。

## 日志契约

- 成功：输出 `Documentation link check passed (<n> Markdown files).`，其中 `n > 0`。
- 失败：退出码非 0；每项输出相对来源文件、原始目标和失败原因。

## 风险与回滚

- 现有文档坏链会使本地命令和 CI 失败；应修复真实链接或为解析规则补测试，不扩大排除范围。
- 子进程测试必须兼容 Windows 的 `pnpm.cmd` 与 CI 的 `pnpm`。
- 回滚时仅移除 `check:docs` script、quality job 对应步骤、两项集成测试和维护文档入口；保留原检查器与 5 个 parser fixture。

## 验证

运行 `pnpm check:docs`、`pnpm test`、`pnpm format:check`、`pnpm format:docs:check`、`pnpm lint`、`pnpm typecheck` 和 `git diff --check`。另静态确认 quality job 的调用顺序及本轮 diff 不含访客端文件。
