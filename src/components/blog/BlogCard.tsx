import Link from 'next/link';
import { PostMeta } from '@/types';
import { formatDate } from '@/lib/utils';
import MagneticCard from '@/components/ui/MagneticCard';

export default function BlogCard({ post }: { post: PostMeta }) {
  return (
    <MagneticCard className="blog__item group">
      <div className="blog__meta">
        <time className="blog__date" dateTime={post.date}>{formatDate(post.date)}</time>
        {post.tags.length > 0 && (
          <span className="blog__tag">{post.tags[0]}</span>
        )}
        {post.featured && (
          <span className="blog__featured">精选</span>
        )}
      </div>
      <h3 className="blog__title group-hover:text-[var(--brand)] transition-colors duration-300">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>
      <p className="blog__excerpt">{post.description}</p>
      <div className="flex items-center justify-between mt-auto">
        {post.readingTime && (
          <span className="blog__date">{post.readingTime}</span>
        )}
        <span className="blog__more">
          阅读更多
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </MagneticCard>
  );
}
