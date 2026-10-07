import Link from 'next/link';
import type { PostMeta } from '@/types';
import { formatDate } from '@/lib/utils';

interface ArticleListProps {
  posts: PostMeta[];
  title: string;
  href: string;
  linkLabel: string;
}

/**
 * 轻量文章列表 —— 无大封面图的紧凑卡片。
 *
 * 每项：标题 / 摘要 / 分类 / 标签 / 日期 / 阅读时间 + 悬停箭头。
 */
export default function ArticleList({ posts, title, href, linkLabel }: ArticleListProps) {
  if (posts.length === 0) return null;

  return (
    <section className="ws-articles" aria-labelledby="home-articles-title">
      <div className="ws-section__head">
        <h2 id="home-articles-title" className="ws-section__title">
          {title}
        </h2>
        <Link href={href} className="ws-section__link">
          {linkLabel}
        </Link>
      </div>

      <ul className="ws-articles__list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="ws-articles__item">
              <div className="ws-articles__main">
                <h3 className="ws-articles__title">{post.title}</h3>
                <p className="ws-articles__desc">{post.description}</p>
                <div className="ws-articles__meta">
                  {post.category && (
                    <span className="ws-articles__chip">{post.category}</span>
                  )}
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="ws-articles__chip ws-articles__chip--tag">
                      {tag}
                    </span>
                  ))}
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span>{post.readingTime}</span>
                </div>
              </div>
              <span className="ws-articles__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
