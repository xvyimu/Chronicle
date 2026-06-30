import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAllPosts,
  getPostBySlug,
  getAllPostSlugs,
  getFeaturedPosts,
  getPostsByTag,
  getAdjacentPosts,
  getRelatedPosts,
  getSeriesPosts,
  getPaginatedPosts,
} from '@/lib/posts';
import { resetAllCaches } from '@/lib/cache';

/**
 * 集成测试 — 验证真实 content/blog/ 目录可读.
 *
 * 单元测试 (in-memory fixture) 在 posts/repository.test.ts 和 posts/query.test.ts.
 * 这里仅验证真实 fs 与 repository 的端到端连通性, 不硬编码具体 slug.
 */
describe('posts (integration with real fs)', () => {
  beforeEach(() => resetAllCaches());
  afterEach(() => resetAllCaches());

  describe('getAllPosts', () => {
    it('returns a non-empty array of PostMeta', () => {
      const posts = getAllPosts();
      expect(posts.length).toBeGreaterThan(0);
    });

    it('each post has required fields', () => {
      const posts = getAllPosts();
      for (const p of posts) {
        expect(p.title).toBeTruthy();
        expect(p.description).toBeTruthy();
        expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Array.isArray(p.tags)).toBe(true);
        expect(typeof p.slug).toBe('string');
        expect(typeof p.readingTime).toBe('string');
        expect(typeof p.excerpt).toBe('string');
        expect(Array.isArray(p.headings)).toBe(true);
        expect(typeof p.searchText).toBe('string');
      }
    });

    it('is sorted by date descending', () => {
      const posts = getAllPosts();
      for (let i = 1; i < posts.length; i++) {
        expect(posts[i - 1].date >= posts[i].date).toBe(true);
      }
    });

    it('does not include content field', () => {
      const posts = getAllPosts();
      for (const p of posts) {
        expect('content' in p).toBe(false);
      }
    });
  });

  describe('getPostBySlug', () => {
    it('returns PostFull for the first slug from getAllPosts', () => {
      const firstSlug = getAllPosts()[0].slug;
      const post = getPostBySlug(firstSlug);
      expect(post).not.toBeNull();
      expect(post?.slug).toBe(firstSlug);
      expect(typeof post?.content).toBe('string');
      expect(post!.content.length).toBeGreaterThan(0);
    });

    it('returns null for unknown slug', () => {
      expect(getPostBySlug('non-existent-post-xyz')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(getPostBySlug('')).toBeNull();
    });
  });

  describe('getAllPostSlugs', () => {
    it('returns all slugs matching getAllPosts length', () => {
      const slugs = getAllPostSlugs();
      const posts = getAllPosts();
      expect(slugs.length).toBe(posts.length);
    });
  });

  describe('getFeaturedPosts', () => {
    it('returns only featured posts', () => {
      const featured = getFeaturedPosts();
      expect(featured.every((p) => p.featured)).toBe(true);
    });
  });

  describe('getPostsByTag', () => {
    it('returns empty array for non-existent tag', () => {
      expect(getPostsByTag('nonexistent-tag-xyz')).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      expect(getPostsByTag('')).toEqual([]);
    });
  });

  describe('getAdjacentPosts', () => {
    it('returns null for both on unknown slug', () => {
      const { prev, next } = getAdjacentPosts('does-not-exist');
      expect(prev).toBeNull();
      expect(next).toBeNull();
    });

    it('returns null next for the newest post', () => {
      const newest = getAllPosts()[0];
      const { next } = getAdjacentPosts(newest.slug);
      expect(next).toBeNull();
    });

    it('returns null prev for the oldest post', () => {
      const all = getAllPosts();
      const oldest = all[all.length - 1];
      const { prev } = getAdjacentPosts(oldest.slug);
      expect(prev).toBeNull();
    });
  });

  describe('getRelatedPosts', () => {
    it('returns empty array for unknown slug', () => {
      expect(getRelatedPosts('does-not-exist')).toEqual([]);
    });

    it('respects limit parameter', () => {
      const firstSlug = getAllPosts()[0].slug;
      expect(getRelatedPosts(firstSlug, 2).length).toBeLessThanOrEqual(2);
    });
  });

  describe('getSeriesPosts', () => {
    it('returns empty array for unknown slug', () => {
      expect(getSeriesPosts('does-not-exist')).toEqual([]);
    });
  });

  describe('getPaginatedPosts', () => {
    it('returns correct structure', () => {
      const result = getPaginatedPosts(1, 5);
      expect(Array.isArray(result.posts)).toBe(true);
      expect(typeof result.currentPage).toBe('number');
      expect(typeof result.totalPages).toBe('number');
      expect(typeof result.totalPosts).toBe('number');
    });

    it('clamps page 0 to page 1', () => {
      expect(getPaginatedPosts(0, 5).currentPage).toBe(1);
    });

    it('clamps negative page to page 1', () => {
      expect(getPaginatedPosts(-3, 5).currentPage).toBe(1);
    });

    it('clamps out-of-range page to last page', () => {
      const result = getPaginatedPosts(999, 5);
      expect(result.currentPage).toBeLessThanOrEqual(result.totalPages);
    });
  });
});
