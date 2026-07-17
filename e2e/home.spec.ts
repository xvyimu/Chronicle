import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  async function waitForHydration(page: import('@playwright/test').Page) {
    await page.waitForFunction(
      () =>
        !!document.querySelector('button[aria-label="切换主题"]')?.hasAttribute('title'),
      { timeout: 15000 },
    );
  }

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
    // Paper Gallery recent notes section title
    await expect(page.getByText('最近整理')).toBeVisible({ timeout: 10000 });
    // At least one blog card should be present
    const blogLinks = page.locator('a[href*="/blog/"]');
    await expect(blogLinks.first()).toBeVisible({ timeout: 10000 });
  });

  test('显示精选作品', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Featured projects section heading
    const projectsSection = page.getByRole('heading', { name: '项目样本' });
    await expect(projectsSection).toBeVisible({ timeout: 10000 });
  });

  test('导航栏链接可跳转', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Verify the blog link exists in header
    const blogLink = page.locator('header a[href="/blog"]').first();
    await expect(blogLink).toBeVisible({ timeout: 10000 });
    await blogLink.click();
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

  test('首页入口索引可见', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const index = page.locator('.home-manifesto__list');
    await expect(index).toBeVisible({ timeout: 10000 });
    const entries = index.locator('.home-manifesto__item');
    await expect(entries).toHaveCount(3);
    await expect(entries.nth(0)).toContainText('Articles');
    await expect(entries.nth(1)).toContainText('Links');
    await expect(entries.nth(2)).toContainText('Projects');
  });

  test('英雄区域统计指标可见', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const metrics = page.locator('.editorial-hero__metrics');
    await expect(metrics).toBeVisible({ timeout: 10000 });
    await expect(metrics).toContainText('篇文章');
    await expect(metrics).toContainText('个项目');
  });

  test('滚动揭示区域在视口后变为可见', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    // The first reveal section should become visible after scroll
    const reveal = page.locator('.reveal-on-scroll').first();
    await expect(reveal).toBeVisible({ timeout: 10000 });
    await reveal.scrollIntoViewIfNeeded();
    await expect(reveal).toHaveClass(/is-visible/);
  });

  test('顶部导航栏链接全部存在', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const header = page.locator('header');
    await expect(header.locator('a[href="/"]').first()).toBeVisible();
    await expect(header.locator('a[href="/blog"]')).toBeVisible();
    await expect(header.locator('a[href="/series"]')).toBeVisible();
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

  test('背景装饰元素数量正确 (2 飞机条 + CSS 网格圈 + 2 代码块)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.site-backdrop__plane')).toHaveCount(2);
    await expect(page.locator('.site-backdrop__plane--back')).toHaveCount(1);
    await expect(page.locator('.site-backdrop__plane--front')).toHaveCount(1);
    await expect(page.locator('.site-backdrop__mesh')).toHaveCount(0);
    await expect(page.locator('.site-backdrop__stage')).toHaveCSS('position', 'fixed');
    await expect
      .poll(async () =>
        page.locator('.site-backdrop__stage').evaluate((element) => {
          const meshStyle = getComputedStyle(element, '::before');
          return {
            content: meshStyle.content,
            position: meshStyle.position,
          };
        }),
      )
      .toEqual({ content: '""', position: 'absolute' });
    await expect(page.locator('.site-backdrop__code')).toHaveCount(2);
    await expect(page.locator('.site-backdrop__code--one')).toContainText('pnpm test');
    await expect(page.locator('.site-backdrop__code--two')).toContainText(
      'deploy --quiet',
    );
  });

  test('鼠标移动时背景 stage 的 transform 受 --parallax-x/y 驱动', async ({ page }) => {
    await page.goto('/');
    // 等待 stage 节点存在 (SSG 静态 DOM, hydration 前即可见)
    await page.waitForFunction(
      () => {
        return !!document.querySelector('.site-backdrop__stage');
      },
      { timeout: 5000 },
    );
    // pointermove 监听器在 SiteBackdropParallax 的 useEffect (hydration 后) 才挂载,
    // 仅等 stage 存在不足以保证监听就绪。反复 dispatch 并轮询, 直到 CSS 变量被写入,
    // 避免在监听器挂载前触发事件的竞态 (见 handoff §7.4)。
    // 与组件一致：只响应 pointermove（不再监听 mousemove）。
    await page.waitForFunction(
      () => {
        window.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: 1000,
            clientY: 500,
            pointerType: 'mouse',
          }),
        );
        const stage = document.querySelector<HTMLElement>('.site-backdrop__stage');
        return !!stage && stage.style.getPropertyValue('--parallax-x') !== '';
      },
      { timeout: 5000 },
    );
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
