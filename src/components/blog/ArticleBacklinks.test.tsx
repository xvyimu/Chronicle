import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { PostMeta } from '@/types';
import ArticleBacklinks from './ArticleBacklinks';

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

function makePost(
  overrides: Partial<PostMeta> & { slug: string; title: string },
): PostMeta {
  return {
    description: 'desc',
    date: '2026-06-22',
    tags: [],
    published: true,
    featured: false,
    readingTime: '3 min read',
    wordCount: 100,
    excerpt: 'excerpt',
    headings: [],
    searchText: overrides.title,
    ...overrides,
  };
}

describe('ArticleBacklinks', () => {
  it('renders empty state copy inside the panel', () => {
    render(<ArticleBacklinks posts={[]} />);

    const section = screen.getByRole('region', { name: '反向链接' });
    expect(within(section).getByText('Backlinks')).toBeInTheDocument();
    expect(within(section).getByText('暂无其他文章链到此处')).toBeInTheDocument();
    expect(within(section).queryByRole('link')).not.toBeInTheDocument();
  });

  it('lists inbound posts with href and title', () => {
    const posts = [
      makePost({
        slug: 'vps-initial-setup',
        title: 'VPS 初始化安全与运维配置清单',
        date: '2026-06-23',
      }),
      makePost({
        slug: 'nginx-reverse-proxy',
        title: 'Nginx 反向代理与负载均衡实战',
        date: '2026-06-24',
      }),
    ];

    render(<ArticleBacklinks posts={posts} />);

    const section = screen.getByRole('region', { name: '反向链接' });
    const vps = within(section).getByRole('link', {
      name: /VPS 初始化安全与运维配置清单/,
    });
    expect(vps).toHaveAttribute('href', '/blog/vps-initial-setup');
    const nginx = within(section).getByRole('link', {
      name: /Nginx 反向代理与负载均衡实战/,
    });
    expect(nginx).toHaveAttribute('href', '/blog/nginx-reverse-proxy');
  });
});
