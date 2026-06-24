import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogList from '@/components/blog/BlogList';
import { getAllCategorySlugs, getPostsByCategory, isValidCategory } from '@/lib/categories';
import { SITE_CONFIG } from '@/lib/constants';

export async function generateStaticParams() {
  return getAllCategorySlugs().map((slug) => ({ category: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `${category} | ${SITE_CONFIG.name}`,
    alternates: {
      canonical: `${SITE_CONFIG.url}/categories/${encodeURIComponent(category)}`,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  if (!isValidCategory(category)) {
    notFound();
  }

  const posts = getPostsByCategory(category);

  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head" style={{ marginBottom: 24 }}>
          <div>
            <h2 className="section__title">分类：{category}</h2>
            <p className="section__subtitle">{posts.length} 篇文章</p>
          </div>
        </div>
        <BlogList posts={posts} columns={2} />
      </div>
    </section>
  );
}