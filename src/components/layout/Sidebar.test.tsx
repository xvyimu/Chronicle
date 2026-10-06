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

const mockPathname = vi.fn().mockReturnValue('/');
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-pathname': mockPathname() }),
}));

import Sidebar from './Sidebar';

async function renderSidebar() {
  const ui = await Sidebar();
  return render(ui);
}

describe('Sidebar', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  it('renders all main navigation links', async () => {
    await renderSidebar();
    for (const label of ['首页', '文章', '专题', '分类', '标签', '作品', '关于']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('does not render links to removed routes', async () => {
    await renderSidebar();
    expect(screen.queryByText('花园')).not.toBeInTheDocument();
    expect(screen.queryByText('导航')).not.toBeInTheDocument();
  });

  it('marks the current section as active', async () => {
    mockPathname.mockReturnValue('/blog');
    await renderSidebar();
    expect(screen.getByText('文章').className).toContain('sidebar__link--active');
    expect(screen.getByText('首页').className).not.toContain('sidebar__link--active');
  });

  it('exposes active state to assistive technology', async () => {
    mockPathname.mockReturnValue('/blog/some-post');
    await renderSidebar();
    expect(screen.getByRole('link', { name: '文章' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('has an accessible navigation landmark', async () => {
    await renderSidebar();
    expect(screen.getByLabelText('站点导航')).toBeInTheDocument();
  });
});
