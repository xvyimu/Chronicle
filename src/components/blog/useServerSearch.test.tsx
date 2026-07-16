import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { useServerSearch } from './useServerSearch';

function Probe({ query }: { query: string }) {
  const { ready, results, error, retryAfterSeconds } = useServerSearch(query);
  return (
    <div>
      <span data-testid="ready">{ready ? 'yes' : 'no'}</span>
      <span data-testid="count">{results.length}</span>
      <span data-testid="error">{error ?? 'none'}</span>
      <span data-testid="retry-after">{retryAfterSeconds ?? 'none'}</span>
      {results.map((r) => (
        <div key={r.item.slug}>{r.item.title}</div>
      ))}
    </div>
  );
}

describe('useServerSearch', () => {
  beforeEach(() => {
    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          query: 'Redis',
          results: [
            {
              item: {
                title: 'Redis Caching Strategies',
                description: 'x',
                date: '2026-06-20',
                tags: ['Redis'],
                published: true,
                featured: false,
                slug: 'redis-caching-strategies',
                readingTime: '8 min read',
                wordCount: 2000,
                excerpt: 'Deep dive',
                headings: [],
                searchText: 'Redis',
              },
              matches: [],
            },
          ],
          count: 1,
          source: 'server',
        }),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not fetch for empty query', async () => {
    render(<Probe query="" />);
    expect(screen.getByTestId('ready').textContent).toBe('yes');
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('debounces and loads results from /api/search', async () => {
    render(<Probe query="Redis" />);
    await waitFor(
      () => {
        expect(screen.getByText('Redis Caching Strategies')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    expect(fetch).toHaveBeenCalled();
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain('/api/search');
    expect(url).toContain('q=Redis');
  });

  it('reports rate limit responses separately from empty results', async () => {
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

    render(<Probe query="Redis" />);

    await waitFor(
      () => {
        expect(screen.getByTestId('ready').textContent).toBe('yes');
        expect(screen.getByTestId('error').textContent).toBe('rate_limited');
        expect(screen.getByTestId('retry-after').textContent).toBe('17');
      },
      { timeout: 2000 },
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('reports server failures separately from empty results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({}, { status: 500 })),
    );

    render(<Probe query="Redis" />);

    await waitFor(
      () => {
        expect(screen.getByTestId('ready').textContent).toBe('yes');
        expect(screen.getByTestId('error').textContent).toBe('server');
      },
      { timeout: 2000 },
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
