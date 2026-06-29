import BlogList from '@/components/blog/BlogList';
import { getAllCategorySlugs, getPostsByCategory, isValidCategory } from '@/lib/categories';
import { SITE_CONFIG } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';

const { generateStaticParams, generateMetadata, default: CategoryPage } = createDynamicRoute<string>({
  paramKey: 'category',
  getAllSlugs: () => getAllCategorySlugs(),
  getBySlug: (categorySlug) => (isValidCategory(categorySlug) ? categorySlug : null),
  buildMetadata: (categoryName) => buildPageMetadata({
    title: `分类：${categoryName}`,
    description: `分类「${categoryName}」下的全部文章 — ${SITE_CONFIG.name}`,
    path: `/categories/${encodeURIComponent(categoryName)}`,
  }),
  render: (categoryName) => {
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
  },
});

export { generateStaticParams, generateMetadata };
export default CategoryPage;
