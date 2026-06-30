import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getPaginatedPosts, getAllPosts } from '@/lib/posts';
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

  it('renders the blog page title', () => {
    render(<BlogPage />);
    expect(screen.getByText('博客')).toBeInTheDocument();
  });

  it('renders search bar with all posts', () => {
    render(<BlogPage />);
    expect(screen.getByPlaceholderText(/搜索文章/)).toBeInTheDocument();
  });

  it('renders blog post cards for the first page', () => {
    render(<BlogPage />);

    const { posts } = getPaginatedPosts(1, PAGE_SIZE);
    for (const post of posts) {
      expect(screen.getByText(post.title)).toBeInTheDocument();
    }
  });

  it('shows total post count in subtitle', () => {
    render(<BlogPage />);

    const allPosts = getAllPosts();
    if (allPosts.length > 0) {
      expect(screen.getByText(new RegExp(`共 ${allPosts.length} 篇`))).toBeInTheDocument();
    }
  });

  it('renders pagination when multiple pages exist', () => {
    const { totalPages } = getPaginatedPosts(1, PAGE_SIZE);
    render(<BlogPage />);

    if (totalPages > 1) {
      const nav = screen.getByRole('navigation', { hidden: true });
      expect(nav).toBeInTheDocument();
    }
  });
});
