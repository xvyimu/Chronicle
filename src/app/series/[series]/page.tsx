import Link from 'next/link';
import PageSection from '@/components/layout/PageSection';
import { getAllSeriesSlugs, getSeriesBySlug } from '@/server/content';
import { SITE_CONFIG } from '@/lib/site';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';
import { formatDate } from '@/lib/utils';
import type { SeriesInfo } from '@/lib/series';

const {
  generateStaticParams,
  generateMetadata,
  default: SeriesDetailPage,
} = createDynamicRoute<SeriesInfo>({
  paramKey: 'series',
  getAllSlugs: () => getAllSeriesSlugs(),
  getBySlug: (seriesSlug) => getSeriesBySlug(seriesSlug),
  buildMetadata: (series) =>
    buildPageMetadata({
      title: `专题：${series.name}`,
      description: `专题「${series.name}」共 ${series.count} 篇文章 — ${SITE_CONFIG.name}`,
      path: `/series/${encodeURIComponent(series.slug)}`,
    }),
  render: (series) => (
    <PageSection
      eyebrow="Series"
      title={`专题：${series.name}`}
      subtitle={`${series.count} 篇文章 · ${formatDate(series.startDate)} - ${formatDate(
        series.endDate,
      )}`}
      compactHeader
    >
      <ol className="archive-list">
        {series.posts.map((post, index) => (
          <li key={post.slug}>
            <div className="archive-list__item archive-list__item--series">
              <span className="archive-list__index" aria-label={`第 ${index + 1} 篇`}>
                {index + 1}
              </span>
              <div className="archive-list__body">
                <Link href={`/blog/${post.slug}`} className="archive-list__title">
                  {post.title}
                </Link>
                <p className="archive-list__desc">{post.description}</p>
                <span className="archive-list__reading-time">{post.readingTime}</span>
              </div>
              <time className="archive-list__date" dateTime={post.date}>
                {formatDate(post.date)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </PageSection>
  ),
});

export { generateStaticParams, generateMetadata };
export default SeriesDetailPage;
