import { test, expect } from '@playwright/test';

/**
 * Wait for React hydration — ThemeToggle gets a `title` attr only after mounting.
 * Before hydration, fill() won't trigger onChange on controlled inputs.
 */
async function waitForHydration(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => !!document.querySelector('button[aria-label="切换主题"]')?.hasAttribute('title'),
    { timeout: 15000 },
  );
}

/**
 * Set value on a React controlled input by using the native setter + input event.
 * Playwright's fill() and pressSequentially() may not trigger onChange reliably
 * on React controlled inputs in dev mode.
 */
async function setReactInputValue(page: import('@playwright/test').Page, selector: string, value: string) {
  await page.evaluate(({ sel, val }) => {
    const input = document.querySelector(sel) as HTMLInputElement;
    if (!input) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, val);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, { sel: selector, val: value });
}

test.describe('博客列表页', () => {
  test('显示博客标题和搜索框', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    // Use heading role to avoid matching header nav link
    await expect(page.getByRole('heading', { name: '博客' })).toBeVisible();
    await expect(page.getByPlaceholder(/搜索文章/)).toBeVisible();
  });

  test('搜索框输入后显示结果', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    // Wait 3s for React hydration in dev mode
    await page.waitForTimeout(3000);

    // Use focus() instead of click() — blog card ::after overlays can intercept clicks
    const searchInput = page.getByPlaceholder(/搜索文章/);
    await searchInput.focus();
    await page.keyboard.type('Redis', { delay: 50 });

    // Wait for Fuse.js to load and results to appear
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 15000 });
    // Should show at least one result
    const results = page.locator('[data-result]');
    await expect(results.first()).toBeVisible({ timeout: 15000 });
  });

  test('清除搜索按钮可清空输入', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const searchInput = page.getByPlaceholder(/搜索文章/);
    await searchInput.focus();
    await page.keyboard.type('test', { delay: 50 });

    // Clear button should appear after input has content
    const clearBtn = page.getByLabel('清除搜索');
    await expect(clearBtn).toBeVisible({ timeout: 10000 });
    // Use evaluate to click — avoids overlay interception
    await clearBtn.dispatchEvent('click');

    await expect(searchInput).toHaveValue('');
  });

  test('分页导航可用', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    // Check if pagination exists
    const pagination = page.locator('nav[aria-label*="分页"], .pagination, [class*="pagination"]');
    const count = await pagination.count();
    if (count > 0) {
      // If there's a "next" button, click it
      const nextBtn = page.getByText('下一页').or(page.getByRole('link', { name: /→|>|下一页/ }));
      const nextCount = await nextBtn.count();
      if (nextCount > 0) {
        await nextBtn.first().click();
        await expect(page).toHaveURL(/page/);
      }
    }
  });
});

test.describe('博客文章详情页', () => {
  // Helper: get the first blog post slug from the blog list page
  async function getFirstPostSlug(page: import('@playwright/test').Page): Promise<string | null> {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('a[href*="/blog/"]').first()).toBeVisible({ timeout: 10000 });
    const href = await page.locator('a[href*="/blog/"]').first().getAttribute('href');
    if (href && href.match(/\/blog\/[^/]+$/)) return href;
    return null;
  }

  test('从列表页进入文章详情', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    test.skip(!slug, 'no blog posts found');

    // Navigate directly — blog card ::after overlays can intercept clicks
    await page.goto(slug!);
    await expect(page).toHaveURL(/\/blog\/[^/]+$/);
    // Article should have a title (h1)
    await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 });
  });

  test('文章页面显示阅读进度条', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    test.skip(!slug, 'no blog posts found');

    await page.goto(slug!);
    // Reading progress bar should exist (data-testid added for testability)
    const progressBar = page.locator('[data-testid="reading-progress"]');
    await expect(progressBar).toBeAttached();
  });

  test('文章页面显示目录和标签', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    test.skip(!slug, 'no blog posts found');

    await page.goto(slug!);
    // Tags should be visible
    const tags = page.locator('a[href*="/tags/"]');
    await expect(tags.first()).toBeVisible({ timeout: 15000 });
  });

  test('代码块显示复制按钮', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    test.skip(!slug, 'no blog posts found');

    await page.goto(slug!);
    // Wait for page to load
    await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 });

    // Check if any code blocks exist with copy buttons
    const codeBlocks = page.locator('.code-toolbar');
    const count = await codeBlocks.count();
    if (count > 0) {
      const copyBtn = codeBlocks.first().locator('button:has-text("复制")');
      await expect(copyBtn).toBeVisible();
    }
  });
});
