import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Mock MDXRemote (RSC — not available in jsdom)
vi.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: vi.fn(
    ({
      source,
      options,
      components,
    }: {
      source: string;
      options?: Record<string, unknown>;
      components?: Record<string, unknown>;
    }) => (
      <div data-testid="mdx-content">
        <div data-testid="mdx-source">{source}</div>
        <div data-testid="mdx-has-components">{components ? 'true' : 'false'}</div>
        <div data-testid="mdx-has-plugins">
          {(options as { mdxOptions?: { remarkPlugins?: unknown } } | undefined)
            ?.mdxOptions?.remarkPlugins
            ? 'true'
            : 'false'}
        </div>
      </div>
    ),
  ),
}));

// We need these for the import verification test
import * as mdxRemote from 'next-mdx-remote/rsc';

import MdxContent from './MdxContent';

describe('MdxContent', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the MDX source content', () => {
    render(<MdxContent source="# Hello" />);
    expect(screen.getByTestId('mdx-content')).toBeInTheDocument();
    expect(screen.getByTestId('mdx-source')).toHaveTextContent('# Hello');
  });

  it('passes components (CodeBlock and ImageZoom)', () => {
    // Get the last call to MDXRemote to inspect components
    const MDXRemoteMock = vi.mocked(mdxRemote.MDXRemote);
    render(<MdxContent source="# Hello" />);

    const lastCall = MDXRemoteMock.mock.calls[MDXRemoteMock.mock.calls.length - 1];
    const components = lastCall[0].components;

    // Should have pre (CodeBlock) and img (ImageZoom) mapped
    expect(components).toHaveProperty('pre');
    expect(components).toHaveProperty('img');
  });

  it('passes remark and rehype plugins', () => {
    const MDXRemoteMock = vi.mocked(mdxRemote.MDXRemote);
    render(<MdxContent source="# Hello" />);

    const lastCall = MDXRemoteMock.mock.calls[MDXRemoteMock.mock.calls.length - 1];
    const plugins = lastCall[0].options?.mdxOptions;

    expect(plugins).toBeDefined();
    if (plugins) {
      expect(plugins.remarkPlugins).toBeDefined();
      expect(plugins.rehypePlugins).toBeDefined();
      expect(Array.isArray(plugins.remarkPlugins)).toBe(true);
      expect(plugins.remarkPlugins!.length).toBeGreaterThan(0);
      expect(Array.isArray(plugins.rehypePlugins)).toBe(true);
      expect(plugins.rehypePlugins!.length).toBeGreaterThan(0);
    }
  });

  it('renders within a prose container', () => {
    const { container } = render(<MdxContent source="# Hello" />);
    const proseDiv = container.querySelector('.prose');
    expect(proseDiv).toBeInTheDocument();
    expect(proseDiv?.className).toContain('dark:prose-invert');
  });

  it('handles empty source', () => {
    const MDXRemoteMock = vi.mocked(mdxRemote.MDXRemote);
    render(<MdxContent source="" />);

    const lastCall = MDXRemoteMock.mock.calls[MDXRemoteMock.mock.calls.length - 1];
    expect(lastCall[0].source).toBe('');
  });
});
