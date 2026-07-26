# Chronicle · M-CH2-a11y-budget-doc 证据 · 2026-07-26

> **波次：** `ch-opt-a11y-budget-doc`（WAVE-2）  
> **仓：** `xvyimu/Chronicle` · **worktree:** `ch-opt-a11y-budget-doc`  
> **分支：** `xvyimu/ch-opt-a11y-budget-doc` · **base:** `master` tip `1f52af9`  
> **Author:** xvyimu

---

## 1. 做了什么

### 1.1 已读文档

| 文档 | 路径 | 用途 |
|---|---|---|
| PROJECT.md | `docs/PROJECT.md` | 产品形态与技术栈 SSOT |
| 性能预算表 | `docs/ops/perf-budget-2026-07.md` | 路由预算、CWV 目标、可跑 check |
| 性能基线 | `docs/performance-baseline.md` | LH 历史分数、RUM pending 状态 |
| Lighthouse 配置 | `lighthouse.config.js` | Desktop CI 断言阈值 |
| Lighthouse mobile 配置 | `lighthouse.mobile.config.js` | 手动基线 |
| 静态体积预算 | `scripts/check-bundle-budget.ts` | 单文件 + 总额预算 |
| CI 工作流 | `.github/workflows/ci.yml` | 质量门结构 |
| 运营门禁表 | `docs/ops/ops-checklist-2026-07.md` | 各门禁状态 |
| Wave 实现报告 | `docs/ops/w1-arch-upgrade-*.md` 等 | 历史波次记录 |
| 安全/SRI 索引 | `docs/ops/ch-security-deps-index.md` | 参考索引格式 |

### 1.2 新建文档

| 文件 | 说明 |
|---|---|
| `docs/ops/ch-a11y-budget-index-2026-07-26.md` | 无障碍门禁现状、LH 预算（CWV 目标 + 静态体积）、RUM 数据面、CI 对齐表 |
| `docs/ops/ch-perf-doc-index-2026-07-26.md` | 本仓所有性能相关文档的导航目录索引 |
| `docs/ops/ch-opt-a11y-budget-doc-evidence-2026-07-26.md` | 本文 |

### 1.3 关键发现摘要

**无障碍（a11y）：**
- 唯一自动化门禁：Lighthouse CI `categories:accessibility ≥ 0.90`（desktop/error 级）
- 无 axe/pa11y/独立 a11y 测试脚本
- 无 Playwright a11y 断言
- Mobile a11y 为 `warn` 级，不进 CI

**Lighthouse 预算：**
- 所有预算内联于 `lighthouse.config.js` 断言，无独立 `lighthouse-budget.json`
- LCP ≤ 3500 ms、CLS ≤ 0.15（lab）、TBT ≤ 300 ms
- 全 error 级阻断 `deploy`（无软性 budget）
- 5 核心路由共享同一阈值，无路由级差异化

**RUM：**
- 未接入 web-vitals / Vercel Speed Insights / Sentry / GA
- 字段 p75 标记为 `pending`（需人账号 / 生产流量样本）
- 下半年 backlog B2

**CI 对齐：**
- quality + e2e 双 job 硬性阻断，deploy 依赖两者均通过
- 唯一软性缺口：mobile Lighthouse 不进 CI、RUM 无数据面

---

## 2. 验证命令

```bash
# 确认文件存在
ls -la docs/ops/ch-a11y-budget-index-2026-07-26.md docs/ops/ch-perf-doc-index-2026-07-26.md docs/ops/ch-opt-a11y-budget-doc-evidence-2026-07-26.md

# 确认分支结构
git log --oneline master..HEAD
```

---

## 3. 未做列表

| 项 | 原因 |
|---|---|
| 改 app 源码 / tests / next.config | 栈纪律：本波仅文档 |
| 编造 Lighthouse 分数 / a11y 分数 | 无跑则记「未测」 |
| push master | 栈纪律：总控合入 |
| 动首波 `ch-opt-perf-residual` 目录 | 路径正交 |
| 安装 axe / pa11y / web-vitals 包 | 本波不写代码 |
| 创建 `lighthouse-budget.json` | 建议初值已记入索引，实际文件需下一波创建 |
| 接入 RUM 数据面 | 需人账号 / Vercel token（下半年 B2） |
| 执行 `pnpm build` 或 LH CI 本地跑 | 本波不生产构建产物 |

---

## 4. 提交记录

```text
docs(ops): CH a11y+budget+RUM index + perf doc index (WAVE-2)

- docs/ops/ch-a11y-budget-index-2026-07-26.md: a11y 门禁、LH 预算、RUM 数据面、CI 对齐表
- docs/ops/ch-perf-doc-index-2026-07-26.md: 性能文档导航目录索引
- docs/ops/ch-opt-a11y-budget-doc-evidence-2026-07-26.md: 本波证据
```

---

## 5. 验收

- [x] 3 篇 docs commit
- [x] `git log master..HEAD` 至少 1 commit
- [x] 打印 DONE