import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { getAllPosts } from '@/server/content';

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

import FavoritesPage from '@/app/favorites/page';
import { toggleFavorite } from '@/lib/reading-state';

describe('FavoritesPage', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renders both reading lists with their titles', async () => {
    render(<FavoritesPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: '我的阅读' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '收藏' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '最近阅读' }),
    ).toBeInTheDocument();
  });

  it('shows the empty state for both lists when localStorage is empty', async () => {
    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText(/还没有收藏/)).toBeInTheDocument();
    });
    expect(screen.getByText(/还没有阅读记录/)).toBeInTheDocument();
  });

  it('renders a favorited post from localStorage', async () => {
    const posts = getAllPosts();
    if (posts.length === 0) return;

    const target = posts[0];
    toggleFavorite(target.slug);

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText(target.title)).toBeInTheDocument();
    });
    expect(screen.getByText(target.title).closest('a')).toHaveAttribute(
      'href',
      `/blog/${target.slug}`,
    );
  });

  it('ignores stored slugs that no longer match a visible post', async () => {
    toggleFavorite('deleted-post-slug');

    render(<FavoritesPage />);

    // 脏数据被求交过滤，回落到空态而非渲染出坏链接。
    await waitFor(() => {
      expect(screen.getByText(/还没有收藏/)).toBeInTheDocument();
    });
    expect(screen.queryByText('deleted-post-slug')).not.toBeInTheDocument();
  });
});
