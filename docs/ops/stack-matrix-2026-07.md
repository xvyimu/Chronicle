# Chronicle · 栈矩阵 · 2026-07

> 组合包：`portfolio-arch-upgrade-2026h2` · 波次 **W1–W4 收口**  
> 仓：`xvyimu/Chronicle` · 产品：内容站（非 AI SaaS）  
> 冻结日：2026-07-23 · W1 tip：`24506a2` · W2：`xvyimu/w2-ch-claude` · W3：`xvyimu/w3-ch-claude` · W4：`xvyimu/w4-ch-claude`  
> W4 tip（开工 / HEAD）：`e256f5a` · docs(ops): W3 perf budget + ops checklist

## 1. 当前 → 目标 → 波次切片 → 终态

| 层                     | 当前（实测 / lock）                                       | 半年目标                                                | W1                              | W2 已做                                                 | W3 已做                                        | **W4 收口 / 终态**                                              | 证据                                       |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------- | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| **Node engines**       | `package.json` `22.x` · `.nvmrc` / `.node-version` = `22` | CI **严格 22**；本地可 22；docs 注明 mirror/engine WARN | 矩阵落盘；CI `node-version: 22` | 不改                                                    | 不改；本机 v24 WARN only                       | **完成** · CI 钉 22；本机 v24 仍 WARN only（非阻断）            | `.github/workflows/ci.yml` · 本文件        |
| **本地 Node（本 wt）** | 本机可能 **v24**（engine WARN only）                      | 不强制改本机；CI 以 22 为准                             | 记录 WARN                       | 记录 WARN                                               | 记录 WARN                                      | **维持** · W4 实测 v24.16.0 WARN only                           | `node -v`                                  |
| **pnpm**               | `packageManager` **11.8.0**                               | 跟组合 **≥11.5**                                        | 已 ≥11.5                        | 不降级                                                  | 不降级                                         | **完成** · 11.8.0 ≥ 11.5                                        | `package.json`                             |
| **Next.js**            | **16.2.9**（钉）                                          | 补丁线（16.2.x）                                        | **不 bump**                     | **不 bump**                                             | **不 bump**                                    | **完成（钉补丁）** · 16.2.9；下半年按需 16.2.x / 安全补丁       | lock / `package.json`                      |
| **React / react-dom**  | **19.2.4**                                                | 跟 Next 兼容补丁线                                      | 不 bump                         | 不 bump                                                 | 不 bump                                        | **完成（跟 Next）**                                             | 同上                                       |
| **TypeScript**         | **^5** → lock **5.9.3**                                   | 5.x 维护线                                              | 不 bump                         | 不 bump                                                 | 不 bump                                        | **完成**                                                        | 同上                                       |
| **MDX**                | `next-mdx-remote` **^6.0.0** + remark/rehype              | 维持分层管线；不换 Astro                                | 文档 IA                         | frontmatter `seriesSlug` 最小对齐                       | workflow 写作指引补 seriesSlug 残余            | **完成** · 无换栈证明（W1–W4 无 Astro/Vue PR）                  | `content/` · schema · content-workflow     |
| **Tailwind**           | **^4** → lock **4.3.1**                                   | TW4 维护线                                              | 不 bump                         | 不 bump                                                 | 不 bump                                        | **完成**                                                        | 同上                                       |
| **Zod**                | **^4.4.3**                                                | 4.x                                                     | 不 bump                         | schema 增可选 `seriesSlug`                              | 不改                                           | **完成**                                                        | `post-frontmatter.ts`                      |
| **SRI**                | `ENABLE_SRI=1` 门闩 · sha384 · 三脚本                     | 保持门闩；**生产 flip 人 gate**                         | 回归绿                          | **再回归** `test:sri` + `check:sri-smoke`               | **再回归** exit 0                              | **完成（门闩+回归）** · W4 再跑 exit 0；**未**改生产 flip 代码  | W1–W4 报告                                 |
| **CSP**                | per-request nonce + `strict-dynamic`                      | 保持                                                    | 不改                            | 不改                                                    | 不改                                           | **完成（保持）**                                                | `next.config.ts`                           |
| **内容后端**           | 生产默认 `CONTENT_BACKEND=snapshot`                       | 可重复构建 + snapshot 提交门                            | 现状保持                        | hash 含 IA 字段；`SOURCE_DATE_EPOCH`；workflow 文档门闩 | 不改                                           | **完成** · snapshot 门闩维持                                    | `content-snapshot` · `content-workflow.md` |
| **性能预算**           | LH + bundle 已有门禁                                      | 路由/LCP/静态策略卡                                     | 不写预算表                      | 不做                                                    | **`perf-budget-2026-07.md`**                   | **完成** · W4 勾选「已验证」+ 下半年 backlog；链 ops-checklist  | W3–W4 报告                                 |
| **依赖 audit high**    | 目标 high=0                                               | 每波门禁                                                | npmjs high=0                    | 再跑 npmjs high=0                                       | 再跑 npmjs high=0                              | **完成** · W4 再跑 high=0                                       | audit 命令                                 |
| **CI 质量门**          | format/lint/test/tsc/seo/blur/build/RSS/snapshot/bundle   | 保持绿                                                  | typecheck 0                     | 单元测 + content:build 门                               | typecheck + 聚焦 vitest + ops-readiness 0      | **完成** · W4 typecheck + 聚焦 vitest + ops-readiness 0         | `ci.yml` · W4 报告                         |
| **运营清单**           | ops-deferred · L2 board                                   | GSC 仍人账号                                            | —                               | —                                                       | **`ops-checklist-2026-07.md`** + P0 board 刷新 | **完成（工程侧）** · W4 复勾；GSC/Bing/RUM 仍人账号（书面延期） | W3–W4 报告                                 |

