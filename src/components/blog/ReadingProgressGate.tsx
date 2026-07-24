'use client';

import dynamic from 'next/dynamic';

/**
 * Article-only progress bar: keep off the SSR HTML + main shell bundle.
 * Progressive enhancement — bar mounts after hydrate.
 */
const ReadingProgress = dynamic(() => import('@/components/blog/ReadingProgress'), {
  ssr: false,
});

export default function ReadingProgressGate() {
  return <ReadingProgress />;
}
