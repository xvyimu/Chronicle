# Chronicle · 架构 As-Is 测绘

> **角色**：架构测绘师（只读）  
> **日期**：2026-07-22  
> **工作树**：`C:/Users/yuanjia/orca/workspaces/Chronicle/ch-1` · 分支 `xvyimu/ch-1` @ `479ebd3`  
> **真路径 / 主仓**：`D:\Chronicle` · GitHub `xvyimu/Chronicle` · 生产 `https://incca.ccwu.cc`  
> **技术栈主参考**：`D:\orca\docs\architecture-stack-refactor-master-2026-07-22.md`（§0 铁律：主参考非教条；R2 可被证据推翻）  
> **性质**：个人博客 + 作品集 + 轻量数字花园（**内容站**，非管理面板 / 非网关 / 非 AI 核心）  
> **本文件**：测绘产物；**不**改变业务行为；**不**要求本仓迁 Vue/Go/Python。

---

## 0. 一句话结论

Chronicle 是 **100% TypeScript/Next.js 内容站**：本地 MDX/JSON → 进程内 repository + 可选 content-snapshot → App Router 动态 HTML（CSP nonce）+ 三条公开 API。与主参考栈对照应标 **L2 内容遗留**；有证据支持 **保留 Next（更好/更适配）**，**无证据**支持整站改 Vue3+NaiveUI，也不应把本仓当作 Go 网关或 Python AI-Core 主战场。

**建议标签：`L2`（内容遗留）** · 可选远期旁路：`TOOL` 级运维脚本（已有 Shell/TS scripts）。

---

## 1. 产品定位与边界

| 维度        | As-Is                                                          |
| ----------- | -------------------------------------------------------------- |
| 产品名      | 西江月博客 / package `chronicle`                               |
| 用户面      | 公开阅读：文章、标签/分类/专题、作品集、收藏链接、`/garden`    |
| 运营面      | **无**自建管理台；内容靠 Git + MDX/JSON + `pnpm content:build` |
| 身份/多租户 | **无**登录、**无**租户模型                                     |
| 计费/渠道   | **无**                                                         |
| AI          | **无** LLM 编排、无 RAG 服务                                   |
| 设备侧      | **无**                                                         |

与总文档 §2 表一致：内容站 ≠ 管理面板；策略 **L2 维持**，Phase 4 仅安全/运维补丁。

---

## 2. 目录 / 模块图

### 2.1 顶层

```text
Chronicle/
├── content/blog/*.mdx          # 文章正文（约 20 篇）
├── data/projects.json          # 作品集
├── data/links.json             # 收藏链接（~10 类 / 123 条）
├── generated/content-snapshot/ # 构建快照（生产默认 CONTENT_BACKEND=snapshot）
├── public/                     # 静态资源、feed.xml/json
├── scripts/                    # SEO/ops/RSS/snapshot 等 Node/TS 工具
├── e2e/                        # Playwright
├── docs/                       # 架构/API/ADR/ops
├── src/
│   ├── app/                    # Next App Router 页面 + Route Handlers
│   ├── components/             # UI（blog/home/layout/links/projects/comments/ui）
│   ├── hooks/
│   ├── lib/                    # 数据、schema、缓存、搜索契约、SEO 辅助
│   └── server/                 # 内容 facade + 搜索用例（仅服务端）
└── package.json                # next 16.2.9 · react 19.2 · pnpm 11 · node 22
```

### 2.2 逻辑分层（依赖方向）

```text
content/ + data/ + generated/content-snapshot/
        │  fs / snapshot
        ▼
src/lib/*          repositories · Zod · createCache · 搜索 DTO · 图/wikilink
        ▲
src/server/*       content facade · search service/engine/rate-limit
        ▲
src/app/*          pages · metadata · sitemap/robots · api/*
        │
src/components/*   仅共享 DTO/纯函数 + HTTP（禁止 import @/server）
```

边界由 `src/lib/module-boundaries.test.ts` 守门。

### 2.3 页面路由（`page.tsx`）

| 路径                                    | 职责                                |
| --------------------------------------- | ----------------------------------- |
| `/`                                     | 首页纸感编辑区                      |
| `/blog`, `/blog/[slug]`                 | 列表 + 详情（OG image、邻接、反链） |
| `/tags`, `/tags/[tag]`                  | 标签                                |
| `/categories`, `/categories/[category]` | 分类                                |
| `/series`, `/series/[series]`           | 专题                                |
| `/projects`, `/projects/[id]`           | 作品集                              |
| `/links`                                | 收藏目录（客户端筛选）              |
| `/garden`                               | 数字花园力导向图                    |
| `/about`                                | 关于                                |

