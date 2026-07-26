# M-CH-perf-residual · 收口证据

- **日期：** 2026-07-26
- **分支 / wt：** `xvyimu/ch-opt-perf-residual` · this worktree
- **base tip：** master `1f52af9`
- **当前 tip：** `2052db8`
- **本波约束：** 不 push master · 不放宽 CSP · 不动 pending long-wave feature 文件

---

## 1. 实现：切片 S1 — `images.qualities` 显式声明

**commit：** `2052db8`

**改动：** `next.config.ts` 1 文件 +8/-1

- 添加 `images.qualities: [65, 70, 75]`
- 原因：Next 16 默认 `qualities: [75]`。EditorialHero 使用 `quality={70}`（master）和 `quality={65}`（pending W2 `xvyimu/ch-cwv-home` 未合）。非白名单 quality 值在 `/_next/image` optimizer 端被拒绝（400），导致浏览器回退到未优化的 298 KB PNG 源，LCP 直接坏死。
- 此修与 11 个 pending long-wave 分支 **正交**（仅 `next.config.ts` 单文件，无冲突占位）。

**门闩验证：**

| 命令             | exit  | 摘录                        |
| ---------------- | ----- | --------------------------- |
| `pnpm typecheck` | **0** | `tsc --noEmit` 全绿         |
| `pnpm test`      | **0** | 749 items / 98 files · 全绿 |

---

## 2. 审计结果：无可安全自动修项（不含 S1 之外）

**已做（long-wave 已合入 master 的 perf 项）：**

| 债                                               | 状态               |
| ------------------------------------------------ | ------------------ |
| CH-PERF-001 css-route-split                      | `f406a21` **DONE** |
| CH-PERF-002 font-subset                          | `b088d38` **DONE** |
| CH-PERF-003 home-lcp                             | `75502ce` **DONE** |
| CH-PERF-004 csp-structure                        | `038764f` **DONE** |
| CH-PERF-005 article-mdx / CH-PERF-009 images-mdx | `791cf29` **DONE** |
| CH-PERF-006 client-trim                          | `5d5fe87` **DONE** |
| CH-PERF-007 links-payload                        | `b875f2d` **DONE** |
| CH-PERF-008 search-edge                          | `3b64203` **DONE** |

**已做（long-wave 已合入 master 的集成项）：**

| 集成                                 | tip       |
| ------------------------------------ | --------- |
| integrate: xvyimu/ch-perf-links      | `1f52af9` |
| integrate: xvyimu/ch-perf-images-mdx | `c5a2a22` |
| integrate: xvyimu/ch-perf-search-api | `bec6aad` |
| integrate: xvyimu/ch-perf-cwv-home   | `74e3a57` |
| integrate: xvyimu/ch-perf-rsc-nav    | `e83e243` |
| integrate: xvyimu/ch-perf-font       | `ae8c8ac` |
| integrate: xvyimu/ch-perf-css-route  | `a2529eb` |
| integrate: xvyimu/ch-perf-csp-guard  | `8b463e9` |
| integrate: xvyimu/ch-perf-scout      | `624daa4` |

**待合（已推 origin 等人 ff，本波不碰）：** 11 支，见 `WEEK-BACKLOG.md`/`INTEGRATE.md`。

**残余债单（P2/P3，本波审后判「不可安全自动修」）：**

| id          | 模块                          | 路径                               | 优先级      | 无法本波修的原因                         |
| ----------- | ----------------------------- | ---------------------------------- | ----------- | ---------------------------------------- |
| CR-003      | CWV 验证                      | 全站                               | P1 residual | 需 integrate 后 LH/RUM（人 gate）        |
| CR-004      | MDX/Shiki                     | `MdxContent.tsx`                   | P1 residual | 同 W3 待合，需 merge 后 LCP 对比         |
| CR-005      | `/links`                      | `LinksDirectory`                   | P1 residual | 同 W3 待合，需 merge 后 LH 复测          |
| CH-PERF-010 | content-pipeline 醒目化       | `build-content-snapshot.ts` / docs | P2          | W7 分支 `679959a` 已有完整改进，待合     |
| CH-PERF-011 | CI budget 刷新                | `check-bundle-budget.ts` / CI      | P2          | 需 Node 22 clean `pnpm build` 后刷新数字 |
| CH-PERF-012 | RUM 回填                      | `performance-baseline.md`          | P2          | 需人授权 VERCEL_TOKEN                    |
| CR-013      | `check:ops-readiness` 不进 CI | `ci.yml`                           | P2          | CI 改需人确认                            |
| CH-PERF-014 | view-transition 回归          | `next.config.ts`                   | P3          | 无 e2e 回归，本波不碰                    |

**明确不做的原因：**

- **e2e flake 守卫（W9）：** `e2e/navigation.spec.ts` 的 2 处 `waitForTimeout` 已由 `xvyimu/ch-test-flake-guard` (`0108740`) 修好，待合本波后自动化解。本波重复修会与 W9 冲突。
- **EditorialHero `preload` prop 清理：** W2 分支 `xvyimu/ch-cwv-home` 已全套改完（含 `aspectRatio` / `HERO_QUALITY` / `sizes` 优化），待合。本波修会冲突。
- **Lighthouse / bundle 数字：** 本机 Node 24（engines 22.x），包不对齐 CI 环境。跑出数字不可作权威基线。

---

## 3. 命令日志

```bash
# 基线
pnpm typecheck     # exit 0
pnpm test          # exit 0 (749/749)

# 切片 1 验证
pnpm typecheck     # exit 0
pnpm test          # exit 0 (749/749)

# 提交
git add next.config.ts
git commit -m "perf(images): declare images.qualities for Next 16 optimizer (M-CH-perf-residual)"
```

---

## 4. 未做列表

- [ ] `git push origin master` — 禁止
- [ ] 放宽 CSP — 禁止
- [ ] 引入第二框架 — 禁止
- [ ] 大重构整站 — 禁止
- [ ] 动其他仓 — 禁止
- [ ] 编造 Lighthouse 分数 — 未测，如实写「未测」
- [ ] 换 fuse / 开 RUM / 开全站 SSG — 禁止
