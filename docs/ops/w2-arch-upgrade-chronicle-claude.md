# W2 · Chronicle · Claude 实现报告

| Field                | Value                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| Agent                | **claude**（solo）                                                                  |
| Wave                 | **W2** · `portfolio-arch-upgrade-2026h2`                                            |
| Product              | Chronicle                                                                           |
| Worktree（绝对路径） | `C:\Users\yuanjia\orca\workspaces\Chronicle\w2-ch-claude`                           |
| Branch               | `xvyimu/w2-ch-claude`                                                               |
| Tip（开工 / HEAD）   | `44c10d0` · docs(ops): W1 stack-matrix + content IA draft + SRI regression          |
| 报告路径             | `docs/ops/w2-arch-upgrade-chronicle-claude.md`（本文件）                            |
| 共享题单             | `D:\orca\.planning\portfolio-arch-upgrade-2026h2\prompts\w2-shared.md` · `w2-ch.md` |
| 分仓卡               | `repos/ch.md` · W1 报告 `docs/ops/w1-arch-upgrade-chronicle-claude.md`              |

---

## 1. 做了什么

### 1.1 内容 IA 落地（最小代码 + 约定文档）

| 项     | 说明                                                                                       |
| ------ | ------------------------------------------------------------------------------------------ |
| Schema | `postFrontmatterSchema` 增可选 **`seriesSlug`**（Unicode 字母/数字/中文 + 连字符）         |
| 聚合   | `src/lib/series.ts`：`resolveSeriesSlug`；组内优先显式 slug；组内冲突 **fail closed**      |
| UI     | `ArticleHeader` 专题徽章链到 `/series/${encodeURIComponent(seriesSlug)}`                   |
| 存量   | 5 篇「个人服务部署路线」MDX 补 `seriesSlug: '个人服务部署路线'`（**URL 不变**）            |
| 文档   | `docs/ops/content-ia-draft-2026-07.md` 升为 W2 约定；`docs/content-workflow.md` 字段表同步 |

**禁止范围遵守：** 无 App Router 大改、无换栈、无 alias 表 / 无 category 强制 lint。

### 1.2 构建可重复（snapshot 硬化 + 文档门闩）

| 项                  | 说明                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| contentHash         | 纳入 `series` / `seriesSlug` / `seriesOrder` / `category` / sorted `tags` + 正文 sha256（IA 元数据漂移会触发 CI snapshot diff） |
| `SOURCE_DATE_EPOCH` | `resolveSnapshotBuiltAt`：可冻 `manifest.builtAt`；hash 未变时仍 skip write                                                     |
| 脚本头注释          | `scripts/build-content-snapshot.ts` 文档化 env                                                                                  |
| 工作流文档          | `content-workflow.md` 门闩表：`content:build` + CI `git diff --exit-code`                                                       |
| 产物                | 已 `pnpm content:build`，`generated/content-snapshot/*` 含 `seriesSlug`（posts 20）                                             |

### 1.3 SRI 回归 + audit high

