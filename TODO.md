# 西江月博客 · 当前待办

> 状态：**工程侧可无条件推进的事项已关闭**；仅剩外部账号或条件触发。  
> 更新：2026-07-22（master **`3111acc`** + 生产 SRI 启用 · package `chronicle`）  
> 生产：`https://incca.ccwu.cc`  
> 手册：[ops-deferred-work-plan.md](./docs/ops-deferred-work-plan.md)  
> 自动检查：`pnpm check:ops-readiness`（可选 `-- --live`）  
> 基线文档：[docs/launch-baseline.md](./docs/launch-baseline.md) · [docs/handoff-to-agent.md](./docs/handoff-to-agent.md)

## 外部依赖（需真人账号；Agent 已穷尽自动路径）

- [ ] **Google Search Console**  
      域名资源 `incca.ccwu.cc` + DNS TXT + 提交 `https://incca.ccwu.cc/sitemap.xml`。  
      阻塞：无 Google 登录会话 / 无 GSC 服务账号 / CF DNS 无写权限。  
      状态：`blocked_auth` · 剧本 §3 / §10。
- [ ] **Bing Webmaster**  
      GSC 验证后**导入**，不重复 DNS。状态：`blocked_auth` · §4。
- [ ] **Vercel Speed Insights p75**  
      工程：`hasData=true`；CLI **无法**导出明细。控制台只读六页或正式 metrics API。  
      **禁止** Lighthouse 代填。状态：`engineering_ready_waiting_samples` · §5。

## 条件触发（未到门槛 = 正确终态，不是欠账）

- [ ] **外部搜索评估**：≥200 文或搜索 p95 证据 → ADR；当前 20 文 Fuse。
- [ ] **正文图 LQIP**：`public/images/blog/**` 有图 → `pnpm gen:blur && pnpm check:blur`。
- [ ] **prose/article-ui 下沉**：Coverage + 层叠方案 + ADR。
- [ ] **Cache Components**：外部数据/ISR/失效需求 + 迁移指南。
- [x] **SRI 生产启用**（2026-07-22）：Production+Preview `ENABLE_SRI=1`；生产 HTML 含 `integrity="sha384-…"`；CSP nonce 保留。回滚：去掉 Production env 并 redeploy。
- [x] **Giscus 生产 env**（2026-07-22）：Vercel 从 `xvyimu/blog` → `xvyimu/Chronicle` + repoId/categoryId；生产 chunk 含 `xvyimu/Chronicle` / `R_kgDOTBAmxA`。
- [ ] **G2 / T7 余量**：Worker · 径向/时间线 · 导出 PNG/SVG（兴奋型，非阻塞；预坐标 seed 已接线）。

## 已完成索引（近期）

| 范围              | 结果                                                       | 证据                   |
| ----------------- | ---------------------------------------------------------- | ---------------------- |
| T1 preview 契约   | a11y popover + `error`+`code` + 120/60s 限流               | PR#14                  |
| T2 content 快照   | `generated/content-snapshot/` · `CONTENT_BACKEND=snapshot` | PR#14                  |
| 软脱离身份        | npm `chronicle` · 无 former-name 叙事                      | PR#16 · `5c629e7`      |
| T3 CSP 上报 + SRI | collect-only `/api/csp-report` · 门控后生产已开 SRI        | PR#15 · 2026-07-22 env |
| 文档 hygiene      | archive 历史报告 · 基线刷新 · format:docs 覆盖             | PR#17 · `6b4937b`      |
| 数字花园 G0–G3    | wikilink / 反链 / `/garden` / popover                      | 已合 master            |
| 逻辑前后端分层    | `src/server` + 边界测试                                    | 历史 run               |
| 延后运营工程化    | 就绪门禁 + 手册                                            | 历史 run               |

更早 P0–P10 与日期型审查见 `docs/archive/`、`docs/superpowers/runs/`，不在此重复。

## 接手规则

1. 先 `pnpm check:ops-readiness`（必要时 `-- --live`）。
2. 状态为 `blocked_auth` / `not_triggered` / `engineering_ready_waiting_samples` → **不要**开无关重构。
3. 用户完成 GSC/Bing/RUM 后，只更新基线文档中的 pending 行。
4. 若希望 Agent 代写 DNS TXT：提供 Cloudflare `Zone.DNS Edit` token（环境变量，勿入库）。
5. 用户说「你自己看着做 / 我不会」时：穷尽自动路径到硬阻塞并写清，**禁止**甩回逐步人工操作清单代替执行。
