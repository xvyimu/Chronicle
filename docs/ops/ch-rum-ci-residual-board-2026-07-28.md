# Chronicle · RUM / mobile LH residual 下一波卡 · 2026-07-28

> **任务：** `M-CH-rum-ci` · WAVE-DEBT-LONG  
> **仓：** `xvyimu/Chronicle` · **分支：** `ch-rum-ci-residual-2026-07-28`  
> **基线 tip：** `643a898`（含 CH-PERF-010/011/012：content:verify · assertable bundle budget · RUM backfill docs）  
> **本波范围：** 可执行下一波卡（文档）+ 无密钥小改进；**不**接真 RUM 账号、**不** CSP flip、**不**大改 app 路由  
> **前置索引：** [`ch-a11y-budget-index-2026-07-26.md`](./ch-a11y-budget-index-2026-07-26.md) · [`perf-budget-2026-07.md`](./perf-budget-2026-07.md) · [`performance-baseline.md`](../performance-baseline.md)

---

## 0. 一句话结论

| 软 residual           | 现状                                                                                                | 本波                  | 下一波要人/工程                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------- |
| **Mobile Lighthouse** | 有 `lighthouse.mobile.config.js`，**不进 CI**；2026-07-17 手动 lab 基线 Perf 0.57–0.63 / LCP 7–10 s | 写成探针方案 + 优先级 | 工程可做 **warn-only 探针**；**error 阻断 deploy 仍需人闸**（基线尚未达标） |
| **RUM 数据面**        | **组件已接线**（`@vercel/speed-insights` + Analytics，`VERCEL=1` 门控）；字段 p75 **全 `pending`**  | 选项 + 人闸依赖写清   | **人账号 / 只读 token** 后回填；可选自建 beacon 仅设计                      |

> 2026-07-26 a11y 索引曾写「Speed Insights 未接入」——**已过时**。以 `src/app/layout.tsx` + `ops-readiness` + 本卡为准。

---

## 1. 现状（CI 已有 / 没有）

### 1.1 已有（硬门 · 阻断 `deploy`）

| 层      | 门                                                       | 落点                                                       | tip 备注                                            |
| ------- | -------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| quality | lint / vitest / tsc / SEO / blur / audit / format / docs | `.github/workflows/ci.yml` `quality`                       | —                                                   |
| quality | content snapshot 一致                                    | `pnpm content:verify` → rebuild → git diff                 | **643a898 CH-PERF-010**（fail-closed）              |
| quality | 静态体积                                                 | `tsx scripts/check-bundle-budget.ts`                       | **643a898 CH-PERF-011**（`evaluateBudgets` 可单测） |
| e2e     | Playwright                                               | `pnpm test:e2e`                                            | 与 LH 同 job 单次 build                             |
| e2e     | **Lighthouse desktop**                                   | `treosh/lighthouse-ci-action@v12` + `lighthouse.config.js` | 5 路由 × 2 runs · error 级 CWV/类别                 |
| deploy  | Vercel + production content smoke                        | master push only · `needs: [quality, e2e]`                 | —                                                   |

**Desktop LH 阈值（error，除非注明）：** Perf ≥ 0.80 · A11y ≥ 0.90 · BP ≥ 0.90 · SEO ≥ 0.90 · LCP ≤ 3500 ms · CLS ≤ 0.15 · TBT ≤ 300 ms · FCP ≤ 2000 ms (**warn**).

### 1.2 没有 / 软缺口

| 项                                         | 状态                     | 证据                                                                              |
| ------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------- |
| Mobile Lighthouse **CI**                   | **未接入**               | `lighthouse.mobile.config.js` 头注释 + CI 仅 `configPath: ./lighthouse.config.js` |
| Mobile 预算 **error**                      | **故意不设**             | 手动配置全 **warn**；lab 基线未达 desktop 级阈值                                  |
| 字段 RUM p75 表体                          | **pending**              | `performance-baseline.md` Baseline Log · OPS-RUM                                  |
| 自建 `web-vitals` beacon / 第三方 RUM SaaS | **未做**（也不需要先做） | 无 `web-vitals` 依赖；Vercel 路径已够个人站                                       |
| axe / pa11y 专用 a11y 脚本                 | **未设**                 | 见 a11y 索引 §1.2（本卡不展开）                                                   |

### 1.3 RUM 接线事实（纠偏）

