# 公开 HTTP API

> 状态：当前契约（2026-10-06 Iteration 06 订正）。公开 Route Handler 仅剩 CSP 违规上报（`POST`，collect-only）。
> **已移除**（2026-10-06 重构）：`GET /api/search`（改客户端 Fuse）、`GET /api/preview/[slug]`（随数字花园移除）。
> 运行时：Node.js（`export const runtime = 'nodejs'`）。

| 路径                   | 用途                         | 限流                                           | 成功缓存                   |
| ---------------------- | ---------------------------- | ---------------------------------------------- | -------------------------- |
| `POST /api/csp-report` | CSP 违规上报（collect-only） | 30 次 / 60s / origin key（`csp-report:` 前缀） | `no-store`（204，无 body） |

---

## `POST /api/csp-report`

> Route Handler：`src/app/api/csp-report/route.ts`。CSP 违规**收集端点**，collect-only：只写服务端日志，不落库、不外发、不回显。

浏览器在 CSP 违规时把报告 POST 到本端点。`src/proxy.ts` 在每个响应的 CSP 上同时挂了两条上报通道：

- `report-to csp-endpoint` —— 现代 Reporting API，配合 `Reporting-Endpoints: csp-endpoint="/api/csp-report"` 响应头。
- `report-uri /api/csp-report` —— 旧浏览器回退。

**本端点只增加遥测出口，不放宽任何 CSP 指令**：nonce + `strict-dynamic` 的执行策略完全不变。

### 请求

| 维度         | 值                                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 方法         | `POST`（仅浏览器自动发起；无鉴权、公开可达）                                                                           |
| Content-Type | `application/csp-report`（report-uri）或 `application/reports+json`（Reporting API）；实际按 body 结构解析，不强校验头 |
| 请求体上限   | 16 KiB；超过直接丢弃不解析                                                                                             |
| 限流         | 30 次 / 60s / origin key（`csp-report:` 前缀隔离）                                                                     |

两种 body 结构都接受：

```jsonc
// report-uri
{ "csp-report": { "document-uri": "...", "violated-directive": "...", "blocked-uri": "..." } }

// Reporting API（数组）
[{ "type": "csp-violation", "body": { "documentURL": "...", "effectiveDirective": "...", "blockedURL": "..." } }]
```

### 响应

| 状态  | 触发                       | 说明                                                                    |
| ----- | -------------------------- | ----------------------------------------------------------------------- |
| `204` | 正常收集 / body 畸形或超限 | 无响应体；`Cache-Control: no-store`。畸形上报也返回 204，不暴露解析细节 |
| `429` | 超过 30 次 / 60s           | 无响应体；带 `Retry-After`、`Cache-Control: no-store`                   |

### 安全边界

- 端点无鉴权、公开可 POST，故用进程限流防日志刷量；这不是安全配额，硬限制放平台 WAF。
- 只提取白名单字段（documentUri / violatedDirective / effectiveDirective / blockedUri / disposition），每字段截断 512 字符，**绝不把攻击者可控的原始结构整体写进日志**。
- 不落库、不转发第三方、不回显给客户端。

### 实现位置

| 职责               | 路径                                                    |
| ------------------ | ------------------------------------------------------- |
| HTTP 映射 / 规范化 | `src/app/api/csp-report/route.ts`                       |
| 单测               | `src/app/api/csp-report/route.test.ts`                  |
| CSP 指令 / 上报头  | `src/proxy.ts`                                          |
| 限流               | `src/server/rate-limit.ts`（`checkCspReportRateLimit`） |

---

## 站内搜索（非 HTTP API）

搜索已改为**客户端**实现，不再有服务端端点：

- 逻辑：`src/lib/search/`（`SearchDoc` 投影 + `searchDocs` 纯函数，Fuse）。
- UI：`src/components/search/SearchPanel.tsx`（客户端岛，键盘 `/` `Ctrl+K`，URL `?q=` 可分享）。
- 规模：20 篇客户端内存索引足够；>200 篇时评估服务端方案（ADR-0006）。
