# 架构决策记录索引

> 状态：当前索引（2026-07-17）。ADR 记录决策原因；实现现状仍以源码和 `docs/architecture.md` 为准。

| ADR                                                                | 状态                   | 决策                                                        |
| ------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------- |
| [CSP nonce over full-site SSG](./2026-07-17-csp-nonce-over-ssg.md) | Accepted               | 保留每请求 nonce 和动态 HTML，不用 `unsafe-inline` 换取 SSG |
| [ADR 0002](./0002-local-content-repository-factory.md)             | Accepted / Implemented | JSON 内容复用 repository factory，领域查询留在 adapter      |
| [ADR 0001](./0001-csp-nonce-vs-ssg.md)                             | Superseded             | 早期 CSP/SSG 决策，由 2026-07-17 ADR 更新                   |

新增或修改 CSP、内容源、缓存、搜索引擎或部署模型时，应新增 ADR 或明确更新既有 ADR 的状态和后果。
