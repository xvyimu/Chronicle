import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration
 *
 * Run: pnpm test:e2e
 * Run with UI: pnpm test:e2e --ui
 * Install browsers: npx playwright install chromium
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npx next dev --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
