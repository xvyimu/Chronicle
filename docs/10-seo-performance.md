# 10 · SEO 与性能

> 状态：Draft（Iteration 00）
> 日期：2026-10-06

---

## SEO

| 项            | 现状                                               | 目标                          |
| ------------- | -------------------------------------------------- | ----------------------------- |
| Metadata      | `lib/metadata.ts` + 根 layout `metadataBase`       | 保持                          |
| Canonical URL | 由 `NEXT_PUBLIC_SITE_URL` 派生                     | 保持                          |
| Open Graph    | 根 layout + `opengraph-image.tsx`                  | 保持                          |
| Sitemap       | `app/sitemap.ts`                                   | 保持 + 新增 `/archive` 时同步 |
| robots.txt    | `app/robots.ts`                                    | 保持                          |
| RSS           | `scripts/generate-rss.ts` → `public/feed.xml`      | 保持                          |
| 结构化数据    | `lib/jsonld.ts`（Article/Organization/Website）    | 保持                          |
| 旧 URL 重定向 | 无（slug 冻结，不需重定向）                        | —                             |
| 404           | `app/not-found.tsx`（**链到已删 `/links`，待修**） | 修复死链                      |

**门禁**：`pnpm check:seo`（含 sitemap 覆盖、frontmatter 校验、heading anchor 唯一性）。

---

## 性能

| 项              | 现状                                            | 目标                                 |
| --------------- | ----------------------------------------------- | ------------------------------------ |
| 图片尺寸        | 本地图片 + `next/image`（`remotePatterns: []`） | 保持                                 |
| 字体加载        | `next/font/google`，LCP preload 矩阵            | 保持                                 |
| JS 体积         | 无 bundle 预算 CI 门禁                          | 保持（`check:bundle-budget` 若存在） |
| 页面缓存        | HTML 动态（CSP nonce）；静态资产边缘缓存        | 保持                                 |
| 静态生成        | 105 静态页 + 动态路由                           | 保持                                 |
| Core Web Vitals | Lighthouse mobile CI                            | ≥90                                  |
| 长文章渲染      | MDX + Shiki                                     | 保持                                 |
| 代码高亮加载    | Shiki（`rehype-pretty-code`）                   | 保持                                 |

**测量命令**：`pnpm lh:mobile`（Lighthouse CI）· `pnpm analyze`（bundle analyzer）。

---

## 本轮关注点

1. 视觉重构**不得**引入 CLS（动效只用 opacity/transform）。
2. 搜索为客户端实现，**不得**显著增大首屏 JS（迭代 03 评估懒加载）。
3. 图片策略不变（仍本地 + next/image）。
4. 保持 HTML 动态 + CSP nonce（不为性能放宽安全，ADR-0003）。
