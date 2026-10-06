import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { SearchDoc } from '@/lib/search';

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

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

import SearchPanel from './SearchPanel';

const docs: SearchDoc[] = [
  {
    slug: 'postgres-tuning',
    title: 'PostgreSQL 性能调优',
    description: '索引与查询计划',
    tags: ['数据库'],
    category: '数据库',
    date: '2026-07-01',
    readingTime: '8 min read',
  },
  {
    slug: 'next-csp',
    title: 'CSP Nonce 与 SRI',
    description: '安全响应头',
    tags: ['安全'],
    category: '前端开发',
    date: '2026-07-02',
    readingTime: '6 min read',
  },
];

describe('SearchPanel', () => {
  beforeEach(() => {
    cleanup();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('renders a labelled search input', () => {
    render(<SearchPanel docs={docs} />);
    expect(screen.getByLabelText('搜索文章')).toBeInTheDocument();
  });

  it('shows a hint when the query is empty', () => {
    render(<SearchPanel docs={docs} />);
    expect(screen.getByText(/输入关键词搜索/)).toBeInTheDocument();
  });

  it('shows matching results as the user types', () => {
    render(<SearchPanel docs={docs} />);
    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'PostgreSQL' },
    });
    expect(screen.getByText('PostgreSQL 性能调优')).toBeInTheDocument();
  });

  it('shows an empty state for no matches', () => {
    render(<SearchPanel docs={docs} />);
    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'zzzzz不存在zzzzz' },
    });
    expect(screen.getByText(/没有找到匹配/)).toBeInTheDocument();
  });

  it('syncs the query to the URL', () => {
    render(<SearchPanel docs={docs} />);
    fireEvent.change(screen.getByLabelText('搜索文章'), { target: { value: '安全' } });
    expect(mockReplace).toHaveBeenCalled();
    const url = mockReplace.mock.calls.at(-1)?.[0] as string;
    expect(url).toContain('q=');
  });

  it('navigates to the selected result on Enter after ArrowDown', () => {
    render(<SearchPanel docs={docs} />);
    const input = screen.getByLabelText('搜索文章');
    fireEvent.change(input, { target: { value: 'PostgreSQL' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/blog/postgres-tuning');
  });
});
