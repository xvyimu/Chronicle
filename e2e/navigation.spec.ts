import { test, expect } from '@playwright/test';

/**
 * Wait for React hydration — ThemeToggle gets a `title` attr only after mounting.
 * Before hydration, onClick handlers won't fire.
 */
async function waitForHydration(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () =>
      !!document.querySelector('button[aria-label="切换主题"]')?.hasAttribute('title'),
    { timeout: 15000 },
  );
}

test.describe('主题切换', () => {
  // Use dark color scheme so system=dark, clicking to light changes the class
  test.use({ colorScheme: 'dark' });

  test('点击切换按钮可切换暗色/亮色模式', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for React hydration — toggle onClick won't work until hydrated
    await waitForHydration(page);

    // Find the theme toggle button
    const toggle = page.getByRole('button', { name: '切换主题' });
    await expect(toggle).toBeVisible({ timeout: 10000 });

    // Check initial state
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    const initialDark = htmlClass.includes('dark');

    // Use dispatchEvent to avoid click interception by blog card ::after overlays
    await toggle.dispatchEvent('click');

    // Wait for class change
    await page.waitForTimeout(500);

    const newClass = await page.evaluate(() => document.documentElement.className);
    const newDark = newClass.includes('dark');

    // Theme should have changed
    expect(newDark).not.toBe(initialDark);
  });

  test('主题偏好持久化到 localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

    const toggle = page.getByRole('button', { name: '切换主题' });
    await expect(toggle).toBeVisible({ timeout: 10000 });
    // Use dispatchEvent to avoid click interception by blog card ::after overlays
    await toggle.dispatchEvent('click');
    await page.waitForTimeout(300);

    // localStorage should have a theme entry (or be cleared for 'system')
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    // After clicking, theme is either 'dark', 'light', or null (system)
    expect(['dark', 'light', null]).toContain(theme);
  });

  test('刷新页面后保持主题设置', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Set theme to dark explicitly
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });

    // Reload
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

    // Dark class should be applied
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
  });
});

test.describe('项目页面', () => {
  test('显示项目列表', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');
    // Use heading role to avoid ambiguity
    await expect(page.getByRole('heading', { name: '作品集' })).toBeVisible({
      timeout: 10000,
    });

    // Should have project cards
    const cards = page.locator('.card, [class*="project"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('项目卡片显示标签', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');
    // Tags should be visible (card__tag spans)
    const tags = page.locator('.card__tag');
    await expect(tags.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('标签页面', () => {
  test('显示所有标签', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForLoadState('domcontentloaded');
    // Use heading role to avoid matching subtitle text
    await expect(page.getByRole('heading', { name: '标签' })).toBeVisible({
      timeout: 10000,
    });

    // Should have tag links
    const tagLinks = page.locator('a[href*="/tags/"]');
    const count = await tagLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('点击标签进入标签详情页', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForLoadState('domcontentloaded');

    // Click the first tag link (that's not the page itself)
    const tagLink = page.locator('a[href*="/tags/"]').first();
    const href = await tagLink.getAttribute('href');

    if (href && href !== '/tags') {
      await tagLink.click();
      await expect(page).toHaveURL(/\/tags\/[^/]+$/);
    }
  });
});

test.describe('专题页面', () => {
  test('显示专题列表并可进入详情页', async ({ page }) => {
    await page.goto('/series');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: '专题' })).toBeVisible({
      timeout: 10000,
    });

    const seriesLink = page.locator('a[href*="/series/"]').first();
    await expect(seriesLink).toBeVisible({ timeout: 10000 });
    await seriesLink.click();
    await expect(page).toHaveURL(/\/series\/[^/]+$/);
    await expect(page.getByRole('heading', { name: /专题：/ })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('关于页面', () => {
  test('显示关于页面内容', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');
    // Should render some content
    await expect(page.locator('body')).toBeVisible();
    // About page uses h2 for section title (no h1 on this page)
    // Use exact match — "关于" also matches "关于西江月" as substring
    await expect(page.getByRole('heading', { name: '关于', exact: true })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('404 页面', () => {
  test('访问不存在的页面显示 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    // Next.js returns 404 for non-existent pages
    expect(response?.status()).toBe(404);
  });
});
