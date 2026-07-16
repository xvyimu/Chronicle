import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import SiteBackdropParallax from '@/components/layout/SiteBackdropParallax';

function mockMatchMedia(matches: boolean) {
  const mq = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn(() => mq),
  });
  return mq;
}

describe('SiteBackdropParallax', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;
  let frameCallbacks: Map<number, FrameRequestCallback>;
  let nextFrameId: number;

  beforeEach(() => {
    cleanup();
    // Ensure a stage element exists in DOM by default
    document.body.innerHTML = '<div class="site-backdrop__stage"></div>';
    mockMatchMedia(false);
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
    frameCallbacks = new Map();
    nextFrameId = 1;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const frameId = nextFrameId++;
      frameCallbacks.set(frameId, callback);
      return frameId;
    });
    cancelRafSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId) => {
        frameCallbacks.delete(frameId);
      });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('returns null (renders no DOM)', () => {
    const { container } = render(<SiteBackdropParallax />);
    expect(container.firstChild).toBeNull();
  });

  it('does not attach listeners when prefers-reduced-motion: reduce', () => {
    mockMatchMedia(true);
    render(<SiteBackdropParallax />);
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('attaches pointermove and mouseleave listeners when motion allowed', () => {
    render(<SiteBackdropParallax />);
    const calls = addSpy.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain('pointermove');
    expect(calls).toContain('mouseleave');
  });

  it('coalesces pointer moves into one frame and applies the latest coordinates', () => {
    const stage = document.querySelector('.site-backdrop__stage') as HTMLElement;
    const setPropSpy = vi.spyOn(stage.style, 'setProperty');

    render(<SiteBackdropParallax />);
    // Simulate mousemove at center-right of viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 500,
    });

    const handler = addSpy.mock.calls.find(
      (c: unknown[]) => c[0] === 'pointermove',
    )?.[1] as (e: PointerEvent) => void;
    expect(handler).toBeDefined();

    handler({
      clientX: 0,
      clientY: 500,
    } as PointerEvent);
    handler({
      clientX: 1000, // far right → x = (1000/1000 - 0.5) * 2 = 1 → 8px
      clientY: 0, // top → y = (0/500 - 0.5) * 2 = -1 → -8px
    } as PointerEvent);

    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(setPropSpy).not.toHaveBeenCalled();

    const frameId = rafSpy.mock.results[0]?.value as number;
    const callback = frameCallbacks.get(frameId);
    expect(callback).toBeDefined();
    callback?.(0);

    expect(setPropSpy).toHaveBeenCalledWith('--parallax-x', '8px');
    expect(setPropSpy).toHaveBeenCalledWith('--parallax-y', '-8px');
  });

  it('resets --parallax-x/y to 0px on mouseleave', () => {
    const stage = document.querySelector('.site-backdrop__stage') as HTMLElement;
    const setPropSpy = vi.spyOn(stage.style, 'setProperty');

    render(<SiteBackdropParallax />);
    const handler = addSpy.mock.calls.find(
      (c: unknown[]) => c[0] === 'mouseleave',
    )?.[1] as () => void;
    expect(handler).toBeDefined();

    handler();

    expect(setPropSpy).toHaveBeenCalledWith('--parallax-x', '0px');
    expect(setPropSpy).toHaveBeenCalledWith('--parallax-y', '0px');
  });

  it('cancels a pending frame on mouseleave', () => {
    render(<SiteBackdropParallax />);
    const moveHandler = addSpy.mock.calls.find(
      (c: unknown[]) => c[0] === 'pointermove',
    )?.[1] as (e: PointerEvent) => void;
    const leaveHandler = addSpy.mock.calls.find(
      (c: unknown[]) => c[0] === 'mouseleave',
    )?.[1] as () => void;

    moveHandler({ clientX: 100, clientY: 100 } as PointerEvent);
    const frameId = rafSpy.mock.results[0]?.value as number;
    leaveHandler();

    expect(cancelRafSpy).toHaveBeenCalledWith(frameId);
    expect(frameCallbacks.has(frameId)).toBe(false);
  });

  it('removes listeners and cancels a pending frame on unmount', () => {
    const { unmount } = render(<SiteBackdropParallax />);
    const moveHandler = addSpy.mock.calls.find(
      (c: unknown[]) => c[0] === 'pointermove',
    )?.[1] as (e: PointerEvent) => void;
    moveHandler({ clientX: 100, clientY: 100 } as PointerEvent);
    const frameId = rafSpy.mock.results[0]?.value as number;

    unmount();

    const removedEvents = removeSpy.mock.calls.map((c: unknown[]) => c[0]);
    expect(removedEvents).toContain('pointermove');
    expect(removedEvents).toContain('mouseleave');
    expect(cancelRafSpy).toHaveBeenCalledWith(frameId);
  });

  it('does nothing when .site-backdrop__stage is not found in DOM', () => {
    document.body.innerHTML = ''; // remove stage
    render(<SiteBackdropParallax />);
    // Only matchMedia check should run; no listeners attached
    expect(addSpy).not.toHaveBeenCalled();
  });
});
