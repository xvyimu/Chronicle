'use client';

import dynamic from 'next/dynamic';

/**
 * Defers the BackToTop island until after the shell hydrates.
 * Button is progressive enhancement (scroll affordance), safe without SSR HTML.
 */
const BackToTop = dynamic(() => import('@/components/ui/BackToTop'), {
  ssr: false,
});

export default function BackToTopGate() {
  return <BackToTop />;
}
