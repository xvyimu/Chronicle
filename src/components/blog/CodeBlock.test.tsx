import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import CodeBlock from '@/components/blog/CodeBlock';

class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;
  static instances: MockIntersectionObserver[] = [];
  static elements: Element[] = [];

  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(target: Element) {
    MockIntersectionObserver.elements.push(target);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = '';
  thresholds = [];

  static fireIntersection(isIntersecting: boolean) {
    const entry = {
      isIntersecting,
      target: MockIntersectionObserver.elements[0],
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      boundingClientRect: {} as DOMRectReadOnly,
      time: 0,
    } as unknown as IntersectionObserverEntry;
    for (const observer of MockIntersectionObserver.instances) {
      observer.callback([entry], observer as unknown as IntersectionObserver);
    }
  }

  static reset() {
    MockIntersectionObserver.instances = [];
    MockIntersectionObserver.elements = [];
  }
}

globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

async function revealCopyButton() {
  await act(async () => {
    MockIntersectionObserver.fireIntersection(true);
  });
  await vi.waitFor(() => {
    expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument();
  });
}

describe('CodeBlock', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    MockIntersectionObserver.reset();
  });

  it('renders a pre element with children', () => {
    render(
      <CodeBlock>
        <code>const x = 42;</code>
      </CodeBlock>,
    );
    expect(screen.getByText('const x = 42;')).toBeInTheDocument();
  });

  it('wraps pre in a code-toolbar container', () => {
    const { container } = render(
      <CodeBlock>
        <code>hello</code>
      </CodeBlock>,
    );
    expect(container.querySelector('.code-toolbar')).toBeInTheDocument();
    expect(container.querySelector('.code-toolbar pre')).toBeInTheDocument();
  });

  it('defers copy button until near viewport', () => {
    render(
      <CodeBlock>
        <code>test</code>
      </CodeBlock>,
    );
    expect(screen.queryByRole('button', { name: '复制' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-copy-ready="false"]')).toBeInTheDocument();
  });

  it('shows a copy button after intersection', async () => {
    render(
      <CodeBlock>
        <code>test</code>
      </CodeBlock>,
    );
    await revealCopyButton();
    expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument();
  });

  it('copies code text to clipboard on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <CodeBlock>
        <code>console.log(&apos;hello&apos;)</code>
      </CodeBlock>,
    );
    await revealCopyButton();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '复制' }));
    });
    expect(writeText).toHaveBeenCalledWith("console.log('hello')");
  });

  it('shows "已复制 ✓" after successful copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <CodeBlock>
        <code>test</code>
      </CodeBlock>,
    );
    await revealCopyButton();

    vi.useFakeTimers();
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '复制' }));
      });
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByRole('button', { name: '已复制 ✓' })).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a failure message when clipboard write and fallback both fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => {
        throw new Error('fallback denied');
      }),
    });

    render(
      <CodeBlock>
        <code>test</code>
      </CodeBlock>,
    );
    await revealCopyButton();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '复制' }));
    });
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: '复制失败' })).toBeInTheDocument();
    });
  });

  it('passes through extra props to pre element', () => {
    const { container } = render(
      <CodeBlock data-language="typescript">
        <code>const x: number = 1;</code>
      </CodeBlock>,
    );
    expect(container.querySelector('pre')?.getAttribute('data-language')).toBe(
      'typescript',
    );
  });

  it('displays language label when data-language is set', () => {
    render(
      <CodeBlock data-language="typescript">
        <code>const x: number = 1;</code>
      </CodeBlock>,
    );
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('hides language label when data-language is absent', () => {
    const { container } = render(
      <CodeBlock>
        <code>plain text</code>
      </CodeBlock>,
    );
    expect(container.querySelector('.code-block-header')).not.toBeInTheDocument();
  });
});
