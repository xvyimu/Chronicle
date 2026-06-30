import type { Metadata } from 'next';
import BlogList from '@/components/blog/BlogList';
import SearchBar from '@/components/blog/SearchBar';
import Pagination from '@/components/blog/Pagination';
import { getPaginatedPosts, getAllPosts } from '@/lib/posts';
import { PAGE_SIZE } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '博客',
  description: '浏览全部文章 — 涵盖云原生、全栈开发、自动化、数据库、DevOps 等工程实践。',
  path: '/blog',
});

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const { posts, totalPages, currentPage } = getPaginatedPosts(page, PAGE_SIZE);
  const allPosts = getAllPosts();

  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Blog</span>
            <h2 className="section__title">博客</h2>
            <p className="section__subtitle">{totalPages > 0 ? `第 ${currentPage}/${totalPages} 页` : ''}</p>
          </div>
        </div>
        <SearchBar posts={allPosts} />
        <BlogList posts={posts} columns={2} />
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </section>
  );
}