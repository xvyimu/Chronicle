import type { Metadata } from 'next';
import Link from 'next/link';
import EmptyState from '@/components/layout/EmptyState';
import PageSection from '@/components/layout/PageSection';
import { getAllPosts } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';
import { formatDate } from '@/lib/utils';
import type { PostMeta } from '@/types';

export const metadata: Metadata = buildPageMetadata({
  title: '归档',
  description: '按时间浏览全部文章 — 从最近到最早，一眼看到更新节奏。',
  path: '/archive',
});

/** 按年份分组（posts 已按日期倒序）。 */
function groupByYear(posts: PostMeta[]): Array<[string, PostMeta[]]> {
  const groups = new Map<string, PostMeta[]>();
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    const bucket = groups.get(year);
    if (bucket) bucket.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()];
}

export default function ArchivePage() {
  const posts = getAllPosts();
  const groups = groupByYear(posts);

  return (
    <PageSection
      eyebrow="Archive"
      title="归档"
      subtitle={`${posts.length} 篇文章 · 按时间倒序`}
      action={
        <Link href="/blog" className="section__link">
          全部文章
        </Link>
      }
    >
      {posts.length === 0 ? (
        <EmptyState title="暂无文章" description="发布文章后会在这里按时间归档。" />
      ) : (
        <div className="archive-timeline">
          {groups.map(([year, yearPosts]) => (
            <section key={year} className="archive-timeline__year">
              <h2 className="archive-timeline__year-label">{year}</h2>
              <ul className="archive-timeline__list">
                {yearPosts.map((post) => (
                  <li key={post.slug} className="archive-timeline__item">
                    <time className="archive-timeline__date" dateTime={post.date}>
                      {formatDate(post.date)}
                    </time>
                    <Link href={`/blog/${post.slug}`} className="archive-timeline__title">
                      {post.title}
                    </Link>
                    {post.category && (
                      <span className="archive-timeline__chip">{post.category}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageSection>
  );
}
