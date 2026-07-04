'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type Fuse from 'fuse.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PostMeta } from '@/types';
import MetaBadge from '@/components/ui/MetaBadge';

type FuseMatch = { key?: string; value?: string; indices: readonly [number, number][] };

/**
 * Render `text` with the character ranges in `indices` wrapped in <mark>.
 * Indices come from Fuse.js (inclusive ranges). Falls back to plain text
 * when no matches are present for this field.
 */
function highlight(text: string, indices: readonly [number, number][]) {
  if (!indices || indices.length === 0) return text;
  // Sort + merge to guard against overlapping/unordered ranges.
  const sorted = [...indices].sort((a, b) => a[0] - b[0]);
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach(([start, end], i) => {
    if (start > cursor) segments.push(text.slice(cursor, start));
    const safeStart = Math.max(start, cursor);
    if (end + 1 > safeStart) {
      segments.push(
        <mark key={`m-${i}`} className="search-hl">
          {text.slice(safeStart, end + 1)}
        </mark>,
      );
      cursor = end + 1;
    }
  });
  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments;
}

export default function SearchBar({ posts }: { posts: PostMeta[] }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fuse, setFuse] = useState<Fuse<PostMeta> | null>(null);
  const fuseLoadedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fuse.js options — stable reference for reuse
  const fuseOptions = useMemo(
    () => ({
      keys: [
        { name: 'title', weight: 0.36 },
        { name: 'description', weight: 0.22 },
        { name: 'tags', weight: 0.16 },
        { name: 'category', weight: 0.1 },
        { name: 'series', weight: 0.08 },
        { name: 'headings', weight: 0.05 },
        { name: 'searchText', weight: 0.03 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    }),
    [],
  );

  // Preload Fuse.js on mount so the first search is instant in production
  // (the dynamic chunk would otherwise load on first keystroke, stalling the
  // result list for several seconds). fuseLoadedRef guards against re-import.
  useEffect(() => {
    if (fuseLoadedRef.current) return;
    fuseLoadedRef.current = true;

    let cancelled = false;
    import('fuse.js')
      .then(({ default: FuseLib }) => {
        if (cancelled) return;
        setFuse(new FuseLib(posts, fuseOptions));
      })
      .catch((err) => {
        console.error('Fuse.js 加载失败', err);
      });
    return () => {
      cancelled = true;
    };
  }, [posts, fuseOptions]);

  // Rebuild index when posts array reference changes (ISR revalidation)
  useEffect(() => {
    if (!fuseLoadedRef.current) return;
    let cancelled = false;
    import('fuse.js')
      .then(({ default: FuseLib }) => {
        if (cancelled) return;
        setFuse(new FuseLib(posts, fuseOptions));
      })
      .catch((err) => {
        console.error('Fuse.js 加载失败', err);
      });
    return () => {
      cancelled = true;
    };
  }, [posts, fuseOptions]);

  const results = useMemo(() => {
    if (!query.trim() || !fuse) return [];
    return fuse.search(query.trim(), { limit: 10 }).map((r) => ({
      item: r.item,
      matches: r.matches ?? [],
    }));
  }, [query, fuse]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const editable =
        el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;
      // Ctrl/Cmd+K — global summon, works even from inside other inputs
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (e.key === '/' && !editable && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const navigate = useCallback(
    (direction: 'up' | 'down') => {
      const len = results.length;
      if (len === 0) return;
      setActiveIndex((prev) => {
        if (direction === 'down') return prev < len - 1 ? prev + 1 : 0;
        return prev > 0 ? prev - 1 : len - 1;
      });
    },
    [results.length],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigate('down');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigate('up');
    } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < results.length) {
      const href = `/blog/${results[activeIndex].item.slug}`;
      router.push(href);
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-result]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div className="relative mb-8">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--text-dim)' }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索文章…（按 / 或 Ctrl+K 聚焦）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus-visible:outline-2 focus-visible:outline-[var(--brand)] transition-all"
          aria-label="搜索文章"
          role="combobox"
          aria-expanded={query.trim().length > 0}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
          }
          style={{ fontFamily: 'inherit' }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--brand)';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-soft)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {query && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
            onClick={() => {
              setQuery('');
              setActiveIndex(-1);
            }}
            aria-label="清除搜索"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {query && (
        <div
          ref={listRef}
          id="search-results"
          className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
          role="listbox"
          aria-label="搜索结果"
        >
          <p className="text-xs text-[var(--text-dim)] px-4 pt-3 pb-1">
            {!fuse ? (
              <span>正在加载搜索…</span>
            ) : (
              <>
                搜索 &ldquo;{query}&rdquo;，找到 {results.length} 篇
                {results.length > 0 && (
                  <span className="ml-2 opacity-60">↑↓ 导航 · Enter 打开 · Esc 关闭</span>
                )}
              </>
            )}
          </p>
          {fuse && results.length > 0 ? (
            results.map(({ item: post, matches }, i) => {
              const titleMatch = (matches as FuseMatch[]).find((m) => m.key === 'title');
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  data-result="true"
                  id={`search-result-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`block px-4 py-3 transition-colors ${
                    i === activeIndex
                      ? 'bg-[var(--brand-soft)] border-l-2 border-l-[var(--brand)]'
                      : 'border-l-2 border-l-transparent hover:bg-[var(--bg-soft)]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-0.5">
                    <time dateTime={post.date}>{post.date}</time>
                    {post.category && (
                      <MetaBadge className="search-results__badge">
                        {post.category}
                      </MetaBadge>
                    )}
                    {post.series && (
                      <MetaBadge className="search-results__badge">
                        {post.series}
                      </MetaBadge>
                    )}
                    {post.featured && (
                      <MetaBadge
                        variant="secondary"
                        className="search-results__badge search-results__badge--featured"
                      >
                        精选
                      </MetaBadge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm">
                    {titleMatch ? highlight(post.title, titleMatch.indices) : post.title}
                  </h4>
                  <p className="text-xs text-[var(--text-dim)] line-clamp-1 mt-0.5">
                    {post.excerpt || post.description}
                  </p>
                </Link>
              );
            })
          ) : fuse && results.length === 0 ? (
            <p className="text-sm text-[var(--text-soft)] px-4 py-4">没有匹配的文章</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
