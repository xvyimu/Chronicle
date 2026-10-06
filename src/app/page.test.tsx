import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getAllPosts } from '@/lib/posts';
import { getAllProjects } from '@/lib/projects';
import { getAllTags } from '@/lib/tags';

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers([['x-nonce', 'test-nonce']]),
}));

import HomePage from '@/app/page';

describe('HomePage (workspace)', () => {
  beforeEach(() => cleanup());

  async function renderHomePage() {
    render(await HomePage());
  }

  it('renders the workspace container', async () => {
    await renderHomePage();
    expect(document.querySelector('.workspace-home')).toBeInTheDocument();
  });

  it('renders the workspace hero with site name and counts', async () => {
    await renderHomePage();
    const posts = getAllPosts();
    const projects = getAllProjects();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const stats = document.querySelector('.ws-hero__stats');
    expect(stats).toBeInTheDocument();
    expect(stats!.textContent).toContain(posts.length.toString());
    expect(stats!.textContent).toContain(projects.length.toString());
    expect(stats!.textContent).toContain('篇文章');
    expect(stats!.textContent).toContain('个项目');
  });

  it('renders the search entry as the hero core', async () => {
    await renderHomePage();
    expect(screen.getByLabelText('搜索文章')).toBeInTheDocument();
  });

  it('renders the topic cloud', async () => {
    await renderHomePage();
    expect(screen.getByText('热门主题')).toBeInTheDocument();
    const tags = getAllTags();
    if (tags.length > 0) {
      const top = [...tags].sort((a, b) => b.count - a.count)[0];
      expect(screen.getAllByText(top.tag).length).toBeGreaterThan(0);
    }
  });

  it('renders the recent articles list', async () => {
    await renderHomePage();
    expect(screen.getByText('最近更新')).toBeInTheDocument();
    const posts = getAllPosts();
    const recent = [
      ...posts.filter((p) => p.featured),
      ...posts.filter((p) => !p.featured),
    ].slice(0, 6);
    for (const post of recent) {
      expect(screen.getByText(post.title)).toBeInTheDocument();
    }
  });

  it('does not render the legacy Paper Gallery sections', async () => {
    await renderHomePage();
    expect(screen.queryByText('Paper Gallery')).not.toBeInTheDocument();
    expect(screen.queryByText('从这里进入')).not.toBeInTheDocument();
    expect(screen.queryByText('阅读路径')).not.toBeInTheDocument();
  });
});
