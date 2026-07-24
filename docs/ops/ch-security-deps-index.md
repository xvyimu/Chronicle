# Chronicle · Security / Deps 证据索引

> 状态：当前维护入口（2026-07-24）  
> 范围：依赖安全扫描、日硬化门闩、SRI 回归与 major 债入口  
> 非本页职责：升依赖、改 app/、改 CI workflow、push

本页汇总 `docs/ops/` 内 **deps / security / day hardening** 相关证据文件，作为 review 与接手的单一导航。日期型报告正文是时间点快照；**当前 tip 与门闩结论以本表「当前 tip」与最新证据页为准**。

## 当前 tip

| 项                              | 值                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------- |
| 本 worktree 分支                | `xvyimu/ch-ops-index`                                                           |
| 本仓 HEAD（索引撰写时）         | `d8b2f41`（`docs: CH-DEPS-SEC hygiene, CH-DAY tip honesty, test baseline 716`） |
| CH-DEPS-SEC 扫描证据钉          | `19f486d`（`docs(ops): CH-DEPS-SEC scan classification 2026-07-24`）            |
| CH-DAY 硬化证据 / 曾对齐 master | `fbcf270`（`docs(ops): CH-DAY hardening evidence 2026-07-24`）                  |
| WAVE-1 next 安全补丁            | `7cc4b18`（`fix(deps): bump next to 16.2.11 for high audit CVEs`）              |
| 运行时安全基线                  | `next@16.2.11` · `ENABLE_SRI` 仍为 owner gate · **未**生产 flip                 |
| 测试基线（README）              | Vitest **716** / 95（已写；本索引不改 README）                                  |

## audit 0 证据

「audit 0」= `pnpm audit` 在 `registry.npmjs.org` 上 high+（及全级别复核）无 known advisory，且 Dependabot **open** = 0。**不等于** 零安全债（仍有 major / 卫生 patch-minor / 未扫面）。

| 证据                                                                 | 日期       | 关键结论                                                                                      |
| -------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| [ch-deps-sec-2026-07-24.md](./ch-deps-sec-2026-07-24.md)             | 2026-07-24 | audit high/all **0**；Dependabot open **0**（历史 18 条 next 全 fixed）；无 package/lock 变更 |
| [ch-day-hardening-2026-07-24.md](./ch-day-hardening-2026-07-24.md)   | 2026-07-24 | 全门闩绿（含 audit 0、test 716、SRI build on）；供应链 security-now 无待修                    |
| [ch-w1-sri-2026-07-23.md](./ch-w1-sri-2026-07-23.md)                 | 2026-07-23 | next 16.2.9→**16.2.11** 修 4× high；SRI smoke/check 绿                                        |
| [wave-hygiene-deps-2026-07-22.md](./wave-hygiene-deps-2026-07-22.md) | 2026-07-22 | 早期 deps 卫生；**registry 备注**：npmmirror 无 audit bulk → 权威 audit 走 npmjs              |

### 复现 audit（权威 registry）

```bash
pnpm audit --registry=https://registry.npmjs.org --audit-level=high
pnpm audit --registry=https://registry.npmjs.org
```

## major-later 债入口

**红线：只列不升**（独立 breaking 评估后再动）。权威分类表在 CH-DEPS-SEC；CH-DAY 有同日快照。

