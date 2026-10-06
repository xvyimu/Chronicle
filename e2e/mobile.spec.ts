import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const widths = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

async function getFirstPostHref(page: import('@playwright/test').Page) {
  await page.goto('/blog', { waitUntil: 'domcontentloaded' });
  const firstPost = page.locator('main a[href^="/blog/"]').first();
  await expect(firstPost).toBeVisible({ timeout: 10000 });
  return firstPost.getAttribute('href');
}

test.describe('mobile critical flows', () => {
  test('keeps header navigation accessible on a mobile viewport', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });

    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Mobile nav lives in a Sheet; open the menu before asserting links.
    const menuBtn = page.getByRole('button', { name: /打开菜单|关闭菜单/ });
    await expect(menuBtn).toBeVisible({ timeout: 10000 });
    await menuBtn.click();

    const mobileNav = page.locator('#mobile-nav');
    await expect(mobileNav).toBeVisible({ timeout: 10000 });
    const firstLink = mobileNav.locator('a').first();
    await expect(firstLink).toBeFocused();
    await expect(mobileNav.locator('a[href="/blog"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(mobileNav.locator('a[href="/blog"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/archive"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/projects"]')).toBeVisible();
    // 已删路由不得出现
    await expect(mobileNav.locator('a[href="/links"]')).toHaveCount(0);
    await expect(mobileNav.locator('a[href="/garden"]')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test('supports mobile site search without layout overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 客户端搜索：无需等待网络响应，等待 hydration 后输入即可。
    const searchInput = page.getByLabel('搜索文章');
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.focus();
    await page.keyboard.type('安全', { delay: 20 });

    await expect(page.locator('.search-panel__item').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/[?&]q=/);
    await expectNoHorizontalOverflow(page);
  });

  test('renders article reading UI on mobile', async ({ page }) => {
    const href = await getFirstPostHref(page);
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="reading-progress"]')).toBeAttached();
    await expectNoHorizontalOverflow(page);
  });

  test('renders the archive timeline on mobile', async ({ page }) => {
    await page.goto('/archive', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.archive-timeline')).toBeVisible({ timeout: 10000 });
    await expectNoHorizontalOverflow(page);
  });

  test('applies the project title responsive size at runtime', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    const firstProject = page.locator('a[href^="/projects/"]').first();
    await expect(firstProject).toBeVisible({ timeout: 10000 });
    const href = await firstProject.getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    const title = page.locator('.project-detail__title');
    await expect(title).toBeVisible({ timeout: 10000 });
    await expectNoHorizontalOverflow(page);
  });
});
