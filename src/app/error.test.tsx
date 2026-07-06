import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './error';

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

describe('ErrorBoundary', () => {
  it('keeps retry and provides safe navigation routes', () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error('boom')} reset={reset} />);

    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '回到首页' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '看博客' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: '打开导航收藏' })).toHaveAttribute(
      'href',
      '/links',
    );
  });
});
