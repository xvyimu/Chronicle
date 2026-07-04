import Link from 'next/link';
import { PostMeta } from '@/types';
import { formatDate } from '@/lib/utils';

interface FeaturedArticleRailProps {
  posts: PostMeta[];
}

export default function FeaturedArticleRail({ posts }: FeaturedArticleRailProps) {
  if (posts.length === 0) return null;

  return (
    <section
      className="section home-article-rail"
      aria-labelledby="home-article-rail-title"
    >
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Featured Articles</span>
            <h2 id="home-article-rail-title" className="section__title">
              最新文章
            </h2>
            <p className="section__subtitle">
              把最近整理过的实践笔记放成一条可横向浏览的轨道。
            </p>
          </div>
          <div className="section__action">
            <Link href="/blog" className="section__link">
              查看全部
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="home-article-rail__track">
          {posts.map((post, index) => (
            <article key={post.slug} className="home-article-rail__card">
              <Link href={`/blog/${post.slug}`} className="home-article-rail__link">
                <span className="home-article-rail__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="home-article-rail__meta">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  {post.category && <span>{post.category}</span>}
                  {post.tags[0] && <span>{post.tags[0]}</span>}
                </div>
                <h3 className="home-article-rail__title">{post.title}</h3>
                <p className="home-article-rail__desc">{post.description}</p>
                <span className="home-article-rail__foot">{post.readingTime}</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
