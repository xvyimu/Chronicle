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
      screen.getByRole('heading', { name: '专题：个人服务部署路线' }),
    ).toBeInTheDocument();

    const list = screen.getByRole('list');
    const links = within(list).getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/blog/vps-initial-setup');
    expect(links[1]).toHaveAttribute('href', '/blog/docker-deploy-guide');
    expect(links[2]).toHaveAttribute('href', '/blog/nginx-reverse-proxy');
  });
});
