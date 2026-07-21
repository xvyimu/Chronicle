import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

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

// Mock next/navigation usePathname
const mockPathname = vi.fn().mockReturnValue('/');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock ThemeToggle
vi.mock('@/components/ui/ThemeToggle', () => ({
  default: () => <button type="button" aria-label="切换主题" />,
}));

import Header from './Header';

describe('Header', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the site name', () => {
    render(<Header />);
    expect(screen.getByText('西江月')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<Header />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('博客')).toBeInTheDocument();
    expect(screen.getByText('花园')).toBeInTheDocument();
    expect(screen.getByText('导航')).toBeInTheDocument();
    expect(screen.getByText('分类')).toBeInTheDocument();
    expect(screen.getByText('专题')).toBeInTheDocument();
    expect(screen.getByText('作品')).toBeInTheDocument();
    expect(screen.getByText('关于')).toBeInTheDocument();
  });

  it('marks home link as active when on home page', () => {
    mockPathname.mockReturnValue('/');
    render(<Header />);
    const homeLink = screen.getByText('首页');
    expect(homeLink.className).toContain('header__link--active');
  });

  it('marks blog link as active when on /blog', () => {
    mockPathname.mockReturnValue('/blog');
    render(<Header />);
    const blogLink = screen.getByText('博客');
    expect(blogLink.className).toContain('header__link--active');
    // Home should NOT be active
    expect(screen.getByText('首页').className).not.toContain('header__link--active');
  });

  it('exposes active navigation state to assistive technology', () => {
    mockPathname.mockReturnValue('/blog');
    render(<Header />);

    expect(screen.getByRole('link', { name: '博客' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '首页' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks blog link as active when on /blog/some-post', () => {
    mockPathname.mockReturnValue('/blog/test-post');
    render(<Header />);
    expect(screen.getByText('博客').className).toContain('header__link--active');
  });

  it('marks series link as active when on /series/some-series', () => {
    mockPathname.mockReturnValue('/series/personal-deploy');
    render(<Header />);
    expect(screen.getByText('专题').className).toContain('header__link--active');
  });

  it('does not highlight home for sub-pages', () => {
    mockPathname.mockReturnValue('/about');
    render(<Header />);
    expect(screen.getByText('首页').className).not.toContain('header__link--active');
  });

  it('renders ThemeToggle', () => {
    render(<Header />);
    expect(screen.getByLabelText('切换主题')).toBeInTheDocument();
  });

  it('renders a search shortcut link', () => {
    render(<Header />);
    expect(screen.getByLabelText('搜索文章')).toHaveAttribute(
      'href',
      '/blog?focus=search',
    );
  });

  it('renders mobile menu toggle button', () => {
    render(<Header />);
    const menuBtn = screen.getByLabelText('打开菜单');
    expect(menuBtn).toBeInTheDocument();
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    expect(menuBtn).toHaveAttribute('aria-controls', 'mobile-nav');
  });

  it('toggles mobile menu on click', () => {
    render(<Header />);
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(screen.getByLabelText('关闭菜单')).toBeInTheDocument();
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus into the mobile navigation when the menu opens', async () => {
    render(<Header />);

    const trigger = screen.getByLabelText('打开菜单');
    trigger.focus();
    fireEvent.click(trigger);

    const mobileNav = await screen.findByLabelText('主导航', {
      selector: '#mobile-nav',
    });
    const firstLink = mobileNav.querySelector('a');
    expect(firstLink).toBeInstanceOf(HTMLAnchorElement);
    if (!(firstLink instanceof HTMLAnchorElement)) {
      throw new Error('Expected the mobile navigation to render a link.');
    }
    await waitFor(() => {
      expect(firstLink).toHaveFocus();
    });
  });

  it('closes mobile menu when pathname changes', () => {
    mockPathname.mockReturnValue('/');
    render(<Header />);
    const menuBtn = screen.getByLabelText('打开菜单');

    // Open menu
    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    // Simulate pathname change
    cleanup();
    mockPathname.mockReturnValue('/blog');
    render(<Header />);
    const newMenuBtn = screen.getByLabelText('打开菜单');
    expect(newMenuBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes mobile menu when backdrop is clicked', async () => {
    render(<Header />);
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    // Sheet portal mounts the overlay with the legacy backdrop class
    const backdrop = await waitFor(() => {
      const node = document.querySelector('.header__backdrop');
      expect(node).toBeInTheDocument();
      return node as Element;
    });
    fireEvent.pointerDown(backdrop);
    fireEvent.click(backdrop);
    await waitFor(() => {
      expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('closes mobile menu when Escape is pressed', async () => {
    render(<Header />);
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('renders brand link pointing to /', () => {
    render(<Header />);
    const brandLink = screen.getByText('西江月').closest('a');
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('applies scrolled class when scrolled past threshold', () => {
    render(<Header />);
    const headerEl = document.querySelector('header');
    expect(headerEl?.className).not.toContain('is-scrolled');

    fireEvent.scroll(window, { target: { scrollY: 20 } });
    expect(headerEl?.className).toContain('is-scrolled');
  });

  it('has proper accessible navigation label', () => {
    render(<Header />);
    const nav = screen.getByLabelText('主导航');
    expect(nav).toBeInTheDocument();
  });
});
