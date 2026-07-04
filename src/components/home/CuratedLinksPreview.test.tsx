import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { LinkCategory } from '@/types';

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

import CuratedLinksPreview from './CuratedLinksPreview';

const mockCategories: LinkCategory[] = [
  {
    id: 'ai-tools',
    title: 'AI 工具',
    description: 'AI 相关工具和资源',
    items: [
      { title: 'ChatGPT', url: 'https://chatgpt.com', description: 'AI 对话助手' },
      { title: 'Claude', url: 'https://claude.ai', description: 'AI 助手' },
      { title: 'Midjourney', url: 'https://midjourney.com', description: 'AI 绘图' },
    ],
  },
  {
    id: 'dev-docs',
    title: '开发文档',
    description: '开发相关的文档站',
    items: [
      { title: 'MDN', url: 'https://developer.mozilla.org', description: 'Web 标准文档' },
    ],
  },
];

describe('CuratedLinksPreview', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('returns null when categories is empty', () => {
    const { container } = render(<CuratedLinksPreview categories={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the section title', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    expect(screen.getByText('个人收藏入口')).toBeInTheDocument();
  });

  it('renders all category titles', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    expect(screen.getByText('AI 工具')).toBeInTheDocument();
    expect(screen.getByText('开发文档')).toBeInTheDocument();
  });

  it('renders link counts', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    expect(screen.getByText('3 个收藏')).toBeInTheDocument();
    expect(screen.getByText('1 个收藏')).toBeInTheDocument();
  });

  it('renders shadcn card primitives for each category', () => {
    const { container } = render(<CuratedLinksPreview categories={mockCategories} />);
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(
      mockCategories.length,
    );
    expect(container.querySelectorAll('[data-slot="badge"]')).toHaveLength(
      mockCategories.length,
    );
  });

  it('renders link items (max 3 per category)', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('Midjourney')).toBeInTheDocument();
    expect(screen.getByText('MDN')).toBeInTheDocument();
  });

  it('renders external links with target=_blank', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    const chatgptLink = screen.getByText('ChatGPT').closest('a');
    expect(chatgptLink).toHaveAttribute('href', 'https://chatgpt.com');
    expect(chatgptLink).toHaveAttribute('target', '_blank');
  });

  it('renders host names for quick scanning', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    expect(screen.getByText('chatgpt.com')).toBeInTheDocument();
    expect(screen.getByText('developer.mozilla.org')).toBeInTheDocument();
  });

  it('renders "打开导航" link pointing to /links', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    const navLink = screen.getByText('打开导航').closest('a');
    expect(navLink).toHaveAttribute('href', '/links');
  });

  it('renders the eyebrow text', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    expect(screen.getByText('Curated Links')).toBeInTheDocument();
  });

  it('has accessible aria-labelledby', () => {
    render(<CuratedLinksPreview categories={mockCategories} />);
    const section = screen.getByLabelText('个人收藏入口');
    expect(section).toBeInTheDocument();
  });

  it('links to the matching category anchor when more items exist', () => {
    const categoriesWithMore: LinkCategory[] = [
      {
        ...mockCategories[0],
        items: [
          ...mockCategories[0].items,
          { title: 'Perplexity', url: 'https://perplexity.ai', description: 'AI 搜索' },
        ],
      },
    ];

    render(<CuratedLinksPreview categories={categoriesWithMore} />);
    expect(screen.getByRole('link', { name: '查看剩余 1 个' })).toHaveAttribute(
      'href',
      '/links#ai-tools',
    );
  });
});
