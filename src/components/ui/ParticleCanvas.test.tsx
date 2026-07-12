import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

const mockReduced = vi.fn().mockReturnValue(false);
vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

import ParticleCanvas from './ParticleCanvas';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('ParticleCanvas', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockReduced.mockReturnValue(false);
    mockMatchMedia(true);

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

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return window.setTimeout(() => cb(performance.now()), 16);
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      window.clearTimeout(id);
    });

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

    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });

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

  it('renders canvas when desktop fine-pointer media matches', async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(<ParticleCanvas />));
    });
    const canvas = container!.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas?.className).toContain('hero__particles');
  });

  it('does not render canvas on coarse/mobile media', async () => {
    mockMatchMedia(false);
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(<ParticleCanvas />));
    });
    expect(container!.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('does not start animation when reduced motion is preferred', async () => {
    mockReduced.mockReturnValue(true);
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    await act(async () => {
      render(<ParticleCanvas />);
    });
    expect(getContextSpy).not.toHaveBeenCalled();
  });

  it('registers resize event listener when enabled', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    await act(async () => {
      render(<ParticleCanvas />);
    });
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('cleans up on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    let unmount: () => void;
    await act(async () => {
      ({ unmount } = render(<ParticleCanvas />));
    });
    unmount!();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
