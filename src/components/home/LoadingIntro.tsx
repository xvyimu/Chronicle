'use client';

import { useEffect, useState } from 'react';

export default function LoadingIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay to avoid flash on fast loads
    const idle = requestIdleCallback
      ? (ms: number) =>
          new Promise<void>((resolve) =>
            requestIdleCallback(() => resolve(), { timeout: ms }),
          )
      : (ms: number) =>
          new Promise<void>((resolve) => setTimeout(resolve, ms));

    idle(80).then(() => setShow(true));
  }, []);

  return (
    <div
      className={`loading-intro${show ? ' loading-intro--visible' : ''}`}
      role="status"
      aria-label="页面载入中"
    >
      <div className="loading-intro__frame">
        <span className="loading-intro__logo" aria-hidden="true">西</span>

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
