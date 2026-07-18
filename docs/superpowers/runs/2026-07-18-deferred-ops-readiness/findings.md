# 发现记录：延后运营事项工程化

> 快照日期：2026-07-18。当前操作以 `TODO.md` 与 `docs/ops-deferred-work-plan.md` 为准。

## 1. 问题本质

GSC / Bing / Speed Insights p75 / 外部搜索 / 正文 blur / CSS 下沉 / Cache Components  
**不是同一类任务**：

| 类                   | 能否纯工程完成                          |
| -------------------- | --------------------------------------- |
| 账号交互（GSC/Bing） | 否：需要 Google 登录 + DNS 写权限       |
| RUM 数字回填         | 半：组件可接；p75 明细需控制台/专用 API |
| 条件触发             | 否：门槛未到时正确动作是不做事          |

## 2. 最优策略

1. 公开 SEO 面与部署先绿（已完成）。
2. 用 `check:ops-readiness` 自动分类，避免把 `blocked_auth` 当工程 bug。
3. 授权后按 15 分钟剧本执行，不扩大范围。
4. 条件项只写触发条件与 ADR 入口。

## 3. 实现要点

- `src/lib/ops-readiness.ts`：七条轨道状态机 + blur 覆盖 helper
- `scripts/check-ops-readiness.ts`：本地事实 + 可选 `--live`
- `gen:blur` / `check:blur`：projects + blog 图片
- 手册：`docs/ops-deferred-work-plan.md`

## 4. 硬阻塞实测（§10）

| 通道               | 结果                           |
| ------------------ | ------------------------------ |
| 生产 SEO/smoke/CI  | 全绿                           |
| Vercel project API | `speedInsights.hasData=true`   |
| Vercel SI 指标 API | CLI token 多路径 404           |
| Cloudflare zone    | `incca.ccwu.cc` active         |
| CF DNS API         | OAuth 无 DNS 权限              |
| browser-act GSC    | 跳转 Google 登录；禁止代填密码 |

## 5. 非阻塞风险

- `robots.txt` 有 Cloudflare Content-Signal 前缀，末尾仍有本站 Sitemap（GSC 可用）
- SI 首页 HTML 启发式脚本痕迹可为空，不代表未接入
- 文章数用 MDX 文件计数作门槛上界，与 published 过滤可能略有差异
