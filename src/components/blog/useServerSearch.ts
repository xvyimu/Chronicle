'use client';

import { useEffect, useRef, useState } from 'react';
import type { SearchHit, SearchResponse } from '@/lib/search';
import { SEARCH_RESULT_LIMIT } from '@/lib/search';

const DEBOUNCE_MS = 180;

/**
 * Server-backed search via GET /api/search.
 * Debounced to avoid a request per keystroke; aborts in-flight on change.
 */
export function useServerSearch(query: string): {
  ready: boolean;
  results: SearchHit[];
} {
  const [ready, setReady] = useState(true);
  const [results, setResults] = useState<SearchHit[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query.trim();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;

    if (!q) {
      // Avoid needless setState on idle mount (keeps RTL act() clean).
      setResults((prev) => (prev.length === 0 ? prev : []));
      setReady((prev) => (prev ? prev : true));
      return;
    }

    setReady(false);

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams({
        q,
        limit: String(SEARCH_RESULT_LIMIT),
      });

      fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`search ${res.status}`);
          return res.json() as Promise<SearchResponse>;
        })
        .then((body) => {
          if (controller.signal.aborted) return;
          setResults(body.results ?? []);
          setReady(true);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          console.error('服务端搜索失败', err);
          setResults([]);
          setReady(true);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [query]);

  return { ready, results };
}
