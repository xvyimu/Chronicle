# 11 · 可访问性

> 状态：Draft（Iteration 00）
> 日期：2026-10-06

---

## 要求

| 项               | 要求                        | 现状                               |
| ---------------- | --------------------------- | ---------------------------------- |
| 语义化 HTML      | 用 nav/main/article/section | 基本满足                           |
| 键盘操作         | 全部交互可键盘完成          | 满足（待复核工作台布局）           |
| 跳到主要内容     | skip-link                   | ✅ `app/layout.tsx:109`            |
| Focus Visible    | 可见焦点环                  | ✅ `focus-visible:ring-*`          |
| 图标按钮标签     | 必须有 `aria-label`         | 需逐组件复核                       |
| 表单 Label       | 搜索框等有 label            | 迭代 03 新建时保证                 |
| 对比度           | 正文 ≥4.5:1 / 大字 ≥3:1     | 中性灰方案需实测                   |
| Reduce Motion    | `prefers-reduced-motion`    | ✅ `animations.css` / `tokens.css` |
| 屏幕阅读器       | 合理 landmark + aria        | 待复核                             |
| 标题层级         | 不跳级（h1→h2→h3）          | 待复核                             |
| 链接可识别性     | 正文链接可辨                | ✅                                 |
| 移动端点击区     | ≥40px                       | 迭代 02 保证                       |
| 搜索结果键盘选择 | ↑↓ + Enter                  | 迭代 03 实现                       |

---

## 关键约束（来自用户指令）

- 不得出现不可访问的纯图标按钮。
- 不得出现缺少 label 的表单。
- 不得出现无法键盘操作的菜单。

---

## 验证方式

- 手工：Tab 遍历全站导航 + 搜索 + 文章。
- 工具：迭代 06 评估引入 `@axe-core/playwright` 或 `eslint-plugin-jsx-a11y`（已装）。
- 对比度：中性灰 token 落地后用工具核（迭代 01/06）。

## 现有基础

- `eslint-plugin-jsx-a11y` 已在 devDependencies。
- `prefers-reduced-motion` 已支持。
- skip-link 已存在。
