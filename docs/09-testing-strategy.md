# 09 · 测试策略

> 状态：Draft（Iteration 00）
> 日期：2026-10-06

---

## 测试分层

| 层             | 工具            | 命令                            | 位置                          |
| -------------- | --------------- | ------------------------------- | ----------------------------- |
| 类型检查       | tsc             | `pnpm typecheck`                | 全仓                          |
| Lint           | ESLint 9        | `pnpm lint`                     | `src/` `scripts/` `e2e/`      |
| 单元测试       | Vitest          | `pnpm test`                     | `*.test.ts`                   |
| 组件测试       | Testing Library | `pnpm test`                     | `*.test.tsx`                  |
| E2E            | Playwright      | `pnpm test:e2e`                 | `e2e/*.spec.ts`               |
| 变异测试       | Stryker         | `pnpm test:mutation`            | `src/lib/**`                  |
| SEO 门禁       | 自定义脚本      | `pnpm check:seo`                | `scripts/check-seo.ts`        |
| 生产内容 smoke | 自定义脚本      | `pnpm check:production-content` | `scripts/`                    |
| 文档死链       | 自定义脚本      | `pnpm check:docs`               | `scripts/check-doc-links.mjs` |
| SRI            | 自定义脚本      | `pnpm check:sri-smoke`          | `scripts/`                    |

---

## 各层覆盖期望

- **单元**：`lib/*`（repository / query / 快照 / 校验）、hooks、纯函数。
- **组件**：`components/*` 渲染与交互；关键状态（空/错误）。
- **E2E**：导航路径、搜索、文章阅读、移动端无溢出、CSP/Giscus（Giscus 已删，用例待清）。
- **路由**：`generateStaticParams` / metadata。
- **搜索**：命中、无结果、键盘选择、URL 参数（迭代 03 新增）。
- **内容解析**：frontmatter schema、派生字段。
- **响应式**：移动端视口无横向滚动。
- **可访问性**：键盘导航、focus、aria-label（迭代 06 补 axe 或手工）。
- **SEO**：`check:seo` 门禁。
- **性能**：Lighthouse CI（`lh:mobile`）+ bundle 预算。
- **回归**：每次迭代跑全量 `typecheck`/`lint`/`test`/`build`。

---

## 当前基线（2026-10-06 实测）

| 命令             | 结果                   |
| ---------------- | ---------------------- |
| `pnpm typecheck` | exit 0                 |
| `pnpm lint`      | exit 0（0 error）      |
| `pnpm test`      | 74 文件 / 574 测试通过 |
| `pnpm build`     | exit 0（105 静态页）   |

**当前未配置 / 待处理**：

- `pnpm test:e2e`：spec 引用已删路由（`/api/search` `/api/preview` `/links`），预期失败 → 迭代 02 修。
- `pnpm check:production-content`：需线上环境。

---

## 手工验收项目

- 键盘：Tab 遍历 TopBar/Sidebar/正文；`/` 或 `Ctrl+K` 聚焦搜索。
- 深色模式切换无闪烁。
- 长文阅读：代码块/表格/图片/长链接不溢出。
- 移动端：Sheet 导航、无横向滚动、点击区 ≥40px。
- 慢网：Skeleton / 加载态。

---

## 每迭代记录格式

执行的命令 · 结果 · 已知警告 · 未解决错误 · 手工测试范围 · 视口范围。
