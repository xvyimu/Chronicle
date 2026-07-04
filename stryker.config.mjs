/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
const config = {
  packageManager: 'pnpm',
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
    // 关闭 related-file 模式：不少测试通过 barrel 间接 import source
    related: false,
  },
  coverageAnalysis: 'perTest',
  mutate: [
    'src/lib/*.ts',
    'src/lib/**/*.ts',
    '!src/lib/**/*.test.ts',
    '!src/lib/**/__tests__/**',
  ],
  reporters: ['progress', 'html'],
  htmlReporter: {
    fileName: 'stryker-report',
  },
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  concurrency: 2,
  timeoutMS: 30000,
};

export default config;
