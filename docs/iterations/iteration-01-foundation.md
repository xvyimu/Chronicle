# Iteration 01 · 基础设施与设计系统

## 1. 迭代名称

基础设施与设计系统

## 2. 当前状态

**Completed**

## 3. 目标

建立设计 Token、统一全局排版、建立基础 UI 组件、统一交互状态、修复明显的全局规范问题。

## 4. 背景

现状视觉是暖纸色「Paper Gallery」；目标为中性灰「AI 工作台」。17 个 CSS 文件 4880 行引用旧变量，需渐进迁移（决策 D-005）。

## 5. 范围

- `tokens.css` 新增中性灰语义层 + 保留旧变量名为兼容别名。
- 全局排版变量（字号/行高）。
- 收敛强调色与渐变（去暖纸色 / 去高饱和渐变）。
- 删孤儿 CSS（`links.css` / `search-ui.css`）。
- 清 `article-ui.css` 的 Giscus 残留段。

## 6. 非范围

- **不重构文章数据层**。
- **不一次性替换所有页面**（首页 Paper Gallery 主题保留到迭代 03）。
- 不做 App Shell（迭代 02）。

## 7. 前置条件

Iteration 00 完成。

## 8. 具体任务

- [x] 中性灰 Token 层（`tokens.css`）
- [x] 旧变量兼容别名（全部旧名保留）
- [x] 全局排版变量
- [x] 收敛强调色 / 渐变
- [x] 删孤儿 CSS（`links.css` / `search-ui.css`）
- [x] 清 Giscus 残留 CSS
- [x] 全量验证

## 9. 涉及文件

**修改**：`src/app/styles/tokens.css`（暖色 → 中性灰）· `src/app/styles/article-ui.css`（删 giscus 段）
**删除**：`src/app/styles/links.css` · `src/app/styles/search-ui.css`（孤儿，无人 import）
**新增**：`docs/01`–`15` · `docs/iterations/*` · `docs/adr/0007-*`

## 10. 数据或接口变化

无。

## 11. 设计变化

- 色彩：暖纸色（`#f1f0eb` / 鼠尾草绿 `#59756d`）→ 中性灰（`#fafafa` / 克制蓝 `#4f6bed`）。
- 渐变：`--brand-gradient` 从渐变收敛为纯色（禁高饱和渐变）。
- 新增语义层 `--background/--foreground/--card/--muted/--ring/--success/--warning` 与 `--radius-panel`、排版变量。
- 旧变量名全部保留为兼容别名（4880 行 CSS 不需一次性改）。

## 12. 测试计划

`typecheck` / `lint` / `test` / `build` + dev 路由冒烟。

## 13. 验收标准

Token 落地；旧 CSS 不破；四门全绿；主要路由 200。

## 14. 风险

R7（对比度）——中性灰方案已实测渲染正常，对比度工具核验留迭代 06。

## 15. 回滚方式

`git revert` 本迭代提交。

## 16. 实际完成情况

- `tokens.css` 重写为中性灰（保留全部旧变量名 + 新增语义层）。
- 删 2 个孤儿 CSS + 1 段 Giscus 残留。
- 验证：`typecheck` 0 · `lint` 0 · `test` 574/574 · `build` 0（105 静态页）· dev 7 路由全 200。

## 17. 遗留问题

- **首页仍是暖纸色**：`home.css` 的 `body:has(.home-paper)` 局部覆盖块把首页 token 回退成暖色 + 纸质纹理。**有意保留**——首页布局（Editorial Hero 等）为纸质纹理设计，单删 token 覆盖会让布局裸在中性灰上。**留迭代 03 随首页重建一起处理**。
- 其余页面（blog/about/projects/tags/categories/series）已转中性灰。
- 对比度未用工具核验（迭代 06）。
- 基础 UI 组件状态补齐：现有 primitive（button/badge/card/sheet…）已具备大部分状态；本轮未逐一改造（避免范围外改动），留迭代 02 随 App Shell 处理。

### 同类残留登记（本迭代发现，按迭代边界处置）

本迭代删了 Giscus CSS 残留段；自查发现**同类「已删功能残留」还有三处**，均**不在本迭代范围**，登记于此避免遗忘：

| #   | 位置                           | 内容                                                                | 归属迭代                     |
| --- | ------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| 1   | `src/lib/navigation.ts:9-10`   | `MAIN_NAV_ITEMS` 含死链 `/garden` `/links`（Header/MobileNav 渲染） | **02**（App Shell 重写导航） |
| 2   | `src/lib/ops-readiness.ts:197` | 文案提及 `/api/search`                                              | **06**（清死代码）           |
| 3   | `docs/API.md`                  | 仍描述已删的 `/api/search` · `/api/preview` 契约                    | **06**（清死文档）           |

> 另有 e2e spec（`blog/mobile/home.spec.ts`）引用已删路由、`fuse.js` 死依赖、`scripts/check-production-content.ts:173` 探 `/api/search`——均已登记在审计 §10（E3/E5/E4），归 02/03/06。

### 自查记录（Stop hook 触发）

- 验证「旧变量名全部保留为兼容别名」：对比新旧 `tokens.css` 定义，**REMOVED = 0 / ADDED = 12**，主张成立。
- 验证「无新增孤儿变量」：全仓 CSS 变量差集 13 个，逐个核实——`--font-*` 由 `layout.tsx` 注入、`--parallax-*`/`--reveal-delay`/`--spotlight-*`/`--reading-*` 由组件运行时设置、`--project-detail-title-size` 在 `responsive.css` media query 定义；仅 `--text-muted`/`--text-secondary` 全仓无定义，但 **HEAD（改动前）亦无定义**，且 `prose.css` 用三级 fallback（`var(--muted-foreground, var(--text-muted, #6b7280))`）兜底——属既有风格，非本迭代引入。

## 18. 下一迭代建议

Iteration 02：App Shell（TopBar + Sidebar + MainPanel + MobileNav），**并清死链**。
