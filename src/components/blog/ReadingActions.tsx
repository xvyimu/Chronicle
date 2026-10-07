'use client';

import { useEffect, useState } from 'react';
import { isFavorite, toggleFavorite, recordRecent } from '@/lib/reading-state';

/**
 * 文章页阅读工具（客户端岛）：收藏按钮 + 阅读记录。
 *
 * - 收藏：localStorage，无账号。
 * - 阅读记录：进入文章时写入「最近阅读」（用于首页/收藏页）。
 * - 首帧不渲染收藏态（避免 SSR/CSR 不一致闪烁），挂载后同步。
 */
export default function ReadingActions({ slug }: { slug: string }) {
  const [favorited, setFavorited] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(slug));
    setReady(true);
    recordRecent(slug);
  }, [slug]);

  function onToggle() {
    setFavorited(toggleFavorite(slug));
  }

  return (
    <div className="reading-actions">
      <button
        type="button"
        className={`reading-actions__btn ${favorited ? 'is-active' : ''}`}
        onClick={onToggle}
        aria-pressed={ready ? favorited : undefined}
        aria-label={favorited ? '取消收藏' : '收藏本文'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={favorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span>{favorited ? '已收藏' : '收藏'}</span>
      </button>
    </div>
  );
}
