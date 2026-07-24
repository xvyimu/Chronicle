import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { useServerSearch } from './useServerSearch';

/** Must match DEBOUNCE_MS in useServerSearch.ts */
const DEBOUNCE_MS = 180;

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

/** Advance debounce timer + flush microtasks (fetch promise resolution). */
async function flushDebouncedSearch() {
  await act(async () => {
    vi.advanceTimersByTime(DEBOUNCE_MS);
  });
  // Allow resolved fetch promises to apply state updates.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useServerSearch', () => {
  beforeEach(() => {
    cleanup();
    // Fake timers pin the 180ms debounce — no wall-clock wait, no race.
    vi.useFakeTimers();
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
    vi.useRealTimers();
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
    // Before debounce elapses, no request yet.
    expect(fetch).not.toHaveBeenCalled();
    await flushDebouncedSearch();
    expect(screen.getByText('Redis Caching Strategies')).toBeInTheDocument();
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
    await flushDebouncedSearch();

    expect(screen.getByTestId('ready').textContent).toBe('yes');
    expect(screen.getByTestId('error').textContent).toBe('rate_limited');
    expect(screen.getByTestId('retry-after').textContent).toBe('17');
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('reports server failures separately from empty results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({}, { status: 500 })),
    );

    render(<Probe query="Redis" />);
    await flushDebouncedSearch();

    expect(screen.getByTestId('ready').textContent).toBe('yes');
    expect(screen.getByTestId('error').textContent).toBe('server');
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
