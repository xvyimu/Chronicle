import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ArticleNeighbors from './ArticleNeighbors';
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

function post(slug: string, title: string): PostMeta {
  return {
    slug,
    title,
    description: 'd',
    date: '2026-06-01',
    tags: [],
    published: true,
    featured: false,
    readingTime: '1 min',
    wordCount: 10,
    excerpt: 'e',
    headings: [],
    searchText: title,
  };
}

describe('ArticleNeighbors', () => {
  it('renders nothing when both lists empty', () => {
    const { container } = render(<ArticleNeighbors outbound={[]} inbound={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists outbound and inbound inside details', () => {
    render(
      <ArticleNeighbors
        outbound={[post('nginx-reverse-proxy', 'Nginx')]}
        inbound={[post('vps-initial-setup', 'VPS')]}
      />,
    );
    expect(screen.getByText('邻接笔记')).toBeInTheDocument();
    expect(screen.getByText(/出 1/)).toBeInTheDocument();
    const nginx = screen.getByRole('link', { name: /Nginx/ });
    expect(nginx).toHaveAttribute('href', '/blog/nginx-reverse-proxy');
    const vps = screen.getByRole('link', { name: /VPS/ });
    expect(vps).toHaveAttribute('href', '/blog/vps-initial-setup');
    expect(screen.getByRole('link', { name: /打开全站花园/ })).toHaveAttribute(
      'href',
      '/garden',
    );
  });
});
