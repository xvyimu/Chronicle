# 任务计划：延后运营事项工程化

> 状态：Completed / Archived（2026-07-18）  
> 工程提交：`96e0214`  
> 记录提交：`238f2c7` / `fa3e579`  
> 功能基线（前后端分层）：`a91a07d`

## 目标

把根 TODO 中仅依赖账号或规模门槛的事项，变成**可执行手册 + 可自动分类的就绪门禁**，并在本机穷尽 API/浏览器能力后诚实记录硬阻塞。

## 非目标

- 代登 Google / Bing / Vercel 控制台
- 伪造 p75 或假“已提交 sitemap”
- 未达门槛引入 Meili/ES / Cache Components

## 阶段

1. [x] 深度规划与决策总表
2. [x] `ops-readiness` 分类器 + CLI + 测试
3. [x] blur 支持 `public/images/blog`
4. [x] 维护文档 / TODO / 基线索引
5. [x] live SEO / smoke / CI 验证
6. [x] 穷尽 Vercel / CF / browser-act 路径并记录硬阻塞
7. [x] 本目录归档

## 完成定义

- 工程侧无条件事项全部完成并上线
- `pnpm check:ops-readiness -- --live` 可复验
- 账号类与条件类边界写清，接手者不会误开重构
