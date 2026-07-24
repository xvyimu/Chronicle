# CH-PERF-010 / CH-CR-010 · content pipeline 纪律醒目化 · 2026-07-24

> Worktree：`ch-content-pipeline-docs` · Branch：`xvyimu/ch-content-pipeline-docs`  
> WEEK-BACKLOG **W7** · 模块 M-CH-content-pipeline-docs  
> 范围：只改脚本失败 UX + 工作流文档 + 可选 `content:check` · **未**洗业务 MDX · **未**改 snapshot 契约 · **未**放宽 CSP

## 问题（findings）

| id              | 症状                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| **CH-PERF-010** | snapshot 纪律清晰但本地易忘 `content:build`；文档/脚本不够醒目           |
| **CH-CR-010**   | 改 MDX 后依赖人/CI 才发现漂移；dev 默认 `fs` 易与 prod snapshot 体感脱节 |

CI 已有：`pnpm content:build` + `git diff --exit-code -- generated/content-snapshot`（`.github/workflows/ci.yml` quality）。本 wt **不**改 CI 契约，只把同样语义写到文档顶栏 + 本地 `content:check` 别名 + 失败条幅。

## 变更摘要

| 文件                                | 作用                                                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/build-content-snapshot.ts` | `failLoud`：条幅 + 原因 + Fix 四步 + CI 红条说明；load/build/write/unexpected 均 catch → `process.exit(1)`；成功 write 后提醒 commit snapshot |
| `docs/content-workflow.md`          | **顶部必跑门闩**（content:build / commit / content:check / CI 红）；快照节与合并前检查补 `content:check`                                      |
| `package.json`                      | 新增 `"content:check": "tsx scripts/build-content-snapshot.ts && git diff --exit-code -- generated/content-snapshot"`                         |
| 本文件 · 根 `evidence.md`           | 命令 + exit                                                                                                                                   |

### 未改

- `generated/content-snapshot/*` 产物格式 / contentHash 算法
- 业务 MDX 文案
- CSP / proxy / layout
- CI workflow 步骤（已足够；本地对齐即可）

## 验证

见根 `evidence.md` 表（本条消息实跑 exit）。

## 残留

- 无 pre-commit 自动 `content:check`（husky 仅 lint-staged）——刻意不做，避免无关提交拖慢；靠文档 + CI + 可选 alias
- 开发者仍可在 dev `fs` 下预览未提交 snapshot 的 MDX；生产一致性仍靠 commit + CI
