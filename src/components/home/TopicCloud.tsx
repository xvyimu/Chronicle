import Link from 'next/link';
import type { TagInfo } from '@/types';

interface TopicCloudProps {
  tags: TagInfo[];
  /** 最多展示的主题数。 */
  limit?: number;
}

/**
 * 热门主题云 —— 工作台首页的主题入口（圆角标签）。
 */
export default function TopicCloud({ tags, limit = 12 }: TopicCloudProps) {
  const top = [...tags].sort((a, b) => b.count - a.count).slice(0, limit);
  if (top.length === 0) return null;

  return (
    <section className="ws-topics" aria-labelledby="home-topics-title">
      <h2 id="home-topics-title" className="ws-section__title">
        热门主题
      </h2>
      <ul className="ws-topics__list">
        {top.map((tag) => (
          <li key={tag.slug}>
            <Link
              href={`/tags/${encodeURIComponent(tag.slug)}`}
              className="ws-topics__item"
            >
              {tag.tag}
              <span className="ws-topics__count">{tag.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
