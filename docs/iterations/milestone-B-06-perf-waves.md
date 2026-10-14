# Milestone B-06 · 性能 Wave（CH-PERF-001~012）

> 阶段：2026-07-24 ~ 2026-08-04 · 状态：**Completed（历史里程碑）**
> 证据基准：`ac96b4c` → `d38db44`
> 关联：[B-05](./milestone-B-05-arch-upgrade.md) · 后续 [C-01](./milestone-C-01-doc-standard.md)

---

## 1. 目标

Phase 0 只读测绘 → 8 个互斥切片并行优化 → 集成；随后把 content pipeline 稳定化、bundle budget 变可断言、RUM 回填文档化。

## 2. 关键提交

| 日期       | commit                | 切片                | 做了什么                                                          |
| ---------- | --------------------- | ------------------- | ----------------------------------------------------------------- |
| 2026-07-24 | `ac96b4c`             | Phase 0             | perf scout findings（新增 `ch-perf-scout-2026-07-24.md`）         |
| 2026-07-24 | `f406a21`             | CH-PERF-001         | `perf(css): route-level CSS import sinking`（13 files）           |
| 2026-07-24 | `b088d38`             | CH-PERF-002         | `perf(font): drop unused Cormorant 600 weight`                    |
| 2026-07-24 | `75502ce`             | CH-PERF-003         | `perf(home): LCP EditorialHero tweaks`                            |
| 2026-07-24 | `038764f`             | CH-PERF-004         | 抽 CSP builders + 回归测试（16 条）                               |
| 2026-07-24 | `791cf29`             | CH-PERF-005/009     | `perf(mdx): defer CodeBlock client + ImageZoom sizing`            |
| 2026-07-24 | `5d5fe87`             | CH-PERF-006         | `perf(rsc): slim client component boundaries`                     |
| 2026-07-24 | `b875f2d`             | CH-PERF-007         | `perf(links): SSR catalog + client filter island`                 |
| 2026-07-24 | `3b64203`             | CH-PERF-008         | `perf(search): cold-path cache improvements`                      |
| 2026-07-26 | `2052db8` · `12ddfa7` | 残余                | `perf(images): declare images.qualities`                          |
| 2026-07-27 | `643a898`             | CH-PERF-010/011/012 | content pipeline 稳定 + assertable bundle budget                  |
| 2026-08-03 | `22d7e51`             | 收口                | `fix(deps,ci): 修 stale pin 反噬 + 收口全部质量门`                |
| 2026-08-04 | `d38db44`             | 收口                | `test(e2e): realign two specs with the shipped perf architecture` |

## 3. 实现步骤

### 3.1 八个互斥切片（CH-PERF-001~008）

每片独立 commit，各自 worktree 并行，最后集成 9 笔（`624daa4` `8b463e9` `a2529eb` `ae8c8ac` `e83e243` `74e3a57` `bec6aad` `c5a2a22` `1f52af9`）。

- **001 CSS 下沉**：CSS 按路由下沉到各 `layout.tsx`。
- **002 字体瘦身**：删未用的 Cormorant 600 weight。
- **003 首页 LCP**：`EditorialHero` 调优。
- **004 CSP 构建器**：抽 `src/lib/csp.ts` + 16 条回归测试。
- **005/009 MDX 延迟**：`CodeBlock` 客户端化拆出 `CodeBlockCopyButton.tsx`；`ImageZoom` 定尺寸。
- **006 RSC 瘦身**：拆 `HeaderScrollState.tsx`、`MobileNav.tsx`、`SiteBackdropParallaxGate.tsx`、`usePrefersFinePointer.ts`。
- **007 `/links` SSR**：拆 `LinksDirectoryClient.tsx` + `links-filter.ts`。
- **008 搜索冷路径**：`src/server/search/corpus.ts` 缓存。

### 3.2 收尾切片（CH-PERF-010/011/012，`643a898`）

- 新增 `scripts/verify-content-snapshot.ts`（`content:verify` fail-closed 进 CI）。
- `check-bundle-budget-script.test.ts`：让 bundle budget 可断言。
- RUM 回填文档化。

