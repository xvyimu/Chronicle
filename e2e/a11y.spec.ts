import { test, expect, type Page } from '@playwright/test';
import { contrastRatioRgb, AA_NORMAL } from '../src/lib/contrast';

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
 * 取某元素渲染后的前景/背景 RGB 分量（在浏览器里跑）。
 * 背景向上回溯到第一个非透明祖先（CSS 背景常挂在父容器上）。
 *
 * 只做「解析 computed style」这件事；WCAG 数学复用 `src/lib/contrast.ts`，
 * 不在 e2e 里重写一份（page.evaluate 无法 import，故返回分量交 Node 侧算）。
 */
async function renderedRgb(
  page: Page,
  selector: string,
): Promise<{
  fg: { r: number; g: number; b: number };
  bg: { r: number; g: number; b: number };
}> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`找不到元素 ${sel}`);

    const toRgb = (s: string) => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) throw new Error(`无法解析颜色 "${s}"`);
      const [r, g, b] = m[1].split(',').map((x) => parseFloat(x));
      return { r, g, b };
    };

    const fg = toRgb(getComputedStyle(el).color);

    // 背景：回溯到第一个非完全透明的祖先
    let node: Element | null = el;
    let bg: { r: number; g: number; b: number } | null = null;
    while (node) {
      const raw = getComputedStyle(node).backgroundColor;
      const m = raw.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map((x) => parseFloat(x));
        const alpha = parts.length === 4 ? parts[3] : 1;
        if (alpha > 0) {
          bg = { r: parts[0], g: parts[1], b: parts[2] };
          break;
        }
      }
      node = node.parentElement;
    }
    if (!bg) throw new Error(`${sel} 找不到不透明背景`);

    return { fg, bg };
  }, selector);
}

/** 便捷封装：取渲染后的 RGB 并算对比度。 */
async function computedContrast(page: Page, selector: string): Promise<number> {
  const { fg, bg } = await renderedRgb(page, selector);
  return contrastRatioRgb(fg, bg);
}

test.describe('对比度 · 浅色主题', () => {
  test.use({ colorScheme: 'light' });

  test('正文与辅助文字达 AA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 正文（文章标题链）
    const ratio = await computedContrast(page, 'main h1, main h2, main p');
    expect(ratio, '正文对比度').toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

test.describe('对比度 · 深色主题', () => {
  test.use({ colorScheme: 'dark' });

  test('深色下正文与辅助文字达 AA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    const ratio = await computedContrast(page, 'main h1, main h2, main p');
    expect(ratio, '深色正文对比度').toBeGreaterThanOrEqual(AA_NORMAL);
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
