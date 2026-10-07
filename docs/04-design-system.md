# 04 · 设计系统

> 状态：Draft → Iteration 01 落地 Token 层
> 日期：2026-10-06
> 依据：`docs/01-project-audit.md` §9 设计问题 · 用户重构指令「AI 工作台气质」
> 落地文件：`src/app/styles/tokens.css`（语义 Token SSOT）

---

## 1. 设计原则

1. **Calm over loud** —— 中性灰为主，强调色只用于少量状态与关键入口。
2. **Whitespace is structure** —— 用留白与背景明度建立层级，不靠边框和阴影。
3. **Reading first** —— 正文可读性优先于任何视觉效果（硬约束）。
4. **One shell** —— 全站统一应用外壳，不每页各自为政。
5. **Restrained motion** —— 动效只服务反馈，120–220ms，尊重 `prefers-reduced-motion`。

---

## 2. 色彩系统（语义 Token）

**改造方向**：现有 `tokens.css` 是「Paper Gallery」暖纸色（`--bg:#f1f0eb` 暖米色 + `--brand:#59756d` 鼠尾草绿）。目标改为**中性灰阶**——页面白/近白，面板极浅灰，强调色克制。

### 语义 Token（浅色）

| Token               | 用途          | 值（规划）                                        |
| ------------------- | ------------- | ------------------------------------------------- |
| `--bg`              | 页面背景      | `#ffffff` 或近白 `#fcfcfd`                        |
| `--bg-soft`         | 面板/侧栏底   | `#f7f7f8`                                         |
| `--surface`         | 主面板        | `#ffffff`                                         |
| `--surface-hover`   | 悬停          | `#f4f4f5`                                         |
| `--text`            | 一级文字      | `#18181b`（近黑）                                 |
| `--text-soft`       | 二级文字      | `#52525b`                                         |
| `--text-dim`        | 三级/辅助     | `#8b8b93`                                         |
| `--border`          | 低对比边界    | `rgba(24,24,27,0.08)`                             |
| `--border-strong`   | 稍强边界      | `rgba(24,24,27,0.16)`                             |
| `--brand`（accent） | 强调/关键入口 | 中性偏冷单色（如 `#3f3f46` 或克制的蓝 `#4f6bed`） |
| `--ring`            | 焦点环        | 同 accent                                         |
| `--destructive`     | 错误          | `#b4232a`                                         |
| `--success`         | 成功          | `#15803d`                                         |
| `--warning`         | 警告          | `#a16207`                                         |

> **对齐用户建议的语义名**：`background` / `foreground` / `panel` / `panelForeground` / `surface` / `surfaceHover` / `muted` / `mutedForeground` / `border` / `ring` / `accent` / `accentForeground` / `destructive` / `success` / `warning`。
> **落地策略**：保留现有变量名（`--bg`/`--text`/`--surface`…）作为**兼容别名**指向新语义层，避免一次性改 4880 行 CSS（渐进式重构）。新代码用语义名。

### 深色模式

非简单反转：面板层级用明度递进（`#111`→`#18181b`→`#1f1f23`），文字对比度单独校，代码块背景独立，边框用白透明。

---

## 3. 排版系统

| 用途      | 字体                   | 字号                  | 行高            |
| --------- | ---------------------- | --------------------- | --------------- |
| 正文      | Noto Sans SC 400       | 16px（≥15px）         | 1.75（1.7–1.9） |
| 标题      | Noto Sans SC 700       | clamp 分级            | 1.2–1.3         |
| 展示标题  | Cormorant Garamond 500 | 保留（首页/文章标题） | —               |
| 代码/标签 | JetBrains Mono 400/700 | 13–14px               | 1.5             |
| 辅助文字  | Noto Sans SC 400       | ≥12px（不普遍小于）   | 1.5             |

字体加载：`next/font/google`，`display: swap`，LCP 字体 preload（现有矩阵 CH-PERF-002 保留）。

---

## 4. 间距系统

合法阶（Atelier 约定保留）：`4 / 8 / 16 / 24 / 32`（`--space-1/2/4/6/8`）。
`--space-3/5/10/12/16` 为 **legacy 别名**，新代码不用（现有规则不改，渐进清理）。

---

## 5. 圆角系统

| 用途              | 半径         |
| ----------------- | ------------ |
| 主面板            | 16–20px      |
| 控件（按钮/输入） | 10–12px      |
| 输入框            | 14–18px      |
| 标签              | 胶囊（full） |
| 小元素            | 4px          |

现状：`--radius: 8px`（control 4 / card 8）。**规划**：新增 `--radius-panel: 18px`，卡片/控件维持 8–12px，避免一次性改动。

---

## 6. 阴影系统

原则：普通卡片**不用阴影**，靠背景明度 + 间距分层。阴影仅用于：选中项、弹出菜单、Dialog、Command Palette、浮层。

现状 5 档（`--shadow-xs…xl`）偏重，保留变量但**新组件少用**；浮层用 `--shadow-md`。

---

## 7. 边框系统

低对比度：`--border` 用于分隔，`--border-strong` 用于需强调的边界。禁止「Card 套 Card」多层边框。

---

## 8. 图标规范

无独立图标库 → 内联 SVG，`stroke-width: 1.5`（细线），`size: 16/18/20`。图标按钮**必须**有 `aria-label`。

---

## 9. 组件状态

所有交互组件须定义：`default` · `hover` · `active` · `focus-visible` · `disabled` · `loading` · `error`。

---

## 10. 响应式断点

沿用 Tailwind v4 默认：`sm 640` · `md 768` · `lg 1024` · `xl 1280`。
桌面优先（工作台布局），`<lg` 收起侧栏为 Sheet。

---

## 11. 动效原则

时长 120–220ms；属性限 `opacity` / `transform` / `background-color`；无大面积弹跳；无长入场；`prefers-reduced-motion` 下禁用；不产生布局位移（CLS）。

---

## 12. 深色模式策略

见 §2。切换：`.dark` class（`DarkModeScript` 现有机制保留）。

---

## 13. 可访问性约束

对比度 ≥ 4.5:1（正文）/ 3:1（大字）；焦点环可见；图标按钮有名称；表单有 label；标题层级不跳级；点击区 ≥40px。

---

## 14. 页面密度原则

桌面优先、舒适密度：主面板内容最大宽度约 720–1120px（列表宽、正文窄）；外间距 8–12px；行内元素间距 8–16px。

---

## 15. 文章阅读排版规则

正文宽度 680–760px；字号 ≥16px；行高 1.7–1.9；段落间距 1em；代码块横向滚动不撑破容器；表格移动端可横滚；长链接 `overflow-wrap: anywhere`；图片 `max-width:100%`。
