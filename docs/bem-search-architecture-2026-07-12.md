# BEM 卫生与服务端搜索方案 · 2026-07-12

> 状态：已实施的历史方案。当前 API 契约见 `docs/API.md`，当前待办见根 `TODO.md`。

路径：`D:\blog` · 域名：`https://incca.ccwu.cc` · 角色：前端架构 / 搜索优化

---

## 0. 结论（先读）

| 命题                  | 本站事实                                                                                                                                                | 最优处置                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 「全量 CSS BEM 重写」 | **已是 BEM 主结构**（`.header__*` / `.search-bar__*` / `.reading-prefs__*` / `.blog__*` / `.prose`…），约 17 模块 ~3.8k 行，与 Paper Gallery token 绑定 | **不做**视觉等价全量重写；做**卫生与映射文档**，只清死代码/双轨残留             |
| 「服务端搜索瓶颈」    | **无**服务端搜索引擎；原先是客户端 Fuse + 整表 `PostMeta[]` 进 RSC payload                                                                              | **做**轻量 `GET /api/search` + 共享 Fuse 配置；**不上** ES/Meili/Algolia        |
| 内容规模              | **~14** 篇 MDX                                                                                                                                          | 全量内存索引足够；SWR 缓存 60s；响应为 `SearchResultItem` 投影（无 searchText） |

验收目标：搜索结果与原先权重一致；`/blog` 不再嵌入全站文章索引；视觉与交互（`?q=` / Ctrl+K / 高亮）保持。

---

## 1. 现状审查

### 1.1 CSS / BEM

```
src/app/styles/
  tokens.css          设计 token + @theme
  base.css            header/footer/skip-link/icon-btn
  components.css      通用 section/card
  controls.css        cta / pagination / tag-link
  search-ui.css       search-bar / results popover
  blog-ui.css / article-ui.css / prose.css / archive.css
  home*.css / links.css / responsive.css / animations.css / backdrop.css
```

选择器形态以 **Block__Element--Modifier** 为主，辅以 `[data-slot]`（shadcn）与少量 utility。  
**不是**「无结构 class 堆砌」；全量 BEM→utility 会破坏 Paper Gallery 纸感与大量 CSS 回归，ROI 为负。

### 1.2 搜索链路（改造前）

```
blog/page.tsx  getAllPosts() ──posts prop──► SearchBar (client)
                                              └─ useFuseSearch (dynamic fuse.js)
```

- 优点：零 RTT、匹配高亮完整
- 代价：列表页 RSC 序列化**全站** `PostMeta`（含 `searchText`/`headings`）

### 1.3 搜索链路（改造后）

```
blog/page.tsx  仅分页列表
SearchBar() ──debounce 180ms──► GET /api/search?q=&limit=
                                  └─ getAllPosts() + searchPostsCached (Fuse)
                                  └─ Cache-Control: s-maxage=60, swr=300

测试 / 可选嵌入：SearchBar posts={…} 仍走客户端 Fuse（同一 FUSE_SEARCH_OPTIONS）
```

共享源：`src/lib/search/{options,engine,types}.ts`

---

## 2. BEM 方案：卫生而非重写

### 2.1 原则

1. **视觉守恒**：不改 spacing/radius/token 语义。
2. **双轨只留一轨**：交互控件走 shadcn；布局/排版保留 BEM。
3. **映射表驱动**：新组件先查表，禁止发明第三套命名。
4. **全量 rewrite 闸门**：仅当出现「同一视觉 ≥3 套 class」且有回归预算时再开专项。

### 2.2 命名与模块映射

| 域   | Block                                                 | 模块文件               | shadcn 对应       |
| ---- | ----------------------------------------------------- | ---------------------- | ----------------- |
| 壳   | `header` / `footer` / `skip-link`                     | `base.css`             | Sheet（移动 nav） |
| 分区 | `section`                                             | `components.css`       | —                 |
| 搜索 | `search-bar` / `search-results-popover` / `search-hl` | `search-ui.css`        | Input / Button    |
| 阅读 | `reading-prefs`                                       | `article-ui.css`       | Popover / Button  |
| 列表 | `blog` / `pagination` / `tag-link`                    | `blog-ui` / `controls` | Button / Badge    |
| 正文 | `prose` / `article`                                   | `prose` / `article-ui` | —                 |
| 首页 | `hero` / home sections                                | `home*.css`            | Button `size=cta` |
| 收藏 | `links`                                               | `links.css`            | Input / Button    |
| CTA  | `[data-slot=button][data-size=cta]`                   | `controls.css`         | Button            |

### 2.3 本轮 BEM 动作清单

| ID  | 动作                                          | 状态            |
| --- | --------------------------------------------- | --------------- |
| B1  | 文档化映射（本文件）                          | ✅              |
| B2  | 禁止新增业务 `.btn`（已清零）                 | ✅ 既有         |
| B3  | 全量 BEM→Tailwind 重写                        | ❌ **明确不做** |
| B4  | `icon-btn` 收进 Button `size=icon-toolbar`    | ✅ P7           |
| B5  | search-ui padding 吃进 Input `size=search`    | ✅ P7           |
| B6  | 项目图预生成 blur data URL（`pnpm gen:blur`） | ✅ P7           |

