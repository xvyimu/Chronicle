import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

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

import Pagination from './Pagination';

describe('Pagination', () => {
  beforeEach(() => cleanup());

  it('returns null when totalPages <= 1', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders page numbers', () => {
    render(<Pagination currentPage={1} totalPages={3} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks current page with aria-current="page"', () => {
    render(<Pagination currentPage={2} totalPages={3} />);
    const current = screen.getByText('2');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('renders prev link when not on first page', () => {
    render(<Pagination currentPage={2} totalPages={3} />);
    expect(screen.getByText(/上一页/)).toBeInTheDocument();
  });

  it('does not render prev link on first page', () => {
    render(<Pagination currentPage={1} totalPages={3} />);
    expect(screen.queryByText(/上一页/)).not.toBeInTheDocument();
  });

  it('renders next link when not on last page', () => {
    render(<Pagination currentPage={1} totalPages={3} />);
    expect(screen.getByText(/下一页/)).toBeInTheDocument();
  });

  it('does not render next link on last page', () => {
    render(<Pagination currentPage={3} totalPages={3} />);
    expect(screen.queryByText(/下一页/)).not.toBeInTheDocument();
  });

  it('uses basePath for page 1 href', () => {
    render(<Pagination currentPage={1} totalPages={2} basePath="/blog" />);
    const link1 = screen.getByText('1');
    expect(link1).toHaveAttribute('href', '/blog');
  });

  it('uses basePath with ?page= for page 2+ href', () => {
    render(<Pagination currentPage={2} totalPages={3} basePath="/blog" />);
    const link2 = screen.getByText('2');
    expect(link2).toHaveAttribute('href', '/blog?page=2');
  });

  it('uses default basePath /blog when not specified', () => {
    render(<Pagination currentPage={2} totalPages={3} />);
    const link2 = screen.getByText('2');
    expect(link2).toHaveAttribute('href', '/blog?page=2');
  });

  it('correctly sets prev link to basePath when currentPage is 2', () => {
    render(<Pagination currentPage={2} totalPages={3} basePath="/blog" />);
    const prevLink = screen.getByText(/上一页/);
    expect(prevLink).toHaveAttribute('href', '/blog');
  });

  it('sets prev link to ?page=N-1 when currentPage > 2', () => {
    render(<Pagination currentPage={3} totalPages={5} basePath="/blog" />);
    const prevLink = screen.getByText(/上一页/);
    expect(prevLink).toHaveAttribute('href', '/blog?page=2');
  });
});
