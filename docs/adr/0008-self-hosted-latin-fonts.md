# ADR-0008 · 拉丁字体自托管、中文走系统字体栈

- **状态**：Accepted（2026-10-07）
- **决策**：拉丁字体（JetBrains Mono、Cormorant Garamond）改用 `next/font/local` 自托管；中文正文改用系统字体栈，不再下载 webfont。
- **关联**：`src/app/layout.tsx` · `src/app/fonts/` · `docs/13-risk-register.md` R15

---

## 背景

`src/app/layout.tsx` 此前用 `next/font/google` 引入三个字族（Noto Sans SC / JetBrains Mono / Cormorant Garamond）。该 API 在**构建期**从 `fonts.googleapis.com` / `fonts.gstatic.com` 下载字体文件，Next 据此生成虚拟模块 `@vercel/turbopack-next/internal/font/google/font`。

2026-10-07 合并 PR #37 时观察到**间歇性构建失败**：

```
Error: Turbopack build failed with 12 errors:
Error: Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
```

同一 commit、同一 lockfile，CI 一次 fail 一次 pass；本地 `pnpm build` 恒 exit 0。对照记录：

| 时间  | commit    | 环境              | 结果     |
| ----- | --------- | ----------------- | -------- |
| 07:03 | `913c8cf` | Vercel Production | **fail** |
| 07:07 | `c4055c8` | Vercel Preview    | success  |
| 07:08 | `1cb676a` | Vercel Preview    | success  |
| 07:54 | `fe834e3` | Vercel Preview    | **fail** |

后果不止 CI 红：`913c8cf` 的 Production 部署失败，**生产站点仍跑重构前版本**（实测首页仍含 `home-paper` / `Paper Gallery`）。

## 可选方案

| 方案                            | 改动量                | 仓体积       | 稳定性     | 视觉         |
| ------------------------------- | --------------------- | ------------ | ---------- | ------------ |
| **A 全自托管**                  | 搬 112 个 woff2       | **+4.43 MB** | 完全离线   | 各平台一致   |
| **B 拉丁自托管 + 中文系统字体** | 3 个 TTF（192 KB）    | +192 KB      | 完全离线   | 中文随 OS 变 |
| C 加字体缓存                    | 改 CI / `next.config` | 0            | 仍依赖网络 | 不变         |

方案 A 的实测数据：`Noto Sans SC` 被 Google 切成 **101 个 woff2 分片、4.29 MB**（按 unicode-range 切片，浏览器按页面用字按需下载）。JetBrains Mono 6 片 + Cormorant Garamond 5 片，共 11 个文件 140 KB。

## 决策

采用 **B**。

理由：

1. **A 的 4.43 MB 换来的只是「各平台字形完全一致」**，而中文用系统字体是中文站的常见做法。
2. 中文那条 `font-family` 原本就有 `system-ui, sans-serif` 兜底，去掉 webfont 只是让系统字体提前生效，**不需要改任何 CSS**。
3. 拉丁字体只 3 个文件 192 KB，一次到位、彻底断外网依赖。
4. 选 TTF 而非 woff2 分片：文件少（3 vs 11）、代码简洁（3 个 `localFont` 调用 vs 11 个 + unicode-range 处理），代价仅多 52 KB。本机无 woff2 压缩工具（`pyftsubset` / `woff2_compress` 均缺），无法自行压缩。

具体实现：

- `src/app/fonts/` 放 3 个 TTF（`jetbrains-mono-400/700`、`cormorant-garamond-500`），来源 Google Fonts **v1 API**（旧 UA 请求返回单一 TTF，不做 unicode-range 切片）
- `layout.tsx` 用 `next/font/local`，保留原有 `variable` / `display` / `preload` / `adjustFontFallback` 语义
- `body` 的 `font-family` 改为 `system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`

## 后果

- **构建不再依赖外网**：断网构建（`HTTPS_PROXY=http://127.0.0.1:9` 强制失败）实测 exit 0
- 构建产物无 `fonts.googleapis` / `fonts.gstatic` 引用；3 个 TTF 打进 `.next/static/media/`
- 中文渲染随访客操作系统变化（Windows 微软雅黑 / macOS 苹方 / Android 思源黑体）——**有意的取舍**
- 字体升级需手动重搬 3 个 TTF
- 页面 HTML 体积略减（不再注入 Google 的 `@font-face` 分片规则）

## 复查触发条件

- 若要求「各平台字形完全一致」→ 回到方案 A（全自托管，代价 +4.43 MB）
- 若中文系统字体栈在某平台出现明显缺陷 → 评估自托管中文子集
- 字体升级时复核 `src/app/fonts/` 与 `layout.tsx` 的 weight/style 声明
