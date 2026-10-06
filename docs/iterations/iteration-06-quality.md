# Iteration 06 · 质量优化

## 1. 迭代名称

质量优化

## 2. 当前状态

**Completed**

## 3. 目标

响应式完善 · 可访问性 · 深色模式 · SEO · 性能 · 错误边界 · 404 · 清废弃代码 · 快照重生成。

## 4. 背景

前 5 个迭代累积的遗留项集中于此收口（见各迭代 §17）。

## 5. 范围

- 清死代码：`MagneticCard`（3D 倾斜，明令禁止）+ `ProjectCard` 去它。
- 清死文档：`docs/API.md` 重写（去 `/api/search` `/api/preview`）。
- 清死文案：`ops-readiness.ts` 的 `/api/search`。
- 修 e2e spec 死链（`blog/mobile/home.spec.ts`）。
- **修真 bug**：`layout.tsx` Footer 重复渲染。
- **修 a11y 冲突**：`aria-label="搜索文章"` 重名 → Header 改「前往搜索」。
- **修对比度**：`--text-dim` 未达 AA → 调值。
- 修 flaky 测试（R10）。

## 6. 非范围

- 不改数据层。
- 全站装饰背景层去留（`SiteBackdropStage`）——评估后**保留**（见 D-022）。

## 7. 前置条件

Iteration 03–05。

## 8. 具体任务

- [x] `ProjectCard` 去 `MagneticCard`；`MagneticCard` 退役（组件 + 测试 + CSS）
- [x] `docs/API.md` 重写（仅剩 csp-report + 客户端搜索说明）
- [x] `ops-readiness.ts` 文案订正
- [x] e2e spec 三文件重写/修正（去死链，加客户端搜索测试）
- [x] 修 Footer 重复渲染（layout.tsx 漏删旧 `<Footer />`）
- [x] 修搜索 aria-label 重名
- [x] 修 `--text-dim` 对比度（浅 `#8b8b93`→`#6f6f77`；深 `#71717a`→`#7d7d86`）
- [x] flaky 测试加超时（R10）
- [x] 快照重生成（`unchanged`，已最新）
- [x] **清 CSP 残留**：`csp.ts` 去 Giscus 白名单（`script-src`/`connect-src`/`frame-src`）；`site.ts` 去 `giscus` 配置；`.env.example` 去 Giscus 三项
- [x] **清 `/api/search` 残留**：`check-production-content.ts` 的 search 用例改「home-search」（客户端搜索，首页含搜索框）
- [x] 四门 + e2e + seo + build 全绿

## 9. 涉及文件

**新增**：无
**修改**：`src/components/projects/ProjectCard.tsx` + test · `src/components/layout/Header.tsx` + test · `src/app/layout.tsx` · `src/app/not-found.tsx` + test · `src/app/styles/tokens.css` · `src/app/styles/components.css` · `src/lib/ops-readiness.ts` · `src/lib/csp.ts` + test · `src/lib/site.ts` · `src/lib/check-doc-links-script.test.ts` · `scripts/check-production-content.ts` + 其 test · `.env.example` · `e2e/{blog,home,mobile}.spec.ts` · `docs/API.md`
**删除**：`src/components/ui/MagneticCard.tsx` + test

## 10. 数据或接口变化

无（`docs/API.md` 记录现状：仅 csp-report）。

## 11. 设计变化

- `--text-dim` 对比度达标（浅 4.77 / 深 4.88）。
- 项目卡片去 3D 倾斜。

## 12. 测试计划

四门 + e2e + check:seo + build + 对比度脚本核验。

## 13. 验收标准

无死代码；a11y 达标；四门全绿；e2e 全绿。

## 14. 风险

R3（快照）——已 `content:build` 确认最新。

## 15. 回滚方式

`git revert` 本迭代提交。

## 16. 实际完成情况

- **修了两个真 bug**：① `layout.tsx` Footer 重复渲染（迭代 02 改 layout 时漏删旧 `<Footer />`）；② `aria-label="搜索文章"` 重名（Header 链接与首页搜索框）。
- **对比度达标**：`--text-dim` 浅 3.24→4.77、深 4.12→4.88（均过 WCAG AA 4.5）。
- 死代码/死文档/死文案/e2e 死链全清；flaky 测试加超时。
- **CSP 收紧**：评论功能删除后，`csp.ts` 仍白名单 `giscus.app`（3 处指令）+ `site.ts` 仍存 giscus 配置 + `.env.example` 仍存三项 env——全清（真实安全面收窄）。
- **search 用例改客户端**：`check-production-content.ts` 的 `/api/search?q=` 探针改「首页含搜索入口」。
- 验证：`typecheck` 0 · `lint` 0 · `test` 71 文件/536 测试 · **e2e 45 passed** · `check:seo` passed · `build` 0（107 页）。

## 17. 遗留问题

- **全站装饰背景层保留**（D-022）：`SiteBackdropStage` 仍在非首页渲染（旋转平面带含旧鼠尾草绿）。评估后保留（成本低、非阻塞），若后续要彻底中性灰再清。
- 详情页标题仍用 Cormorant 衬线体（D-019，未改）。
- `--font-display` 的 LCP preload 配置未复核（改动牵动性能，未动）。

## 18. 下一迭代建议

Iteration 07：发布准备（回归 + 构建 + 链接 + 回滚 + 版本 + 发布清单）。
