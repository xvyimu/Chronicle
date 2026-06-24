import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getPaginatedPosts } from '@/lib/posts';
import { PAGE_SIZE } from '@/lib/constants';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import BlogPage from '@/app/blog/page';

describe('BlogPage', () => {
  beforeEach(() => {
    cleanup();
    mockPush.mockClear();
  });

  it('renders the blog page title', async () => {
    const jsx = await BlogPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByText('博客')).toBeInTheDocument();
  });

  it('renders search bar with all posts', async () => {
    const jsx = await BlogPage({ searchParams: Promise.resolve({}) });
    render(jsx);
    expect(screen.getByPlaceholderText(/搜索文章/)).toBeInTheDocument();
  });

  it('renders blog post cards for the first page', async () => {
    const jsx = await BlogPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    const { posts } = getPaginatedPosts(1, PAGE_SIZE);
    for (const post of posts) {
      expect(screen.getByText(post.title)).toBeInTheDocument();
    }
  });

  it('shows page info in subtitle', async () => {
    const jsx = await BlogPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    const { totalPages, currentPage } = getPaginatedPosts(1, PAGE_SIZE);
    if (totalPages > 0) {
      expect(screen.getByText(new RegExp(`第 ${currentPage}/${totalPages} 页`))).toBeInTheDocument();
    }
  });

  it('renders pagination when multiple pages exist', async () => {
    const { totalPages } = getPaginatedPosts(1, PAGE_SIZE);
    const jsx = await BlogPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    if (totalPages > 1) {
      // Pagination should be visible
      const nav = screen.getByRole('navigation', { hidden: true });
      expect(nav).toBeInTheDocument();
    }
  });

  it('handles page parameter correctly', async () => {
    const jsx = await BlogPage({ searchParams: Promise.resolve({ page: '2' }) });
    render(jsx);

    const { currentPage } = getPaginatedPosts(2, PAGE_SIZE);
    if (currentPage > 1) {
      expect(screen.getByText(new RegExp(`第 ${currentPage}/`))).toBeInTheDocument();
    }
  });

  it('falls back to page 1 for invalid page parameter', async () => {
    const jsx = await BlogPage({ searchParams: Promise.resolve({ page: 'abc' }) });
    render(jsx);

    expect(screen.getByText(new RegExp('第 1/'))).toBeInTheDocument();
  });
});
