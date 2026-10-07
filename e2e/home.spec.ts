import { test, expect } from '@playwright/test';

test.describe('首页（工作台）', () => {
  async function waitForHydration(page: import('@playwright/test').Page) {
    await page.waitForFunction(
      () =>
        !!document.querySelector('button[aria-label="切换主题"]')?.hasAttribute('title'),
      { timeout: 15000 },
    );
  }

  test('显示工作台欢迎区与站点名称', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.workspace-home')).toBeVisible();
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('显示热门主题', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: '热门主题' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('.ws-topics__item').first()).toBeVisible();
  });

  test('显示最近更新文章列表', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: '最近更新' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('a[href*="/blog/"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('顶部栏显示品牌与搜索入口', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const header = page.locator('header');
    await expect(header.locator('a[href="/"]').first()).toBeVisible();
    await expect(header.getByLabel('前往搜索')).toBeVisible();
  });

  test('左侧栏导航链接存在（桌面）', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar.locator('a[href="/blog"]')).toBeAttached();
    await expect(sidebar.locator('a[href="/archive"]')).toBeAttached();
    await expect(sidebar.locator('a[href="/favorites"]')).toBeAttached();
    // 已删路由不得出现
    await expect(sidebar.locator('a[href="/garden"]')).toHaveCount(0);
    await expect(sidebar.locator('a[href="/links"]')).toHaveCount(0);
  });

  test('页脚显示版权信息', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('footer')).toBeVisible({ timeout: 10000 });
  });

  test('站内搜索：输入后显示结果（客户端）', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

    const input = page.getByLabel('搜索文章');
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.focus();
    await page.keyboard.type('安全', { delay: 20 });

    await expect(page.locator('.search-panel__item').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('站内搜索：无结果显示空态', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

    const input = page.getByLabel('搜索文章');
    await input.focus();
    await page.keyboard.type('zzz不存在的关键词zzz', { delay: 5 });
    await expect(page.getByText(/没有找到匹配/)).toBeVisible({ timeout: 10000 });
  });

  test('站内搜索：查询写入 URL', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

    const input = page.getByLabel('搜索文章');
    await input.focus();
    await page.keyboard.type('安全', { delay: 20 });
    await expect(page).toHaveURL(/[?&]q=/, { timeout: 10000 });
  });

  test('全站背景 stage 容器在 SSG HTML 中已渲染', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const stage = page.locator('.site-backdrop__stage');
    await expect(stage).toHaveCount(1);
    await expect(stage).toHaveAttribute('aria-hidden', 'true');
  });

  test('首页隐藏装饰背景层（工作台干净阅读面）', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // D-016：首页 `body:has(.workspace-home) .site-backdrop__stage { display: none }`
    await expect(page.locator('.site-backdrop__stage')).toBeHidden();
  });

  test('prefers-reduced-motion 下不挂载视差监听', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const stage = page.locator('.site-backdrop__stage');
    await expect(stage).toBeAttached();
    const vp = page.viewportSize();
    if (vp) await page.mouse.move(vp.width, vp.height);
    const vars = await stage.evaluate((el) => {
      const style = el as HTMLElement;
      return {
        x: style.style.getPropertyValue('--parallax-x'),
        y: style.style.getPropertyValue('--parallax-y'),
      };
    });
    expect(vars.x).toBe('');
    expect(vars.y).toBe('');
    await context.close();
  });
});
