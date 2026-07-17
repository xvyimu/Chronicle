# 设计文档: posts.ts 深化重构 + 动态路由 adapter (S2+S4+S6 余项)

> 状态：已实施。正文中的测试数量和步骤是 2026-06-29 设计快照。

**日期**: 2026-06-29
**作者**: brainstorming skill 流程
**关联**: docs/architecture-review.html 中 S2 / S4 / S6 候选的"顺手解决"部分
**前置条件**: 已完成的 S1-S6 表层重构 (commits 5c76273..f537c2c)

---

## 1. 目标与范围

### 1.1 目标

完成 architecture-review.html 中三个 Strong 候选的深水区:

- **S2 余项**: posts.ts god-module (255 行 / 13 export) 拆分为 4 个职责单一的模块
- **S4 余项**: posts.test.ts 改用 in-memory ContentSource 注入夹具, 解耦内容编辑与代码测试反馈循环
- **S6 余项**: 4 条动态路由 (blog/projects/tags/categories) 通过 `createDynamicRoute` adapter 收敛三段式接口契约

### 1.2 范围 (in scope)

- src/lib/posts/ 目录新建 (4 文件 + barrel)
- src/lib/content-source.ts 增加工厂函数 `createPostRepository`
- src/lib/posts.test.ts 重写为 in-memory source 模式
- src/lib/cache.ts 重命名工厂参数 (无功能变化)
- src/app/{blog,projects,tags,categories}/[slug|id|tag|category]/page.tsx 迁移到 adapter
- src/lib/route-adapter.ts 新建
- src/types/index.ts 从 zod 派生 frontmatter 类型
- scripts/generate-rss.ts 迁移到共享 schema
- scripts/check-seo.ts 迁移到共享 schema
- 新增测试覆盖所有新模块

### 1.3 范围外 (out of scope)

- Worth exploring 候选 (W1-W6) — 留待下轮
- Speculative 候选 (11 项)
- EditorialHero 等其他 client 组件的 hooks 迁移 (已在 S5 完成 6 个核心组件)
- EditorialHero 的 prefers-reduced-motion 处理 (不在 S5 9 个未测试组件列表内)

---

## 2. 架构设计

### 2.1 posts.ts 拆分 (S2)

**4 文件 + barrel** 结构:

```
src/lib/posts/
├── index.ts          # barrel: re-export 全部公共 API
├── schema.ts         # zod schema + 派生类型 (复用 schemas/post-frontmatter.ts)
├── repository.ts     # createPostRepository(source) 工厂 + 缓存生命周期
├── query.ts          # 筛选/排序/分页/相邻/相关/系列 (纯函数, 接受 posts 数组)
└── search-text.ts    # MDX 清洗 (stripMdxForSearch / extractPostExcerpt / buildPostSearchText / extractPostHeadings)
```

**职责划分**:

| 模块             | 输入                         | 输出                                                                     | 职责                                               |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| `schema.ts`      | 无                           | `postFrontmatterSchema`, `PostFrontmatterInput`, `PostFrontmatterParsed` | zod schema + 类型派生                              |
| `repository.ts`  | `ContentSource`              | `{ getAllPosts, getPostBySlug, getAllPostSlugs, getFeaturedPosts }`      | 缓存 + 读取 + frontmatter 校验 + reading-time 计算 |
| `query.ts`       | `PostMeta[]` 或 `PostFull[]` | 筛选/排序结果                                                            | 纯函数查询                                         |
| `search-text.ts` | `content: string`            | `string \| string[]`                                                     | MDX 清洗 (无业务依赖)                              |

**barrel (`index.ts`)** re-export 所有公共 API, 现有 `import { ... } from '@/lib/posts'` 调用方零改动.

**迁移策略**: 新建 `src/lib/posts/` 目录, 删除原 `src/lib/posts.ts`, 保留 `src/lib/posts.ts` 不存在时 Next.js 自动解析到 `posts/index.ts`. 现有 13 个 export 全部 re-export.

### 2.2 ContentSource 注入策略 (S4)

**工厂函数模式**, 不破坏现有 API:

