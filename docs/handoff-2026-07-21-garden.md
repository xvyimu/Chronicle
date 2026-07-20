# 收工交接 · 数字花园 G0/G1 · 2026-07-21

> 时间点快照，不是长期操作手册。日常接手仍以 [handoff-to-agent.md](./handoff-to-agent.md)、根 [TODO.md](../TODO.md)、[architecture.md](./architecture.md) 为准。

## 状态

| 项            | 值                                                                           |
| ------------- | ---------------------------------------------------------------------------- |
| 本地 HEAD     | `b96b3c3` · `feat(garden): wikilink G0 and backlinks G1 digital garden loop` |
| origin / 生产 | `dfc057b` · `https://incca.ccwu.cc` · **未含本提交**                         |
| 分支          | `master` **ahead 1**，工作树 clean                                           |
| 用户边界      | 已本地 commit；**未授权 push**                                               |

## 已完成

- 整合调研报告：`architecture-optimization-research-2026-07-21.md`（overview 已挂链）
- G0：`[[slug]]` / `[[slug|label]]` → remark 内链
- G1：链接图 + 反链面板 + fail-closed 坏链
- 样例：`vps-initial-setup` ↔ `docker-deploy-guide` ↔ `nginx-reverse-proxy`
- TODO：G0/G1 勾选；G2 仍开；运营项仍 blocked/pending

## 明天建议

1. 确认后 push → CI → production smoke
2. `pnpm dev` 目视三篇样例
3. 继续给旧文补 wikilink；G2 等边密度
4. 勿假完成 GSC；勿换栈 / 放宽 CSP

## 关键路径

- `src/lib/posts/wikilink.ts` · `remark-wikilink.ts` · `link-graph.ts`
- `src/components/blog/ArticleBacklinks.tsx` · `MdxContent.tsx`
- `src/server/content/index.ts`（`getBacklinks`）
- `.pipeline/review.md`（SHIP，含 BLOCK→fix 史）
