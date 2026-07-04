import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ThemeToggle from '@/components/ui/ThemeToggle';

function mockMatchMedia(matches: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];
  const mq = {
    matches,
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) =>
      listeners.push(cb),
    ),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn(() => mq),
  });
  return { mq, listeners };
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockMatchMedia(false);
    // startViewTransition may not exist in jsdom
    Object.defineProperty(document, 'startViewTransition', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a button with aria-label "切换主题"', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: '切换主题' })).toBeInTheDocument();
  });

  it('applies dark class when theme is dark', async () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle />);
    // Wait for useEffect to run
    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('does not apply dark class when theme is light', async () => {
    localStorage.setItem('theme', 'light');
    render(<ThemeToggle />);
    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  it('cycles through light → dark → system on click', async () => {
    // Start with light (no stored theme defaults to system, but we set light)
    localStorage.setItem('theme', 'light');
    render(<ThemeToggle />);

    await vi.waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('light');
    });

    // Click: light → dark
    fireEvent.click(screen.getByRole('button'));
    await vi.waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    // Click: dark → system
    fireEvent.click(screen.getByRole('button'));
    await vi.waitFor(() => {
      expect(localStorage.getItem('theme')).toBeNull();
    });

    // Click: system → light
    fireEvent.click(screen.getByRole('button'));
    await vi.waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  it('removes localStorage entry when theme is system', async () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle />);

    await vi.waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    // Click twice: dark → system
    fireEvent.click(screen.getByRole('button'));
    await vi.waitFor(() => {
      expect(localStorage.getItem('theme')).toBeNull();
    });
  });

  it('follows system preference when theme is system and OS is dark', async () => {
    mockMatchMedia(true);
    // No stored theme → defaults to system
    render(<ThemeToggle />);

    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
