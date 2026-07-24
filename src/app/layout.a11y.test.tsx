import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Layout a11y smoke contracts (static source checks).
 * Avoids rendering full RootLayout (fonts / RSC / headers).
 * Complements Header/Footer/ThemeToggle/BackToTop unit tests.
 */
const layoutSrc = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
const baseCss = readFileSync(join(process.cwd(), 'src/app/styles/base.css'), 'utf8');

describe('Root layout a11y smoke contracts', () => {
  it('exposes a skip link targeting #main-content', () => {
    expect(layoutSrc).toMatch(/href=["']#main-content["']/);
    expect(layoutSrc).toMatch(/className=["']skip-link["']/);
    expect(layoutSrc).toMatch(/跳到主要内容/);
    expect(layoutSrc).toMatch(/id=["']main-content["']/);
    expect(layoutSrc).toMatch(/<main\b[^>]*id=["']main-content["']/);
  });

  it('declares document language zh-CN', () => {
    expect(layoutSrc).toMatch(/lang=["']zh-CN["']/);
  });

  it('keeps skip-link focus styles (focus + focus-visible)', () => {
    expect(baseCss).toMatch(/\.skip-link:focus/);
    expect(baseCss).toMatch(/\.skip-link:focus-visible/);
  });
});
