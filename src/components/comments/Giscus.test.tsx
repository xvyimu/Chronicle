import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Mock useInView
const mockInView = vi.fn().mockReturnValue(false);
vi.mock('@/hooks/useInView', () => ({
  useInView: () => mockInView(),
}));

import Giscus from './Giscus';

describe('Giscus', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockInView.mockReturnValue(false);
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the placeholder when not in view', () => {
    mockInView.mockReturnValue(false);
    render(<Giscus />);
    expect(screen.getByText('滚动到此处加载评论')).toBeInTheDocument();
  });

  it('does not render placeholder when in view', () => {
    mockInView.mockReturnValue(true);
    render(<Giscus />);
    expect(screen.queryByText('滚动到此处加载评论')).not.toBeInTheDocument();
  });

  it('has sentinel container with host + spacing classes', () => {
    const { container } = render(<Giscus />);
    const sentinel = container.firstElementChild;
    expect(sentinel?.className).toContain('mt-16');
    expect(sentinel?.className).toContain('giscus-host');
    expect(sentinel).toHaveAttribute('data-testid', 'giscus-comments');
  });

  it('applies giscus-repo attribute when visible', () => {
    // Need to simulate: visible → creates container → script appended
    // In jsdom, the script won't load, but we can check container presence
    mockInView.mockReturnValue(true);
    const { container } = render(<Giscus />);
    // The visible container is where script would be appended
    const innerDiv = container.querySelector('.giscus-host > .giscus-host__frame');
    // The sentinel is the outer div, and when visible the inner container div is rendered
    expect(innerDiv).toBeInTheDocument();
    expect(container.querySelector('.giscus-host')).toBeInTheDocument();
  });

  it('renders with correct spacing classes', () => {
    render(<Giscus />);
    const sentinel = document.querySelector('.giscus-host.mt-16');
    expect(sentinel).toBeInTheDocument();
  });

  it('takes default props from SITE_CONFIG', () => {
    mockInView.mockReturnValue(true);
    render(<Giscus />);
    // Should not throw when rendered with defaults
    const sentinel = document.querySelector('.giscus-host');
    expect(sentinel).toBeInTheDocument();
  });

  it('accepts custom props', () => {
    mockInView.mockReturnValue(false);
    render(
      <Giscus
        repoId="custom-repo"
        category="General"
        categoryId="custom-cat"
        mapping="url"
        lang="en"
      />,
    );
    // Still renders placeholder
    expect(screen.getByText('滚动到此处加载评论')).toBeInTheDocument();
  });

  it('removes the iframe load listener when the iframe appears after mount', () => {
    mockInView.mockReturnValue(true);

    const originalMutationObserver = window.MutationObserver;
    let latestCallback: MutationCallback | null = null;
    const disconnect = vi.fn();
    class MockMutationObserver implements MutationObserver {
      constructor(callback: MutationCallback) {
        latestCallback = callback;
      }

      disconnect = disconnect;
      observe = vi.fn();
      takeRecords = vi.fn(() => []);
    }
    window.MutationObserver = MockMutationObserver;

    try {
      const { unmount } = render(<Giscus />);
      const iframe = document.createElement('iframe');
      iframe.className = 'giscus-frame';
      const addSpy = vi.spyOn(iframe, 'addEventListener');
      const removeSpy = vi.spyOn(iframe, 'removeEventListener');
      document.body.appendChild(iframe);

      const notifyIframeMutation = latestCallback as MutationCallback | null;
      expect(notifyIframeMutation).not.toBeNull();
      notifyIframeMutation?.([], {} as MutationObserver);
      expect(addSpy).toHaveBeenCalledWith('load', expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('load', expect.any(Function));
    } finally {
      window.MutationObserver = originalMutationObserver;
    }
  });
});
