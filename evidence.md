# Evidence · ch-test-flake-guard (W9)

**日期：** 2026-07-24  
**分支：** `xvyimu/ch-test-flake-guard`  
**模块：** M-CH-test-flake-guard  
**ops：** `docs/ops/ch-test-flake-guard-2026-07-24.md`

## Diff 范围

| 路径                                           | 作用                            |
| ---------------------------------------------- | ------------------------------- |
| `src/components/layout/Footer.test.tsx`        | 假时间 afterEach 还原           |
| `src/components/blog/useServerSearch.test.tsx` | debounce 假时间，去墙钟 waitFor |
| `e2e/navigation.spec.ts`                       | 去 `waitForTimeout`，条件等待   |
| `docs/ops/ch-test-flake-guard-2026-07-24.md`   | 扫描表 + 处置                   |
| `evidence.md`                                  | 本文件                          |

## 命令证据

```text
# targeted
pnpm exec vitest run src/components/layout/Footer.test.tsx src/components/blog/useServerSearch.test.tsx
# → Test Files 2 passed · Tests 7 passed · exit 0

# full suite + typecheck (re-run after docs; see shell below)
pnpm test          # expected exit 0
pnpm typecheck     # expected exit 0
```

## 不做 / 边界

- 未删测试、未放宽断言。
- 未改产品组件 / CSP / API 行为。
- 未 push master。

## 结论

Flake 风险点最小加固完成；全量单测 + typecheck 绿后 feature push · DONE in-review。
