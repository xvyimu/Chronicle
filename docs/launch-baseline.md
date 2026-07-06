# 上线运营基线（2026-07-06）

这份文档记录当前博客项目进入内容运营阶段时的可验证基线。它用于回答三个问题：

- 当前线上版本是否健康
- 后续应该看哪些指标
- 内容资产扩展时有哪些质量门禁

## 1. 当前状态

| 项目             | 当前值                                      | 说明                                                                      |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| 上线功能基线提交 | `0e1fc8f feat: polish content discovery UX` | 已推送并部署                                                              |
| 功能基线 CI run  | `28790352462`                               | [GitHub Actions](https://github.com/xvyimu/blog/actions/runs/28790352462) |
| CI 结论          | `success`                                   | `quality`、`e2e`、`bundle-analyze`、`lighthouse`、`deploy` 全绿           |
| 功能基线 CI 时间 | 2026-07-06 20:07:54 CST 至 20:16:34 CST     | GitHub 返回 UTC，已换算为北京时间                                         |
| 生产域名         | `https://incca.ccwu.cc`                     | `check-production-content` 已验证                                         |
| 生产内容烟测     | 通过                                        | 首页、博客、作品、导航、RSS、Sitemap 均返回 200 并包含本地内容            |
| 当前本地文章     | 14 篇                                       | `content/blog/*.mdx`                                                      |
| 当前本地收藏分类 | 10 类                                       | `data/links.json`                                                         |
| 当前本地收藏链接 | 123 条                                      | 其中 32 条已补运营元信息                                                  |

> 注意：本文件记录的是功能基线提交 `0e1fc8f`，包含收藏页筛选、搜索空状态引导、404/错误页恢复入口等 P2 UX 收尾改动。纯文档刷新提交不改变功能基线，最新流水线状态以 GitHub Actions 为准。

## 2. 线上 Smoke 结果

2026-07-06 本地执行：

```bash
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

结果摘要：

| 页面           | 状态 | 字节数 |
| -------------- | ---- | ------ |
| `/`            | 200  | 134097 |
| `/blog`        | 200  | 115148 |
| `/projects`    | 200  | 76271  |
| `/links`       | 200  | 159442 |
| `/sitemap.xml` | 200  | 11974  |
| `/feed.xml`    | 200  | 106860 |

验收标准：

- 所有核心页面返回 200。
- `content-type` 符合 HTML 或 XML 预期。
- 页面包含本地内容源中的标题、项目、收藏分类或 RSS 条目。
- 失败时先区分是部署尚未生效、环境变量错误，还是内容源缺失。

## 3. 性能与质量门禁

| 门禁          | 当前状态     | 命令或来源                                    |
| ------------- | ------------ | --------------------------------------------- |
| 格式检查      | CI 已通过    | `pnpm format:check`、`pnpm format:docs:check` |
| Lint          | CI 已通过    | `pnpm lint`                                   |
| 单元/集成测试 | CI 已通过    | `pnpm test`                                   |
| 类型检查      | CI 已通过    | `pnpm exec tsc --noEmit`                      |
| SEO/内容检查  | 本轮本地通过 | `pnpm check:seo`                              |
| 生产构建      | CI 已通过    | `pnpm build`                                  |
| E2E           | CI 已通过    | `pnpm test:e2e`                               |
| Lighthouse    | CI 已通过    | `lighthouse.config.js` desktop preset         |
| Bundle budget | 本轮本地通过 | 总静态产物 `1.14 MB / 2.00 MB`                |

Bundle 预算快照：

| 指标            | 当前值   | 预算    |
| --------------- | -------- | ------- |
| 最大 JS chunk   | 272.5 KB | 300 KB  |
| 最大 CSS bundle | 272.5 KB | 300 KB  |
| CSS bundle 总量 | 389.1 KB | 参考值  |
| 总静态产物      | 1.14 MB  | 2.00 MB |

## 4. 真实用户指标

真实用户性能以 Vercel Speed Insights 为准。根布局已经接入：

- `@vercel/analytics/react`
- `@vercel/speed-insights/next`

生产环境渲染条件由 `src/lib/observability.ts` 控制：`process.env.VERCEL === '1'`。

建议每周记录这些 p75 指标：

| 路由                      | LCP p75 | INP p75 | CLS p75 | 样本数 | 备注                  |
| ------------------------- | ------- | ------- | ------- | ------ | --------------------- |
| `/`                       | 待填    | 待填    | 待填    | 待填   | 首页首屏与内容发现    |
| `/blog`                   | 待填    | 待填    | 待填    | 待填   | 搜索与文章索引        |
| `/blog/nextjs-app-router` | 待填    | 待填    | 待填    | 待填   | 文章详情、TOC、代码块 |
| `/projects`               | 待填    | 待填    | 待填    | 待填   | 项目图片和卡片        |
| `/links`                  | 待填    | 待填    | 待填    | 待填   | 收藏目录，链接量最大  |
| `/about`                  | 待填    | 待填    | 待填    | 待填   | 静态内容页            |

行动阈值：

| 指标    | 目标       | 需要调查  |
| ------- | ---------- | --------- |
| LCP p75 | `<= 2.5s`  | `> 3.0s`  |
| INP p75 | `<= 200ms` | `> 300ms` |
| CLS p75 | `<= 0.1`   | `> 0.1`   |

## 5. 内容资产基线

当前内容源：

| 内容源               | 数量           | 说明                         |
| -------------------- | -------------- | ---------------------------- |
| `content/blog/*.mdx` | 14             | 博客文章                     |
| `content/about.mdx`  | 1              | 关于页                       |
| `data/projects.json` | 作品集 JSON    | 首页和作品页使用             |
| `data/links.json`    | 10 类 / 123 条 | 个人收藏、官网入口和参考资料 |

收藏链接可选运营字段：

| 字段          | 用途                                               |
| ------------- | -------------------------------------------------- |
| `official`    | 标记官网或原始权威入口                             |
| `priority`    | `primary`、`reference`、`watchlist` 三档运营优先级 |
| `useCase`     | 用一句话说明为什么收藏、何时使用                   |
| `lastChecked` | 最近人工核对日期，格式 `YYYY-MM-DD`                |

`pnpm check:seo` 已覆盖这些链接资产问题：

- `data/links.json` JSON 解析失败
- schema 校验失败
- 重复分类 id
- 空分类
- 重复 URL（忽略末尾 `/`）
- `utm_*`、`aff`、`ref`、`referral`、`coupon`、`partner` 等追踪或推广参数

## 6. 每次上线前检查

推荐顺序：

```bash
pnpm format:check
pnpm format:docs:check
pnpm lint
pnpm typecheck
pnpm check:seo
pnpm test
pnpm build
pnpm test:e2e
```

部署后：

```bash
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

若只改内容源，最低也要运行：

```bash
pnpm check:seo
pnpm build
```

## 7. 下一次刷新

本文件应在以下情况下更新：

- master 上产生新的生产部署
- 收藏链接数量、文章数量或内容源结构明显变化
- Vercel Speed Insights 有足够真实用户样本
- Lighthouse 或 bundle budget 阈值调整
- CI/CD 流程增加或移除门禁
