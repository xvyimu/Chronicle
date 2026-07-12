import { describe, it, expect } from 'vitest';
import { FUSE_SEARCH_OPTIONS } from './useFuseSearch';

describe('FUSE_SEARCH_OPTIONS', () => {
  it('keeps title as the highest-weighted field', () => {
    const keys = FUSE_SEARCH_OPTIONS.keys as Array<{ name: string; weight: number }>;
    const title = keys.find((key) => key.name === 'title');
    expect(title?.weight).toBeGreaterThan(0.3);
    expect(FUSE_SEARCH_OPTIONS.includeMatches).toBe(true);
    expect(FUSE_SEARCH_OPTIONS.minMatchCharLength).toBe(2);
  });
});
