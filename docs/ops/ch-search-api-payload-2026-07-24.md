# W5 · search API payload residual · 2026-07-24

> Worktree：`ch-search-api-payload` · Branch：`xvyimu/ch-search-api-payload`  
> Base：master `1f52af9`（已含 CH-PERF-008 cold-path）  
> 范围：`src/app/api/search/**` · `src/server/search/**` · 相关测试 · 本文件 + `evidence.md`  
> 栈锁：fuse 不换 · CSP 不放宽 · 未改 preview/csp-report 业务 · 未动 links/home/mdx

## 背景

CH-PERF-008（`3b64203`）已落地：

- snapshot 只读 `search-docs.json`
- DTO 投影瘦身（空可选字段 / match value / score 6 位）
- 成功响应 `max-age=0, s-maxage=60, swr=300`
- Fuse `WeakMap` 按语料数组引用复用

本 wt 再增量：在 **不换引擎、不改限流算法** 前提下补再验证与错误路径缓存纪律。

## 本波变更

| 项                | 变更                                                                                                      | 路径                           |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **ETag / 304**    | 成功 body 生成强实体 `ETag`（SHA-1 base64url）；`If-None-Match` 命中 → `304` 无 body，仍带缓存头 + ETag   | `src/app/api/search/route.ts`  |
| **错误 no-store** | `400 QUERY_TOO_LONG` / `429 RATE_LIMITED` 补 `Cache-Control: no-store`（与 500 对齐，避免错误被中间缓存） | 同上                           |
| **索引复用注释**  | corpus 进程缓存与 WeakMap 关系写清；engine 回归测强化同引用重复查询                                       | `corpus.ts` · `engine.test.ts` |
| **契约**          | `docs/API.md` 同步 ETag/304 与 400/429 no-store                                                           | `docs/API.md`                  |

## 明确不做

- 换 fuse / Orama / Pagefind
- 改 rate-limit 配额或 key 算法
- 改 preview / csp-report 业务逻辑
- 改 `src/lib/search` 投影公式（008 已够；本 wt 不重复）
- 动 links / home / mdx / CSP

## 验证

见根目录 `evidence.md`（typecheck / test 命令 + exit）。
