import { describe, expect, it } from 'vitest';

import {
  BUDGETS,
  ROUTE_BUDGET_EXEMPT,
  ROUTE_BUDGET_KB,
  TOTAL_BUDGET_KB,
  evaluateBudgets,
  evaluateRouteBudgets,
  isFontAsset,
  parseClientReferenceManifest,
  type RouteAssets,
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

describe('per-route bundle budget', () => {
  const route = (routePath: string, kb: number): RouteAssets => ({
    routePath,
    manifestKey: `${routePath}/page`,
    kb,
  });

  it('passes when every route is under the cap', () => {
    const result = evaluateRouteBudgets([route('/blog/[slug]', 248), route('/', 230)]);
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('flags the route that crosses the cap and names it', () => {
    const result = evaluateRouteBudgets([route('/blog/[slug]', 400)]);
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toContain('[ROUTE EXCEEDED]');
    expect(result.violations[0]).toContain('/blog/[slug]');
    expect(result.violations[0]).toContain('400.0 KB');
  });

  it('reports every over-budget route, not just the first', () => {
    const result = evaluateRouteBudgets([route('/a', 300), route('/b', 310)]);
    expect(result.violations).toHaveLength(2);
  });

  it('skips exempt routes so _global-error does not false-positive', () => {
    const exemptKey = [...ROUTE_BUDGET_EXEMPT][0];
    const globalError: RouteAssets = {
      routePath: '/_global-error',
      manifestKey: exemptKey,
      kb: 9999,
    };
    const result = evaluateRouteBudgets([globalError]);
    expect(result.passed).toBe(true);
  });

  it('accepts an explicit budget lower than the constant', () => {
    const result = evaluateRouteBudgets([route('/x', 250)], 200);
    expect(result.passed).toBe(false);
  });

  it('keeps the documented route budget stable', () => {
    expect(ROUTE_BUDGET_KB).toBe(285);
  });
});

describe('parseClientReferenceManifest', () => {
  it('extracts the route key and the entry file maps', () => {
    const source = [
      'globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};',
      'globalThis.__RSC_MANIFEST["/blog/page"] = {"moduleLoading":{"prefix":""},"entryJSFiles":{"/src/app/blog/page":["static/chunks/a.js"]},"entryCSSFiles":{"/src/app/blog/page":[{"path":"static/chunks/a.css","inlined":false}]}};',
      '',
    ].join('\n');

    const parsed = parseClientReferenceManifest(source);
    expect(parsed?.manifestKey).toBe('/blog/page');
    expect(parsed?.manifest.entryJSFiles).toEqual({
      '/src/app/blog/page': ['static/chunks/a.js'],
    });
    expect(parsed?.manifest.entryCSSFiles?.['/src/app/blog/page'][0].path).toBe(
      'static/chunks/a.css',
    );
  });

  it('handles nested braces in the payload without truncating', () => {
    const source =
      'globalThis.__RSC_MANIFEST["/x/page"] = {"a":{"b":{"c":[1,2,{"d":true}]}},"entryJSFiles":{}};';
    const parsed = parseClientReferenceManifest(source);
    expect(parsed?.manifest).toEqual({
      a: { b: { c: [1, 2, { d: true }] } },
      entryJSFiles: {},
    });
  });

  it('returns null when the file is not a client-reference manifest', () => {
    expect(parseClientReferenceManifest('module.exports = {};')).toBeNull();
  });
});
