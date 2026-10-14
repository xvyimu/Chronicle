# Milestone C-01 · 文档标准化、a11y 与提交门

> 阶段：2026-08-22 ~ 2026-09-19 · 状态：**Completed（历史里程碑）**
> 证据基准：`07f520f` → `9ac4ce6`
> 关联：[B-06](./milestone-B-06-perf-waves.md) · 后续 [C-02](./milestone-C-02-depsec.md)

---

## 1. 目标

补齐 `eslint-config-next` 未启用的 jsx-a11y 规则；加 commitlint 提交信息门；按全局文档标准收敛文档落点、统一 ADR 命名编号、清理失效引用；死链门禁加 `file:///` 校验。

## 2. 关键提交

| 日期       | commit    | 做了什么                                                         |
| ---------- | --------- | ---------------------------------------------------------------- |
| 2026-08-22 | `07f520f` | `feat(a11y): 补齐 eslint-config-next 未启用的四条 jsx-a11y 规则` |
| 2026-08-22 | `d265bbf` | `test(mutation): 订正变异测试基线并修 fast-uri 幽灵版本`         |
| 2026-08-22 | `6094336` | `ci(commit): 加 commitlint 提交信息门`                           |
| 2026-09-12 | `…`       | `docs(config): 补全 CLAUDE.md 常用命令并封装 /check /review`     |
| 2026-09-17 | `77aed81` | `docs(adr): 统一 ADR 目录、命名与编号`                           |
| 2026-09-17 | `85cbfb9` | `docs(adr): 补 MADR 4 YAML frontmatter`                          |
| 2026-09-17 | `c811a78` | `docs(arch): 架构文档收敛为单一的 docs/ARCHITECTURE.md`          |
| 2026-09-17 | `7dab9e3` | `docs: 统一交接文档命名为 docs/HANDOFF.md`                       |
| 2026-09-17 | `52daf58` | `docs: 建立会话三件套约定`                                       |
| 2026-09-17 | `5cc9d86` | `docs: 组合级 SSOT 迁出 .planning/，六仓口径改三仓`              |
| 2026-09-19 | `c63e031` | `ci(docs): 死链门禁加 file:/// 绝对路径校验与历史快照降级`       |
| 2026-09-19 | `4f230b6` | `docs(agents): 测试计数标注为实跑口径，写明数字会漂`             |

## 3. 实现步骤

### 3.1 a11y 规则补全（`07f520f`）

补 `click-events-have-key-events` / `interactive-supports-focus` / `anchor-is-valid` / `mouse-events-have-key-events` 四条规则；`src/components/blog/ImageZoom.tsx` overlay 补 `onKeyDown`。

> **坑**：flat config 下不能重复注册 `jsx-a11y` plugin，否则 `ConfigError` 使 lint 起不来。四条规则逐条用临时探针实证会触发（探针已删）。

### 3.2 变异测试基线订正（`d265bbf`）

- 新增 `vitest.stryker.config.ts`。
- `stryker.config` 阈值 break 71 → 55：原基线注释把 `noCoverage` 当 killed，真实分数 58.30%（非 71%）。
- `test-utils` 从 mutate 范围排除后 mutants 2379 → 2287。
- fast-uri override 原写 `>=4.1.2` 指向 registry **不存在的幽灵版本**，改精确钉 4.1.1。

### 3.3 commitlint 门（`6094336`）

- `.husky/commit-msg` + `commitlint.config.mjs`（65 行）。
- `type-enum` 非 conventional 默认表，按近 200 次提交实测分布定：`docs 64 · feat 38 · fix 28 · refactor 12 · perf 11 · chore 11 · integrate 9 · test 6 · merge 3 · ci 3 · content 2 · style 1`。
- `subject-case` 关掉（中文 subject 大小写无意义）；`header-max-length` 100（实测最长真实 subject 96 字符）。

### 3.4 文档标准化（2026-09-17 系列）

按全局文档标准（`~/.claude/templates/`）收敛：

- ADR 统一命名编号 + MADR 4 YAML frontmatter（status / date / decision-makers）。
- 架构文档收敛为单一的 `docs/ARCHITECTURE.md`。
- 交接文档统一命名为 `docs/HANDOFF.md`。
- 会话三件套约定（`docs/session/`，gitignore）。
- 组合级 SSOT 迁出 `.planning/`（六仓口径改三仓）。
- 架构调研 v1–v4 归档到 `docs/archive/`，`docs/` 顶层不再混放日期型文件。

### 3.5 死链门禁加固（`c63e031`）

`scripts/check-doc-links.mjs` 加 `file:///` 绝对路径校验 + 历史快照降级，补自测进 CI。

## 4. 涉及文件

**修改**：`eslint.config.mjs` · `src/components/blog/ImageZoom.tsx` · `stryker.config` · `vitest.stryker.config.ts` · `.husky/commit-msg` · `commitlint.config.mjs` · `docs/adr/*` · `docs/ARCHITECTURE.md` · `docs/HANDOFF.md` · `docs/README.md` · `AGENTS.md` · `CLAUDE.md` · `scripts/check-doc-links.mjs`
**新增**：`commitlint.config.mjs` · `vitest.stryker.config.ts` · `docs/session/README.md`

## 5. 数据或接口变化

无。纯工具链与文档。

## 6. 验收结果

| 时点      | 命令/指标            | 结果                                                  | 出处        |
| --------- | -------------------- | ----------------------------------------------------- | ----------- |
| `07f520f` | `pnpm lint`          | exit 0                                                | commit body |
| `07f520f` | `pnpm test`          | 759 passed, exit 0                                    | commit body |
| `d265bbf` | `pnpm test:mutation` | 59.77% ≥ break 55, exit 0                             | commit body |
| `6094336` | commitlint 门        | 近 200 条真实 subject → 拒 5 条（带 `@` 前缀噪声）    | commit body |
| `5faeafd` | `check:docs`         | 修 ch-architecture-asis 迁 ops/ 后断链（原本 exit 1） | commit body |
| `c63e031` | 死链门禁             | `file:///` 校验 + 历史快照降级，自测进 CI             | commit body |

## 7. 遗留问题

- fast-uri override 精确钉 4.1.1 —— 后于 2026-08-04（`af9fd85`）抬到 `>=4.1.2`，又于 2026-09-19（`9ac4ce6` 附近）抬到 4.1.3 线并订正「幽灵版本」误判。
- commitlint 注释后于 `07aaadb`（2026-09-19）订正为实测的 16 条历史拒绝。

## 8. 与今日的差异

| 项         | 本阶段（2026-09-19）     | 今日（2026-10-14）                         |
| ---------- | ------------------------ | ------------------------------------------ |
| commitlint | 刚接入                   | 沿用（conventional 前缀 + 中文 body 可用） |
| ADR 编号   | 统一为 MADR 4            | 沿用（0001–0008）                          |
| 交接文档   | 统一为 `docs/HANDOFF.md` | 沿用                                       |
| 死链门禁   | 加 `file:///` 校验       | 沿用（`pnpm check:docs`）                  |
