# 07 · 迁移计划

> 状态：Draft（Iteration 00）
> 日期：2026-10-06

---

## 1. 迁移目标

把「Paper Gallery 暖色调传统博客」渐进迁移为「中性灰 AI 工作台气质内容站」，**不换栈、不改内容、不破 URL**。

## 2. 不可破坏项

1. 20 篇文章 slug 与 URL 不变。
2. frontmatter 字段语义不变、不删。
3. CSP nonce + SRI 安全模型（ADR-0003/0005）。
4. 内容快照机制与生产读取路径。
5. SEO（metadata/sitemap/RSS/JSON-LD）不退化。
6. 深色模式、键盘可达性不退化。

## 3. 旧新路由映射

| 旧                                       | 新                 | 动作                     |
| ---------------------------------------- | ------------------ | ------------------------ |
| `/`                                      | `/`（工作台首页）  | 重构                     |
| `/blog` `/blog/[slug]`                   | 同                 | 保留，改视觉             |
| `/categories` `/tags` `/series`（+详情） | 同                 | 保留，改视觉             |
| `/projects` `/projects/[id]` `/about`    | 同                 | 保留                     |
| `/garden`                                | —                  | 已删（不重定向，清入口） |
| `/links`                                 | —                  | 已删（清入口）           |
| —                                        | `/archive`（新增） | 迭代 05                  |

## 4. 内容字段映射

无迁移（不加字段、不改名）。见 `docs/06-content-model.md` §4。

## 5. 组件替换映射

| 现状                     | 目标                                       | 迭代 |
| ------------------------ | ------------------------------------------ | ---- |
| `layout/Header.tsx`      | `layout/TopBar.tsx` + `layout/Sidebar.tsx` | 02   |
| `layout/MobileNav.tsx`   | 复用 + 接 Sheet                            | 02   |
| `home/EditorialHero.tsx` | 工作台欢迎区                               | 03   |
| `home/*` 多 section      | 收敛为工作台区块                           | 03   |
| `blog/BlogCard.tsx`      | 无大图轻卡片                               | 04   |
| `ui/*` primitive         | 扩 token + 补状态                          | 01   |

## 6. 样式迁移

- `tokens.css`：暖色 → 中性灰（**保留旧变量名为兼容别名**，渐进替换，不一次性改 4880 行）。
- 删孤儿：`links.css` / `search-ui.css`（已无人 import，审计确认）。
- 清残留：`article-ui.css` 的 `.giscus-*` 段。
- 收敛目标：17 个 CSS → 约 9–10 个（随 App Shell 重组）。

## 7. 数据迁移

无。`data/links.json` 物理保留（不删档）。

## 8. 搜索索引迁移

- 上一轮删除的 `/api/search` + `search-docs.json` **不恢复**。
- 新方案：客户端轻量搜索，索引来源 `posts-meta`（迭代 03）。
- 快照重生成：`pnpm content:build`（schema version 1→2，字段已裁剪）。

## 9. SEO 迁移

- 保持 metadata / sitemap / RSS / JSON-LD。
- 清死链（导航/页脚/错误页的 `/garden` `/links`）。
- 新增 `/archive` 时同步 sitemap + 导航 + 测试。

## 10. 回滚方案

- 全部改动在 `feature/architecture-rebuild-2026-10-06` 分支。
- 每个迭代独立提交，可 `git revert` 单个迭代。
- master 不动，重写完成后人工验收再合。

## 11. 备份策略

- 分支即备份（git）。
- 快照重生成前记录旧 `generated/content-snapshot/`（git 已跟踪，可 diff）。
- 不引入额外 `.bak` 文件（全局规则）。

## 12. 兼容期策略

- Token 旧变量名保留为别名，新旧 CSS 可共存。
- 组件逐个替换，不一次性切换。

## 13. 验证清单

- [ ] 20 篇文章 URL 全部可访问。
- [ ] `typecheck` / `lint` / `test` / `build` 全绿。
- [ ] 无死链。
- [ ] RSS / sitemap 完整。
- [ ] 深色模式正常。
- [ ] 移动端无横向滚动。
- [ ] 快照已重生成并提交。