## 2. 半年目标完成度（W4 收口）

| #   | 半年卡 / S7 对齐                 | 完成度        | 说明                                                                           |
| --- | -------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| S7a | 内容/构建架构卡（IA + snapshot） | **100%** 工程 | W1 草案 · W2 `seriesSlug` 落地 · W2 hash/`SOURCE_DATE_EPOCH` · W3 残余写作指引 |
| S7b | 栈跟线无大重写                   | **100%**      | Next 16.2.9 / React 19.2.4 钉补丁；**无** Astro/Vue/monorepo 合并              |
| S7c | 性能预算 + 可跑 check            | **100%** 工程 | `perf-budget-2026-07.md` + SRI/audit/ops 每波复验；LH 权威在 CI                |
| S7d | 可观测 / 运营人账                | **~40%** 组合 | 工程门禁齐；GSC/Bing/RUM **blocked_auth / pending**（非工程失败）              |
| —   | **综合（工程主刀）**             | **~95%**      | 人账号外部项不阻塞「无大重写证明」；下半年 backlog 见 §7                       |

## 3. 引擎与 CI 钉

| 项                 | 值                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| engines.node       | `22.x`                                                                                                                      |
| CI `setup-node`    | `node-version: 22`                                                                                                          |
| packageManager     | `pnpm@11.8.0+sha512…`                                                                                                       |
| audit 命令（权威） | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high`                                                       |
| 镜像注意           | 默认 npmmirror **无** audit bulk → 本地 bare `pnpm audit` 可能 `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS`（工具假失败，非包漏洞） |

## 4. SRI / 安全工具链

| Script                                             | 用途                                           | 生产副作用         |
| -------------------------------------------------- | ---------------------------------------------- | ------------------ |
| `pnpm test:sri`                                    | unit：`scripts/check-sri.test.mjs`             | 无                 |
| `pnpm check:sri-smoke`                             | offline gate：`ENABLE_SRI` 形状 + 可选 `.next` | 无                 |
| `pnpm check:sri -- --file <html> --expect on\|off` | 对构建产物 integrity                           | 无（需本地 build） |

**禁止（全年）：** 未授权切换生产 / Vercel `ENABLE_SRI` 策略代码路径；见 ADR `docs/adr/2026-07-21-sri-over-nonce-evaluation.md`。

## 5. 架构主刀对照（半年 · 波次切片 · 终态）

| 主刀       | 半年                 | W1                                     | W2 已做                                                            | W3 已做                                                             | **W4 终态**                                            |
| ---------- | -------------------- | -------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------ |
| 内容 IA    | 专题/花园/作品集收口 | **草案** `content-ia-draft-2026-07.md` | **落地**：`seriesSlug` + 路由约定文档 + 文章徽章链 + 存量 5 篇对齐 | workflow 写作指引补 seriesSlug；IA 草案链 perf-budget               | **收口** · 约定稳定；分类 lint / 体裁枚举 → 下半年可选 |
| 构建可重复 | snapshot + CI diff   | CI verify 现状                         | contentHash 含 IA 元数据；`SOURCE_DATE_EPOCH`；工作流文档门闩      | 不改                                                                | **收口** · 门闩维持；无新构建重写                      |
| 性能预算   | LCP/路由             | 不写预算表                             | 不做                                                               | **`docs/ops/perf-budget-2026-07.md`**（路由/LCP/静态 + 可跑 check） | **收口** · 已验证勾选 + 下半年 backlog（RUM/Garden）   |
| 可观测     | ops-readiness / RUM  | 不扩                                   | 不做                                                               | 运营清单刷新；GSC/Bing 仍 `blocked_auth`；ops-readiness exit 0      | **收口** · 工程侧完成；人账号项书面进 backlog          |

## 6. 明确不做（栈侧 · W4 仍成立）

- 换 **Astro / Vue** 或其它前端框架
- 大爆炸重写 MDX 管线
- monorepo 合并六仓
- 生产 SRI / CSP 策略 flip
- 无矩阵的「随便升」主依赖
- Agent 代登 GSC / Bing / 伪造 p75

## 7. 下半年 backlog（3 条 · W4 钉死）

| #   | 项                                                                                        | Owner        | 解除 / 触发条件                                                 | 非目标                         |
| --- | ----------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------- | ------------------------------ |
| B1  | **GSC 域名验证 + sitemap 提交**，随后 Bing 从 GSC 导入                                    | 用户（账号） | Google 账号 + DNS TXT；剧本 `ops-deferred` §3–4 · ops-checklist | Agent 代登                     |
| B2  | **Speed Insights 六页 p75 回填**到 `performance-baseline`                                 | 用户（只读） | Vercel 只读权限 + 足够样本；**禁用 LH 代填 p75**                | 用 lab 数字冒充字段            |
| B3  | **按证据优化**：超 perf-budget 或 RUM 调查阈值后再动；可选分类 lint / Garden 债单独 issue | 工程         | CI LH 或 p75 触发；Next/安全补丁按矩阵 bump                     | 无证据换栈 / Garden 大重构主线 |

## 8. 变更记录

| 日期       | 变更                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------- |
| 2026-07-23 | W1 首版落盘（solo claude · worktree `w1-ch-claude`）                                        |
| 2026-07-23 | W2 列：IA `seriesSlug` · snapshot 硬化 · SRI/audit 回归（`w2-ch-claude`）                   |
| 2026-07-23 | W3 列：perf-budget · 运营清单 · SRI/audit 再回归 · IA 残余（`w3-ch-claude`）                |
| 2026-07-23 | **W4 收口**：终态列 · 半年完成度 · 下半年 backlog 3 条 · SRI/audit 再回归（`w4-ch-claude`） |
