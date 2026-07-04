'use client';

import { useEffect } from 'react';

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
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="text-2xl font-bold text-[var(--text)]">出错了</h2>
      <p className="mt-3 text-[var(--text-dim)] max-w-md">{displayMessage}</p>
      <button
        onClick={reset}
        className="mt-6 px-5 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium transition-opacity hover:opacity-90"
      >
        重试
      </button>
    </div>
  );
}
