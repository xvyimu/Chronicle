import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { PostMeta } from '@/types';

const postsState = vi.hoisted(() => ({
  getAllPosts: vi.fn(),
}));

vi.mock('@/lib/posts', () => ({
  getAllPosts: postsState.getAllPosts,
}));

import {
  getAllCategories,
  getPostsByCategory,
  isValidCategory,
  getAllCategorySlugs,
} from '@/lib/categories';
import { inferCategory } from '@/lib/category-rules';

function makePost(overrides: Partial<PostMeta> & { slug: string }): PostMeta {
  return {
    title: `Post ${overrides.slug}`,
    description: 'desc',
    date: '2026-06-01',
    tags: [],
    published: true,
    featured: false,
    readingTime: '5 min read',
    wordCount: 100,
    excerpt: 'excerpt',
    headings: [],
    searchText: 'search',
    ...overrides,
  };
}

const CATEGORY_FIXTURE: PostMeta[] = [
  makePost({
    slug: 'frontend',
    category: '前端开发',
    tags: ['Next.js', 'React'],
  }),
  makePost({
    slug: 'explicit-empty-tags',
    category: '自定义分类',
    tags: [],
  }),
  makePost({
    slug: 'explicit-over-inferred',
    category: '前端开发',
    tags: ['Docker'],
  }),
  makePost({
    slug: 'devops',
    category: 'DevOps',
    tags: ['Docker', '部署'],
  }),
];

function clonePosts(posts: PostMeta[]): PostMeta[] {
  return posts.map((post) => ({
    ...post,
    tags: [...post.tags],
    headings: [...post.headings],
  }));
}

beforeEach(() => {
  postsState.getAllPosts.mockReturnValue(clonePosts(CATEGORY_FIXTURE));
});

describe('inferCategory', () => {
  it('infers frontend category from related tags', () => {
    expect(inferCategory(['Next.js', 'React'])).toBe('前端开发');
    expect(inferCategory(['TypeScript', '类型系统'])).toBe('前端开发');
    expect(inferCategory(['性能优化', 'Core Web Vitals'])).toBe('前端开发');
  });

  it('infers database category from related tags', () => {
    expect(inferCategory(['PostgreSQL'])).toBe('数据库');
    expect(inferCategory(['Redis', '缓存'])).toBe('数据库');
  });

  it('infers DevOps category from related tags', () => {
    expect(inferCategory(['Docker', '部署'])).toBe('DevOps');
    expect(inferCategory(['Nginx', 'Linux'])).toBe('DevOps');
  });

  it('infers CI/CD category', () => {
    expect(inferCategory(['CI/CD', 'GitHub Actions'])).toBe('CI/CD');
    expect(inferCategory(['Git', '自动化'])).toBe('CI/CD');
  });

  it('infers cloud service category', () => {
    expect(inferCategory(['Cloudflare', 'Workers'])).toBe('云服务');
    expect(inferCategory(['Serverless', '无服务器'])).toBe('云服务');
  });

  it('returns null for unknown tags', () => {
    expect(inferCategory(['未知标签', 'nonexistent'])).toBeNull();
  });

  it('returns null for empty tags array', () => {
    expect(inferCategory([])).toBeNull();
  });

  it('returns the first matching category when tags span multiple categories', () => {
    // inferCategory returns first match; Postgres tag appears before 后端
    expect(inferCategory(['PostgreSQL', '数据库', '后端'])).toBe('数据库');
  });
});

describe('getAllCategories', () => {
  it('returns an array of CategoryInfo', () => {
    const cats = getAllCategories();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBe(3);
    for (const c of cats) {
      expect(c.name).toBeTruthy();
      expect(c.slug).toBeTruthy();
      expect(c.count).toBeGreaterThan(0);
      expect(Array.isArray(c.tags)).toBe(true);
    }
  });

  it('is sorted by count descending', () => {
    const cats = getAllCategories();
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i - 1].count).toBeGreaterThanOrEqual(cats[i].count);
    }
  });

  it('has unique names', () => {
    const cats = getAllCategories();
    const names = cats.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('counts explicit categories even when no tags map to that category', () => {
    const cats = getAllCategories();
    expect(cats.find((c) => c.name === '自定义分类')).toMatchObject({
      count: 1,
      tags: [],
    });
  });

  it('uses post.category instead of re-inferring category from tags', () => {
    const cats = getAllCategories();
    expect(cats.find((c) => c.name === '前端开发')).toMatchObject({
      count: 2,
      tags: ['Next.js', 'React'],
    });
    expect(cats.find((c) => c.name === 'DevOps')).toMatchObject({
      count: 1,
      tags: ['Docker', '部署'],
    });
  });
});

describe('getPostsByCategory', () => {
  it('returns posts for a known category', () => {
    const posts = getPostsByCategory('前端开发');
    expect(posts.map((p) => p.slug)).toEqual(['frontend', 'explicit-over-inferred']);
  });

  it('returns posts for DevOps category', () => {
    const posts = getPostsByCategory('DevOps');
    expect(posts.map((p) => p.slug)).toEqual(['devops']);
  });

  it('returns posts for explicit categories without inferred tags', () => {
    const posts = getPostsByCategory('自定义分类');
    expect(posts.map((p) => p.slug)).toEqual(['explicit-empty-tags']);
  });

  it('returns posts for URL-encoded Chinese category names', () => {
    const posts = getPostsByCategory(encodeURIComponent('自定义分类'));
    expect(posts.map((p) => p.slug)).toEqual(['explicit-empty-tags']);
  });

  it('returns empty array for non-existent category', () => {
    const posts = getPostsByCategory('不存在的分类');
    expect(posts).toEqual([]);
  });
});

describe('isValidCategory', () => {
  it('returns true for existing categories', () => {
    const cats = getAllCategories();
    for (const c of cats) {
      expect(isValidCategory(c.slug)).toBe(true);
    }
  });

  it('returns true for URL-encoded Chinese category names', () => {
    expect(isValidCategory(encodeURIComponent('前端开发'))).toBe(true);
  });

  it('returns false for non-existent category', () => {
    expect(isValidCategory('不存在的分类')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidCategory('')).toBe(false);
  });
});

describe('getAllCategorySlugs', () => {
  it('returns all category slugs', () => {
    const cats = getAllCategories();
    const slugs = getAllCategorySlugs();
    expect(slugs.length).toBe(cats.length);
    expect(slugs.every((s) => typeof s === 'string')).toBe(true);
  });

  it('slugs match category names', () => {
    const cats = getAllCategories();
    const slugs = getAllCategorySlugs();
    for (const c of cats) {
      expect(slugs).toContain(c.name);
    }
  });
});
