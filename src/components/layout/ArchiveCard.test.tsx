import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ArchiveCard from './ArchiveCard';

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

describe('ArchiveCard', () => {
  it('renders a linked archive card with metadata badges', () => {
    render(
      <ArchiveCard
        href="/categories/frontend"
        title="前端"
        countLabel="12 篇"
        meta="2026年7月"
        tags={['React', 'Next.js']}
      />,
    );

    expect(screen.getByRole('link', { name: /前端/ })).toHaveAttribute(
      'href',
      '/categories/frontend',
    );
    expect(screen.getByRole('heading', { name: '前端' })).toHaveClass(
      'archive-card__title',
    );
    expect(screen.getByText('12 篇')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('React')).toHaveClass('archive-card__tag');
    expect(screen.getByText('2026年7月')).toHaveClass('archive-card__meta');
  });
});
