# 西江月博客 · Agent 接手指南

> 状态：当前维护版（2026-10-07，Iteration 07 后）。详细模块说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)，当前未完成事项只以根 [TODO](../TODO.md) 为准。文档导航见 [docs/README.md](./README.md)。
>
> **2026-10-07 大版本重构**：站点视觉改为 AI 工作台气质（中性灰 + 大留白），删除评论（Giscus）/ 数字花园 `garden` / 收藏导航 `links` / 服务端搜索 `/api/search` 与 `/api/preview`，搜索改为客户端 Fuse，新增归档 `/archive` 与我的阅读 `/favorites`。改动在分支 `feature/architecture-rebuild-2026-10-06`（未合并）。详见 [迭代记录](./iterations/) 与 [ADR-0007](./adr/0007-workspace-rebuild-baseline.md)。

## 下一步（直接做，勿重问范围）

**当前待办只维护在根 [`TODO.md`](../TODO.md) —— 本文件不建第二份待办。** 接手时：

1. 读 [`TODO.md`](../TODO.md)，那是唯一待办源。
2. 读本文件 §6「当前剩余边界」——那里是**已知阻塞**，不是待办。
3. 若两者冲突，以 `TODO.md` 为准。

## 0. 仓库身份

| 项      | 值                                                                   |
| ------- | -------------------------------------------------------------------- |
| GitHub  | **[xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)**          |
| 产品名  | 西江月博客                                                           |
| 本地    | 真路径 `D:\projects\Chronicle` · package name `chronicle`（private） |
| 生产    | https://incca.ccwu.cc                                                |
| LICENSE | MIT · Copyright 2026 雨天狂奔                                        |

## 1. 接手顺序

1. 读取根 `AGENTS.md`、`README.md`、`TODO.md` 和本文件。
2. 运行 `git status --short`，保留所有既有改动，不清理未知文件。
3. 读取与任务直接相关的源码、测试和对应维护文档。
4. 小步修改，先跑受影响检查，再跑与风险匹配的完整门禁。
5. 提交、推送、部署、账号登录、DNS 和生产配置变更必须重新取得用户确认。

## 2. 当前生产基线

