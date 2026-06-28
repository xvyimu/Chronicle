import { describe, it, expect } from 'vitest';
import {
  filenameToSlug,
  buildPostSearchText,
  extractPostExcerpt,
  extractPostHeadings,
  getAllPosts,
  getFeaturedPosts,
  getPostBySlug,
  getAllPostSlugs,
  getPostsByTag,
  getAdjacentPosts,
  getRelatedPosts,
  getSeriesPosts,
  getPaginatedPosts,
} from '@/lib/posts';

describe('filenameToSlug', () => {
  it('removes YYYY-MM- prefix and .mdx suffix', () => {
    expect(filenameToSlug('2026-06-vps-initial-setup.mdx'))
      .toBe('vps-initial-setup');
  });

  it('handles multi-digit month', () => {
    expect(filenameToSlug('2025-12-year-in-review.mdx'))
      .toBe('year-in-review');
  });

  it('returns the input unchanged for files without the prefix', () => {
    expect(filenameToSlug('readme.mdx')).toBe('readme');
  });
});

describe('post content extraction', () => {
  const mdx = [
    '> Opening note',
    '',
    '## First Section',
    'The first paragraph links to [Next.js](https://nextjs.org).',
    '',
    '### Nested Topic ###',
    'Inline `code` should remain searchable.',
    '',
    '```ts',
    'const hidden = true;',
    '```',
  ].join('\n');

  it('extracts h2 and h3 headings without trailing hashes', () => {
    expect(extractPostHeadings(mdx)).toEqual(['First Section', 'Nested Topic']);
  });

  it('builds a plain-text excerpt from MDX content', () => {
    expect(extractPostExcerpt(mdx, 80)).toContain('Opening note');
    expect(extractPostExcerpt(mdx, 80)).not.toContain('hidden');
  });

  it('builds search text from frontmatter, headings, and body content', () => {
    const searchText = buildPostSearchText({
      title: 'Searchable Title',
      description: 'Searchable description',
      tags: ['Next.js'],
      category: 'Frontend',
      series: 'App Router',
    }, mdx);

    expect(searchText).toContain('Searchable Title');
    expect(searchText).toContain('First Section');
    expect(searchText).toContain('Next.js');
    expect(searchText).toContain('code should remain searchable');
  });
});

