import Link from 'next/link';
import { getAllSeriesSlugs, getSeriesBySlug } from '@/lib/series';
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
    <section className="section">
      <div className="section__inner">
        <div className="section__head" style={{ marginBottom: 24 }}>
          <div>
            <span className="section__eyebrow">Series</span>
            <h2 className="section__title">专题：{series.name}</h2>
            <p className="section__subtitle">
              {series.count} 篇文章 · {formatDate(series.startDate)} -{' '}
              {formatDate(series.endDate)}
            </p>
          </div>
        </div>

        <ol className="grid gap-4">
          {series.posts.map((post, index) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group grid gap-4 rounded-xl border border-[var(--border)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:bg-[var(--bg-soft)] md:grid-cols-[auto_1fr_auto]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--brand)]">
                    {post.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm text-[var(--text-dim)]">
                    {post.description}
                  </span>
                </span>
                <span className="text-sm text-[var(--text-dim)]">
                  {formatDate(post.date)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  ),
});

export { generateStaticParams, generateMetadata };
export default SeriesDetailPage;