另有：`sitemap.ts`、`robots.ts`、`manifest.ts`、`proxy.ts`（CSP）、`error.tsx`。

### 2.4 `src/server` 模块

| 模块             | 文件                                         | 职责                       |
| ---------------- | -------------------------------------------- | -------------------------- |
| `server/content` | `index.ts`                                   | 对 `lib/posts              | projects | links | …` 的薄 facade |
| `server/search`  | `service.ts` / `engine.ts` / `rate-limit.ts` | Fuse 搜索用例 + 进程内限流 |

### 2.5 `src/components` 分包

`blog` · `comments`（Giscus）· `home` · `layout` · `links` · `projects` · `ui`

---

## 3. 语言与栈占比

### 3.1 实测（本 worktree，排除 `node_modules` / `.git` / `.next`）

| 扩展                                                 | 文件数（约） | 体量（约） | 角色                 |
| ---------------------------------------------------- | ------------ | ---------- | -------------------- |
| `.ts`                                                | 127          | ~399 KB    | 业务/脚本/测         |
| `.tsx`                                               | 127          | ~355 KB    | React 页面与组件     |
| `.md`                                                | 73           | ~802 KB    | 文档（非运行时）     |
| `.mdx`                                               | 21           | ~159 KB    | 内容                 |
| `.css`                                               | 19           | ~98 KB     | BEM + tokens         |
| `.json`                                              | 7            | ~209 KB    | 数据 + 快照 + 锁周边 |
| `.mjs`                                               | 10           | ~35 KB     | 检查脚本             |
| `.go` / `.py` / `.c` / `.h` / `.vue` / `.rs` / `.cs` | **0**        | —          | **不存在**           |

- **运行时主语言**：**TypeScript + TSX ≈ 100%**（Node 22 上的 Next）
- **内容语言**：MDX + YAML frontmatter
- **样式**：CSS（Tailwind 4 入口 + 语义 BEM 模块）
- **壳/运维**：Shell 通过 CI/husky；脚本主体仍是 TS/`tsx`/`node`
- **SQL**：仓库内 **无** schema / migration / ORM（无 Postgres/SQLite 应用层）

### 3.2 框架依赖（摘自 `package.json`）

| 层        | 选型                                              | 版本锚点                     |
| --------- | ------------------------------------------------- | ---------------------------- |
| Framework | Next.js App Router                                | `16.2.9`                     |
| UI        | React + React DOM                                 | `19.2.4`                     |
| 校验      | Zod                                               | `^4.4.3`                     |
| 内容      | next-mdx-remote · js-yaml · remark/rehype · Shiki | 见 package                   |
| 搜索      | fuse.js                                           | `^7.4.2`                     |
| 评论      | Giscus（第三方 iframe/script）                    | 配置于 site env              |
| 测试      | Vitest · Playwright                               | 95+ 文件 / 700+ 单测 · 5 e2e |
| 部署      | Vercel + GitHub Actions                           | —                            |

**无**：Vue、NaiveUI、Go module、Python 包、C/STM32、Prisma/Drizzle。

---

## 4. 对外 API

规范源：`docs/API.md`（2026-07-22）。**均不要求登录**。

| 方法 · 路径               | 用途                           | 限流（进程内）    | 缓存                       |
| ------------------------- | ------------------------------ | ----------------- | -------------------------- |
| `GET /api/search`         | 全文/元数据模糊搜索 → 投影 DTO | 60 / 60s / origin | `s-maxage=60, swr=300`     |
| `GET /api/preview/[slug]` | wikilink 悬停元数据            | 120 / 60s         | `s-maxage=3600, swr=86400` |
| `POST /api/csp-report`    | CSP 违规 collect-only          | 30 / 60s          | `no-store` · 204           |

实现落点：

- `src/app/api/search/route.ts` → `src/server/search/*` + `src/lib/search/*`
- `src/app/api/preview/[slug]/route.ts`
- `src/app/api/csp-report/route.ts` + `src/proxy.ts`（`report-to` / `report-uri`）

**非 HTTP「接口」**：

- RSS：`public/feed.xml` / `feed.json`（构建脚本生成）
- `sitemap.xml` / `robots.txt` / PWA `manifest`
- 第三方：Giscus、Vercel Analytics / Speed Insights（生产注入）

