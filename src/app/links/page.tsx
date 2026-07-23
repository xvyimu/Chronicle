import type { Metadata } from 'next';
import { LinksDirectory } from '@/components/links/LinksDirectory';
import PageSection from '@/components/layout/PageSection';
import { getAllLinkCategories } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '导航',
  description: '精选技术文档、VPS 官网、开发工具和趣味小站 — 工程师的阅读收藏夹。',
  path: '/links',
});

export default function LinksPage() {
  // Server-load catalog once; LinksDirectory SSRs the full grid and only
  // hydrates the search island (see CH-PERF-007).
  const linkCategories = getAllLinkCategories();
  const totalLinks = linkCategories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );

  return (
    <PageSection
      eyebrow="Links"
      title="导航"
      subtitle={`${linkCategories.length} 个分类 · ${totalLinks} 个站点`}
    >
      <LinksDirectory categories={linkCategories} />
    </PageSection>
  );
}
