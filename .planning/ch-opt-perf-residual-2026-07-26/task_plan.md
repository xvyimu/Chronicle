# M-CH-perf-residual · task_plan · 2026-07-26

**分支：** `xvyimu/ch-opt-perf-residual` · base master `1f52af9`
**约束：** 不 push master · 不放宽 CSP · 不与待合 long-wave feature tips 冲突（W2–W10 已在 origin 等人 ff）

## 冲突避让（关键）

long-wave 待合分支已占用的文件（**本波不碰**）：

- `e2e/navigation.spec.ts`（W9 `0108740` 已修 waitForTimeout — 不重复修）
- `src/components/blog/useServerSearch.test.tsx` · `Footer.test.tsx`（W9）
- `EditorialHero.tsx/.test.tsx` · `src/app/page.tsx` · `src/test/mocks/next-image.tsx`（W2）
- `ImageZoom/CodeBlock*`（W3）· layout/BackToTop/ReadingProgress/Parallax gates（W4）
- search route/corpus（W5 & FIX）· styles/**（W6）· build-content-snapshot/package.json（W7）
- Header/Footer/ThemeToggle/base.css/layout.a11y（W8）

## 切片（互不依赖 · 每片独立 commit）

| #   | 切片                                                               | 文件                                                   | 状态 |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------ | ---- |
| S1  | `images.qualities` 显式声明（Next16 image quality 边界）           | `next.config.ts`（long-wave 无人占用）                 | 计划 |
| S2  | e2e flake 守卫：blog/extended/mobile spec 中不与 W9 重叠的守卫缺口 | `e2e/blog.spec.ts` 等（W9 只碰 navigation）            | 评估 |
| S3  | ops 索引：master tip vs long-wave feature tips 差异表              | `docs/ops/ch-opt-perf-residual-evidence-2026-07-26.md` | 计划 |

## 门闩

每 commit 前：`pnpm typecheck` + `pnpm test` 均 exit 0（本机 Node 24 WARN-only，CI Node 22 权威）。