### 3.3 收口（`22d7e51`）

- `pnpm-workspace.yaml` override 从精确钉改为下界范围（`postcss` `8.5.15` → `>=8.5.18`；`brace-expansion` `5.0.7` → `>=5.0.8`）——这是「stale pin 反噬」的第一次显式记账。
- CI audit 收敛到 `--prod`。

## 4. 涉及文件

**新增**：`docs/ops/ch-perf-scout-2026-07-24.md` · `docs/ops/ch-opt-perf-residual-evidence-2026-07-26.md` · `scripts/verify-content-snapshot.ts` · `scripts/check-bundle-budget-script.test.ts` · `src/lib/csp.ts` · `src/server/search/corpus.ts`
**修改**：`src/app/**/layout.tsx`（CSS 下沉）· `next.config.ts`（`images.qualities`）· `.github/workflows/ci.yml` · `pnpm-workspace.yaml`

## 5. 数据或接口变化

- 无对外 API 变化。
- 新增脚本：`content:verify`。

## 6. 验收结果

**实验室基线（CI desktop，2026-06-29，来源 `docs/performance-baseline.md`）**

| 页面                      | Perf | LCP     | CLS  | TBT |
| ------------------------- | ---- | ------- | ---- | --- |
| `/`                       | 0.85 | 1877 ms | 0.00 | 0   |
| `/about`                  | 0.97 | 1172 ms | 0.00 | 0   |
| `/blog`                   | 0.91 | 1524 ms | 0.00 | 0   |
| `/blog/nextjs-app-router` | 0.83 | 1795 ms | 0.13 | 3   |
| `/projects`               | 0.97 | 1142 ms | 0.00 | 0   |

**移动端手动基线（2026-07-17，Node 22，来源 `docs/performance-baseline.md`）**

| 页面                      | Perf | LCP      | CLS    |
| ------------------------- | ---- | -------- | ------ |
| `/`                       | 0.57 | 9794 ms  | 0.0000 |
| `/blog`                   | 0.59 | 8730 ms  | 0.0001 |
| `/blog/nextjs-app-router` | 0.58 | 9188 ms  | 0.0311 |
| `/projects`               | 0.62 | 7690 ms  | 0.0001 |
| `/links`                  | 0.57 | 10554 ms | 0.0001 |

**Bundle**

| 时点       | max JS   | max CSS  | total   | 出处                      |
| ---------- | -------- | -------- | ------- | ------------------------- |
| 2026-06-28 | 272.5 KB | 272.5 KB | 1.08 MB | `performance-baseline.md` |
| 2026-07-17 | 222.0 KB | 181.8 KB | 1.15 MB | CI run `29573545749`      |

**测试基线演进**：`716`（07-24）→ `732`（07-24 csp-guard）→ `749` / 98 files（07-26）。

> **诚实边界**：CH-PERF wave 本身**未产出 post-wave Lighthouse 复测数字**——文档口径是「CI 权威，本地默认不重跑」。`docs/ops/ch-perf-002-font-2026-07-24.md` 明写「LH `/`：本波未跑（无稳定数字不写）」。上表基线是**波次之前**的既有数字，不是优化后的结果。

## 7. 遗留问题

- RUM p75 全程 `pending`（无 `VERCEL_TOKEN`），禁用 Lighthouse 代填。
- 移动端 Lighthouse 未进 CI（仅手动）。
- 本地 LH / bundle-budget 在 Node 24 下 SKIP。

## 8. 与今日的差异

| 项          | 本阶段（2026-08-04） | 今日（2026-10-14）                |
| ----------- | -------------------- | --------------------------------- |
| `/links`    | 已 SSR 化            | **已删除**（2026-10-07）          |
| 服务端搜索  | `src/server/search/` | **已删除**                        |
| bundle 预算 | 3 条（JS/CSS/总）    | +每路由首屏 ≤285 KB（2026-10-08） |
| 测试        | 749 / 98 files       | 662 / 80 files（重构后精简）      |
