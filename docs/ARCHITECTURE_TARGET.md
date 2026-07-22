# Chronicle · 架构 Target（L2 内容遗留）

> **角色**：L2 Target 一页纸 · Dual-B 文书 · 2026-07-22  
> **状态**：Active（**不**启动栈迁移；巩固 As-Is 边界）  
> **As-Is**：[`ARCHITECTURE_ASIS.md`](./ARCHITECTURE_ASIS.md)  
> **运行时边界**：[`architecture.md`](./architecture.md) · [`handoff-to-agent.md`](./handoff-to-agent.md)  
> **Master 参考**：`D:\orca\docs\architecture-stack-refactor-master-2026-07-22.md`（§0 铁律：主参考非教条；R2 可被证据推翻）  
> **性质**：个人博客 + 作品集 + 轻量数字花园（**内容站**，非管理面板 / 非网关 / 非 AI 核心）

---

## 1. 一句话目标态

**维持** 100% TypeScript / Next.js 16 内容站：**本地 MDX/JSON → repository + snapshot → App Router 动态 HTML（CSP nonce）+ 可选 SRI（`ENABLE_SRI=1`）+ 三条公开 API**。  
**不**整站改 Vue3+NaiveUI，**不**引入 Go 网关 / Python AI-Core / SQL 内容权威源，**不**与 TransitHub / MindSync 抢架构重构带宽。

| 维度       | Target（L2）                                                                           |
| ---------- | -------------------------------------------------------------------------------------- |
| 策略标签   | **`L2` 内容遗留**                                                                      |
| 主栈       | **Next.js 16 App Router + React 19 + TypeScript + MDX + Tailwind/BEM**                 |
| 面板       | **无**自建管理台；Git + MDX/JSON 即 CMS                                                |
| 对外面     | 公开阅读 HTML + `GET /api/search` · `GET /api/preview/[slug]` · `POST /api/csp-report` |
| 存储       | 本地文件 + `generated/content-snapshot`；**无** RDBMS                                  |
| 安全       | CSP per-request **nonce** + `strict-dynamic`；生产 **SRI sha384**（env 门闩，见 ADR）  |
| 与旗舰关系 | **正交**；旗舰精力投 TransitHub / MindSync                                             |

---

## 2. 相对主参考的 Target 决策（巩固 ASIS §7.3）

| 主参考组件          | Chronicle Target             | 裁定                                              |
| ------------------- | ---------------------------- | ------------------------------------------------- |
| TS + Vue3 + NaiveUI | **保留 Next + React 阅读站** | **用更好/更适配替代**面板默认（内容站非 Console） |
| Go 网关             | **不引入**                   | 三 API 无租户/计费/网关职责                       |
| Python AI-Core      | **不引入**                   | 产品无 LLM 编排                                   |
| SQL                 | **不引入**为内容权威源       | 维持 Git-as-CMS + snapshot                        |
| Git / Shell / CI    | **一等公民保留**             | scripts + GitHub Actions + Vercel                 |
| C / 嵌入式          | **无关**                     | SIDE 另线                                         |

**Better-wins 停损**：仅当出现可度量证据（例如必须自建多作者协作后台、且 nonce/CSP 模型可另立 Console 仓）时，才开 **独立 Console 仓**（默认 Vue3+NaiveUI）；**禁止**在本仓绞杀式重写阅读站。

---

## 3. 目标分层（与 As-Is 同构）

```text
content/ + data/ + generated/content-snapshot/
        │
        ▼
src/lib/*          repositories · Zod · cache · search DTO
        ▲
src/server/*       content facade · search · rate-limit
        ▲
src/app/*          pages · metadata · sitemap/robots · api/*
        │
src/components/*   UI only — 禁止 import @/server
```

