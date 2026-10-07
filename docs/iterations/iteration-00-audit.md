# Iteration 00 · 审计与基线

## 1. 迭代名称

审计与基线

## 2. 当前状态

**Completed**

## 3. 目标

理解现有项目；建立文档；运行当前项目；记录重构前基线；确认现有功能和问题。

## 4. 背景

用户要求把博客重构为「AI 工作台气质内容站」。此前的重构分支已完成一轮「删功能 + 数据层裁剪」，需先审计现状再规划。

## 5. 范围

- 审计技术栈 / 结构 / 路由 / 内容模型 / 组件 / 问题 / 债。
- 建立 `docs/01–15` 全套文档 + iterations + adr。
- 运行并记录 lint / typecheck / test / build 基线。

## 6. 非范围

- 不开始视觉重构。
- 不修改业务代码（仅修 3 个因删功能失效的测试断言 + 格式化）。

## 7. 前置条件

`feature/architecture-rebuild-2026-10-06` 分支；`pnpm install` 完成。

## 8. 具体任务

- [x] 读关键文件（package.json / 路由 / 数据层 / tokens / layout / navigation）
- [x] 采集路由、组件、lib、内容清单
- [x] 扫描死链与死代码
- [x] 修 3 个失效测试断言（repository excerpt / blog page search / home curated links）
- [x] 跑基线验证
- [x] 建文档

## 9. 涉及文件

**新增**：`docs/01`–`docs/15`、`docs/iterations/*`、`docs/adr/0007-*.md`
**修改**：`src/lib/posts/repository.test.ts`、`src/app/blog/page.test.tsx`、`src/app/page.test.tsx`（测试断言）
**删除**：无
**移动**：无

## 10. 数据或接口变化

无。

## 11. 设计变化

无（仅文档）。

## 12. 测试计划

`pnpm typecheck` / `lint` / `test` / `build`。

## 13. 验收标准

- 项目可运行；基线记录；审计文档完整；风险与决策日志建立；未改核心功能。

## 14. 风险

见 `docs/13-risk-register.md`（R2 花园文章 wikilink、R4 死链、R3 快照）。

## 15. 回滚方式

文档可删；测试断言改动可 revert。

## 16. 实际完成情况

- 基线：typecheck 0 · lint 0 · test 74 文件/574 测试 · build 0（105 静态页）。
- 文档：01–15 + iterations(README+00) + adr(0007) 建立。
- 发现真实债：导航死链（`/garden` `/links`）、孤儿 CSS（`links.css` `search-ui.css`）、fuse.js 死依赖、快照待重生成、花园文章 wikilink 渲染退化。

## 17. 遗留问题

- 死链未清（迭代 02）。
- 快照未重生成（迭代 06）。
- 花园文章 wikilink 渲染待决策（R2）。
- e2e spec 引用已删路由（迭代 02）。

## 18. 下一迭代建议

Iteration 01：中性灰 Token + 全局排版 + 基础 UI 组件。
