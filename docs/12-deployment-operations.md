# 12 · 部署与运维

> 状态：Draft（Iteration 00）
> 日期：2026-10-06

---

## 部署形态

| 项       | 值                                                     |
| -------- | ------------------------------------------------------ |
| 平台     | Vercel                                                 |
| 触发     | push `master` → GitHub Actions quality → deploy        |
| 构建命令 | `pnpm build`（含 RSS + 内容快照 + next build）         |
| 必需 env | `NEXT_PUBLIC_SITE_URL`（生产 `https://incca.ccwu.cc`） |
| Node     | `engines: >=24`（Vercel 侧需对齐，**待确认**）         |

## CI（`.github/workflows/ci.yml`）

现状：lint / test / tsc / build / bundle-budget / e2e。

**注意**：CI 钉 Node 22（与 `engines >=24` 的差异待核）。本轮**不修改 CI**（属 Ask-first），如需调整单独评估。

## 环境变量

| 变量                           | 用途                 | 状态                   |
| ------------------------------ | -------------------- | ---------------------- |
| `NEXT_PUBLIC_SITE_URL`         | 站点 URL（必需）     | 保留                   |
| `NEXT_PUBLIC_GISCUS_*`（3 项） | Giscus 评论          | **已删功能，env 待清** |
| `ENABLE_SRI`                   | SRI 门闩（ADR-0005） | 保留                   |
| `CONTENT_BACKEND`              | `fs` / `snapshot`    | 保留                   |

## 密钥

- 不修改部署环境密钥（用户硬约束）。
- 不自动上传/修改/删除线上数据。

## 回滚

- 分支并行；master 不动。
- Vercel 侧可回滚到上一个部署。
- 快照变更可 git revert。

## 运维脚本

`scripts/check-ops-readiness.ts` · `scripts/check-production-content.ts`（需线上）。

## 待确认

- Vercel Node 版本与 `engines >=24` 的一致性。
- Giscus env 清理时机（代码已删，env 留着无害）。
