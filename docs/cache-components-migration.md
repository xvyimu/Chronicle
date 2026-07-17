# Cache Components 迁移指南

> 状态：条件性指南（2026-07-17）。当前项目未启用 `cacheComponents`，不应直接复制未来迁移示例到生产代码。

## 当前缓存模型

业务数据全部来自本地 MDX/JSON：

```text
ContentSource
→ posts / JSON repository
→ createCache<T>
→ Server Components / Search API
```

`createCache<T>` 的实际行为：

- 开发与测试：有 `watchPath` 时，以目录文件列表和 mtime 组成签名，新增、删除、重命名或修改后失效。
- 生产：首次 `getOrCompute()` 后驻留在当前进程，不主动按时间过期。
- 测试：替换 ContentSource 前后调用 `resetAllCaches()`，避免跨用例读取旧值。
- JSON repository：生产默认 strict，缺文件或 JSON 语法错误抛出；开发/测试默认 lenient 并返回 fallback；schema 错误始终抛出。

由于每请求 CSP nonce 仍要求动态 HTML，启用 Cache Components 也不会自动把全站恢复成 SSG。

## 何时重新评估

满足至少一项时再建立迁移 ADR：

- 页面引入 GitHub、数据库或其他外部异步数据源。
- 不同数据需要明确的 stale、revalidate、expire 生命周期。
- 需要按 tag/path 主动失效，而不是随部署更新本地内容。
- `createCache<T>` 的进程级生命周期造成可观测的陈旧数据或重复计算。
- Next.js 升级后，现有 nonce/CSP 与 Cache Components 有经过验证的兼容路径。

仅“想使用新 API”或当前 14 篇本地文章，不构成迁移理由。

## 迁移步骤

1. 写 ADR：列出数据源、缓存一致性要求、失效入口、错误策略和回滚方案。
2. 在独立分支启用 `cacheComponents: true`，先构建不改业务的兼容性基线。
3. 选择一个外部、只读、低风险数据切片试点；不要先改 posts/projects/links 全部 repository。
4. 根据当前安装的 Next.js 版本核对 `use cache`、`cacheLife`、`cacheTag`、`revalidateTag` 和 Suspense 约束。
5. 为动态数据提供明确的 Suspense fallback、超时和错误降级。
6. 证明新缓存覆盖旧职责后，再逐个 repository 移除对应 `createCache<T>`；迁移期间避免双缓存。
7. 验证开发更新、生产部署、按需失效、并发请求、错误恢复和回滚。

## 验收标准

- 缓存命中、失效和陈旧窗口有可观察证据，不依赖主观判断。
- 本地内容编辑在开发环境仍能及时反映。
- 生产缺失/损坏内容继续 fail-fast，不因缓存返回空页面。
- CSP nonce、Giscus、Analytics、搜索 API 和动态路由没有行为回归。
- `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm test:e2e` 全绿。
- 迁移前后 TTFB、函数调用或外部 API 调用量有同口径对比。

## 风险与回滚

| 风险                   | 控制                                             |
| ---------------------- | ------------------------------------------------ |
| 双缓存导致陈旧数据     | 一个数据切片只能有一个最终缓存 owner             |
| 动态数据缺少 Suspense  | 构建和浏览器测试覆盖 loading/error 路径          |
| 错误被缓存             | 明确失败响应是否缓存，生产错误默认 fail closed   |
| nonce 动态渲染收益有限 | 先测量 TTFB/调用量，再决定是否扩大迁移           |
| Next API 语义变化      | 按锁定的 Next 版本核对官方 API，不依据旧文档猜测 |

回滚方式是关闭 `cacheComponents` 并恢复试点 repository 的 `createCache<T>` 路径。未完成全量验证前，不移除现有缓存实现。
