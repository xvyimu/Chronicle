'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  // In production, don't expose raw error messages — they may contain
  // file paths, stack fragments, or internal implementation details.
  const isDev = process.env.NODE_ENV === 'development';
  const displayMessage = isDev
    ? error.message
    : error.digest
      ? `错误代码: ${error.digest}`
      : '页面加载时发生未知错误。';

  return (
    <div className="not-found">
      <h2 className="not-found__title">出错了</h2>
      <p className="not-found__desc">{displayMessage}</p>
      <div className="not-found__actions">
        <button onClick={reset} className="btn btn--primary">
          重试
        </button>
        <Link href="/" className="btn btn--ghost">
          回到首页
        </Link>
        <Link href="/blog" className="btn btn--ghost">
          看博客
        </Link>
        <Link href="/links" className="btn btn--ghost">
          打开导航收藏
        </Link>
      </div>
    </div>
  );
}
