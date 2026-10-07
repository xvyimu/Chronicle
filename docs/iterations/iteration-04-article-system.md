# Iteration 04 · 文章系统

## 1. 迭代名称

文章系统

## 2. 当前状态

**Completed**

## 3. 目标

文章列表 + 卡片（无大图）+ 详情 + 阅读排版。

## 4. 背景

现状 `BlogCard` 用 `MagneticCard`（3D 倾斜 + 光斑跟随）+ `stagger-in` 入场动画 + 悬停 `translateY`——均为用户明令禁止的装饰性动画（审计 D1/用户指令）。

## 5. 范围

- 重写 `BlogCard`：去 3D 倾斜 / 光斑 / 入场动画，改静态低对比卡片。
- 重写 `blog-ui.css`：去 `stagger-in` / `magnetic` 相关；保留 TOC / 标签云 / 图片放大。
- 列表页文案与导航统一（博客 → 文章）。
- 复核详情页排版（宽度 / 行高 / 字号）符合设计系统。

## 6. 非范围

- 不改详情页 `prose.css` 正文排版（已符合规范：720px / 行高 1.9 / 16px）。
- 不改 `--font-display`（Cormorant 衬线标题）——属设计系统层，且牵动 LCP preload 配置，留后续评估。
- 不改数据层。

## 7. 前置条件

Iteration 02。

## 8. 具体任务

- [x] 重写 `BlogCard`（去 MagneticCard）
- [x] 重写 `blog-ui.css`（去装饰动画）
- [x] 列表页标题「博客」→「文章」
- [x] `BlogList` 间距微调
- [x] 同步 `BlogCard.test.tsx` / `blog/page.test.tsx`
- [x] 四门验证

## 9. 涉及文件

**修改**：`src/components/blog/BlogCard.tsx` + test · `src/app/styles/blog-ui.css` · `src/app/blog/page.tsx` + test · `src/components/blog/BlogList.tsx`
**删除**：无
**未动**：`src/app/styles/article-ui.css` · `prose.css`（排版已合规）

## 10. 数据或接口变化

无。

## 11. 设计变化

- 文章卡片：3D 倾斜 + 光斑 + 入场 stagger → 静态卡片（低对比边界 + 悬停背景 + 轻箭头）。
- 卡片不再用 `MagneticCard`；`ProjectCard` 仍用（迭代 05/06 评估）。

## 12. 测试计划

四门 + dev 冒烟。

## 13. 验收标准

阅读体验良好；无装饰动画；无溢出；四门全绿。

## 14. 风险

R1（排版回归）——dev 冒烟 7 路由 200 确认。

## 15. 回滚方式

`git revert` 本迭代提交。

## 16. 实际完成情况

- `BlogCard` 重写为静态卡片（无 `magnetic-card`，dev 冒烟计数 0）。
- `blog-ui.css` 去 `stagger-in` / `magnetic` 相关规则。
- 列表页文案统一为「文章」。
- 验证：`typecheck` 0 · `lint` 0 · `test` 71 文件/541 测试 · `build` 0（105 静态页）· dev 7 路由 200（含详情页 145KB 正常输出）。

## 17. 遗留问题

- **详情页标题仍用 Cormorant 衬线体**（`--font-display`，5 处使用）——与「工作台无衬线」气质存差异；改动牵动 LCP preload，留迭代 06 评估。
- **`ProjectCard` 仍用 `MagneticCard`**（3D 倾斜）——项目页留迭代 05/06 处理。
- `article-ui.css` 有 2 处轻微 `translateY(-1px)` 悬停（可接受，非装饰动画）。
- `check-doc-links-script.test.ts` flaky（R10，迭代 06）。

## 18. 下一迭代建议

Iteration 05：内容导航（分类/标签/专题/归档/收藏/最近阅读）。
