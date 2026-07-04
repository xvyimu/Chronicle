import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';

import LoadingIntro from './LoadingIntro';

describe('LoadingIntro', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock requestIdleCallback since it's not available in jsdom
    window.requestIdleCallback = vi.fn(
      (cb: IdleRequestCallback, options?: IdleRequestOptions) => {
        return window.setTimeout(
          () =>
            cb({
              didTimeout: false,
              timeRemaining: () => 50,
            } as IdleDeadline),
          options?.timeout ?? 50,
        );
      },
    );
    window.cancelIdleCallback = vi.fn((id: number) => {
      window.clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as unknown as Record<string, unknown>).requestIdleCallback;
    delete (window as unknown as Record<string, unknown>).cancelIdleCallback;
  });

  it('renders with hidden state initially', () => {
    render(<LoadingIntro />);
    const el = screen.getByRole('status');
    expect(el.className).not.toContain('loading-intro--visible');
  });

  it('becomes visible after delay', async () => {
    render(<LoadingIntro />);
    expect(screen.getByRole('status').className).not.toContain('loading-intro--visible');

    await act(async () => {
      vi.advanceTimersByTime(80);
      await Promise.resolve();
    });

    expect(screen.getByRole('status').className).toContain('loading-intro--visible');
  });

  it('falls back to a timeout when requestIdleCallback is unavailable', async () => {
    delete (window as unknown as Record<string, unknown>).requestIdleCallback;
    delete (window as unknown as Record<string, unknown>).cancelIdleCallback;

    render(<LoadingIntro />);

    await act(async () => {
      vi.advanceTimersByTime(79);
      await Promise.resolve();
    });

    expect(screen.getByRole('status').className).not.toContain('loading-intro--visible');

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(screen.getByRole('status').className).toContain('loading-intro--visible');
  });

  it('clears the timeout fallback on unmount', () => {
    delete (window as unknown as Record<string, unknown>).requestIdleCallback;
    delete (window as unknown as Record<string, unknown>).cancelIdleCallback;
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    const { unmount } = render(<LoadingIntro />);
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('renders the site logo text', () => {
    render(<LoadingIntro />);
    expect(screen.getByText('西')).toBeInTheDocument();
  });

  it('renders the site title', () => {
    render(<LoadingIntro />);
    expect(screen.getByText('西江月')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<LoadingIntro />);
    expect(screen.getByText('Paper Gallery of notes')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<LoadingIntro />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '页面载入中');
  });

  it('renders the progress bar', () => {
    render(<LoadingIntro />);
    expect(document.querySelector('.loading-intro__bar-inner')).toBeInTheDocument();
  });
});
