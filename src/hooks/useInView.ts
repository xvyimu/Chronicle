'use client';

import { useEffect, useState, type RefObject } from 'react';

export interface UseInViewOptions {
  /** Stop observing after the element first enters the viewport. */
  once?: boolean;
  /** IntersectionObserver threshold. */
  threshold?: number | number[];
  /** IntersectionObserver rootMargin. */
  rootMargin?: string;
}

/**
 * Track whether a referenced element is inside the viewport via
 * IntersectionObserver. Returns `false` until the element intersects.
 *
 * - `once: true` (default) — stops observing after first intersection.
 *   Use for lazy-load + reveal-once patterns.
 * - `once: false` — re-fires when the element leaves/re-enters.
 *   Use for pause-when-offscreen patterns.
 *
 * SSR-safe: returns `false` on the server and during the first client
 * render; the observer is attached in `useEffect`.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  options: UseInViewOptions = {},
): boolean {
  const { once = true, threshold = 0, rootMargin = '0px' } = options;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let observer: IntersectionObserver | null = null;
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once && observer) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);

    return () => {
      observer?.disconnect();
    };
    // once/threshold/rootMargin are stable across renders in practice;
    // include them anyway for correctness if a caller passes new literals.
  }, [ref, once, threshold, rootMargin]);

  return inView;
}
