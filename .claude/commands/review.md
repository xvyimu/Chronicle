# /review — 按本仓规范代码评审

对当前分支/最近一次 diff 做评审。红线与规范以本仓 `CLAUDE.md` + `docs/PROJECT.md` 为准。

## 流程

1. 先读本仓 `CLAUDE.md` + `docs/PROJECT.md`，列出红线清单。
2. 范围：默认评审 `git diff`（工作树）；若参数给了 commit/branch，用 `git diff <base>..<target>`。
3. 评审轴：
   - **红线**：是否放宽 CSP、是否绕 RLS、是否引入第二前端框架/桌面壳
   - **规范**：分层（app/lib/components）、样式走语义 CSS modules、类型安全（禁双重断言）
   - **测试**：改动是否有对应测试；性能相关改动是否更新 bundle budget
4. 输出：
   - 问题清单（按严重度排序，每条给 file:line）
   - 红线符合性结论
   - 是否建议合并（一句话理由）

## 不做

- 不改写业务代码（评审只读；修复由后续任务做）。
- 不跑长构建（build/e2e 只在必要时抽查）。
