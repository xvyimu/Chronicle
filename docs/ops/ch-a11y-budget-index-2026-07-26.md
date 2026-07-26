# Chronicle · 无障碍 / Lighthouse 预算 / RUM 索引 · 2026-07-26

> **波次：** `ch-opt-a11y-budget-doc`（WAVE-2）  
> **仓：** `xvyimu/Chronicle` · **base:** `master` tip `1f52af9`  
> **前置：** 首波 `ch-opt-perf-residual` 改 app 代码；本波**完全不重叠路径**，仅文档索引。

---

## 1. 无障碍（a11y）

### 1.1 现有门禁

| 项 | 内容 |
|---|---|
| 自动化门禁 | Lighthouse CI `categories:accessibility` ≥ **0.90**（error 级阻断） |
| 配置位置 | `lighthouse.config.js` `assert.assertions` |
| 运行时机 | CI `e2e` job（`treosh/lighthouse-ci-action@v12`） |
| 覆盖路由 | `/`、`/blog`、`/blog/nextjs-app-router`、`/projects`、`/about` |
| 运行次数 | 2 runs 取中位数（desktop preset） |
| CI 失败行为 | **error** — 阻断 `e2e` job，进而阻断 `deploy`（`needs: [quality, e2e]`） |

### 1.2 未覆盖

| 项 | 原因 |
|---|---|
| 专用 a11y smoke 脚本（axe/pa11y） | **未设** — 本仓无 axe-core、pa11y 或自定义 a11y 测试脚本 |
| 单元 a11y 测试（vitest + axe） | 未接入 |
| Playwright a11y 断言 | 未接入（`e2e/` 仅功能测试） |
| Mobile a11y CI 门禁 | 未设 — `lighthouse.mobile.config.js` 仅手动运行，`accessibility` 为 warn 级 |
| 键盘导航 / focus 管理 / 对比度专项测试 | 未覆盖 |
| 手动 a11y 审查报告 | 未产出 |

### 1.3 建议

如本半年追加 a11y 投入，建议初值：

```text
- axe-core 集成：Playwright + axe-playwright（或 @axe-core/playwright），
  覆盖关键路由（/、/blog、/blog/[slug]），warn 级起步
- 目标：Lighthouse desktop a11y ≥ 0.95（从 0.90 收紧）
- 新增 a11y 专用脚本：pnpm test:a11y（axe e2e 或 HTML 离线扫描）
```

---

## 2. Lighthouse 预算

### 2.1 配置文件

| 文件 | 角色 | CI 接入 |
|---|---|---|
| `lighthouse.config.js` | **Desktop CI** 权威 — 5 路由 × 2 runs | ✅ `e2e` job `treosh/lighthouse-ci-action@v12` |
| `lighthouse.mobile.config.js` | Mobile 手动基线 — 6 路由 × 2 runs | ❌ 仅手动 |
| `scripts/check-bundle-budget.ts` | 静态体积预算 | ✅ `quality` job |

### 2.2 CWV 目标（Desktop CI · error 级）

| 指标 | 阈值 | 类型 | 备注 |
|---|---|---|---|
| **LCP** | ≤ 3500 ms | error | 5 核心路由统一 |
| **CLS** | ≤ 0.15 | error | Lab 宽松阈值；field 目标仍 0.1 |
| **TBT** | ≤ 300 ms | error | SSG 站通常 < 50 ms |
| FCP | ≤ 2000 ms | warn | 仅警告，不阻断 |

### 2.3 类别分数目标（Desktop CI）

| 类别 | 阈值 | 类型 |
|---|---|---|
| Performance | ≥ 0.80 | error |
| Accessibility | ≥ 0.90 | error |
| Best Practices | ≥ 0.90 | error |
| SEO | ≥ 0.90 | error |

### 2.4 静态体积预算

| 预算项 | 阈值 | 执行入口 |
|---|---|---|
| 单 JS chunk | ≤ 300 KB | `check-bundle-budget.ts` |
| 单 CSS bundle | ≤ 300 KB | 同上（含 Shiki 主题） |
| JS+CSS 合计（不含字体） | ≤ 2 MB | 同上 |
| 图片 | 优先 `next/image` + blur 覆盖 | `check:blur` |

### 2.5 未设

| 项 | 现状 |
|---|---|
| `lighthouse-budget.json` | **不存在** — 预算全部内联于 `lighthouse.config.js` 断言 |
| `lighthouserc.*` | 不存在 — 仅 `.config.js` 文件 |
| 路由级差异化预算 | 5 核心路由共享同一阈值 |
| Mobile CI 预算 | 未设 — mobile 仅手动观察 |

### 2.6 建议初值

如未来需要 `lighthouse-budget.json` 补全性能预算文件，建议初值：

```json
{
  "options": { "budgets": {} },
  "budgets": [
    {
      "path": "/*",
      "resourceCounts": [
        { "resourceType": "total", "budget": 50 },
        { "resourceType": "script", "budget": 20 },
        { "resourceType": "stylesheet", "budget": 5 }
      ],
      "resourceSizes": [
        { "resourceType": "total", "budget": 3000 },
        { "resourceType": "script", "budget": 500 },
        { "resourceType": "stylesheet", "budget": 200 },
        { "resourceType": "image", "budget": 1500 },
        { "resourceType": "font", "budget": 200 }
      ],
      "timings": [
        { "metric": "largest-contentful-paint", "budget": 3500 },
        { "metric": "cumulative-layout-shift", "budget": 0.15 },
        { "metric": "max-potential-fid", "budget": 300 }
      ]
    }
  ]
}
```

