import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinksDirectory } from './LinksDirectory';
import type { LinkCategory } from '@/types';

const categories: LinkCategory[] = [
  {
    id: 'ai',
    title: 'AI 工具',
    description: '常用 AI 产品与开发平台',
    items: [
      {
        title: 'OpenAI',
        url: 'https://www.openai.com/',
        description: '模型、API 与产品入口',
        tags: ['model', 'api'],
        official: true,
        priority: 'primary',
        useCase: '模型 API 与产品发布入口',
        lastChecked: '2026-07-06',
      },
      {
        title: 'Claude',
        url: 'https://claude.ai/',
        description: '长上下文写作与代码分析',
      },
    ],
  },
  {
    id: 'vps',
    title: 'VPS',
    description: '云服务器与网络工具',
    items: [
      {
        title: 'Hetzner',
        url: 'https://www.hetzner.com/',
        description: '欧洲云服务器官网',
      },
    ],
  },
];

describe('LinksDirectory', () => {
  it('renders collection metrics and category index links', () => {
    render(<LinksDirectory categories={categories} />);

    const metrics = screen.getByLabelText('收藏概览');
    // Metric values must remain plain digits (mono-styled in CSS).
    expect(within(metrics).getByText('2')).toBeInTheDocument();
    expect(within(metrics).getByText('3')).toBeInTheDocument();
    expect(within(metrics).getByText('分类')).toBeInTheDocument();
    expect(within(metrics).getByText('站点')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: '链接分类' });
    expect(within(nav).getByRole('link', { name: 'AI 工具 2 个' })).toHaveAttribute(
      'href',
      '#ai',
    );
    expect(within(nav).getByRole('link', { name: 'VPS 1 个' })).toHaveAttribute(
      'href',
      '#vps',
    );
  });

  it('renders category counts and normalized host names', () => {
    render(<LinksDirectory categories={categories} />);

    expect(screen.getByText('2 个站点')).toBeInTheDocument();
    expect(screen.getByText('1 个站点')).toBeInTheDocument();
    expect(screen.getByText('openai.com')).toBeInTheDocument();
    expect(screen.getByText('hetzner.com')).toBeInTheDocument();
  });

  it('renders optional link tags as metadata badges', () => {
    render(<LinksDirectory categories={categories} />);

    expect(screen.getByText('model')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('api')).toHaveAttribute('data-slot', 'badge');
  });

  it('renders optional curation metadata for operational link assets', () => {
    render(<LinksDirectory categories={categories} />);

    expect(screen.getByText('官网')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('重点')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('模型 API 与产品发布入口')).toBeInTheDocument();
    expect(screen.getByText('2026-07-06')).toBeInTheDocument();
  });

  it('keeps link cards as safe external links', () => {
    render(<LinksDirectory categories={categories} />);

    expect(screen.getByRole('link', { name: /OpenAI/ })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.getByRole('link', { name: /OpenAI/ })).toHaveAttribute(
      'target',
      '_blank',
    );
  });

  it('filters links by keyword across title, host, description, use case, and tags', () => {
    render(<LinksDirectory categories={categories} />);

    const input = screen.getByRole('searchbox', { name: '筛选收藏链接' });
    fireEvent.change(input, { target: { value: 'model' } });

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.queryByText('Claude')).not.toBeInTheDocument();
    expect(screen.queryByText('Hetzner')).not.toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('匹配站点')).toBeInTheDocument();
  });

  it('clears the link filter and restores all categories', () => {
    render(<LinksDirectory categories={categories} />);

    const input = screen.getByRole('searchbox', { name: '筛选收藏链接' });
    fireEvent.change(input, { target: { value: 'openai' } });
    fireEvent.click(screen.getByRole('button', { name: '清除链接筛选' }));

    expect(input).toHaveValue('');
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('Hetzner')).toBeInTheDocument();
  });

  it('shows a helpful empty state when no links match', () => {
    render(<LinksDirectory categories={categories} />);

    const input = screen.getByRole('searchbox', { name: '筛选收藏链接' });
    fireEvent.change(input, { target: { value: 'zzznomatch' } });

    expect(screen.getByText('没有匹配的收藏')).toBeInTheDocument();
    expect(
      screen.getByText(/试试搜索分类、标签、官网域名或使用场景/),
    ).toBeInTheDocument();
    expect(screen.queryByText('OpenAI')).not.toBeInTheDocument();
  });
});
