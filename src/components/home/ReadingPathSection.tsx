import Link from 'next/link';

export interface ReadingPathItem {
  title: string;
  description: string;
  href: string;
  meta: string;
  topics: string[];
}

interface ReadingPathSectionProps {
  paths: ReadingPathItem[];
}

export default function ReadingPathSection({ paths }: ReadingPathSectionProps) {
  return (
    <section className="section home-path" aria-labelledby="home-path-title">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Reading Path</span>
            <h2 id="home-path-title" className="section__title">按主题进入</h2>
            <p className="section__subtitle">
              从部署、性能、数据库和 TypeScript 四条路径开始，把文章串成可连续阅读的路线。
            </p>
          </div>
          <div className="section__action">
            <Link href="/categories" className="section__link">
              全部分类
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="home-path__grid">
          {paths.map((path, index) => (
            <Link key={path.title} href={path.href} className="home-path__item">
              <span className="home-path__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="home-path__meta">{path.meta}</span>
              <h3 className="home-path__title">{path.title}</h3>
              <p className="home-path__desc">{path.description}</p>
              <span className="home-path__topics">
                {path.topics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
