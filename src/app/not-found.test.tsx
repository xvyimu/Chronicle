import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

import NotFound from './not-found';

describe('NotFound', () => {
  it('offers clear routes back into core content', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '回到首页' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '看博客' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: '打开导航收藏' })).toHaveAttribute(
      'href',
      '/links',
    );
  });
});
