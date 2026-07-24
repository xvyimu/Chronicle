'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0 && barRef.current) {
          barRef.current.style.width = `${Math.min((scrollTop / docHeight) * 100, 100)}%`;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[110] h-[3px] bg-transparent pointer-events-none"
      data-testid="reading-progress"
    >
      <div
        ref={barRef}
        className={cn(
          'h-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] rounded-r-full',
          reduced ? 'transition-none' : 'transition-all duration-75 linear',
        )}
        style={{ width: '0%' }}
      />
    </div>
  );
}
