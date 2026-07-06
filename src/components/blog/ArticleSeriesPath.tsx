import Link from 'next/link';
import MetaBadge from '@/components/ui/MetaBadge';
import type { PostFull, PostMeta } from '@/types';

export default function ArticleSeriesPath({
  post,
  posts,
}: {
  post: PostFull;
  posts: PostMeta[];
}) {
  if (posts.length <= 1) return null;

  const seriesIndex = posts.findIndex((item) => item.slug === post.slug);

  return (
    <section className="article-panel" aria-labelledby="series-posts-title">
      <div className="article-panel__head">
        <div>
          <p className="article-panel__label">Reading Path</p>
          <h2 id="series-posts-title" className="article-panel__title">
            专题阅读路径
          </h2>
          <p className="article-panel__desc">{post.series}</p>
        </div>
        {seriesIndex >= 0 && (
          <MetaBadge className="article-panel__count">
            第 {seriesIndex + 1} / {posts.length} 篇
          </MetaBadge>
        )}
      </div>

      <ol className="article-path">
        {posts.map((item, index) => {
          const isCurrent = item.slug === post.slug;
          const inner = (
            <>
              <span className="article-path__index">{index + 1}</span>
              <span className="article-path__body">
                <span className="article-path__title">{item.title}</span>
                <span className="article-path__meta">{item.readingTime}</span>
              </span>
              {isCurrent && <span className="article-path__current">当前阅读</span>}
            </>
          );

          return (
            <li key={item.slug}>
              {isCurrent ? (
                <div className="article-path__item article-path__item--current">
                  {inner}
                </div>
              ) : (
                <Link href={`/blog/${item.slug}`} className="article-path__item">
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
