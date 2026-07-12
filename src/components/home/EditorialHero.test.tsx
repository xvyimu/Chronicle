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

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    placeholder?: string;
    blurDataURL?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={String(src)} alt={alt ?? ''} {...props} />
  ),
}));

import EditorialHero from './EditorialHero';

describe('EditorialHero', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the Paper Gallery title', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('renders the kicker and summary', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText('Paper Gallery')).toBeInTheDocument();
    expect(screen.getByText(/验证过的经验/)).toBeInTheDocument();
  });

  it('renders post and project counts', () => {
    render(<EditorialHero postCount={42} projectCount={7} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('篇文章')).toBeInTheDocument();
    expect(screen.getByText('个项目')).toBeInTheDocument();
  });

  it('renders the two primary CTA links', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByText('进入文章').closest('a')).toHaveAttribute('href', '/blog');
    expect(screen.getByText('打开收藏').closest('a')).toHaveAttribute('href', '/links');
  });

  it('renders the local visual asset', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByAltText('个人博客首页界面预览')).toHaveAttribute(
      'src',
      '/images/projects/blog.png',
    );
  });

  it('has accessible overview label', () => {
    render(<EditorialHero postCount={5} projectCount={3} />);
    expect(screen.getByLabelText('站点概览')).toBeInTheDocument();
  });
});
