# 西江月博客 · 当前待办

> 状态：工程侧可无条件推进的事项已完成；剩余仅为外部账号授权或条件触发。
> 更新：2026-07-18
> 生产域名：`https://incca.ccwu.cc`
> 最新已验证生产提交：见 `docs/launch-baseline.md`（功能基线 `a91a07d`）。
> 延后事项执行手册：[ops-deferred-work-plan.md](./docs/ops-deferred-work-plan.md)
> 自动检查：`pnpm check:ops-readiness`（可选 `-- --live`）

## 外部依赖（需用户授权，禁止代登录）

- [ ] **Google Search Console**：域名级 DNS 验证并提交 `https://incca.ccwu.cc/sitemap.xml`。  
      前置：用户 Google 登录（Agent 已验证生产 SEO 就绪；无服务账号、CF DNS 写权限、浏览器未登录）。  
      剧本：`docs/ops-deferred-work-plan.md` §3 / §10。状态：`blocked_auth`。
- [ ] **Bing Webmaster**：从已验证 GSC 属性导入，不单独重复 DNS。  
      前置：GSC 完成。剧本：§4。状态：`blocked_auth`。
- [ ] **Vercel Speed Insights p75**：回填六页真实用户 p75。  
      工程：layout 已接入且 `hasData=true`；CLI token **无法**导出明细。  
      前置：控制台只读或正式 metrics API；**禁止**用 Lighthouse 代填。状态：`engineering_ready_waiting_samples`。

## 条件触发事项（门槛未到不做）

- [ ] **外部搜索评估**：文章 ≥ 200 或搜索 p95 持续超标后再开 ADR；当前保持 `src/server/search` Fuse。门槛常量：`EXTERNAL_SEARCH_POST_THRESHOLD=200`。
- [ ] **正文图 LQIP**：`public/images/blog/**` 出现首张图后执行 `pnpm gen:blur && pnpm check:blur`（脚本已支持 blog 目录）。
- [ ] **prose/article-ui 下沉**：需 CSS Coverage + 层叠方案证明净收益；当前 about/blog 共享根导入。
- [ ] **Cache Components**：引入外部数据、ISR 或细粒度失效后再评估；见 `docs/cache-components-migration.md`。

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
| 延后事项工程化 | 就绪分类、live SEO 探测、blur 正文目录预埋              | [延后计划](./docs/ops-deferred-work-plan.md) · `pnpm check:ops-readiness`                  |

历史阶段和旧测试数量保留在日期型报告与 `docs/superpowers/runs/` 中，不在本文件重复维护。

## 新工作进入条件

1. 先跑 `pnpm check:ops-readiness`：若轨道是 `blocked_auth` / `not_triggered` / `engineering_ready_waiting_samples`，**不要**开无关大重构。
2. 若用户授权账号操作，只执行对应剧本章节，不做范围外改动。
3. 普通工程改动至少运行：

```bash
pnpm format:check
pnpm format:docs:check
pnpm lint
pnpm typecheck
pnpm check:seo
pnpm check:ops-readiness
pnpm test
pnpm build
```

涉及浏览器交互、响应式、CSP、搜索或部署链路时，再运行 `pnpm test:e2e`。
