import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { PostMeta } from '@/types';

export default function ArticleBacklinks({ posts }: { posts: PostMeta[] }) {
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
        <ul className="article-backlinks__list">
          {posts.map((item) => (
            <li key={item.slug} className="article-backlinks__item">
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
          ))}
        </ul>
      )}
    </section>
  );
}