| 硬规则                              | Target 动作                                                    |
| ----------------------------------- | -------------------------------------------------------------- |
| HTML 动态 + CSP nonce               | **保持**；不为 SSG 放宽 `unsafe-inline`                        |
| SRI 仅 `ENABLE_SRI=1` 时打开        | **保持**门闩；本地/CI smoke 可验证，**不**在 Dual-B 改生产 env |
| `components ↛ @/server`             | **保持**（`module-boundaries` 测试）                           |
| `CONTENT_BACKEND=snapshot` 生产默认 | **保持**                                                       |
| 图片仅本地                          | **保持**（`remotePatterns: []`）                               |

---

## 4. 允许 / 禁止（维护边界）

### 4.1 允许（L2 内 · 小步）

| 类别       | 示例                                                     |
| ---------- | -------------------------------------------------------- |
| 安全/依赖  | CSP/SRI 补丁、`pnpm audit` 高危清零、依赖定点升级        |
| 内容与 SEO | MDX/JSON、RSS、sitemap、`check:seo` / production-content |
| 运维门禁   | `check:ops-readiness`、SRI smoke、bundle budget、e2e     |
| 文档       | ASIS/TARGET、ADR、ops 波次报告、合规 NOTICE/THIRD_PARTY  |
| UX 小步    | 在现有 BEM/组件边界内的阅读体验改进                      |

### 4.2 禁止（借架构名义也不做）

| 禁止项                                      | 说明                          |
| ------------------------------------------- | ----------------------------- |
| 整站 Vue / 换栈重写                         | 无 R2 证据；ROI 负（ASIS §8） |
| 本仓生长 Console/Gateway/AI-Core            | 职责外；Console 须**新仓**    |
| 生产 cutover / 擅自改 Vercel Production env | 须人授权；Dual-B **禁止**     |
| 假造 GSC/Bing 指标                          | 账号类事项 **blocked-human**  |
| 大重构数字花园 / 搜索引擎替换（无 ADR）     | 见既有 fuse keep ADR          |

---

## 5. 成功标准（L2 维护态）

| #   | 标准                                                | 证据方向                                      |
| --- | --------------------------------------------------- | --------------------------------------------- |
| 1   | 标签稳定为 **L2**，文档 ASIS↔TARGET 互指            | 本文件 + ASIS                                 |
| 2   | 生产可读：nonce CSP 保留；SRI 按 ADR/生产 env       | ADR SRI · `check:sri-smoke`                   |
| 3   | 质量门：typecheck / test / seo / ops-readiness 可绿 | package scripts                               |
| 4   | 合规：LICENSE + NOTICE + 第三方摘要可查             | 根 `LICENSE`/`NOTICE` · `docs/THIRD_PARTY.md` |
| 5   | 无 Vue/Go/Python 运行时渗入本仓                     | 语言清零扫描（ASIS）                          |

---

## 6. Manual defer（人账，非本波自动关闭）

| ID      | 事项                                      | 原因                               |
| ------- | ----------------------------------------- | ---------------------------------- |
| P0-GSC  | Google Search Console 验证 + sitemap 提交 | 需域名 DNS / 账号 owner            |
| P0-Bing | Bing Webmaster（宜 GSC 后导入）           | 同上                               |
| P1-RUM  | Speed Insights p75 读数写入基线           | 需样本与 token；禁止用实验室分顶替 |

---

## 7. 索引

| 文档                                                                                           | 用途             |
| ---------------------------------------------------------------------------------------------- | ---------------- |
| [`ARCHITECTURE_ASIS.md`](./ARCHITECTURE_ASIS.md)                                               | 测绘事实         |
| [`architecture.md`](./architecture.md)                                                         | 接手用运行时边界 |
| [`adr/2026-07-21-sri-over-nonce-evaluation.md`](./adr/2026-07-21-sri-over-nonce-evaluation.md) | SRI 决策         |
| [`ops/L2-P0-action-board-2026-07-22.md`](./ops/L2-P0-action-board-2026-07-22.md)               | P0 看板          |
| [`THIRD_PARTY.md`](./THIRD_PARTY.md)                                                           | 第三方许可摘要   |

---

**Target 裁定句**：Chronicle = **L2 维持 Next 内容遗留**；工程活动限于安全/内容/ops/文档，**不以对齐主参考语言表为名开重写。**
