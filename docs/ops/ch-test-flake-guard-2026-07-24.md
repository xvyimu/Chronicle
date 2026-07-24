# ch-test-flake-guard · 2026-07-24

**模块：** M-CH-test-flake-guard · WEEK-BACKLOG W9  
**分支：** `xvyimu/ch-test-flake-guard`  
**范围：** 失败/慢/flaky 测试稳定（超时、假时间、并发、不稳定选择器）  
**禁区：** 删测降绿 · 改产品行为无测试理由 · push master

## 扫描表

| 文件                                           | 风险类               | 现象                                                        | 处置     | 说明                                                      |
| ---------------------------------------------- | -------------------- | ----------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `src/components/layout/Footer.test.tsx`        | 假时间泄漏           | `vi.useFakeTimers()` 仅在 `beforeEach`，无 `afterEach` 还原 | **已修** | 补 `afterEach → useRealTimers`，避免污染后续套件          |
| `src/components/blog/useServerSearch.test.tsx` | 真实 debounce / 墙钟 | `waitFor({ timeout: 2000 })` 等 180ms debounce，慢机易抖    | **已修** | 改 fake timers + `advanceTimersByTime(180)`，去掉墙钟等待 |
| `e2e/navigation.spec.ts`                       | 固定 sleep           | `waitForTimeout(500/300)` 主题切换                          | **已修** | 改为 `waitForFunction` 等 class / localStorage 状态变化   |
| `src/components/blog/CodeBlock.test.tsx`       | 假时间               | copy 反馈 2s 复位                                           | 已稳     | 局部 try/finally `useRealTimers`                          |
| `src/app/sitemap.test.ts`                      | 假时间               | lastModified 稳定性                                         | 已稳     | `afterEach useRealTimers` 已有                            |
| `src/components/ui/ThemeToggle.test.tsx`       | 异步 hydration       | `vi.waitFor` + localStorage                                 | 已稳     | 有 before/after 清理                                      |
| `src/components/blog/WikilinkPopover.test.tsx` | fetch async          | `waitFor`                                                   | 已稳     | stub fetch + restore                                      |
| `src/components/layout/Header.test.tsx`        | 动画/菜单            | rAF mock + waitFor                                          | 已稳     | workers=1 / restore mocks                                 |
| e2e 其余 (blog/home/mobile/extended)           | 选择器 / timeout     | role + 显式 timeout                                         | 观察     | 无 `waitForTimeout`；`retries: CI=2`                      |
| vitest 全量                                    | 并发                 | pool 默认并行                                               | 观察     | 基线 749 绿；缓存测有 `resetAllCaches`                    |

## 变更摘要

1. **Footer.test：** 假时间对称还原，防跨文件泄漏。
2. **useServerSearch.test：** debounce 用假时间推进，断言同步化。
3. **e2e/navigation：** 去掉固定 sleep，条件等待主题状态。

**未改产品代码**（仅测试）。

## 验收

见根 `evidence.md`（本模块段）与命令 exit code。
