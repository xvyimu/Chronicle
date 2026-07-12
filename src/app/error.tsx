'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
        <Button size="cta" onClick={reset}>
          重试
        </Button>
        <Button asChild size="cta" variant="outline">
          <Link href="/">回到首页</Link>
        </Button>
        <Button asChild size="cta" variant="outline">
          <Link href="/blog">看博客</Link>
        </Button>
        <Button asChild size="cta" variant="outline">
          <Link href="/links">打开导航收藏</Link>
        </Button>
      </div>
    </div>
  );
}
