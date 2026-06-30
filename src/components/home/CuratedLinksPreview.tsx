import Link from 'next/link';
import { LinkCategory } from '@/lib/links';

interface CuratedLinksPreviewProps {
  categories: LinkCategory[];
}

export default function CuratedLinksPreview({ categories }: CuratedLinksPreviewProps) {
  if (categories.length === 0) return null;

  return (
    <section className="section home-links-preview" aria-labelledby="home-links-title">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Curated Links</span>
            <h2 id="home-links-title" className="section__title">个人收藏入口</h2>
            <p className="section__subtitle">
              长期会反复打开的 AI、工程文档、自托管和 VPS 资料，统一收在导航页。
            </p>
          </div>
          <div className="section__action">
            <Link href="/links" className="section__link">
              打开导航
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="home-links-preview__grid">
          {categories.map((category) => (
            <article key={category.id} className="home-links-preview__group">
              <div className="home-links-preview__top">
                <h3>{category.title}</h3>
                <span>{category.items.length} links</span>
              </div>
              <p>{category.description}</p>
              <ul>
                {category.items.slice(0, 3).map((item) => (
                  <li key={item.title}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <span>{item.title}</span>
                      <small>{item.description}</small>
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