**无**：gRPC、OpenAPI 网关、鉴权 cookie/JWT 业务面、Webhook 业务回调。

---

## 5. 数据存储

| 存储        | 形态                                                 | 说明                                                  |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------- |
| 文章        | 本地 `content/blog/*.mdx`                            | frontmatter Zod；`published: false` 生产过滤          |
| 作品/链接   | `data/*.json`                                        | `createJsonContentRepository`；生产 strict fail-fast  |
| 构建快照    | `generated/content-snapshot/*`                       | posts-meta/full、search-docs、garden-graph、positions |
| 运行时缓存  | 进程内 `createCache<T>`                              | 无 Redis                                              |
| 浏览器      | `localStorage`（花园视图 key `blog:garden-view:v1`） | 可选 UX，非权威源                                     |
| RDBMS / SQL | **无**                                               | —                                                     |
| 对象存储    | **无**（图片本地 `public/`）                         | `remotePatterns: []`                                  |
| 密钥        | 环境变量（Giscus、SITE_URL、ENABLE_SRI 等）          | 不入库                                                |

内容后端开关：`CONTENT_BACKEND=snapshot`（生产默认）vs 直接读 FS。

---

## 6. 安全与渲染模型（架构相关）

| 决策     | 现状                                | 文档               |
| -------- | ----------------------------------- | ------------------ |
| HTML     | **动态**：per-request CSP **nonce** | ADR nonce-over-SSG |
| 脚本 CSP | 禁止为 SSG 放宽 `unsafe-inline`     | handoff §3         |
| SRI      | 生产已开 `ENABLE_SRI=1`（sha384）   | TODO / ADR         |
| CSP 上报 | collect-only，不落库不回显          | API.md             |
| 图片     | 仅本地                              | next.config        |

这些约束使「整站静态化 / 换静态托管面板栈」成本高，进一步支持 **维持 Next 内容遗留**。

---

## 7. 与主参考栈偏离清单

主参考（preferred baseline）：`C` · `Python` · `Go` · `TS+Vue3+NaiveUI` · 嵌入式副线 · `Git/Shell/SQL`。  
原则依据：总文档 §0 R1–R6（默认可偏离须有证据；遗留可暂留）。

| 层          | 主参考         | Chronicle As-Is                     | 偏离度                | 处置（初判）                        |
| ----------- | -------------- | ----------------------------------- | --------------------- | ----------------------------------- |
| 前端面板    | Vue3 + NaiveUI | **React 19 + Next 16**（阅读站 UI） | 高（技术名）          | **保留**（见 §7.3：更好/更适配）    |
| 网关        | Go             | Next Route Handlers（Node）         | 高                    | **保留**（无网关职责）              |
| AI 核心     | Python         | 无                                  | n/a                   | **不引入**                          |
| 底层 C      | 嵌入式         | 无                                  | n/a                   | **不引入**                          |
| SQL         | Postgres 等    | 无（文件内容）                      | 中                    | **保留文件模型**（无 RDB 需求证据） |
| Git / Shell | 通用           | ✅ GitHub + scripts/CI              | 对齐                  | **保留**                            |
| TS          | 面板侧         | ✅ 全仓 TS                          | 对齐（绑 React/Next） | **保留于 L2**                       |

总文档 §1 已明示：内容站可维持 Next；面板层「可论证替代」包含深耦合 React 暂留。

### 7.1 明确不提议的动作（无证杂学）

1. **整站改 Vue3+NaiveUI**：无管理台需求；MDX/RSC/CSP nonce/数字花园/700+ 测沉没成本极高（R3）。
2. **抽 Go 网关承载本站三 API**：QPS 与多租户/计费职责均不存在。
3. **上 Python AI**：产品无 LLM 功能。
4. **引入 SQL 作为内容权威源**：与「Git 即 CMS」冲突，除非另立运营后台（新 Console，非本仓重写）。

### 7.2 可选、低优先级「对齐用语」项（非迁移）

| 项                     | 说明                                                 | 标签         |
| ---------------------- | ---------------------------------------------------- | ------------ |
| 文档声明 L2            | 在 handoff/architecture 链到主参考总文档             | L2           |
| 运维脚本保持 TS/Shell  | 已符合工具层                                         | TOOL 片段    |
| 若未来要有「编辑后台」 | **新仓** 默认 Vue 面板 + 另议 API；须 R2 证据与 gate | 仅当产品决策 |

