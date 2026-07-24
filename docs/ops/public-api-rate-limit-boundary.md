# 公开 API 限流边界 · 生产 WAF 检查表

> 状态：ops 现行（2026-07-24）  
> 对照 findings：**CH-CR-001**（进程内 Map 非全局）· **CH-CR-002**（preview 公开元数据枚举）  
> 契约 SSOT：[`docs/API.md`](../API.md) · 实现：`src/server/search/rate-limit.ts`  
> 本页**不**引入 Redis/KV，**不**假称跨 isolate 全局限流。

---

## 1. 结论（先读）

| 层                        | 作用                                     | 是否全局                                |
| ------------------------- | ---------------------------------------- | --------------------------------------- |
| 应用内 `Map` 固定窗口     | 单 Node isolate 上的**尽力而为**资源保护 | **否** — 多 isolate / 冷启动 **不共享** |
| CDN `s-maxage` 命中       | 不进 origin，不进 Map                    | 与限流正交                              |
| **Vercel Firewall / WAF** | 平台侧硬配额与滥用拦截                   | **是**（生产硬边界应放这里）            |

**一句话：** 代码里的 60/120/30 次每 60s 只保护「打到本 isolate 的请求」；生产硬安全配额必须在 Vercel 控制台确认 WAF/Firewall 规则。

---

## 2. 公开面与应用内配额

| 路径                  | 方法 | 鉴权 | 应用内配额（每 key / 60s） | key 前缀      | 成功缓存                   |
| --------------------- | ---- | ---- | -------------------------- | ------------- | -------------------------- |
| `/api/search`         | GET  | 无   | **60**                     | （无前缀）    | `s-maxage=60, swr=300`     |
| `/api/preview/[slug]` | GET  | 无   | **120**                    | `preview:`    | `s-maxage=3600, swr=86400` |
| `/api/csp-report`     | POST | 无   | **30**                     | `csp-report:` | `no-store`                 |

共用同一进程内 `Map`；前缀只隔离**配额桶**，不提供跨实例一致性。

### 2.1 限流 key 语义

实现：`clientKeyFromRequest`（`src/server/search/rate-limit.ts`）。

| 条件                                            | key                |
| ----------------------------------------------- | ------------------ |
| 请求带合法 `x-vercel-forwarded-for`（平台维护） | 首个合法 IPv4/IPv6 |
| 本地 dev / 非 Vercel / 头缺失或非法             | **`anonymous`**    |

**刻意不信：** `x-forwarded-for`、`x-real-ip` 等可伪造通用转发头。

**`anonymous` 桶风险：** 同一 isolate 上所有无平台 IP 的请求共享一个桶 → 本地压测易互踩；生产在 Vercel 上通常有平台头，但仍可能有边缘路径落 `anonymous`。这是 CH-CR-001 的放大面之一，**不是**「全站共享安全配额」的设计目标。

### 2.2 固定窗口行为（应用内）

- 窗口：`SEARCH_RATE_LIMIT_WINDOW_MS = 60_000`
- 超限：`429` + `Retry-After`（search/preview 另带 `X-RateLimit-Remaining: 0`）
- search：限流在 query 校验**之前** → 空查/非法 `q` 也计数
- CDN 缓存命中：**不**进入 Map
- 多 serverless isolate：**各自**一份 Map；冷启动清空
- 定期 prune 过期 bucket（每 200 次操作）— 防单 isolate 内 Map 无界增长，**不是**集群同步

### 2.3 明确不是什么

| 说法                     | 真相                                              |
| ------------------------ | ------------------------------------------------- |
| 「全站 60 QPS 安全上限」 | **假** — 只 per-isolate                           |
| 「上了 Redis 就全局了」  | **未做**；上 KV/Redis 需 ADR + 人批（本任务禁止） |
| 「preview 有鉴权」       | **无** — 产品模型允许公开元数据                   |
| 「进程限流 = WAF」       | **否** — WAF 是平台硬边界                         |

---

## 3. CH-CR-002 · preview 公开元数据

| 项                 | 说明                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| 暴露               | 已发布文章的 `slug/title/description/date/category/tags`                                                   |
| **不**暴露         | MDX 正文、`searchText`、headings、草稿（prod `published === false` 经 `getPostBySlug` / `isVisible` 过滤） |
| 风险               | 可用已知/猜测 slug **枚举已发文元数据**（与 sitemap/公开页信息重叠，属博客产品模型）                       |
| 应用内缓解         | 120/60s 进程限流 + 长 CDN 缓存降低 origin 压力                                                             |
| **不做**（本切片） | 登录墙、签名 URL、反爬 token — 会改产品模型，需单独 ADR                                                    |
| 生产硬边界         | 见下方 WAF 对 `/api/preview/*` 的速率规则                                                                  |

草稿泄露路径：在生产 snapshot + repository 可见集一致时，**审查结论为无草稿泄露**；本页不放宽 draft 过滤。

---

## 4. 生产 WAF / Firewall 检查表（无密钥）

