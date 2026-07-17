# Codex 全栈代码审查与优化报告 - 2026-07-13

> 历史快照：本报告记录 `ec110f0` 基线上的发现；后续处置见 `docs/full-stack-audit-2026-07-17.md`，当前状态见 `docs/handoff-to-agent.md`。

## 1. 审查结论

- 项目：`D:\blog`，西江月博客，Next.js 16.2 + React 19 + TypeScript + shadcn/ui。
- 线上域名：`https://incca.ccwu.cc`。
- Git 基线：`ec110f0`。
- 审查范围：前端、Route Handler/API、内容数据层、架构、测试、依赖、构建与部署配置。
- 最终状态：无未解决 P0；本轮修复原 P0 1 项、P1/P2 相关问题 9 项；保留 P1 建议 2 项、P2 建议 10 项。
- 数据库说明：项目没有运行时数据库，数据来自 `content/blog/*.mdx`、`data/projects.json` 和 `data/links.json`，因此“数据库查询效率”按文件读取、缓存、搜索索引和数据校验评估。

## 2. 验证结果

| 验证项                 | 最终结果 | 证据摘要                                                         |
| ---------------------- | -------- | ---------------------------------------------------------------- |
| `git log --oneline -5` | 通过     | HEAD 为 `ec110f0`，前序包含 P8 搜索/CSP/CI 改动                  |
| `pnpm test`            | 通过     | 76 个文件，588 个测试全部通过                                    |
| Playwright             | 通过     | Chromium 47/47；搜索、移动端、标签、RSS、导航均通过              |
| ESLint                 | 通过     | 无错误或警告输出                                                 |
| TypeScript             | 通过     | `tsc --noEmit` 无错误                                            |
| Prettier               | 通过     | 源码、E2E、配置和文档格式通过                                    |
| `pnpm build`           | 通过     | Next.js 16.2.9，93 个页面/产物生成成功                           |
| SEO / 内容检查         | 通过     | `SEO/content check passed.`                                      |
| 图片 blur 覆盖         | 通过     | 6 张项目图片全部覆盖                                             |
| Bundle budget          | 通过     | 静态输出 1.15 MB / 2.00 MB；最大 JS 222.0 KB；CSS 302.3 KB       |
| 依赖审计               | 通过     | npm 官方 registry 未发现已知漏洞，high/critical 为 0             |
| Secret 静态检索        | 通过     | 未发现真实 token、私钥或 service-role 值；命中均为文章示例变量名 |

构建在受限沙箱内首次因无法访问 Google Fonts 失败；允许访问公开字体源后，原始 `pnpm build` 成功。这是构建网络依赖，不是代码编译失败。

## 3. 本轮已落地优化

| 级别 | 文件:行号                                            | 问题与影响                                                         | 已执行操作                                                          | 验证与收益                                       |
| ---- | ---------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------ |
| P0   | `src/lib/tags.test.ts:39`、`e2e/extended.spec.ts:70` | 测试硬编码不存在的中文标签，导致单测和 E2E 漂移                    | 动态选择真实中文标签；标题定位改为精确匹配                          | 原失败消失；内容标签变化不再阻塞 CI              |
| P1   | `src/lib/search/project.ts:4`                        | Fuse `matches` 暴露内部 `headings/searchText` 值，扩大响应和信息面 | 只保留可展示字段的 match 元数据                                     | API/引擎测试覆盖隐藏字段；响应契约收紧           |
| P1   | `src/lib/search/rate-limit.ts:92`                    | 通用 XFF 可被上游覆盖或伪造                                        | 只使用 Vercel 平台头 `x-vercel-forwarded-for`，并校验 IP 格式       | 伪造通用头测试通过；限流键来源与部署平台一致     |
| P1   | `src/components/blog/useServerSearch.ts:126`         | 429、500、网络错误与空结果混淆，且丢失 `Retry-After`               | 增加结构化错误状态、解析重试秒数并显示对应文案                      | 429/500 组件和 hook 测试通过；用户得到可执行反馈 |
| P1   | `src/app/api/search/route.ts:78`                     | 公开缓存响应携带客户端剩余额度，可能跨客户端缓存错误值             | 200 响应移除 `X-RateLimit-Remaining`，429 保留 `0` 和 `Retry-After` | 缓存仍有效，不再传播个体额度状态                 |
| P1   | `src/components/blog/useFuseSearch.ts:61`            | 服务端搜索路径仍在 hydration 后加载 Fuse 动态 chunk                | 无客户端文章索引时保持 idle，不触发 Fuse 加载                       | 新增 idle 测试；减少生产搜索页无效网络与解析工作 |
| P2   | `src/components/ui/DarkModeScript.tsx:1`             | 纯静态 `<script>` 被标为 Client Component                          | 移除 `use client`，保留 nonce 和 SSR 输出                           | Server Component 边界测试、构建均通过            |
| P2   | `e2e/blog.spec.ts:23`、`e2e/mobile.spec.ts:52`       | 原生 setter 绕过真实用户输入，掩盖 hydration/事件问题              | 改用 `focus()` + `keyboard.type()`；删除生产组件重复 `onInput`      | 搜索相关 E2E 和完整 47 个 E2E 全绿               |
| P2   | `.github/workflows/ci.yml:60`                        | RSS 重复生成且旧 feed 未随内容更新                                 | build 作为唯一生成入口；增加 feed 差异门禁；重新生成两份 feed       | feed 使用正式域名并与当前文章内容同步            |
| P2   | `.github/workflows/ci.yml:18`                        | quality/e2e/lighthouse 缺变量时回退 `example.com`                  | 回退值统一为正式域名                                                | canonical、sitemap、RSS 在 CI 中保持一致         |