### 7.3 相对主参考的偏离建议（保留 / 迁移 / 用更好替代）

> 格式：决策 · 对比维度 · 证据 · 代价 · 回滚。满足 §0「至少 2 项收益维度 + 1 项代价」。

#### D1 · 阅读站 UI：**保留 Next.js + React**（用更好/更适配替代「默认 Vue 面板」）

| 项           | 内容                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **决策**     | **用更好替代（本层）**：内容阅读站不采用主参考「Vue3+NaiveUI 面板」默认，**保留** Next 16 + React 19 + MDX                                                                                                                                                                                                                                                                           |
| **对比维度** | ① 与现有代码契合度 ② 安全边界（CSP nonce + 动态 HTML）③ 迁移工期/心智负担 ④ SEO/内容管道成熟度                                                                                                                                                                                                                                                                                       |
| **证据**     | · 全仓 0 个 `.vue`；~254 个 ts/tsx；MDX 管线 + snapshot + wikilink/garden 已生产。 · ADR：nonce-over-SSG、SRI 生产已开；Vue SPA 默认与 `strict-dynamic` nonce 模型冲突成本高。 · 测试资产：Vitest 95+ 文件 / 700+ 用例 + Playwright e2e + module-boundaries。 · 职责是 **Content** 不是 Console（总文档 §1 可论证例外 + §2 L2）。 · 体量 20 文 / 无登录 / 无多租户——换栈无吞吐收益。 |
| **代价**     | 产品线面板层存在 **React（内容）与 Vue（未来 Console）** 两套前端认知；靠 **标签 L2 + 文档边界** 消化，禁止在本仓再开第二前端。                                                                                                                                                                                                                                                      |
| **回滚**     | 无迁移动作即无需回滚；若未来误开 Vue 重写分支，弃分支即可，生产仍在 Next。                                                                                                                                                                                                                                                                                                           |
| **R6**       | 建议协调员/用户确认「Chronicle 不迁 Vue」决策门（总文档 §7.4）。                                                                                                                                                                                                                                                                                                                     |

#### D2 · HTTP 边缘：**保留 Next Route Handlers**（不迁 Go 网关）

| 项           | 内容                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| **决策**     | **保留** Node 上 `GET/POST /api/*`（search / preview / csp-report）                                                   |
| **对比维度** | ① 与部署契合（Vercel）② 复杂度/运维 ③ 安全边界（已有限流 + 平台 WAF）                                                 |
| **证据**     | 三 API 只读或 collect-only；进程内限流；无鉴权租户计费。引入 Go 网关增加部署单元与密钥面，无测量驱动的延迟/吞吐问题。 |
| **代价**     | 与旗舰「Go 网关」形态不一致——可接受，因本仓不承担 Gateway 逻辑产品。                                                  |
| **回滚**     | 不迁移。                                                                                                              |

#### D3 · 数据面：**保留文件 + snapshot**（不迁 SQL 权威源）

| 项           | 内容                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| **决策**     | **保留** MDX/JSON + `generated/content-snapshot`                            |
| **对比维度** | ① 契合「Git 即 CMS」② 运维成本 ③ 一致性模型                                 |
| **证据**     | 无协作编辑后台；CI/内容检查已建立；RDB 引入迁移/备份/权限却无查询并发痛点。 |
| **代价**     | 无 ad-hoc SQL 分析；可接受。                                                |
| **回滚**     | 不迁移。                                                                    |

#### D4 · AI / C / 嵌入式：**不引入**（非本产品职责）

| 项       | 内容                                                            |
| -------- | --------------------------------------------------------------- |
| **决策** | **保留缺失**（不设 Python AI-Core、不设 C 固件于本仓）          |
| **证据** | 产品无 LLM、无设备协议；嵌入式进 Web monorepo 违反总文档 §1.1。 |
| **代价** | 无。                                                            |

#### D5 · 若出现「编辑/运营后台」新需求：**迁移/新建**（默认跟主参考）

| 项       | 内容                                                                                          |
| -------- | --------------------------------------------------------------------------------------------- |
| **决策** | **迁移窗口专用**：新建 Console（默认 **Vue3+NaiveUI**）+ 可选 Go BFF；**不**替换公开阅读站    |
| **证据** | 届时才有「面板」职责；与 D1 分层（Content 留 Next，Console 跟主参考）符合 R4 同层一种主实现。 |
| **代价** | 双前端并存于产品线（L2 阅读 + 主参考面板）；需 OpenAPI 与信任边界。                           |
| **回滚** | 关闭 Console 仓；阅读站独立。                                                                 |
| **门槛** | 产品明确要后台 + R6 gate；当前 **未触发**。                                                   |

