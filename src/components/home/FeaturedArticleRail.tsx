import Link from 'next/link';
import { PostMeta } from '@/types';
import { formatDate } from '@/lib/utils';
import MetaBadge from '@/components/ui/MetaBadge';

interface FeaturedArticleRailProps {
  posts: PostMeta[];
}

export default function FeaturedArticleRail({ posts }: FeaturedArticleRailProps) {
  if (posts.length === 0) return null;

  const [featuredPost, ...latestPosts] = posts;

  return (
    <section
      className="section home-article-rail"
      aria-labelledby="home-article-rail-title"
    >
      <div className="section__inner">
        <div className="section__head">
          <div>
            <h2 id="home-article-rail-title" className="section__title">
              最近整理
            </h2>
            <p className="section__subtitle">
              一篇主笔记配合最新列表，保留日期、分类和阅读时间，方便快速判断是否继续读。
            </p>
          </div>
          <div className="section__action">
            <Link href="/blog" className="section__link">
              查看全部
            </Link>
          </div>
        </div>

        <div className="home-article-rail__layout">
          <article className="home-article-rail__featured">
            <Link href={`/blog/${featuredPost.slug}`} className="home-article-rail__lead">
              <span className="home-article-rail__label">Lead note</span>
              <div className="home-article-rail__meta">
                <time dateTime={featuredPost.date}>{formatDate(featuredPost.date)}</time>
                {featuredPost.category && (
                  <MetaBadge className="home-article-rail__badge">
                    {featuredPost.category}
                  </MetaBadge>
                )}
                {featuredPost.tags[0] && (
                  <MetaBadge className="home-article-rail__badge">
                    {featuredPost.tags[0]}
                  </MetaBadge>
                )}
              </div>
              <h3 className="home-article-rail__title">{featuredPost.title}</h3>
              <p className="home-article-rail__desc">{featuredPost.description}</p>
              <span className="home-article-rail__foot">{featuredPost.readingTime}</span>
            </Link>
          </article>

          <div className="home-article-rail__list" aria-label="最新文章列表">
            {latestPosts.map((post) => (
              <article key={post.slug} className="home-article-rail__row">
                <Link href={`/blog/${post.slug}`} className="home-article-rail__row-link">
                  <div className="home-article-rail__meta">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    {post.category && (
                      <MetaBadge className="home-article-rail__badge">
                        {post.category}
                      </MetaBadge>
                    )}
                  </div>
                  <h3 className="home-article-rail__title">{post.title}</h3>
                  <span className="home-article-rail__foot">{post.readingTime}</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
