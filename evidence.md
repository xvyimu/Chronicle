# Evidence · W5 M-CH-search-api-payload · 2026-07-24

- **Branch / wt：** `xvyimu/ch-search-api-payload` · `ch-search-api-payload`
- **Base tip：** `1f52af9`（master integrate 含 CH-PERF-008）
- **范围：** `src/app/api/search/**` · `src/server/search/**` · 相关测试 · `docs/API.md` · `docs/ops/ch-search-api-payload-2026-07-24.md`
- **栈纪律：** fuse 不换 · CSP 不放宽 · 未 push master

## 做了什么（相对 008 再增量）

| 项         | 说明                                                              |
| ---------- | ----------------------------------------------------------------- |
| ETag + 304 | 成功 JSON body → SHA-1 ETag；`If-None-Match` 命中返回 304 空 body |
| 错误路径   | 400 / 429 增加 `Cache-Control: no-store`（500 已有）              |
| 索引复用   | corpus 缓存注释；`searchPostsCached` 同引用重复查询回归测         |
| 契约       | `docs/API.md` 同步                                                |

## 验证

| 命令                                                | Exit  | 备注                                            |
| --------------------------------------------------- | ----- | ----------------------------------------------- |
| `pnpm typecheck`                                    | **0** | `tsc --noEmit`；Node v24.16.0 engines WARN only |
| `pnpm test -- src/app/api/search src/server/search` | **0** | 5 files / **29** tests                          |
| `pnpm test`                                         | **0** | Vitest **98** files / **751** tests passed      |

## 明确不做

- 换引擎 / 限流算法大翻 / preview·csp 业务 / push master