| #   | Command                                                               | Exit  | Result                         |
| --- | --------------------------------------------------------------------- | ----- | ------------------------------ |
| 1   | `pnpm test:sri`                                                       | **0** | 6 pass · 0 fail                |
| 2   | `pnpm check:sri-smoke`                                                | **0** | offline gate PASS              |
| 3   | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high` | **0** | No known vulnerabilities found |

未改 `next.config` SRI 默认；未触碰生产 / Vercel `ENABLE_SRI`。

### 1.4 聚焦单测 + typecheck

| #   | Command                                                                        | Exit  | Result                       |
| --- | ------------------------------------------------------------------------------ | ----- | ---------------------------- |
| 4   | `pnpm exec vitest run`（series / frontmatter / content-snapshot / series app） | **0** | 5 files · **34** tests pass  |
| 5   | `pnpm typecheck`                                                               | **0** | 全绿                         |
| 6   | `pnpm content:build`                                                           | **0** | wrote · hash `ec03c7dabca8…` |

### 1.5 stack-matrix W2 列

- 更新 [`docs/ops/stack-matrix-2026-07.md`](./stack-matrix-2026-07.md)：W1 / **W2 已做** 分列；架构主刀对照勾选 IA + snapshot。

---

## 2. 没做什么（题单 + 共享禁止）

| 项                                 | 原因                    |
| ---------------------------------- | ----------------------- |
| 换 Astro / Vue / 框架              | 红线                    |
| 生产 `ENABLE_SRI` flip             | 人 gate · W2 禁         |
| GSC / Bing 代登                    | blocked-human           |
| `git push` / 合 master / 开 PR     | 总控 · 用户要求 no push |
| category 必填 / CI lint 全量       | 可选后续 · 非本波强制   |
| series alias 表 / 大范围 redirects | 无迁移需求 · URL 保持   |
| 性能预算 / RUM                     | W3                      |
| monorepo / 换栈 rewrite            | 禁止                    |

---

## 3. 验证摘录

### 3.1 `pnpm test:sri`

```text
✔ extracts only next-static script and stylesheet link tags
✔ expect on passes when at least one sha384 integrity present
✔ expect on fails when no integrity
✔ expect off passes with zero integrity attrs
✔ expect off fails when integrity present
✔ absolute next static urls are in scope
ℹ tests 6 · pass 6 · fail 0
TEST_SRI_EXIT=0
```

### 3.2 `pnpm check:sri-smoke`

```text
Chronicle SRI smoke
mode: offline
PASS  next-config-sri-gate: ENABLE_SRI=1 gate + sha384 + sriExperiment present
PASS  local-build-artifacts: skip (no .next); offline gate-only mode
SRI_SMOKE_EXIT=0
```

### 3.3 audit

```text
No known vulnerabilities found
AUDIT_EXIT=0
```

### 3.4 环境注记

| 项           | 值                                                        |
| ------------ | --------------------------------------------------------- |
| 本机 Node    | **v24.16.0** → engines `22.x` **WARN only**               |
| pnpm         | **11.8.0**                                                |
| CI 目标 Node | **22**                                                    |
| Worktree     | `C:\Users\yuanjia\orca\workspaces\Chronicle\w2-ch-claude` |

---

## 4. 变更文件清单（相对 tip `44c10d0`）

```text
# IA / schema / series
src/lib/schemas/post-frontmatter.ts
src/lib/schemas/post-frontmatter.test.ts
src/lib/series.ts
src/lib/series.test.ts
src/components/blog/ArticleHeader.tsx
content/blog/2026-06-vps-initial-setup.mdx
content/blog/2026-06-docker-deploy-guide.mdx
content/blog/2026-06-nginx-reverse-proxy.mdx
content/blog/2026-06-git-hooks-github-actions.mdx
content/blog/2026-06-cicd-pipeline-design.mdx

# snapshot 可重复
src/lib/content-snapshot/build.ts
src/lib/content-snapshot/build.test.ts
src/lib/content-snapshot/types.ts
scripts/build-content-snapshot.ts
generated/content-snapshot/*   (manifest + posts + graph + search; positions 未漂)

# docs
docs/ops/content-ia-draft-2026-07.md
docs/ops/stack-matrix-2026-07.md
docs/content-workflow.md
docs/ops/w2-arch-upgrade-chronicle-claude.md  (本报告)
```

---

## 5. 验收对照（w2-ch.md）

| 验收项                                           | 状态                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| IA 有可审增量（路由约定 + 最小代码/frontmatter） | ✓                                                                |
| 构建/SRI 相关命令 0                              | ✓ content:build · test:sri · sri-smoke · typecheck · 聚焦 vitest |
| audit high = 0                                   | ✓ npmjs                                                          |
| 报告在本 worktree                                | ✓                                                                |
| 无 push / 无 stack rewrite / 无生产 SRI flip     | ✓                                                                |

---

## 6. 总控合入提示

- 分支：`xvyimu/w2-ch-claude`
- 含小代码 + 内容 frontmatter + snapshot 提交；与 W1 docs 正交
- 可本地 commit；**本 agent 不 push**
- 建议 commit message：

```text
feat(content): W2 IA seriesSlug + snapshot hash harden + report
```
