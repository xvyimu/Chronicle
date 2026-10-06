# 架构决策记录索引

> 状态：当前索引（2026-07-17）。ADR 记录决策原因；实现现状仍以源码和 `docs/ARCHITECTURE.md` 为准。

| ADR                                                                | 状态                   | 决策                                                        |
| ------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------- |
| [CSP nonce over full-site SSG](./0003-csp-nonce-over-ssg.md)       | Accepted               | 保留每请求 nonce 和动态 HTML，不用 `unsafe-inline` 换取 SSG |
| [SRI evaluation](./0005-sri-over-nonce-evaluation.md)              | **Accepted** (prod on) | Next 16.2 SRI + nonce 互补；`ENABLE_SRI=1` 生产已开         |
| [Radical upgrade charter](./0004-radical-upgrade-charter.md)       | Accepted               | 档 C 列车边界：可回滚、非目标、生产另授权                   |
| [Keep Fuse search (T4)](./0006-search-engine-keep-fuse.md)         | Accepted               | n=20 维持 Fuse；Orama/Pagefind 待 ≥200 文或 p95 证据        |
| [Workspace rebuild baseline](./0007-workspace-rebuild-baseline.md) | Accepted               | 保留栈，重构为中性灰工作台内容站；搜索转客户端轻量方案      |
| [ADR 0002](./0002-local-content-repository-factory.md)             | Accepted / Implemented | JSON 内容复用 repository factory，领域查询留在 adapter      |
| [ADR 0001](./0001-csp-nonce-vs-ssg.md)                             | Superseded             | 早期 CSP/SSG 决策，由 2026-07-17 ADR 更新                   |

> **ADR-0006 注**：2026-10-06 起搜索实现形态由服务端 `/api/search` 转为**客户端轻量方案**（ADR-0007）。
> 「维持 Fuse、不上外部引擎」的结论不变；具体载体待迭代 03 定案后更新 0006 状态。

新增或修改 CSP、内容源、缓存、搜索引擎或部署模型时，应新增 ADR 或明确更新既有 ADR 的状态和后果。
