# 设计文档: links.ts → data/links.json 迁移 (W2)

**日期**: 2026-06-30
**作者**: brainstorming skill 流程
**关联**: docs/architecture-review.html 中 W2 候选 (links.ts 633 行纯数据 → JSON)
**前置条件**: S4 ContentSource 抽象层已落地 (src/lib/content-source.ts + createCache)

---

## 1. 目标与范围

### 1.1 目标

把 `src/lib/links.ts` 中 633 行内联的纯链接数据迁移到 `data/links.json`, 使 links 数据走与 `projects.ts` 完全对称的链路: JSON 数据文件 → Zod 校验 → ContentSource 读取 → createCache 缓存 → 查询函数.

收口 S4 抽象层留下的最后一处不一致: links 是当前唯一绕过 ContentSource、把数据硬编码在 `.ts` 模块里的数据源. 迁移后即可像 posts / projects 一样注入 in-memory source 做测试.

### 1.2 范围 (in scope)

- `data/links.json` 新建 — 从 `links.ts` 提取纯数据
- `src/lib/links.ts` 重写 — 类型移出, Zod schema + ContentSource 读取 + 缓存 + 查询函数
- `src/lib/links.test.ts` 新建 — parseLinks 单元测试 + 边界用例
- `src/lib/content-dirs.ts` — CONTENT_DIR 新增 `links: 'data/links.json'`
- `src/types/index.ts` — 新增 LinkItem / LinkCategory 类型
- `src/app/links/page.tsx` — `linkCategories` 常量 → `getAllLinkCategories()` 调用
- `src/app/links/page.test.tsx` — 同上 import 调整
- `src/app/page.tsx` — 同上 import 调整
- `src/components/home/CuratedLinksPreview.tsx` — 类型 import 改为 `@/types`

### 1.3 范围外 (out of scope)

- RSS / per-category feed — 属另一方向 (handoff D)
- site.ts / content-dirs.ts 拆分 (W1) — 属另一候选
- URL 去重 / tracking 参数校验逻辑变更 — 现有 page.test.tsx 中的校验保留, 仅换数据来源

---

## 2. 架构设计

### 2.1 数据流

```
data/links.json              ← 纯数据 (633 行 → JSON)
     │
     ▼
src/lib/links.ts             ← Zod 校验 + ContentSource 读取 + createCache 缓存
     │  getAllLinkCategories()     替代原 linkCategories 常量
     │  getLinkCategoryById(id)    新增, 首页按 id 取子集
     │  parseLinks(raw)            纯函数, Zod 校验
     │
     ▼
调用方 (page.tsx, page.test.tsx)
     │  import { getAllLinkCategories } from '@/lib/links'
```

### 2.2 与 projects.ts 的对称性

| 维度       | projects.ts (现状)              | links.ts (迁移后)                          |
| ---------- | ------------------------------- | ------------------------------------------ |
| 数据文件   | data/projects.json              | data/links.json                            |
| Zod schema | 内联在 projects.ts              | 内联在 links.ts                            |
| 读取       | ContentSource.readFile          | ContentSource.readFile                     |
| 缓存       | createCache({ watchPath })      | createCache({ watchPath })                 |
| 缺失处理   | console.warn + 返回 []          | console.warn + 返回 []                     |
| 解析失败   | console.error + 返回 []         | console.error + 返回 []                    |
| 查询函数   | getAllProjects / getProjectById | getAllLinkCategories / getLinkCategoryById |

links.ts 迁移后即为 projects.ts 的同构副本, 降低认知负担.

---

## 3. 详细变更

### 3.1 data/links.json (新建)

将 `src/lib/links.ts` 中 `linkCategories` 数组的纯数据原样提取为 JSON. 结构:

```json
[
  {
    "id": "ai",
    "title": "AI 工具",
    "description": "主流的 AI 对话、创作和开发辅助工具",
    "items": [
      { "title": "ChatGPT", "url": "https://chat.openai.com/", "description": "..." }
    ]
  }
]
```

当前落地为 9 个分类共 111 条链接, 无重复 URL, 无 aff/ref/utm 等追踪参数.

### 3.2 src/types/index.ts (新增类型)

```ts
export interface LinkItem {
  title: string;
  url: string;
  description: string;
}

export interface LinkCategory {
  id: string;
  title: string;
  description: string;
  items: LinkItem[];
}
```

将类型从 links.ts 内部定义移到统一类型文件, 与 Project 类型同构. CuratedLinksPreview 不再需从 links.ts 间接导入类型.

### 3.3 src/lib/links.ts (重写)

公共 API:

```ts
import type { LinkItem, LinkCategory } from '@/types';

export function getAllLinkCategories(): LinkCategory[];
export function getLinkCategoryById(id: string): LinkCategory | null;
export function parseLinks(raw: unknown): LinkCategory[];
```

实现要点 (镜像 projects.ts):

