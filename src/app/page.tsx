import Link from 'next/link';
import {
  getAllLinkCategories,
  getAllPosts,
  getAllProjects,
  getFeaturedProjects,
} from '@/server/content';
import { slugifyTag } from '@/lib/utils';
import { organizationSchema, websiteSchema, toJsonLd } from '@/lib/jsonld';
import ProjectCard from '@/components/projects/ProjectCard';
import EditorialHero from '@/components/home/EditorialHero';
import ManifestoSection from '@/components/home/ManifestoSection';
import ReadingPathSection, {
  ReadingPathItem,
} from '@/components/home/ReadingPathSection';
import FeaturedArticleRail from '@/components/home/FeaturedArticleRail';
import CuratedLinksPreview from '@/components/home/CuratedLinksPreview';
import HomeCtaSection from '@/components/home/HomeCtaSection';
import { getCspNonce } from '@/lib/csp';
import { selectHomeLinkPreviewCategories } from '@/lib/link-preview';
// Route-scoped homepage CSS (FE-1): keep off other routes.
import './styles/home.css';
import './styles/home-hero.css';
import './styles/home-sections.css';

function buildReadingPaths(): ReadingPathItem[] {
  return [
    {
      title: '个人服务部署路线',
      description: '从新 VPS、安全加固、反向代理到 CI/CD，把个人服务跑稳。',
      href: '/blog/vps-initial-setup',
      meta: 'Series',
      topics: ['VPS', 'Docker', 'Nginx', 'CI/CD'],
    },
    {
      title: 'Web 性能与体验',
      description: '用 Core Web Vitals、Lighthouse 和浏览器工具定位首屏体验问题。',
      href: `/tags/${encodeURIComponent(slugifyTag('性能优化'))}`,
      meta: 'Topic',
      topics: ['LCP', 'INP', 'CLS', 'Lighthouse'],
    },
    {
      title: '数据层实践',
      description: '围绕 PostgreSQL、Redis、Supabase 梳理缓存、索引和后端数据边界。',
      href: `/categories/${encodeURIComponent('数据库')}`,
      meta: 'Category',
      topics: ['PostgreSQL', 'Redis', 'Supabase'],
    },
    {
      title: 'TypeScript 与全栈',
      description: '把类型系统、App Router 和前端工程实践连接成更稳定的开发体验。',
      href: `/tags/${encodeURIComponent(slugifyTag('TypeScript'))}`,
      meta: 'Topic',
      topics: ['TypeScript', 'Next.js', 'React'],
    },
  ];
}

export default async function HomePage() {
  const allPosts = getAllPosts();
  const featuredArticlePosts = [
    ...allPosts.filter((post) => post.featured),
    ...allPosts.filter((post) => !post.featured),
  ].slice(0, 6);
  const allProjects = getAllProjects();
  const featuredProjects = getFeaturedProjects();
  const linkCategories = getAllLinkCategories();
  const previewLinkCategories = selectHomeLinkPreviewCategories(linkCategories);
  const readingPaths = buildReadingPaths();

  const orgLd = toJsonLd(organizationSchema());
  const siteLd = toJsonLd(websiteSchema());
  const nonce = await getCspNonce();

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: orgLd }}
      />
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: siteLd }}
      />
      <div className="home-paper">
        <EditorialHero postCount={allPosts.length} projectCount={allProjects.length} />

        <ManifestoSection />

        {/*
          CH-PERF-003: below-fold sections stay server-only (no RevealOnScroll islands).
          Scroll-reveal client deferral residual → CH-PERF-006.
        */}
        <ReadingPathSection paths={readingPaths} />
        <FeaturedArticleRail posts={featuredArticlePosts} />
        <CuratedLinksPreview categories={previewLinkCategories} />

        {featuredProjects.length > 0 && (
          <section className="home-projects section">
            <div className="section__inner">
              <div className="section__head">
                <div>
                  <h2 className="section__title">项目样本</h2>
                  <p className="section__subtitle">
                    把文章里的做法落到真实项目里，留下可以继续迭代的样本。
                  </p>
                </div>
                <div className="section__action">
                  <Link href="/projects" className="section__link">
                    查看全部
                  </Link>
                </div>
              </div>
              <div className="cards cards--2">
                {/* No priority/preload: project images are below the fold and must not compete with hero LCP. */}
                {featuredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </section>
        )}

        <HomeCtaSection />
      </div>
    </>
  );
}