| Package                     | Current（证据时） | Target / Latest | 入口                                                                                        |
| --------------------------- | ----------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `js-yaml`                   | 4.3.0（钉）       | 5.x             | [ch-deps-sec § major-later / js-yaml@5](./ch-deps-sec-2026-07-24.md#major-债细节--js-yaml5) |
| `@types/node`               | ^20 → 20.19.x     | 26.x            | [ch-deps-sec § @types/node@26](./ch-deps-sec-2026-07-24.md#major-债细节--typesnode26)       |
| `@testing-library/jest-dom` | 6.x               | 7.x             | [ch-deps-sec § 2.3](./ch-deps-sec-2026-07-24.md#23-major-later只列债--不硬升)               |
| `eslint`                    | 9.x               | 10.x            | 同上                                                                                        |
| `feed`                      | 5.x               | 6.x             | 同上                                                                                        |
| `typescript`                | 5.9.x             | 7.x             | 同上                                                                                        |

卫生债（patch/minor、无 advisory、本波不扫荡）见同页 **ignore-with-reason** 表。

## 证据文件清单（deps / security / day）

| 文件                                                                           | 角色                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [ch-security-deps-index.md](./ch-security-deps-index.md)                       | **本索引**（导航入口）                                     |
| [ch-deps-sec-2026-07-24.md](./ch-deps-sec-2026-07-24.md)                       | 依赖安全分类 + audit/Dependabot 扫描（最新）               |
| [ch-day-hardening-2026-07-24.md](./ch-day-hardening-2026-07-24.md)             | 日硬化全门闩 + 供应链分类快照                              |
| [public-api-rate-limit-boundary.md](./public-api-rate-limit-boundary.md)       | 公开 API 进程限流边界 + Vercel WAF 检查表（CH-CR-001/002） |
| [ch-fix-rate-limit-docs-2026-07-24.md](./ch-fix-rate-limit-docs-2026-07-24.md) | rate-limit docs 切片证据                                   |
| [ch-w1-sri-2026-07-23.md](./ch-w1-sri-2026-07-23.md)                           | WAVE-1 SRI + next 16.2.11 安全补丁                         |
| [sri-smoke.md](./sri-smoke.md)                                                 | SRI 本地 smoke / checker 操作手册                          |
| [wave-hygiene-deps-2026-07-22.md](./wave-hygiene-deps-2026-07-22.md)           | deps hygiene 波次报告（registry/audit 工具债）             |
| [wave-hygiene-2026-07-22.md](./wave-hygiene-2026-07-22.md)                     | 同日总 hygiene（非 deps 专页，交叉引用）                   |
| [L2-hygiene-checklist.md](./L2-hygiene-checklist.md)                           | L2 卫生检查清单                                            |
| [L2-P0-action-board-2026-07-22.md](./L2-P0-action-board-2026-07-22.md)         | L2 P0 行动板（含 audit 相关项）                            |

## 交叉链

| 去向                        | 路径                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| 文档总览                    | [../overview.md](../overview.md)                                                                 |
| 第三方依赖 SPDX 摘要        | [../THIRD_PARTY.md](../THIRD_PARTY.md)                                                           |
| 安全策略（漏洞报告）        | [../../SECURITY.md](../../SECURITY.md)                                                           |
| 上线基线                    | [../launch-baseline.md](../launch-baseline.md)                                                   |
| Agent 接手                  | [../handoff-to-agent.md](../handoff-to-agent.md)                                                 |
| 延后运营（GSC/Bing 等人账） | [../ops-deferred-work-plan.md](../ops-deferred-work-plan.md)                                     |
| SRI ADR 评估                | [../adr/2026-07-21-sri-over-nonce-evaluation.md](../adr/2026-07-21-sri-over-nonce-evaluation.md) |
| CSP nonce ADR               | [../adr/0001-csp-nonce-vs-ssg.md](../adr/0001-csp-nonce-vs-ssg.md)                               |
| 根 README 测试基线          | [../../README.md](../../README.md)（`pnpm test` · 716 / 95）                                     |

## 维护规则

1. 新 deps/security/day 证据 md 落 `docs/ops/` 后，**先**更新本索引「当前 tip / audit 0 / major-later / 清单」再合。
2. major 升级不得借本索引「顺手」；独立 worktree + 证据 + 门闩。
3. 权威 audit 命令必须带 `registry.npmjs.org`（镜像无 bulk endpoint 时 bare `pnpm audit` 是工具假失败）。
4. 本索引只改文档导航；**不**改 `package.json` / lockfile / app / CI workflow。
