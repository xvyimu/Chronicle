# Iterations · 迭代与里程碑索引

> 本目录有两类记录：**里程碑文档**（全生命周期，`milestone-*`）与**工作台重构迭代**（2026-10-06 那轮，`iteration-*`）。
> 总览入口：[PROJECT-HISTORY.md](./PROJECT-HISTORY.md)（从创建到完成的时间线）。
> 状态用 Planned / In Progress / Blocked / Completed / Cancelled。

## 里程碑系列（全生命周期 · 2026-06 → 2026-10）

按时间顺序，每个里程碑一份独立文档，含实现步骤与验收结果。早期阶段（A/B/C）为 2026-10-14 补齐的历史取证，D 段为最新阶段。

| 里程碑 | 时间窗             | 名称                              | 状态      | 文档                                                                           |
| ------ | ------------------ | --------------------------------- | --------- | ------------------------------------------------------------------------------ |
| A-01   | 2026-06-21 ~ 06-24 | 建站与内容体系                    | Completed | [milestone-A-01-bootstrap.md](./milestone-A-01-bootstrap.md)                   |
| A-02   | 2026-06-25 ~ 06-27 | 结构性重组与 CSP                  | Completed | [milestone-A-02-restructure-csp.md](./milestone-A-02-restructure-csp.md)       |
| A-03   | 2026-06-28 ~ 06-30 | 编辑式首页与性能门禁              | Completed | [milestone-A-03-editorial-home.md](./milestone-A-03-editorial-home.md)         |
| A-04   | 2026-07-03 ~ 07-05 | 文档治理、shadcn 与 Paper Gallery | Completed | [milestone-A-04-docs-shadcn.md](./milestone-A-04-docs-shadcn.md)               |
| B-01   | 2026-07-06 ~ 07-12 | 内容运营基线与服务端搜索          | Completed | [milestone-B-01-content-ops-search.md](./milestone-B-01-content-ops-search.md) |
| B-02   | 2026-07-16 ~ 07-18 | 审计加固与前后端逻辑边界          | Completed | [milestone-B-02-audit-boundary.md](./milestone-B-02-audit-boundary.md)         |
| B-03   | 2026-07-19 ~ 07-22 | 数字花园与 Chronicle 身份         | Completed | [milestone-B-03-garden-identity.md](./milestone-B-03-garden-identity.md)       |
| B-04   | 2026-07-22 ~ 07-23 | SRI 与 CSP 违规上报               | Completed | [milestone-B-04-sri-security.md](./milestone-B-04-sri-security.md)             |
| B-05   | 2026-07-23         | 架构升级 Wave W1–W4               | Completed | [milestone-B-05-arch-upgrade.md](./milestone-B-05-arch-upgrade.md)             |
| B-06   | 2026-07-24 ~ 08-04 | 性能 Wave CH-PERF-001~012         | Completed | [milestone-B-06-perf-waves.md](./milestone-B-06-perf-waves.md)                 |
| C-01   | 2026-08-22 ~ 09-19 | 文档标准化、a11y 与提交门         | Completed | [milestone-C-01-doc-standard.md](./milestone-C-01-doc-standard.md)             |
| C-02   | 2026-09-20 ~ 09-30 | 依赖安全升级                      | Completed | [milestone-C-02-depsec.md](./milestone-C-02-depsec.md)                         |
| D-01   | 2026-10-06 ~ 10-07 | 工作台重构（索引）                | Completed | [milestone-D-01-workspace-rebuild.md](./milestone-D-01-workspace-rebuild.md)   |
| D-02   | 2026-10-08 ~ 10-10 | 合并后收尾                        | Completed | [milestone-D-02-closeout.md](./milestone-D-02-closeout.md)                     |
| D-03   | 2026-10-10 ~ 10-13 | 搜索高亮、依赖合并与全仓精简      | Completed | [milestone-D-03-merge-cleanup.md](./milestone-D-03-merge-cleanup.md)           |

## 工作台重构迭代（2026-10-06 那轮 · `iteration-*`）

这一轮按 8 个迭代（00–07）+ 收尾迭代 08 推进。里程碑 D-01 是它的索引，详细实现在这 9 篇。

| 迭代 | 名称               | 状态      | 文档                                                                         |
| ---- | ------------------ | --------- | ---------------------------------------------------------------------------- |
| 00   | 审计与基线         | Completed | [iteration-00-audit.md](./iteration-00-audit.md)                             |
| 01   | 基础设施与设计系统 | Completed | [iteration-01-foundation.md](./iteration-01-foundation.md)                   |
| 02   | App Shell          | Completed | [iteration-02-app-shell.md](./iteration-02-app-shell.md)                     |
| 03   | 首页与搜索         | Completed | [iteration-03-home-search.md](./iteration-03-home-search.md)                 |
| 04   | 文章系统           | Completed | [iteration-04-article-system.md](./iteration-04-article-system.md)           |
| 05   | 内容导航           | Completed | [iteration-05-content-navigation.md](./iteration-05-content-navigation.md)   |
| 06   | 质量优化           | Completed | [iteration-06-quality.md](./iteration-06-quality.md)                         |
| 07   | 发布准备           | Completed | [iteration-07-release.md](./iteration-07-release.md)                         |
| 08   | 代码审核与清理     | Completed | [iteration-08-code-review-cleanup.md](./iteration-08-code-review-cleanup.md) |

## 每迭代/里程碑完成时须更新

1. 该文档（实际完成情况 / 遗留问题）
2. 本 README 的状态列
3. `docs/14-decision-log.md`
4. `docs/15-acceptance-checklist.md`
5. 根 `README.md` 的实施状态

## 里程碑文档结构

1. 目标 2. 关键提交 3. 实现步骤 4. 涉及文件 5. 数据或接口变化
2. 验收结果 7. 遗留问题 8. 与今日的差异

## 工作台重构迭代文档结构

1. 迭代名称 2. 当前状态 3. 目标 4. 背景 5. 范围 6. 非范围 7. 前置条件
2. 具体任务 9. 涉及文件 10. 数据或接口变化 11. 设计变化 12. 测试计划
3. 验收标准 14. 风险 15. 回滚方式 16. 实际完成情况 17. 遗留问题 18. 下一迭代建议
