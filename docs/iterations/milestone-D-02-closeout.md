# Milestone D-02 · 合并后收尾

> 阶段：2026-10-08 ~ 2026-10-10 · 状态：**Completed（历史里程碑）**
> 证据基准：`d87050b` → `0efc7c8`
> 关联：[D-01](./milestone-D-01-workspace-rebuild.md) · 后续 [D-03](./milestone-D-03-merge-cleanup.md)

---

## 1. 目标

工作台重构合并后，处置 2026-10-07 审计（`docs/16-audit-and-optimization-plan-2026-10-07.md`）的 P0/P1 项：修深色对比度、补测试、补点击区、修 R12 CLS、清死 CSS；改造 CI `post-deploy`；补运行时可观测性盲区；精简作品集。

## 2. 关键提交

| 日期       | commit    | 做了什么                                                                          |
| ---------- | --------- | --------------------------------------------------------------------------------- |
| 2026-10-07 | `736e601` | `fix(a11y): 对比度达标 + 移动端点击区 + 页面测试，并回填 SSOT 与 R12`（PR #39）   |
| 2026-10-08 | `d87050b` | `refactor(css): 删 43 个死类 + 一次性脚本清理`（PR #40）                          |
| 2026-10-09 | `d8c2ff8` | `ci(post-deploy): 替换无效 vercel deploy + bundle budget v2 + 文档回填`（PR #41） |
| 2026-10-09 | `fb1bd15` | `ci(uptime): GitHub Actions cron 每 10 分钟探活`（PR #42）                        |
| 2026-10-09 | `81bd1b0` | `fix(ci): 探活双链 + WAF 403 降级，修 master post-deploy 全红`（PR #44）          |
| 2026-10-09 | `1265b39` | `feat(uptime): Cloudflare Worker Cron Trigger 替代 GH Actions schedule`（PR #47） |
| 2026-10-09 | `05d889c` | `feat(obs): 客户端错误边界上报，补运行时盲区`（PR #45）                           |
| 2026-10-10 | `1bd250e` | `refactor: 探活整体退役，删 uptime workflow 与 Worker`（PR #49）                  |
| 2026-10-10 | `0efc7c8` | `refactor(portfolio): 作品集精简到 1 条，旧 id 加 307 重定向`（PR #50）           |

## 3. 实现步骤

### 3.1 a11y 对比度 + 点击区 + R12（`736e601`）

- `tokens.css`：深色 `--text-dim` `#7d7d86` → `#90909a`；浅色 `--brand` `#4f6bed` → `#3f58dd`。
- `prose.css`：`.code-block-header` 补深色底（浅色模式对比度 1.022 不可见）。
- 点击区 32/36px → 40px：`home.css` / `blog-ui.css` / `reading.css` / `Pagination.tsx`。
- `SearchPanel.tsx`：补 combobox/listbox ARIA。
- **R12 修复**：`blog/[slug]/loading.tsx` 加 `minHeight: '100vh'`。

实测对比度：深色 `--text-dim` 新值 5.603/5.195/4.711（原 4.345/4.028/3.652）；浅色 `--brand` 4.319→5.510；代码块 header 5.126/5.416。

> **关键教训**：路由 CSS chunk 加载顺序在全局 `responsive.css` **之后**，覆盖必须写在所属路由 CSS。把 `.ws-topics__item` 的点击区写进 `responsive.css` 时仍是 32px。

### 3.2 清 43 个死类（`d87050b`）

`src/app/styles/` 下 6 个 CSS 文件净删 737 行：`animations.css`（`.reveal-on-scroll`）、`article-ui.css`（`.article-backlinks*` + `.article-neighbors*`）、`components.css`（`.cards--2` + `.hero*` + `.stat-pill*`）、`controls.css`（`.pagination*`）、`prose.css`（`.code-line--highlighted` + `.wikilink*`）、`responsive.css`（hero/cards--2 死引用）。删 `scripts/_apply-content-seo-p9.mjs`。

