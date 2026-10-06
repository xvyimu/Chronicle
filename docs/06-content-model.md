# 06 · 内容模型

> 状态：Current（如实描述现状，含规划字段）
> 日期：2026-10-06
> 依据：`src/types/index.ts` · `src/lib/schemas/post-frontmatter.ts`
> SSOT：schema 以 `lib/schemas/post-frontmatter.ts` 为准；本文档描述与规划。

---

## 1. 统一文章模型

### PostMeta（列表用）

```ts
interface PostMeta extends PostFrontmatter {
  slug: string; // 派生：文件名去 YYYY-MM- 前缀
  readingTime: string; // 派生：reading-time
  wordCount: number; // 派生
  excerpt: string; // = frontmatter.description
}
```

### PostFull（详情用）

```ts
interface PostFull extends PostMeta {
  content: string; // 原始 MDX 正文（不含 frontmatter）
}
```

---

## 2. frontmatter 字段（实测自 Zod schema）

| 字段          | 必填 | 默认         | 类型                | 说明                            |
| ------------- | ---- | ------------ | ------------------- | ------------------------------- |
| `title`       | ✅   | —            | string              | 标题                            |
| `description` | ✅   | —            | string (min 1)      | 摘要（SEO + 列表）              |
| `date`        | ✅   | —            | string (YYYY-MM-DD) | 发布日期                        |
| `tags`        | ❌   | `[]`         | string[]            | 标签                            |
| `published`   | ❌   | `true`       | boolean             | `false` 生产过滤                |
| `featured`    | ❌   | `false`      | boolean             | 精选                            |
| `category`    | ❌   | 从 tags 推断 | string?             | 分类                            |
| `series`      | ❌   | —            | string?             | 专题名                          |
| `seriesSlug`  | ❌   | —            | string?             | 专题路由 slug                   |
| `seriesOrder` | ❌   | —            | number?             | 专题内序号                      |
| `image`       | ❌   | —            | string?             | 封面（本地路径）                |
| `license`     | ❌   | —            | string?             | 许可（如 CC-BY-4.0）            |
| `updatedAt`   | ❌   | —            | string?             | 更新时间（用于 `modifiedTime`） |

## 3. 字段分类

| 类别         | 字段                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **必填**     | `title` · `description` · `date`                                                                                             |
| **可选**     | `tags` · `published` · `featured` · `category` · `series` · `seriesSlug` · `seriesOrder` · `image` · `license` · `updatedAt` |
| **派生**     | `slug` · `readingTime` · `wordCount` · `excerpt`                                                                             |
| **历史兼容** | `published:false` 过滤；`category` 从 tags 推断（`category-rules`）；`seriesSlug` 与 `series` 并存                           |
| **计划废弃** | 无（`searchText` / `headings` 已于上一轮移除）                                                                               |

## 4. 规划字段（本重构评估，尚未加）

用户需求文档列出候选：`content` / `publishedAt` / `updatedAt` / `authors` / `canonicalUrl` / `cover` / `seoTitle` / `seoDescription`。

| 候选                          | 决定                     | 理由                                     |
| ----------------------------- | ------------------------ | ---------------------------------------- |
| `publishedAt`                 | **不加**                 | 现有 `date` 已承担；改名会破坏 20 篇兼容 |
| `updatedAt`                   | **保留现状**（可选）     | 已存在，用于 `modifiedTime`              |
| `authors`                     | **暂不加**               | 单作者，无需求                           |
| `canonicalUrl`                | **暂不加**               | 无跨站重复内容                           |
| `cover`                       | **不加**（`image` 已够） | 避免重命名破坏兼容                       |
| `seoTitle` / `seoDescription` | **暂不加**               | `title` / `description` 已用于 metadata  |

> 结论：**不加新字段**，除非有明确需求。避免为「模型完整」引入无用字段。

## 5. 数据访问约束

- 页面组件**不直接**读 fs / 解析 frontmatter / 调 CMS。
- 统一经 `server/content` facade → `lib/posts` repository。
- 新增字段须同步：schema → repository → content workflow → 测试。

## 6. 内容目录

```
content/blog/*.mdx     20 篇（文件名 YYYY-MM-topic.mdx）
content/about.mdx      关于页
data/projects.json     6 项目
data/links.json        收藏（已退出路由，物理保留）
```
