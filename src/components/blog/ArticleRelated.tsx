import Link from 'next/link';
import MetaBadge from '@/components/ui/MetaBadge';
import { formatDate } from '@/lib/utils';
import type { PostMeta } from '@/types';

export default function ArticleRelated({
  posts,
  nextInSeriesSlug,
}: {
  posts: PostMeta[];
  nextInSeriesSlug?: string;
}) {
  if (posts.length === 0) return null;

  const continuation = nextInSeriesSlug
    ? posts.find((post) => post.slug === nextInSeriesSlug)
    : undefined;

  return (
    <section className="article-related" aria-labelledby="related-posts-title">
      <div className="article-related__heading">
        <div>
          <h2 id="related-posts-title" className="article-related__title">
            {continuation ? '继续阅读' : '相关文章'}
          </h2>
          {continuation ? <p className="article-related__lead">专题下一篇</p> : null}
        </div>
        {continuation ? (
          <Link href={`/blog/${continuation.slug}`} className="article-related__continue">
            继续：{continuation.title}
          </Link>
        ) : null}
      </div>
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
            <h3 className="article-related__name">
              {related.title}
              {related.slug === nextInSeriesSlug ? (
                <span className="article-related__sequence">下一篇</span>
              ) : null}
            </h3>
            <p className="article-related__desc">{related.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
