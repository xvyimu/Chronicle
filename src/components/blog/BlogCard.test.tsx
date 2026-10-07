import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

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

import BlogCard from './BlogCard';
import type { PostMeta } from '@/types';

const makePost = (overrides: Partial<PostMeta> & { slug: string }): PostMeta => ({
  title: `Post ${overrides.slug}`,
  description: 'A test description',
  date: '2026-06-01',
  tags: [],
  published: true,
  featured: false,
  readingTime: '5 min read',
  wordCount: 100,
  excerpt: 'excerpt',
  ...overrides,
});

describe('BlogCard', () => {
  beforeEach(() => cleanup());

  it('renders post title as a link', () => {
    const post = makePost({ slug: 'test-post', title: 'Test Post Title' });
    render(<BlogCard post={post} />);
    const link = screen.getByRole('link', { name: /Test Post Title/ });
    expect(link).toHaveAttribute('href', '/blog/test-post');
  });

  it('renders description', () => {
    const post = makePost({ slug: 'test-post', description: 'An interesting read' });
    render(<BlogCard post={post} />);
    expect(screen.getByText('An interesting read')).toBeInTheDocument();
  });

  it('renders date', () => {
    const post = makePost({ slug: 'p', date: '2026-01-15' });
    render(<BlogCard post={post} />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('renders reading time', () => {
    const post = makePost({ slug: 'p', readingTime: '10 min read' });
    render(<BlogCard post={post} />);
    expect(screen.getByText('10 min read')).toBeInTheDocument();
  });

  it('renders category when present', () => {
    const post = makePost({ slug: 'p', category: '前端' });
    render(<BlogCard post={post} />);
    expect(screen.getByText('前端')).toBeInTheDocument();
  });

  it('renders tags when present', () => {
    const post = makePost({ slug: 'p', tags: ['react', 'typescript'] });
    render(<BlogCard post={post} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('renders featured badge for featured posts', () => {
    const post = makePost({ slug: 'p', featured: true });
    render(<BlogCard post={post} />);
    expect(screen.getByText('精选')).toBeInTheDocument();
  });

  it('does not render featured badge for non-featured posts', () => {
    const post = makePost({ slug: 'p', featured: false });
    render(<BlogCard post={post} />);
    expect(screen.queryByText('精选')).not.toBeInTheDocument();
  });

  it('does not use a magnetic/animated wrapper', () => {
    const post = makePost({ slug: 'p' });
    const { container } = render(<BlogCard post={post} />);
    expect(container.querySelector('.magnetic-card')).toBeNull();
  });
});
