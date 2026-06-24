import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import MdxContent from '@/components/blog/MdxContent';
import TableOfContents from '@/components/blog/TableOfContents';
import ReadingProgress from '@/components/blog/ReadingProgress';
import ReadingPreferences from '@/components/blog/ReadingPreferences';
import TagLink from '@/components/blog/TagLink';
import { getPostBySlug, getAllPostSlugs, getAdjacentPosts } from '@/lib/posts';
import { formatDate, slugifyTag } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/constants';
import { blogPostingSchema, breadcrumbSchema, toJsonLd } from '@/lib/jsonld';
import Link from 'next/link';
import Giscus from '@/components/comments/Giscus';

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | ${SITE_CONFIG.name}`,
    description: post.description,
    keywords: post.tags.join(', '),
    alternates: {
      canonical: `${SITE_CONFIG.url}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      images: post.image ? [{ url: post.image }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);

  const articleLd = toJsonLd(blogPostingSchema(post));
  const breadcrumbLd = toJsonLd(breadcrumbSchema([
    { name: '首页', url: SITE_CONFIG.url },
    { name: '博客', url: `${SITE_CONFIG.url}/blog` },
    { name: post.title, url: `${SITE_CONFIG.url}/blog/${post.slug}` },
  ]));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd }} />
      <ReadingProgress />
      <ReadingPreferences targetId="article-content" />
      <section className="section">
      <div className="section__inner">
        <div className="lg:flex lg:gap-12">
          {/* Article */}
          <article className="min-w-0 flex-1" style={{ maxWidth: 720, margin: '0 auto' }}>
            <header className="mb-10">
              <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--text-dim)]">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {post.readingTime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  {post.wordCount.toLocaleString()} 字
                </span>
              </div>
              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <TagLink key={tag} tag={tag} slug={slugifyTag(tag)} />
                  ))}
                </div>
              )}
            </header>

            <div id="article-content">
              <MdxContent source={post.content} />
            </div>

            <Giscus />

            <nav className="mt-16 flex items-center justify-between border-t border-[var(--border)] pt-8">
              <div>
                {prev && (
                  <Link href={`/blog/${prev.slug}`} className="group text-sm">
                    <span className="text-[var(--text-dim)]">← 上一篇</span>
                    <p className="mt-1 text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">
                      {prev.title}
                    </p>
                  </Link>
                )}
              </div>
              <div className="text-right">
                {next && (
                  <Link href={`/blog/${next.slug}`} className="group text-sm">
                    <span className="text-[var(--text-dim)]">下一篇 →</span>
                    <p className="mt-1 text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">
                      {next.title}
                    </p>
                  </Link>
                )}
              </div>
            </nav>
          </article>

          {/* TOC sidebar — 桌面端显示 */}
          <aside className="hidden lg:block w-56 shrink-0">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </section>
    </>
  );
}