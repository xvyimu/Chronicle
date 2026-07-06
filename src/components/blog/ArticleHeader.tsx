import Link from 'next/link';
import TagLink from '@/components/blog/TagLink';
import type { PostFull } from '@/types';
import { formatDate, slugifyTag } from '@/lib/utils';

export default function ArticleHeader({
  post,
  category,
}: {
  post: PostFull;
  category?: string;
}) {
  const hasMetadataBadges = Boolean(post.series || category || post.tags.length > 0);

  return (
    <header className="article__header">
      <h1 className="article__title">{post.title}</h1>
      <div className="article__meta">
        <span className="article__meta-item">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </span>
        {post.updatedAt && post.updatedAt !== post.date && (
          <span className="article__meta-item">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            更新于 <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
          </span>
        )}
        <span className="article__meta-item">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {post.readingTime}
        </span>
        <span className="article__meta-item">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {post.wordCount.toLocaleString()} 字
        </span>
      </div>
      {hasMetadataBadges && (
        <div className="article__badges">
          {post.series && <span className="article__badge">{post.series}</span>}
          {category && (
            <Link
              href={`/categories/${encodeURIComponent(category)}`}
              className="article__badge"
            >
              {category}
            </Link>
          )}
          {post.tags.map((tag) => (
            <TagLink key={tag} tag={tag} slug={slugifyTag(tag)} />
          ))}
        </div>
      )}
    </header>
  );
}
