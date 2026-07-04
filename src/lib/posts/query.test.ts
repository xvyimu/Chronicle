import { describe, it, expect } from 'vitest';
import type { PostMeta, PostFull } from '@/types';
import { filterByTag, getAdjacent, getRelated, getSeries, paginate } from './query';

/** 构造 PostMeta fixture */
function makePost(overrides: Partial<PostMeta> & { slug: string }): PostMeta {
  return {
    title: overrides.title ?? `Post ${overrides.slug}`,
    description: overrides.description ?? 'desc',
    date: overrides.date ?? '2026-06-01',
    tags: overrides.tags ?? [],
    published: overrides.published ?? true,
    featured: overrides.featured ?? false,
    readingTime: '5 min read',
    wordCount: 100,
    excerpt: 'excerpt',
    headings: [],
    searchText: 'search',
    ...overrides,
  };
}

const FIXTURE: PostMeta[] = [
  makePost({
    slug: 'a',
    date: '2026-06-03',
    tags: ['docker', 'devops'],
    featured: true,
    category: '后端',
    series: 'vps',
    seriesOrder: 1,
  }),
  makePost({
    slug: 'b',
    date: '2026-06-02',
    tags: ['docker'],
    category: '后端',
    series: 'vps',
    seriesOrder: 2,
  }),
  makePost({
    slug: 'c',
    date: '2026-06-01',
    tags: ['react'],
    featured: true,
    category: '前端',
  }),
  makePost({
    slug: 'd',
    date: '2026-05-31',
    tags: ['devops'],
    series: 'vps',
    seriesOrder: 3,
  }),
];

describe('filterByTag', () => {
  it('filters case-insensitively', () => {
    expect(filterByTag(FIXTURE, 'DOCKER').map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('returns empty array when no match', () => {
    expect(filterByTag(FIXTURE, 'nonexistent')).toEqual([]);
  });
});

describe('getAdjacent', () => {
  it('returns prev (older) and next (newer) for middle post', () => {
    // sorted desc: a, b, c, d — b is at index 1
    const sorted = [...FIXTURE].sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return a.slug.localeCompare(b.slug);
    });
    const { prev, next } = getAdjacent(sorted, 'b');
    expect(prev?.slug).toBe('c'); // older
    expect(next?.slug).toBe('a'); // newer
  });

  it('returns null next for newest post', () => {
    const sorted = [...FIXTURE].sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return a.slug.localeCompare(b.slug);
    });
    expect(getAdjacent(sorted, 'a').next).toBeNull();
  });

  it('returns null prev for oldest post', () => {
    const sorted = [...FIXTURE].sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return a.slug.localeCompare(b.slug);
    });
    expect(getAdjacent(sorted, 'd').prev).toBeNull();
  });

  it('returns null for both when slug not found', () => {
    const sorted = [...FIXTURE].sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return a.slug.localeCompare(b.slug);
    });
    const { prev, next } = getAdjacent(sorted, 'unknown');
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});

describe('getRelated', () => {
  const current: PostFull = {
    ...FIXTURE[1], // slug=b, tags=[docker], category=后端, series=vps
    content: 'body',
  };

  it('scores by shared tags, category, and series', () => {
    // a shares tag (docker) + category (后端) + series (vps): 3+1+2 = 6
    // d shares series (vps) only: 2
    // c shares nothing: 0 (filtered out)
    const related = getRelated(FIXTURE, 'b', current);
    expect(related.map((p) => p.slug)).toEqual(['a', 'd']);
  });

  it('excludes current post', () => {
    const related = getRelated(FIXTURE, 'b', current);
    expect(related.find((p) => p.slug === 'b')).toBeUndefined();
  });

  it('respects limit', () => {
    const related = getRelated(FIXTURE, 'b', current, 1);
    expect(related.length).toBe(1);
  });

  it('returns empty array when current is null', () => {
    expect(getRelated(FIXTURE, 'b', null)).toEqual([]);
  });

  it('returns empty array when no related posts', () => {
    const unrelated: PostFull = { ...FIXTURE[2], content: '' }; // c: tags=[react], category=前端, no series
    const related = getRelated(FIXTURE, 'c', unrelated);
    expect(related).toEqual([]);
  });
});

describe('getSeries', () => {
  it('returns series posts sorted by seriesOrder', () => {
    const current: PostFull = { ...FIXTURE[0], content: '' };
    const series = getSeries(FIXTURE, current);
    expect(series.map((p) => p.slug)).toEqual(['a', 'b', 'd']);
  });

  it('returns empty array when post has no series', () => {
    const current: PostFull = { ...FIXTURE[2], content: '' };
    expect(getSeries(FIXTURE, current)).toEqual([]);
  });

  it('returns empty array when current is null', () => {
    expect(getSeries(FIXTURE, null)).toEqual([]);
  });

  it('uses date as tiebreaker when seriesOrder missing', () => {
    const noOrder: PostMeta[] = [
      makePost({ slug: 'x1', date: '2026-06-02', series: 's', seriesOrder: undefined }),
      makePost({ slug: 'x2', date: '2026-06-03', series: 's', seriesOrder: undefined }),
    ];
    const current: PostFull = { ...noOrder[0], content: '' };
    // Without seriesOrder, sorts by date desc
    const series = getSeries(noOrder, current);
    expect(series.map((p) => p.slug)).toEqual(['x2', 'x1']);
  });
});

describe('paginate', () => {
  it('returns first page', () => {
    const result = paginate(FIXTURE, 1, 2);
    expect(result.items.map((p) => p.slug)).toEqual(['a', 'b']);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(2);
    expect(result.totalItems).toBe(4);
  });

  it('returns second page', () => {
    const result = paginate(FIXTURE, 2, 2);
    expect(result.items.map((p) => p.slug)).toEqual(['c', 'd']);
  });

  it('clamps page to 1 when below', () => {
    expect(paginate(FIXTURE, 0, 2).currentPage).toBe(1);
    expect(paginate(FIXTURE, -5, 2).currentPage).toBe(1);
  });

  it('clamps page to totalPages when above', () => {
    expect(paginate(FIXTURE, 999, 2).currentPage).toBe(2);
  });

  it('handles empty input', () => {
    const result = paginate([], 1, 2);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1); // min 1
    expect(result.totalItems).toBe(0);
  });
});
