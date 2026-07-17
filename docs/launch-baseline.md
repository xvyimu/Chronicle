# 上线运营基线

> 状态：当前维护版（2026-07-17）。历史上线检查见 `launch-readiness-2026-07-10.md`。

## 1. 最新生产证据

| 项目     | 当前值                                     | 证据                                                                      |
| -------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| 生产域名 | `https://incca.ccwu.cc`                    | `NEXT_PUBLIC_SITE_URL` / production smoke                                 |
| 提交     | `8ee2e712b5665c7f0c94770038e581f5621383cd` | `docs: record deferred account-dependent P2 work`                         |
| CI run   | `29573545749`                              | [GitHub Actions](https://github.com/xvyimu/blog/actions/runs/29573545749) |
| CI 结论  | `success`                                  | quality、bundle-analyze、e2e/Lighthouse、deploy/smoke 全绿                |
| 内容规模 | 14 篇文章、6 个项目、10 类 123 条收藏      | 本地 MDX/JSON                                                             |

生产证据是时间点快照。新 master 部署成功后更新本节，不要把历史报告中的提交号复制为当前状态。

## 2. 流水线与发布顺序

```text
quality → e2e（production build + Playwright + Lighthouse）
        → deploy（master push only）→ production content smoke

bundle-analyze（并行、独立，不是 deploy 依赖）
```

- `quality`：依赖审计、代码/文档格式、lint、Vitest、类型、SEO、blur、build、RSS diff、bundle budget。
- `bundle-analyze`：独立构建并上传 `.next/analyze/` artifact，不阻塞 e2e。
- `e2e`：依赖 quality；一次 production build 同时供 48 项 Playwright 和 Lighthouse 使用。
- `deploy`：依赖 quality + e2e；固定 Vercel CLI 56.2.1 上传源码并远端构建，随后检查生产内容。

## 3. 当前质量基线

| 门禁                | 当前证据                                             |
| ------------------- | ---------------------------------------------------- |
| Vitest              | 77 files / 599 tests，2026-07-17 本地通过            |
| Playwright          | 5 files / 48 tests，最新 CI 通过                     |
| TypeScript / ESLint | 最新 CI 通过                                         |
| SEO / blur          | 最新 CI 通过                                         |
| Production build    | 93 个生成条目，document routes 因 nonce 按需动态渲染 |
| Lighthouse          | desktop preset，5 页 × 2 次，最新 CI 通过            |
| Production smoke    | 首页、博客、项目、收藏、RSS、sitemap 等内容检查通过  |

2026-07-17 Node 22 CI production build 的 bundle 快照：

| 指标                   |     当前值 |      预算 |
| ---------------------- | ---------: | --------: |
| 最大 JS chunk          | `222.0 KB` |  `300 KB` |
| 最大 CSS bundle        | `181.8 KB` |  `300 KB` |
| CSS bundle 总量        | `301.4 KB` |    观察值 |
| 总静态产物（不含字体） |  `1.15 MB` | `2.00 MB` |

这是构建产物大小，不是网络传输量。趋势和历史 Lighthouse 见 [performance-baseline.md](./performance-baseline.md)。

## 4. 生产内容 smoke

标准命令：

```bash
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

脚本检查核心 HTML、RSS、sitemap 和本地内容标志。失败时按顺序区分：

1. 部署尚未生效或域名指向旧版本；
2. `NEXT_PUBLIC_SITE_URL` 或 Vercel 环境变量错误；
3. MDX/JSON 未被 output tracing 带入；
4. 页面、feed 或 sitemap 内容回归。

## 5. 内容与性能运营

- 内容 schema、收藏运营字段和发布流程见 [content-workflow.md](./content-workflow.md)。
- 真实用户性能以 Vercel Speed Insights p75 为准：LCP `<=2.5s`、INP `<=200ms`、CLS `<=0.1`。
- 当前没有可验证的真实 p75；没有 token 或样本时保持 pending，不用 Lighthouse 代填。
- GSC/Bing 因用户禁止登录而暂停，恢复前必须重新取得账号授权。

## 6. 上线前后检查

上线前：

```bash
pnpm format:check
pnpm format:docs:check
pnpm lint
pnpm typecheck
pnpm check:seo
pnpm check:blur
pnpm test
pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build
pnpm exec tsx scripts/check-bundle-budget.ts
pnpm test:e2e
```

检查 `public/feed.xml`、`public/feed.json` 和工作树没有意外生成差异。上线后运行 production smoke，并观察 CSP、搜索 API 和关键页面状态。

## 7. 回滚

- 部署故障：在获得生产权限后，将 Vercel 回滚到上一个成功 deployment。
- 代码故障：创建新的 revert commit，走完整 CI；禁止 force push 或重写共享历史。
- 内容故障：修复 MDX/JSON 并至少运行 SEO、build 和 production smoke。
- CSP/环境故障：优先恢复上一份已验证配置，禁止临时加入 `unsafe-inline` 绕过。

更新本文件时必须附上新的提交、CI run、smoke 结论和实测 bundle；缺失任一证据时保留旧基线并标明待验证。
