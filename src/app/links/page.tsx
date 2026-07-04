import type { Metadata } from 'next';
import { LinksDirectory } from '@/components/links/LinksDirectory';
import { getAllLinkCategories } from '@/lib/links';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '导航',
  description: '精选技术文档、VPS 官网、开发工具和趣味小站 — 工程师的阅读收藏夹。',
  path: '/links',
});

export default function LinksPage() {
  const linkCategories = getAllLinkCategories();

  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Links</span>
            <h2 className="section__title">导航</h2>
            <p className="section__subtitle">
              精选技术文档、VPS 官网、开发工具和趣味小站
            </p>
          </div>
        </div>

        <LinksDirectory categories={linkCategories} />
      </div>
    </section>
  );
}
