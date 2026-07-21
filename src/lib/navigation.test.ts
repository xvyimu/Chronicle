import { describe, expect, it } from 'vitest';
import { MAIN_NAV_ITEMS, isNavItemActive } from './navigation';

describe('navigation', () => {
  it('keeps the main navigation order stable', () => {
    expect(MAIN_NAV_ITEMS.map((item) => item.href)).toEqual([
      '/',
      '/blog',
      '/garden',
      '/links',
      '/categories',
      '/series',
      '/projects',
      '/about',
    ]);
  });

  it('marks home active only on the root pathname', () => {
    expect(isNavItemActive('/', '/')).toBe(true);
    expect(isNavItemActive('/blog', '/')).toBe(false);
  });

  it('marks a section active on its index and nested routes', () => {
    expect(isNavItemActive('/blog', '/blog')).toBe(true);
    expect(isNavItemActive('/blog/nextjs-app-router', '/blog')).toBe(true);
    expect(isNavItemActive('/blogroll', '/blog')).toBe(false);
  });
});
