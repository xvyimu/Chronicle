import type { Metadata } from 'next';
import ArchiveCard from '@/components/layout/ArchiveCard';
import PageSection from '@/components/layout/PageSection';
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
    <PageSection
      eyebrow="Categories"
      title="分类"
      subtitle={`${categories.length} 个分类 · 按领域浏览文章`}
    >
      {categories.length === 0 ? (
        <p className="text-[var(--text-dim)]">暂无分类</p>
      ) : (
        <div className="archive-grid archive-grid--3">
          {categories.map((cat) => (
            <ArchiveCard
              key={cat.slug}
              href={`/categories/${encodeURIComponent(cat.slug)}`}
              title={cat.name}
              countLabel={`${cat.count} 篇`}
              tags={cat.tags}
            />
          ))}
        </div>
      )}
    </PageSection>
  );
}
