# Cache Components 迁移指南

## 当前状态

项目使用 `createCache<T>` 工具实现内存级缓存，在开发环境通过 mtime 自动失效，生产环境首次读取后长期缓存。当前页面因严格 CSP nonce 走按需动态渲染，但数据源仍全部来自本地文件，因此这个轻量缓存仍适用。

## 何时迁移到 Cache Components

当项目引入以下场景时，应考虑迁移：

- 从外部 API 获取数据（如 GitHub stars、天气信息）
- 页面混合静态内容和实时数据
- 需要 ISR（增量静态再生）

## 迁移步骤

### 1. 启用 cacheComponents

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
};
```

### 2. 为低频数据添加 "use cache"

```ts
// src/lib/projects.ts
export async function getAllProjects(): Promise<Project[]> {
  'use cache';
  cacheLife('hours');
  // ...existing logic
}
```

### 3. 为实时数据添加 Suspense 边界

```tsx
// 页面中包裹动态内容
import { Suspense } from 'react';

export default async function Page() {
  return (
    <div>
      <h1>静态标题</h1>
      <Suspense fallback={<div>加载中…</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

### 4. 废弃旧配置

启用 Cache Components 后，以下配置将被禁用：

- `export const revalidate = ...`
- `export const dynamic = 'force-dynamic'`
- `fetch(..., { cache: 'no-store' })`

## 风险评估

- **高风险**：未缓存的动态数据访问必须包裹 `<Suspense>`，否则构建报错
- **中风险**：`createCache<T>` 的 mtime 失效机制可能与 Cache Components 冲突
- **低风险**：纯静态页面（无外部数据）不受影响

## 建议

当前项目所有业务数据来自本地文件系统，**暂不需要迁移**。当引入外部实时数据源、ISR 或需要细粒度缓存生命周期时，再按此指南迁移。
