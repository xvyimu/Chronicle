import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/components/blog/MdxContent', () => ({
  default: ({ source }: { source: string }) => <div data-testid="mdx-content">{source.slice(0, 24)}</div>,
}));

vi.mock('@/components/blog/TableOfContents', () => ({
  default: () => <nav aria-label="目录" />,
}));

vi.mock('@/components/blog/ReadingProgress', () => ({
  default: () => <div data-testid="reading-progress" />,
}));

vi.mock('@/components/blog/ReadingPreferences', () => ({
  default: () => <div data-testid="reading-preferences" />,
}));

vi.mock('@/components/comments/Giscus', () => ({
  default: () => <div data-testid="comments" />,
}));

import BlogPostPage, { generateMetadata } from '@/app/blog/[slug]/page';

describe('BlogPostPage', () => {
  it('returns metadata title without duplicating the site name', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'docker-deploy-guide' }),
    });

    expect(metadata.title).toBe('Docker 容器部署实战：从零搭建 Node.js 应用');
  });

  it('renders the reading path for a series post', async () => {
    const jsx = await BlogPostPage({
      params: Promise.resolve({ slug: 'docker-deploy-guide' }),
    });
    render(jsx);

    const section = screen.getByRole('region', { name: '专题阅读路径' });
    expect(within(section).getByText('个人服务部署路线')).toBeInTheDocument();
    expect(within(section).getByText('第 2 / 5 篇')).toBeInTheDocument();
    expect(within(section).getByText('当前阅读')).toBeInTheDocument();
    expect(
      within(section).getByRole('link', { name: /VPS 初始化安全与运维配置清单/ }),
    ).toHaveAttribute('href', '/blog/vps-initial-setup');
    expect(
      within(section).getByText('Docker 容器部署实战：从零搭建 Node.js 应用'),
    ).toBeInTheDocument();
  });

  it('does not render a reading path for standalone posts', async () => {
    const jsx = await BlogPostPage({
      params: Promise.resolve({ slug: 'go-cli-tool' }),
    });
    render(jsx);

    expect(screen.queryByRole('region', { name: '专题阅读路径' })).not.toBeInTheDocument();
  });
});
