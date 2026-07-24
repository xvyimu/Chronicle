'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/**
 * Defers the parallax controller chunk until after hydrate AND only when
 * motion is actually useful (fine pointer + not reduced-motion).
 *
 * Stage DOM stays server-rendered; this gate avoids downloading the
 * pointer/rAF module on touch / reduced-motion clients (W4 residual).
 */
const SiteBackdropParallax = dynamic(
  () => import('@/components/layout/SiteBackdropParallax'),
  { ssr: false },
);

export default function SiteBackdropParallaxGate() {
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fineMq = window.matchMedia('(pointer: fine)');

    const sync = () => {
      setMotionEnabled(!reduceMq.matches && fineMq.matches);
    };

    sync();
    reduceMq.addEventListener('change', sync);
    fineMq.addEventListener('change', sync);
    return () => {
      reduceMq.removeEventListener('change', sync);
      fineMq.removeEventListener('change', sync);
    };
  }, []);

  if (!motionEnabled) return null;
  return <SiteBackdropParallax />;
}
