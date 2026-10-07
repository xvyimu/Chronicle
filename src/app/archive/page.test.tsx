import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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

import ArchivePage from '@/app/archive/page';

describe('ArchivePage', () => {
  beforeEach(() => cleanup());

  it('renders the page title and post count subtitle', () => {
    render(<ArchivePage />);
    expect(screen.getByRole('heading', { level: 1, name: '归档' })).toBeInTheDocument();

    const posts = getAllPosts();
    if (posts.length > 0) {
      expect(screen.getByText(new RegExp(`${posts.length} 篇文章`))).toBeInTheDocument();
    }
  });

  it('groups posts by year and lists years in descending order', () => {
    const posts = getAllPosts();
    if (posts.length === 0) return;

    render(<ArchivePage />);

    const expectedYears = [...new Set(posts.map((p) => p.date.slice(0, 4)))];
    const yearLabels = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent);
    expect(yearLabels).toEqual(expectedYears);

    // 年份倒序（posts 已按日期倒序，分组后应保持）
    const sorted = [...expectedYears].sort((a, b) => b.localeCompare(a));
    expect(yearLabels).toEqual(sorted);
  });

  it('renders each post exactly once', () => {
    const posts = getAllPosts();
    if (posts.length === 0) return;

    render(<ArchivePage />);

    for (const post of posts) {
      expect(screen.getAllByText(post.title)).toHaveLength(1);
    }
  });

  it('links every entry to its post detail route', () => {
    const posts = getAllPosts();
    if (posts.length === 0) return;

    render(<ArchivePage />);

    for (const post of posts) {
      const link = screen.getByText(post.title).closest('a');
      expect(link).toHaveAttribute('href', `/blog/${post.slug}`);
    }
  });

  it('buckets every post under its own year without dropping any', () => {
    const posts = getAllPosts();
    if (posts.length === 0) return;

    render(<ArchivePage />);

    // 每个年份分组下的条目数之和必须等于总篇数（不丢、不重）。
    const yearLabels = screen.getAllByRole('heading', { level: 2 });
    const rendered = yearLabels.reduce((sum, h) => {
      const section = h.closest('section');
      return sum + (section?.querySelectorAll('li').length ?? 0);
    }, 0);
    expect(rendered).toBe(posts.length);
  });
});
