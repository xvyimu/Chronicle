# CH · CSS route-split residual · 2026-07-24

> Worktree：`ch-css-route-split` · Branch：`xvyimu/ch-css-route-split`  
> 模块：M-CH-css-route-split · WEEK-BACKLOG **W6**  
> 前置：master 已合 `f406a21` perf(css) route-level sinking（CH-PERF-001）

## 目标

在 CH-PERF-001 之后**再增量**下沉仍全局串联的 CSS 字节：

1. 全局 `responsive.css` 中的路由专属断点
2. `controls.css` 死代码 / 可下沉控件
3. `components.css` 死 hero / stat-pill

**不做：** home hero 大重构 · tokens 语义改写 · 放宽 CSP · 换栈 · push master

## 变更摘要

### 1) `responsive.css` 瘦身（约 404 → 197 行）

| 从全局移出 | 落到 |
| ---------- | ---- |
| `.archive-grid*` / `.archive-card` / `.archive-list*` | `archive.css` |
| `.blog__item` / `.blog__title` / `.tag-cloud*` | `blog-ui.css` |
| `.article-*` / `.toc--mobile` / `.reading-prefs*` | `article-ui.css` |
| `.prose*` 移动端断点 | `prose.css` |
| `.project-detail` title size | `project-detail.css` |
| 死规则 `.pagination*` / `.hero*` | **删除**（DOM 已无） |

**仍全局：** header sheet / footer / back-to-top / section / cards / not-found / print 壳。

print 仍隐藏 `.reading-prefs` / `.toc` / `.reading-progress`（选择器无害；避免打印时浮层残留）。

### 2) `controls.css`（约 154 → 52 行）

| 项 | 处理 |
| -- | ---- |
| `.pagination*` | **删除**（`Pagination` 已用 shadcn Button + Tailwind） |
| `.tag-link` | → `blog-ui.css` |
| `.card--project` | → `components.css`（与 `.card` 同文件） |
| `.reading-prefs__*` hit area | → `article-ui.css` |
| CTA `[data-size=cta]` + `.theme-toggle` | **保留全局**（home / 404 / error / project-detail 共用） |

### 3) `components.css` 死代码

删除未引用的 `.hero*` / `.stat-pill*`（首页已用 `editorial-hero`）。

### 4) 文档 / 测试

- `docs/css-conventions.md` · `docs/architecture.md` · `AGENTS.md` 同步归属
- 新增 `src/app/styles/css-route-ownership.test.ts`（根 import 白名单 + 路由模块拥有 media query）

## 验证

见根 `evidence.md`（命令 + exit）。

## 残留

| 项 | 说明 |
| -- | ---- |
| `article-ui.css` 行数 | 本波前已 ~686，现 ~787（> AGENTS「≤500」历史债）；拆分 reading-prefs 另债 |
| 全局 `components.css` / `controls.css` CTA | 多路由共用，继续全局合理 |
| `animations.css` | `reveal-on-scroll` 目前仅 home 用，但 `animate-fade-in` 在根 layout `main`；保持全局 |
| LH 数字 | 本 wt 未跑 Lighthouse；字节下沉预期降低非相关路由 CSS，field/lab 另测 |

## 边界自检

- 未改 tokens 语义 / CSP / fuse / 栈
- 未 push master
- 未做 home hero 大重构
