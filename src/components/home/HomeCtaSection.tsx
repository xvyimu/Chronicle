import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site';

export default function HomeCtaSection() {
  return (
    <section className="section home-cta" aria-labelledby="home-signature-title">
      <div className="section__inner">
        <div className="home-cta__card">
          <div className="home-cta__mark" aria-hidden="true">
            记
          </div>
          <div className="home-cta__content">
            <h2 id="home-signature-title" className="home-cta__title">
              留一间安静的工作室
            </h2>
            <p className="home-cta__desc">
              这里会持续整理实践、工具和项目样本。遇到更好的做法，可以在文章评论里补充，也可以到
              GitHub 继续讨论。
            </p>
          </div>

          <div className="home-cta__actions">
            <Link href="/about" className="btn btn--primary">
              关于我
            </Link>

            <a
              href={SITE_CONFIG.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
            >
              GitHub
            </a>

            <a href="/feed.xml" className="btn btn--ghost">
              RSS
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
