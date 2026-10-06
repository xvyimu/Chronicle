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

// Mock next/navigation usePathname (MobileNav)
const mockPathname = vi.fn().mockReturnValue('/');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock ThemeToggle
vi.mock('@/components/ui/ThemeToggle', () => ({
  default: () => <button type="button" aria-label="切换主题" />,
}));

// Mock next/headers for async RSC Header
vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers({
      'x-pathname': mockPathname(),
    }),
}));

import Header from './Header';
import HeaderScrollState from './HeaderScrollState';
import MobileNav from './MobileNav';

function renderHeader() {
  return render(<Header />);
}

describe('Header (TopBar shell + client islands)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the site name', () => {
    renderHeader();
    expect(screen.getByText('西江月')).toBeInTheDocument();
  });

  it('does not render desktop navigation (moved to Sidebar)', () => {
    renderHeader();
    expect(screen.queryByText('文章')).not.toBeInTheDocument();
    expect(screen.queryByText('花园')).not.toBeInTheDocument();
    expect(screen.queryByText('导航')).not.toBeInTheDocument();
  });

  it('renders ThemeToggle', () => {
    renderHeader();
    expect(screen.getByLabelText('切换主题')).toBeInTheDocument();
  });

  it('renders a search shortcut link', () => {
    renderHeader();
    expect(screen.getByLabelText('前往搜索')).toHaveAttribute('href', '/');
  });

  it('renders mobile menu toggle button', () => {
    renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');
    expect(menuBtn).toBeInTheDocument();
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    expect(menuBtn).toHaveAttribute('aria-controls', 'mobile-nav');
  });

  it('toggles mobile menu on click', () => {
    renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(screen.getByLabelText('关闭菜单')).toBeInTheDocument();
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders navigation links inside the mobile sheet', () => {
    renderHeader();
    fireEvent.click(screen.getByLabelText('打开菜单'));
    const mobileNav = screen.getByLabelText('主导航', { selector: '#mobile-nav' });
    expect(mobileNav).toBeInTheDocument();

    const hrefs = Array.from(mobileNav.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual([
      '/',
      '/blog',
      '/series',
      '/categories',
      '/tags',
      '/archive',
      '/favorites',
      '/projects',
      '/about',
    ]);
    // 不指向已删路由
    expect(hrefs).not.toContain('/garden');
    expect(hrefs).not.toContain('/links');
  });

  it('moves focus into the mobile navigation when the menu opens', async () => {
    renderHeader();

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

  it('closes mobile menu when backdrop is clicked', async () => {
    renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

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
    renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('renders brand link pointing to /', () => {
    renderHeader();
    const brandLink = screen.getByText('西江月').closest('a');
    expect(brandLink).toHaveAttribute('href', '/');
  });
});

describe('HeaderScrollState', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '<header data-site-header class="header"></header>';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('applies scrolled class when scrolled past threshold (rAF coalesced)', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    render(<HeaderScrollState />);
    const headerEl = document.querySelector('header');
    expect(headerEl?.className).not.toContain('is-scrolled');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 20,
    });
    fireEvent.scroll(window);
    expect(rafCallbacks.length).toBeGreaterThan(0);
    rafCallbacks[rafCallbacks.length - 1](0);
    expect(headerEl?.className).toContain('is-scrolled');
  });
});

describe('MobileNav island', () => {
  beforeEach(() => {
    cleanup();
    mockPathname.mockReturnValue('/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders toggle with closed state', () => {
    render(<MobileNav />);
    expect(screen.getByLabelText('打开菜单')).toHaveAttribute('aria-expanded', 'false');
  });
});
