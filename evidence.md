# Evidence · ch-content-pipeline-docs (W7 · CH-PERF-010 / CH-CR-010)

| 项       | 值                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| Branch   | `xvyimu/ch-content-pipeline-docs`                                                                                |
| Worktree | `ch-content-pipeline-docs`                                                                                       |
| Base     | master `1f52af9` 链（本 wt 起点）                                                                                |
| Scope    | `scripts/build-content-snapshot.ts` · `docs/content-workflow.md` · `package.json` `content:check` · ops/evidence |
| Node     | v24.16.0（engines 22.x → engine warn only）                                                                      |

## 命令 / exit

| #   | Command              | Exit  | Notes                             |
| --- | -------------------- | ----- | --------------------------------- |
| 1   | `pnpm content:build` | **0** | `unchanged (hash=ec03c7dabca8…)`  |
| 2   | `pnpm content:check` | **0** | build + `git diff --exit-code` 空 |
| 3   | `pnpm typecheck`     | **0** | `tsc --noEmit`                    |
| 4   | `pnpm check:docs`    | **0** | 106 Markdown files                |

未跑全量 `pnpm test` / `pnpm build`（本 wt 无业务逻辑 / snapshot 契约变更；ACCEPTANCE：G-1 typecheck · G-3 content:build）。

## 风险一句

仅文档/脚本 UX；失败路径改为显式 `process.exit(1)`，成功路径与 contentHash 契约不变。
