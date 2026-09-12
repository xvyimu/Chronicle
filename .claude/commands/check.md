# /check — 提交前检查

在提交流程前执行。按栈分叉：本目录是 `D:\projects\Chronicle`（pnpm）→ 用 Chronicle 脚本；若是 ChronoPortal（pnpm）→ 用其脚本。通用脚本放在全局 `.claude/commands/`，本命令按「先读本仓 CLAUDE.md 的常用命令」取值。

## 流程

1. 读本仓 CLAUDE.md「常用命令」「快速入口」；确定构建器（pnpm/npm/yarn）。
2. 按顺序跑（任一失败→停，报告失败点 + 修复建议，不 commit）：
   - `pnpm lint`（或脚本等价物）
   - `pnpm format:check`（若存在）
   - `pnpm typecheck`
   - `pnpm test`
   - 若改动涉及内容层（MDX/snapshot）→ 加 `pnpm content:build` 并确认 `generated/` 快照已更新
3. 全部通过 → 给一行摘要：改了哪些文件、覆盖什么、各门结果。
4. 最后给 commit 命令建议（commitlint 前缀 + 中文 body）。

## 不做

- 不自动 commit（/check 只检查）。
- 不跑长构建（build/e2e 留给 /review 或手动）。