```typescript
// src/lib/content-source.ts (扩展)
import { createCache } from './cache';
import type { ContentSource } from './content-source';

export interface PostRepository {
  getAllPosts(): PostMeta[];
  getPostBySlug(slug: string): PostFull | null;
  getAllPostSlugs(): string[];
  getFeaturedPosts(): PostMeta[];
}

export function createPostRepository(source: ContentSource): PostRepository {
  const cache = createCache<PostFull[]>({ watchPath: CONTENT_DIR.blog, source });
  // ... 实现, 内部调 source.readFile / source.readDir
  return { getAllPosts, getPostBySlug, getAllPostSlugs, getFeaturedPosts };
}

// 默认实例 (供 app/ 使用, 不破坏现有 API)
export const postRepository = createPostRepository(filesystemSource);
```

**关键设计决策**:

1. `createCache` 增加可选 `source` 参数 (默认 `getContentSource()`). 显式注入时, cache 使用传入的 source 而非全局 service locator. 测试中传入 in-memory source 后, cache 自动绑定该 source 的 mtime.
2. `setContentSource()` 保留 (向后兼容), 但内部不再调 `resetAllCaches()` — 因为新模型下 cache 持有自己的 source 引用.
3. `resetAllCaches()` 保留, 用于测试场景下重置所有注册的 cache.

**为什么不用 setContentSource + resetAllCaches**:

- 全局态难以并发测试 (多个 describe 共享同一全局 source)
- 显式注入更易推理: `const repo = createPostRepository(inMemorySource({...}))` 后, repo 持有自己的 source + cache, 与其他测试隔离

### 2.3 测试夹具策略 (S4)

**in-memory source + raw MDX**:

```typescript
// src/lib/test-utils/in-memory-source.ts (新建)
import type { ContentSource } from '@/lib/content-source';

interface InMemoryFiles {
  [relativePath: string]: string;
}

export function createInMemorySource(files: InMemoryFiles): ContentSource {
  return {
    readFile(path) {
      return files[path] ?? null;
    },
    readDir(path) {
      const prefix = path.endsWith('/') ? path : `${path}/`;
      const entries = Object.keys(files)
        .filter((p) => p.startsWith(prefix))
        .map((p) => p.slice(prefix.length))
        .filter((p) => !p.includes('/'));
      return entries.length === 0 ? null : entries;
    },
    getMtime(path) {
      // 返回固定值, 测试场景下 cache 永不失效 (除非显式 invalidate)
      return files[path] !== undefined ? 0 : null;
    },
  };
}
```

**测试模式**:

```typescript
// src/lib/posts/repository.test.ts (新建)
import { createPostRepository } from './repository';
import { createInMemorySource } from '@/lib/test-utils/in-memory-source';

const FIXTURE = {
  'content/blog/2026-06-test-post.mdx': `---
title: 测试文章
description: 测试描述
date: 2026-06-01
tags: [test]
---

## 第一节
正文内容`,
};

describe('createPostRepository', () => {
  it('parses MDX frontmatter and body', () => {
    const repo = createPostRepository(createInMemorySource(FIXTURE));
    const post = repo.getPostBySlug('test-post');
    expect(post?.title).toBe('测试文章');
    expect(post?.headings).toEqual(['第一节']);
    expect(post?.content).toContain('正文内容');
  });

  it('filters drafts in production', () => {
    process.env.NODE_ENV = 'production';
    const repo = createPostRepository(
      createInMemorySource({
        ...FIXTURE,
        'content/blog/2026-06-draft.mdx': `---
title: 草稿
description: 草稿描述
date: 2026-06-02
tags: [test]
published: false
---
草稿正文`,
      }),
    );
    expect(repo.getAllPosts().find((p) => p.slug === 'draft')).toBeUndefined();
    process.env.NODE_ENV = 'test';
  });
});
```

**保留 1-2 个真实 fs 集成测试** (在 `posts.integration.test.ts`), 验证实际 content/blog 目录可读.

### 2.4 类型派生 (S2 顺手)

```typescript
// src/types/index.ts (修改)
import type { z } from 'zod';
import type { postFrontmatterSchema } from '@/lib/posts/schema';

// 从 zod schema 派生 (单一来源)
export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

// PostMeta / PostFull 保留手写 (含运行时计算字段)
export interface PostMeta extends PostFrontmatter {
  slug: string;
  readingTime: string;
  wordCount: number;
  excerpt: string;
  headings: string[];
  searchText: string;
}

export interface PostFull extends PostMeta {
  content: string;
}
```

**注意**: 现有 `PostFrontmatter.published: boolean` 和 schema 的 `published: z.boolean().optional().default(true)` 派生后变为 `published: boolean` (zod default 后类型是必填), 与现状一致.

