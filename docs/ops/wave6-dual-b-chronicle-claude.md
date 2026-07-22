# Dual-B · Chronicle · Claude 实现报告

| Field                                           | Value                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| Agent                                           | **claude**                                                                 |
| Wave                                            | Dual-B wave6                                                               |
| Product                                         | Chronicle                                                                  |
| Worktree                                        | `C:\Users\yuanjia\orca\workspaces\Chronicle\dual-b-ch-claude`              |
| Branch                                          | `xvyimu/dual-b-ch-claude`                                                  |
| Tip (session start / still HEAD if uncommitted) | `7810f5feb504479f58a4b3aa64db8b9f0d26ce8b`                                 |
| Dual-A 胜方                                     | Codex · L2                                                                 |
| Scope                                           | ARCHITECTURE_TARGET · THIRD_PARTY/NOTICE · SRI smoke                       |
| Forbidden                                       | push · 生产 cutover · 真 publish 覆盖装机 · 整站重写 · 改生产 `ENABLE_SRI` |

---

## 1. 做了什么

### 1.1 `docs/ARCHITECTURE_TARGET.md`（新建）

- L2 **内容遗留**目标态：维持 Next 16 + React 19 + MDX；不迁 Vue/Go/Python/SQL。
- 巩固 ASIS §7.3 偏离裁定；允许/禁止表；成功标准；GSC/Bing/RUM **manual defer**。
- 与 `ARCHITECTURE_ASIS.md`、SRI ADR、ops 看板互指。

### 1.2 合规：`NOTICE` + `docs/THIRD_PARTY.md`

- 根目录 **`NOTICE`**：产品身份、MIT 指针、第三方服务边界、lockfile 权威声明。
- **`docs/THIRD_PARTY.md`**：直接 prod/dev 依赖 SPDX 摘要 + 刷新命令；全树以 `pnpm licenses list` 为准。
- **未**重写 `LICENSE`（已有 MIT）。

### 1.3 SRI smoke（可本地跑）

- 脚本：`scripts/check-sri-smoke.mjs`
- package script：`pnpm check:sri-smoke`
- **离线默认**：校验 `next.config.ts` 的 `ENABLE_SRI === '1'` 门闩、`sha384`、`sriExperiment` 注入；可选扫描 `.next` HTML。
- **`--live`**：拉取生产首页，要求存在 `integrity="sha384-…"`；CSP 头含 nonce/`strict-dynamic` 提示。
- **`--require-build`**：有本地 build 产物时对 on/off 与 integrity 一致性更严（本波未强制跑全量 `pnpm build`）。
- **不改**生产 env、不改 `next.config` 默认 off 行为。

### 1.4 文档索引微更新

- `docs/overview.md`：链入 ASIS / TARGET / THIRD_PARTY。
- `docs/ARCHITECTURE_ASIS.md`：§9.2 / §11 去掉「TARGET 未写」表述，指向已建 TARGET。

---

## 2. 没做什么

| 项                                   | 原因                                            |
| ------------------------------------ | ----------------------------------------------- |
| 整站重写 / Vue 迁移                  | 题单明确不做；L2 禁止                           |
| 生产 `ENABLE_SRI` / Vercel env 切换  | Dual-B 禁 cutover；生产已有 ADR 证据            |
| 全量 `pnpm build` + e2e 作为本波门禁 | 成本高；SRI 用 config 门闩 + live HTML 证据即可 |
| GSC / Bing 控制台                    | **manual defer**（blocked-human）               |
| `git push` / 开 PR / merge 默认分支  | 共享 preamble 禁止                              |
| 依赖大升级 / audit 修包              | 不在本包范围                                    |

---

## 3. 验证命令 + exit code

在 **本 worktree** 执行（非主 checkout `D:\Chronicle`）。

| #   | Command                                                                                                            | Exit code      | Result                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------- |
| 1   | `pnpm check:sri-smoke`                                                                                             | **0**          | offline gate PASS；无 `.next` 时 skip artifacts                                           |
| 2   | `pnpm check:sri-smoke -- --live`                                                                                   | **0**          | `integrityAttrs=7` · staticScripts≈13 · staticWithIntegrity≈6；CSP nonce + strict-dynamic |
| 3   | `pnpm check:sri-smoke -- --json`                                                                                   | **0**          | JSON `ok: true`                                                                           |
| 4   | 文件存在性：`NOTICE` · `docs/THIRD_PARTY.md` · `docs/ARCHITECTURE_TARGET.md` · `package.json` 含 `check:sri-smoke` | **n/a (true)** | 均存在                                                                                    |

### 3.1 Live 摘录（2026-07-22）

```text
Chronicle SRI smoke
mode: offline+live
PASS  next-config-sri-gate: ENABLE_SRI=1 gate + sha384 + sriExperiment present
PASS  local-build-artifacts: skip (no .next); offline gate-only mode
PASS  live-homepage: https://incca.ccwu.cc/: integrityAttrs=7 staticScripts≈13 staticWithIntegrity≈6
PASS  live-csp-hint: CSP header ok (nonce=true strict-dynamic=true)
SRI_SMOKE_EXIT=0
```

### 3.2 环境注记

- 本机 Node **v24.16.0** vs engines `22.x` → pnpm engine **WARN only**（与 T-CH-001/002 一致）。
- 首次在本 worktree 跑 `pnpm check:sri-smoke` 时触发了依赖安装（worktree 无 `node_modules`）；脚本本身无额外 runtime 依赖（Node 内置 fs/fetch）。

---

## 4. 变更文件清单（相对 tip）

```text
NOTICE                                          (new)
docs/ARCHITECTURE_TARGET.md                     (new)
docs/THIRD_PARTY.md                             (new)
docs/ARCHITECTURE_ASIS.md                       (edit)
docs/overview.md                                (edit)
docs/ops/wave6-dual-b-chronicle-claude.md       (new, this file)
package.json                                    (add check:sri-smoke)
scripts/check-sri-smoke.mjs                     (new)
```

---

## 5. 对侧（Codex）可吸收 3 点（假设）

1. **SRI smoke 分层**：离线只钉 `next.config` 门闩 + 算法，live 才碰生产 HTML——避免 Dual-B 误触全量 build 或改 env。
2. **THIRD_PARTY 双层**：根 `NOTICE` 短声明 + `docs/THIRD_PARTY.md` 直接依赖表；全树明确指向 `pnpm licenses list`，避免假「完整 license dump」。
3. **TARGET 与 ASIS 互指并改掉 ASIS「未写 TARGET」句**：防止评分时读到自相矛盾的测绘收口。

---

## 6. Manual defer（重申）

- P0-GSC / P0-Bing：账号 owner。
- 生产 env 任何 flip：须人授权。
- 可选后续：CI 挂 `pnpm check:sri-smoke`（纯离线）于 quality job——**本波未改 workflow**。

---

## 7. 状态

**Dual-B 实现完成 · 等待总控评分**  
**未 push · 未 merge · 未改生产。**
