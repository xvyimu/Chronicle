# Chronicle · 运营清单 · 2026-07（W4 收口）

> 组合包：`portfolio-arch-upgrade-2026h2` · 波次 **W3 刷新 · W4 收口**  
> 刷新日：2026-07-23 · 分支 `xvyimu/w4-ch-claude` · tip `e256f5a`  
> 详细剧本：[`docs/ops-deferred-work-plan.md`](../ops-deferred-work-plan.md) · 侧线盘点：[`L2-hygiene-checklist.md`](./L2-hygiene-checklist.md) · P0 板：[`L2-P0-action-board-2026-07-22.md`](./L2-P0-action-board-2026-07-22.md)  
> 性能预算：[`perf-budget-2026-07.md`](./perf-budget-2026-07.md) · 栈终态：[`stack-matrix-2026-07.md`](./stack-matrix-2026-07.md)

**原则：** 不伪造流量、不代登 Google/Bing、不提前上 Meili/ES。Agent 只维护就绪门禁与状态表。

## 1. 状态总表（W4）

| ID           | 项                                                              | 状态                              | Owner         | 入口                                                          | **W4**        |
| ------------ | --------------------------------------------------------------- | --------------------------------- | ------------- | ------------------------------------------------------------- | ------------- |
| OPS-GSC      | Google Search Console：域名 `incca.ccwu.cc` + DNS TXT + sitemap | **`blocked_auth`**（需人账号）    | 用户          | ops-deferred §3                                               | 下半年 B1     |
| OPS-Bing     | Bing Webmaster 从 GSC 导入                                      | **`blocked_auth`**（接在 GSC 后） | 用户          | ops-deferred §4                                               | 下半年 B1     |
| OPS-SEO-LIVE | 生产 sitemap/robots/home 公开面                                 | 工程门禁已就绪；发版后跑 live     | CI + 本地     | `pnpm check:ops-readiness -- --live`                          | 维持          |
| OPS-RUM      | Speed Insights 六页 p75 回填                                    | **`pending`** 样本 / 只读 token   | 用户（可选）  | performance-baseline · ops-deferred §5 · **perf-budget §2.3** | 下半年 B2     |
| OPS-AUDIT    | `pnpm audit --audit-level=high`                                 | 每波复跑 · 目标 high=0            | CI + 本地     | npmjs registry                                                | **W4 已验证** |
| OPS-SRI      | SRI 单元 + offline 门闩                                         | 每波复跑                          | CI + 本地     | `test:sri` · `check:sri-smoke`                                | **W4 已验证** |
| OPS-PROD     | 生产内容 + 安全头冒烟                                           | 有网时                            | 本地 / deploy | `check:production-content`                                    | 维持          |
| OPS-PERF     | 性能预算表                                                      | **W3 落盘 · W4 复验勾选**         | 文档          | [`perf-budget-2026-07.md`](./perf-budget-2026-07.md)          | **已验证**    |

## 2. GSC / Bing（仅人）

| 步骤                                     | 谁做             | Agent 可做                              |
| ---------------------------------------- | ---------------- | --------------------------------------- |
| 添加域名属性 `incca.ccwu.cc`             | 用户 Google 账号 | **否**（禁代登）                        |
| DNS TXT 验证                             | 用户 DNS 控制台  | **否**                                  |
| 提交 `https://incca.ccwu.cc/sitemap.xml` | 用户 GSC UI      | 可预跑 `check:seo` / live 就绪          |
| Bing 从 GSC 导入                         | 用户             | **否**                                  |
| 回填 launch-baseline GSC 行              | 用户确认后文档   | 可代写**状态字符串**（无 cookie/token） |

验证成功后建议记录（**不入库密钥**）：验证日期 · sitemap 状态 · 截图位置（用户自有盘）。

## 3. 工程可自动（发版 / 波次）

```bash
# 依赖 high
pnpm audit --registry=https://registry.npmjs.org --audit-level=high

# SRI
pnpm test:sri
pnpm check:sri-smoke

# 运维就绪（本地不变量）
pnpm check:ops-readiness

# 有网：公开 SEO 面 + 可选生产内容
pnpm check:ops-readiness -- --live
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

## 4. 明确不做

| 项                       | 原因        |
| ------------------------ | ----------- |
| Agent 登录 GSC/Bing      | 账号边界    |
| 用 Lighthouse 数字填 p75 | 字段纪律    |
| Garden 大重构 / 换栈     | 红线 + 题单 |
| 伪造「已提交 sitemap」   | 证据诚实    |

## 5. 变更记录

| 日期       | 变更                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| 2026-07-23 | W3 刷新：状态总表 + GSC 仍人账号；链到 perf-budget（`w3-ch-claude`）                      |
| 2026-07-23 | **W4 收口**：OPS-SRI/AUDIT/PERF 标已验证；GSC/Bing/RUM → 下半年 backlog（`w4-ch-claude`） |