| 层       | 事实                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------ |
| 依赖     | `package.json`: `@vercel/speed-insights` ^2 · `@vercel/analytics` ^2                                   |
| 布局     | `src/app/layout.tsx`：`shouldRenderVercelInsights` 为真时渲染 `<Analytics />` + `<SpeedInsights />`    |
| 门控     | 生产 Vercel（`VERCEL=1` 路径，见 `lib/observability`）；本地 dev **不**注入，避免污染 lab              |
| 就绪检查 | `pnpm check:ops-readiness` → track `speed-insights` = `engineering_ready_waiting_samples`              |
| 回填剧本 | `ops-deferred-work-plan.md` §5 · **CH-PERF-012** 文档前提（`performance-baseline.md`）                 |
| 缺什么   | **人**授权只读控制台 / `VERCEL_TOKEN`（**永不入 git**）+ **足够生产样本** → 六页 p75 写回 Baseline Log |

```text
代码面  ✅ 已接线（Vercel 环境）
数据面  ❌ 无 p75 数字（pending）
CI 面   ❌ 无 RUM 断言（合理：字段样本不在 PR runner）
```

---

## 2. Mobile Lighthouse 最小探针方案

### 2.1 约束（为什么还没进 CI）

1. **2026-07-17 手动 mobile lab**：Perf 0.57–0.63，LCP 7.4–10.6 s（Node 22 · 390×844×3）。
2. 报告主因倾向 **render-blocking 路由 CSS**（investigation baseline，**非**字段回归证据）。
3. Desktop 已 error 阻断；若 mobile 直接 error，**几乎必红**，会拖死 `deploy`。
4. 本机 Node 24 上 Chrome 临时 profile 可能 `EPERM`；**CI/探针必须 Node 22**。
5. 配置故意用端口 **3101**，避免与 dev `3000` 串味。

### 2.2 方案对比

| 方案                                | 做法                                                                                                                                 | CI 成本（粗）                            | 阻断 deploy？         | 适合阶段                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | --------------------- | ------------------------------------ |
| **A. 本地脚本 / package 入口**      | 已有 config；加 `pnpm lh:mobile` 包装 `npx @lhci/cli autorun --config=./lighthouse.mobile.config.js`（先 `pnpm build`）              | **0** CI 分钟                            | 否                    | **现在即可**（文档+脚本）            |
| **B. GHA workflow_dispatch / 夜间** | 独立 job 或 workflow：Node 22 · build · LH mobile · artifact `.lighthouse-mobile/` · assert **全 warn 或 `continue-on-error: true`** | ~8–15 min / 次（6 URL × 2 runs + build） | **否**（除非人 flip） | 下一波 **P1**                        |
| **C. e2e job 追加 mobile step**     | 复用 e2e 的 `.next`，再跑 mobile config（改 `startServer` 或改 URL 端口策略）                                                        | e2e **+6–12 min**（现 timeout 25m 偏紧） | 默认否；error 级危险  | 仅在 lab 稳定后                      |
| **D. error 级 mobile 门**           | 收紧 `lighthouse.mobile.config.js` 断言为 error 并接入 `needs`                                                                       | 同 B/C                                   | **是**                | **P2+**，需连续两次手动绿或 RUM 证实 |

**推荐路径：** A（本仓可立刻）→ B（无密钥、可观测）→ 仅当 mobile Perf/LCP 连续两次达 warn 上限内再谈 C/D。

### 2.3 方案 A 命令（权威）

```bash
# Node 22 · 生产 build · 与 performance-baseline「Manual Mobile Lighthouse」一致
pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build
npx @lhci/cli autorun --config=./lighthouse.mobile.config.js
# 报告：.lighthouse-mobile/ · 写入 Baseline Log 时注明日期与 Node
```

可选 npm 脚本（无新依赖）：`lh:mobile` → 上述 autorun（**不**自动 build，避免误触长构建；README/本卡写清先 build）。

### 2.4 方案 B 最小 GHA 草图（下一波实现卡 · 不在本波合入）

```yaml
# 伪代码 · 独立 workflow 或 ci.yml job
mobile-lh:
  if: github.event_name == 'workflow_dispatch' || github.event.schedule
  runs-on: ubuntu-latest
  timeout-minutes: 30
  steps:
    - uses: actions/checkout@…
    - pnpm + node 22 + install
    - run: pnpm build
    - uses: treosh/lighthouse-ci-action@v12
      with:
        configPath: ./lighthouse.mobile.config.js
        uploadArtifacts: true
      continue-on-error: true # 探针期：红不挡合并
```

**成本注意：**

- 不要默认挂每个 PR（分钟费 + flaky）。
- 6 URL × 2 runs ≈ 12 LH 采集；共享 build 比再起 job 更省。
- artifact 保留 14d 足够对照。

