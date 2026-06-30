import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('usePrefersReducedMotion', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true after mount when OS prefers reduced motion', async () => {
    setReducedMotion(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    await vi.waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false after mount when OS does not prefer reduced motion', async () => {
    setReducedMotion(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    await vi.waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('subscribes to changes via addEventListener', async () => {
    const listeners: ((e: { matches: boolean }) => void)[] = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
          listeners.push(fn);
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePrefersReducedMotion());
    await vi.waitFor(() => {
      expect(result.current).toBe(false);
    });

    expect(listeners).toHaveLength(1);
    // Simulate OS setting change
    listeners[0]({ matches: true });
    await vi.waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('removes listener on unmount', async () => {
    const removeEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { unmount } = renderHook(() => usePrefersReducedMotion());
    await vi.waitFor(() => {
      expect(removeEventListener).not.toHaveBeenCalled();
    });
    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });
});
