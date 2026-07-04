import type { Metadata } from 'next';
import MdxContent from '@/components/blog/MdxContent';
import { SITE_CONFIG } from '@/lib/site';
import { getAboutContent } from '@/lib/about';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '关于',
  description: `了解 ${SITE_CONFIG.name} — ${SITE_CONFIG.description}`,
  path: '/about',
});

export default function AboutPage() {
  const content = getAboutContent();

  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">About</span>
            <h2 className="section__title">关于</h2>
            <p className="section__subtitle">了解这个博客和它背后的技术</p>
          </div>
        </div>
        <article className="mx-auto" style={{ maxWidth: 720 }}>
          {content ? (
            <MdxContent source={content} />
          ) : (
            <div className="space-y-4 text-[var(--text-soft)]">
              <p>欢迎来到 {SITE_CONFIG.name}。</p>
              <p>{SITE_CONFIG.description}</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