### 2.5 探针验收（下一波 DONE 定义）

| 级别       | 定义                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| 探针绿     | workflow 能跑完、artifact 上传、warn 列表可 diff                                                      |
| 基线更新   | 同一 Node 22 路径下两次结果写入 `performance-baseline.md`                                             |
| 可谈 error | 核心 5 路由（可不含 `/links`）Perf ≥ 0.65 **且** LCP 中位 ≤ 4500 ms **连续两次**，再开 ADR 是否 error |

---

## 3. RUM 数据面选项 + 人闸

### 3.1 选项矩阵

| 选项                                          | 说明                                                        | 密钥/人闸                                                      | CSP 影响                                              | 推荐                       |
| --------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- | -------------------------- |
| **R1. Vercel Speed Insights（现状）**         | 已依赖 + layout 门控；Dashboard / `vercel metrics …` 读 p75 | **人** Vercel 只读 + 可选 `VERCEL_TOKEN`（环境，**不进 git**） | 官方脚本；生产已接受 Analytics/SI 路径                | **默认 · P0 回填**         |
| **R2. 仅 Dashboard 手抄**                     | 无 CLI token；人打开控制台抄六页                            | 人登录                                                         | 无新增                                                | 样本少时够用               |
| **R3. 自建 `web-vitals` → `/api/rum` beacon** | 自管 p75；要存存储（KV/日志）与采样                         | 可能需新 endpoint + 限流；**扩展面**                           | 可能动 `connect-src`（**红线：不放宽 CSP 除非 ADR**） | **不优先**；个人站过重     |
| **R4. 第三方（Sentry/GA/Datadog RUM）**       | 完整会话回放等                                              | 第三方账号 + DSN                                               | 几乎必扩 CSP / 隐私面                                 | **明确不做**（半年红线内） |

### 3.2 人闸清单（R1/R2 · 与 CH-PERF-012 对齐）

全部满足才允许把 `pending` 改成数字：

1. 操作者自己的环境有只读 Vercel 会话或 `VERCEL_TOKEN`（**禁止**写入仓库、issue、agent 日志）。
2. 生产有意义样本：先查 `*_count`，低 count **不**当回归。
3. 六页路径与 baseline 表一致：`/` · `/blog` · `/blog/nextjs-app-router` · `/projects` · `/about` · `/links`。
4. 记录查询窗口（如 `7d`）与日期；**禁止**用 Lighthouse lab 代填 p75。
5. 若 p75 超调查阈值（LCP > 3s / INP > 300ms / CLS > 0.1）→ **开性能 issue**，不在本卡改架构。

### 3.3 建议查询（人闸后）

```bash
# 项目名以 Vercel 控制台为准；示例沿用 baseline 文档
vercel metrics vercel.speed_insights.lcp_count --aggregation sum --group-by route --since 7d --project <name> --prod
vercel metrics vercel.speed_insights.lcp_ms --aggregation p75 --group-by route --since 7d --project <name> --prod
vercel metrics vercel.speed_insights.inp_ms --aggregation p75 --group-by route --since 7d --project <name> --prod
vercel metrics vercel.speed_insights.cls --aggregation p75 --group-by route --since 7d --project <name> --prod
```

### 3.4 自建 beacon 仅设计要点（若未来否决 R1）

- 客户端：`web-vitals` onINP/LCP/CLS → `sendBeacon('/api/rum')`。
- 服务端：采样 + 丢弃 bot + **无 PII**；存储可选 Vercel KV / 日志 drain。
- **必须**先 ADR：CSP `connect-src`、保留期、与 Speed Insights 是否双计。
- 本卡 **不实现**。

---

## 4. P0 / P1 / P2 排序（可执行下一波卡）

### P0 — 人闸 / 低工程 · 最高信息增益

| ID              | 卡                           | 类型                                  | 依赖                             | 预估              | DONE                                                                      |
| --------------- | ---------------------------- | ------------------------------------- | -------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| **CH-RUM-P0-1** | Speed Insights 六页 p75 回填 | **人** + 文档                         | Vercel 只读 / token · 足够 count | 0.5–1 h（有样本） | Baseline Log 有日期行；OPS-RUM 不再纯 pending；`ops-deferred` B2 勾选说明 |
| **CH-RUM-P0-2** | 确认生产 script 痕迹         | 人 或 `check:ops-readiness -- --live` | 公网                             | 15 min            | live hint 或 Dashboard 可见 SI                                            |

### P1 — 工程探针 · 无密钥

