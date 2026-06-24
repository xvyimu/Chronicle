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

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="text-2xl font-bold text-[var(--text)]">出错了</h2>
      <p className="mt-3 text-[var(--text-dim)] max-w-md">
        {error.message || '页面加载时发生未知错误。'}
      </p>
      <button
        onClick={reset}
        className="mt-6 px-5 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium transition-opacity hover:opacity-90"
      >
        重试
      </button>
    </div>
  );
}
