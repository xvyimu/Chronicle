import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Stryker 专用 vitest 配置。
 *
 * 为什么不复用 vitest.config.ts：
 *   Stryker 把仓库复制进 .stryker-tmp/sandbox-* 后运行 vitest。sandbox 内
 *   node_modules 是符号链接，pnpm 的嵌套依赖布局使 vitest 无法解析 jsdom
 *   环境包，于是 src/app 下 15 个组件/路由测试全部报
 *   `Cannot find environment for .../page.test.tsx`，dry-run 直接崩，
 *   拿不到任何变异分数。
 *
 * 解法不是修 sandbox，而是缩小运行面：`stryker.config.mjs` 的 mutate 范围
 * 本来就只有 `src/lib/**`，运行 src/app 的组件测试对变异评分没有贡献。
 * 实测 src/lib 下 37 个测试文件对 document / window / render 的依赖为 0，
 * 因此这里用 environment: 'node' 并只 include lib 测试 —— 既绕开 jsdom
 * 解析问题，也让 dry-run 更快。
 *
 * 注意：不加载 vitest.setup.ts（它引用 @testing-library/jest-dom 与
 * window.matchMedia，node 环境下会直接抛错）。lib 测试不需要这些垫片。
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/lib/**/*.test.ts', 'src/lib/**/__tests__/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      // 这两个 spec 在 sandbox 内必然失败，且对变异评分无贡献：
      //   check-doc-links-script —— 用 execFileSync 跑 `pnpm check:docs`，
      //     sandbox 里没有 pnpm 的 workspace 上下文，命令直接非零退出，
      //     导致 Stryker 判定「initial test run 有失败」而整轮中止。
      //   它们测的是 npm script 接线与 CLI 退出码，属集成面，
      //   由 `pnpm test`（完整 vitest 配置）覆盖，不该进变异循环。
      'src/lib/check-doc-links-script.test.ts',
    ],
    // Stryker 自己解析报告，无需 html reporter
    reporters: ['default'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
