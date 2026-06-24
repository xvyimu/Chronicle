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

// Mock ParticleCanvas — uses canvas APIs not available in jsdom
vi.mock('@/components/ui/ParticleCanvas', () => ({
  default: () => <div data-testid="particle-canvas" />,
}));

// Mock SpeedInsights and Analytics
vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));

import HomePage from '@/app/page';

describe('HomePage', () => {
  beforeEach(() => cleanup());

  it('renders the hero section with site name', () => {
    render(<HomePage />);
    expect(screen.getByText(SITE_CONFIG.name)).toBeInTheDocument();
  });

  it('renders hero CTA links', () => {
    render(<HomePage />);
    expect(screen.getByText('精选文章').closest('a')).toHaveAttribute('href', '/blog');
    expect(screen.getByText('关于本站').closest('a')).toHaveAttribute('href', '/about');
  });

  it('renders latest posts section with up to 4 posts', () => {
    render(<HomePage />);
    const allPosts = getAllPosts();

    expect(screen.getByText('最新文章')).toBeInTheDocument();

    const renderedTitles = allPosts.slice(0, 4).map((p) => p.title);
    for (const title of renderedTitles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('renders featured projects section', () => {
    render(<HomePage />);
    const featured = getFeaturedProjects();

    if (featured.length > 0) {
      expect(screen.getByText('精选作品')).toBeInTheDocument();
      for (const project of featured) {
        expect(screen.getByText(project.title)).toBeInTheDocument();
      }
    }
  });

  it('displays post count in hero stats', () => {
    render(<HomePage />);
    const allPosts = getAllPosts();
    const expectedCount = Math.min(allPosts.length, 4);
    expect(screen.getByText(expectedCount.toString())).toBeInTheDocument();
  });
});