### 2.4 回滚

BEM 本轮**无**大规模 class 改名 → 无 class 级回滚包。  
若误触样式，以 `git revert` 单 commit 即可。

---

## 3. 服务端搜索方案

### 3.1 选型对比

| 方案                          | 延迟 / 运维 | 适配 ~14 文 | 结论                   |
| ----------------------------- | ----------- | ----------- | ---------------------- |
| Elasticsearch / OpenSearch    | 高运维      | 过重        | ❌                     |
| Meilisearch / Typesense       | 中          | 过重        | ❌                     |
| Algolia                       | 成本/外传   | 可          | ❌ 个人站不必          |
| 构建期 JSON + 静态文件        | 低          | 可          | 备选；dev mtime 需重建 |
| **Route Handler + 内存 Fuse** | 极低        | **最优**    | ✅ 本轮                |

### 3.2 API 契约

```
GET /api/search?q={string}&limit={1..20}

200 {
  query: string,
  results: Array<{ item: SearchResultItem, matches: SearchMatch[], score?: number }>,
  total: number,
  source: "server"
}

400 { error, code: "QUERY_TOO_LONG" }
429 { error, code: "RATE_LIMITED" }  // 进程内 60/min/IP
```

- `SearchResultItem`：展示字段投影（无 `searchText` / `headings` / `wordCount`）
- 权重：与客户端同一 `FUSE_SEARCH_OPTIONS`
- 缓存：`public, s-maxage=60, stale-while-revalidate=300`
- 实现：`src/app/api/search/route.ts` + `searchPostsCached` + `rate-limit.ts`
- `runtime = 'nodejs'`

### 3.3 客户端策略

| 场景          | 路径                                              |
| ------------- | ------------------------------------------------- |
| 生产 `/blog`  | `SearchBar` 无 posts → `useServerSearch`          |
| 单测 / 故事书 | `SearchBar posts={mock}` → `useFuseSearch`        |
| URL           | 仍 `history.replaceState` 写 `?q=`；popstate 回填 |

### 3.4 性能预期

| 指标             | 改造前          | 改造后                                   |
| ---------------- | --------------- | ---------------------------------------- |
| `/blog` 嵌入索引 | 全站 PostMeta   | **0**                                    |
| 首击搜索 RTT     | 0（本地）       | ~debounce 180ms + 同区 API（CDN 可命中） |
| 匹配质量         | Fuse 权重       | **相同 options**                         |
| 冷启动           | 加载 fuse chunk | API 进程内 fuse + 可选缓存               |

### 3.5 回滚

1. `blog/page.tsx` 恢复 `<SearchBar posts={getAllPosts()} />`
2. 可选删除 `api/search`（客户端路径不依赖它）
3. `useServerSearch` 可留作死代码或一并 revert

---

## 4. 分阶段落地

| 阶段         | 内容                              | 验证             |
| ------------ | --------------------------------- | ---------------- |
| P0 审查      | 本文件 §1                         | —                |
| P1 共享核心  | `src/lib/search/*`                | unit             |
| P2 API       | `GET /api/search`                 | unit + 手工 curl |
| P3 接线      | SearchBar 双路径；blog 页去 posts | unit + e2e       |
| P4 文档/TODO | 本方案 + TODO Future 勾选         | —                |
| P5（不做）   | ES / 全量 BEM rewrite             | —                |

---

## 5. 验收清单

- [x] `FUSE_SEARCH_OPTIONS` 单源（lib/search）
- [x] `GET /api/search` 200/400 + Cache-Control
- [x] `/blog` 不传 posts
- [x] 客户端仍支持 `posts` 嵌入（测试不回归）
- [x] `?q=` / Ctrl+K / 高亮 / 键盘导航保留
- [x] 方案文档含映射、选型、回滚
- [x] 全量门禁：`pnpm test` 569 ✅ · typecheck ✅ · lint ✅ · build 94 routes（含 `/api/search`）✅ · e2e blog+mobile **12/12**（`CI=1` production start）✅

### 怎么验

```powershell
cd D:\blog
pnpm test
pnpm typecheck
pnpm lint
pnpm build
# 手工
# curl "http://localhost:3000/api/search?q=Redis"
# 浏览器 /blog 输入 Redis，Network 见 /api/search；URL 带 ?q=
pnpm test:e2e
```

---

## 6. 附件 · 对比摘要

| 维度         | 审计前    | 本轮后                     |
| ------------ | --------- | -------------------------- |
| 搜索执行位置 | 仅浏览器  | 服务端默认 + 客户端可选    |
| 索引载体     | RSC props | `getAllPosts()` 服务端缓存 |
| BEM          | 已 BEM    | 卫生文档；无破坏性 rename  |
| 外部依赖新增 | —         | **0**（仍 fuse.js）        |

---

_对应实现提交信息见 git log；与 `docs/frontend-ui-optimization-report-2026-07-12.md`（P4/P5 shadcn）互补。_
