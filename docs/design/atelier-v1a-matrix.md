# V1a · Chronicle × Atelier 差异矩阵

**日期：** 2026-07-23  
**仓 tip 基线：** `8a5be5c`  
**强度：** **A0/A1 only**（无 A2 霓虹 / 无自定义光标 / 无 View Transitions 全站）  
**SSOT：** `D:\orca\.planning\portfolio-visual-fluent-glass-2026-07-23\atelier-token-ssot.md`  
**skill：** frontend-ui-engineering + `references/react-next.md`  
**栈：** Next 16 · React 19 · Tailwind 4 · BEM `src/app/styles/*`（**不换栈**）

---

## Design Read

> 个人博客 + 作品集 · Paper Gallery（鼠尾草 + 纸感）· redesign **preserve 品牌** · 对齐 Atelier **节奏/半径/壳层 blur/签名习惯**，非 MindSync 侧栏复制。

| Dial     | 值                                    |
| -------- | ------------------------------------- |
| VARIANCE | 5                                     |
| MOTION   | 3（沿用 animations + reduced-motion） |
| DENSITY  | 4–5                                   |

---

## 1. 现状 vs 目标

| 维          | Chronicle 现状 (`tokens.css`)           | Atelier SSOT          | V1a 裁决                                                               |
| ----------- | --------------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| 品牌主色    | `--brand` 鼠尾草 `#59756d`              | CTA 橙 `#f97316`      | **保留鼠尾草为 brand/primary**；橙仅 `--cta` 附加（链接强调/稀有按钮） |
| 画布        | 暖纸 `#f1f0eb`                          | 冷灰 slate 系         | **保留纸感**（产品身份）                                               |
| 主字        | `#242827`                               | slate ink             | 保留；对比已达标                                                       |
| 间距        | 4/8/**12**/16/**20**/24/32/**40/48/64** | **仅** 4/8/16/24/32   | 新代码只用合法阶；**legacy 别名保留** 防大面积回流；文档标 deprecated  |
| 圆角        | 14 / 10 / 6                             | 8 / 4                 | **收到** md=8 · sm=8 · xs=4（卡/控件）                                 |
| Header 霜   | blur **18px**                           | chrome ≤12            | **12px**                                                               |
| 阴影        | 多层 8–80px                             | 轻 1–2px + 可选 panel | 保留 sm 以下；不在本波砍光 md/lg（卡片依赖）                           |
| 左轨签名    | 无                                      | 3px CTA→primary       | Header 底或品牌字可选 2–3px brand 渐变条（克制）                       |
| 字体        | Cormorant 展示 + Noto                   | 系统/IBM              | **保留** 展示 serif（博客身份；非 AI 默认 Inter）                      |
| 动效        | reveal + reduced-motion                 | A0/A1                 | 不升级 A2                                                              |
| CSP / nonce | layout `getCspNonce`                    | —                     | **本波零改** proxy/CSP                                                 |

---

## 2. 本波文件范围

| 做                                                            | 不做                        |
| ------------------------------------------------------------- | --------------------------- |
| `src/app/styles/tokens.css` 半径 + space 注释/alias + `--cta` | 换框架 / 换 MDX 管线        |
| `base.css` header blur 18→12；可选顶轨                        | 重写 home IA / hero 文案    |
| `docs/design/atelier-v1a-matrix.md`（本文件）                 | 生产 env · js-yaml5 major   |
| `docs/css-conventions.md` 令牌表补一行                        | 六仓齐开 · A2 snippets 全局 |

---

## 3. 验收

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test` exit 0
- [ ] 视觉：圆角更利落、顶栏更清晰；纸感/鼠尾草仍在
- [ ] 无 CSP/中间件 diff
- [ ] progress `V1a_CH` → `done` 或 `in_progress`

---

## 4. 回滚

```text
git revert <v1a-commit>
# 或
git checkout HEAD~1 -- src/app/styles/tokens.css src/app/styles/base.css
```

---

## 5. 后续（非本波）

- 新组件禁用 `--space-3:12` / `--space-5:20` 等 legacy
- 首页 hero 可选 A1 密度 polish
- A2 仅 sandbox（radical playbook）