### 2.5 createDynamicRoute adapter (S6)

**完整 adapter**, 集中 canonical 编码、title 模板、notFound 守卫:

```typescript
// src/lib/route-adapter.ts (新建)
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { buildPageMetadata } from './metadata';

interface DynamicRouteConfig<TData> {
  /** URL 参数名 (用于 generateStaticParams 和 params 解构), 如 'slug' / 'id' / 'tag' / 'category' */
  paramKey: string;
  /** URL 前缀, 用于构造 canonical path, 如 '/blog' / '/projects' / '/tags' / '/categories' */
  pathPrefix: string;
  /** 提取所有 slug (用于 generateStaticParams) */
  getAllSlugs(): string[];
  /** 根据 slug 查询数据, 找不到返回 null (触发 notFound) */
  getBySlug(slug: string): TData | null;
  /** 构造 metadata, 必须由 caller 提供 (因为 adapter 不知道 TData 形状) */
  buildMetadata(data: TData, slug: string): Metadata;
  /** 渲染页面, data 已确保非 null */
  render(data: TData, slug: string): ReactNode;
}

export function createDynamicRoute<TData>(config: DynamicRouteConfig<TData>) {
  const { paramKey, pathPrefix } = config;

  async function generateStaticParams() {
    return config.getAllSlugs().map((slug) => ({ [paramKey]: slug }));
  }

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ [key: string]: string }>;
  }): Promise<Metadata> {
    const resolved = await params;
    const rawSlug = resolved[paramKey];
    const slug = decodeSlug(rawSlug);
    const data = config.getBySlug(slug);
    if (!data) return {};
    return config.buildMetadata(data, slug);
  }

  async function Page({ params }: { params: Promise<{ [key: string]: string }> }) {
    const resolved = await params;
    const rawSlug = resolved[paramKey];
    const slug = decodeSlug(rawSlug);
    const data = config.getBySlug(slug);
    if (!data) notFound();
    return config.render(data, slug);
  }

  return { generateStaticParams, generateMetadata, default: Page };
}

/** URL slug 解码 (与现有 decodeRouteSegment 一致) */
function decodeSlug(rawSlug: string): string {
  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return rawSlug;
  }
}
```

**设计决策**:

- `buildMetadata` 是必填字段 (非 optional), 因为 adapter 无法从泛型 `TData` 推断 title/description
- `pathPrefix` 单独传入, 而非从 `paramKey` 推断, 因为 `/tags/[tag]` 的 paramKey 是 'tag' 但 pathPrefix 是 '/tags'
- `decodeSlug` 内置在 adapter 中, 统一所有路由的 URL 解码行为

**4 个路由迁移示例**:

```typescript
// src/app/blog/[slug]/page.tsx (重构后)
import { createDynamicRoute } from '@/lib/route-adapter';
import { postRepository } from '@/lib/content-source';
import { buildPageMetadata } from '@/lib/metadata';

const { generateStaticParams, generateMetadata, default: BlogPostPage } = createDynamicRoute({
  paramKey: 'slug',
  pathPrefix: '/blog',
  getAllSlugs: () => postRepository.getAllPostSlugs(),
  getBySlug: (slug) => postRepository.getPostBySlug(slug),
  buildMetadata: (post, slug) => buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    type: 'article',
    image: post.image,
    publishedTime: post.date,
    modifiedTime: post.updatedAt ?? post.date,
  }),
  render: (post, slug) => <BlogPostContent post={post} slug={slug} />,
});

export { generateStaticParams, generateMetadata };
export default BlogPostPage;
```

### 2.6 scripts 迁移到共享 schema (S2 顺手)

```typescript
// scripts/generate-rss.ts (重构后)
import { postFrontmatterSchema } from '@/lib/posts/schema';
import { parseFrontmatter } from '@/lib/parse-frontmatter';
// ... 删除 rssFrontmatterSchema 子集定义
// 使用 postFrontmatterSchema.safeParse(data)
```

```typescript
// scripts/check-seo.ts (重构后)
// 删除 9 个 if 分支重做的 frontmatter 校验
// 改为 postFrontmatterSchema.safeParse(data)
// 保留 SEO-specific 检查 (heading anchor 重复 / MDX 引用 / sitemap 覆盖率)
```

---

## 3. 数据流

### 3.1 重构前

