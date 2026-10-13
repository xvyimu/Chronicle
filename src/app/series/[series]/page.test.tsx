import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

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

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import SeriesDetailPage, { generateMetadata } from './page';
import { getSeriesBySlug } from '@/server/content';

describe('SeriesDetailPage', () => {
  it('returns metadata for a known series', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ series: '个人服务部署路线' }),
    });

    expect(metadata.title).toBe('专题：个人服务部署路线');
  });

  it('renders series posts in reading order', async () => {
    const jsx = await SeriesDetailPage({
      params: Promise.resolve({ series: '个人服务部署路线' }),
    });
    render(jsx);

    expect(
      screen.getByRole('heading', { level: 1, name: '专题：个人服务部署路线' }),
    ).toBeInTheDocument();

    const list = screen.getByRole('list');
    const links = within(list).getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/blog/vps-initial-setup');
    expect(links[1]).toHaveAttribute('href', '/blog/docker-deploy-guide');
    expect(links[2]).toHaveAttribute('href', '/blog/nginx-reverse-proxy');
    expect(links[0]).toHaveTextContent('VPS 初始化安全与运维配置清单');
    expect(links[0].closest('li')).toHaveTextContent('新 VPS 上线前');
    const series = getSeriesBySlug('个人服务部署路线');
    expect(series?.posts[0].readingTime).toBeTruthy();
    expect(links[0].closest('li')).toHaveTextContent(series!.posts[0].readingTime);
    expect(within(links[0].closest('li')!).getByRole('time')).toHaveAttribute(
      'datetime',
      '2026-06-23',
    );
  });
});
