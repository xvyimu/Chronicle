import { getAllPosts, getAllProjects, getAllSeries, getAllTags } from '@/server/content';
import Link from 'next/link';
import { toSearchDoc } from '@/lib/search';
import { organizationSchema, websiteSchema, toJsonLd } from '@/lib/jsonld';
import { SITE_CONFIG } from '@/lib/site';
import WorkspaceHero from '@/components/home/WorkspaceHero';
import TopicCloud from '@/components/home/TopicCloud';
import ArticleList from '@/components/home/ArticleList';
import ArchiveCard from '@/components/layout/ArchiveCard';
import JsonLd from '@/components/ui/JsonLd';
import { getCspNonce } from '@/lib/csp';
// Route-scoped homepage CSS (FE-1): keep off other routes.
import './styles/home.css';
import { formatDate } from '@/lib/utils';

export default async function HomePage() {
  const allPosts = getAllPosts();
  const allProjects = getAllProjects();
  const allTags = getAllTags();
  const seriesList = getAllSeries();
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

        {seriesList.length > 0 ? (
          <section className="ws-series" aria-labelledby="home-series-title">
            <div className="ws-section__head">
              <div>
                <h2 id="home-series-title" className="ws-section__title">
                  阅读路径
                </h2>
                <p className="ws-section__subtitle">按顺序完成一组相互衔接的文章</p>
              </div>
              <Link href="/series" className="ws-section__link">
                查看全部
              </Link>
            </div>
            <div className="ws-series__grid">
              {seriesList.slice(0, 3).map((series) => (
                <ArchiveCard
                  key={series.slug}
                  href={`/series/${encodeURIComponent(series.slug)}`}
                  title={series.name}
                  countLabel={`${series.count} 篇`}
                  meta={`${formatDate(series.startDate)} - ${formatDate(series.endDate)}`}
                >
                  <ol className="archive-card__sequence">
                    {series.posts.slice(0, 3).map((post, index) => (
                      <li key={post.slug} className="archive-card__sequence-item">
                        <span className="archive-card__sequence-index">{index + 1}</span>
                        <span className="archive-card__sequence-title">{post.title}</span>
                      </li>
                    ))}
                  </ol>
                </ArchiveCard>
              ))}
            </div>
          </section>
        ) : null}

        <ArticleList posts={recent} title="最近更新" href="/blog" linkLabel="查看全部" />
      </div>
    </>
  );
}
