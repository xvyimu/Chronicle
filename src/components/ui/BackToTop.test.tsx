import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import BackToTop from './BackToTop';

describe('BackToTop', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.scrollY = 0;
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
    window.scrollY = 400;
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

    window.scrollY = 400;
    render(<BackToTop />);
    fireEvent.click(screen.getByLabelText('回到顶部'));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('registers scroll event listener on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<BackToTop />);

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    });
  });

  it('removes scroll event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<BackToTop />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('renders SVG arrow icon', () => {
    render(<BackToTop />);
    const btn = screen.getByLabelText('回到顶部');
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });
});