> 每死类经精确扫描 + 人工三重验证，**排除 2 个假阳性**（`copy-btn--copied/failed` 由 `copy-btn--\` 动态生成）。

### 3.3 CI post-deploy 改造 + bundle budget v2（`d8c2ff8`）

- 原 `npx vercel@56.2.1 deploy --prod` 因 `VERCEL_TOKEN` 无效**自建仓起从未成功过**（15 次全红），且与 Vercel Git 集成重复 → 移除。
- 新 `post-deploy` 查 GitHub Deployments API 确认本 commit 的 Production 部署 `state=success`。
- bundle budget v2：读 `page_client-reference-manifest.js` 算**每路由** JS+CSS 并集，上限 `ROUTE_BUDGET_KB = 285`。

### 3.4 探活上线又退役（`fb1bd15` ~ `1bd250e`）

完整链条：

1. `fb1bd15` GH Actions cron 探活 —— 合入 master 后**从未触发**（GitHub 平台侧已知问题，推 resync commit #46 仍 0 触发）。
2. `81bd1b0` 探活双链 + WAF 403 降级：CI runner 是 datacenter IP，被 Cloudflare Bot Fight Mode 拦（`ruleId=bot_fight_mode`）。Free plan 的 BFM 不在 Ruleset Engine 上，WAF skip 规则豁免不了。
3. `1265b39` 换 Cloudflare Worker Cron Trigger（跑在 CF 自己机器，同 zone 子请求默认绕过 BFM）。
4. `1bd250e` 按用户指示「不用探活」**整体退役**：删 `.github/workflows/uptime.yml`、`scripts/probe-health.ts`、`workers/uptime/`。

> **诚实记账**（`docs/14-decision-log.md` D-042）：删除后**没有任何自动化在监控站点持续可用性**——站点若在两次部署之间挂掉不会被自动发现。有意接受的取舍，不是遗漏。

### 3.5 客户端错误上报（`05d889c`）

- 新增 `src/app/api/client-error/route.ts`（collect-only，8 KiB 上限，限流 20 次/60s，**不落库不外发不回显**）。
- 新增 `src/lib/error-report.ts`（`sendBeacon` 优先，仅生产环境发送，只发 pathname 丢弃查询串）。
- `src/app/error.tsx` 加 `reportError(error)`。

> 盲区明写：只覆盖客户端错误边界，服务端渲染错误/Route Handler 异常不经这里，也**没有聚合与告警**。不用 Sentry 的理由：会把用户错误消息与堆栈发给第三方、需加 CSP 白名单、引入常驻依赖。

### 3.6 作品集精简（`0efc7c8`）

`data/projects.json` 6 → 1（只留 `chronicle`）；删 5 张无主封面图；`next.config.ts` 加 `redirects()`（5 个旧 id **307** 到 `/projects`）。

> **为什么 307 而非 308**（D-043）：内容整理不是永久搬家，旧 id 以后可能被重新占用，308 会被浏览器/搜索引擎长期缓存钉死。

## 4. 涉及文件

**新增**：`src/app/api/client-error/route.ts` · `src/lib/error-report.ts` · `scripts/wait-for-deployment.ts`
**删除**：`.github/workflows/uptime.yml` · `scripts/probe-health.ts` · `workers/uptime/` · `scripts/_apply-content-seo-p9.mjs` · 5 张项目封面图
**修改**：`src/app/styles/*`（6 个 CSS）· `tokens.css` · `prose.css` · `SearchPanel.tsx` · `blog/[slug]/loading.tsx` · `next.config.ts` · `.github/workflows/ci.yml` · `scripts/check-bundle-budget.ts` · `data/projects.json` · `src/lib/image-blur-map.ts`

## 5. 数据或接口变化

- **新增 API**：`POST /api/client-error`（collect-only）。
- `data/projects.json`：6 → 1 条。
- `next.config.ts`：新增 5 条 307 重定向。

## 6. 验收结果

| 提交      | 命令/指标         | 结果                                                                  | 出处                      |
| --------- | ----------------- | --------------------------------------------------------------------- | ------------------------- |
| `d87050b` | `pnpm test`       | 75 files / 564 tests, exit 0                                          | commit body               |
| `d8c2ff8` | `pnpm test`       | 76 files / 588 tests, exit 0                                          | commit body               |
| `05d889c` | `pnpm test`       | 79 files / 629 tests, exit 0                                          | commit body               |
| `1bd250e` | `pnpm test`       | 78 files / 616 tests, exit 0（退役净删 875 行）                       | commit body               |
| `0efc7c8` | `pnpm test`       | 78 files / 628 tests, exit 0                                          | commit body               |
| `0efc7c8` | `pnpm build`      | 103/103 静态页, exit 0                                                | commit body               |
| `0efc7c8` | `pnpm test:e2e`   | 45 passed / 1 skipped, exit 0                                         | commit body               |
| `0efc7c8` | 本机 `next start` | 5 个旧 id 全 307 → `/projects`；`chronicle` 200；sitemap 旧 id 命中 0 | commit body               |
| `736e601` | CI e2e Lighthouse | run `37646463020` 首次通过（R12 闭环）                                | GitHub API 实查（见下注） |

> **2026-10-14 订正**：原写 run `37751354760` 有误。该 run 的 head 是**下一个** commit `d87050b`（2026-10-08），不是 R12 修法提交 `736e601`。`736e601` 自己的 run 是 `37646463020`（2026-10-07），其 `e2e` job（含 `Run Lighthouse CI audit` 步骤）`success`、日志 `All results processed!` 无 `✘`——**这才是「首次通过」**。原 ID 系从 `13-risk-register.md:39` 抄录未独立核验，该处已同步订正。另注：两个 run 的**整体** conclusion 均为 `failure`，因 `deploy` job（当时那个从未成功过的 `vercel deploy`）失败；「Lighthouse 通过」仅指 `e2e` job。

**未验**：`d87050b` 未跑 `pnpm build`（需 `NEXT_PUBLIC_SITE_URL`）、未做 Lighthouse 视觉回归。

## 7. 遗留问题

- **R16 降级门叠加**：`post-deploy` 的 fail-open 降级同时命中时，产线健康实际无人验证（后于 D-03 部分处置）。
- **`check:production-content` 对 WAF 403 降级为 warn+exit 0**（D-039）：那一刻起「部署后内容正确性」未被验证，只验证了可达性。
- **探活退役后无持续可用性监控**（D-042）：有意取舍。

## 8. 与今日的差异

| 项          | 本阶段（2026-10-10） | 今日（2026-10-14） |
| ----------- | -------------------- | ------------------ |
| 探活        | 已退役               | 无（有意取舍）     |
| 作品集      | 1 条 + 307 重定向    | 沿用               |
| 错误上报    | `/api/client-error`  | 沿用               |
| bundle 预算 | +每路由 ≤285 KB      | 沿用               |
| CI `deploy` | 改 `post-deploy`     | 沿用               |
