# Chronicle

**GitHub：** [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)  
**产品显示名：** 西江月博客  
**本地路径 / package 名：** `D:\projects\Chronicle` · npm private name `chronicle`  
**线上：** https://incca.ccwu.cc  
**许可：** [MIT](./LICENSE)

> 产品品牌为「西江月」；工程与 GitHub 身份统一用 **Chronicle**。  
> **自有工程** · MIT · [LICENSE](./LICENSE) · 非 GitHub fork · 仅 `origin`。  
> 身份卡：[GITHUB_IDENTITY.md](./GITHUB_IDENTITY.md)

基于 Next.js 16 App Router 的个人博客兼作品集：MDX 驱动、本地内容驱动、严格 CSP nonce、中性灰工作台视觉、客户端站内搜索。

## 技术栈

Next.js 16.3 · React 19.3 · TypeScript 5 strict · Tailwind CSS v4 · MDX (next-mdx-remote) · Shiki (rehype-pretty-code) · fuse.js（客户端搜索）· Vitest · Playwright · ESLint 9 · pnpm 11

**形态与栈 SSOT（Agent/立项）：** [`docs/PROJECT.md`](./docs/PROJECT.md) — 个人博客 Web；换栈先改该文档。

## 重构状态（2026-10-06）

以「中性灰 AI 工作台气质内容站」为目标的系统性重构，按 9 个迭代推进（**00–08 全部 Completed**）：

| 迭代 | 名称               | 状态      | 文档                                   |
| ---- | ------------------ | --------- | -------------------------------------- |
| 00   | 审计与基线         | Completed | [docs/iterations/](./docs/iterations/) |
| 01   | 基础设施与设计系统 | Completed | 中性灰 Token + 排版                    |
| 02   | App Shell          | Completed | TopBar + Sidebar + MainPanel + 清死链  |
| 03   | 首页与搜索         | Completed | 工作台首页 + 客户端搜索                |
| 04   | 文章系统           | Completed | 无大图卡片 + 阅读排版                  |
| 05   | 内容导航           | Completed | 归档 + 收藏/最近阅读                   |
| 06   | 质量优化           | Completed | a11y/对比度/清死代码                   |
| 07   | 发布准备           | Completed | 回归 + CHANGELOG + 发布清单            |
| 08   | 代码审核与清理     | Completed | 双轴 review + 修搜索 bug + 同步文档    |

**移除的功能**：评论（Giscus）、数字花园（`/garden`）、收藏导航（`/links`）、服务端搜索 API（`/api/search`）、预览 API（`/api/preview`）。
**新增**：工作台外壳、站内客户端搜索、归档页（`/archive`）、我的阅读（`/favorites`）。

完整决策见 [`docs/14-decision-log.md`](./docs/14-decision-log.md)，验收见 [`docs/15-acceptance-checklist.md`](./docs/15-acceptance-checklist.md)。

## 产品方案与文档地图

| 文档                                               | 用途                                       |
| -------------------------------------------------- | ------------------------------------------ |
| [docs/PRODUCT-LAYERS.md](./docs/PRODUCT-LAYERS.md) | 产品分层 L0–L6 · **L0 身份** · **L4 验收** |
| [docs/PROJECT.md](./docs/PROJECT.md)               | 形态与栈 SSOT                              |
| [CONTRIBUTING.md](./CONTRIBUTING.md)               | 协作 · Issues/PRs                          |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)         | 社区行为准则                               |
| [SECURITY.md](./SECURITY.md)                       | 安全策略与漏洞报告                         |
| [CHANGELOG.md](./CHANGELOG.md)                     | 版本记录（Keep a Changelog）               |

完整索引见 `docs/`。

## 快速启动

