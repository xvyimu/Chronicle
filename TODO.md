# 西江月博客 · 当前待办

> 状态：工程侧 P0-P10 与前后端逻辑分层已完成；当前仅保留外部依赖或条件触发事项。
> 更新：2026-07-18
> 生产域名：`https://incca.ccwu.cc`
> 最新已验证生产提交：`a91a07d`，CI run `29631593044` 全绿。

## 外部依赖

- [ ] Google Search Console：域名级 DNS 验证并提交 `https://incca.ccwu.cc/sitemap.xml`。前置条件：用户重新授权账号访问；2026-07-17 已明确禁止登录，当前暂停。
- [ ] Bing Webmaster：从已验证的 GSC 属性导入。前置条件同上，不单独登录或绕过授权。
- [ ] Vercel Speed Insights：回填首页、博客、文章、项目、收藏和关于页的真实用户 p75。前置条件：环境具备只读 token 且生产流量样本充足；当前不得用 Lighthouse 或估算值代替。

## 条件触发事项

- [ ] 文章超过 200 篇或搜索 p95 持续超标时，再评估构建期索引或外部搜索；当前 14 篇不引入 Meilisearch/Elasticsearch。
- [ ] 出现真实 `public/images/blog/**` 正文图片后，将 `gen:blur` / `check:blur` 扩展到文章图片；当前没有可处理素材。
- [ ] 有 CSS Coverage 和层叠迁移方案证明收益后，再评估把 `prose.css` / `article-ui.css` 下沉；当前 `prose` 同时服务 about/blog，保持根导入。
- [ ] 引入外部数据、ISR 或细粒度缓存生命周期后，再评估 Cache Components。

## 已完成工作索引

| 范围           | 当前结果                                                | 证据                                                                                       |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 内容与数据架构 | MDX/JSON repository、schema、cache、路由 adapter 已落地 | [架构说明](./docs/architecture.md)                                                         |
| UI 与交互      | shadcn/Radix 原语、Sheet、Popover、搜索、LQIP 已落地    | [前端实施报告](./docs/frontend-ui-optimization-report-2026-07-12.md)                       |
| 搜索与 BEM     | 服务端 Fuse、短 CDN cache、限流、BEM 卫生已落地         | [搜索方案](./docs/bem-search-architecture-2026-07-12.md)                                   |
| 内容 SEO       | 14 篇文章元数据、内链、主题簇和 SEO 检查已完成          | [内容 SEO 计划](./docs/content-seo-plan-2026-07-12.md)                                     |
| 全栈审查       | 可由仓库验证的 P1-P3 事项已收口                         | [全栈审查](./docs/full-stack-audit-2026-07-17.md)                                          |
| 性能           | desktop CI 门禁、mobile 实验室基线、bundle 预算已建立   | [性能基线](./docs/performance-baseline.md)                                                 |
| 逻辑前后端分层 | `src/server` facade、搜索用例分层、模块边界测试已上线   | [run 归档](./docs/superpowers/runs/2026-07-18-frontend-backend-boundary/) · 提交 `a91a07d` |

历史阶段和旧测试数量保留在日期型报告与 `docs/superpowers/runs/` 中，不在本文件重复维护。

## 新工作进入条件

开始新的实现前，先确认它不属于上述外部或条件触发事项，并至少运行：

```bash
pnpm format:check
pnpm format:docs:check
pnpm lint
pnpm typecheck
pnpm check:seo
pnpm test
pnpm build
```

涉及浏览器交互、响应式、CSP、搜索或部署链路时，再运行 `pnpm test:e2e`。
