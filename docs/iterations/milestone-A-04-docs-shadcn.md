# Milestone A-04 · 文档治理、shadcn 与 Paper Gallery

> 阶段：2026-07-03 ~ 2026-07-05 · 状态：**Completed（历史里程碑）**
> 证据基准：`8b2f764` → `493ba96`
> 关联：[A-03](./milestone-A-03-editorial-home.md) · 后续 [B-01](./milestone-B-01-content-ops-search.md)

---

## 1. 目标

把 `docs/ARCHITECTURE.md` 从历史参考升级为可接手的架构摘要；落地 shadcn 视觉架构；首页重设计为 Paper Gallery；加固本地内容仓库；修性能回归；加生产内容烟测与移动端 E2E。

## 2. 关键提交

| 日期       | commit    | 做了什么                                                                     |
| ---------- | --------- | ---------------------------------------------------------------------------- |
| 2026-07-03 | `8b2f764` | `docs: add Claude Code handoff design`                                       |
| 2026-07-04 | `cbdd23f` | 全局常量迁移（`@/lib/constants` → `@/lib/site`）+ shadcn 组件落地 + 测试补全 |
| 2026-07-04 | `99930bd` | `feat: redesign homepage as paper gallery`                                   |
| 2026-07-04 | `7d6542d` | `chore(lhci): lower performance threshold from 0.85 to 0.80`                 |
| 2026-07-04 | `b152766` | `refactor(ui): consolidate shadcn visual architecture`                       |
| 2026-07-04 | `800e892` | `refactor: strengthen local content repositories`（ADR-0002）                |
| 2026-07-04 | `fcc3b23` | `fix: include content files in Vercel traces`                                |
| 2026-07-05 | `725c831` | `ci: add production content smoke check`                                     |
| 2026-07-05 | `45f8d10` | `feat(links): improve launch readiness` — `/links` 扩到 10 类 123 条         |
| 2026-07-05 | `3fe38d1` | `fix(perf): render backdrop mesh with css`（修背景层 CLS 回归）              |
| 2026-07-05 | `493ba96` | `feat(ui): localize reading settings panel`（本段末）                        |

## 3. 实现步骤

### 3.1 站点配置迁移 + shadcn 落地（`cbdd23f`）

- 删 `src/lib/constants.ts`，新增 `src/lib/site.ts`（`SITE_CONFIG` 新家）。
- shadcn 组件：`button` / `card` / `badge` / `separator` / `skeleton`。

### 3.2 shadcn 视觉架构收敛（`b152766`）

- `src/components/layout/{ArchiveCard,PageSection}.tsx`、`src/components/ui/MetaBadge.tsx`。
- `components.json`、`.lintstagedrc.mjs`。
- CSS 大面积重排。

> 设计记录：`docs/specs/2026-07-04-shadcn-visual-architecture-design.md`。这套「UI 原语在 `components/ui/`、组合件在 `components/layout/`」的分工沿用至今（见 AGENTS.md Conventions）。

### 3.3 Paper Gallery 首页（`99930bd`）

- `src/app/page.tsx` 重写、`src/app/styles/home.css`（+864 行）、7 个 `src/components/home/*.tsx` 及其测试。

### 3.4 Lighthouse 阈值下调（`7d6542d`）

Paper Gallery 重设计后首页性能降到 0.84，未过 0.85 阈值 → 下调到 0.80。

> 这是一次**为迁就实现而放宽标准**的动作，被记录进 `TODO.md` 的 P0（`4bab930`）。值得记住：阈值下调后一直沿用，直到今天 `lighthouse.config.js` 的 performance 门仍是 0.80。

### 3.5 内容仓库加固（`800e892`）

新增 `docs/adr/0002-local-content-repository-factory.md`——本地内容 repository 工厂模式，这是后来 `content-source.ts` 演进的决策基础。

### 3.6 上线就绪收尾（`725c831` ~ `493ba96`）

- `scripts/check-production-content.ts`（231 行）：生产内容烟测。
- `/links` 扩到 10 类 123 条，加 `LinkItem.tags`，新增 `e2e/mobile.spec.ts`（80 行）。
- `lighthouse.mobile.config.js`：移动端 Lighthouse 基线。
- 修背景层 CLS 回归（`3fe38d1` 改用 CSS 渲染 mesh）。

## 4. 涉及文件

**新增**：`src/lib/site.ts` · `src/components/ui/{button,card,badge,separator,skeleton,MetaBadge}.tsx` · `src/components/layout/{ArchiveCard,PageSection}.tsx` · `scripts/check-production-content.ts` · `e2e/mobile.spec.ts` · `lighthouse.mobile.config.js` · `docs/adr/0002-local-content-repository-factory.md` · `docs/specs/2026-07-04-shadcn-visual-architecture-design.md`
**删除**：`src/lib/constants.ts`
**修改**：`src/app/page.tsx` · `src/app/styles/home.css` · `data/links.json` · `src/components/layout/SiteBackdropStage.tsx`

## 5. 数据或接口变化

- `data/links.json`：加 `LinkItem.tags` 字段（可选，旧数据兼容）。
- 站点配置入口 `constants.ts` → `site.ts`。

## 6. 验收结果

`TODO.md` @ `493ba96`（2026-07-05）首行：

> 当前状态: **523 tests / 65 files / 47 E2E 全绿**；CI Lighthouse / deploy / production content smoke 全绿；线上域名 `https://incca.ccwu.cc` 可用

实跑交叉核验（`git ls-tree -r --name-only 493ba96 | grep -cE '\.test\.tsx?$'` = **65**，与 TODO 的 65 files 一致）。

`docs/archive/superpowers-runs/2026-07-05-launch-readiness/progress.md` @ `493ba96`「已验证」表：

| 命令                                      | 结果                        |
| ----------------------------------------- | --------------------------- |
| `pnpm test`                               | 65 files / 523 tests passed |
| `pnpm build`                              | 93 pages built              |
| `pnpm test:e2e`                           | 47 tests passed             |
| `check-bundle-budget`                     | pass                        |
| `check-production-content --base-url=...` | pass                        |

`TODO.md` @ `493ba96` P0：Lighthouse 回归解除，引用 GitHub Actions run `28731579207`。

**未找到证据**：本阶段的 `99930bd`（Paper Gallery 重写）、`b152766`（shadcn 收敛）未在 commit body 或文档中留下测试/构建数字。

## 7. 遗留问题

- Lighthouse performance 阈值从 0.85 降到 0.80（为 Paper Gallery 重设计让路）—— 沿用至今。
- Paper Gallery 首页整体在 2026-10-07 重构中被替换为工作台首页。

## 8. 与今日的差异

| 项          | 本阶段（2026-07-05）    | 今日（2026-10-14）                                   |
| ----------- | ----------------------- | ---------------------------------------------------- |
| 首页主题    | Paper Gallery（暖纸色） | 中性灰工作台（2026-10-07）                           |
| `/links`    | 10 类 123 条            | **已删除**（2026-10-07），`data/links.json` 无消费方 |
| 站点配置    | `src/lib/site.ts`       | 沿用                                                 |
| shadcn 分工 | ui/ 原语 + layout/ 组合 | 沿用（AGENTS.md Conventions）                        |
| 测试        | 523 tests / 65 files    | 662 tests / 80 files                                 |