- Zod schema: `LinkItemSchema` + `LinkCategorySchema` 内联
- `CONTENT_DIR.links` 作为读取路径
- `createCache<LinkCategory[]>({ watchPath: CONTENT_DIR.links })`
- `getAllLinkCategories` 内部 `getOrCompute`: source.readFile → JSON.parse → parseLinks
- 文件缺失: `console.warn('[links] 数据文件不存在: ...')` + 返回 `[]`
- JSON 解析失败: `console.error('[links] JSON 解析失败: ...')` + 返回 `[]`
- `parseLinks`: `z.array(LinkCategorySchema).parse(raw)`, 不排序 (保持 JSON 顺序, 与现状一致 — links 无 year 字段, 无天然排序键)

注意: projects.ts 的 `parseProjects` 按 year 降序排序. links 无排序语义, `parseLinks` 仅做校验, 保持 JSON 文件内定义的顺序.

### 3.4 src/lib/content-dirs.ts (CONTENT_DIR 扩展)

```ts
export const CONTENT_DIR = {
  blog: 'content/blog',
  about: 'content/about.mdx',
  projects: 'data/projects.json',
  links: 'data/links.json',
} as const;
```

### 3.5 调用方迁移

**src/app/links/page.tsx**:

```diff
- import { linkCategories } from '@/lib/links';
+ import { getAllLinkCategories } from '@/lib/links';
  ...
- {linkCategories.map((category) => (
+ {getAllLinkCategories().map((category) => (
```

**src/app/page.tsx** (首页取 4 个分类预览):

```diff
- import { linkCategories } from '@/lib/links';
+ import { getAllLinkCategories } from '@/lib/links';
  ...
- const previewLinkCategories = homeLinkCategoryIds
-   .map((id) => linkCategories.find((category) => category.id === id))
+ const linkCategories = getAllLinkCategories();
+ const previewLinkCategories = homeLinkCategoryIds
+   .map((id) => linkCategories.find((category) => category.id === id))
```

**src/app/links/page.test.tsx**:

```diff
- import { linkCategories } from '@/lib/links';
+ import { getAllLinkCategories } from '@/lib/links';
  ...
- for (const cat of linkCategories) {
+ const linkCategories = getAllLinkCategories();
+ for (const cat of linkCategories) {
```

测试用例内的 `linkCategories` 改为函数返回值的局部变量, 断言逻辑不变. URL 去重 / tracking 参数校验用例照搬.

### 3.6 src/lib/links.test.ts (新建)

覆盖 parseLinks 纯函数:

- 空数组输入返回空数组
- 最小合法分类 (单 item) 通过
- 缺失必填字段 (如 item 无 url) 抛 ZodError
- 非数组输入抛错
- items 为非数组抛错

getAllLinkCategories 走文件系统的集成行为已由 page.test.tsx 覆盖 (渲染全部分类 / 全部 item / 外链 target / 去重), 不重复.

---

## 4. 风险与回滚

### 4.1 风险

- **数据迁移完整性**: 大量链接数据手工提取有遗漏风险. 缓解: 迁移后运行现有 `links/page.test.tsx` (断言全部 111 条 item 渲染 + 去重 + 无追踪参数) + 首页测试 (断言 4 个分类预览), 任何遗漏立即暴露.
- **JSON 语法**: 中文 / 特殊字符在 JSON 中需正确转义. 缓解: 描述字段无引号 / 反斜杠, 风险低; 构建时 JSON.parse 失败会被 try/catch 兜住返回 [].
- **顺序变化**: 现有测试断言"包含 engineering-docs / self-hosted / vps", 不依赖顺序. 迁移保持 JSON 内顺序与原数组一致, 无顺序回归.

### 4.2 回滚

单次提交, 全部为新增 + 局部替换, 无破坏性删除. 回滚即 `git revert <commit>`.

---

## 5. 测试与验证

### 5.1 质量门

- 当前基线 504 单元/集成测试 + 43 E2E 测试全绿
- `pnpm build` 成功, /links 与首页静态化标记保持 `○`
- 生产部署后 /links 渲染 9 分类 111 条, 首页 4 分类预览正常

### 5.2 验证步骤

1. `pnpm test` — 单元测试全绿
2. `pnpm build` — 构建成功, 确认 /links 仍为静态页
3. `pnpm test:e2e` (或本地 dev) — 链接页与首页视觉无回归
4. 抽查 /links: 9 分类标题 + 部分外链 target=_blank 正常

---

## 6. 自检清单

- [x] 无 placeholder / TBD / TODO
- [x] 内部一致: JSON → Zod → 缓存 → 函数, 与 projects.ts 完全对称
- [x] 范围可控: 单一数据迁移, 一个实现计划可承载
- [x] 无歧义: `linkCategories` 常量消亡, `getAllLinkCategories()` 函数替代, 调用方迁移路径明确
