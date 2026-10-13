import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PostMeta } from '@/types';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import ArticleRelated from './ArticleRelated';

const POSTS: PostMeta[] = [
  {
    slug: 'next-post',
    title: '下一篇文章',
    description: '下一篇摘要',
    date: '2026-06-02',
    tags: ['Next.js'],
    category: '前端开发',
    published: true,
    featured: false,
    readingTime: '5 min read',
    wordCount: 100,
    excerpt: '下一篇摘要',
  },
  {
    slug: 'other-post',
    title: '其他相关文章',
    description: '其他摘要',
    date: '2026-06-01',
    tags: ['Next.js'],
    published: true,
    featured: false,
    readingTime: '4 min read',
    wordCount: 80,
    excerpt: '其他摘要',
  },
];

describe('ArticleRelated', () => {
  it('labels the next series article as the primary continuation', () => {
    render(<ArticleRelated posts={POSTS} nextInSeriesSlug="next-post" />);

    expect(screen.getByRole('heading', { name: '继续阅读' })).toBeInTheDocument();
    expect(screen.getByText('专题下一篇')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '继续：下一篇文章' })).toHaveAttribute(
      'href',
      '/blog/next-post',
    );
    expect(screen.getByText('下一篇', { selector: 'span' })).toBeInTheDocument();
  });

  it('keeps the related label when there is no next article in the series', () => {
    render(<ArticleRelated posts={POSTS} />);

    expect(screen.getByRole('heading', { name: '相关文章' })).toBeInTheDocument();
    expect(screen.queryByText('专题下一篇')).not.toBeInTheDocument();
  });
});
