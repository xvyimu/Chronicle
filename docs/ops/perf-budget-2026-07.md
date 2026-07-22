# Chronicle · 性能预算表 · 2026-07

> 组合包：`portfolio-arch-upgrade-2026h2` · 波次 **W3**  
> 仓：`xvyimu/Chronicle` · 产品：内容站（非 AI SaaS）  
> 冻结日：2026-07-23 · 分支：`xvyimu/w3-ch-claude`  
> 权威明细基线：[`docs/performance-baseline.md`](../performance-baseline.md) · 本表是 **W3 可执行预算卡**（路由 / LCP / 静态策略 + 可跑 check）

## 1. 目标与纪律

| 项         | 约定                                                                |
| ---------- | ------------------------------------------------------------------- |
| 实验室权威 | CI Lighthouse **desktop**（`lighthouse.config.js` · 2 runs 中位数） |
| 字段权威   | Vercel Speed Insights **p75**（有样本后回填；禁用 LH 代填 p75）     |
| 静态体积   | `scripts/check-bundle-budget.ts` 在 production build 后             |
| 本波默认   | **文档 + 门禁复验**；不做路由大改、不换栈、不花园重构               |
| RUM 回填   | 需人账号 / `VERCEL_TOKEN` → 仍 `pending`（见 ops-deferred）         |

## 2. 路由 × 指标预算

### 2.1 核心路由（CI 强制）

| 路由                                     | 角色          | 渲染/数据策略（现状）                    | Lab LCP       | Lab CLS                    | Lab TBT      | Perf score | 静态注意                                              |
| ---------------------------------------- | ------------- | ---------------------------------------- | ------------- | -------------------------- | ------------ | ---------- | ----------------------------------------------------- |
| `/`                                      | 着陆 · 精选轨 | 动态 HTML（CSP nonce）+ 内容 snapshot/fs | **≤ 3500 ms** | **≤ 0.15**                 | **≤ 300 ms** | **≥ 0.80** | hero / backdrop mesh 几何内联；避免新大图无尺寸       |
| `/blog`                                  | 时间线列表    | 同上 · 分页 12                           | 同上          | 同上                       | 同上         | 同上       | 列表图 / 搜索入口勿塞首屏重客户端                     |
| `/blog/[slug]` 代表：`nextjs-app-router` | 文章          | MDX + TOC + 可选 Giscus                  | 同上          | 同上（文章历史 ~0.13 lab） | 同上         | 同上       | Shiki 主题 CSS 计入 CSS budget；code-toolbar 预留高度 |
| `/projects`                              | 作品集        | `data/projects.json`                     | 同上          | 同上                       | 同上         | 同上       | 卡片图 `next/image` + blur 覆盖                       |
| `/about`                                 | 静态 MDX      | about.mdx                                | 同上          | 同上                       | 同上         | 同上       | 轻页；回归对照用                                      |

**断言落点：** `lighthouse.config.js` → CI `e2e` job（`treosh/lighthouse-ci-action@v12`）。

### 2.2 扩展路由（手动 / 观察 · 非 CI 阻断）

| 路由                           | 角色     | 策略提示                         | Lab 目标（对齐核心）         | 备注                                        |
| ------------------------------ | -------- | -------------------------------- | ---------------------------- | ------------------------------------------- |
| `/links`                       | 导航目录 | 客户端筛选 · 大列表              | 与核心同阈值作 **warn 信号** | 仅 mobile 手动 LH；不进 desktop CI URL 列表 |
| `/garden`                      | 关系图   | 力导向 + reduced-motion 列表降级 | 不硬卡 LCP 到 CI             | **禁止**本波大重构；Perf 债单独 issue       |
| `/series` · `/series/[series]` | 专题     | `seriesSlug` 优先 · SSG params   | 对齐列表页                   | URL 稳定优先于显示名                        |
| `/categories/*` · `/tags/*`    | 归档     | 聚合页                           | 对齐列表页                   | 中文 segment encode                         |
| `/api/search`                  | 检索     | Fuse 进程内 · 限流               | 非 LCP                       | 文量门槛见 ADR keep-fuse                    |

### 2.3 字段（RUM）目标

| 指标 | Good (p75) | 调查阈值     | 状态                           |
| ---- | ---------- | ------------ | ------------------------------ |
| LCP  | ≤ 2.5 s    | p75 > 3.0 s  | **pending** 样本 / 只读权限    |
| INP  | ≤ 200 ms   | p75 > 300 ms | pending                        |
| CLS  | ≤ 0.1      | p75 > 0.1    | pending（lab 文章页可至 0.15） |

回填剧本：`docs/ops-deferred-work-plan.md` §5 · 表体写回 `performance-baseline.md` Baseline Log。

## 3. 静态资源策略

| 层                          | 预算                                    | 执行                           | 说明                                                          |
| --------------------------- | --------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| 单 JS chunk                 | **≤ 300 KB**                            | `check-bundle-budget`          | `.next/static/chunks/` 单文件                                 |
| 单 CSS bundle               | **≤ 300 KB**                            | 同上                           | 含 Shiki 主题体积                                             |
| JS+CSS 合计（不含字体）     | **≤ 2 MB**                              | 同上                           | 字体 on-demand，不计入 total                                  |
| 生产 script/style integrity | 门闩 `ENABLE_SRI=1`                     | `test:sri` / `check:sri-smoke` | **生产 flip 已在生产 env**；本波 **不**改默认 config 开关逻辑 |
| 图片                        | 优先 `next/image` + 固定尺寸 / blur map | `check:blur`                   | blog 图目录有文件才强制                                       |

