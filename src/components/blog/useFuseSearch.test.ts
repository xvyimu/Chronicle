import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { FUSE_SEARCH_OPTIONS, useFuseSearch } from './useFuseSearch';
import { FUSE_SEARCH_OPTIONS as SharedOptions } from '@/lib/search';

describe('FUSE_SEARCH_OPTIONS re-export', () => {
  it('shares identity with @/lib/search options', () => {
    expect(FUSE_SEARCH_OPTIONS).toBe(SharedOptions);
  });

  it('keeps title as the highest-weighted field', () => {
    const keys = FUSE_SEARCH_OPTIONS.keys as Array<{ name: string; weight: number }>;
    const title = keys.find((key) => key.name === 'title');
    expect(title?.weight).toBeGreaterThan(0.3);
    expect(FUSE_SEARCH_OPTIONS.includeMatches).toBe(true);
    expect(FUSE_SEARCH_OPTIONS.minMatchCharLength).toBe(2);
  });

  it('keeps Fuse idle when no client-side index is supplied', async () => {
    const { result } = renderHook(() => useFuseSearch([], 'Redis'));

    await act(async () => {
      await import('fuse.js');
    });

    expect(result.current.fuseReady).toBe(false);
    expect(result.current.results).toEqual([]);
  });
});
