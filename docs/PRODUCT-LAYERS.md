# Chronicle · 产品分层方案（PRODUCT-LAYERS）

> **组合总纲：** `D:\orca\.planning\portfolio-product-docs-program-2026-07-23\PORTFOLIO-PRODUCT-PROGRAM.md`  
> **形态与栈 SSOT：** [`PROJECT.md`](./PROJECT.md)  
> **tip：** `4dba004` · 视觉 V1a Atelier 结构对齐 · 保留鼠尾草纸感

---

## L0 · 产品身份

| 项           | 内容                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| **一句话**   | **个人博客 + 作品集**（西江月）：MDX 内容、数字花园式信息架构、严格 CSP。   |
| **核心问题** | 如何以低运维成本发布可检索、可 SEO、安全默认的个人站点。                    |
| **主用户**   | **读者** · **作者本人**（内容与主题）                                       |
| **明确不做** | 多租户 CMS SaaS · 运行时 DB 驱动内容 · 为 SSG 牺牲 CSP nonce · 第二前端框架 |
| **价值**     | 内容快照可复现生产 · Vitest/Playwright 门闩 · 主题 token 可演进             |

---

## L1 · 形态与栈

见 PROJECT：Next 16 · React 19 · Tailwind 4 · BEM styles · MDX · fuse · Giscus · Vercel。

---

## L2 · 运行与边界

| 项   | 内容                                               |
| ---- | -------------------------------------------------- |
| 路径 | `D:\Chronicle` · 入口 `D:\projects\Chronicle`      |
| 内容 | 本地 MDX/JSON · 生产 `generated/content-snapshot/` |
| 生产 | https://incca.ccwu.cc                              |
| 安全 | CSP nonce · 不放宽 `unsafe-inline` 全站            |

---

## L3 · 架构与扩展

| 区域             | 说明                                           |
| ---------------- | ---------------------------------------------- |
| `src/app`        | 路由与页面                                     |
| `src/app/styles` | tokens/base/… BEM                              |
| 内容管线         | MDX · frontmatter · snapshot                   |
| 扩展点           | 专题/标签 · 搜索 API · 评论 env                |
| **禁止**         | 另起 Astro/Vue 平行站 · 内容进运行时 DB 无 ADR |

---

## L4 · 验收与质量

| 命令                         | 用途                      |
| ---------------------------- | ------------------------- |
| `pnpm typecheck`             | 类型                      |
| `pnpm test`                  | 单测（~716 级基线随 tip） |
| `pnpm build` / content:build | 构建与快照                |
| check:seo 等                 | 内容/SEO 门闩             |

---

## L5 · 协作与合规

| 项   | 内容                                                                |
| ---- | ------------------------------------------------------------------- |
| 许可 | **MIT**                                                             |
| 安全 | 根 `SECURITY.md`                                                    |
| 贡献 | 根 [`CONTRIBUTING.md`](../CONTRIBUTING.md) · 内容 PR 需说明快照步骤 |

---

## L6 · 路线图与维护

| 周期 | 内容                                         |
| ---- | -------------------------------------------- |
| 近   | 内容与 SEO 稳定 · 视觉 A0/A1 保持            |
| 中   | 花园 IA 打磨 · 性能 CWV                      |
| 远   | 主题扩展（不破坏纸感身份）                   |
| 节奏 | 改 MDX → content:build 提交快照 · Issue 欢迎 |

---

## 文档地图

PROJECT · PRODUCT-LAYERS · architecture · css-conventions · design/atelier-v1a-matrix · API
