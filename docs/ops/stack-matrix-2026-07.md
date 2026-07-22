# Chronicle · 栈矩阵 · 2026-07

> 组合包：`portfolio-arch-upgrade-2026h2` · 波次 **W1–W2**  
> 仓：`xvyimu/Chronicle` · 产品：内容站（非 AI SaaS）  
> 冻结日：2026-07-23 · W1 tip：`24506a2` · W2 分支：`xvyimu/w2-ch-claude`

## 1. 当前 → 目标 → 本波

| 层                     | 当前（实测 / lock）                                       | 半年目标                                                | W1                              | W2 已做                                                 | 证据                                       |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------- | ------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| **Node engines**       | `package.json` `22.x` · `.nvmrc` / `.node-version` = `22` | CI **严格 22**；本地可 22；docs 注明 mirror/engine WARN | 矩阵落盘；CI `node-version: 22` | 不改                                                    | `.github/workflows/ci.yml` · 本文件        |
| **本地 Node（本 wt）** | 本机可能 **v24**（engine WARN only）                      | 不强制改本机；CI 以 22 为准                             | 记录 WARN                       | 记录 WARN                                               | `node -v`                                  |
| **pnpm**               | `packageManager` **11.8.0**                               | 跟组合 **≥11.5**                                        | 已 ≥11.5                        | 不降级                                                  | `package.json`                             |
| **Next.js**            | **16.2.9**（钉）                                          | 补丁线（16.2.x）                                        | **不 bump**                     | **不 bump**                                             | lock / `package.json`                      |
| **React / react-dom**  | **19.2.4**                                                | 跟 Next 兼容补丁线                                      | 不 bump                         | 不 bump                                                 | 同上                                       |
| **TypeScript**         | **^5** → lock **5.9.3**                                   | 5.x 维护线                                              | 不 bump                         | 不 bump                                                 | 同上                                       |
| **MDX**                | `next-mdx-remote` **^6.0.0** + remark/rehype              | 维持分层管线；不换 Astro                                | 文档 IA                         | frontmatter `seriesSlug` 最小对齐                       | `content/` · schema                        |
| **Tailwind**           | **^4** → lock **4.3.1**                                   | TW4 维护线                                              | 不 bump                         | 不 bump                                                 | 同上                                       |
| **Zod**                | **^4.4.3**                                                | 4.x                                                     | 不 bump                         | schema 增可选 `seriesSlug`                              | `post-frontmatter.ts`                      |
| **SRI**                | `ENABLE_SRI=1` 门闩 · sha384 · 三脚本                     | 保持门闩；**生产 flip 人 gate**                         | 回归绿                          | **再回归** `test:sri` + `check:sri-smoke`               | W1/W2 报告                                 |
| **CSP**                | per-request nonce + `strict-dynamic`                      | 保持                                                    | 不改                            | 不改                                                    | `next.config.ts`                           |
| **内容后端**           | 生产默认 `CONTENT_BACKEND=snapshot`                       | 可重复构建 + snapshot 提交门                            | 现状保持                        | hash 含 IA 字段；`SOURCE_DATE_EPOCH`；workflow 文档门闩 | `content-snapshot` · `content-workflow.md` |
| **依赖 audit high**    | 目标 high=0                                               | 每波门禁                                                | npmjs high=0                    | 再跑 npmjs high=0                                       | audit 命令                                 |
| **CI 质量门**          | format/lint/test/tsc/seo/blur/build/RSS/snapshot/bundle   | 保持绿                                                  | typecheck 0                     | 单元测 + content:build 门                               | `ci.yml`                                   |

## 2. 引擎与 CI 钉

| 项                 | 值                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| engines.node       | `22.x`                                                                                                                      |
| CI `setup-node`    | `node-version: 22`                                                                                                          |
| packageManager     | `pnpm@11.8.0+sha512…`                                                                                                       |
| audit 命令（权威） | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high`                                                       |
| 镜像注意           | 默认 npmmirror **无** audit bulk → 本地 bare `pnpm audit` 可能 `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS`（工具假失败，非包漏洞） |

## 3. SRI / 安全工具链（W1 回归）

| Script                                             | 用途                                           | 生产副作用         |
| -------------------------------------------------- | ---------------------------------------------- | ------------------ |
| `pnpm test:sri`                                    | unit：`scripts/check-sri.test.mjs`             | 无                 |
| `pnpm check:sri-smoke`                             | offline gate：`ENABLE_SRI` 形状 + 可选 `.next` | 无                 |
| `pnpm check:sri -- --file <html> --expect on\|off` | 对构建产物 integrity                           | 无（需本地 build） |

**禁止（W1）：** 未授权切换生产 / Vercel `ENABLE_SRI`；见 ADR `docs/adr/2026-07-21-sri-over-nonce-evaluation.md`。

## 4. 架构主刀对照（半年 · 波次切片）

| 主刀       | 半年                 | W1                                     | W2 已做                                                            | 后续波         |
| ---------- | -------------------- | -------------------------------------- | ------------------------------------------------------------------ | -------------- |
| 内容 IA    | 专题/花园/作品集收口 | **草案** `content-ia-draft-2026-07.md` | **落地**：`seriesSlug` + 路由约定文档 + 文章徽章链 + 存量 5 篇对齐 | 分类 lint 可选 |
| 构建可重复 | snapshot + CI diff   | CI verify 现状                         | contentHash 含 IA 元数据；`SOURCE_DATE_EPOCH`；工作流文档门闩      | 视需           |
| 性能预算   | LCP/路由             | 不写预算表                             | 不做                                                               | W3             |
| 可观测     | ops-readiness / RUM  | 不扩                                   | 不做                                                               | 人账号外部     |

## 5. 明确不做（栈侧）

- 换 **Astro / Vue** 或其它前端框架
- 大爆炸重写 MDX 管线
- monorepo 合并六仓
- 生产 SRI / CSP 策略 flip
- 无矩阵的「随便升」主依赖

## 6. 变更记录

| 日期       | 变更                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| 2026-07-23 | W1 首版落盘（solo claude · worktree `w1-ch-claude`）                      |
| 2026-07-23 | W2 列：IA `seriesSlug` · snapshot 硬化 · SRI/audit 回归（`w2-ch-claude`） |
