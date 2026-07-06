import Link from 'next/link';
import MetaBadge from '@/components/ui/MetaBadge';
import { formatDate } from '@/lib/utils';
import type { PostMeta } from '@/types';

export default function ArticleRelated({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="article-related" aria-labelledby="related-posts-title">
      <h2 id="related-posts-title" className="article-related__title">
        相关文章
      </h2>
      <div className="article-related__list">
        {posts.map((related) => (
          <Link
            key={related.slug}
            href={`/blog/${related.slug}`}
            className="article-related__card"
          >
            <div className="article-related__meta">
              <time dateTime={related.date}>{formatDate(related.date)}</time>
              {related.category && (
                <MetaBadge className="article-related__badge">
                  {related.category}
                </MetaBadge>
              )}
              {related.tags[0] && (
                <MetaBadge className="article-related__badge">
                  {related.tags[0]}
                </MetaBadge>
              )}
            </div>
            <h3 className="article-related__name">{related.title}</h3>
            <p className="article-related__desc">{related.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
