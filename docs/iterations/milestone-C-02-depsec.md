# Milestone C-02 · 依赖安全升级

> 阶段：2026-09-20 ~ 2026-09-30 · 状态：**Completed（历史里程碑）**
> 证据基准：`9c67d2b` → `8d5a280`
> 关联：[C-01](./milestone-C-01-doc-standard.md) · 后续 [D-01](./milestone-D-01-workspace-rebuild.md)

---

## 1. 目标

清掉生产依赖漏洞（含 `next` 两条 critical RCE），修 CI RSS 门禁，收编 dependabot 的分组升级。

## 2. 关键提交

| 日期       | commit                                        | 做了什么                                                                  |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| 2026-09-20 | `9c67d2b`                                     | `fix(deps): next 升 16.3.5 修两条 critical RCE，并清掉其余 prod 高危漏洞` |
| 2026-09-22 | `65b82c5` · `fcb2006`                         | dependabot：vitest 4.1.9→4.1.11、next 16.2.11→16.3.3                      |
| 2026-09-26 | `17e06af`                                     | merge：next 16.3.5 安全升级 + Justfile/.claude settings                   |
| 2026-09-26 | `e178f07`                                     | `fix: feed 产物回写生产 URL`（`b5fa205` 误生成 example.com）              |
| 2026-09-30 | `8d5a280` · `22c1a39` · `a37e226` · `692e7b3` | dependabot 分组升级（react / jsdom / radix / playwright）                 |

## 3. 实现步骤

### 3.1 next critical RCE 升级（`9c67d2b`）

- 两条 critical：`GHSA-p293-qw3h-jr36` 与 `GHSA-2xp9-vwfh-vxw4`，受影响区间 `>=16.0.0 <16.3.3`，本仓锁在 `16.2.11` 中招。
- 升级前 `pnpm audit --prod` exit 1（**9 条**：critical 2 / high 6 / moderate 1）→ 升级后 exit 0。
- `next.config.ts`：删 `experimental.viewTransition`（16.3.5 的 `ExperimentalConfig` 已无此键，留着 tsc 报 TS2322）。
- `pnpm-workspace.yaml` overrides：`sharp >=0.35.4`、`nanoid >=3.3.18 <4`、`browserslist >=4.28.7 <5`、`baseline-browser-mapping >=2.11.0`。

### 3.2 修 RSS 门禁（`e178f07`）

`b5fa205` 生成的 feed 产物误用 `example.com`，修回生产 URL `https://incca.ccwu.cc`。

### 3.3 dependabot 分组升级（2026-09-30）

react 组（4 项）、jsdom 29.1.1→30.1.1、radix-ui 1.6.1→1.6.7、playwright 组（2 项）。

## 4. 涉及文件

**修改**：`package.json` · `pnpm-lock.yaml` · `pnpm-workspace.yaml` · `next.config.ts` · `public/feed.{xml,json}`

## 5. 数据或接口变化

无。依赖版本变化。

## 6. 验收结果

| 时点      | 命令/指标           | 结果                         | 出处        |
| --------- | ------------------- | ---------------------------- | ----------- |
| `9c67d2b` | `pnpm audit --prod` | 9 条 → **0（exit 0）**       | commit body |
| `9c67d2b` | `pnpm test`         | 99 files / 759 tests, exit 0 | commit body |
| `9c67d2b` | `pnpm build`        | 108 静态页, exit 0           | commit body |

**未验**：`9c67d2b` 的 commit body 明写 e2e 与 stryker 变异基线未跑。

## 7. 遗留问题

- e2e / 变异基线未随升级重跑 —— 后由 CI 覆盖。
- 精确钉变 stale pin 的问题反复出现（`qs`、`fast-uri`），后于 D-045 系统处理。

## 8. 与今日的差异

| 项       | 本阶段（2026-09-30） | 今日（2026-10-14）            |
| -------- | -------------------- | ----------------------------- |
| next     | 16.3.5               | 16.4.0                        |
| 生产漏洞 | 0（prod）            | 0（prod）                     |
| dev 漏洞 | —                    | 1 条 braces high（无解，R13） |
