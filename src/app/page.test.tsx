import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SITE_CONFIG } from '@/lib/constants';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProjects } from '@/lib/projects';

// Mock next/link as a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock SpeedInsights and Analytics
vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));

import HomePage from '@/app/page';

describe('HomePage', () => {
  beforeEach(() => cleanup());

  it('renders the hero section with tagline', () => {
    render(<HomePage />);
    expect(screen.getByText('Build Quiet Systems,')).toBeInTheDocument();
    expect(screen.getByText('Write Useful Notes.')).toBeInTheDocument();
  });

  it('renders hero CTA links', () => {
    render(<HomePage />);
    const heroActions = document.querySelector('.editorial-hero__actions');
    expect(heroActions!.querySelector('a[href="/blog"]')).toHaveTextContent('精选文章');
    expect(heroActions!.querySelector('a[href="/links"]')).toHaveTextContent('导航收藏');
    expect(heroActions!.querySelector('a[href="/about"]')).toHaveTextContent('关于本站');
  });

  it('renders editorial hero signal rail', () => {
    render(<HomePage />);
    expect(screen.getByText('Technical Notes')).toBeInTheDocument();
    expect(screen.getByText('Open Source Work')).toBeInTheDocument();
    expect(screen.getAllByText('Curated Links').length).toBeGreaterThan(0);
  });

  it('renders latest posts section with up to 4 posts', () => {
    render(<HomePage />);
    const allPosts = getAllPosts();

    expect(screen.getByText('最新文章')).toBeInTheDocument();

    const renderedTitles = [
      ...allPosts.filter((post) => post.featured),
      ...allPosts.filter((post) => !post.featured),
    ].slice(0, 6).map((p) => p.title);
    for (const title of renderedTitles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('renders the manifesto and reading path sections', () => {
    render(<HomePage />);

    expect(screen.getByText('把零散经验整理成下一次能直接复用的入口。')).toBeInTheDocument();
    expect(screen.getByText('少一点噪音，多一点可复用经验')).toBeInTheDocument();
    expect(screen.getByText('按主题进入')).toBeInTheDocument();
    expect(screen.getByText('个人服务部署路线')).toBeInTheDocument();
    expect(screen.getByText('Web 性能与体验')).toBeInTheDocument();
    expect(screen.getByText('数据层实践')).toBeInTheDocument();
    expect(screen.getByText('TypeScript 与全栈')).toBeInTheDocument();
  });

  it('renders curated links preview', () => {
    render(<HomePage />);

    expect(screen.getByText('个人收藏入口')).toBeInTheDocument();
    expect(screen.getByText('AI 工具')).toBeInTheDocument();
    expect(screen.getByText('技术文档与工程实践')).toBeInTheDocument();
    expect(screen.getByText('自托管与可观测性')).toBeInTheDocument();
    expect(screen.getByText('VPS 与主机商')).toBeInTheDocument();
    expect(screen.getByText('BandwagonHost')).toBeInTheDocument();
  });

  it('renders featured projects section', () => {
    render(<HomePage />);
    const featured = getFeaturedProjects();

    if (featured.length > 0) {
      expect(screen.getByText('作品验证场')).toBeInTheDocument();
      for (const project of featured) {
        expect(screen.getByText(project.title)).toBeInTheDocument();
      }
    }
  });

  it('displays post count in hero stats', () => {
    render(<HomePage />);
    const allPosts = getAllPosts();
    expect(screen.getByText(allPosts.length.toString())).toBeInTheDocument();
  });
});