| 项目           | 当前证据                                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 生产域名       | `https://incca.ccwu.cc`                                                                                                                                         |
| origin/master  | **`692e7b3`**（`feature/architecture-rebuild-2026-10-06` 尚未合并；重构改动全部在工作区未提交）                                                                 |
| GitHub Actions | master 主 CI **最近数次为 failure**（2026-09-30 起，Dependabot 依赖升级提交）。接手前需先查 [Actions](https://github.com/xvyimu/Chronicle/actions) 确认当前状态 |
| 内容规模       | 20 篇文章、6 个项目；`data/links.json` 保留 10 类 123 条但**已无消费方**（收藏导航功能已删）                                                                    |
| Vitest         | **72 files / 547 tests**（2026-10-07 本机实测 `npx vitest run` exit 0）                                                                                         |
| Playwright     | 5 spec files / 46 tests                                                                                                                                         |
| Node / pnpm    | Node **≥24**（`package.json` engines）· 本机 v24.16.0 / pnpm 11.8.0                                                                                             |
| 延后运营       | GSC/Bing/RUM pending；手册 `docs/ops-deferred-work-plan.md`；`pnpm check:ops-readiness`                                                                         |
| SRI            | **生产已开**（`ENABLE_SRI=1`）· 静态 chunk `integrity="sha384-…"` · CSP nonce 仍在                                                                              |

生产证据是时间点快照。接手时仍需用当前 `git log`、CI 和命令重新确认，不要把本表当作永久真值。

## 3. 不可破坏的架构边界

- HTML 因每请求 CSP nonce 动态渲染；不要为 SSG 放宽 `script-src` 到 `unsafe-inline`。
- 本地内容路径由 `src/lib/content-dirs.ts` 统一定义，MDX/JSON 通过 repository 和 Zod schema 读取。
- 页面与 Route Handler 的内容读取经 `src/server/content`；底层 repository/cache 仍在 `src/lib/`，不复制第二套实现。
- 缓存统一使用 `createCache<T>`；测试替换 ContentSource 后调用 `resetAllCaches()`。
- `globals.css` 不承载本地 CSS `@import` 链。全局语义 CSS 由根 layout 显式导入（`tokens` / `base` / `components` / `controls` / `backdrop` / `animations` / `workspace` / `responsive`），路由专属样式（`home` / `archive` / `blog-ui` / `article-ui` / `prose` / `reading` / `project-detail`）由最近路由入口导入。
- 搜索为**纯客户端**：`src/lib/search/`（类型 + Fuse 引擎）+ `src/components/search/SearchPanel.tsx`（客户端岛）。无 `/api/search`、无服务端搜索引擎、无往返；索引来源为文章元信息。规模触发评估见 [ADR-0006](./adr/0006-search-engine-keep-fuse.md)。
- CSP 违规仅 collect-only：`POST /api/csp-report` + `proxy.ts` 的 `report-to`/`report-uri`；不落库、不回显、不放宽指令。该端点是**唯一**的 Route Handler。
- 客户端与 `src/lib` 不得导入 `@/server`；由 `src/lib/module-boundaries.test.ts` 守门。
- 图片默认只允许本地资源，`next.config.ts` 的 `remotePatterns` 保持为空，除非明确审核远程主机。

## 4. 常用修改落点

| 需求             | 首要文件                                                                                | 必须联查                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 新增文章         | `content/blog/*.mdx`                                                                    | schema、SEO、RSS、sitemap、内链、`pnpm content:build`                                        |
| 修改项目         | `data/projects.json`                                                                    | `src/lib/projects.ts`、图片、项目页测试                                                      |
| 新增路由         | `src/app/**`                                                                            | metadata、导航、sitemap、测试                                                                |
| 修改搜索         | `src/lib/search/`、`src/components/search/SearchPanel.tsx`                              | 引擎测试、组件测试、导航/`module-boundaries`                                                 |
| 修改阅读状态     | `src/lib/reading-state.ts`、`src/components/blog/{ReadingActions,LocalReadingList}.tsx` | `/favorites` 页测试、`safeLocalStorage` 容错                                                 |
| 修改 CSP / 上报  | `src/proxy.ts`、`src/app/api/csp-report/`                                               | layout、`src/lib/csp.ts`、API.md、ADR                                                        |
| 修改 SRI 门控    | `next.config.ts`（`ENABLE_SRI`）                                                        | ADR `0005-sri-over-nonce-evaluation.md`                                                      |
| 修改内容读取入口 | `src/server/content`、相关 `src/app/**` 页面                                            | 底层 `src/lib/*` repository、页面测试 mock 路径                                              |
| 修改视觉 token   | `src/app/styles/tokens.css`                                                             | 明暗主题、CSS 规范、移动端与截图检查                                                         |
| 修改 CI/部署     | `.github/workflows/ci.yml`                                                              | **CI 仍钉 Node 22，而 `engines` 已是 `>=24`（已知矛盾，见 §6 R8）**、RSS 一致性、smoke、回滚 |

## 5. 验证矩阵

| 变更类型         | 最低验证                                                         |
| ---------------- | ---------------------------------------------------------------- |
| 仅文档           | `pnpm format:docs:check`、`pnpm check:docs`、`git diff --check`  |
| 内容/JSON        | 上述 + `pnpm check:seo`、`pnpm content:build`、`pnpm build`      |
| TypeScript/组件  | `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、受影响测试   |
| 路由/交互/响应式 | 上述 + `pnpm test`、`pnpm test:e2e`                              |
| 构建/CSS/性能    | 上述 + `pnpm build`、bundle budget、必要的 Lighthouse/浏览器验证 |
| 部署             | 完整 CI + `pnpm check:production-content`，且需要用户授权        |

生产构建必须提供非 localhost 的 `NEXT_PUBLIC_SITE_URL`。`pnpm build` 会重写 `public/feed.xml` 和 `public/feed.json`；构建后检查这两个文件没有意外 diff。

## 6. 当前剩余边界

- GSC/Bing：用户禁止登录，暂停属性验证与 sitemap 提交；授权后按 [ops-deferred-work-plan.md](./ops-deferred-work-plan.md) 执行。
- Speed Insights：真实 p75 需要授权 token 和足够样本，不能用实验室 Lighthouse 代替。
- 外部搜索、正文图 LQIP、Cache Components 和 CSS 深度下沉均有明确规模或素材触发条件，见 [TODO](../TODO.md) 与 `pnpm check:ops-readiness`。T4 已 ADR：**维持 Fuse**（`docs/adr/0006-search-engine-keep-fuse.md`）。
- SRI：生产 **已启用**（2026-07-22）；ADR Accepted。回滚=去掉 Production `ENABLE_SRI` 后 redeploy。与 PPR 仍分轨。
- **R8（CI Node 版本）**：`package.json` `engines` 已改 `>=24`，但 `.github/workflows/ci.yml` 仍钉 `node-version: 22`。CI 上 `pnpm install` 会出现 `Unsupported engine` warning，与验收「无 engine warning」冲突。**未修**（本轮不动 CI）。
- **Giscus 已删**：评论功能与 `csp.ts` 的 giscus.app 白名单均已移除（ADR 见迭代 06）。旧文档若提到「Discussions 开 / JS chunk 含仓名」均已失效。
- 延后事项不得伪装成无条件工程任务；就绪状态以 `check:ops-readiness` 为准。

## 7. 文档规则

- 当前操作以 [文档索引](./README.md) 中「当前维护文档」为准。
- 日期型审查、spec 和 `docs/archive/superpowers-runs/`、`docs/archive/` 是历史快照，其中的旧测试数和未勾选项不是当前待办。
- 行为描述必须先读源码；接口参数、错误码和命令不得凭旧报告补写。
- 改动当前行为后，在同一批次同步对应维护文档。
