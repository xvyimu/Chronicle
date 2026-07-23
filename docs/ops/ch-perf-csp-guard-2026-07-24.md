# CH-PERF-004 · CSP 加固证据 · 2026-07-24

> Worktree：`ch-perf-csp-guard` · Branch：`xvyimu/ch-perf-csp-guard`  
> 范围：只加固不放宽 · 最小 diff

## 变更摘要

| 文件 | 作用 |
|------|------|
| `src/lib/csp.ts` | 抽出 `buildProductionCsp` / `createCspNonce` / `shouldApplyCsp` / `buildReportingEndpointsHeader` + 既有 `getCspNonce` |
| `src/proxy.ts` | 接线上述纯函数；行为不变（prod 发 CSP+Reporting-Endpoints；dev 跳过） |
| `src/lib/csp.test.ts` | **新增** 16 条防回归：nonce、strict-dynamic、**无 script-src unsafe-inline**、report 双通道、dev/prod 分支、layout/proxy 源码契约、SRI 默认关 |
| `src/app/layout.tsx` | **未改**（已正确 `getCspNonce` → `DarkModeScript nonce`） |

### Nonce 链路（核对完整）

1. `proxy`（prod）：`createCspNonce()` → `x-nonce` request header + `Content-Security-Policy` request/response  
2. `layout`：`getCspNonce()` 读 `x-nonce` → `<DarkModeScript nonce={nonce} />`  
3. Next 对 framework hydration scripts 使用同一 request CSP/nonce  

### 「未放宽」核对项

| 项 | 结果 |
|----|------|
| 生产 `script-src` 含 `'nonce-…'` + `'strict-dynamic'` | **是**（`buildProductionCsp` + 测试锁） |
| 生产 `script-src` **无** `'unsafe-inline'` / `'unsafe-eval'` | **是** |
| 未去掉 per-request nonce 换全站 SSG | **是**（仍 `headers()` + proxy nonce） |
| `style-src 'unsafe-inline'` 仍仅限样式（Tailwind） | **是**（故意保留；测试区分 script vs style） |
| report-uri + report-to → `/api/csp-report` | **是** |
| SRI：`ENABLE_SRI=== '1'` 门闩，默认关 | **是**（`next.config.ts` 源码契约测试） |
| dev 跳过 CSP（HMR） | **是**（`shouldApplyCsp('development') === false`） |

## 验证命令 / exit code

| # | Command | Exit |
|---|---------|------|
| 1 | `pnpm typecheck` | **0** |
| 2 | `pnpm test -- src/lib/csp.test.ts` | **0**（16/16） |
| 3 | `pnpm test` | **0**（96 files / **732** tests） |
| 4 | `pnpm test:sri` | **0**（6/6） |
| 5 | `pnpm check:sri-smoke` | **0**（offline gate-only） |

未跑 `pnpm build`（任务声明非必须）。

环境备注：Node v24.16.0（engines 声明 22.x → engine warn only，门闩可跑）。

## 残留风险

- 策略字符串仍手写 join；若未来在 `script-src` 误加 host 通配/`https:` scheme，测试会拦大部分开放面，但**不**覆盖真实浏览器对 `strict-dynamic` 与第三方 loader 的运行时交互——生产仍依赖 `/api/csp-report` 遥测与人工抽查响应头。
