# 发现记录：前后端逻辑分层优化

> 快照日期：2026-07-18。当前行为以源码与维护文档为准。

## 1. 背景结论

- 项目为本地 MDX/JSON 驱动的单一 Next.js 应用，无运行时数据库。
- 全栈审查认为 ContentSource → repository/cache → query/search → route 边界健康；当前 14 篇文章规模不适合独立后端或搜索集群。
- 问题在于**逻辑边界未显式化**：页面直读 `src/lib/*` repository，搜索引擎与限流与共享契约混在 `src/lib/search`，客户端误引服务端实现缺少自动化门禁。

## 2. 架构决策

| 选项                       | 结论                         |
| -------------------------- | ---------------------------- |
| 同仓 `src/server` 逻辑分层 | **采用**                     |
| 拆独立前后端部署           | 拒绝（CORS、部署、同步成本） |
| 只补文档不补门禁           | 拒绝（无法阻止误引）         |

依赖方向：

```text
components/hooks -> lib/search（DTO/常量/投影）+ HTTP
app (RSC/RH)     -> server/content | server/search
server           -> lib（repository/schema/cache/shared）
```

## 3. 关键实现

### 服务端内容 facade

- `src/server/content/index.ts`：对 posts/projects/links/about/tags/categories/series 的薄委托导出
- 15 个 App Router 入口只改内容读取 import，其他纯 `src/lib` 依赖保留

### 服务端搜索

- `src/server/search/engine.ts`：Fuse + WeakMap 按数组引用缓存
- `src/server/search/rate-limit.ts`：进程内 60/60s，仅信 `x-vercel-forwarded-for`
- `src/server/search/service.ts`：`searchPublishedPosts` = content facade + cached engine
- 旧 `src/lib/search/engine|rate-limit` **删除且无兼容重导出**

### 共享契约

- `src/lib/search` 仅：`options` / `types` / `project` / barrel
- 客户端 `useFuseSearch` / `useServerSearch` 仍只依赖共享层与 HTTP

### 门禁

- `src/lib/module-boundaries.test.ts`：扫描生产源码；fixture 证明可检出 alias、相对路径、export-from、字面量 dynamic import

## 4. Search API 不变量（验证保持）

- `runtime = nodejs`
- 限流先于 query 校验
- 空查询 200 空响应
- `QUERY_TOO_LONG` / `RATE_LIMITED` / `SERVER_ERROR` 行为与缓存头不变
- wire item 不含 `searchText` / headings / wordCount

## 5. 验证证据

| 层级                                           | 结果                                         |
| ---------------------------------------------- | -------------------------------------------- |
| 本地定向                                       | 6 files / 31 tests PASS                      |
| 本地全量 Vitest                                | 81 files / 618 tests PASS                    |
| 本地 e2e                                       | 48 tests PASS                                |
| typecheck / lint / format / docs / seo / build | PASS                                         |
| CI run `29631593044`                           | quality + bundle-analyze + e2e + deploy 全绿 |
| 生产 smoke `https://incca.ccwu.cc`             | PASS（含 search JSON）                       |

## 6. 环境备注

- 本机 Node 24.x 对 engines `22.x` 有 warning；CI 使用 Node 22。
- 本地 shell 若 PATH 缺 `System32`，`check-doc-links-script` 可能 `spawnSync cmd.exe ENOENT`；补 PATH 后通过，非产品回归。
- 本地 `pnpm build` 在未注入生产 `NEXT_PUBLIC_SITE_URL` 时会把 feed URL 写成 localhost；生产 CI 使用正确站点 URL。归档时工作树 feed 保持生产基线。

## 7. 非阻塞风险

- 边界扫描不覆盖非字面量动态拼接 import（规格已声明）
- 限流仍是 isolate 局部（原有语义）
- GSC/Bing/Speed Insights 等外部账号事项仍在 TODO，与本轮无关
