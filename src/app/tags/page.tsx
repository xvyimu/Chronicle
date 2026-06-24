import Link from 'next/link';
import { getAllTags } from '@/lib/tags';

export default function TagsPage() {
  const tags = getAllTags();
  const maxCount = Math.max(...tags.map((t) => t.count), 1);

  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Tags</span>
            <h2 className="section__title">标签</h2>
            <p className="section__subtitle">{tags.length} 个标签 · 按主题浏览文章</p>
          </div>
        </div>
        {tags.length === 0 ? (
          <p className="text-[var(--text-dim)]">暂无标签</p>
        ) : (
          <>
            {/* 标签云 — 桌面端 */}
            <div className="hidden md:flex flex-wrap justify-center gap-4 py-12">
              {tags.map((t) => {
                const ratio = t.count / maxCount;
                const size = Math.max(ratio * 1.8 + 0.6, 0.9);
                const opacity = Math.max(ratio * 0.5 + 0.4, 0.5);
                return (
                  <Link
                    key={t.slug}
                    href={`/tags/${t.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2 transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-md hover:-translate-y-0.5"
                    style={{
                      fontSize: `${size}rem`,
                      opacity,
                    }}
                  >
                    {t.tag}
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: 'var(--brand-soft)',
                        color: 'var(--brand)',
                        fontSize: `${Math.max(size - 0.2, 0.7)}rem`,
                      }}
                    >
                      {t.count}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* 标签列表 — 移动端 */}
            <div className="md:hidden flex flex-wrap gap-3">
              {tags.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tags/${t.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-sm transition-all hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  {t.tag}
                  <span className="text-xs text-[var(--text-dim)]">{t.count}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
