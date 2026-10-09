'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/error-report';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
    // 生产环境把错误送到同源 /api/client-error：在此之前这条 catch 只落在
    // 访客自己的控制台里，站点维护者看不到。非生产环境 reportError 会直接
    // 返回 false，不打扰本地开发。
    reportError(error);
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
      </div>
    </div>
  );
}