> **谁做：** 有 Vercel 项目写权限的人（Agent **不**代登、不入库 token）。  
> **项目：** Chronicle 生产域名 `incca.ccwu.cc`（以 Vercel Project 绑定为准）。  
> **UI 入口（名称随控制台迭代，按近义找）：** Project → **Firewall** / **Security** → **Rules** / **Rate Limiting** / **WAF**。  
> 文档锚点（人侧打开）：[Vercel WAF](https://vercel.com/docs/security/vercel-waf) · [Rate limiting](https://vercel.com/docs/security/vercel-waf/rate-limiting)。

### 4.1 勾选前准备

| #   | 检查项                                                          | 期望                                         | 勾选 |
| --- | --------------------------------------------------------------- | -------------------------------------------- | ---- |
| P1  | 已登录正确 Vercel team / 生产 Project                           | 非 preview 部署项目                          | ☐    |
| P2  | 确认生产域名与 Project 绑定                                     | `incca.ccwu.cc`                              | ☐    |
| P3  | 当前套餐是否含 **Firewall / Custom WAF / Rate limit**           | 无则升级或接受「仅应用内尽力而为」并记入风险 | ☐    |
| P4  | 变更窗口：先 **Log / Challenge** 再 **Block**（避免误伤搜索框） | 有观察期                                     | ☐    |

### 4.2 建议规则（可按套餐能力裁剪）

| ID                        | 匹配                                             | 建议动作                     | 建议阈值（起点，可调）           | 说明                                                                               | 勾选 |
| ------------------------- | ------------------------------------------------ | ---------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- | ---- |
| **WAF-SEARCH**            | Path `=/api/search` 或 `starts_with /api/search` | Rate limit → 429/Block       | **每 IP ≤ 60–120 / 1 min**       | 覆盖应用 60/min；平台侧略宽于应用可减少双 429 抖动，或与应用对齐                   | ☐    |
| **WAF-PREVIEW**           | Path `starts_with /api/preview`                  | Rate limit                   | **每 IP ≤ 120–240 / 1 min**      | 防 slug 枚举刷 origin；CDN 已缓存的 GET 仍可能计平台规则（以 Vercel 产品行为为准） | ☐    |
| **WAF-CSP**               | Path `=/api/csp-report` · Method `POST`          | Rate limit                   | **每 IP ≤ 30–60 / 1 min**        | 防伪造 CSP 上报刷日志；畸形 body 应用侧已 204 丢弃                                 | ☐    |
| **WAF-API-BURST**（可选） | Path `starts_with /api/`                         | Rate limit / Bot             | **每 IP 突发上限**（如 300/min） | 兜底未列 path                                                                      | ☐    |
| **WAF-GEO/BOT**（可选）   | 异常 ASN / 已知坏 bot                            | Challenge 或 Managed ruleset | 按套餐默认                       | 不替代 path 规则                                                                   | ☐    |

**计数键：** 优先 **IP**（平台可信源）；不要用可伪造的自定义头。  
**勿**在规则里粘贴或导出 API token / 团队密钥到本仓库。

### 4.3 验证（人操作）

| #   | 步骤                                       | 通过标准                                  | 勾选 |
| --- | ------------------------------------------ | ----------------------------------------- | ---- |
| V1  | 正常站内搜索 / wikilink hover              | 200，无误 429                             | ☐    |
| V2  | 对 `/api/search` 短时超阈值压测（自有 IP） | 平台或应用返回 429；有 `Retry-After` 更佳 | ☐    |
| V3  | 对 `/api/preview/<已知 slug>` 超阈值       | 同上                                      | ☐    |
| V4  | Firewall 日志可见命中与动作                | 有 rule id / path                         | ☐    |
| V5  | 回填本表勾选日期与执行人（**无密钥**）     | 见 §6                                     | ☐    |

### 4.4 与应用内限流的叠加

```text
Client → Vercel Edge (WAF / rate limit) → CDN cache? → Node isolate (Map)
```

1. WAF 先挡明显滥用 → 保护账单与冷启动。
2. CDN 命中 → 不进 Map（search/preview GET）。
3. 进 origin 后 Map 再挡单 isolate 突发。
4. **两侧都失败或都未配置** → 仅剩另一侧；**两侧都未配硬规则** = 已知 P1 残留。

---

## 5. 运维 / 开发者速查

```bash
# 契约与边界文档
#   docs/API.md
#   docs/ops/public-api-rate-limit-boundary.md

# 实现与单测
pnpm test src/server/search/rate-limit.test.ts src/app/api/search src/app/api/preview src/app/api/csp-report
pnpm typecheck
```

本地无 `x-vercel-forwarded-for` 时全部走 `anonymous` — **不要**用本地 429 行为推断生产全局限额。

---

## 6. 人侧回填（无密钥）

| 字段          | 值                                       |
| ------------- | ---------------------------------------- |
| 确认日期      | _YYYY-MM-DD_                             |
| 确认人        | _GitHub / 姓名_                          |
| Project 名    | _Vercel project_                         |
| 已启用规则 ID | _WAF-SEARCH / …（控制台 id，无 secret）_ |
| 套餐备注      | _Hobby / Pro / … 是否含 rate limit_      |
| 残留风险      | _例如：套餐无 WAF → 仅应用内 Map_        |

---

## 7. 变更记录

| 日期       | 变更                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| 2026-07-24 | 初版：CH-CR-001/002 边界 + Vercel WAF 检查表（`ch-fix-rate-limit-docs`） |
