# Milestone D-03 · 搜索高亮、依赖合并与全仓精简

> 阶段：2026-10-10 ~ 2026-10-13 · 状态：**Completed（最新里程碑）**
> 证据基准：`d6c0584` → `d792c21`
> 关联：[D-02](./milestone-D-02-closeout.md) · 总览 [PROJECT-HISTORY.md](./PROJECT-HISTORY.md)

---

## 1. 目标

处置 R14（搜索规格-实现差）与 R13（dev 树 audit）；合并 5 个 dependabot PR + 对齐 eslint-config-next；修 TS 6.0.3 mock；补 wikilink 门禁；全仓精简。

## 2. 关键提交

| 日期       | commit                                                    | 做了什么                                                                          |
| ---------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 2026-10-10 | `a65584a`                                                 | `fix(deps): override postcss-selector-parser>=7.1.6 for CVE-2026-104844`          |
| 2026-10-10 | `d6c0584`                                                 | `feat(search): R14 处置——词高亮补齐 + 定案不做两项；R13 qs 范围化`（PR #51）      |
| 2026-10-13 | `8a63939`                                                 | `chore(deps-dev): 对齐 eslint-config-next 16.3.5 → 16.4.0`（PR #57）              |
| 2026-10-13 | `0bafc1f` · `d8991e1` · `a91568b` · `4af146d` · `d3c6df0` | dependabot 分组升级（PR #52–#56）                                                 |
| 2026-10-13 | `ff8ac71`                                                 | `fix(deps): TS 6.0.3 mock 修复 + wikilink 门禁补位 + 降级门记账`（D-046，PR #63） |
| 2026-10-13 | `9730740`                                                 | `feat(content): 阅读路径入口 + 继续阅读语义 + 19 篇时效校准`                      |
| 2026-10-13 | `d792c21`                                                 | `chore(deps)+refactor: 合并 4 个 dependabot bump + 全仓精简`（PR #64）            |

## 3. 实现步骤

### 3.1 R14 搜索高亮（`d6c0584`）

- `src/lib/search/engine.ts`：开 `includeMatches`，返回 `SearchResult { item, matches }`。
- 新增 `src/lib/search/highlight.ts`：`highlightSegments`（区间合并/越界钳制）+ `rangesForKey`（字段过滤）。
- `SearchPanel.tsx`：命中段 `<mark class="search-panel__mark">`。
- `home.css`：mark 样式。

**定案不做的两项**（D-045）：

| 要求     | 处置         | 理由                                                  |
| -------- | ------------ | ----------------------------------------------------- |
| 正文索引 | **明确不做** | 20 篇规模要塞 ~100KB 串数据，与「轻量客户端」取向相反 |
| 范围筛选 | **明确不做** | 与分类/标签页功能重叠                                 |
| 词高亮   | **已补齐**   | UI 薄层，Fuse 本就带区间，零新增依赖、零索引体积增量  |

> tags 不高亮（数组字段 value 与序列化值索引对不上）。

### 3.2 R13 qs 范围化（`d6c0584`）

`pnpm-workspace.yaml` override 从精确钉 `6.15.2` 改范围 `>=6.16.0 <7`——精确钉变 stale pin 在本仓**第二次踩**。audit 3 → 1。

### 3.3 TS 6.0.3 mock 修复 + wikilink 门禁（`ff8ac71`）

- **TS6 根因**：TS 6.0 给 `IntersectionObserver` 接口新增 `scrollMargin` 成员，`vitest.setup.ts:25` 与 `TableOfContents.test.tsx:82` 两处手写 mock 类缺它 → `TS2420`。修法：各补一行 `readonly scrollMargin = '0px'`。
- **wikilink 门禁补位**：PR #37 重构时随 link-graph 删掉了坏链 fail-closed 校验；`scripts/audit-content-graph.ts` 本就 `exitCode=1`，只是没挂 CI。加 `pnpm check:content-graph` 并纳入 quality job。
- **降级门记账**（R16）：修三处中的两处——`check-production-content` 用 `x-vercel-id` 区分 CF 边缘拦截；`wait-for-deployment` 加 `apiEverSucceeded` 标志；`check-bundle-budget` 加「全 0 KB」fail-closed 守卫。

