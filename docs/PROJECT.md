# Chronicle · 形态与技术栈（SSOT）

> **产品显示名：** 西江月博客 · **GitHub：** [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)  
> **本地：** `D:\Chronicle`（入口 `D:\projects\Chronicle`）· **生产：** https://incca.ccwu.cc  
> 全局门闩：`~/CLAUDE.md` §8 · `~/.claude/specs/principle.md`「形态与技术栈」。  
> **本文件 = 本产品形态与唯一技术栈权威。** 换形态/换栈：先 ADR / 改本文 → 人确认 → 再改代码。小修沿用本栈。

---

## 1. 产品形态（唯一）

| 项           | 结论                                                           |
| ------------ | -------------------------------------------------------------- |
| **形态**     | **个人博客 + 作品集网站**（Web）                               |
| **交付**     | Vercel 生产站点；本地 `pnpm dev`                               |
| **内容模型** | 本地 MDX / JSON 驱动；生产默认读 `generated/content-snapshot/` |
| **不是**     | 小程序、原生 APP、桌面客户端、CMS 后台重产品、多租户 SaaS      |

**做 / 不做（形态级）**

| 做                                           | 不做                                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| 博客、专题、作品集、搜索 API、严格 CSP nonce | 运行时数据库驱动内容                                  |
| 数字花园式信息架构、SEO/RSS/OG/PWA           | 为 HTML 全站 SSG 放宽 `script-src` 到 `unsafe-inline` |
| Vitest + Playwright + SEO/内容门闩           | 另起第二前端框架平行实现                              |

---

## 2. 唯一技术栈

| 层     | 技术                                                                            | 约束                                                           |
| ------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 框架   | **Next.js 16** App Router                                                       | 文档以本仓 `node_modules/next` 为准；HTML 动态渲染保 CSP nonce |
| UI     | **React 19** · **Tailwind CSS v4** · BEM 语义 CSS modules（`src/app/styles/*`） | 不引入第二 UI 框架平行栈                                       |
| 语言   | **TypeScript** strict · **Node 22** · **pnpm**                                  |                                                                |
| 内容   | MDX · `next-mdx-remote` · `js-yaml` · local JSON                                | 改 MDX 后 `pnpm content:build` 并提交快照                      |
| 校验   | Zod + frontmatter 解析                                                          |                                                                |
| 搜索   | **fuse.js**（生产 `GET /api/search`）                                           |                                                                |
| 评论   | Giscus（env 可覆）                                                              |                                                                |
| 测试   | Vitest · Playwright                                                             |                                                                |
| 部署   | **Vercel** + GitHub Actions                                                     |                                                                |
| 包管理 | **pnpm**                                                                        | 不用 npm/yarn 当主路径                                         |

实现分层摘要见 [`architecture.md`](./architecture.md)。Agent 短索引：根 [`AGENTS.md`](../AGENTS.md)。

---

## 3. 选型理由（取舍）

- **网站 + Next：** SEO、MDX、Vercel 与内容站匹配；无需桌面/小程序。
- **本地内容 + snapshot：** 无运行时 DB，部署简单；快照保证生产一致。
- **CSP nonce 优先于全站 SSG：** 安全边界不可为缓存牺牲。
- **唯一栈：** 禁止再开 Remix/Astro/Vue 平行站；视觉迭代在现有 React/Tailwind/CSS 内完成。

---

## 4. 防漂移

1. 未读本文 + `AGENTS.md` 不写业务代码（全局门闩）。
2. 不擅自换框架、加第二 CSS-in-JS 体系、引入运行时 DB 作内容源。
3. 换栈/换形态 → ADR + 改本文件 → 确认后再实现。
4. 细节契约：`docs/architecture.md` · `docs/API.md` · `docs/css-conventions.md`。
