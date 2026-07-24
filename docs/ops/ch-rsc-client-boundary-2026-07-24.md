# ops · ch-rsc-client-boundary · 2026-07-24

**模块：** M-CH-rsc-client-boundary · WEEK-BACKLOG **W4**  
**债：** CH-PERF-006 residual（master 已合 `5d5fe87` / integrate `1f52af9`）  
**分支：** `xvyimu/ch-rsc-client-boundary`

## 目标

在已有 Header RSC / Parallax dynamic / Magnetic·Reveal 条件挂载之上，再做 **最小增量**：

1. 条件挂载（reduced-motion / coarse pointer 不拉 parallax chunk）
2. 非关键 UI `dynamic({ ssr: false })` defer
3. scroll 路径 rAF 合并 + reduced-motion 去过渡

## 实现摘要

| 改动                       | 说明                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `SiteBackdropParallaxGate` | hydrate 后读 `prefers-reduced-motion` + `pointer: fine`；仅两者允许时才 `dynamic` 挂 `SiteBackdropParallax` |
| `BackToTopGate`            | 根 layout 经 gate 挂载；chunk `ssr:false`                                                                   |
| `BackToTop`                | scroll → rAF 合并 setState；reduced 时 `transition-none`                                                    |
| `ReadingProgressGate`      | 文章页经 gate；chunk `ssr:false`                                                                            |
| `ReadingProgress`          | reduced 时去掉 width transition                                                                             |

## 明确未做

- links schema / LinksDirectory 大改
- home EditorialHero / 重挂 RevealOnScroll
- MDX CodeBlock / ImageZoom
- search API · proxy/csp · 换 fuse
- MagneticCard 再拆（已条件 pointer）

## 验证

见根 `evidence.md` 命令表。

## 回执字段（总控）

- tip：`3dcd42c`
- 摘要：W4 residual client gates + reduced/fine parallax skip
- 风险：ssr:false 首屏无按钮/进度条；未 build/LH
