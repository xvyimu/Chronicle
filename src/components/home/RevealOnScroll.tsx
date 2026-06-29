'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface RevealOnScrollProps {
  children: ReactNode;
  as?: 'section' | 'div';
  className?: string;
  delay?: number;
}

export default function RevealOnScroll({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            el.style.setProperty('--reveal-delay', `${delay}ms`);
          }
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref as never} className={`reveal-on-scroll ${className}`}>
      {children}
    </Tag>
  );
}
