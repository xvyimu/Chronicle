import type { Metadata } from 'next';
import Link from 'next/link';
import LocalReadingList from '@/components/blog/LocalReadingList';
import PageSection from '@/components/layout/PageSection';
import { getAllPosts } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '我的阅读',
  description: '本地保存的收藏与最近阅读 — 仅存于你的浏览器，不涉及账号。',
  path: '/favorites',
});

export default function FavoritesPage() {
  const posts = getAllPosts();

  return (
    <PageSection
      eyebrow="My Reading"
      title="我的阅读"
      subtitle="收藏与最近阅读保存在本地浏览器，不上传、不需要账号"
      action={
        <Link href="/blog" className="section__link">
          全部文章
        </Link>
      }
    >
      <div className="local-reading-grid">
        <LocalReadingList posts={posts} mode="favorites" title="收藏" />
        <LocalReadingList posts={posts} mode="recent" title="最近阅读" />
      </div>
    </PageSection>
  );
}
