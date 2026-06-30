import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPostRepository } from './repository';
import { resetAllCaches } from '@/lib/cache';
import { createInMemorySource } from '@/lib/test-utils/in-memory-source';
import { CONTENT_DIR } from '@/lib/constants';

const BLOG = CONTENT_DIR.blog; // 'content/blog'

/** 默认测试夹具: 3 篇文章, 覆盖各种 frontmatter.
 *  文件名遵循真实约定 YYYY-MM-slug (不带 DD), date 用单引号避免 js-yaml 解析为 Date.
 */
function makeFixture(overrides: Record<string, string> = {}) {
  return {
    [`${BLOG}/2026-06-first-post.mdx`]: `---
title: 第一篇
description: 测试描述一
date: '2026-06-01'
tags: [docker, devops]
category: 后端
---

## 第一节
正文内容一`,
    [`${BLOG}/2026-06-second-post.mdx`]: `---
title: 第二篇
description: 测试描述二
date: '2026-06-02'
tags: [react]
featured: true
---

## 第二节
正文内容二`,
    [`${BLOG}/2026-05-draft.mdx`]: `---
title: 草稿
description: 不会发布
date: '2026-05-31'
tags: [wip]
published: false
---

草稿内容`,
    ...overrides,
  };
}

describe('createPostRepository', () => {
  beforeEach(() => {
    resetAllCaches();
  });

  afterEach(() => {
    resetAllCaches();
  });

  describe('getAllPosts', () => {
    it('parses MDX and returns PostMeta array', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      const posts = repo.getAllPosts();
      // In test env (NODE_ENV !== 'production'), draft is visible
      expect(posts.length).toBe(3);
      expect(posts.map((p) => p.slug)).toContain('first-post');
      expect(posts.map((p) => p.slug)).toContain('second-post');
      expect(posts.map((p) => p.slug)).toContain('draft');
    });

    it('sorts by date descending', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      const posts = repo.getAllPosts();
      const dates = posts.map((p) => p.date);
      expect(dates).toEqual([...dates].sort().reverse());
    });

    it('excludes content field from PostMeta', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      const posts = repo.getAllPosts();
      for (const p of posts) {
        expect('content' in p).toBe(false);
      }
    });

    it('computes readingTime and wordCount', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      const post = repo.getPostBySlug('first-post');
      expect(post?.readingTime).toMatch(/min read/);
      expect(post?.wordCount).toBeGreaterThan(0);
    });

    it('computes excerpt and headings', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      const post = repo.getPostBySlug('first-post');
      expect(post?.headings).toEqual(['第一节']);
      expect(post?.excerpt).toContain('正文内容');
    });

    it('returns empty array when blog dir is empty', () => {
      const repo = createPostRepository(createInMemorySource({}));
      expect(repo.getAllPosts()).toEqual([]);
    });

    it('applies zod defaults (published=true, featured=false, tags=[])', () => {
      const repo = createPostRepository(createInMemorySource({
        [`${BLOG}/2026-06-min.mdx`]: `---
title: Minimal
description: Min
date: '2026-06-15'
---

Body`,
      }));
      const post = repo.getPostBySlug('min');
      expect(post?.published).toBe(true);
      expect(post?.featured).toBe(false);
      expect(post?.tags).toEqual([]);
    });

    it('filters drafts in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string>).NODE_ENV = 'production';
      try {
        const repo = createPostRepository(createInMemorySource(makeFixture()));
        const slugs = repo.getAllPosts().map((p) => p.slug);
        expect(slugs).not.toContain('draft');
        // Sorted by date desc: second-post (2026-06-02) > first-post (2026-06-01)
        expect(slugs).toEqual(['second-post', 'first-post']);
      } finally {
        (process.env as Record<string, string>).NODE_ENV = originalEnv;
      }
    });

    it('shows drafts in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string>).NODE_ENV = 'development';
      try {
        const repo = createPostRepository(createInMemorySource(makeFixture()));
        const slugs = repo.getAllPosts().map((p) => p.slug);
        expect(slugs).toContain('draft');
      } finally {
        (process.env as Record<string, string>).NODE_ENV = originalEnv;
      }
    });
  });

  describe('getPostBySlug', () => {
    it('returns PostFull with content for known slug', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      const post = repo.getPostBySlug('first-post');
      expect(post).not.toBeNull();
      expect(post?.title).toBe('第一篇');
      expect(post?.content).toContain('正文内容');
      expect(post?.slug).toBe('first-post');
    });

    it('returns null for unknown slug', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      expect(repo.getPostBySlug('non-existent')).toBeNull();
    });

    it('returns null for empty string', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      expect(repo.getPostBySlug('')).toBeNull();
    });

    it('preserves optional source and license metadata', () => {
      const repo = createPostRepository(createInMemorySource({
        [`${BLOG}/2026-06-attributed.mdx`]: `---
title: Attributed
description: Has source and license
date: '2026-06-15'
tags: []
source: https://github.com/example/repo
license: MIT
---

Body`,
      }));
      const post = repo.getPostBySlug('attributed');
      expect(post?.source).toBe('https://github.com/example/repo');
      expect(post?.license).toBe('MIT');
    });

    it('throws on invalid frontmatter', () => {
      const repo = createPostRepository(createInMemorySource({
        [`${BLOG}/2026-06-bad.mdx`]: `---
title: ""
description: missing title
date: '2026-06-15'
---

Body`,
      }));
      expect(() => repo.getAllPosts()).toThrow(/内容校验失败/);
    });

    it('throws on malformed date', () => {
      const repo = createPostRepository(createInMemorySource({
        [`${BLOG}/2026-06-bad-date.mdx`]: `---
title: Bad Date
description: invalid date format
date: "June 15, 2026"
---

Body`,
      }));
      expect(() => repo.getAllPosts()).toThrow(/date/);
    });
  });

  describe('getAllPostSlugs', () => {
    it('returns all visible slugs', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      const slugs = repo.getAllPostSlugs();
      expect(slugs.length).toBe(3); // includes draft in test env
      expect(slugs.every((s) => typeof s === 'string')).toBe(true);
    });
  });

  describe('getFeaturedPosts', () => {
    it('returns only featured posts', () => {
      const repo = createPostRepository(createInMemorySource(makeFixture()));
      const featured = repo.getFeaturedPosts();
      expect(featured.map((p) => p.slug)).toEqual(['second-post']);
    });

    it('returns empty array when no featured posts', () => {
      const repo = createPostRepository(createInMemorySource({
        [`${BLOG}/2026-06-plain.mdx`]: `---
title: Plain
description: not featured
date: '2026-06-15'
---

Body`,
      }));
      expect(repo.getFeaturedPosts()).toEqual([]);
    });
  });

  describe('caching', () => {
    it('caches PostFull results within same repository instance', () => {
      const source = createInMemorySource(makeFixture());
      const repo = createPostRepository(source);
      const first = repo.getPostBySlug('first-post');
      const second = repo.getPostBySlug('first-post');
      // getPostBySlug returns the same object reference from cache (no copy)
      expect(first).toBe(second);
    });

    it('isolates between different repository instances', () => {
      const repo1 = createPostRepository(createInMemorySource(makeFixture()));
      const repo2 = createPostRepository(createInMemorySource({
        [`${BLOG}/2026-06-other.mdx`]: `---
title: Other
description: different fixture
date: '2026-06-15'
---

Body`,
      }));
      expect(repo1.getAllPosts().map((p) => p.title)).not.toContain('Other');
      expect(repo2.getAllPosts().map((p) => p.title)).toContain('Other');
    });
  });
});
