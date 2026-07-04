import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Mock next/link
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

import EditorialHero from './EditorialHero';

describe('EditorialHero', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the title', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText('Build Quiet Systems,')).toBeInTheDocument();
    expect(screen.getByText('Write Useful Notes.')).toBeInTheDocument();
  });

  it('renders the kicker', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText('Zero-noise knowledge base')).toBeInTheDocument();
  });

  it('renders the summary', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText(/云原生、全栈、自动化与个人收藏/)).toBeInTheDocument();
  });

  it('renders post and project counts', () => {
    render(<EditorialHero postCount={42} projectCount={7} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders metric labels', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText('技术文章')).toBeInTheDocument();
    expect(screen.getByText('开源项目')).toBeInTheDocument();
  });

  it('renders CTA links', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    const articlesLink = screen.getByText('精选文章').closest('a');
    expect(articlesLink).toHaveAttribute('href', '/blog');

    const navLink = screen.getByText('导航收藏').closest('a');
    expect(navLink).toHaveAttribute('href', '/links');

    const aboutLink = screen.getByText('关于本站').closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('renders hero signals', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText('实践笔记')).toBeInTheDocument();
    expect(screen.getByText('开源作品')).toBeInTheDocument();
    expect(screen.getByText('个人收藏')).toBeInTheDocument();
  });

  it('renders the topline text', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText('云原生 · 全栈 · 自动化')).toBeInTheDocument();
  });

  it('has accessible heading', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    const section = screen.getByLabelText('站点统计');
    expect(section).toBeInTheDocument();
  });
});
