import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ReadingProgress from './ReadingProgress';

describe('ReadingProgress', () => {
  beforeEach(() => {
    cleanup();
    // Mock window properties
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the progress bar container', () => {
    render(<ReadingProgress />);
    expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
  });

  it('initializes with 0% width', () => {
    render(<ReadingProgress />);
    const bar = document.querySelector(
      '[data-testid="reading-progress"] div:first-child',
    ) as HTMLElement & { style: CSSStyleDeclaration };
    expect(screen.getByTestId('reading-progress')).toBeInTheDocument();
    expect(bar.style.width).toBe('0%');
  });

  it('listens to scroll events', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<ReadingProgress />);
    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    });
  });

  it('cleans up scroll listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ReadingProgress />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('cancels animation frame on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = render(<ReadingProgress />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
