'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PostMeta } from '@/types';
import SearchResultsList from './SearchResultsList';
import { useFuseSearch } from './useFuseSearch';

export default function SearchBar({ posts }: { posts: PostMeta[] }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { fuseReady, results } = useFuseSearch(posts, query);

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
        <SearchResultsList
          query={query}
          fuseReady={fuseReady}
          results={results}
          activeIndex={activeIndex}
          listRef={listRef}
        />
      )}
    </div>
  );
}
