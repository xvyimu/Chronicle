import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReadingPathItem } from './ReadingPathSection';

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

import ReadingPathSection from './ReadingPathSection';

const mockPaths: ReadingPathItem[] = [
  {
    title: '部署与运维',
    description: '从 VPS 初始化到 CI/CD 实践',
    href: '/blog?tag=deploy',
    meta: 'DevOps · 6 articles',
    topics: ['Docker', 'Nginx', 'CI/CD'],
  },
  {
    title: '性能优化',
    description: 'Web 性能分析和优化方法',
    href: '/blog?tag=performance',
    meta: 'Performance · 4 articles',
    topics: ['Lighthouse', 'Bundle', 'CDN'],
  },
];

describe('ReadingPathSection', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the section title', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('阅读路径')).toBeInTheDocument();
  });

  it('renders all path titles and descriptions', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('部署与运维')).toBeInTheDocument();
    expect(screen.getByText('性能优化')).toBeInTheDocument();
    expect(screen.getByText('从 VPS 初始化到 CI/CD 实践')).toBeInTheDocument();
    expect(screen.getByText('Web 性能分析和优化方法')).toBeInTheDocument();
  });

  it('renders path meta info and topic tags', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('DevOps · 6 articles')).toBeInTheDocument();
    expect(screen.getByText('Performance · 4 articles')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('Lighthouse')).toBeInTheDocument();
  });

  it('renders path items as links to correct href', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('部署与运维').closest('a')).toHaveAttribute(
      'href',
      '/blog?tag=deploy',
    );
    expect(screen.getByText('性能优化').closest('a')).toHaveAttribute(
      'href',
      '/blog?tag=performance',
    );
  });

  it('renders the category link', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('全部分类').closest('a')).toHaveAttribute(
      'href',
      '/categories',
    );
  });

  it('has accessible heading', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByLabelText('阅读路径')).toBeInTheDocument();
  });
});