```
app/blog/[slug]/page.tsx
    ↓ import { getPostBySlug } from '@/lib/posts'
posts.ts (255 行 god module)
    ↓ import { getContentSource }
content-source.ts (全局 _activeSource)
    ↓ 读取
content/blog/*.mdx
```

### 3.2 重构后

```
app/blog/[slug]/page.tsx (via createDynamicRoute)
    ↓ import { postRepository } from '@/lib/content-source'
content-source.ts
    ↓ const postRepository = createPostRepository(filesystemSource)  // 默认实例
posts/repository.ts (注入 source)
    ↓ 调用 source.readFile / source.readDir
posts/schema.ts (zod 校验) + posts/search-text.ts (MDX 清洗)
    ↓
content/blog/*.mdx

测试路径:
posts/repository.test.ts
    ↓ createPostRepository(createInMemorySource(FIXTURE))
posts/repository.ts (注入 in-memory source, 与全局 source 隔离)
```

---

## 4. 错误处理

### 4.1 现有错误处理保留

- `getPostBySlug(slug)` 找不到返回 `null` (page 通过 `notFound()` 守卫)
- frontmatter 校验失败抛出 `Error('[内容校验失败] ...')` (含 path + issues)
- 文件不存在抛出 `Error('[posts.ts] 文件不存在: ...')`

### 4.2 adapter 错误处理

- `getBySlug` 返回 `null` → adapter 调 `notFound()` (Next.js 404 页面)
- `generateMetadata` 中 `getBySlug` 返回 `null` → 返回空 `{}` (不阻塞渲染)
- `decodeSlug` 失败 (URL decode 异常) → 调 `notFound()` 而非抛错

### 4.3 测试错误处理

- `createInMemorySource` 的 `readFile` 返回 `null` 而非抛错 (与 filesystemSource 一致)
- repository 测试不依赖 `console.warn` (in-memory source 不触发"目录不存在"警告)

---

## 5. 测试策略

### 5.1 新增测试 (预计 +35-50 个)

| 文件                           | 测试数 (估) | 覆盖内容                                                             |
| ------------------------------ | ----------- | -------------------------------------------------------------------- |
| `posts/schema.test.ts`         | 5-8         | schema 校验 + default + 边界                                         |
| `posts/repository.test.ts`     | 10-15       | in-memory source 注入 + frontmatter 校验 + reading-time + draft 过滤 |
| `posts/query.test.ts`          | 15-20       | 筛选/排序/分页/相邻/相关/系列 (用 in-memory fixture)                 |
| `posts/search-text.test.ts`    | 5-8         | 已有 5 个, 拆出后保持                                                |
| `content-source.test.ts`       | 5-8         | createPostRepository + in-memory source + 默认实例                   |
| `route-adapter.test.ts`        | 8-12        | 4 个路由 × adapter 行为 (canonical / notFound / metadata)            |
| `scripts/generate-rss.test.ts` | 3-5         | schema 共享后的 RSS 生成                                             |
| `scripts/check-seo.test.ts`    | 3-5         | schema 共享后的 SEO 检查                                             |

### 5.2 现有测试迁移

- `src/lib/posts.test.ts` (37 tests) → 拆分为:
  - `posts/search-text.test.ts` (5 个, 已有 — 搬迁即可)
  - `posts/repository.test.ts` (重写, 用 in-memory source)
  - `posts/query.test.ts` (重写, 用 in-memory fixture)
  - `posts.integration.test.ts` (1-2 个, 验证真实 content/blog 可读)

**测试断言策略**:

- 现有断言 `getPostBySlug('go-cli-tool').title contains 'Go'` → 改为 in-memory fixture 中创建 slug='go-cli-tool' 的测试文章, 断言其 title
- 现有断言 `getSeriesPosts('vps-initial-setup')` 返回 5 篇 → 改为 fixture 中创建 5 篇同 series 文章, 断言顺序

### 5.3 回归门槛

- 所有现有 242 tests 必须全绿 (行为不变)
- 新增 35-50 个测试覆盖新模块
- tsc 0 errors
- eslint 0 errors 0 warnings
- `pnpm build` 成功 (验证 barrel re-export + adapter 默认导出可用)
- E2E 32 tests 全绿 (验证 4 个动态路由页面渲染正确)

---

## 6. 风险与缓解

### 6.1 风险: barrel re-export 破坏 tree-shaking

