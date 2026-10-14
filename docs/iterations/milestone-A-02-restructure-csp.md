# Milestone A-02 · 结构性重组与 CSP

> 阶段：2026-06-25 ~ 2026-06-27 · 状态：**Completed（历史里程碑）**
> 证据基准：`8bfc59c` → `c892ba1`
> 关联：[A-01](./milestone-A-01-bootstrap.md) · 后续 [A-03](./milestone-A-03-editorial-home.md)

---

## 1. 目标

把内容读取路径抽成可替换的抽象层；用中间件下发 CSP 头；跟进 Next 16.2 的 `middleware → proxy` 弃用；给全部文章补 source/license 出处；上线 `/links` 收藏导航目录。

## 2. 关键提交

| 日期       | commit    | 做了什么                                                                |
| ---------- | --------- | ----------------------------------------------------------------------- |
| 2026-06-25 | `8bfc59c` | `refactor: 项目结构性重组 — 内容源抽象层 + CSP 中间件 + 清理`           |
| 2026-06-25 | `955b25b` | `fix(nextjs): middleware → proxy 迁移 (Next.js 16.2 deprecation)`       |
| 2026-06-25 | `4c3cca6` | UI 修复：Header/Footer 图标、代码块暗色、搜索框焦点、移动端 theme-color |
| 2026-06-26 | `a6b1eba` | 给全部 14 篇文章补 source/license 出处标注                              |
| 2026-06-27 | `c892ba1` | 导航页面上线（6 分类 67 条）                                            |

## 3. 实现步骤

### 3.1 内容源抽象层（`8bfc59c`）

- 新增 `src/lib/parse-frontmatter.ts`（71 行）：用 `js-yaml` 4.x 替代 `gray-matter` 解析 frontmatter。
- 新增 `src/lib/storage.ts`（35 行）：`safeLocalStorage` 包装（SSR 安全）。
- 新增 `src/lib/jsonld.ts`、`src/lib/content-source.ts`：结构化数据与内容读取接口。
- 删除 `CLAUDE_CODE_HANDOFF.md`、`docs/项目审查与改进文档.md`（848 行）、`.github/workflows/deploy.yml`。

> `parse-frontmatter.ts` 与 `content-source.ts` 沿用至今，是内容管线的地基。

### 3.2 middleware → proxy 迁移（`955b25b`）

Next.js 16.2 弃用 `src/middleware.ts`，改名为 `src/proxy.ts`。文件重命名：`src/{middleware.ts => proxy.ts}`。

> 这个 `src/proxy.ts` 就是今天下发 CSP nonce 的那个文件。

### 3.3 出处标注（`a6b1eba`）

改 14 篇 `content/blog/*.mdx`，`src/types/index.ts` 加可选字段 `source?` / `license?`。用于标注转载/引用内容的原始出处与授权。

### 3.4 `/links` 导航（`c892ba1`）

- `src/lib/links.ts`（382 行）+ `src/app/links/page.tsx`（53 行）+ `src/app/links/page.test.tsx`（63 行）。
- Header 加入口。

> `/links` 后来在 2026-10-07 工作台重构中被删除。

## 4. 涉及文件

**新增**：`src/lib/{parse-frontmatter,storage,jsonld,content-source,links}.ts` · `src/app/links/{page.tsx,page.test.tsx}`
**重命名**：`src/{middleware.ts => proxy.ts}`
**修改**：14 篇 `content/blog/*.mdx` · `src/types/index.ts` · `src/components/layout/Header.tsx`
**删除**：`CLAUDE_CODE_HANDOFF.md` · `docs/项目审查与改进文档.md` · `.github/workflows/deploy.yml`

## 5. 数据或接口变化

- `src/types/index.ts`：`PostMeta` 新增可选 `source?` / `license?`。
- 新增路由 `/links`。

## 6. 验收结果

**未找到证据**：`8bfc59c`（结构重组）与 `c892ba1`（/links 上线）的 commit body 都未附测试或构建数字。`/links` 的规模（6 分类 67 条）来自 `c892ba1` 标题，后续 `45f8d10`（2026-07-05）body 记录它扩到「10 类 123 条」，可交叉印证初始规模。不编造中间数字。

### 已知回归（本阶段埋下，后修复）

`8bfc59c` 的 CSP 中间件让根布局用上 `headers()`，使全站动态化，**导致生产环境内容为空**。这个问题在 2026-06-30（`b615283`）才修复——移除 `headers()`、`script-src` 改 `'self'`、新增 `DarkModeScript`，恢复全站静态化（91 页全静态）。详见 [A-03](./milestone-A-03-editorial-home.md) §6。

> 这个回归与后来的 2026-10-07 重构方向**相反**：当时为了性能选了全静态；10 月为了严格 CSP nonce 又改回每请求动态渲染（见 ADR-0003）。是同一权衡的两次相反取舍。

## 7. 遗留问题

- 生产空内容（CSP 中间件致动态化）—— 遗留到 `b615283` 修复。
- `/links` 无消费方风险—— 当时是活跃功能，后于 2026-10-07 删除。

## 8. 与今日的差异

| 项       | 本阶段（2026-06-27）       | 今日（2026-10-14）                          |
| -------- | -------------------------- | ------------------------------------------- |
| `/links` | 已上线（6 分类 67 条）     | **已删除**（2026-10-07）                    |
| CSP 策略 | 中间件 + 全静态            | `proxy.ts` + 每请求 nonce（动态，ADR-0003） |
| 内容解析 | `js-yaml` 替代 gray-matter | 沿用                                        |
