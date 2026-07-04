import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { PostMeta } from '@/types';

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

// Mock formatDate
vi.mock('@/lib/utils', () => ({
  formatDate: vi.fn((date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }),
}));

import FeaturedArticleRail from './FeaturedArticleRail';

const mockPosts: PostMeta[] = [
  {
    slug: 'post-1',
    title: 'Post One',
    description: 'First post description',
    date: '2026-06-15',
    tags: ['React'],
    category: '前端开发',
    published: true,
    featured: false,
    readingTime: '5 min read',
    wordCount: 1200,
    excerpt: 'First post excerpt',
    headings: [],
    searchText: '',
  },
  {
    slug: 'post-2',
    title: 'Post Two',
    description: 'Second post description',
    date: '2026-06-10',
    tags: ['TypeScript'],
    category: '类型系统',
    published: true,
    featured: true,
    readingTime: '3 min read',
    wordCount: 800,
    excerpt: 'Second post excerpt',
    headings: [],
    searchText: '',
  },
];

describe('FeaturedArticleRail', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('returns null when posts is empty', () => {
    const { container } = render(<FeaturedArticleRail posts={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the section title', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('最新文章')).toBeInTheDocument();
  });

  it('renders all post titles', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('Post One')).toBeInTheDocument();
    expect(screen.getByText('Post Two')).toBeInTheDocument();
  });

  it('renders post descriptions', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('First post description')).toBeInTheDocument();
    expect(screen.getByText('Second post description')).toBeInTheDocument();
  });

  it('renders post dates', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('2026-06-15')).toBeInTheDocument();
    expect(screen.getByText('2026-06-10')).toBeInTheDocument();
  });

  it('renders category and first tag', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('前端开发')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders reading time', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByText('3 min read')).toBeInTheDocument();
  });

  it('renders numbered indicators', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('renders post links to /blog/:slug', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    const postOneLink = screen.getByText('Post One').closest('a');
    expect(postOneLink).toHaveAttribute('href', '/blog/post-1');

    const postTwoLink = screen.getByText('Post Two').closest('a');
    expect(postTwoLink).toHaveAttribute('href', '/blog/post-2');
  });

  it('renders "查看全部" link pointing to /blog', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    const allLink = screen.getByText('查看全部').closest('a');
    expect(allLink).toHaveAttribute('href', '/blog');
  });

  it('renders the eyebrow text', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('Featured Articles')).toBeInTheDocument();
  });

  it('has accessible heading', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    const section = screen.getByLabelText('最新文章');
    expect(section).toBeInTheDocument();
  });
});
