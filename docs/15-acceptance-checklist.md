# 15 · 验收清单

> 状态：持续维护
> 更新：2026-10-06（Iteration 00 建）

---

## Iteration 00 · 审计与基线

- [x] 项目可在当前环境运行（`pnpm dev` 200）
- [x] 记录构建/测试/lint 基线（typecheck 0 / lint 0 / test 574 / build 0）
      <!-- 574 为 Iteration 00 当时记录，与任何时点的实跑值都不吻合；当前基线见 docs/HANDOFF.md（2026-10-08 实测 76 files / 588 tests）。按 docs/README.md 纪律，历史记录不改写，仅加注。 -->
- [x] 创建审计文档（`docs/01-project-audit.md`）
- [x] 建立风险登记（`docs/13-risk-register.md`）与决策日志（`docs/14-decision-log.md`）
- [x] 未修改核心业务功能（仅修 3 个因删功能失效的测试断言 + 格式化）

## Iteration 01 · 基础设施与设计系统

- [x] 中性灰 Token 层落地（`tokens.css`）
- [x] 全局排版变量
- [x] 旧变量兼容别名（4880 行 CSS 不需一次性改）
- [x] 删孤儿 CSS（`links.css` / `search-ui.css`）+ Giscus 残留段
- [x] `typecheck` / `lint` / `test` / `build` 全绿
- [x] dev 7 路由 200
- [ ] 基础 UI 组件状态逐一补齐（留迭代 02）
- [ ] 对比度工具核验（留迭代 06）

## Iteration 02 · App Shell

- [x] TopBar / Sidebar / MainPanel
- [x] 移动端 Sheet 导航（复用现有 MobileNav）
- [x] 当前路由高亮
- [x] 清死链（导航/页脚/错误页/首页组件）
- [x] `typecheck` / `lint` / `test` / `build` 全绿
- [x] dev 7 路由 200 + 外壳 DOM 存在
- [ ] 面板内独立滚动（评估后决定不做，见迭代 02 §17）
- [ ] e2e spec 死链（留迭代 06）

## Iteration 03 · 首页与搜索

- [x] 工作台首页（欢迎区 / 主题云 / 最近更新 / 搜索入口）
- [x] 站内搜索（客户端 Fuse；键盘 `/` `Ctrl+K` ↑↓ Enter Esc；URL 可分享）
- [x] 空 / 无结果状态
- [x] 删旧首页组件与 Paper Gallery CSS（首页转中性灰）
- [x] `typecheck` / `lint` / `test` / `build` 全绿
- [x] dev 4 路由 200 + 新首页 DOM 确认
- [ ] 最近阅读（localStorage，留迭代 05）

## Iteration 04 · 文章系统

- [x] 无大图轻卡片（去 3D 倾斜 / 光斑 / 入场动画）
- [x] `blog-ui.css` 去装饰动画
- [x] 列表页文案统一「文章」
- [x] 详情页阅读排版复核（720px / 行高 1.9 / 16px，已合规）
- [x] `typecheck` / `lint` / `test` / `build` 全绿
- [x] dev 7 路由 200 + `magnetic-card` 计数 0
- [ ] 详情页标题衬线体评估（留迭代 06）
- [ ] `ProjectCard` 去 MagneticCard（留迭代 05/06）

## Iteration 05 · 内容导航

- [x] 分类 / 标签 / 专题（沿用，视觉已合规）
- [x] 归档页 `/archive`（按年份时间线，新增）
- [x] 收藏（localStorage）
- [x] 最近阅读（localStorage）
- [x] `/favorites` 我的阅读页
- [x] `sitemap.ts` 加 `/archive` + 修死链
- [x] `typecheck` / `lint` / `test` / `build` / `check:seo` 全绿
- [x] dev 9 路由 200
- [ ] 独立面包屑组件（现有返回路径够用，未做）

## Iteration 06 · 质量优化

