import type { Metadata } from 'next';
import BlogList from '@/components/blog/BlogList';
import SearchBar from '@/components/blog/SearchBar';
import Pagination from '@/components/blog/Pagination';
import PageSection from '@/components/layout/PageSection';
import { getPaginatedPosts, getAllPosts } from '@/lib/posts';
import { PAGE_SIZE } from '@/lib/content-dirs';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '博客',
  description: '浏览全部文章 — 涵盖云原生、全栈开发、自动化、数据库、DevOps 等工程实践。',
  path: '/blog',
});

type BlogPageSearchParams = {
  page?: string | string[];
};

function parsePageParam(rawPage: BlogPageSearchParams['page']): number {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  if (!value) return 1;
  const page = Number(value);
  return Number.isFinite(page) ? page : 1;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<BlogPageSearchParams>;
} = {}) {
  const requestedPage = parsePageParam((await searchParams)?.page);
  const allPosts = getAllPosts();
  const { posts, totalPages, currentPage } = getPaginatedPosts(requestedPage, PAGE_SIZE);

  return (
    <PageSection
      eyebrow="Blog"
      title="博客"
      subtitle={totalPages > 0 ? `共 ${allPosts.length} 篇` : ''}
    >
      <SearchBar posts={allPosts} />
      <BlogList posts={posts} columns={2} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </PageSection>
  );
}
