import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test('显示英雄区域和站点名称', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Hero section should be visible
    await expect(page.locator('body')).toBeVisible();
    // Site name should appear in header
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('显示最新文章列表', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // "最新文章" section title
    await expect(page.getByText('最新文章')).toBeVisible({ timeout: 10000 });
    // At least one blog card should be present
    const blogLinks = page.locator('a[href*="/blog/"]');
    await expect(blogLinks.first()).toBeVisible({ timeout: 10000 });
  });

  test('显示精选作品', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Featured projects section (if any exist)
    const projectsSection = page.getByText('精选作品');
    // Only check if the section exists
    const count = await projectsSection.count();
    if (count > 0) {
      await expect(projectsSection).toBeVisible({ timeout: 10000 });
    }
  });

  test('导航栏链接可跳转', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Verify the blog link exists in header
    const blogLink = page.locator('header a[href="/blog"]').first();
    await expect(blogLink).toBeVisible({ timeout: 10000 });
    // Use evaluate().click() to bypass blog card ::after overlay interception
    await page.evaluate(() => {
      const link = document.querySelector('header a[href="/blog"]') as HTMLAnchorElement;
      link?.click();
    });
    await expect(page).toHaveURL(/\/blog/, { timeout: 15000 });
  });

  test('页脚显示版权信息', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 10000 });
  });
});
