# Evidence · M-CH-a11y-smoke · 2026-07-24

| 项               | 值                                                 |
| ---------------- | -------------------------------------------------- |
| Module           | M-CH-a11y-smoke · WEEK-BACKLOG W8                  |
| Branch           | `xvyimu/ch-a11y-smoke`                             |
| Base tip (start) | `1f52af9` integrate: xvyimu/ch-perf-links          |
| Scope            | shell a11y 小 diff · vitest · docs/ops             |
| Forbidden        | 视觉大洗 · CSP 放宽 · 换栈 · push master · 大改 IA |

## Commands + exit codes

| #   | Command          | Exit  | Result                          |
| --- | ---------------- | ----- | ------------------------------- |
| 1   | `pnpm typecheck` | **0** | `tsc --noEmit` clean            |
| 2   | `pnpm test`      | **0** | 99 files · **755** tests passed |

## Diff surface

```
src/app/layout.a11y.test.tsx          (new)
src/app/styles/base.css               (skip-link focus-visible)
src/components/layout/Header.tsx
src/components/layout/Header.test.tsx
src/components/layout/Footer.tsx
src/components/layout/Footer.test.tsx
src/components/ui/ThemeToggle.tsx
src/components/ui/ThemeToggle.test.tsx
src/components/ui/BackToTop.tsx
src/components/ui/BackToTop.test.tsx
docs/ops/ch-a11y-smoke-2026-07-24.md  (new)
evidence.md                           (this file)
```

## Detail

见 `docs/ops/ch-a11y-smoke-2026-07-24.md`。

## Status

**DONE · in-review**（feature push 后）
