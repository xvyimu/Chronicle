import { describe, expect, it } from 'vitest';
import { searchDocs, SEARCH_RESULT_LIMIT } from './engine';
import type { SearchDoc } from './types';

const docs: SearchDoc[] = [
  {
    slug: 'postgres-tuning',
    title: 'PostgreSQL 性能调优',
    description: '索引、缓存与查询计划',
    tags: ['数据库', 'PostgreSQL'],
    category: '数据库',
    date: '2026-07-01',
    readingTime: '8 min read',
  },
  {
    slug: 'next-csp',
    title: 'CSP Nonce 与 SRI',
    description: '安全响应头实践',
    tags: ['安全', 'Next.js'],
    category: '前端开发',
    date: '2026-07-02',
    readingTime: '6 min read',
  },
  {
    slug: 'vps-setup',
    title: 'VPS 初始化配置',
    description: '从零搭建服务器',
    tags: ['VPS', '运维'],
    category: '运维',
    date: '2026-07-03',
    readingTime: '10 min read',
  },
];

describe('searchDocs', () => {
  it('matches by title', () => {
    const r = searchDocs(docs, 'PostgreSQL');
    expect(r[0].item.slug).toBe('postgres-tuning');
  });

  it('matches by tag', () => {
    const r = searchDocs(docs, '安全');
    expect(r.map((d) => d.item.slug)).toContain('next-csp');
  });

  it('matches by description', () => {
    const r = searchDocs(docs, '服务器');
    expect(r.map((d) => d.item.slug)).toContain('vps-setup');
  });

  it('returns empty for empty query', () => {
    expect(searchDocs(docs, '')).toEqual([]);
    expect(searchDocs(docs, '   ')).toEqual([]);
  });

  it('returns empty for empty docs', () => {
    expect(searchDocs([], 'anything')).toEqual([]);
  });

  it('respects the result limit', () => {
    const many: SearchDoc[] = Array.from({ length: 20 }, (_, i) => ({
      slug: `s-${i}`,
      title: `测试文章 ${i}`,
      description: '测试',
      tags: ['测试'],
      category: '测试',
      date: '2026-07-01',
      readingTime: '1 min read',
    }));
    expect(searchDocs(many, '测试', 5).length).toBeLessThanOrEqual(5);
    expect(searchDocs(many, '测试').length).toBeLessThanOrEqual(SEARCH_RESULT_LIMIT);
  });

  it('truncates overly long queries', () => {
    const long = 'a'.repeat(500);
    expect(() => searchDocs(docs, long)).not.toThrow();
  });

  it('returns match ranges for highlighting (R14)', () => {
    const r = searchDocs(docs, 'PostgreSQL');
    expect(r).toHaveLength(1);
    const titleMatch = r[0].matches.find((m) => m.key === 'title');
    expect(titleMatch).toBeDefined();
    // 命中区间必须落在标题长度内（闭区间 [start, end]）
    const title = r[0].item.title;
    for (const [start, end] of titleMatch!.indices) {
      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeLessThan(title.length);
      expect(start).toBeLessThanOrEqual(end);
    }
  });

  it('keeps results usable when matches are absent (tag-only hit)', () => {
    // 标签命中：title/description 无区间，渲染层应原样输出
    const r = searchDocs(docs, '安全');
    const hit = r.find((x) => x.item.slug === 'next-csp');
    expect(hit).toBeDefined();
    expect(hit!.matches.some((m) => m.key === 'tags')).toBe(true);
    expect(hit!.matches.some((m) => m.key === 'title')).toBe(false);
  });
});
