import { describe, expect, it, beforeEach, vi } from 'vitest';

// jsdom 提供 localStorage；每个用例前清空。
import {
  getFavorites,
  isFavorite,
  toggleFavorite,
  getRecent,
  recordRecent,
  RECENT_LIMIT,
} from './reading-state';

describe('reading-state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles favorites on and off', () => {
    expect(isFavorite('a')).toBe(false);
    expect(toggleFavorite('a')).toBe(true);
    expect(isFavorite('a')).toBe(true);
    expect(getFavorites().map((e) => e.slug)).toEqual(['a']);
    expect(toggleFavorite('a')).toBe(false);
    expect(isFavorite('a')).toBe(false);
    expect(getFavorites()).toEqual([]);
  });

  it('keeps favorites sorted by most recent first', () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1000);
    toggleFavorite('a');
    now.mockReturnValue(2000);
    toggleFavorite('b');
    expect(getFavorites().map((e) => e.slug)).toEqual(['b', 'a']);
    now.mockRestore();
  });

  it('records recent reads and de-duplicates', () => {
    recordRecent('a');
    recordRecent('b');
    recordRecent('a');
    expect(getRecent().map((e) => e.slug)).toEqual(['a', 'b']);
  });

  it('caps recent at RECENT_LIMIT', () => {
    for (let i = 0; i < RECENT_LIMIT + 5; i++) recordRecent(`p-${i}`);
    expect(getRecent().length).toBe(RECENT_LIMIT);
  });

  it('returns empty for corrupted storage', () => {
    localStorage.setItem('chronicle:favorites', 'not json');
    expect(getFavorites()).toEqual([]);
    localStorage.setItem('chronicle:recent', '{"not":"array"}');
    expect(getRecent()).toEqual([]);
  });

  it('filters out malformed entries', () => {
    localStorage.setItem(
      'chronicle:favorites',
      JSON.stringify([{ slug: 'ok', at: 1 }, { slug: 2 }, null, 'x']),
    );
    expect(getFavorites().map((e) => e.slug)).toEqual(['ok']);
  });
});
