import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';

const mockPrefersReducedMotion = vi.fn(() => false);

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockPrefersReducedMotion(),
}));

import BackToTop from './BackToTop';

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    value,
    writable: true,
    configurable: true,
  });
}

describe('BackToTop', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPrefersReducedMotion.mockReturnValue(false);
    setScrollY(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the back-to-top button', () => {
    render(<BackToTop />);
    expect(screen.getByLabelText('回到顶部')).toBeInTheDocument();
  });

  it('is hidden when scrollY <= 300', () => {
    render(<BackToTop />);
    const btn = screen.getByLabelText('回到顶部');
    expect(btn.className).toContain('opacity-0');
    expect(btn.className).toContain('pointer-events-none');
  });

  it('is visible when scrollY > 300', () => {
    setScrollY(400);
    render(<BackToTop />);
    const btn = screen.getByLabelText('回到顶部');
    expect(btn.className).toContain('opacity-100');
    // 可见态不应带独立的 pointer-events-none（Button 基类的
    // disabled:/svg: 前缀变体不计入）
    expect(btn.className).toMatch(/(?:^|\s)opacity-100(?:\s|$)/);
    expect(btn.className).not.toMatch(/(?:^|\s)pointer-events-none(?:\s|$)/);
  });

  it('scrolls to top on click', () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;

    setScrollY(400);
    render(<BackToTop />);
    fireEvent.click(screen.getByLabelText('回到顶部'));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('uses instant scrolling when reduced motion is preferred', () => {
    mockPrefersReducedMotion.mockReturnValue(true);
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;

    setScrollY(400);
    render(<BackToTop />);
    fireEvent.click(screen.getByLabelText('回到顶部'));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('registers scroll event listener on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<BackToTop />);

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    });
  });

  it('coalesces scroll events into one animation frame', () => {
    const frameCallbacks = new Map<number, FrameRequestCallback>();
    let nextFrameId = 1;
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextFrameId++;
      frameCallbacks.set(id, cb);
      return id;
    });
    const addSpy = vi.spyOn(window, 'addEventListener');

    render(<BackToTop />);
    const onScroll = addSpy.mock.calls.find(
      (c) => c[0] === 'scroll',
    )?.[1] as EventListener;
    expect(onScroll).toBeTypeOf('function');

    rafSpy.mockClear();
    frameCallbacks.clear();

    setScrollY(50);
    onScroll(new Event('scroll'));
    setScrollY(400);
    onScroll(new Event('scroll'));

    expect(rafSpy).toHaveBeenCalledTimes(1);
    const frameId = rafSpy.mock.results[0]?.value as number;
    const frame = frameCallbacks.get(frameId);
    expect(frame).toBeTypeOf('function');

    act(() => {
      frame?.(0);
    });

    const btn = screen.getByLabelText('回到顶部');
    expect(btn.className).toContain('opacity-100');
  });

  it('removes scroll event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<BackToTop />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('disables transition classes when reduced motion is preferred', () => {
    mockPrefersReducedMotion.mockReturnValue(true);
    render(<BackToTop />);
    const btn = screen.getByLabelText('回到顶部');
    expect(btn.className).toContain('transition-none');
  });

  it('renders SVG arrow icon', () => {
    render(<BackToTop />);
    const btn = screen.getByLabelText('回到顶部');
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });
});
