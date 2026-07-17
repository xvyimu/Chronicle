# 设计文档索引

> 本目录保存已实施设计。正文中的测试数、文件数和阶段计划是设计当时快照，当前基线见 `docs/handoff-to-agent.md`。

| 设计                                                                  | 状态        | 当前落点                                          |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------- |
| [CSS import 修复](./2026-06-29-css-import-fix-design.md)              | Implemented | 根/segment layout 显式导入语义 CSS                |
| [全站背景架构](./2026-06-29-site-backdrop-architecture-design.md)     | Implemented | CSS 伪元素 + server stage + client parallax       |
| [Posts 深化](./2026-06-29-posts-deepening-design.md)                  | Implemented | `src/lib/posts/`、ContentSource、route adapter    |
| [Links JSON 迁移](./2026-06-30-links-json-migration-design.md)        | Implemented | `data/links.json` + LinksRepository               |
| [shadcn 视觉架构](./2026-07-04-shadcn-visual-architecture-design.md)  | Implemented | UI primitives + MetaBadge/PageSection/ArchiveCard |
| [文档链接 CI 门禁](./2026-07-17-documentation-link-ci-gate-design.md) | Implemented | `pnpm check:docs` + Vitest + quality job          |
