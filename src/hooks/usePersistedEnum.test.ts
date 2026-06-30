import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedEnum } from './usePersistedEnum';
import { safeLocalStorage } from '@/lib/storage';

describe('usePersistedEnum', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default value before hydration', async () => {
    const { result } = renderHook(() =>
      usePersistedEnum({
        key: 'test-enum',
        defaultValue: 'a',
        validValues: ['a', 'b', 'c'] as const,
      }),
    );
    // After hydration, default is used when storage is empty
    await vi.waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });
    expect(result.current.value).toBe('a');
  });

  it('restores value from localStorage after mount', async () => {
    safeLocalStorage.setItem('test-enum', 'b');
    const { result } = renderHook(() =>
      usePersistedEnum({
        key: 'test-enum',
        defaultValue: 'a',
        validValues: ['a', 'b', 'c'] as const,
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });
    expect(result.current.value).toBe('b');
  });

  it('falls back to default when stored value is invalid', async () => {
    safeLocalStorage.setItem('test-enum', 'invalid');
    const { result } = renderHook(() =>
      usePersistedEnum({
        key: 'test-enum',
        defaultValue: 'a',
        validValues: ['a', 'b', 'c'] as const,
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });
    expect(result.current.value).toBe('a');
  });

  it('persists value to localStorage on change', async () => {
    const { result } = renderHook(() =>
      usePersistedEnum({
        key: 'test-enum',
        defaultValue: 'a',
        validValues: ['a', 'b', 'c'] as const,
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.setValue('c');
    });

    expect(safeLocalStorage.getItem('test-enum')).toBe('c');
  });

  it('cycle advances to next value and wraps', async () => {
    const { result } = renderHook(() =>
      usePersistedEnum({
        key: 'test-enum',
        defaultValue: 'a',
        validValues: ['a', 'b', 'c'] as const,
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => result.current.cycle());
    expect(result.current.value).toBe('b');

    act(() => result.current.cycle());
    expect(result.current.value).toBe('c');

    act(() => result.current.cycle());
    expect(result.current.value).toBe('a');
  });

  it('skips persist on initial render, writes only after hydration', async () => {
    // The `if (!hydrated) return;` guard ensures the persist effect does not
    // run during the initial render cycle (before the restore effect has
    // read localStorage). Without the guard, persist would fire twice:
    //   1. Initial render (writing default 'a' before restore reads storage)
    //   2. After hydration (writing current value)
    // With the guard, persist fires exactly once — after hydration.
    const setItemSpy = vi.spyOn(safeLocalStorage, 'setItem');
    const { result } = renderHook(() =>
      usePersistedEnum({
        key: 'test-enum',
        defaultValue: 'a',
        validValues: ['a', 'b', 'c'] as const,
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith('test-enum', 'a');
    setItemSpy.mockRestore();
  });

  it('uses custom persist function when provided', async () => {
    const persist = vi.fn();
    const { result } = renderHook(() =>
      usePersistedEnum({
        key: 'test-enum',
        defaultValue: 'a',
        validValues: ['a', 'b', 'c'] as const,
        persist,
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.setValue('b');
    });

    expect(persist).toHaveBeenCalledWith('b', safeLocalStorage);
    // Default storage write should NOT happen when persist is overridden
    expect(safeLocalStorage.getItem('test-enum')).toBeNull();
  });

  it('custom persist can clear storage for default value', async () => {
    // Simulate ThemeToggle's pattern: 'system' (default) clears storage
    const { result } = renderHook(() =>
      usePersistedEnum({
        key: 'theme',
        defaultValue: 'system',
        validValues: ['system', 'light', 'dark'] as const,
        persist: (value, storage) => {
          if (value === 'system') {
            storage.removeItem('theme');
          } else {
            storage.setItem('theme', value);
          }
        },
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.setValue('dark');
    });
    expect(safeLocalStorage.getItem('theme')).toBe('dark');

    act(() => {
      result.current.setValue('system');
    });
    expect(safeLocalStorage.getItem('theme')).toBeNull();
  });
});
