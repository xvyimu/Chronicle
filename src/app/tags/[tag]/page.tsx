import BlogList from '@/components/blog/BlogList';
import { getTagNameBySlug, getAllTagSlugs } from '@/lib/tags';
import { getPostsByTag } from '@/lib/posts';
import { SITE_CONFIG } from '@/lib/site';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';

const {
  generateStaticParams,
  generateMetadata,
  default: TagPage,
} = createDynamicRoute<string>({
  paramKey: 'tag',
  getAllSlugs: () => getAllTagSlugs(),
  getBySlug: (tagSlug) => getTagNameBySlug(tagSlug),
  buildMetadata: (_tagName, tagSlug) =>
    buildPageMetadata({
      title: `标签：${_tagName}`,
      description: `标签「${_tagName}」下的全部文章 — ${SITE_CONFIG.name}`,
      path: `/tags/${encodeURIComponent(tagSlug)}`,
    }),
  render: (tagName) => {
    const posts = getPostsByTag(tagName);
    return (
      <section className="section">
        <div className="section__inner">
          <div className="section__head" style={{ marginBottom: 24 }}>
            <div>
              <h2 className="section__title">标签：{tagName}</h2>
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
export default TagPage;
