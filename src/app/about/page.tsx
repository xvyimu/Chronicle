import type { Metadata } from 'next';
import MdxContent from '@/components/blog/MdxContent';
import PageSection from '@/components/layout/PageSection';
import { SITE_CONFIG } from '@/lib/site';
import { getAboutContent } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '关于',
  description: `了解 ${SITE_CONFIG.name} — ${SITE_CONFIG.description}`,
  path: '/about',
});

export default function AboutPage() {
  const content = getAboutContent();

  return (
    <PageSection eyebrow="About" title="关于" subtitle="了解这个博客和它背后的技术">
      <article className="page-prose">
        {content ? (
          <MdxContent source={content} />
        ) : (
          <div className="page-prose__fallback">
            <p>欢迎来到 {SITE_CONFIG.name}。</p>
            <p>{SITE_CONFIG.description}</p>
          </div>
        )}
      </article>
    </PageSection>
  );
}