Vercel 官方说明：平台会覆盖 `x-forwarded-for` 防止 IP spoofing，并提供不受上游代理替换的 `x-vercel-forwarded-for`。参考：<https://vercel.com/docs/headers/request-headers>。

## 4. 前端代码审查

### FE-1 [P2] MagneticCard 对鼠标事件重复执行

- 问题描述：`src/components/ui/MagneticCard.tsx:69` 同时注册 `onPointerMove` 和 `onMouseMove`；鼠标设备通常会依次触发 pointer 与兼容 mouse 事件。
- 影响评估：每次移动可能重复执行 `getBoundingClientRect()`、transform 和 5 个 CSS 变量写入；博客卡片、项目卡片、链接卡片都会放大该成本，主要影响 INP 和低端设备主线程。
- 推荐操作步骤：删除 `MouseEvent` 类型、`handleMouseMove`、`onMouseMove` 和 `onMouseLeave`；只保留 Pointer Events；将对应单测统一改为 `pointerMove/pointerLeave`。
- 预期收益：鼠标移动路径的布局读取与样式写入约减半，交互实现也更单一。
- 验证方式：MagneticCard 单测全绿；Chrome Performance 中连续移动鼠标时 handler 调用次数不再成对出现。

### FE-2 [P2] 全站背景视差未合并高频事件

- 问题描述：`src/components/layout/SiteBackdropParallax.tsx:36` 在全站监听原始 `mousemove`，每个事件直接写两个 CSS 变量。
- 影响评估：高刷新率鼠标可能产生每秒数百次回调；虽然只更新一个节点，但会与卡片 hover、滚动和 hydration 竞争主线程。
- 推荐操作步骤：缓存最后坐标，用单个 `requestAnimationFrame` 合并同一帧内事件；卸载时取消待执行 frame；优先改用 `pointermove`。
- 预期收益：样式更新上限稳定在显示器刷新率，降低无效调用。
- 验证方式：现有视差单测补 rAF 合并断言；Playwright 的 transform 用例保持通过；Performance 面板无连续重复 style write。

### FE-3 [P2] 根布局加载全部业务 CSS

- 问题描述：`src/app/layout.tsx:6` 到 `src/app/layout.tsx:22` 把首页、文章、搜索、链接、项目样式全部导入根布局；当前 CSS 总量 302.3 KB，最大 bundle 181.8 KB。
- 影响评估：任意路由都需处理全站 CSS，增加首屏传输、解析和样式计算；文章页也承担首页和链接目录样式。
- 推荐操作步骤：先用 analyzer/coverage 确认各路由未使用 CSS；保持 tokens/base/responsive 顺序不变，将 `home-*`、`links`、`project-detail` 等移到对应 segment layout；每次只迁一个模块并跑视觉/E2E。
- 预期收益：非首页路由减少无关 CSS，改善 FCP/LCP；目标先将单路由 CSS 降低 15% 以上。
- 验证方式：比较迁移前后 `.next/static/css`、Lighthouse total-byte-weight 和主要路由截图；CSS import 顺序测试/文档同步更新。

### FE-4 [P2] ParticleCanvas 是无生产调用方的死代码 — ✅ 2026-07-16 已删除

- 问题描述：`src/components/ui/ParticleCanvas.tsx` 只被自身测试引用，生产源码没有导入。
- 已执行操作：删除组件与测试；文档（AGENTS/README/architecture/handoff）去掉引用；保留 `SiteBackdropStage/Parallax`。
- 验证方式：`rg "ParticleCanvas" src` 无结果；单测、构建和首页 E2E 全绿。

## 5. 后端与 API 审查

### BE-1 [P1] 必需 JSON 数据可静默降级为空