---

## 3. RUM（真实用户监控）

### 3.1 现状

| 项 | 状态 |
|---|---|
| **web-vitals** 库（`navigator.webdriver` API） | **未接入** — 源码 `src/` 中无 `web-vitals` 引用 |
| **Vercel Speed Insights** | **未接入** — 仓内无 `@vercel/speed-insights` 包引用 |
| **Sentry / GA / 第三方 RUM** | **未接入** |
| 字段（p75）回填 | **pending** — 需人账号 / VERCEL_TOKEN（见 `ops-deferred-work-plan.md` B2） |
| 状态文档 | `perf-budget-2026-07.md` §2.3 明确标记 `pending` |

### 3.2 数据面定义

本仓无 RUM 数据收集路径。字段（p75）目标仅在 `perf-budget-2026-07.md` 中定义：

| 指标 | Good (p75) | 调查阈值 |
|---|---|---|
| LCP | ≤ 2.5 s | p75 > 3.0 s |
| INP | ≤ 200 ms | p75 > 300 ms |
| CLS | ≤ 0.1 | p75 > 0.1 |

### 3.3 建议接入路径

```text
1. Vercel Dashboard → Speed Insights（一键开启，零代码）
   或：pnpm add @vercel/speed-insights + <SpeedInsights /> 布局注入
2. 等待样本积累（~1 周生产流量后 p75 可用）
3. 回填至 performance-baseline.md + perf-budget-2026-07.md §2.3
```

---

## 4. Budget 与 CI 对齐

### 4.1 CI 质量门（`.github/workflows/ci.yml`）

| Job | 门禁项 | 失败行为 | 性质 |
|---|---|---|---|
| `quality` | `pnpm audit` | 阻断 `deploy` | error |
| | `pnpm format:check` | 阻断 | error |
| | `pnpm format:docs:check` | 阻断 | error |
| | `pnpm check:docs` | 阻断 | error |
| | `pnpm lint` | 阻断 | error |
| | `pnpm test`（vitest） | 阻断 | error |
| | `pnpm exec tsc --noEmit` | 阻断 | error |
| | `pnpm check:seo` | 阻断 | error |
| | `pnpm check:blur` | 阻断 | error |
| | `pnpm build` | 阻断 | error |
| | RSS / content snapshot 一致性 | 阻断 | error |
| | `check-bundle-budget.ts` | 阻断 | error |
| `e2e` | `pnpm test:e2e`（Playwright） | 阻断 `deploy` | error |
| | **Lighthouse CI**（desktop） | 阻断 `deploy` | error |
| `deploy` | Vercel deploy | 生产 | — |
| | `check:production-content` | 生产后校验 | — |

### 4.2 软失败 / 非阻断

| 项 | 所在 | 原因 |
|---|---|---|
| Lighthouse FCP（warn） | `lighthouse.config.js` | 非 CWV，仅观察 |
| Lighthouse mobile 全类别 | `lighthouse.mobile.config.js` | 手动基线，不进入 CI |
| `errors-in-console` | `lighthouse.config.js` | `error` 级（但 LH 自身不常捕获） |
| `valid-source-maps` | `lighthouse.config.js` | `warn` 级 |
| `crawlable-anchors` | `lighthouse.config.js` | `warn` 级 |
| RUM p75 回填 | 无代码 | 等样本 / 人账号 |

### 4.3 结论

- **所有 budget 门禁均硬性阻断** `deploy`（Lighthouse desktop 分数/CWV + bundle 体积 + 编译/类型/lint 检查）
- 无 CI 软性 budget（所有门禁 exit non-zero 即阻止合并）
- 唯一软性缺口：mobile Lighthouse 不进 CI，RUM 无数据面

---

## 5. 相关文档

| 文档 | 路径 | 内容 |
|---|---|---|
| 性能预算表 | `docs/ops/perf-budget-2026-07.md` | 路由预算、静态策略、可跑 check |
| 性能基线（历史） | `docs/performance-baseline.md` | LH desktop/mobile 历史分数、CWV 记录 |
| 性能文档索引 | `docs/ops/ch-perf-doc-index-2026-07-26.md` | 本仓性能文档目录导航 |
| Lighthouse desktop 配置 | `lighthouse.config.js` | CI 权威配置 |
| Lighthouse mobile 配置 | `lighthouse.mobile.config.js` | 手动基线配置 |
| 静态体积预算 | `scripts/check-bundle-budget.ts` | JS/CSS 单文件 + 总额预算 |
| 运营门禁表 | `docs/ops/ops-checklist-2026-07.md` | OPS-RUM / PERF / SRI 等状态 |
| 运营待办 | `docs/ops-deferred-work-plan.md` | RUM 回填（B2）、Garden（B3） |

---

## 6. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-07-26 | 首版：a11y 门禁现状 + Lighthouse 预算 + RUM 数据面 + CI 对齐表 |