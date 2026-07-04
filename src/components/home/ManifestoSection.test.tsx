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

import ManifestoSection from './ManifestoSection';

describe('ManifestoSection', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the index title and lead', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('从这里进入')).toBeInTheDocument();
    expect(screen.getByText(/三条最常用的路径/)).toBeInTheDocument();
  });

  it('renders the three homepage index entries', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('文章')).toBeInTheDocument();
    expect(screen.getByText('收藏')).toBeInTheDocument();
    expect(screen.getByText('项目')).toBeInTheDocument();
  });

  it('renders English labels for quick scanning', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders action links with correct hrefs', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('浏览文章').closest('a')).toHaveAttribute('href', '/blog');
    expect(screen.getByText('打开导航').closest('a')).toHaveAttribute('href', '/links');
    expect(screen.getByText('查看作品').closest('a')).toHaveAttribute(
      'href',
      '/projects',
    );
  });

  it('has accessible heading', () => {
    render(<ManifestoSection />);
    expect(screen.getByLabelText('从这里进入')).toBeInTheDocument();
  });
});
