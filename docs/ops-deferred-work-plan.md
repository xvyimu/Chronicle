# 运营延后事项深度计划

> 状态：当前维护版（2026-07-18）  
> 范围：根 `TODO.md` 中**外部账号**与**条件触发**事项  
> 原则：不伪造流量、不绕过账号授权、不提前引入 Meili/ES/Cache Components

本文件是执行手册。自动就绪检查：

```bash
pnpm check:ops-readiness
pnpm check:ops-readiness -- --live
pnpm check:ops-readiness -- --live --json
```

## 1. 决策总表

| 轨道             | 当前最优动作                          | 依赖                       | 禁止                       |
| ---------------- | ------------------------------------- | -------------------------- | -------------------------- |
| GSC              | 授权后 15 分钟域名验证 + 提交 sitemap | 用户 Google 账号           | 禁止代登录、禁止假“已提交” |
| Bing             | GSC 成功后导入                        | 同一授权窗口               | 禁止单独再走一遍 DNS       |
| Speed Insights   | 代码已接入；授权后回填六页 p75        | Vercel 只读权限 + 足够样本 | 禁止用 Lighthouse 代填 p75 |
| 外部搜索         | 保持 `src/server/search` Fuse         | ≥200 文或搜索 p95 证据     | 禁止未评估上 Meili/ES      |
| 正文图 LQIP      | 目录预埋；有图再 gen:blur             | `public/images/blog/**`    | 禁止对文字做 blur          |
| prose 下沉       | 保持根导入                            | Coverage + 层叠方案        | 禁止无证据搬迁             |
| Cache Components | 保持关闭                              | 外部数据/ISR/失效需求      | 禁止“为了新 API”开启       |

## 2. 执行优先级（有授权时）

```text
P0 生产公开 SEO 面健康（sitemap/robots/home）  ← 已由 CI + check:ops-readiness --live 守门
P1 Google Search Console 域名验证 + 提交 sitemap
P2 Bing Webmaster 从 GSC 导入
P3 Speed Insights 六页 p75 只读回填（样本不足则 pending）
P4 条件触发项：仅当门槛命中再开 ADR
```

没有账号授权时，**不要**再开工程大改；只维护就绪门禁与文档。

## 3. GSC 15 分钟剧本（需用户在场）

前置：

- 生产域名 `https://incca.ccwu.cc` 可访问
- `pnpm check:ops-readiness -- --live` 退出 0
- 用户明确授权 Google 账号登录

步骤：

1. Search Console → 添加资源 → **域名**属性 `incca.ccwu.cc`（优先域名级，覆盖子路径）。
2. 按提示添加 DNS TXT 记录（在域名 DNS 控制台，不是改本仓库）。
3. 验证通过后进入资源 → Sitemaps → 提交：

   ```text
   https://incca.ccwu.cc/sitemap.xml
   ```

4. 记录：验证日期、sitemap 状态（成功/待处理）、截图位置（用户自有盘，不入库密钥）。
5. 更新 `docs/launch-baseline.md` 的 GSC 行：日期 + 状态（仍不要写入账号 cookie/token）。

失败回退：

- DNS 未生效：等 TTL，不重复提交多种验证方式造成冲突。
- sitemap 报错：先跑 `pnpm check:seo` 与 production smoke，修内容后再提交。

## 4. Bing 剧本（接在 GSC 后）

1. Bing Webmaster → 从 Google Search Console 导入已验证属性。
2. 确认 sitemap 出现且无 critical 错误。
3. **不要**再单独做一轮 HTML 文件验证，除非导入失败。

## 5. Speed Insights p75 回填剧本

工程现状：

- `src/app/layout.tsx` 在 `VERCEL=1` 时渲染 `@vercel/analytics` 与 `@vercel/speed-insights`
- 本地开发默认不注入，避免污染实验室数据

回填页（与 performance-baseline 一致）：

| 页面     | path                                      |
| -------- | ----------------------------------------- |
| Home     | `/`                                       |
| Blog     | `/blog`                                   |
| Article  | `/blog/nextjs-app-router`（或当前代表文） |
| Projects | `/projects`                               |
| About    | `/about`                                  |
| Links    | `/links`                                  |

字段目标：LCP ≤ 2.5s、INP ≤ 200ms、CLS ≤ 0.1（p75）。

规则：

1. 样本不足或无只读权限 → 表格写 `pending`，**不**抄 Lighthouse。
2. 有权限时只读控制台/API，把六页 p75 写入 `docs/performance-baseline.md` 新小节，并注明日期与样本窗口。
3. 若字段明显差于目标，先开性能 issue，不在本文件直接改架构。

## 6. 条件触发细则

### 6.1 外部搜索（≥200 文或 p95）

当前：14 篇，`src/server/search` + `GET /api/search`。

触发后最小评估清单：

1. 当前搜索 p95 / 错误率 / 限流 429 比例
2. 构建期索引 vs 运行时引擎的运维成本
3. 隐私：是否上传全文到第三方
4. 回滚：保留 Fuse 路径至少一版

未触发前禁止安装 Meilisearch/Elasticsearch 依赖。

### 6.2 正文图 LQIP

- 图片目录：`public/images/blog/`
- `pnpm gen:blur` 已扫描 projects + blog
- `pnpm check:blur` 在 blog 有文件时强制覆盖

