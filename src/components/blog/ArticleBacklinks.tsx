import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { PostMeta } from '@/types';

/** Default visible inbound links before “还有 k 条” expand. */
export const BACKLINKS_PREVIEW_LIMIT = 5;

function BacklinkItem({ item }: { item: PostMeta }) {
  return (
    <li className="article-backlinks__item">
      <Link href={`/blog/${item.slug}`} className="article-backlinks__link">
        <span className="article-backlinks__title">{item.title}</span>
        <span className="article-backlinks__meta">
          <time dateTime={item.date}>{formatDate(item.date)}</time>
          {item.readingTime ? (
            <span className="article-backlinks__reading">{item.readingTime}</span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export default function ArticleBacklinks({ posts }: { posts: PostMeta[] }) {
  const visible = posts.slice(0, BACKLINKS_PREVIEW_LIMIT);
  const rest = posts.slice(BACKLINKS_PREVIEW_LIMIT);
  const overflow = rest.length;

  return (
    <section
      className="article-panel article-backlinks"
      aria-labelledby="backlinks-title"
    >
      <div className="article-panel__head">
        <div>
          <p className="article-panel__label">Backlinks</p>
          <h2 id="backlinks-title" className="article-panel__title">
            反向链接
          </h2>
          <p className="article-panel__desc">链到本文的其他笔记</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="article-panel__desc article-backlinks__empty">
          暂无其他文章链到此处
        </p>
      ) : (
        <>
          <ul className="article-backlinks__list">
            {visible.map((item) => (
              <BacklinkItem key={item.slug} item={item} />
            ))}
          </ul>
          {overflow > 0 ? (
            <details className="article-backlinks__more">
              <summary className="article-backlinks__more-summary">
                还有 {overflow} 条
              </summary>
              <ul className="article-backlinks__list article-backlinks__list--rest">
                {rest.map((item) => (
                  <BacklinkItem key={item.slug} item={item} />
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}
