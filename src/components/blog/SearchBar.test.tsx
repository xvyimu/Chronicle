import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import SearchBar from '@/components/blog/SearchBar';
import type { PostMeta } from '@/types';

// Mock next/navigation useRouter
const mockPush = vi.fn();
const mockSearchParamValue = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamValue }),
}));

const MOCK_POSTS: PostMeta[] = [
  {
    title: 'Next.js App Router Guide',
    description: 'Frontmatter summary for App Router',
    date: '2026-06-23',
    tags: ['Next.js', 'React'],
    published: true,
    featured: true,
    slug: 'nextjs-app-router',
    readingTime: '5 min read',
    wordCount: 1200,
    excerpt: 'A comprehensive guide to App Router',
    headings: ['Routing', 'Streaming'],
    searchText: 'Next.js App Router Guide Routing Streaming React Server Components',
  },
  {
    title: 'Redis Caching Strategies',
    description: 'Deep dive into Redis caching patterns',
    date: '2026-06-20',
    tags: ['Redis', '后端'],
    published: true,
    featured: false,
    slug: 'redis-caching-strategies',
    readingTime: '8 min read',
    wordCount: 2000,
    excerpt: 'Deep dive into Redis caching patterns',
    headings: ['Cache Aside', 'Invalidation'],
    searchText: 'Redis Caching Strategies Cache Aside Invalidation backend cache',
  },
  {
    title: 'Linux Server Setup',
    description: 'Setting up a Linux server from scratch',
    date: '2026-06-15',
    tags: ['Linux', '运维'],
    published: true,
    featured: false,
    slug: 'linux-server-setup',
    readingTime: '10 min read',
    wordCount: 2500,
    excerpt: 'Setting up a Linux server from scratch',
    headings: ['SSH', 'Firewall'],
    searchText: 'Linux Server Setup SSH Firewall operations server',
  },
];

describe('SearchBar', () => {
  beforeEach(() => {
    cleanup();
    mockPush.mockClear();
    mockSearchParamValue.mockReturnValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('renders an input with search placeholder', () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    expect(screen.getByPlaceholderText(/搜索文章/)).toBeInTheDocument();
  });

  it('shows no results dropdown when query is empty', () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('filters posts by title when typing', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'Redis' } });

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'Redis Caching Strategies' }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('filters posts by tag', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'Linux' } });

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'Linux Server Setup' }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('filters posts by generated heading and body search text', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'Invalidation' } });

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'Redis Caching Strategies' }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('shows "没有匹配的文章" when no results match', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'zzznomatch' } });

    await waitFor(
      () => {
        expect(screen.getByText('没有匹配的文章')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByRole('link', { name: '查看全部文章' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(screen.getByRole('link', { name: '浏览标签' })).toHaveAttribute(
      'href',
      '/tags',
    );
  });

  it('shows rate limit feedback for server-backed search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { error: 'rate limit exceeded', code: 'RATE_LIMITED' },
          {
            status: 429,
            headers: { 'Retry-After': '17' },
          },
        ),
      ),
    );

    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'Redis' } });

    await waitFor(
      () => {
        expect(screen.getByText('请求过快，请稍后重试')).toBeInTheDocument();
        expect(
          screen.getByText('搜索请求已被临时限流，请在 17 秒后重试。'),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.queryByText('没有匹配的文章')).not.toBeInTheDocument();
  });

  it('shows result count in the dropdown', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'server' } });

    await waitFor(
      () => {
        expect(screen.getByText(/找到 \d+ 篇/)).toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'Linux Server Setup' }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('clears query when clear button is clicked', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Redis' } });

    // Clear button appears immediately when query is set
    await waitFor(() => {
      expect(screen.getByLabelText('清除搜索')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('清除搜索'));
    expect(input.value).toBe('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navigates to post on Enter when a result is selected', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'Redis' } });

    // Wait for Fuse.js to load and results to render
    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'Redis Caching Strategies' }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Arrow down to select first result
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Enter to navigate
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockPush).toHaveBeenCalledWith('/blog/redis-caching-strategies');
  });

  it('wraps around when navigating down past the last result', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'a' } });

    // Wait for search results to load
    await waitFor(
      () => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Wait for results to actually appear (not loading state)
    await waitFor(
      () => {
        expect(screen.queryByText('正在加载搜索…')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Navigate down multiple times — should wrap without error
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Should not crash and still have the listbox
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows loading indicator while Fuse.js is loading', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'test' } });

    // The listbox should appear immediately with loading text
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Then results should appear after Fuse.js loads
    await waitFor(
      () => {
        expect(screen.queryByText('正在加载搜索…')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('focuses the input when Ctrl+K is pressed', () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    expect(document.activeElement).not.toBe(input);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('focuses the input when focus=search is present in the URL', () => {
    mockSearchParamValue.mockImplementation((key: string) =>
      key === 'focus' ? 'search' : null,
    );
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    expect(document.activeElement).toBe(input);
  });

  it('hydrates the query from the q search param', async () => {
    mockSearchParamValue.mockImplementation((key: string) =>
      key === 'q' ? 'Redis' : null,
    );
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/) as HTMLInputElement;
    expect(input.value).toBe('Redis');

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'Redis Caching Strategies' }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('writes the query into the URL via history.replaceState', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'Redis' } });

    await waitFor(() => {
      expect(replaceState).toHaveBeenCalled();
    });
    const lastCall = replaceState.mock.calls.at(-1);
    expect(String(lastCall?.[2])).toContain('q=Redis');
  });

  it('focuses the input when Cmd+K (metaKey) is pressed', () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('advertises the Ctrl+K shortcut in the placeholder', () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    expect(screen.getByPlaceholderText(/Ctrl\+K/)).toBeInTheDocument();
  });

  it('highlights the matched substring in the result title', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'Redis' } });

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'Redis Caching Strategies' }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // The matched term should be wrapped in a <mark class="search-hl">
    const marks = document.querySelectorAll('mark.search-hl');
    expect(marks.length).toBeGreaterThan(0);
    expect(Array.from(marks).some((m) => /Redis/i.test(m.textContent ?? ''))).toBe(true);
  });

  it('highlights the matched substring in the displayed result excerpt', async () => {
    render(<SearchBar posts={MOCK_POSTS} />);
    const input = screen.getByPlaceholderText(/搜索文章/);
    fireEvent.change(input, { target: { value: 'comprehensive' } });

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'Next.js App Router Guide' }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    const marks = document.querySelectorAll('mark.search-hl');
    expect(
      Array.from(marks).some((m) => /comprehensive/i.test(m.textContent ?? '')),
    ).toBe(true);
  });
});
