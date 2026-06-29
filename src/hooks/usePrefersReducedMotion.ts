'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribe to the user's `prefers-reduced-motion` system setting.
 *
 * Returns `false` during SSR and the first client render (before the
 * effect runs), then updates to the actual OS value. Stays subscribed
 * to changes — if the user toggles the OS setting while the page is
 * open, the hook re-renders with the new value.
 *
 * Components that previously called
 * `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
 * inline can use this hook instead to centralize the media query.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
