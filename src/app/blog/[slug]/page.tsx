import Link from 'next/link';
import MdxContent from '@/components/blog/MdxContent';
import TableOfContents from '@/components/blog/TableOfContents';
import ReadingProgress from '@/components/blog/ReadingProgress';
import ReadingPreferences from '@/components/blog/ReadingPreferences';
import TagLink from '@/components/blog/TagLink';
import MetaBadge from '@/components/ui/MetaBadge';
import {
  getAllPostSlugs,
  getPostBySlug,
  getAdjacentPosts,
  getRelatedPosts,
  getSeriesPosts,
} from '@/lib/posts';
import { inferCategory } from '@/lib/category-rules';
import { formatDate, slugifyTag } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/site';
import { blogPostingSchema, breadcrumbSchema, toJsonLd } from '@/lib/jsonld';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';
import Giscus from '@/components/comments/Giscus';
import type { PostFull } from '@/types';
import { getCspNonce } from '@/lib/csp';

const {
  generateStaticParams,
  generateMetadata,
  default: BlogPostPage,
} = createDynamicRoute<PostFull>({
  paramKey: 'slug',
  getAllSlugs: () => getAllPostSlugs(),
  getBySlug: (slug) => getPostBySlug(slug),
  buildMetadata: (post) => ({
    ...buildPageMetadata({
      title: post.title,
      description: post.description,
      path: `/blog/${post.slug}`,
      type: 'article',
      image: post.image,
      publishedTime: post.date,
      modifiedTime: post.updatedAt ?? post.date,
    }),
    keywords: post.tags.join(', '),
  }),
  render: (post) => BlogPostContent({ post }),
});

export { generateStaticParams, generateMetadata };
export default BlogPostPage;

async function BlogPostContent({ post }: { post: PostFull }) {
  const slug = post.slug;
  const { prev, next } = getAdjacentPosts(slug);
  const relatedPosts = getRelatedPosts(slug);
  const seriesPosts = getSeriesPosts(slug);
  const seriesIndex = seriesPosts.findIndex((item) => item.slug === post.slug);
  const category = post.category ?? inferCategory(post.tags);
  const hasMetadataBadges = Boolean(post.series || category || post.tags.length > 0);

  const articleLd = toJsonLd(blogPostingSchema(post));
  const breadcrumbLd = toJsonLd(
    breadcrumbSchema([
      { name: '首页', url: SITE_CONFIG.url },
      { name: '博客', url: `${SITE_CONFIG.url}/blog` },
      { name: post.title, url: `${SITE_CONFIG.url}/blog/${post.slug}` },
    ]),
  );
  const nonce = await getCspNonce();

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleLd }}
      />
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbLd }}
      />
      <ReadingProgress />
      <ReadingPreferences targetId="article-content" />
      <section className="section">
        <div className="section__inner">
          <div className="article-layout">
            {/* Article */}
            <article className="article-shell">
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
                      更新于{' '}
                      <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
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

              <div id="article-content">
                <MdxContent source={post.content} />
              </div>

              {seriesPosts.length > 1 && (
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
                        第 {seriesIndex + 1} / {seriesPosts.length} 篇
                      </MetaBadge>
                    )}
                  </div>

                  <ol className="article-path">
                    {seriesPosts.map((item, index) => {
                      const isCurrent = item.slug === post.slug;
                      const inner = (
                        <>
                          <span className="article-path__index">{index + 1}</span>
                          <span className="article-path__body">
                            <span className="article-path__title">{item.title}</span>
                            <span className="article-path__meta">{item.readingTime}</span>
                          </span>
                          {isCurrent && (
                            <span className="article-path__current">当前阅读</span>
                          )}
                        </>
                      );

                      return (
                        <li key={item.slug}>
                          {isCurrent ? (
                            <div className="article-path__item article-path__item--current">
                              {inner}
                            </div>
                          ) : (
                            <Link
                              href={`/blog/${item.slug}`}
                              className="article-path__item"
                            >
                              {inner}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              <Giscus />

              {relatedPosts.length > 0 && (
                <section
                  className="article-related"
                  aria-labelledby="related-posts-title"
                >
                  <h2 id="related-posts-title" className="article-related__title">
                    相关文章
                  </h2>
                  <div className="article-related__list">
                    {relatedPosts.map((related) => (
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
              )}

              <nav className="article-nav">
                <div className="article-nav__item">
                  {prev && (
                    <Link href={`/blog/${prev.slug}`} className="article-nav__link">
                      <span className="article-nav__kicker">← 上一篇</span>
                      <p className="article-nav__title">{prev.title}</p>
                    </Link>
                  )}
                </div>
                <div className="article-nav__item article-nav__item--next">
                  {next && (
                    <Link href={`/blog/${next.slug}`} className="article-nav__link">
                      <span className="article-nav__kicker">下一篇 →</span>
                      <p className="article-nav__title">{next.title}</p>
                    </Link>
                  )}
                </div>
              </nav>
            </article>

            {/* TOC sidebar — 桌面端显示 */}
            <aside className="article-aside">
              <TableOfContents />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
