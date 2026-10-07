'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PostMeta } from '@/types';
import { formatDate } from '@/lib/utils';
import { getFavorites, getRecent } from '@/lib/reading-state';

type Mode = 'favorites' | 'recent';

/**
 * 本地阅读列表（客户端岛）：收藏 / 最近阅读。
 *
 * 从 localStorage 读 slug，与传入的可见文章列表求交（过滤已删除/草稿）。
 * 空态有提示；未挂载前不渲染列表（避免 hydration 不一致）。
 */
export default function LocalReadingList({
  posts,
  mode,
  title,
}: {
  posts: PostMeta[];
  mode: Mode;
  title: string;
}) {
  const [items, setItems] = useState<PostMeta[] | null>(null);

  useEffect(() => {
    const entries = mode === 'favorites' ? getFavorites() : getRecent();
    const bySlug = new Map(posts.map((p) => [p.slug, p]));
    const resolved = entries
      .map((e) => bySlug.get(e.slug))
      .filter((p): p is PostMeta => Boolean(p));
    setItems(resolved);
  }, [posts, mode]);

  return (
    <section className="local-reading" aria-labelledby={`local-${mode}-title`}>
      <h2 id={`local-${mode}-title`} className="ws-section__title">
        {title}
      </h2>

      {items === null ? (
        <p className="local-reading__hint" aria-live="polite">
          加载中…
        </p>
      ) : items.length === 0 ? (
        <p className="local-reading__hint">
          {mode === 'favorites'
            ? '还没有收藏。打开文章后点「收藏」即可在此汇总。'
            : '还没有阅读记录。读过的文章会出现在这里。'}
        </p>
      ) : (
        <ul className="local-reading__list">
          {items.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="local-reading__item">
                <span className="local-reading__title">{post.title}</span>
                <span className="local-reading__meta">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span>{post.readingTime}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
