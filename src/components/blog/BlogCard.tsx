import Link from 'next/link';
import { PostMeta } from '@/types';
import { formatDate } from '@/lib/utils';

/**
 * 文章卡片 —— 无大封面图的轻量卡片（Iteration 04）。
 *
 * 每项：标题 / 摘要 / 分类 / 标签 / 日期 / 阅读时间 + 悬停箭头。
 * 不使用 3D 倾斜或光斑跟随（去掉 MagneticCard），只保留低对比背景与轻箭头反馈。
 */
export default function BlogCard({ post }: { post: PostMeta }) {
  return (
    <article className="blog__item">
      <div className="blog__meta">
        <time className="blog__date" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
        {post.category && <span className="blog__category">{post.category}</span>}
        {post.featured && <span className="blog__featured">精选</span>}
      </div>
      <h3 className="blog__title">
        <Link href={`/blog/${post.slug}`} className="blog__title-link">
          {post.title}
        </Link>
      </h3>
      <p className="blog__excerpt">{post.description}</p>
      <div className="blog__foot">
        <div className="blog__tags">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="blog__tag">
              {tag}
            </span>
          ))}
        </div>
        <span className="blog__more">
          {post.readingTime}
          <span className="blog__arrow" aria-hidden="true">
            →
          </span>
        </span>
      </div>
    </article>
  );
}
