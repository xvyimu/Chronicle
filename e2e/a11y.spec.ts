import { test, expect, type Page } from '@playwright/test';

/**
 * 可访问性回归门禁（16-audit P1-3 / F9 的零依赖落点）。
 *
 * 覆盖 D-02 修过的两类问题，防止回归：
 *   F1 · 深色/浅色辅助文字对比度跌破 AA
 *   F6 · 移动端点击区小于自家标准（40px）
 *
 * 断言的是**浏览器渲染后的实际计算样式**（getComputedStyle），
 * 而非源码里的 token 字面量——CSS 变量解析、层叠、覆盖都算进去了。
 * 纯函数侧的 token 断言在 `src/lib/contrast.test.ts`；两层互补。
 */

async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () =>
      !!document.querySelector('button[aria-label="切换主题"]')?.hasAttribute('title'),
    { timeout: 15000 },
  );
}

/**
 * 在页面内计算某元素前景/背景的 WCAG 对比度。
 * 背景向上回溯到第一个非透明祖先（CSS 里背景常挂在父容器上）。
 */
async function computedContrast(
  page: Page,
  selector: string,
): Promise<{ ratio: number; fg: string; bg: string }> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`找不到元素 ${sel}`);

    const parseRgb = (s: string): [number, number, number] => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) throw new Error(`无法解析颜色 "${s}"`);
      const [r, g, b] = m[1].split(',').map((x) => parseFloat(x));
      return [r, g, b];
    };
    const lin = (c: number) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    const lum = ([r, g, b]: [number, number, number]) =>
      0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

    const fg = parseRgb(getComputedStyle(el).color);

    // 背景：回溯到第一个非完全透明的祖先
    let node: Element | null = el;
    let bg: [number, number, number] | null = null;
    while (node) {
      const raw = getComputedStyle(node).backgroundColor;
      const m = raw.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map((x) => parseFloat(x));
        const alpha = parts.length === 4 ? parts[3] : 1;
        if (alpha > 0) {
          bg = [parts[0], parts[1], parts[2]];
          break;
        }
      }
      node = node.parentElement;
    }
    if (!bg) throw new Error(`${sel} 找不到不透明背景`);

    const lf = lum(fg);
    const lb = lum(bg);
    const ratio =
      Math.round(((Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)) * 100) / 100;
    return {
      ratio,
      fg: `rgb(${fg.join(',')})`,
      bg: `rgb(${bg.join(',')})`,
    };
  }, selector);
}

const AA_NORMAL = 4.5;

test.describe('对比度 · 浅色主题', () => {
  test.use({ colorScheme: 'light' });

  test('正文与辅助文字达 AA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 正文（文章标题链）
    const body = await computedContrast(page, 'main h1, main h2, main p');
    expect(body.ratio, `正文 ${body.fg} on ${body.bg}`).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

test.describe('对比度 · 深色主题', () => {
  test.use({ colorScheme: 'dark' });

  test('深色下正文与辅助文字达 AA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    const body = await computedContrast(page, 'main h1, main h2, main p');
    expect(body.ratio, `正文 ${body.fg} on ${body.bg}`).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

test.describe('点击区 · 移动端 ≥40px', () => {
  // 点击区标准只适用于移动端（docs/11-accessibility.md「移动端点击区 ≥40px」），
  // 断点见 home.css `@media (max-width: 767px)`；桌面视口下热门主题项为 32px，属预期。
  // 只设 viewport（不带 devices 的 defaultBrowserType，否则 describe 组内 use 报错）。
  test.use({ viewport: { width: 393, height: 851 } });

  test('首页热门主题项点击区达 40px', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const item = page.locator('.ws-topics__item').first();
    await expect(item).toBeVisible({ timeout: 10000 });

    const box = await item.boundingBox();
    expect(box, '热门主题项应有可见盒模型').not.toBeNull();
    expect(box!.height, '移动端热门主题项高度应 ≥40px').toBeGreaterThanOrEqual(40);
  });

  test('归档时间线入口点击区达 40px', async ({ page }) => {
    await page.goto('/archive', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.archive-timeline')).toBeVisible({ timeout: 10000 });

    // 取归档列表里可见链接的最小高度：任一条目跌破 40px 即红。
    const minHeight = await page.evaluate(() => {
      const links = Array.from(
        document.querySelectorAll('.archive-timeline a[href]'),
      ).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (links.length === 0) return Infinity;
      return Math.min(...links.map((el) => el.getBoundingClientRect().height));
    });

    expect(minHeight, '归档条目点击区应 ≥40px').toBeGreaterThanOrEqual(40);
  });
});
