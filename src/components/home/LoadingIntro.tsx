'use client';

import { useEffect, useState } from 'react';

export default function LoadingIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const reveal = () => setShow(true);

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(reveal, { timeout: 80 });
    } else {
      timeoutId = window.setTimeout(reveal, 80);
    }

    return () => {
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div
      className={`loading-intro${show ? ' loading-intro--visible' : ''}`}
      role="status"
      aria-label="页面载入中"
    >
      <div className="loading-intro__frame">
        <span className="loading-intro__logo" aria-hidden="true">
          西
        </span>

        <div className="loading-intro__text">
          <span className="loading-intro__title">西江月</span>
          <span className="loading-intro__tagline">Zero-noise knowledge base</span>
        </div>

        <div className="loading-intro__bar">
          <div className="loading-intro__bar-inner" />
        </div>
      </div>
    </div>
  );
}
