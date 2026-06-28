import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProjects } from '@/lib/projects';
import { organizationSchema, websiteSchema, toJsonLd } from '@/lib/jsonld';
import BlogList from '@/components/blog/BlogList';
import ProjectCard from '@/components/projects/ProjectCard';
import EditorialHero from '@/components/home/EditorialHero';

export default function HomePage() {
  const allPosts = getAllPosts();
  const latestPosts = allPosts.slice(0, 4);
  const featuredProjects = getFeaturedProjects();

  const orgLd = toJsonLd(organizationSchema());
  const siteLd = toJsonLd(websiteSchema());

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteLd }} />
      <EditorialHero
        postCount={allPosts.length}
        projectCount={featuredProjects.length}
      />

      {/* ── 最新文章 ── */}
      {latestPosts.length > 0 && (
        <section className="section">
          <div className="section__inner">
            <div className="section__head">
              <div>
                <span className="section__eyebrow">Blog</span>
                <h2 className="section__title">最新文章</h2>
                <p className="section__subtitle">记录踩过的坑、想清楚的道理</p>
              </div>
              <div className="section__action">
                <Link href="/blog" className="section__link">
                  查看全部
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <BlogList posts={latestPosts} columns={2} />
          </div>
        </section>
      )}

      {/* ── 精选作品 ── */}
      {featuredProjects.length > 0 && (
        <section className="section">
          <div className="section__inner">
            <div className="section__head">
              <div>
                <span className="section__eyebrow">Projects</span>
                <h2 className="section__title">精选作品</h2>
                <p className="section__subtitle">一些有趣的开源项目和工具</p>
              </div>
              <div className="section__action">
                <Link href="/projects" className="section__link">
                  查看全部
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="cards cards--2">
              {featuredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} priority={index === 0} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