- 问题描述：`src/lib/json-content-repository.ts:34` 和 `:42` 在文件缺失或 JSON 语法错误时返回空 fallback；`scripts/check-seo.ts:249` 直接遍历 `getAllProjects()`，项目文件缺失时得到空数组而不报错。
- 影响评估：`data/projects.json` 损坏或漏提交时，构建可能成功但作品页静默变空；这是可部署的内容完整性回归。
- 推荐操作步骤：在 `check-seo.ts` 中像 links 一样显式检查 projects 文件存在、JSON.parse 和 `parseProjects`；可选为 repository 增加 `required` 标志，生产构建对必需数据 fail-fast，测试仍允许 fallback。
- 预期收益：把“线上内容消失”前移为 CI 错误，降低静默故障。
- 验证方式：临时 fixture 模拟文件缺失、非法 JSON、schema 错误，检查脚本均应非零退出；恢复真实文件后通过。

### BE-2 [P2] 进程内限流不是全局防线

- 问题描述：`src/lib/search/rate-limit.ts:14` 使用进程内 `Map`；serverless 冷启动和多实例各自维护桶。`src/app/api/search/route.ts:88` 又允许 CDN 缓存，因此该 limiter 实际只约束到达单个 origin 实例的 cache miss。
- 影响评估：无法承诺全局 60 次/分钟；重复命中缓存的请求不会进入应用限流。搜索数据是公开静态内容，风险主要是 origin 成本和突发流量，而非数据越权。
- 推荐操作步骤：在代码注释和 API 文档中明确“origin best-effort”；需要强限流时优先用 Vercel Firewall/平台规则按 `/api/search` 和 IP 限制，不引入数据库或搜索服务。
- 预期收益：限流语义与实际部署一致，避免把应用 Map 误当安全边界。
- 验证方式：预览环境用受控请求验证 429、`Retry-After` 和平台规则命中；确认缓存命中率与 Function Invocations 同步下降。

### BE-3 [P2] SearchResponse.total 语义含糊

- 问题描述：`src/app/api/search/route.ts:74` 把 `total` 设为截断后的 `results.length`，它不是全部匹配数；当前 API 又没有 offset/cursor。
- 影响评估：当前 UI 不受影响，但未来分页或统计调用方会把“返回条数”误解为“总命中数”。
- 推荐操作步骤：短期把字段文档明确为 returned count，或改名 `count`；只有确实增加分页时才让搜索引擎返回未截断 total，避免为 14 篇内容预先复杂化。
- 预期收益：API 契约更清楚，后续分页不会产生兼容性歧义。
- 验证方式：类型、Route Handler 测试和 API 文档对字段含义保持一致。

### BE-4 [P2] 开发缓存可能漏掉文件删除

- 问题描述：`src/lib/cache.ts:91` 用目录内文件的最大 mtime 作为缓存签名；删除一个不是最新 mtime 的文件时，最大值可能不变。
- 影响评估：开发模式可能继续返回已删除文章/数据，直到另一个文件变化或进程重启；生产构建缓存不受影响。
- 推荐操作步骤：缓存签名加入文件名集合、文件数量和目录 mtime，或构造稳定的 `name:mtime` 字符串；保持生产路径首次计算后缓存不变。
- 预期收益：新增、删除、重命名和内容修改都能可靠失效，减少开发期“幽灵内容”。
- 验证方式：新增测试覆盖删除非最新文件与重命名文件，两次 `getOrCompute` 应重新计算。

## 6. 整体架构建议

### ARCH-1 [P2] CSP nonce 让主要页面全部动态渲染

- 问题描述：`src/app/layout.tsx:82` 读取请求 nonce；生产构建显示首页、博客、标签、项目等主要路由均为 `ƒ Dynamic`。
- 影响评估：这是严格 CSP 的合理安全取舍，但静态内容博客失去完整 SSG/CDN 命中能力，TTFB 和 Function Invocations 可能高于纯静态方案。
- 推荐操作步骤：先用 Vercel Analytics/Speed Insights 记录真实 TTFB 与缓存命中；如果成本或延迟确实超标，再评估 Next 官方支持的静态 CSP/SRI 方案。不得为静态化回退到 `unsafe-inline` 脚本。
- 预期收益：用真实数据决定是否调整，不牺牲当前 nonce CSP 安全基线。
- 验证方式：对比改动前后 TTFB、Function Invocations、CSP 浏览器控制台和 JSON-LD/Giscus/Analytics 功能。

### ARCH-2 [保持] 当前内容分层不需要大重构

