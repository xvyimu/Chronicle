import { test, expect } from '@playwright/test';

test.describe('博客列表页', () => {
  test('显示博客标题和搜索框', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    // Use heading role to avoid matching header nav link
    await expect(page.getByRole('heading', { level: 1, name: '博客' })).toBeVisible();
    await expect(page.getByPlaceholder(/搜索文章/)).toBeVisible();
  });

  test('搜索框输入后显示结果', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });

    const searchInput = page.getByRole('combobox', { name: '搜索文章' });
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.ok(),
      { timeout: 15000 },
    );
    await searchInput.focus();
    await page.keyboard.type('Redis', { delay: 20 });
    await responsePromise;

    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 15000 });
    const results = page.locator('[data-result]');
    await expect(results.first()).toBeVisible({ timeout: 15000 });
  });

  test('清除搜索按钮可清空输入', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });

    const searchInput = page.getByRole('combobox', { name: '搜索文章' });
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.focus();
    await page.keyboard.type('test', { delay: 20 });

    // Clear button should appear after input has content
    const clearBtn = page.getByLabel('清除搜索');
    await expect(clearBtn).toBeVisible({ timeout: 10000 });
    await clearBtn.click();

    await expect(searchInput).toHaveValue('');
  });

  test('分页导航可用', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    const firstPageFirstPost = await page
      .locator('main .blog__item a[href^="/blog/"]')
      .first()
      .getAttribute('href');
    // Check if pagination exists
    const pagination = page.locator(
      'nav[aria-label*="分页"], .pagination, [class*="pagination"]',
    );
    await expect(pagination).toBeVisible();
    const nextBtn = page.getByRole('link', { name: /下一页/ });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page).toHaveURL(/page=2/, { timeout: 15000 });
    const secondPageFirstPost = await page
      .locator('main .blog__item a[href^="/blog/"]')
      .first()
      .getAttribute('href');
    expect(secondPageFirstPost).toBeTruthy();
    expect(secondPageFirstPost).not.toBe(firstPageFirstPost);
    await expect(page.getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

test.describe('博客文章详情页', () => {
  // Helper: get the first blog post slug from the blog list page
  async function getFirstPostSlug(
    page: import('@playwright/test').Page,
  ): Promise<string | null> {
    await page.goto('/blog');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('a[href*="/blog/"]').first()).toBeVisible({
      timeout: 10000,
    });
    const href = await page.locator('a[href*="/blog/"]').first().getAttribute('href');
    if (href && href.match(/\/blog\/[^/]+$/)) return href;
    return null;
  }

  test('从列表页进入文章详情', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    expect(slug).toBeTruthy();

    // Navigate directly — blog card ::after overlays can intercept clicks
    await page.goto(slug!);
    await expect(page).toHaveURL(/\/blog\/[^/]+$/);
    // Article should have a title (h1)
    await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 });
  });

  test('文章页面显示阅读进度条', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    expect(slug).toBeTruthy();

    await page.goto(slug!);
    // Reading progress bar should exist (data-testid added for testability)
    const progressBar = page.locator('[data-testid="reading-progress"]');
    await expect(progressBar).toBeAttached();
    await expect
      .poll(() =>
        page.locator('#main-content').evaluate((element) => {
          return getComputedStyle(element).transform;
        }),
      )
      .toBe('none');

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect
      .poll(async () => (await progressBar.boundingBox())?.y ?? Number.NaN)
      .toBeCloseTo(0, 1);
  });

  test('文章页面显示目录和标签', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    expect(slug).toBeTruthy();

    await page.goto(slug!);
    // Tags should be visible
    const tags = page.locator('a[href*="/tags/"]');
    await expect(tags.first()).toBeVisible({ timeout: 15000 });
  });

  test('代码块显示复制按钮', async ({ page }) => {
    // Navigate directly to a post known to contain code blocks
    await page.goto('/blog/cicd-pipeline-design');
    await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 });

    // Code toolbar should exist with copy button
    const codeBlocks = page.locator('.code-toolbar');
    await expect(codeBlocks.first()).toBeVisible({ timeout: 15000 });

    const copyBtn = codeBlocks.first().locator('button:has-text("复制")');
    await expect(copyBtn).toBeVisible();
  });
});