**缓存与 CDN：** Vercel 静态 `_next/static` 长缓存；HTML 因 nonce **不可**纯 SSG 整页缓存为永久静态——以「动态 HTML + 静态 chunk」为准（ADR CSP nonce）。

**禁止（半年红线内仍成立）：**

- 为压 LCP 去掉 script nonce / 放 `script-src 'unsafe-inline'`
- 为压体积拆掉 content snapshot 门闩
- 引入 Meili/ES 或换框架「换栈提速」

## 4. 渲染与数据路径（预算相关）

```text
content/blog/*.mdx  ──content:build──►  generated/content-snapshot/
                                              │
                         production default   │  CONTENT_BACKEND=snapshot
                         dev default          │  CONTENT_BACKEND=fs
                                              ▼
                                    App Router pages
                                              │
                         proxy.ts CSP nonce → 动态 HTML
                         ENABLE_SRI=1       → static chunk integrity
```

| 决策              | 预算含义                                                         |
| ----------------- | ---------------------------------------------------------------- |
| Snapshot 生产默认 | 构建可重复；发版前 `content:build` + git diff 门                 |
| 动态 HTML + nonce | HTML 非永久静态；LCP 主要吃首屏 CSS/字重/图，不依赖全站 SSG 幻想 |
| `seriesSlug`      | 专题 URL 稳定，避免 rename 触发额外 redirect 链                  |

## 5. 可跑检查（W3 记录）

在 worktree 根执行。本机 Node 可能是 v24（engines `22.x` **WARN only**）；**CI 以 Node 22 为准**。

| #   | 命令                                                                                   | 作用                        | 需要 `.next`？                                  |
| --- | -------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------- |
| 1   | `pnpm test:sri`                                                                        | SRI 解析单元测              | 否                                              |
| 2   | `pnpm check:sri-smoke`                                                                 | offline ENABLE_SRI 门闩形状 | 否（有产物则多验）                              |
| 3   | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high`                  | 依赖 high=0                 | 否                                              |
| 4   | `pnpm exec vitest run src/lib/series.test.ts src/lib/schemas/post-frontmatter.test.ts` | IA 回归                     | 否                                              |
| 5   | `pnpm exec tsx scripts/check-bundle-budget.ts`                                         | 静态体积                    | **是**（先 production build）                   |
| 6   | Lighthouse CI                                                                          | 路由 lab 预算               | **是**（CI e2e 或本地 `npx @lhci/cli autorun`） |

### 5.1 本 worktree 实测（W3 · 2026-07-23）

| Command                                                               | Exit                                                      | 摘录                                              |
| --------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `pnpm test:sri`                                                       | **0**                                                     | 6 pass · 0 fail                                   |
| `pnpm check:sri-smoke`                                                | **0**                                                     | offline gate PASS（无 `.next` 时 skip artifacts） |
| `pnpm audit --registry=https://registry.npmjs.org --audit-level=high` | **0**                                                     | No known vulnerabilities found                    |
| `pnpm exec vitest run`（series / frontmatter / content-snapshot）     | **0**                                                     | 3 files · **28** tests pass                       |
| `pnpm check:ops-readiness`                                            | **0**                                                     | GSC/Bing `blocked_auth`（预期）· 工程项就绪       |
| `pnpm typecheck`                                                      | **0**                                                     | 全绿                                              |
| bundle-budget                                                         | **SKIP 本 wt**（未 production build；CI quality 仍强制）  | 最近 CI 快照见 performance-baseline 2026-07-17    |
| Lighthouse desktop                                                    | **CI 权威** · 本地默认不重跑（耗时 / Node 24 EPERM 风险） | 阈值见 §2.1                                       |

完整摘录：`docs/ops/w3-arch-upgrade-chronicle-claude.md`。

## 6. 优化优先级（有证据再动）

仅当 §2 超预算或 RUM 调查阈值触发：

1. **LCP**：首屏图 / 字体 / 路由 CSS 阻塞（mobile 历史主因：render-blocking CSS）
2. **CLS**：文章 code 块工具条、backdrop mesh、无尺寸媒体
3. **JS chunk**：新客户端岛、搜索/动效独立预算
4. **Garden**：单独 issue · 非 W3 主刀

## 7. 明确不做（W3）

| 项                           | 原因                       |
| ---------------------------- | -------------------------- |
| 换 Astro/Vue / 重写 MDX 管线 | 红线                       |
| 生产改 SRI/CSP 策略代码路径  | 人 gate；生产 env 已开 SRI |
| 伪造 GSC / p75               | 账号纪律                   |
| GardenExplorer 大重构        | 题单禁止                   |
| 本会话 push / 合 master      | 总控                       |

## 8. 变更记录

| 日期       | 变更                                                                         |
| ---------- | ---------------------------------------------------------------------------- |
| 2026-07-23 | W3 首版：路由/LCP/静态策略卡 + 可跑 check 表（solo claude · `w3-ch-claude`） |
