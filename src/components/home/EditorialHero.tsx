import Link from 'next/link';

interface EditorialHeroProps {
  postCount: number;
  projectCount: number;
}

const heroSignals = [
  { label: 'Technical Notes', value: '实践笔记' },
  { label: 'Open Source Work', value: '开源作品' },
  { label: 'Curated Links', value: '个人收藏' },
];

export default function EditorialHero({
  postCount,
  projectCount,
}: EditorialHeroProps) {
  return (
    <section className="editorial-hero" aria-labelledby="home-hero-title">
      <div className="editorial-hero__topline" aria-hidden="true">
        <span>西江月</span>
        <span>云原生 · 全栈 · 自动化</span>
      </div>

      <div className="editorial-hero__stage">
        <div className="editorial-hero__media" aria-hidden="true">
          <div className="editorial-hero__plane editorial-hero__plane--back" />
          <div className="editorial-hero__plane editorial-hero__plane--front" />
          <div className="editorial-hero__mesh" />
          <div className="editorial-hero__code editorial-hero__code--one">
            pnpm test
          </div>
          <div className="editorial-hero__code editorial-hero__code--two">
            deploy --quiet
          </div>
        </div>

        <div className="editorial-hero__content">
          <p className="editorial-hero__kicker">Zero-noise knowledge base</p>
          <h1 id="home-hero-title" className="editorial-hero__title">
            <span>Build Quiet Systems,</span>
            <span>Write Useful Notes.</span>
          </h1>
          <p className="editorial-hero__summary">
            云原生、全栈、自动化与个人收藏。把踩过的坑、验证过的工具和可复用的经验，整理成能再次打开的入口。
          </p>

          <div className="editorial-hero__actions">
            <Link href="/blog" className="btn btn--primary">
              精选文章
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/links" className="btn btn--ghost">
              导航收藏
            </Link>
            <Link href="/about" className="editorial-hero__text-link">
              关于本站
            </Link>
          </div>
        </div>

        <div className="editorial-hero__metrics" aria-label="站点统计">
          <div>
            <strong>{postCount}</strong>
            <span>技术文章</span>
          </div>
          <div>
            <strong>{projectCount}</strong>
            <span>开源项目</span>
          </div>
        </div>

        <div className="editorial-hero__rail" aria-label="首页入口">
          {heroSignals.map((signal) => (
            <div key={signal.label} className="editorial-hero__signal">
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
