import type { Metadata } from 'next';
import Link from 'next/link';
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
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Series</span>
            <h2 className="section__title">专题</h2>
            <p className="section__subtitle">
              {seriesList.length} 个专题 · 按连续路径阅读文章
            </p>
          </div>
        </div>

        {seriesList.length === 0 ? (
          <p className="text-[var(--text-dim)]">暂无专题</p>
        ) : (
          <div className="grid gap-5 py-8 md:grid-cols-2">
            {seriesList.map((series) => (
              <Link
                key={series.slug}
                href={`/series/${encodeURIComponent(series.slug)}`}
                className="group min-w-0 rounded-xl border border-[var(--border)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[var(--text)] transition-colors group-hover:text-[var(--brand)]">
                      {series.name}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-dim)]">
                      {formatDate(series.startDate)} - {formatDate(series.endDate)}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
                  >
                    {series.count} 篇
                  </span>
                </div>

                <ol className="mt-5 grid min-w-0 gap-2">
                  {series.posts.slice(0, 4).map((post, index) => (
                    <li
                      key={post.slug}
                      className="flex min-w-0 items-center gap-3 text-sm text-[var(--text-soft)]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs text-[var(--text-dim)]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 truncate">{post.title}</span>
                    </li>
                  ))}
                </ol>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
