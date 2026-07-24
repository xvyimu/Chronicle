'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const VISIBLE_THRESHOLD_PX = 300;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const apply = () => {
      frameIdRef.current = null;
      setVisible(window.scrollY > VISIBLE_THRESHOLD_PX);
    };

    const onScroll = () => {
      if (frameIdRef.current === null) {
        frameIdRef.current = window.requestAnimationFrame(apply);
      }
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frameIdRef.current !== null) {
        window.cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [prefersReducedMotion]);

  return (
    <Button
      onClick={scrollToTop}
      aria-label="回到顶部"
      size="icon"
      variant="outline"
      className={cn(
        'fixed bottom-6 right-6 z-50 size-10 rounded-full bg-[var(--surface)] text-[var(--text-soft)] shadow-md ring-1 ring-[var(--border)] transition-all duration-300 hover:bg-[var(--brand)] hover:text-[var(--primary-foreground)] hover:ring-[var(--brand)]',
        prefersReducedMotion && 'transition-none duration-0',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </Button>
  );
}
