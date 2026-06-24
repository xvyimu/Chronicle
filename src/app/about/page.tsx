import MdxContent from '@/components/blog/MdxContent';
import { SITE_CONFIG } from '@/lib/constants';
import { getAboutContent } from '@/lib/about';

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
