import { describe, it, expect } from 'vitest';
import {
  serializeGardenView,
  parseGardenView,
  mergePositions,
  loadGardenViewFromStorage,
  saveGardenViewToStorage,
  clearGardenViewStorage,
  GARDEN_VIEW_STORAGE_KEY,
} from './garden-view-storage';

describe('garden-view-storage', () => {
  it('round-trips serialize/parse', () => {
    const view = serializeGardenView(
      'S1',
      'tag',
      new Map([
        ['a', { x: 1, y: 2 }],
        ['b', { x: 3, y: 4 }],
      ]),
      '2026-07-21T00:00:00.000Z',
    );
    expect(parseGardenView(view)).toEqual(view);
    expect(parseGardenView(JSON.parse(JSON.stringify(view)))).toEqual(view);
  });

  it('rejects bad payloads', () => {
    expect(parseGardenView(null)).toBeNull();
    expect(parseGardenView({ version: 2 })).toBeNull();
    expect(parseGardenView({ version: 1, series: 'x' })).toBeNull();
  });

  it('merges saved positions over layout', () => {
    const layout = new Map([
      ['a', { x: 0, y: 0 }],
      ['b', { x: 10, y: 10 }],
    ]);
    const merged = mergePositions(layout, { a: { x: 99, y: 88 } });
    expect(merged.get('a')).toEqual({ x: 99, y: 88 });
    expect(merged.get('b')).toEqual({ x: 10, y: 10 });
  });

  it('loads and saves via Storage mock', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    };
    const view = serializeGardenView('s', 't', { a: { x: 1, y: 2 } }, 'ts');
    expect(saveGardenViewToStorage(storage, view)).toBe(true);
    expect(store.has(GARDEN_VIEW_STORAGE_KEY)).toBe(true);
    expect(loadGardenViewFromStorage(storage)).toEqual(view);
    clearGardenViewStorage(storage);
    expect(loadGardenViewFromStorage(storage)).toBeNull();
  });
});
