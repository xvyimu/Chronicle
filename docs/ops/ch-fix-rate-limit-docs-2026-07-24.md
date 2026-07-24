# CH-FIX-RATE-LIMIT-DOCS · 证据 · 2026-07-24

> Worktree：`ch-fix-rate-limit-docs` · Branch：`xvyimu/ch-fix-rate-limit-docs`  
> 模块：`M-CH-fix-rate-limit-docs` · Findings：**CH-CR-001** · **CH-CR-002**  
> **范围：** docs/ops 限流边界 + WAF 检查表；可选注释澄清；**无** Redis/KV/鉴权大改

## 环境

| Item              | Value                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Worktree path     | `C:\Users\yuanjia\orca\workspaces\Chronicle\ch-fix-rate-limit-docs` |
| Branch            | `xvyimu/ch-fix-rate-limit-docs`                                     |
| Base tip at start | `1f52af9`（integrate: ch-perf-links）                               |
| 范围外            | 禁 push master · 禁假跨 isolate 全局限流 · 禁放宽 CSP · 禁动 fuse   |

## 交付物

| 路径                                                                                      | 角色                                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`docs/ops/public-api-rate-limit-boundary.md`](./public-api-rate-limit-boundary.md)       | 公开 API 进程限流边界 + 生产 WAF 检查表（search / preview / csp-report） |
| [`docs/ops/ch-fix-rate-limit-docs-2026-07-24.md`](./ch-fix-rate-limit-docs-2026-07-24.md) | 本证据                                                                   |
| 根 [`evidence.md`](../../evidence.md)                                                     | 门闩 exit 摘要                                                           |
| [`docs/API.md`](../API.md)                                                                | 最小交叉链接 → ops 边界页                                                |
| [`SECURITY.md`](../../SECURITY.md)                                                        | 最小公开 API / 限流边界指针                                              |
| `src/server/search/rate-limit.ts`                                                         | 注释澄清（语义不变）                                                     |
| 三 API route 顶部                                                                         | 注释澄清（可选；语义不变）                                               |

## 文档断言（验收对照）

| 断言                       | 落点                     |
| -------------------------- | ------------------------ |
| 进程内 Map                 | boundary §1–§2           |
| 多 isolate 不共享          | boundary §1、§2.2、§2.3  |
| `anonymous` 桶条件         | boundary §2.1            |
| 硬配额在平台 WAF           | boundary §1、§4          |
| WAF 检查表可勾选、无密钥   | boundary §4、§6          |
| preview 公开枚举属产品模型 | boundary §3（CH-CR-002） |

## 明确不做（本 commit）

- Redis / KV / Durable 全局限流实现
- preview 登录 / 鉴权大改
- 放宽 CSP · 换 fuse · home/mdx/links 重构
- push master

## 门闩（本机）

见根 `evidence.md`（命令 + exit code）。预期：

| Command           | 期望                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `pnpm typecheck`  | **0**                                                                        |
| `pnpm check:docs` | **0**                                                                        |
| `pnpm test`       | 仅当改动限流算法语义时必跑；本切片注释-only 时以 typecheck + check:docs 为主 |

## 变更记录

| 日期       | tip       | 说明                 |
| ---------- | --------- | -------------------- |
| 2026-07-24 | `dc6aaf6` | 初版 docs + 注释澄清 |