| ID             | 卡                                                                               | 类型      | 依赖           | 预估   | DONE                                 |
| -------------- | -------------------------------------------------------------------------------- | --------- | -------------- | ------ | ------------------------------------ |
| **CH-LH-P1-1** | `pnpm lh:mobile` 脚本 + AGENTS/baseline 一行指针                                 | 工程小    | 无             | 15 min | script 存在；本卡 §2.3 可复制        |
| **CH-LH-P1-2** | GHA `workflow_dispatch`（或 weekly）mobile LH · **continue-on-error** · artifact | 工程      | Node 22 runner | 1–2 h  | 手动触发绿跑；PR 默认不跑            |
| **CH-LH-P1-3** | 刷新 mobile lab 基线（Node 22 · 两次）                                           | 工程/本地 | build 时间     | 1 h    | baseline 表更新日期；对比 2026-07-17 |

### P2 — 条件触发 · 需证据或人闸

| ID               | 卡                                        | 触发条件                                       | 不做除非                        |
| ---------------- | ----------------------------------------- | ---------------------------------------------- | ------------------------------- |
| **CH-LH-P2-1**   | mobile 断言部分 error（如 a11y/SEO only） | P1 探针稳定                                    | a11y/SEO 连续绿且团队接受 flaky |
| **CH-LH-P2-2**   | mobile Perf/LCP error 进 `e2e` needs      | lab 达 §2.5「可谈 error」**或** RUM 证明移动差 | 人明确接受 deploy 风险          |
| **CH-RUM-P2-1**  | 自建 beacon / 第三方 RUM                  | Vercel SI 不可用或合规要求                     | ADR + CSP 评审                  |
| **CH-A11Y-P2-*** | axe Playwright                            | 与本 residual 正交                             | 见 a11y 索引 §1.3               |

### 明确不做（本 residual 生命周期）

| 项                                    | 原因              |
| ------------------------------------- | ----------------- |
| 放宽 CSP / `unsafe-inline` 换 LCP     | 栈红线            |
| Agent 代登 Vercel / 把 token 写入 git | 安全纪律          |
| 用 desktop/mobile **lab** 填 p75      | CH-PERF-012       |
| 每个 PR 强制 mobile error             | 基线未达标        |
| 换栈 / 花园大重构换 Perf              | 半年 backlog 另卡 |

---

## 5. 本波已做的无密钥小改进

| 项                               | 路径                                              |
| -------------------------------- | ------------------------------------------------- |
| 本 residual board                | `docs/ops/ch-rum-ci-residual-board-2026-07-28.md` |
| a11y 索引 RUM 纠偏 + 链到本卡    | `docs/ops/ch-a11y-budget-index-2026-07-26.md`     |
| perf 文档索引链                  | `docs/ops/ch-perf-doc-index-2026-07-26.md`        |
| ops checklist OPS-RUM 指针       | `docs/ops/ops-checklist-2026-07.md`               |
| `lh:mobile` 脚本（不自动 build） | `package.json`                                    |
| bundle budget 头注释链 residual  | `scripts/check-bundle-budget.ts`                  |

---

## 6. 验证（本波）

```bash
pnpm test          # vitest 全量 · 期望 exit 0
pnpm check:docs    # 若改了 md 链 · 期望 exit 0
# 不跑 mobile LH 全量（耗时 / 非本波必达）
```

---

## 7. 相关文档

| 文档                                                                         | 用途                      |
| ---------------------------------------------------------------------------- | ------------------------- |
| [`ch-a11y-budget-index-2026-07-26.md`](./ch-a11y-budget-index-2026-07-26.md) | a11y / LH / RUM / CI 索引 |
| [`perf-budget-2026-07.md`](./perf-budget-2026-07.md)                         | 路由预算 SSOT             |
| [`../performance-baseline.md`](../performance-baseline.md)                   | lab 历史 + RUM 回填前提   |
| [`../ops-deferred-work-plan.md`](../ops-deferred-work-plan.md)               | B2 Speed Insights 剧本    |
| [`ops-checklist-2026-07.md`](./ops-checklist-2026-07.md)                     | OPS-RUM 状态              |
| `lighthouse.config.js` / `lighthouse.mobile.config.js`                       | CI vs 手动                |
| `.github/workflows/ci.yml`                                                   | quality / e2e / deploy    |

---

## 8. 变更记录

| 日期       | 变更                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| 2026-07-28 | 首版：CI 现状、mobile 探针 A/B/C/D、RUM R1–R4、P0/P1/P2 卡；纠偏 SI 已接线 |
