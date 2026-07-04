import type { Metadata } from 'next';
import Link from 'next/link';
import PageSection from '@/components/layout/PageSection';
import MetaBadge from '@/components/ui/MetaBadge';
import { getAllTags } from '@/lib/tags';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '标签',
  description: '按主题浏览文章 — 所有标签按权重排列，快速定位感兴趣的内容。',
  path: '/tags',
});

export default function TagsPage() {
  const tags = getAllTags();
  const maxCount = Math.max(...tags.map((t) => t.count), 1);

  return (
    <PageSection
      eyebrow="Tags"
      title="标签"
      subtitle={`${tags.length} 个标签 · 按主题浏览文章`}
    >
      {tags.length === 0 ? (
        <p className="text-[var(--text-dim)]">暂无标签</p>
      ) : (
        <div className="tag-cloud">
          {tags.map((t) => {
            const ratio = t.count / maxCount;
            const size = Math.max(ratio * 1.2 + 0.78, 0.92);
            const opacity = Math.max(ratio * 0.32 + 0.68, 0.68);
            return (
              <Link
                key={t.slug}
                href={`/tags/${t.slug}`}
                className="tag-cloud__item"
                style={{
                  fontSize: `${size}rem`,
                  opacity,
                }}
              >
                {t.tag}
                <MetaBadge variant="secondary" className="tag-cloud__count">
                  {t.count}
                </MetaBadge>
              </Link>
            );
          })}
        </div>
      )}
    </PageSection>
  );
}
