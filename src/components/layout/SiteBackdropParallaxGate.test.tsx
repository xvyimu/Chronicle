import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import SiteBackdropParallaxGate from '@/components/layout/SiteBackdropParallaxGate';

const parallaxMock = vi.fn(() => null);

vi.mock('next/dynamic', () => ({
  default: () => {
    // Mimic dynamic() import of SiteBackdropParallax
    return function DynamicParallax() {
      return parallaxMock();
    };
  },
}));

type MqListener = (e: MediaQueryListEvent) => void;

function createMq(initial: boolean) {
  const listeners = new Set<MqListener>();
  return {
    matches: initial,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_: string, listener: EventListener) => {
      listeners.add(listener as MqListener);
    },
    removeEventListener: (_: string, listener: EventListener) => {
      listeners.delete(listener as MqListener);
    },
    dispatchEvent: () => true,
    emit(matches: boolean) {
      this.matches = matches;
      for (const l of listeners) {
        l({ matches } as MediaQueryListEvent);
      }
    },
  };
}

describe('SiteBackdropParallaxGate', () => {
  let reduceMq: ReturnType<typeof createMq>;
  let fineMq: ReturnType<typeof createMq>;

  beforeEach(() => {
    cleanup();
    parallaxMock.mockClear();
    reduceMq = createMq(false);
    fineMq = createMq(true);
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      if (query.includes('prefers-reduced-motion')) {
        return reduceMq as unknown as MediaQueryList;
      }
      if (query.includes('pointer: fine') || query.includes('pointer:fine')) {
        return fineMq as unknown as MediaQueryList;
      }
      return createMq(false) as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not mount parallax when reduced motion is preferred', async () => {
    reduceMq.matches = true;
    fineMq.matches = true;
    await act(async () => {
      render(<SiteBackdropParallaxGate />);
    });
    expect(parallaxMock).not.toHaveBeenCalled();
  });

  it('does not mount parallax when pointer is not fine', async () => {
    reduceMq.matches = false;
    fineMq.matches = false;
    await act(async () => {
      render(<SiteBackdropParallaxGate />);
    });
    expect(parallaxMock).not.toHaveBeenCalled();
  });

  it('mounts parallax when fine pointer and motion allowed', async () => {
    reduceMq.matches = false;
    fineMq.matches = true;
    await act(async () => {
      render(<SiteBackdropParallaxGate />);
    });
    expect(parallaxMock).toHaveBeenCalled();
  });

  it('unmounts parallax when OS toggles reduced-motion on', async () => {
    reduceMq.matches = false;
    fineMq.matches = true;
    await act(async () => {
      render(<SiteBackdropParallaxGate />);
    });
    expect(parallaxMock).toHaveBeenCalledTimes(1);

    parallaxMock.mockClear();
    await act(async () => {
      reduceMq.emit(true);
    });
    expect(parallaxMock).not.toHaveBeenCalled();
  });
});
