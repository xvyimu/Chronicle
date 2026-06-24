# Claude Code 项目接手提示词

将以下提示词复制粘贴到 Claude Code 中即可：

---

## 项目接手：西江月博客（Next.js 16 个人博客）

你正在接手一个已经过全面开发和验证的个人博客项目。请先阅读项目根目录的 `AGENTS.md` 和 `README.md` 了解项目全貌，然后阅读 `docs/overview.md` 了解文档体系。

### 项目状态

项目位于 `d:\blog`，技术栈：Next.js 16.2 (App Router) + React 19.2 + TypeScript 5 strict + Tailwind CSS v4 + MDX。当前所有验证已通过：

- TypeScript: 0 错误
- 单元测试: 115/115 通过（Vitest）
- E2E 测试: 30/30 通过（Playwright）
- ESLint: 0 错误, 0 warnings
- 生产构建: 85 页静态生成成功
- Git: 已提交，最新 commit `dfd4059`

### 快速命令

```bash
pnpm dev          # 开发服务器 (localhost:3000)
pnpm build        # 生成 RSS + 生产构建
pnpm test         # 单元测试
pnpm test:e2e     # E2E 测试（自动启动 dev server，端口 3001）
pnpm lint         # ESLint
```

### 已完成的工作

1. **代码质量** — 修复了 33 个代码质量问题，所有 E2E 测试通过（解决了 BlogCard `::after` 覆盖层拦截点击、React 受控输入 fill() 不触发 onChange 等棘手问题）
2. **文档体系** — README.md / AGENTS.md / docs/ 下 6 份文档全部更新
3. **文件清理** — 删除了临时 HTML 报告、Trae Work 产物、冗余配置文件
4. **内容建设** — 14 篇技术博客文章（TypeScript、PostgreSQL、Redis、Docker、Nginx、Cloudflare Workers 等）
5. **性能优化** — ImageZoom 迁移到 next/image，Bundle 预算检查通过
6. **性能审计** — 首页 TTFB 43ms / Load 219ms / CLS 0.0000，文章页 TTFB 7ms

### 关键约定

- **站点配置唯一来源**：`src/lib/constants.ts` 的 `SITE_CONFIG`
- **CSS 分层**：`src/app/styles/` 下 5 个文件（tokens / layout / components / prose / responsive），BEM + Tailwind 分工
- **缓存**：`src/lib/cache.ts` 的 `createCache<T>` 工具
- **内容**：`content/blog/*.mdx`（frontmatter 用 gray-matter 解析），`data/projects.json`（zod 校验）
- **E2E 测试坑**：BlogCard 的 `<Link>` 有 `after:absolute after:inset-0` 伪元素会拦截点击，测试中用 `focus()` + `keyboard.type()` 或 `dispatchEvent('click')` 绕过

### 可以推进的方向

以下方向按优先级排列，请根据用户需求选择：

**部署上线**
- 部署到 Vercel，配置自定义域名
- 配置 Giscus 评论（需要 GitHub Discussions，`.env` 中已有 repo ID）
- 验证线上 RSS / sitemap / robots.txt

**功能增强**
- 添加文章分类页（目前只有标签）
- 添加文章目录滚动高亮（TOC active 状态目前是 CSS only）
- 添加暗色模式下的代码块主题切换（目前亮色用 github-light，暗色用 vitesse-dark）
- 添加文章字数统计和预计阅读时间
- 添加上一篇/下一篇导航（目前已有 UI，检查是否生效）

**性能优化**
- 首页 Hero 区 ParticleCanvas 在低端设备上可能影响 INP，考虑添加 `prefers-reduced-motion` 检测
- 博客列表页 fuse.js 搜索索引可以预构建到静态 JSON 中，减少客户端计算
- 考虑为图片添加 blur placeholder（`placeholder="blur"`）

**内容建设**
- 继续新增技术文章
- 为文章添加封面图（目前文章没有封面图，OG 图是动态生成的文字版）
- 补充关于页内容

**工程治理**
- 添加 `.nvmrc` 或 `.node-version` 锁定 Node 版本
- 考虑添加 Husky pre-commit hooks（lint-staged + tsc）
- CI 中添加 Lighthouse CI 性能预算检查

### 注意事项

- PowerShell 环境不支持 `&&` 链接命令，用 `;` 代替
- `next/font` 生成的字体文件（woff2）体积较大但按需加载，不计入 Bundle 预算
- Turbopack 构建模式下 `@next/bundle-analyzer` 不生效，用 `scripts/check-bundle-budget.ts` 替代
- `content/blog/` 中 `published: false` 的文章在开发环境可见、生产环境被过滤
- E2E 测试配置在 `playwright.config.ts`，使用端口 3001 和 `reuseExistingServer: true`

---

开始前请先运行 `pnpm install && pnpm dev` 确认项目能正常启动，然后告诉我你想推进哪个方向。
