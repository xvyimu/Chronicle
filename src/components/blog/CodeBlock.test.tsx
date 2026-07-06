import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import CodeBlock from '@/components/blog/CodeBlock';

describe('CodeBlock', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
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

  it('shows a copy button with default label', () => {
    render(
      <CodeBlock>
        <code>test</code>
      </CodeBlock>,
    );
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

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '复制' }));
    });
    expect(writeText).toHaveBeenCalledWith("console.log('hello')");
  });

  it('shows "已复制 ✓" after successful copy', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <CodeBlock>
        <code>test</code>
      </CodeBlock>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '复制' }));
    });
    // Wait for the promise to resolve
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: '已复制 ✓' })).toBeInTheDocument();
    });

    // After 2 seconds, should revert
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument();

    vi.useRealTimers();
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