**汇总句**：Chronicle 对主参考的「偏离」是 **有证据的保留/替代（D1–D4）**，不是无证杂学；唯一潜在「对齐迁移」是 **未来 Console 新仓（D5）**，与阅读站绞杀分离。

---

## 8. 迁移风险（若无视 R2 证据强行按面板默认栈重写）

| 风险                            | 等级   | 说明                                                                        |
| ------------------------------- | ------ | --------------------------------------------------------------------------- |
| CSP nonce + 动态 HTML 契约丢失  | **高** | Vue SPA 默认模型与严格 `script-src`/`strict-dynamic` 不兼容，需重做安全 ADR |
| MDX/RSC/OG/RSS/sitemap 生态重接 | **高** | 现网 SEO/feed/生产检查全绑 Next                                             |
| 测试资产作废                    | **高** | ~700 unit + e2e + module-boundaries + ops-readiness                         |
| 数字花园 / wikilink 图          | **中** | 自研 force-layout + snapshot positions，迁移需完整行为对照                  |
| 内容工作流中断                  | **中** | `content:build`、snapshot、Vercel tracing includes                          |
| 生产回滚面                      | **中** | 单域内容站，重写无绞杀中间态时易长时间双轨                                  |
| 与产品线旗舰抢资源              | **高** | 主战场是 TransitHub / MindSync；本仓重写是战略噪音                          |

**结论**：迁移 ROI **负**；风险登记用途是 **阻止误派 P0**，不是启动 Phase1。

---

## 9. 建议标签与路线

### 9.1 标签（给协调员汇总表）

| 字段         | 值                                                 |
| ------------ | -------------------------------------------------- |
| **策略标签** | **`L2` 内容遗留**                                  |
| 次标签       | 运维脚本可视为仓内 **`TOOL` 片段**（不单独产品化） |
| 非标签       | 非 P0、非 P1、非 LEGACY（.NET 类）、非 SIDE 嵌入式 |
| 整站 Vue     | **不建议**                                         |
| 主投入       | **禁止**与 TransitHub/MindSync 同优先级架构重构    |

### 9.2 本仓允许的工程活动（与总文档 Phase 0/4 一致）

- 安全/依赖/CSP/SRI 补丁
- 内容与 SEO/ops 门禁维护
- 文档与 [`ARCHITECTURE_TARGET.md`](./ARCHITECTURE_TARGET.md) 一页纸（Dual-B 已建；巩固 L2 边界）
- **禁止**：无证据杂学；禁止为「对齐 Vue」开大 PR（违反 R2/R5）

### 9.3 对产品线架构的输入

- **Content** 逻辑产品：Chronicle（+ ChronoPortal）继续承载「可读公开站」。
- **Console / Gateway / AI-Core / Device**：**不**从本仓生长。
- 决策门「Chronicle/ChronoPortal：维持 Next 内容遗留，不迁 Vue」—— **本测绘支持选「维持」**（§7.3 D1 证据）。

---

## 10. 证据索引（只读扫描）

| 证据         | 路径 / 命令结果                                                                    |
| ------------ | ---------------------------------------------------------------------------------- |
| 栈与脚本     | `package.json`                                                                     |
| 分层说明     | `docs/architecture.md`、`docs/handoff-to-agent.md`                                 |
| API 契约     | `docs/API.md`                                                                      |
| 服务端边界   | `src/server/**`、`src/lib/module-boundaries.test.ts`                               |
| 数据         | `content/blog`（20 mdx）、`data/*`、`generated/content-snapshot/*`                 |
| 语言清零     | `*.go/*.py/*.c/*.vue` count = 0                                                    |
| 待办边界     | `TODO.md`（工程可推进项关闭；外部 auth 阻塞）                                      |
| 主参考总文档 | `D:\orca\docs\architecture-stack-refactor-master-2026-07-22.md` §0–§2 Chronicle 行 |

---

## 11. 测绘范围外（未做）

- 未跑完整 `pnpm test` / production build（只读文档+结构扫描足够贴标签）
- 未改业务代码、未 commit、未 push
- `ARCHITECTURE_TARGET.md` 已由 Dual-B（2026-07-22）补齐；见同目录 TARGET

---

**测绘完成 · 建议协调员汇总标签：`Chronicle = L2`。**