- 现状：`ContentSource -> repository/cache -> query/search -> app route/component` 边界清晰；搜索使用同一 `PostMeta` 数据源，Route Handler 显式 Node runtime；没有数据库和 N+1 查询。
- 建议：保持现有栈，不引入 Elasticsearch、MeiliSearch 或 CMS；文章规模仍小，Fuse + 内存缓存足够。优先修复严格校验、事件频率和 CSS 拆分这些已测量问题。
- 预期收益：避免为当前规模增加部署、索引同步和故障面。
- 验证方式：搜索 p95、bundle budget、Function Invocations 或文章数量明显增长后再重新评估。

## 7. 配置与部署优化

### CFG-1 [P1] 部署 CLI 与 Node 主版本未形成单一版本基线

- 问题描述：`.github/workflows/ci.yml:191` 使用 `npx vercel@latest`；CI 固定 Node 22，但 `package.json` 只有 pnpm pin（`:78`），没有 `engines`/`.nvmrc`。本次本机运行的是 Node 24。
- 影响评估：Vercel CLI 可在任意一次部署自动升级；本地、CI、Vercel 构建 Node 主版本也可能漂移，增加不可复现失败和供应链变化面。
- 推荐操作步骤：把 Vercel CLI 固定到已验证的精确版本；在 `package.json` 增加 `engines.node = "22.x"`，并增加 `.nvmrc` 或 `.node-version`；CI 与 Vercel 项目均对齐 Node 22。
- 预期收益：安装、构建和部署行为可复现，升级变成显式评审动作。
- 验证方式：Node 22 下跑 frozen install、test、build、E2E；检查 deploy job 不再解析 `latest`。

### CFG-2 [P2] Vercel installCommand 没有显式 frozen lockfile

- 问题描述：`vercel.json:5` 使用 `pnpm install`；虽然 CI 环境通常默认 frozen，但配置没有明确表达不可修改 lockfile。
- 影响评估：不同 Vercel/pnpm 环境默认值变化时，部署依赖解析可能偏离 CI。
- 推荐操作步骤：改为 `pnpm install --frozen-lockfile`；保持现有 `packageManager` pin。
- 预期收益：Vercel 与 GitHub Actions 安装语义一致。
- 验证方式：锁文件故意与 package.json 不一致时安装必须失败；正常锁文件构建通过。

### CFG-3 [P2] deploy job 可能本地构建后又远端构建

- 问题描述：deploy job 先执行 `pnpm build`，随后 `vercel deploy --prod` 默认上传源码并在 Vercel 再构建。
- 影响评估：重复消耗 CI 与远端构建时间，且“本地验证产物”不是实际部署产物。
- 推荐操作步骤：在固定 Vercel CLI 版本后评估 `vercel build --prod` + `vercel deploy --prebuilt --prod`；若继续远端构建，则删除 deploy job 的重复本地 build，依赖已有 quality/e2e/lighthouse 门禁。
- 预期收益：减少一次生产构建，并让测试产物与部署产物关系更清楚。
- 验证方式：预览环境 dry-run，比较构建次数、总耗时和 BUILD_ID；确认 production content smoke 仍通过后再改生产流程。

## 8. 测试质量与缺口

- 已消除所有 `test.skip/it.skip/describe.skip`；博客文章 E2E 在内容缺失时现在会失败，而不是跳过。
- 搜索已覆盖：空输入、100 字符上限、limit clamp、字段投影、可信 IP、60 次窗口、429/500、`Retry-After`、真实键盘输入、移动端无横向溢出。
- `e2e/blog.spec.ts:135` 的代码块复制按钮用例仍在 `count > 0` 时才断言；如果第一篇文章没有代码块，该用例会空跑。建议固定导航到一篇已知包含代码块的文章，或先断言 `codeBlocks.count() > 0`。
- 缺少多实例限流测试属于部署平台能力，不应伪造单元测试；用预览环境平台规则验证更可靠。

## 9. 优先级路线图

1. P1：为 projects/links 等必需内容增加严格 CI 校验，避免静默空页面。
2. P1：统一 Node 22 与固定 Vercel CLI 版本，消除部署漂移。
3. P2：合并 MagneticCard 和全站视差的高频事件更新。
4. P2：按路由拆分全局 CSS，以 302.3 KB 基线验证真实收益。
5. P2：明确 origin best-effort 限流语义；需要强保护时使用 Vercel Firewall。
6. P2：修复 dev cache 删除/重命名失效和代码块 E2E 空跑。

## 10. 不建议事项

- 不引入 Elasticsearch、MeiliSearch、数据库或额外搜索服务。
- 不做全量 BEM 重写或跨模块大重构。
- 不为恢复 SSG 而削弱 nonce CSP。
- 不在缺少真实 RUM 数据时承诺虚构的 p75 改善数字。
