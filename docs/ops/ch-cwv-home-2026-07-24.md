# W2 · ch-cwv-home · 首页 LCP 再增量 · 2026-07-24

> Worktree：`ch-cwv-home` · Branch：`xvyimu/ch-cwv-home`  
> 边界：`src/components/home/**` · `src/app/page.tsx` · 测试 mock 支撑 · **未**改 layout font · **未**放宽 CSP · **未** push

## 路径扫描（相对 master 已合 001–003 / 006）

| 候选                                  | 现状                 | 本 wt                                              |
| ------------------------------------- | -------------------- | -------------------------------------------------- |
| Hero `preload` + `fetchPriority=high` | 已合 `75502ce`       | 保留                                               |
| Below-fold 无 `RevealOnScroll`        | 已合；首页 0 引用    | 注释改指 W4；**不**回加 client                     |
| Font dual preload / weight 裁剪       | 已合 `ch-perf-002`   | **不**再改 font 段（无可做最小差）                 |
| ProjectCard priority 抢 LCP           | page 已不传 priority | 不动                                               |
| **再增量**                            | —                    | quality / sizes 分段 / frame aspect-ratio / 测试锁 |

## 代码变更

1. **`EditorialHero.tsx`**
   - `HERO_QUALITY`: **70 → 65**（导出常量；源 PNG 1600×900 ≈298KB，压优化面字节）
   - `HERO_SIZES`: `(max-width: 767px) 100vw, (max-width: 1023px) 92vw, 420px`（对齐 home 断点）
   - image-frame 内联 `aspectRatio: '16 / 9'`（源比例；paint 前锁框，抑 CLS）
   - `decoding="async"`
2. **`page.tsx`**：更新 below-fold 无 Reveal 注释（指向 WEEK W4，非 006 residual）
3. **测试**：mock 暴露 `data-quality` / `data-sizes`；断言 quality/sizes/decoding + frame 比例

## 门闩（命令 + exit）

| #   | Command                                                                     | Exit  | Notes                                        |
| --- | --------------------------------------------------------------------------- | ----- | -------------------------------------------- |
| 1   | `pnpm typecheck`                                                            | **0** | Node **v24.16.0** engine WARN（wanted 22.x） |
| 2   | `pnpm test`                                                                 | **0** | **98** files · **750** tests                 |
| 3   | `pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` | **0** | 108 routes；Node24 engine WARN               |

LH `/`：本 wt **未**重跑（无稳定数字不写）。

## 残留 / 风险

- 源 `blog.png` 仍 ~298KB 未改文件本体（换 WebP 源属资产波 / W3 边缘，本边界只动 next/image 参数）
- display 字体仍全站 preload（见 CH-PERF-002 评估；css-route / W6）
- 风险一句：**quality 65 略降画质，poster 级预览可接受；无新 LH 数字证明 LCP 改善**
