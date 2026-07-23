import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { imageBlurProps } from '@/lib/image-blur-data';

interface EditorialHeroProps {
  postCount: number;
  projectCount: number;
}

const HERO_IMAGE = '/images/projects/blog.png';

/** Display width of the hero frame at desktop (≥1024px). Mobile/tablet use near-full viewport. */
const HERO_SIZES = '(max-width: 1023px) 92vw, 420px';

export default function EditorialHero({ postCount, projectCount }: EditorialHeroProps) {
  return (
    <section className="editorial-hero" aria-labelledby="home-hero-title">
      <div className="editorial-hero__stage">
        <div className="editorial-hero__content">
          <p className="editorial-hero__kicker">Paper Gallery</p>
          <h1 id="home-hero-title" className="editorial-hero__title">
            <span>Notes</span>
            <span>Archive</span>
          </h1>
          <p className="editorial-hero__summary">
            这里收纳云原生、全栈、自动化和个人收藏，把验证过的经验整理成下一次能直接打开的入口。
          </p>

          <div className="editorial-hero__actions">
            <Button asChild size="cta">
              <Link href="/blog">进入文章</Link>
            </Button>
            <Button asChild size="cta" variant="outline">
              <Link href="/links">打开收藏</Link>
            </Button>
          </div>
        </div>

        <div className="editorial-hero__visual" aria-label="站点概览">
          <div className="editorial-hero__image-frame">
            <Image
              src={HERO_IMAGE}
              alt="个人博客首页界面预览"
              fill
              preload
              fetchPriority="high"
              quality={70}
              sizes={HERO_SIZES}
              className="editorial-hero__image"
              {...imageBlurProps(HERO_IMAGE)}
            />
          </div>
          <div className="editorial-hero__metrics">
            <div>
              <strong>{postCount}</strong>
              <span>篇文章</span>
            </div>
            <div>
              <strong>{projectCount}</strong>
              <span>个项目</span>
            </div>
          </div>
          <p className="editorial-hero__visual-note">
            文章、项目和链接都按长期复用来整理，少一点噪音，多一点可回访的线索。
          </p>
        </div>
      </div>
    </section>
  );
}
