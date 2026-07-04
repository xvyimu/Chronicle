import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// Mock usePrefersReducedMotion
const mockReduced = vi.fn().mockReturnValue(false);
vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

import ParticleCanvas from './ParticleCanvas';

describe('ParticleCanvas', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockReduced.mockReturnValue(false);

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      setTransform: vi.fn(),
      scale: vi.fn(),
    });

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return window.setTimeout(() => cb(performance.now()), 16);
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      window.clearTimeout(id);
    });

    // Mock IntersectionObserver
    class MockObserver implements IntersectionObserver {
      readonly root: Element | null = null;
      readonly rootMargin: string = '0px';
      readonly thresholds: ReadonlyArray<number> = [];
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    }
    window.IntersectionObserver = MockObserver;

    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });

    // Mock getBoundingClientRect for canvas sizing
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 400,
      height: 300,
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a canvas element', () => {
    const { container } = render(<ParticleCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('has aria-hidden attribute', () => {
    render(<ParticleCanvas />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('has hero__particles class', () => {
    const { container } = render(<ParticleCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.className).toContain('hero__particles');
  });

  it('does not start animation when reduced motion is preferred', () => {
    mockReduced.mockReturnValue(true);

    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    render(<ParticleCanvas />);
    // If reduced, the effect returns early before getting context or starting animation
    // Context may still be queried but animation loop won't run
    expect(getContextSpy).not.toHaveBeenCalled();
  });

  it('registers resize event listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<ParticleCanvas />);
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('cleans up on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ParticleCanvas />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