```bash
pnpm install
# 复制 .env.example → .env.local 并填写
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

生产请使用 `NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc`。完整说明见 `.env.example`。

## 常用命令

| 命令                            | 作用                                                      |
| ------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                      | 本地开发服务器                                            |
| `pnpm content:build`            | 重建 `generated/content-snapshot/`（改 MDX 后必跑并提交） |
| `pnpm build`                    | RSS + content snapshot + 生产构建                         |
| `pnpm start`                    | 启动生产服务器                                            |
| `pnpm test`                     | Vitest 单元/集成（当前基线 588 测试 / 76 文件）           |
| `pnpm test:e2e`                 | Playwright E2E（当前 46 passed / 5 spec files）           |
| `pnpm typecheck`                | `tsc --noEmit`                                            |
| `pnpm check:seo`                | 内容 / sitemap / SEO 完整性                               |
| `pnpm check:production-content` | 生产内容烟测                                              |
| `pnpm check:docs`               | 文档相对链接检查                                          |
| `pnpm lint`                     | ESLint                                                    |
| `pnpm analyze`                  | Bundle 体积分析                                           |

## 项目结构

```text
.
├─ content/                     # 内容源（SSOT）
│  ├─ about.mdx
│  └─ blog/*.mdx
├─ data/
│  ├─ projects.json             # 作品集
│  └─ links.json                # 收藏数据（已退出路由，物理保留）
├─ generated/content-snapshot/  # T2 构建期快照（生产默认读取；需提交）
├─ docs/                        # 架构 / ADR / 工作流
├─ e2e/                         # Playwright
├─ public/                      # 静态资源、feed.*
├─ scripts/                     # content:build / RSS / SEO / smoke
├─ src/
│  ├─ app/                      # App Router（含 /api/csp-report）
│  ├─ components/               # layout / home / blog / search / projects / ui
│  ├─ lib/                      # posts / content-snapshot / search / reading-state / site
│  ├─ server/                   # content facade + rate-limit
│  └─ types/
├─ .github/workflows/ci.yml     # quality / e2e / deploy（master + PR→master）
├─ AGENTS.md                    # AI 协作约定
├─ CONTRIBUTING.md              # 协作 · CoC 同意
├─ CODE_OF_CONDUCT.md           # 社区行为准则
├─ SECURITY.md                  # 漏洞上报（非 CoC）
├─ CHANGELOG.md                 # 选择性版本记录（完整史见 git）
├─ .editorconfig                # 与 Prettier 对齐
├─ LICENSE                      # MIT · Copyright 2026 雨天狂奔
└─ package.json                 # private · name: chronicle
```

## 路由

| 路由                                                        | 说明                                              |
| ----------------------------------------------------------- | ------------------------------------------------- |
| `/`                                                         | 工作台首页（欢迎区 + 热门主题 + 最近更新 + 搜索） |
| `/about`                                                    | 关于                                              |
| `/blog` · `/blog/[slug]`                                    | 列表与文章                                        |
| `/archive`                                                  | 归档（按年份时间线）                              |
| `/favorites`                                                | 我的阅读（收藏 / 最近阅读，localStorage）         |
| `/projects` · `/projects/[id]`                              | 作品集（id 例：`chronicle`）                      |
| `/series` · `/tags` · `/categories`                         | 专题 / 标签 / 分类                                |
| `/api/csp-report`                                           | CSP 违规上报（唯一公开 API）                      |
| `/feed.xml` · `/feed.json` · `/sitemap.xml` · `/robots.txt` | 订阅与爬虫                                        |

## 功能摘要

- 中性灰工作台外壳（TopBar + 侧栏 + 大圆角主面板）· 明暗主题
- 严格 CSP nonce · HSTS · 无第三方脚本白名单（评论已移除）
- 客户端站内搜索（Fuse；键盘 `/` `Ctrl+K`；URL `?q=`）
- 归档页 · 收藏 / 最近阅读（localStorage，无账号）
- 生产默认 `CONTENT_BACKEND=snapshot`（见 `docs/content-workflow.md`）
- RSS / JSON Feed / Sitemap / PWA manifest

## 内容约定

- 文章：`content/blog/YYYY-MM-主题名.mdx`，slug 去日期前缀
- **改 MDX 后必须** `pnpm content:build`，并提交 `generated/content-snapshot/*`
- 站点配置 SSOT：`src/lib/site.ts`；路径与 Vercel tracing：`src/lib/content-dirs.ts`

## CI / 部署

- GitHub Actions：`push`→`master` 与 `pull_request`→`master`
- quality 含 `content:build` + snapshot `git diff --exit-code`
- deploy 仅 master（Vercel）
- Actions 入口：https://github.com/xvyimu/Chronicle/actions

## 文档索引

- [docs/README.md](./docs/README.md) — 文档导航
- [docs/01-project-audit.md](./docs/01-project-audit.md) — 重构审计
- [docs/04-design-system.md](./docs/04-design-system.md) — 设计系统
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — 架构
- [docs/content-workflow.md](./docs/content-workflow.md) — 内容与 snapshot
- [docs/API.md](./docs/API.md) — CSP 上报契约 + 客户端搜索说明
- [docs/14-decision-log.md](./docs/14-decision-log.md) — 决策日志
- [docs/15-acceptance-checklist.md](./docs/15-acceptance-checklist.md) — 验收清单
- [docs/HANDOFF.md](./docs/HANDOFF.md) — Agent 接手
- [AGENTS.md](./AGENTS.md) — AI 编码约定

## 许可证

源码与随附软件文档采用 [MIT License](./LICENSE)（Copyright © 2026 雨天狂奔）。  
文章若声明独立 `license` frontmatter，以文章声明为准。
