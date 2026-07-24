# Evidence · M-CH-rsc-client-boundary · W4 residual (CH-PERF-006+)

**branch:** `xvyimu/ch-rsc-client-boundary`  
**date:** 2026-07-24  
**base tip:** `1f52af9`  
**result tip:** `3dcd42c`  
**node:** v24.16.0 · **WARN** vs engines `22.x`

## 扫描表（master 已有 006 之上再增量）

| 面                                                    | master@1f52af9 状态                                             | W4 增量                                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Header                                                | RSC shell + HeaderScrollState / MobileNav / ThemeToggle islands | **NOOP**（已瘦）                                                                 |
| SiteBackdropStage                                     | server DOM                                                      | **NOOP**                                                                         |
| SiteBackdropParallax                                  | client + reduced/fine gate                                      | 仍保留；**Gate 条件再 dynamic**                                                  |
| SiteBackdropParallaxGate                              | `dynamic(ssr:false)` 总是挂                                     | **仅 fine+!reduce 才 mount** → 触屏/reduced 不拉 parallax chunk                  |
| MagneticCard                                          | reduced + fine 条件 pointer                                     | **NOOP**（已有）                                                                 |
| RevealOnScroll                                        | reduced skip IO                                                 | **NOOP**；home 已不挂（003）                                                     |
| BackToTop                                             | 全站 client 直挂                                                | **BackToTopGate** `dynamic(ssr:false)` + scroll rAF 合并 + reduced 去 transition |
| ReadingProgress                                       | 文章页 client 直挂                                              | **ReadingProgressGate** `dynamic(ssr:false)` + reduced 去 bar transition         |
| ThemeToggle / MobileNav / SearchBar / Garden / Giscus | 交互必需 client                                                 | **NOOP**（不可 RSC）                                                             |
| LinksDirectory                                        | 已 SSR catalog + client filter                                  | **禁改**                                                                         |
| MDX CodeBlock/ImageZoom                               | W3 residual                                                     | **禁改**                                                                         |
| barrel                                                | 无 components index barrel                                      | **NONE**                                                                         |

## 改动文件

- `src/components/layout/SiteBackdropParallaxGate.tsx` (+test)
- `src/components/ui/BackToTop.tsx` · `BackToTopGate.tsx` · test
- `src/components/blog/ReadingProgress.tsx` · `ReadingProgressGate.tsx` · test
- `src/components/layout/client-boundary-gates.test.tsx`
- `src/app/layout.tsx` · `src/app/blog/[slug]/page.tsx` · page.test mock
- `docs/ops/ch-rsc-client-boundary-2026-07-24.md` · 本文件

## 门闩

| 命令             | exit                               |
| ---------------- | ---------------------------------- |
| `node -v`        | v24.16.0 · **WARN**                |
| `pnpm typecheck` | **0**                              |
| `pnpm test`      | **0** · **761** passed / 100 files |
| `pnpm build`     | 未跑（推荐；Node24 WARN）          |

## 风险

- Gate `ssr:false`：首屏无 BackToTop / 进度条 HTML（hydrate 后出现）— 可接受 progressive enhancement。
- ParallaxGate 用 `matchMedia` 再判一次（与 Parallax 内 hook 双层）；reduced/touch 客户端少下一块 JS。
- 未跑 LH / e2e / build。