### 3.4 全仓精简（`d792c21`）

净删 **862 行**（+602/−1464），23 文件，三个独立 commit：

- `content-dirs.ts` 删 `links` 键 + `data/links.json`（30KB 死文件）。
- `tokens.css` 删死变量（`--cta` / `--atelier-rail` / `--shadow-md,lg,xl` / `--space-1..16`）。
- 4 处 `if`-guard 弱测试补 `expect(length).toBeGreaterThan(0)`。
- 去 14 处零外部消费者 export。
- SRI 门禁补位（`check:sri-smoke` + `test:sri` 进 CI quality job）。
- bump rehype-pretty-code 0.14.5 / @testing-library/react 16.3.3 / radix-ui 1.8.0 / @types/node 26.6.5。

### 3.5 内容时效校准（`9730740`）

阅读路径入口 + 继续阅读语义 + 19 篇时效校准。

## 4. 涉及文件

**新增**：`src/lib/search/highlight.ts`
**删除**：`data/links.json`（30KB 死文件）
**修改**：`src/lib/search/{engine,index}.ts` · `src/components/search/SearchPanel.tsx` · `src/app/styles/home.css` · `vitest.setup.ts` · `TableOfContents.test.tsx` · `package.json` · `.github/workflows/ci.yml` · `pnpm-workspace.yaml` · `src/lib/content-dirs.ts` · `src/app/styles/tokens.css`

## 5. 数据或接口变化

- 搜索返回类型：`SearchResult { item, matches }`（含命中区间）。
- 删除 `data/links.json` 与 `content-dirs.ts` 的 `links` 键。

## 6. 验收结果

| 提交      | 命令/指标                          | 结果                                                     | 出处        |
| --------- | ---------------------------------- | -------------------------------------------------------- | ----------- |
| `d6c0584` | `pnpm test`                        | 79 files / 642 tests, exit 0                             | commit body |
| `d6c0584` | `pnpm audit`                       | 3 → 1                                                    | commit body |
| `d6c0584` | `pnpm build`                       | exit 0                                                   | commit body |
| `ff8ac71` | `pnpm test`                        | 80 files / 648 tests, exit 0                             | commit body |
| `ff8ac71` | `pnpm check:content-graph`         | exit 0（临时塞坏 slug → exit 1，撤除后 git status 干净） | commit body |
| `ff8ac71` | `tsc --noEmit`（TS6）              | exit 0                                                   | commit body |
| `d792c21` | `pnpm test`                        | **80 files / 662 tests, exit 0**                         | commit body |
| `d792c21` | `tsc` / lint / format / check:docs | 全 exit 0                                                | commit body |
| `8a63939` | `pnpm test`                        | 648/648, exit 0                                          | commit body |

## 7. 遗留问题

- **R13 剩余 1 条**：`braces` high（`glob>micromatch>braces`），修复版 3.0.4 上游未发布，无解，等上游。
- **R16 剩余 1 条盲区**：「CF 拦 CI」——内容正确性该 run 未验证，根治需允许清单探针身份或 zone 内探测。
- **`docs/HANDOFF.md` 漂移**：状态行日期仍为 2026-10-10，`origin/master` 仍写 `0efc7c8`（实际 `d792c21`），Vitest 仍写 78/628（实际 80/662）。本里程碑的取证发现，**未在本轮回填**。

## 8. 与今日的差异

本里程碑即「今日」状态（2026-10-14）。当前基线见 [PROJECT-HISTORY.md](./PROJECT-HISTORY.md) §5 与 `docs/HANDOFF.md` §2。
