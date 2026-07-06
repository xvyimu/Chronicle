# 发现记录

## 2026-07-05

- `docs/architecture.md` 顶部标注“部分过时”，但 `README.md` 与 `docs/overview.md` 仍把它作为架构入口推荐。
- `docs/handoff-to-agent.md` 的 7.3 小节明确写着“不必读 docs/architecture.md”，这会削弱后续接手时的文档导航价值。
- `README.md` 和 `docs/overview.md` 引用了 `docs/项目审查与改进文档.md`，当前仓库中未发现该文件；实际存在的是 `docs/architecture-review.html`。
- 当前权威架构事实集中在 `AGENTS.md` 与 `docs/handoff-to-agent.md`，适合提炼回 `docs/architecture.md`，让 README 的文档索引保持可信。

## 验证关注点

- 文档中测试数量需与当前基线一致：528 Vitest / 66 files，47 Playwright / 5 spec files。
- CSS 模块数量与加载顺序需保持 17 个模块、`responsive.css` 最后。
- shadcn CLI 限制、CSP nonce 动态渲染、内容 trace include、JSON repository factory 等近期关键架构事实需体现在新文档里。
