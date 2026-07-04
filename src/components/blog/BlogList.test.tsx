import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PostMeta } from '@/types';

// Mock BlogCard to isolate BlogList tests
vi.mock('./BlogCard', () => ({
  default: ({ post }: { post: PostMeta }) => (
    <article data-testid="blog-card">{post.title}</article>
  ),
}));

import BlogList from './BlogList';

const makePost = (slug: string, title?: string): PostMeta => ({
  slug,
  title: title ?? `Post ${slug}`,
  description: 'desc',
  date: '2026-06-01',
  tags: [],
  published: true,
  featured: false,
  readingTime: '5 min read',
  wordCount: 100,
  excerpt: 'excerpt',
  headings: [],
  searchText: 'search',
});

describe('BlogList', () => {
  it('renders posts as BlogCards', () => {
    const posts = [makePost('a', 'First'), makePost('b', 'Second')];
    render(<BlogList posts={posts} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getAllByTestId('blog-card')).toHaveLength(2);
  });

  it('renders empty state when no posts', () => {
    render(<BlogList posts={[]} />);
    expect(screen.getByText('暂无文章')).toBeInTheDocument();
  });

  it('applies correct grid columns for columns=1', () => {
    const posts = [makePost('a')];
    const { container } = render(<BlogList posts={posts} columns={1} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
  });

  it('applies correct grid columns for columns=2', () => {
    const posts = [makePost('a')];
    const { container } = render(<BlogList posts={posts} columns={2} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
  });

  it('applies correct grid columns for columns=3', () => {
    const posts = [makePost('a')];
    const { container } = render(<BlogList posts={posts} columns={3} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
  });

  it('defaults to 2 columns', () => {
    const posts = [makePost('a')];
    const { container } = render(<BlogList posts={posts} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('md:grid-cols-2');
  });
});
