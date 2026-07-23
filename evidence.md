# Evidence · CH-PERF-008 search API · 2026-07-24

- **Branch / wt：** `xvyimu/ch-perf-search-api` · 本工作区 `ch-perf-search-api`
- **Base tip：** `83085a7`（改动未要求 commit）
- **范围：** `src/app/api/search/**` · `src/server/search/**` · `src/lib/search/**` · `docs/API.md`（契约同步）
- **栈纪律：** 保持 fuse.js + 进程限流；**未**换 Orama/Pagefind；**未** push

## 做了什么

| 项 | 变更 | 路径 |
|----|------|------|
| **冷路径语料** | 生产 `CONTENT_BACKEND=snapshot` 时只读 `search-docs.json`（~48KB），不再经 `getAllPosts` → `readContentSnapshot` 连带解析 `posts-full.json`（~209KB）等整包 | `src/server/search/corpus.ts` · `service.ts` |
| **进程缓存** | search-docs 懒加载 + 稳定数组引用 → 既有 Fuse `WeakMap` 继续命中 | `corpus.ts` · `engine.ts` |
| **投影体积** | item 省略空 `category`/`series` 与 `featured:false`；服务端 match 去掉 title/tags 等冗余 `value`；同屏 description/excerpt 只保留 UI 用的一条；`score` 固定 6 位小数 | `src/lib/search/project.ts` · `engine.ts` |
| **缓存头** | `public, max-age=0, s-maxage=60, stale-while-revalidate=300`（浏览器校验 + CDN 短缓存） | `src/app/api/search/route.ts` · `docs/API.md` |
| **限流 / 引擎** | 未改配额语义；仍 Fuse + 固定窗口 60/min | `rate-limit.ts` · `engine.ts` |

## 行为兼容

- Wire 顶层字段不变：`query` / `results` / `count` / `source`
- `results[].item` 仍为 `SearchResultItem`；可选字段可缺省（原契约已允许）
- `matches[].value` 仍为可选；UI（`SearchResultsList`）对 title 用 `item.title + indices`，对 body 用 `value === excerpt||description`
- 空查询 / 限流 / 超长 q / 500 no-store 语义不变
- debounce 180ms 客户端未改（非必要）

## 验证

| 命令 | Exit | 备注 |
|------|------|------|
| `pnpm typecheck` | **0** | `tsc --noEmit`；Node v24.16.0 engines WARN only |
| `pnpm test` | **0** | Vitest **719** tests / **96** files（基线 716 + corpus/投影用例） |
| API / search 单测 | 含于上 | `route.test` · `engine` · `service` · `corpus` · `rate-limit` · `useServerSearch` |

## 本地延迟 / 体积数字（非 HTTP 全链路）

本机 Node 直接 `fs` 读 JSON（中位数，n=20；**非** Vercel cold start 全量）：

| 路径 | med |
|------|-----|
| 仅 `search-docs.json` parse | **0.65 ms** |
| 整包 snapshot（manifest+meta+full+search+garden+pos） | **4.31 ms** |

样本响应体积（5 条 hit 的合成 JSON，示意投影收益）：

| 形状 | bytes |
|------|------:|
| 旧投影风格（冗余 value / undefined 字段 / 长 score） | 7322 |
| 新投影风格 | 5900 |
| **Δ** | **−1422（约 −19%）** |

文件基线：`search-docs.json` 48550 B · `posts-full.json` 209456 B。

未起 `next dev`/`next start` 做端到端 HTTP p95（可选）；有以上冷读与载荷数字即可对照。

## 明确不做

- 换搜索引擎 / 改 CSP / 改它仓 / `git push`
- 改 content-snapshot 写格式或 posts repository 公共 API
- 客户端 debounce 调参（无必要）

## Orca

```text
orca worktree set --worktree current --comment "008 search done" --workspace-status in-review
→ ok · workspaceStatus=in-review · comment=008 search done
```
