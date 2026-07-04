import type { Metadata } from 'next';
import ArchiveCard from '@/components/layout/ArchiveCard';
import PageSection from '@/components/layout/PageSection';
import { getAllSeries } from '@/lib/series';
import { buildPageMetadata } from '@/lib/metadata';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = buildPageMetadata({
  title: '专题',
  description: '按连续主题浏览文章系列，从入门清单到完整实践路径。',
  path: '/series',
});

export default function SeriesPage() {
  const seriesList = getAllSeries();

  return (
    <PageSection
      eyebrow="Series"
      title="专题"
      subtitle={`${seriesList.length} 个专题 · 按连续路径阅读文章`}
    >
      {seriesList.length === 0 ? (
        <p className="text-[var(--text-dim)]">暂无专题</p>
      ) : (
        <div className="archive-grid archive-grid--2">
          {seriesList.map((series) => (
            <ArchiveCard
              key={series.slug}
              href={`/series/${encodeURIComponent(series.slug)}`}
              title={series.name}
              countLabel={`${series.count} 篇`}
              meta={`${formatDate(series.startDate)} - ${formatDate(series.endDate)}`}
            >
              <ol className="archive-card__sequence">
                {series.posts.slice(0, 4).map((post, index) => (
                  <li key={post.slug} className="archive-card__sequence-item">
                    <span className="archive-card__sequence-index">{index + 1}</span>
                    <span className="archive-card__sequence-title">{post.title}</span>
                  </li>
                ))}
              </ol>
            </ArchiveCard>
          ))}
        </div>
      )}
    </PageSection>
  );
}
