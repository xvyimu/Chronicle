# 任务计划：前后端逻辑分层优化

> 状态：Completed / Archived（2026-07-18）  
> 生产提交：`a91a07dc361392eef882a59993a6eb0017cb8a40`  
> CI：`29631593044` success（quality / bundle-analyze / e2e / deploy）

## 目标

在单一 Next.js App Router / Vercel 应用内建立可执行的逻辑前后端边界：

- 页面与 Route Handler 经 `src/server` 访问内容与服务端搜索
- 客户端仅依赖共享 DTO、常量、纯投影、Hook 与 HTTP
- AST 边界测试阻断 client → server 与 lib → server
- 保持页面、URL、Search API、内容、缓存、安全、部署与数据模型行为不变

## 非目标

- 不拆独立前后端应用
- 不新增数据库、CMS、Redis、搜索集群、CORS、环境变量或云资源
- 不修改访客端样式、MDX/JSON 内容模型或 CI/依赖配置

## 方案

采用方案 A：同仓 `src/server` facade + 迁移搜索引擎/限流 + 收窄 `src/lib/search` + 模块边界测试。

设计：`docs/superpowers/specs/2026-07-18-frontend-backend-boundary-design.md`  
实施规格（本地 pipeline，gitignore）：`.pipeline/2026-07-18-frontend-backend-boundary/spec.md`

## 阶段

1. [x] 设计确认与 pipeline 规格
2. [x] 边界测试 + `src/server/content` + 15 个页面 import 迁移
3. [x] 搜索 engine/rate-limit 迁入 `src/server/search` + service
4. [x] 收窄 `src/lib/search` + 改造 Search Route Handler
5. [x] 维护文档（architecture / API / handoff）
6. [x] 定向与全量验证（本地 + CI）
7. [x] 提交、推送、生产部署与冒烟
8. [x] 阶段性总结与归档（本目录）

## 完成定义

- 精确文件清单落地且无范围外变更
- 边界门禁真实扫描且 fixture 可检出违规
- Search API 外部契约不变
- 本地与 CI 质量门禁通过并已部署
- 维护文档与生产基线更新
