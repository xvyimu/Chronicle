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

import HomeCtaSection from './HomeCtaSection';

describe('HomeCtaSection', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the section title', () => {
    render(<HomeCtaSection />);
    expect(screen.getByText('保持连接')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<HomeCtaSection />);
    expect(screen.getByText(/欢迎在评论区留言/)).toBeInTheDocument();
  });

  it('renders eyebrow text', () => {
    render(<HomeCtaSection />);
    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
  });

  it('renders about link', () => {
    render(<HomeCtaSection />);
    const aboutLink = screen.getByText('关于我').closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('renders GitHub link with correct href', () => {
    render(<HomeCtaSection />);
    const ghLink = screen.getByText('GitHub').closest('a');
    expect(ghLink).toHaveAttribute('href', 'https://github.com/yuanjia1314');
    expect(ghLink).toHaveAttribute('target', '_blank');
  });

  it('renders navigation link', () => {
    render(<HomeCtaSection />);
    const navLink = screen.getByText('导航收藏').closest('a');
    expect(navLink).toHaveAttribute('href', '/links');
  });

  it('renders GitHub SVG icon', () => {
    render(<HomeCtaSection />);
    const ghLink = screen.getByText('GitHub');
    expect(ghLink.closest('a')?.querySelector('svg')).toBeInTheDocument();
  });

  it('has accessible aria-label', () => {
    render(<HomeCtaSection />);
    const section = screen.getByLabelText('了解更多');
    expect(section).toBeInTheDocument();
  });
});
