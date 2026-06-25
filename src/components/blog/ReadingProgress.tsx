'use client';

import { useEffect, useRef } from 'react';

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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
    onScroll(); // 初始化
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[110] h-[3px] bg-transparent pointer-events-none" data-testid="reading-progress">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] transition-all duration-75 linear rounded-r-full"
        style={{ width: '0%' }}
      />
    </div>
  );
}
