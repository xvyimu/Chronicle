# Milestone D-01 · 工作台重构（索引与衔接）

> 阶段：2026-10-06 ~ 2026-10-07 · 状态：**Completed（已并入 master）**
> 证据基准：`913c8cf`（PR #37）· `6326724`（PR #38）
> 关联：[C-02](./milestone-C-02-depsec.md) · 后续 [D-02](./milestone-D-02-closeout.md)

---

## 1. 这一篇是索引，不是正文

工作台重构的**逐迭代细节**已由 9 篇独立文档覆盖（`iteration-00` ~ `iteration-08`），本文件不重复，只做三件事：

1. 说明它在整条时间线上的位置与前后衔接；
2. 给出重构的**一句话范围**与**验收汇总**；
3. 指向详细文档。

详细文档见 [`docs/iterations/README.md`](./README.md) 的 00–08 行，及：

- [iteration-00-audit.md](./iteration-00-audit.md) — 审计与基线
- [iteration-01-foundation.md](./iteration-01-foundation.md) — 中性灰 Token
- [iteration-02-app-shell.md](./iteration-02-app-shell.md) — App Shell
- [iteration-03-home-search.md](./iteration-03-home-search.md) — 首页与搜索
- [iteration-04-article-system.md](./iteration-04-article-system.md) — 文章系统
- [iteration-05-content-navigation.md](./iteration-05-content-navigation.md) — 内容导航
- [iteration-06-quality.md](./iteration-06-quality.md) — 质量优化
- [iteration-07-release.md](./iteration-07-release.md) — 发布准备
- [iteration-08-code-review-cleanup.md](./iteration-08-code-review-cleanup.md) — 代码审核与清理

## 2. 范围（一句话）

把站点从**暖纸色 Paper Gallery 编辑式内容站**重构为**中性灰 AI 工作台内容站**：

- **删**：Giscus 评论、数字花园（`/garden`、力导向图、反链、popover）、收藏导航（`/links`）、服务端搜索 API（`/api/search`）、预览 API（`/api/preview/[slug]`）、`MagneticCard`。
- **改**：`tokens.css` 暖纸色 → 中性灰（保留旧变量名为兼容别名）；首页改工作台（欢迎区 + 热门主题 + 最近更新 + 搜索入口）；文章卡片去大图/去装饰动画。
- **增**：工作台外壳（TopBar + Sidebar + MainPanel）、客户端 Fuse 搜索（`SearchPanel`）、归档页 `/archive`、我的阅读 `/favorites`。
- **恢复**：`remark-wikilink`（20 篇 131 处 `[[..]]` 行内渲染）。

> 决策依据：`docs/14-decision-log.md` D-001~D-025；设计 SSOT `docs/PROJECT.md`；新 ADR `docs/adr/0007-workspace-rebuild-baseline.md`。

## 3. 衔接说明

- **前接** [C-02](./milestone-C-02-depsec.md)：重构前是「Paper Gallery + 服务端搜索 + 数字花园 + 评论」的形态。
- **重构全程在 `feature/architecture-rebuild-2026-10-06` 分支**，按 8 个迭代（00–07）+ 收尾迭代 08 推进，**未合并前 master 不动**（D-002）。
- **合并**：PR #37（`913c8cf`）→ PR #38（`6326724`）。合并后 master 进入收尾期。
- **后接** [D-02](./milestone-D-02-closeout.md)：2026-10-08 起承接审计跟进（a11y 对比度、R12 CLS、死 CSS、探活、错误上报）。

## 4. 验收汇总（重构轮）

| 时点      | 命令/指标       | 结果                                            | 出处                       |
| --------- | --------------- | ----------------------------------------------- | -------------------------- |
| `913c8cf` | `pnpm test`     | 72 files / 547 tests                            | commit body / iteration-08 |
| `913c8cf` | `pnpm build`    | 107 静态页                                      | 同上                       |
| `913c8cf` | `pnpm test:e2e` | 45 passed / 0 failed                            | 同上                       |
| `6326724` | `pnpm test`     | 73 files / 551 tests                            | 同上                       |
| `6326724` | `pnpm test:e2e` | 45 passed / 0 failed                            | 同上                       |
| PR #37    | CI              | quality / bundle-analyze / e2e / Vercel 全 pass | iteration-08 §16           |

完整验收（含搜索 6 项行为实测、R8/R11 修复）见 [iteration-08 §16](./iteration-08-code-review-cleanup.md)。

## 5. 这一轮暴露、但留给后续处理的问题

重构合并后，2026-10-07 的一次只读审计（`docs/16-audit-and-optimization-plan-2026-10-07.md`）发现 11 个问题（F1–F11），包括：

- **F1** 深色模式辅助文字对比度不达 AA（重构引入）
- **F5** 重构新增代码缺测试守门
- **F6** 移动端点击区小于自家标准
- **F7** 首屏 JS 体积偏大且门禁留白过大

这些在 [D-02 收尾](./milestone-D-02-closeout.md) 中处置。
