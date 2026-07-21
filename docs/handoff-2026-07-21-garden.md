# 收工交接 · 数字花园 G0/G1 · 2026-07-21

> 时间点快照，不是长期操作手册。日常接手仍以 [handoff-to-agent.md](./handoff-to-agent.md)、根 [TODO.md](../TODO.md)、[architecture.md](./architecture.md) 为准。

## 状态

| 项            | 值                                                                |
| ------------- | ----------------------------------------------------------------- |
| 本地 HEAD     | **`7202172`** content wikilinks · 功能 **`b96b3c3`** garden G0/G1 |
| origin / 生产 | `dfc057b` · `https://incca.ccwu.cc` · **未含本批提交**            |
| 分支          | `master` **ahead 4**，工作树 clean                                |
| 用户边界      | 已本地 commit；**未授权 push**                                    |

## 本轮增量（2026-07-21 续）

- 14 篇「延伸阅读」`[title](/blog/slug)` → `[[slug|title]]`（**42** 条；仓内合计约 **47** 条 wikilink，含三角正文）
- 冒烟：`pnpm dev -p 3001`（本机 **3000 被 NewAPI 占用**，勿假定 3000 是博客）
  - 三角 + cicd / postgresql：200，反链面板有真实入边
- 单测：wikilink / remark / link-graph / ArticleBacklinks / page → **29** 绿

## 已完成（含昨日）

- 整合调研报告：`architecture-optimization-research-2026-07-21.md`（overview 已挂链）
- G0：`[[slug]]` / `[[slug|label]]` → remark 内链
- G1：链接图 + 反链面板 + fail-closed 坏链
- 样例三角正文：`vps` ↔ `docker` ↔ `nginx`；延伸阅读全站 wikilink 化
- TODO：G0/G1 勾选；**G2 仍开**；运营项仍 blocked/pending

## 下一步

1. **你确认后** `git push` → CI → `pnpm check:production-content -- --base-url=https://incca.ccwu.cc`
2. 目视：`http://localhost:3001/blog/{vps,docker,nginx}-*` 内链与反链
3. 正文再补语义 `[[ ]]`（可选）；**G2 等边更密** 再做
4. 勿假完成 GSC；勿换栈 / 放宽 CSP

## 关键路径

- `src/lib/posts/wikilink.ts` · `remark-wikilink.ts` · `link-graph.ts`
- `src/components/blog/ArticleBacklinks.tsx` · `MdxContent.tsx`
- `src/server/content/index.ts`（`getBacklinks`）
- `.pipeline/review.md`（SHIP，含 BLOCK→fix 史）
