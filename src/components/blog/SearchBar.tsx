'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PostMeta } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchResultsList from './SearchResultsList';
import { useFuseSearch } from './useFuseSearch';
import { useServerSearch } from './useServerSearch';

function readQFromLocation() {
  if (typeof window === 'undefined') return '';
  return (new URL(window.location.href).searchParams.get('q') ?? '').trim();
}

function syncQueryToUrl(query: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const trimmed = query.trim();
  if (trimmed) {
    url.searchParams.set('q', trimmed);
  } else {
    url.searchParams.delete('q');
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next);
  }
}

/**
 * Blog search bar.
 *
 * - With `posts`: client Fuse (tests / embedded index).
 * - Without `posts`: GET /api/search (production path — no full post payload on the page).
 */
export default function SearchBar({ posts }: { posts?: PostMeta[] }) {
  const searchParams = useSearchParams();
  const focusSearch = searchParams.get('focus') === 'search';
  // Initial value from URL once; thereafter local state is source of truth.
  // replaceState does not update Next's useSearchParams, so we never re-hydrate
  // from that hook (it would clobber typing with a stale empty q).
  const [query, setQuery] = useState(() => (searchParams.get('q') ?? '').trim());
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const skipUrlWriteRef = useRef(true);

  const useClient = Array.isArray(posts);
  // Hooks must always run; idle path passes empty query so no Fuse work / no fetch.
  const client = useFuseSearch(
    useClient ? (posts as PostMeta[]) : [],
    useClient ? query : '',
  );
  const server = useServerSearch(useClient ? '' : query);

  const fuseReady = useClient ? client.fuseReady : server.ready;
  const results = useClient ? client.results : server.results;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Keep shareable ?q= in the address bar without a Next navigation round-trip.
  useEffect(() => {
    if (skipUrlWriteRef.current) {
      skipUrlWriteRef.current = false;
      return;
    }
    syncQueryToUrl(query);
  }, [query]);

  // Browser back/forward: re-read q from the real location.
  useEffect(() => {
    const onPopState = () => {
      setQuery(readQFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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

  useEffect(() => {
    if (!focusSearch) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusSearch]);

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
    <div className="search-bar">
      <div className="search-bar__field">
        <svg
          className="search-bar__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <Input
          ref={inputRef}
          type="text"
          size="lg"
          placeholder="搜索文章…（按 / 或 Ctrl+K 聚焦）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="搜索文章"
          role="combobox"
          aria-expanded={query.trim().length > 0}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
          }
          className="search-bar__input h-auto shadow-xs"
        />
        {query && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="search-bar__clear"
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
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
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
