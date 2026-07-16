'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  SearchErrorBody,
  SearchErrorState,
  SearchHit,
  SearchResponse,
} from '@/lib/search';
import { SEARCH_RESULT_LIMIT } from '@/lib/search';

const DEBOUNCE_MS = 180;

/**
 * Server-backed search via GET /api/search.
 * Debounced to avoid a request per keystroke; aborts in-flight on change.
 */
export function useServerSearch(query: string): {
  ready: boolean;
  results: SearchHit[];
  error: SearchErrorState | null;
  retryAfterSeconds: number | null;
} {
  const [ready, setReady] = useState(true);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [error, setError] = useState<SearchErrorState | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
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
      setError((prev) => (prev === null ? prev : null));
      setRetryAfterSeconds((prev) => (prev === null ? prev : null));
      return;
    }

    setReady(false);
    setError(null);
    setRetryAfterSeconds(null);

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
          if (!res.ok) {
            throw await createSearchError(res);
          }
          return res.json() as Promise<SearchResponse>;
        })
        .then((body) => {
          if (controller.signal.aborted) return;
          setResults(body.results ?? []);
          setError(null);
          setRetryAfterSeconds(null);
          setReady(true);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          const nextError = classifySearchError(err);
          if (nextError !== 'rate_limited') {
            console.error('服务端搜索失败', err);
          }
          setResults([]);
          setError(nextError);
          setRetryAfterSeconds(
            nextError === 'rate_limited'
              ? ((err as SearchRequestError).retryAfterSeconds ?? null)
              : null,
          );
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

  return { ready, results, error, retryAfterSeconds };
}

type SearchRequestError = Error & {
  code?: SearchErrorBody['code'];
  retryAfterSeconds?: number;
  status?: number;
};

async function createSearchError(res: Response): Promise<SearchRequestError> {
  let body: Partial<SearchErrorBody> | null = null;
  try {
    body = (await res.json()) as Partial<SearchErrorBody>;
  } catch {
    body = null;
  }

  return Object.assign(new Error(`search ${res.status}`), {
    code: body?.code,
    retryAfterSeconds: parseRetryAfterSeconds(res.headers.get('Retry-After')),
    status: res.status,
  });
}

function parseRetryAfterSeconds(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return undefined;
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

function classifySearchError(err: unknown): SearchErrorState {
  const error = err as SearchRequestError;
  if (error.code === 'RATE_LIMITED' || error.status === 429) return 'rate_limited';
  if (error.code === 'QUERY_TOO_LONG') return 'query_too_long';
  if (error.code === 'BAD_REQUEST' || error.status === 400) return 'bad_request';
  if (error instanceof TypeError) return 'network';
  return 'server';
}
