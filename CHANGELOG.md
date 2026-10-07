# Changelog

Notable **documented** changes to **Chronicle** live here when maintainers
choose to record them. This file is **not** a complete product history:
day-to-day work is in **git** on `master` (and GitHub Releases when used).

Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Tagged releases, when published, aim to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Prefer
Conventional Commits on `master`.

## [Unreleased]

### Added

- **工作台 App Shell**：TopBar + 左侧栏（`Sidebar`）+ 大圆角主面板（`workspace.css`）；
  导航收敛为 `首页 / 文章 / 专题 / 分类 / 标签 / 归档 / 我的阅读 / 作品 / 关于`。
- **站内搜索**：客户端 Fuse（`src/lib/search/` + `SearchPanel`），
  支持键盘 `/` `Ctrl+K`、↑↓ 选择、Enter 打开、Esc 清空，URL `?q=` 可分享。
- **归档页** `/archive`：按年份分组时间线。
- **我的阅读** `/favorites`：收藏 + 最近阅读（localStorage，无账号）。
- **文章页收藏按钮**（`ReadingActions`）。
- 项目文档体系：`docs/01-project-audit.md` ~ `docs/15-acceptance-checklist.md`、
  `docs/iterations/`、`docs/adr/0007-workspace-rebuild-baseline.md`。
- Root community docs: `CODE_OF_CONDUCT.md`, this `CHANGELOG.md`, and
  `.editorconfig` (aligned with Prettier: 2-space, LF).

### Changed

- **设计系统**：`tokens.css` 从暖纸色（Paper Gallery）改为**中性灰**工作台主题；
  保留旧变量名为兼容别名；新增语义层与 `--radius-panel`、排版变量。
- 首页从「编辑式多 section」改为「工作台：欢迎区 + 热门主题 + 最近更新 + 搜索入口」。
- 文章卡片改为**无大图轻量卡片**（去 3D 倾斜 / 光斑 / 入场动画）。
- 列表页文案「博客」→「文章」。
- `--text-dim` 调值达 WCAG AA（浅 4.77:1 / 深 4.88:1）。
- `engines.node` `22.x` → `>=24`。

### Removed

- **评论（Giscus）**、**数字花园**（`/garden`）、**收藏导航**（`/links`）、
  **服务端搜索 API**（`/api/search`）、**预览 API**（`/api/preview/[slug]`）。
- 连带：`MagneticCard`（3D 倾斜）、`server/search/`、`lib/search`（旧契约）、
  花园相关 lib 与快照字段、孤儿 CSS（`links.css` / `search-ui.css`）。

### Fixed

- CSP 去掉 Giscus 白名单（评论删除后遗留的第三方放行，安全面收窄）。
- 首页 Footer 重复渲染（`layout.tsx` 漏删旧 `<Footer />`）。
- `aria-label="搜索文章"` 重名（Header 搜索链接改为「前往搜索」）。
- `sitemap.ts` 死链（`/garden` `/links` → `/archive`）。

### Notes

- `package.json` version may lag git tips while the site is under active
  development. Stack SSOT: `docs/PROJECT.md`.
- 本次重构全程在 `feature/architecture-rebuild-2026-10-06` 分支，
  按 8 个迭代（00–07）推进，见 `docs/iterations/`。

<!--
## [x.y.z] — YYYY-MM-DD

### Added
### Changed
### Fixed
### Security
-->
