import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllCategories } from '@/lib/categories';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '分类',
  description: '按领域浏览文章 — 前端、后端、数据库、DevOps、CI/CD、云服务等。',
  path: '/categories',
});

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Categories</span>
            <h2 className="section__title">分类</h2>
            <p className="section__subtitle">{categories.length} 个分类 · 按领域浏览文章</p>
          </div>
        </div>
        {categories.length === 0 ? (
          <p className="text-[var(--text-dim)]">暂无分类</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 py-8">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${encodeURIComponent(cat.slug)}`}
                className="group rounded-xl border border-[var(--border)] p-6 transition-all hover:border-[var(--brand)] hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">
                    {cat.name}
                  </h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      background: 'var(--brand-soft)',
                      color: 'var(--brand)',
                    }}
                  >
                    {cat.count} 篇
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2 py-0.5 text-xs"
                      style={{ background: 'var(--bg-soft)', color: 'var(--text-dim)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
