import Link from 'next/link';
import type { PostMeta } from '@/types';

export default function ArticleNav({
  prev,
  next,
}: {
  prev: PostMeta | null;
  next: PostMeta | null;
}) {
  return (
    <nav className="article-nav">
      <div className="article-nav__item">
        {prev && (
          <Link href={`/blog/${prev.slug}`} className="article-nav__link">
            <span className="article-nav__kicker">← 上一篇</span>
            <p className="article-nav__title">{prev.title}</p>
          </Link>
        )}
      </div>
      <div className="article-nav__item article-nav__item--next">
        {next && (
          <Link href={`/blog/${next.slug}`} className="article-nav__link">
            <span className="article-nav__kicker">下一篇 →</span>
            <p className="article-nav__title">{next.title}</p>
          </Link>
        )}
      </div>
    </nav>
  );
}
