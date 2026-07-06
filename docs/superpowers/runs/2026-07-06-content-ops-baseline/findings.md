# 发现记录：内容运营基线与收藏资产系统

## 现状

- 项目已接入 `@vercel/analytics` 和 `@vercel/speed-insights`，根布局通过 `shouldRenderVercelInsights()` 控制生产渲染。
- CI 已包含 `quality`、`bundle-analyze`、`e2e`、`lighthouse`、`deploy`，部署后运行 `pnpm check:production-content`。
- `docs/performance-baseline.md` 已记录 Lighthouse 和 Speed Insights 的刷新流程，但缺少面向上线运营的总基线文档。
- `data/links.json` 已包含 AI、工程文档、云服务、自托管、VPS、博客参考等分类，VPS 分类已经按官网入口去除推广参数。
- `src/lib/links.ts` 目前校验基础字段、URL 格式、追踪/推广参数和 tags 数量；重复 URL、重复分类、空分类主要由页面测试覆盖，尚未进入 `check:seo`。
- `/links` 页面当前展示 host、标题、描述、tags；没有展示“官网入口”“重点推荐”“观察清单”“使用场景”等运营元信息。

## 决策

| 决策                   | 理由                                                            |
| ---------------------- | --------------------------------------------------------------- |
| 运营字段保持可选       | 兼容现有 100+ 条收藏，不强迫一次性补齐所有历史数据              |
| 校验接入 `check:seo`   | 现有 CI 已运行该脚本，能以最小流程成本提升内容质量门禁          |
| 先补核心分类元信息     | VPS、自托管、工程文档、博客参考最贴合当前运营方向，优先形成样板 |
| 不新增独立数据库或 CMS | 当前仍是本地内容驱动，先把 JSON 资产治理扎实                    |

## 需要验证

- 新字段不会破坏旧链接数据。
- `/links` 卡片在移动端不出现文本溢出。
- `pnpm check:seo` 能捕获重复分类、重复 URL、追踪参数和空分类。
- 构建与生产内容烟测仍能通过。
