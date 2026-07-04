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

import ManifestoSection from './ManifestoSection';

describe('ManifestoSection', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the section title', () => {
    render(<ManifestoSection />);
    expect(
      screen.getByText('把零散经验整理成下一次能直接复用的入口。'),
    ).toBeInTheDocument();
  });

  it('renders all three manifesto items', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });

  it('renders Why / How / What labels', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('Why')).toBeInTheDocument();
    expect(screen.getByText('How')).toBeInTheDocument();
    expect(screen.getByText('What')).toBeInTheDocument();
  });

  it('renders item titles', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('少一点噪音，多一点可复用经验')).toBeInTheDocument();
    expect(screen.getByText('文章、专题、项目和收藏互相连接')).toBeInTheDocument();
    expect(screen.getByText('配置清单、性能实践和工具入口')).toBeInTheDocument();
  });

  it('renders action links with correct hrefs', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('看站点说明').closest('a')).toHaveAttribute('href', '/about');
    expect(screen.getByText('浏览分类').closest('a')).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(screen.getByText('进入文章').closest('a')).toHaveAttribute('href', '/blog');
  });

  it('renders the eyebrow text', () => {
    render(<ManifestoSection />);
    expect(screen.getByText('Manifesto')).toBeInTheDocument();
  });

  it('has accessible heading', () => {
    render(<ManifestoSection />);
    const section = screen.getByLabelText('把零散经验整理成下一次能直接复用的入口。');
    expect(section).toBeInTheDocument();
  });
});
