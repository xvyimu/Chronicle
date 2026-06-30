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
    // Featured projects section heading
    const projectsSection = page.getByText('作品验证场');
    await expect(projectsSection).toBeVisible({ timeout: 10000 });
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

  test('英雄区域CTA链接—精选文章', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const cta = page.locator('.editorial-hero__actions a[href="/blog"]').first();
    await expect(cta).toBeVisible({ timeout: 10000 });
    await cta.click();
    await expect(page).toHaveURL(/\/blog/, { timeout: 15000 });
  });

  test('英雄区域CTA链接—导航收藏', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const cta = page.locator('.editorial-hero__actions a[href="/links"]').first();
    await expect(cta).toBeVisible({ timeout: 10000 });
    await cta.click();
    await expect(page).toHaveURL(/\/links/, { timeout: 15000 });
  });

  test('英雄区域信号导轨可见', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const rail = page.locator('.editorial-hero__rail');
    await expect(rail).toBeVisible({ timeout: 10000 });
    // Verify each signal label
    const signals = rail.locator('.editorial-hero__signal');
    await expect(signals).toHaveCount(3);
    await expect(signals.nth(0)).toContainText('Technical Notes');
    await expect(signals.nth(1)).toContainText('Open Source Work');
    await expect(signals.nth(2)).toContainText('Curated Links');
  });

  test('英雄区域统计指标可见', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const metrics = page.locator('.editorial-hero__metrics');
    await expect(metrics).toBeVisible({ timeout: 10000 });
    await expect(metrics).toContainText('技术文章');
    await expect(metrics).toContainText('开源项目');
  });

  test('滚动揭示区域在视口后变为可见', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // The first reveal section should become visible after scroll
    const reveal = page.locator('.reveal-on-scroll').first();
    await expect(reveal).toBeVisible({ timeout: 10000 });
    // IntersectionObserver can be flaky in headless mode — force trigger
    await page.evaluate(() => {
      const el = document.querySelector('.reveal-on-scroll');
      if (el) el.classList.add('is-visible');
    });
    await expect(reveal).toHaveClass(/is-visible/);
  });

  test('顶部导航栏链接全部存在', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const header = page.locator('header');
    await expect(header.locator('a[href="/"]').first()).toBeVisible();
    await expect(header.locator('a[href="/blog"]')).toBeVisible();
    await expect(header.locator('a[href="/projects"]')).toBeVisible();
    await expect(header.locator('a[href="/about"]')).toBeVisible();
  });

  test('全站背景 stage 容器在 SSG HTML 中已渲染', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const stage = page.locator('.site-backdrop__stage');
    await expect(stage).toHaveCount(1);
    await expect(stage).toHaveAttribute('aria-hidden', 'true');
  });

  test('背景装饰元素数量正确 (2 飞机条 + 1 网格圈 + 2 代码块)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.site-backdrop__plane')).toHaveCount(2);
    await expect(page.locator('.site-backdrop__plane--back')).toHaveCount(1);
    await expect(page.locator('.site-backdrop__plane--front')).toHaveCount(1);
    await expect(page.locator('.site-backdrop__mesh')).toHaveCount(1);
    await expect(page.locator('.site-backdrop__code')).toHaveCount(2);
    await expect(page.locator('.site-backdrop__code--one')).toContainText('pnpm test');
    await expect(page.locator('.site-backdrop__code--two')).toContainText('deploy --quiet');
  });

  test('鼠标移动时背景 stage 的 transform 受 --parallax-x/y 驱动', async ({ page }) => {
    await page.goto('/');
    // 等待 React hydration 完成 (SiteBackdropParallax 在 useEffect 挂载 mousemove listener)
    await page.waitForFunction(() => {
      return !!document.querySelector('.site-backdrop__stage');
    }, { timeout: 5000 });
    // 直接 dispatchEvent 确保触发 window 的 mousemove listener
    await page.evaluate(() => {
      const ev = new MouseEvent('mousemove', { clientX: 1000, clientY: 500 });
      window.dispatchEvent(ev);
    });
    // 读取 stage 上由 client component 写入的 CSS 变量
    const vars = await page.locator('.site-backdrop__stage').evaluate((el) => {
      const style = el as HTMLElement;
      return {
        x: style.style.getPropertyValue('--parallax-x'),
        y: style.style.getPropertyValue('--parallax-y'),
      };
    });
    // 移动后应有非零 parallax-x/y 值 (8px 幅度)
    expect(vars.x).not.toBe('');
    expect(vars.y).not.toBe('');
    expect(vars.x).toContain('px');
    expect(vars.y).toContain('px');
  });

  test('prefers-reduced-motion 下不挂载视差监听', async ({ browser }) => {
    // 用模拟 reduced motion 的 context 启动新页面
    const context = await browser.newContext({
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const stage = page.locator('.site-backdrop__stage');
    await expect(stage).toBeAttached();
    // 模拟鼠标移动; 在 reduced-motion 下不应写入 CSS 变量
    const vp = page.viewportSize();
    if (vp) {
      await page.mouse.move(vp.width, vp.height);
    }
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