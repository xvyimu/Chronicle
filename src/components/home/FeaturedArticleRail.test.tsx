import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { PostMeta } from '@/types';

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

vi.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
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

  it('renders the section title and lead label', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('最近整理')).toBeInTheDocument();
    expect(screen.getByText('Lead note')).toBeInTheDocument();
  });

  it('renders all post titles', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('Post One')).toBeInTheDocument();
    expect(screen.getByText('Post Two')).toBeInTheDocument();
  });

  it('renders the featured post description', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('First post description')).toBeInTheDocument();
  });

  it('renders post dates, category and first tag', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('2026-06-15')).toBeInTheDocument();
    expect(screen.getByText('2026-06-10')).toBeInTheDocument();
    expect(screen.getByText('前端开发')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('React')).toHaveAttribute('data-slot', 'badge');
  });

  it('renders reading time', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByText('3 min read')).toBeInTheDocument();
  });

  it('renders post links to /blog/:slug', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('Post One').closest('a')).toHaveAttribute(
      'href',
      '/blog/post-1',
    );
    expect(screen.getByText('Post Two').closest('a')).toHaveAttribute(
      'href',
      '/blog/post-2',
    );
  });

  it('renders the all posts link', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByText('查看全部').closest('a')).toHaveAttribute('href', '/blog');
  });

  it('has accessible heading', () => {
    render(<FeaturedArticleRail posts={mockPosts} />);
    expect(screen.getByLabelText('最近整理')).toBeInTheDocument();
  });
});