- [x] 响应式（e2e mobile 无横向滚动通过）
- [x] 可访问性（修搜索 aria-label 重名；`--text-dim` 对比度达 AA）
- [x] 深色模式（e2e 主题切换 3 用例通过）
- [x] 清死代码（MagneticCard 退役、ProjectCard 去 3D）
- [x] 清死文档（`docs/API.md` 重写）
- [x] 修 e2e spec 死链
- [x] 修 Footer 重复渲染（真 bug）
- [x] flaky 测试加超时（R10）
- [x] 快照重生成（unchanged）
- [x] `typecheck` / `lint` / `test` / `build` / `check:seo` / **e2e 45 passed** 全绿
- [ ] 全站装饰背景层去留（评估后保留，见 D-022）
- [ ] 详情页标题衬线体（D-019，未改）

## Iteration 07 · 发布准备

- [x] 全量回归（四门 + e2e + seo + docs）
- [x] 20 篇文章可读（wikilink 渲染修复）
- [x] CHANGELOG 记录重构
- [x] 根 README 更新（实施状态 / 路由 / 命令 / 文档索引）
- [x] 回滚方案确认（分支未合并，revert 单迭代）
- [ ] 提交 / 推送 / PR（须用户授权）
- [ ] 部署（须人审）

## Iteration 08 · 代码审核与清理

- [x] 双轴 review（Standards + Spec）完成并逐条复核
- [x] 修搜索 URL 契约（真 bug：结果不渲染）
- [x] `TopicCloud` 用 `tag.slug` 不再重算
- [x] 删 `checkPreviewRateLimit` / `PREVIEW_RATE_LIMIT_MAX` 死代码
- [x] `ws-section__*` 下沉 `workspace.css`（修 `/favorites` 无样式）
- [x] `theme-color` + 两个 OG 图配色对齐中性灰 token
- [x] 同步 `HANDOFF.md` / `ARCHITECTURE.md` / `docs/README.md`（约束 #7）
- [x] `adr/0006` 状态修订注记（保留历史正文）
- [x] 清调试遗留 `probe-tmp.mjs`
- [x] typecheck / lint / test / build 全绿
- [x] `check:seo` / `check:docs` / `format:docs:check` 全绿
- [x] **e2e 45 passed / 0 failed**
- [x] Playwright 搜索行为 6/6 实测通过
- [x] **R8 已修**：CI 4 处 `node-version: 22` → `24`
- [x] **R11 已修**：next 16.3.5 → 16.3.8（critical RCE）+ sharp / source-map-js override；`pnpm audit --prod` exit 0
- [x] 提交 2 个（`5d29bfc` 代码 + `9def4b5` 文档）+ 推送 + PR [#37](https://github.com/xvyimu/Chronicle/pull/37)
- [x] 追加提交 `46b8bd8`（R8 + R11）；CI `quality` pass
- [ ] **R12 · Lighthouse 间歇失败**（`/blog/nextjs-app-router`：性能 0.75 / CLS 0.2976；同 commit 时红时绿）——既有基线，**根因已定位 + 修法已实测**（骨架屏高度下限，CLS 0.0745→0.0012），本轮不修，另开跟进
- [ ] R13 · dev 树 audit（初记 13 条 → 2026-10-07 修复后剩 4 条）——CI 该步 `continue-on-error`，已记录。权威计数见 [13-risk-register.md](./13-risk-register.md) R13 行
- [ ] 合并 master（须人审）
- [ ] 部署（须人审）

---

## 最终验收（全局）

**产品**：定位清晰 · 首页非传统模板 · 搜索为核心 · 导航简单。
**视觉**：极简工作台气质 · 中性灰 · 大圆角面板 · 阴影克制 · 无大封面堆叠 · 深浅色清晰。
**阅读**：中文可读 · 宽度合理 · 代码/表格可用 · 目录可用 · 移动舒适。
**工程**：边界清晰 · Token 集中 · 内容访问集中 · typecheck/lint/build 通过 · 无废弃残留。
**SEO**：链接保持 · metadata/sitemap/RSS/canonical 正确 · 404 可用。
**无障碍**：键盘可达 · focus 清晰 · 图标有名称 · 对比度合理 · reduce-motion 支持。
**文档**：审计/需求/架构/设计/迁移/测试/迭代/决策齐 · README 与实际一致。
