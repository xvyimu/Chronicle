import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getPaginatedPosts } from '@/lib/posts';
import { PAGE_SIZE } from '@/lib/content-dirs';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/navigation useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}));

import BlogPage from '@/app/blog/page';

async function renderBlogPage(searchParams?: { page?: string | string[] }) {
  render(await BlogPage({ searchParams: Promise.resolve(searchParams ?? {}) }));
}

describe('BlogPage', () => {
  beforeEach(() => {
    cleanup();
    mockPush.mockClear();
  });

  it('renders the blog page title', async () => {
    await renderBlogPage();
    expect(screen.getByText('博客')).toBeInTheDocument();
  });

  it('renders search bar with all posts', async () => {
    await renderBlogPage();
    expect(screen.getByPlaceholderText(/搜索文章/)).toBeInTheDocument();
  });

  it('links to category and series discovery pages', async () => {
    await renderBlogPage();
    expect(screen.getByRole('link', { name: '按分类' })).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(screen.getByRole('link', { name: '看专题' })).toHaveAttribute(
      'href',
      '/series',
    );
  });

  it('renders blog post cards for the first page', async () => {
    await renderBlogPage();

    const { posts } = getPaginatedPosts(1, PAGE_SIZE);
    for (const post of posts) {
      expect(screen.getByText(post.title)).toBeInTheDocument();
    }
  });

  it('renders blog post cards for the requested page', async () => {
    const { posts: pageTwoPosts, totalPages } = getPaginatedPosts(2, PAGE_SIZE);
    if (totalPages <= 1) return;

    await renderBlogPage({ page: '2' });

    for (const post of pageTwoPosts) {
      expect(screen.getByText(post.title)).toBeInTheDocument();
    }
    expect(
      screen.queryByText(getPaginatedPosts(1, PAGE_SIZE).posts[0].title),
    ).not.toBeInTheDocument();
  });

  it('falls back to the first page for invalid page values', async () => {
    await renderBlogPage({ page: 'not-a-number' });

    const { posts } = getPaginatedPosts(1, PAGE_SIZE);
    expect(screen.getByText(posts[0].title)).toBeInTheDocument();
  });

  it('shows total post count in subtitle', async () => {
    await renderBlogPage();

    const { totalPosts } = getPaginatedPosts(1, PAGE_SIZE);
    if (totalPosts > 0) {
      expect(screen.getByText(new RegExp(`共 ${totalPosts} 篇`))).toBeInTheDocument();
    }
  });

  it('renders pagination when multiple pages exist', async () => {
    const { totalPages } = getPaginatedPosts(1, PAGE_SIZE);
    await renderBlogPage();

    if (totalPages > 1) {
      const nav = screen.getByRole('navigation', { hidden: true });
      expect(nav).toBeInTheDocument();
    }
  });
});
