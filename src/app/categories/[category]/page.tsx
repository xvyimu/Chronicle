import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogList from '@/components/blog/BlogList';
import { getAllCategorySlugs, getPostsByCategory, isValidCategory } from '@/lib/categories';
import { SITE_CONFIG } from '@/lib/constants';
import { decodeRouteSegment } from '@/lib/utils';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateStaticParams() {
  return getAllCategorySlugs().map((slug) => ({ category: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const categoryName = decodeRouteSegment(category);
  return buildPageMetadata({
    title: `分类：${categoryName}`,
    description: `分类「${categoryName}」下的全部文章 — ${SITE_CONFIG.name}`,
    path: `/categories/${encodeURIComponent(categoryName)}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryName = decodeRouteSegment(category);

  if (!isValidCategory(categoryName)) {
    notFound();
  }

  const posts = getPostsByCategory(categoryName);

  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head" style={{ marginBottom: 24 }}>
          <div>
            <h2 className="section__title">分类：{categoryName}</h2>
            <p className="section__subtitle">{posts.length} 篇文章</p>
          </div>
        </div>
        <BlogList posts={posts} columns={2} />
      </div>
    </section>
  );
}
