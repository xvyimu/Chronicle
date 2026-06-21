import Container from '@/components/ui/Container';
import BlogList from '@/components/blog/BlogList';
import Pagination from '@/components/blog/Pagination';
import { getPaginatedPosts } from '@/lib/posts';
import { PAGE_SIZE } from '@/lib/constants';

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { posts, totalPages, currentPage } = getPaginatedPosts(page, PAGE_SIZE);

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold">博客</h1>
      <BlogList posts={posts} columns={2} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </Container>
  );
}