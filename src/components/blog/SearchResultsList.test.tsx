import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import SearchResultsList from './SearchResultsList';

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

describe('SearchResultsList empty state', () => {
  it('offers series, garden, and projects exits when no matches', () => {
    render(
      <SearchResultsList
        query="zzz-no-match"
        fuseReady
        results={[]}
        error={null}
        retryAfterSeconds={null}
        activeIndex={-1}
        listRef={createRef<HTMLDivElement>()}
      />,
    );

    expect(screen.getByText('没有匹配的文章')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看全部文章' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(screen.getByRole('link', { name: '浏览标签' })).toHaveAttribute(
      'href',
      '/tags',
    );
    expect(screen.getByRole('link', { name: '浏览专题' })).toHaveAttribute(
      'href',
      '/series',
    );
    expect(screen.getByRole('link', { name: '数字花园' })).toHaveAttribute(
      'href',
      '/garden',
    );
    expect(screen.getByRole('link', { name: '看作品' })).toHaveAttribute(
      'href',
      '/projects',
    );
  });
});
