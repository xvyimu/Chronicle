import { describe, expect, it } from 'vitest';

import {
  BUDGETS,
  TOTAL_BUDGET_KB,
  evaluateBudgets,
  isFontAsset,
  type StaticAsset,
} from '../../scripts/check-bundle-budget';

describe('bundle budget evaluation', () => {
  it('passes when every asset is within its per-file and total budget', () => {
    const assets: StaticAsset[] = [
      { name: '.next/static/chunks/main.js', kb: 222 },
      { name: '.next/static/css/app.css', kb: 181 },
    ];
    const result = evaluateBudgets(assets);
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.totalKB).toBeCloseTo(403);
  });

  it('flags a single JS chunk over the 300 KB per-file budget', () => {
    const assets: StaticAsset[] = [{ name: '.next/static/chunks/huge.js', kb: 512 }];
    const result = evaluateBudgets(assets);
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes('[BUDGET EXCEEDED]'))).toBe(true);
    expect(result.violations.some((v) => v.includes('huge.js'))).toBe(true);
  });

  it('flags a single CSS bundle over the 300 KB per-file budget', () => {
    const assets: StaticAsset[] = [{ name: '.next/static/css/shiki.css', kb: 400 }];
    const result = evaluateBudgets(assets);
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes('shiki.css'))).toBe(true);
  });

  it('flags total JS+CSS output over the 2 MB budget', () => {
    // 10 chunks × 250 KB = 2500 KB > 2048 KB, none individually over 300 KB.
    const assets: StaticAsset[] = Array.from({ length: 10 }, (_, i) => ({
      name: `.next/static/chunks/chunk-${i}.js`,
      kb: 250,
    }));
    const result = evaluateBudgets(assets);
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes('[TOTAL EXCEEDED]'))).toBe(true);
  });

  it('excludes font assets from the total budget', () => {
    const assets: StaticAsset[] = [
      { name: '.next/static/chunks/main.js', kb: 100 },
      { name: '.next/static/media/font.woff2', kb: 5000 },
    ];
    const result = evaluateBudgets(assets);
    expect(result.passed).toBe(true);
    expect(result.totalKB).toBeCloseTo(100);
  });

  it('recognizes font assets by media dir and woff/woff2 extension', () => {
    expect(isFontAsset('.next/static/media/x.woff2')).toBe(true);
    expect(isFontAsset('.next/static/media/x.bin')).toBe(true);
    expect(isFontAsset('.next/static/fonts/x.woff')).toBe(true);
    expect(isFontAsset('.next/static/chunks/x.js')).toBe(false);
  });

  it('keeps the documented budget thresholds stable', () => {
    expect(TOTAL_BUDGET_KB).toBe(2048);
    expect(BUDGETS.find((b) => b.prefix === 'chunks/')?.maxSingleKB).toBe(300);
    expect(BUDGETS.find((b) => b.prefix === 'css')?.maxSingleKB).toBe(300);
  });
});