**风险**: `posts/index.ts` re-export 全部 13 个函数可能导致客户端 bundle 包含未使用代码.

**缓解**: posts.ts 是 server-only lib (`'use server'` 不需要, 因为不导出给 client). 现有 import 已是 `import { getPostBySlug } from '@/lib/posts'`, 拆分后仍只导入用到的. Tree-shaking 在 server bundle 同样有效.

### 6.2 风险: adapter 默认导出与 Next.js 约定冲突

**风险**: Next.js App Router 要求 `page.tsx` 默认导出 React 组件, `generateStaticParams` 和 `generateMetadata` 是命名导出. `createDynamicRoute` 返回的对象解构后赋值给 `export const` 是否符合 Next.js 编译要求?

**缓解**: Next.js 16.2 支持以下形式:

```typescript
export const { generateStaticParams, generateMetadata, default: Page } = createDynamicRoute({...});
```

若不支持, 改为传统形式 (adapter 仅返回 helpers, page 仍手写).

### 6.3 风险: in-memory source 的 mtime 行为

**风险**: in-memory source 的 `getMtime` 返回固定值 0. cache 在 `process.env.NODE_ENV !== 'production'` 时检查 mtime. 若 mtime 0 被视为"无效" (null), cache 可能持续失效.

**缓解**: `createCache` 的 `getOrCompute` 中 `if (currentMtime !== null && currentMtime !== cachedMtime)` — 0 不等于 null, 且初始 `cachedMtime = null`, 第一次访问后 `cachedMtime = 0`, 后续 `0 === 0` 不失效. 行为正确.

### 6.4 风险: types/index.ts 派生类型破坏现有代码

**风险**: `PostFrontmatter` 派生后, `published` 字段从手写的 `published: boolean` (必填) 变为 zod 派生的 `published: boolean` (default 后必填). 现有代码所有使用 `post.published` 的地方都假设是 boolean, 行为一致. 但 `series` 等可选字段在派生后是 `series?: string`, 现有 `post.series` 直接使用时可能需要类型收窄.

**缓解**: 全量 tsc + 242 tests 跑通即可验证. 已在 S5 完成 242 tests, 重构后保持该门槛.

---

## 7. 实施顺序

按依赖链推进:

1. **新建 src/lib/posts/ 目录** (schema.ts → search-text.ts → query.ts → repository.ts → index.ts barrel)
2. **删除 src/lib/posts.ts**, 验证 barrel re-export 生效
3. **修改 src/lib/content-source.ts** (增加 createPostRepository + postRepository 默认实例)
4. **修改 src/lib/cache.ts** (增加 source 可选参数)
5. **修改 src/types/index.ts** (派生 PostFrontmatter)
6. **新建 src/lib/test-utils/in-memory-source.ts**
7. **重写 src/lib/posts.test.ts** (拆为多个测试文件 + in-memory fixture)
8. **迁移 scripts/generate-rss.ts + scripts/check-seo.ts**
9. **新建 src/lib/route-adapter.ts**
10. **迁移 4 个动态路由 page.tsx** (blog → projects → tags → categories)
11. **新增测试覆盖所有新模块**
12. **回归验证**: tsc + lint + test + build + e2e

每个步骤独立提交, 便于回滚.

---

## 8. 成功标准

### 8.1 功能正确性

- 所有 242 现有测试通过 (行为不变)
- 新增 35-50 个测试全部通过
- 4 个动态路由页面渲染输出与重构前一致 (E2E 验证)

### 8.2 架构改进可观察

- `src/lib/posts.ts` (255 行) → `src/lib/posts/` (4 文件, 单文件 < 100 行)
- `posts.test.ts` 不再读真实 `content/blog/*.mdx` (除 1-2 个集成测试)
- 4 个动态路由 page.tsx 平均行数减少 30%+ (adapter 集中三段式接口)
- scripts 不再重写 schema 子集 (统一 import `postFrontmatterSchema`)

### 8.3 质量门槛

- tsc: 0 errors
- eslint: 0 errors, 0 warnings
- vitest: 280+ tests passing
- build: success
- e2e: 32 tests passing

---

## 9. 后续待办 (out of scope)

- W1-W6 Worth exploring 候选 (下轮 brainstorming)
- Speculative 11 项 (6 个月观察期)
- Speed Insights p75 基线回填 (依赖生产流量)
- mobile Lighthouse preset 评估