触发：目录出现首张图 → gen:blur → check:blur → MDX 用 `next/image` 引用 map。

### 6.3 prose/article-ui 下沉

保持根 layout 导入，直到同时满足：

1. Chrome CSS Coverage 证明 about/blog 可安全拆分
2. 有层叠顺序与回归测试方案
3. 独立 ADR 获批

### 6.4 Cache Components

见 `docs/cache-components-migration.md`。当前 nonce 动态 HTML + 本地内容模型下默认关闭。

## 7. 自动化门禁语义

`pnpm check:ops-readiness`：

| 检查                                 | 失败时                              |
| ------------------------------------ | ----------------------------------- |
| 项目 blur 覆盖                       | exit 1                              |
| robots 源声明 sitemap                | exit 1                              |
| Speed Insights 接线                  | exit 1                              |
| `--live` 下 sitemap/robots/home 回归 | exit 1                              |
| GSC/Bing 未授权                      | 报告 `blocked_auth`，**不**因此失败 |
| 文章 < 200                           | 报告 `not_triggered`，不失败        |

建议在授权操作前、发布后各跑一次 `--live`。

## 8. 本轮已落地的工程动作

1. 新增 `src/lib/ops-readiness.ts` + 测试 + `pnpm check:ops-readiness`
2. 扩展 `gen:blur` / `check:blur` 支持 `public/images/blog`
3. 本计划文档与 TODO/基线索引同步

未做（有意）：

- 任何 Google/Bing/Vercel 登录
- 伪造 p75
- 引入外部搜索或 Cache Components

## 9. 2026-07-18 推荐执行实测

自动部分（无需账号）已全部跑通：

| 检查                                 | 结果                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| `pnpm check:ops-readiness -- --live` | exit 0                                               |
| production content smoke             | pass                                                 |
| CI `96e0214` run `29632273522`       | success                                              |
| 生产 sitemap                         | 200，含 urlset                                       |
| 生产 robots                          | 200，含 `Sitemap: https://incca.ccwu.cc/sitemap.xml` |
| Vercel 生产项目                      | `aijiai520/blog` → `https://incca.ccwu.cc` Ready     |

说明：

- `robots.txt` 在源站规则前带有 **Cloudflare Managed Content-Signal** 前缀；末尾仍有本站 `Allow/Disallow/Host/Sitemap`，GSC 可正常使用。
- Speed Insights 组件仅在 `VERCEL=1` 时注入；首页 HTML 启发式脚本痕迹可为空（异步加载），**不**据此判定未接入。
- 本地 Vercel CLI 已登录组织 `aijiai520`，可看部署与 env 名，但**没有** Speed Insights 指标导出 token；p75 仍须控制台只读或正式 API token。

### 仍需用户在场的 15 分钟窗口

打开（需你自己登录，Agent 不代登）：

1. GSC：https://search.google.com/search-console
   - 添加**域名**资源：`incca.ccwu.cc`
   - 按提示加 DNS TXT → 验证
   - Sitemaps 提交：`https://incca.ccwu.cc/sitemap.xml`
2. Bing：https://www.bing.com/webmasters
   - 从 GSC 导入同一属性
3. Vercel Speed Insights：https://vercel.com/aijiai520/blog/speed-insights
   - 只读六页 p75；样本不足写 `pending`，禁止抄 Lighthouse

完成后把「验证日期 / sitemap 状态 / 是否有 p75」发回，再更新 `launch-baseline.md` 与 `performance-baseline.md`。

## 10. 2026-07-18 Agent 全自动推进结果

用户要求 Agent 自行完成。已穷尽本机可用登录态与 API，**工程侧收口完毕**；账号交互仍被硬阻塞。

| 通道                            | 探测结果                              | 结论                                         |
| ------------------------------- | ------------------------------------- | -------------------------------------------- |
| 生产 SEO / smoke / CI           | 全绿                                  | 可继续 GSC 提交                              |
| Vercel CLI + project API        | `speedInsights.hasData=true`，id 存在 | 组件与数据管道已开                           |
| Vercel Speed Insights 指标 API  | 多路径 404 `not_found`                | CLI token **无法**拉 p75 明细                |
| Cloudflare wrangler             | 已登录；zone `incca.ccwu.cc` active   | 账号能看到 zone                              |
| Cloudflare DNS API              | `Authentication error` (10000)        | OAuth **无 DNS 写/列权限**，不能代加 GSC TXT |
| browser-act `seo-console-admin` | 打开 GSC → 跳转 Google 登录页         | Profile **未登录** Google，禁止代填密码      |
| gcloud / GSC 服务账号           | 本机不存在                            | 无法 API 提交 sitemap                        |
| Bing API key                    | 不存在                                | 且依赖 GSC                                   |

因此当前正确终态：

1. **不要再改产品代码**去“假装完成”收录或 p75。
2. 条件触发项继续 `not_triggered`。
3. 唯一剩余人工动作：一次 Google 登录（GSC）+ 可选 Vercel 控制台看一眼 p75。
4. 若希望下次 Agent 可代写 DNS TXT：在 Cloudflare 提供带 `Zone.DNS Edit` 的 API token（用户创建后注入环境，勿提交仓库）。
