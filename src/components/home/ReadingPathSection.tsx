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
            <h2 id="home-path-title" className="section__title">
              阅读路径
            </h2>
            <p className="section__subtitle">
              从部署、性能、数据库和 TypeScript 四条路径开始，把零散文章串成连续路线。
            </p>
          </div>
          <div className="section__action">
            <Link href="/categories" className="section__link">
              全部分类
            </Link>
          </div>
        </div>

        <div className="home-path__grid">
          {paths.map((path) => (
            <Link key={path.title} href={path.href} className="home-path__item">
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
