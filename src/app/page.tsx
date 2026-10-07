import { getAllPosts, getAllProjects, getAllTags } from '@/server/content';
import { toSearchDoc } from '@/lib/search';
import { organizationSchema, websiteSchema, toJsonLd } from '@/lib/jsonld';
import { SITE_CONFIG } from '@/lib/site';
import WorkspaceHero from '@/components/home/WorkspaceHero';
import TopicCloud from '@/components/home/TopicCloud';
import ArticleList from '@/components/home/ArticleList';
import JsonLd from '@/components/layout/JsonLd';
import { getCspNonce } from '@/lib/csp';
// Route-scoped homepage CSS (FE-1): keep off other routes.
import './styles/home.css';

export default async function HomePage() {
  const allPosts = getAllPosts();
  const allProjects = getAllProjects();
  const allTags = getAllTags();
  const docs = allPosts.map(toSearchDoc);

  const featured = allPosts.filter((post) => post.featured);
  const recent = [...featured, ...allPosts.filter((post) => !post.featured)].slice(0, 6);

  const orgLd = toJsonLd(organizationSchema());
  const siteLd = toJsonLd(websiteSchema());
  const nonce = await getCspNonce();

  return (
    <>
      <JsonLd data={orgLd} nonce={nonce} />
      <JsonLd data={siteLd} nonce={nonce} />
      <div className="workspace-home">
        <WorkspaceHero
          siteName={SITE_CONFIG.name}
          description={SITE_CONFIG.description}
          postCount={allPosts.length}
          projectCount={allProjects.length}
          docs={docs}
        />

        <TopicCloud tags={allTags} />

        <ArticleList posts={recent} title="最近更新" href="/blog" linkLabel="查看全部" />
      </div>
    </>
  );
}