describe('getAllPosts', () => {
  it('returns an array of PostMeta', () => {
    const posts = getAllPosts();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
  });

  it('each post has required fields', () => {
    const posts = getAllPosts();
    for (const p of posts) {
      expect(p.title).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.date).toBeTruthy();
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

  it('does not include content field (PostMeta = PostFull minus content)', () => {
    const posts = getAllPosts();
    for (const p of posts) {
      expect('content' in p).toBe(false);
    }
  });
});

describe('getFeaturedPosts', () => {
  it('returns only featured posts', () => {
    const featured = getFeaturedPosts();
    expect(featured.every((p) => p.featured)).toBe(true);
  });

  it('returns at least one featured post', () => {
    const featured = getFeaturedPosts();
    expect(featured.length).toBeGreaterThan(0);
  });
});

describe('getAllPostSlugs', () => {
  it('returns all slugs as strings', () => {
    const slugs = getAllPostSlugs();
    expect(Array.isArray(slugs)).toBe(true);
    expect(slugs.length).toBe(getAllPosts().length);
    expect(slugs.every((s) => typeof s === 'string')).toBe(true);
  });
});

describe('getPostBySlug', () => {
  it('returns the correct post for a known slug', () => {
    const post = getPostBySlug('go-cli-tool');
    expect(post).not.toBeNull();
    expect(post!.title).toContain('Go');
  });

  it('returns null for an unknown slug', () => {
    expect(getPostBySlug('non-existent-post')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getPostBySlug('')).toBeNull();
  });

  it('contains content for a full post', () => {
    const post = getPostBySlug('vps-initial-setup');
    expect(post).not.toBeNull();
    expect(typeof post!.content).toBe('string');
    expect(post!.content.length).toBeGreaterThan(0);
  });

  it('preserves optional source and license metadata', () => {
    const post = getPostBySlug('cloudflare-workers-guide');
    expect(post).not.toBeNull();
    expect(post!.source).toBe('https://github.com/yuanjia1314/domain-check');
    expect(post!.license).toBe('MIT');
  });
});

describe('getPostsByTag', () => {
  it('returns posts matching the tag (case-insensitive)', () => {
    const posts = getPostsByTag('docker');
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((p) => p.tags.some((t) => t.toLowerCase() === 'docker'))).toBe(true);
  });

  it('returns an empty array for a non-existent tag', () => {
    expect(getPostsByTag('nonexistent-tag-xyz')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(getPostsByTag('')).toEqual([]);
  });

  it('handles Chinese tag names', () => {
    const posts = getPostsByTag('后端');
    expect(posts.length).toBeGreaterThan(0);
  });
});

describe('getAdjacentPosts', () => {
  it('returns prev and next for a middle post', () => {
    const { prev, next } = getAdjacentPosts('go-cli-tool');
    // With 10 posts sorted by date descending, go-cli-tool should have neighbors
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();
  });

  it('returns null for next on the first (newest) post', () => {
    const all = getAllPosts();
    const { prev, next } = getAdjacentPosts(all[0].slug);
    expect(next).toBeNull();
    expect(prev).not.toBeNull();
  });

  it('returns null for prev on the last (oldest) post', () => {
    const all = getAllPosts();
    const lastSlug = all[all.length - 1].slug;
    const { prev, next } = getAdjacentPosts(lastSlug);
    expect(prev).toBeNull();
    expect(next).not.toBeNull();
  });

  it('returns null for both when slug is unknown', () => {
    const { prev, next } = getAdjacentPosts('does-not-exist');
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});

describe('getRelatedPosts', () => {
  it('returns related posts without including the current post', () => {
    const related = getRelatedPosts('docker-deploy-guide');
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((post) => post.slug !== 'docker-deploy-guide')).toBe(true);
  });

  it('respects the requested limit', () => {
    expect(getRelatedPosts('docker-deploy-guide', 2).length).toBeLessThanOrEqual(2);
  });

  it('returns an empty array for an unknown slug', () => {
    expect(getRelatedPosts('does-not-exist')).toEqual([]);
  });
});

describe('getSeriesPosts', () => {
  it('returns posts from the same series in reading order', () => {
    const series = getSeriesPosts('vps-initial-setup');

    expect(series.map((post) => post.slug)).toEqual([
      'vps-initial-setup',
      'docker-deploy-guide',
      'nginx-reverse-proxy',
      'git-hooks-github-actions',
      'cicd-pipeline-design',
    ]);
  });

  it('returns an empty array for posts without a series', () => {
    expect(getSeriesPosts('go-cli-tool')).toEqual([]);
  });

  it('returns an empty array for an unknown slug', () => {
    expect(getSeriesPosts('does-not-exist')).toEqual([]);
  });
});

describe('getPaginatedPosts', () => {
  it('returns correct structure', () => {
    const result = getPaginatedPosts(1, 5);
    expect(result.posts.length).toBeGreaterThan(0);
    expect(typeof result.currentPage).toBe('number');
    expect(typeof result.totalPages).toBe('number');
    expect(typeof result.totalPosts).toBe('number');
  });

  it('clamps page number within bounds', () => {
    const result = getPaginatedPosts(999, 5);
    expect(result.currentPage).toBeLessThanOrEqual(result.totalPages);
  });

  it('returns different posts for different pages', () => {
    const page1 = getPaginatedPosts(1, 3);
    const page2 = getPaginatedPosts(2, 3);
    if (page2.posts.length > 0) {
      const page1Slugs = page1.posts.map((p) => p.slug);
      const page2Slugs = page2.posts.map((p) => p.slug);
      for (const slug of page2Slugs) {
        expect(page1Slugs).not.toContain(slug);
      }
    }
  });

  it('clamps page 0 to page 1', () => {
    const result = getPaginatedPosts(0, 5);
    expect(result.currentPage).toBe(1);
  });

  it('clamps negative page to page 1', () => {
    const result = getPaginatedPosts(-3, 5);
    expect(result.currentPage).toBe(1);
  });
});
