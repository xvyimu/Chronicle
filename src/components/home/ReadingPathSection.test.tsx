import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReadingPathItem } from './ReadingPathSection';

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
    expect(screen.getByText('按主题进入')).toBeInTheDocument();
  });

  it('renders all path titles', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('部署与运维')).toBeInTheDocument();
    expect(screen.getByText('性能优化')).toBeInTheDocument();
  });

  it('renders path descriptions', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('从 VPS 初始化到 CI/CD 实践')).toBeInTheDocument();
    expect(screen.getByText('Web 性能分析和优化方法')).toBeInTheDocument();
  });

  it('renders path meta info', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('DevOps · 6 articles')).toBeInTheDocument();
    expect(screen.getByText('Performance · 4 articles')).toBeInTheDocument();
  });

  it('renders topic tags', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('Nginx')).toBeInTheDocument();
    expect(screen.getByText('CI/CD')).toBeInTheDocument();
    expect(screen.getByText('Lighthouse')).toBeInTheDocument();
    expect(screen.getByText('Bundle')).toBeInTheDocument();
    expect(screen.getByText('CDN')).toBeInTheDocument();
  });

  it('renders indexed numbers', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('renders path items as links to correct href', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    const deployLink = screen.getByText('部署与运维').closest('a');
    expect(deployLink).toHaveAttribute('href', '/blog?tag=deploy');

    const perfLink = screen.getByText('性能优化').closest('a');
    expect(perfLink).toHaveAttribute('href', '/blog?tag=performance');
  });

  it('renders "全部分类" link', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    const catLink = screen.getByText('全部分类').closest('a');
    expect(catLink).toHaveAttribute('href', '/categories');
  });

  it('renders the eyebrow text', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    expect(screen.getByText('Reading Path')).toBeInTheDocument();
  });

  it('has accessible heading', () => {
    render(<ReadingPathSection paths={mockPaths} />);
    const section = screen.getByLabelText('按主题进入');
    expect(section).toBeInTheDocument();
  });
});
