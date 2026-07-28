# Chronicle（西江月）· 结构化架构设计（v2）

| 项         | 值                                                      |
| ---------- | ------------------------------------------------------- |
| 产品       | 个人博客 + 作品集 Web                                   |
| GitHub     | [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle) |
| 路径       | `D:\projects\Chronicle` · https://incca.ccwu.cc         |
| 文档版本   | **v2 · 2026-07-29**                                     |
| **栈权威** | **[`PROJECT.md`](./PROJECT.md)**                        |
| 许可       | MIT                                                     |

> 方法：[arc42](https://docs.arc42.org/home/) · [C4](https://c4model.com/) · 组合优化说明

---

## 0. 五问

| #        | 答                                                               |
| -------- | ---------------------------------------------------------------- |
| 是什么？ | MDX 驱动的个人博客/作品集站点                                    |
| 为谁？   | 读者 · 作者本人                                                  |
| 不做？   | 运行时 DB 内容源 · 第二前端 · 桌面壳 · 放宽 CSP 换 SSG           |
| 验收？   | typecheck · vitest · playwright · content:verify · LH desktop CI |
| 协作？   | 公有 · Issue/PR                                                  |

---

## 1. 背景与目标

本地 MDX → snapshot → Vercel；安全上 **CSP nonce** 优先于激进全站 SSG。

| 质量属性 | 表述                                   | 验证                     |
| -------- | -------------------------------------- | ------------------------ |
| 完整性   | 生产内容=提交快照                      | content:verify           |
| 安全     | CSP nonce 不默认 unsafe-inline         | 构建/抽查                |
| 性能     | desktop LH error 门；bundle 预算可断言 | CI · check-bundle-budget |
| SEO      | 元数据/RSS/OG                          | SEO 门 · 人工            |

**软 residual：** mobile LH 非 error CI；RUM p75 人闸回填（组件已接线）。

---

## 2. 总体架构（C4）

### Context

```text
 [读者] → Vercel 上的 Chronicle
 [作者] → git 写 MDX → CI → 部署
```

### Container

```text
 content/**  --build-->  generated/content-snapshot/
                              │
                              ▼
                     Next 16 App Router
                     React19 + TW v4 + CSS modules
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
           页面/RSC      /api/search        GHA+Vercel
                           (fuse)
```

---

## 3. 选型理由

| 选                | 因             | 不选             |
| ----------------- | -------------- | ---------------- |
| Next16            | SEO+MDX+Vercel | Remix/Astro 平行 |
| 本地 MDX+snapshot | 无 DB 运维     | 运行时 CMS       |
| CSP nonce         | 安全边界       | 为缓存牺牲 CSP   |
| fuse 搜索         | 个人站足够     | 重型搜索集群 v1  |

---

## 4. 核心模块

| 模块       | 要点                             |
| ---------- | -------------------------------- |
| 内容管线   | content:build/verify fail-closed |
| 页面 IA    | 博文/作品/关于/链接              |
| search API | 生产 fuse                        |
| 预算       | evaluateBudgets 可单测           |
| 观测       | Analytics/SI；p75 表 pending     |

---

## 5. 资产复用

MDX 文库、样式体系、GHA+Vercel、LH 脚本 —— 在现栈内演进；禁止无 ADR 换框架。

---

## 6. 信任边界与风险

| 边界        | 风险        | 缓解                    |
| ----------- | ----------- | ----------------------- |
| 构建机→生产 | 快照漂移    | verify + 提交快照       |
| 脚本 CSP    | XSS         | nonce · 禁止随意 inline |
| 第三方评论  | Giscus 供应 | env 可关                |
| mobile/RUM  | 误当硬门    | residual 板分级         |

---

## 7. 14 天计划

| 日    | 主题          | DoD                 |
| ----- | ------------- | ------------------- |
| 1–2   | 文档          | 与 residual 板互链  |
| 3–4   | 内容卫生      | content:verify      |
| 5–6   | 预算/a11y     | vitest · docs       |
| 7–8   | mobile 探针   | lh:mobile 本地两次  |
| 9–10  | RUM           | 人闸有样本才写数字  |
| 11–14 | 写作迭代+收口 | CI 绿 · 人闸 master |

---

## 8. 验收命令（L4）

| 命令                           | 用途           |
| ------------------------------ | -------------- |
| `pnpm typecheck`               | 类型           |
| `pnpm test`                    | vitest         |
| `pnpm content:verify`          | 快照           |
| `pnpm test:e2e` / CI LH        | e2e+desktop LH |
| `pnpm exec` bundle budget 脚本 | 体积           |

---

## 9. 相关文档

`PROJECT.md` · `architecture.md` · `performance-baseline.md` · `ops/ch-rum-ci-residual-board-2026-07-28.md`

---

_v2 · 2026-07-29_
