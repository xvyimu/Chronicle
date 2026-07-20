import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetAllCaches } from '@/lib/cache';
import type { PostMeta } from '@/types';
import {
  buildBacklinkIndex,
  createLinkGraph,
  assertWikilinksValid,
  getBacklinks,
} from './link-graph';

function meta(slug: string, overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    title: overrides.title ?? slug,
    description: overrides.description ?? `${slug} desc`,
    date: overrides.date ?? '2026-06-01',
    tags: overrides.tags ?? [],
    published: overrides.published ?? true,
    featured: overrides.featured ?? false,
    slug,
    readingTime: overrides.readingTime ?? '1 min read',
    wordCount: overrides.wordCount ?? 10,
    excerpt: overrides.excerpt ?? 'excerpt',
    headings: overrides.headings ?? [],
    searchText: overrides.searchText ?? slug,
    ...overrides,
  };
}

describe('buildBacklinkIndex', () => {
  it('builds reverse edges and dedupes sources', () => {
    const index = buildBacklinkIndex([
      {
        slug: 'a',
        content: 'see [[b]] and again [[b|Bee]] then [[c]]',
      },
      { slug: 'b', content: 'to [[a]]' },
      { slug: 'c', content: 'none' },
    ]);

    expect(index.get('b')).toEqual(['a']);
    expect(index.get('a')).toEqual(['b']);
    expect(index.get('c')).toEqual(['a']);
  });

  it('records self-links in the raw index', () => {
    const index = buildBacklinkIndex([{ slug: 'a', content: 'self [[a]]' }]);
    expect(index.get('a')).toEqual(['a']);
  });
});

describe('createLinkGraph', () => {
  beforeEach(() => {
    resetAllCaches();
  });

  afterEach(() => {
    resetAllCaches();
  });

  it('returns backlinks sorted by date desc then slug, excluding self', () => {
    const posts: PostMeta[] = [
      meta('older', { date: '2026-06-01', title: 'Older' }),
      meta('newer', { date: '2026-06-10', title: 'Newer' }),
      meta('target', { date: '2026-06-05', title: 'Target' }),
      meta('same-day-a', { date: '2026-06-08', title: 'A' }),
      meta('same-day-b', { date: '2026-06-08', title: 'B' }),
    ];

    const content: Record<string, string> = {
      older: 'links [[target]]',
      newer: 'also [[target]]',
      target: 'self [[target]] and [[missing-should-not-happen]]',
      'same-day-a': '[[target]]',
      'same-day-b': '[[target]]',
    };

    // Fix target content without broken link for this test
    content.target = 'self [[target]] only';

    const graph = createLinkGraph({
      getVisiblePosts: () => posts,
      getPostContent: (slug) => content[slug] ?? null,
    });

    const backlinks = graph.getBacklinks('target');
    expect(backlinks.map((p) => p.slug)).toEqual([
      'newer',
      'same-day-a',
      'same-day-b',
      'older',
    ]);
    expect(backlinks.every((p) => p.slug !== 'target')).toBe(true);
  });

  it('throws on missing wikilink target (fail closed)', () => {
    const posts = [meta('src'), meta('ok')];
    const graph = createLinkGraph({
      getVisiblePosts: () => posts,
      getPostContent: (slug) => (slug === 'src' ? 'broken [[missing-slug-xyz]]' : 'fine'),
    });

    expect(() => graph.assertValid()).toThrow(
      /\[wikilink\] broken link: src -> missing-slug-xyz/,
    );
  });

  it('rebuilds after resetAllCaches when fixtures change', () => {
    let contentA = 'links [[b]]';
    const posts = [meta('a'), meta('b')];
    const graph = createLinkGraph({
      getVisiblePosts: () => posts,
      getPostContent: (slug) => (slug === 'a' ? contentA : slug === 'b' ? 'x' : null),
    });

    expect(graph.getBacklinks('b').map((p) => p.slug)).toEqual(['a']);

    contentA = 'no links';
    // Without reset, cache may still return old reverse index
    expect(graph.getBacklinks('b').map((p) => p.slug)).toEqual(['a']);

    resetAllCaches();
    expect(graph.getBacklinks('b')).toEqual([]);
  });
});

describe('assertWikilinksValid (filesystem content)', () => {
  beforeEach(() => {
    resetAllCaches();
  });

  afterEach(() => {
    resetAllCaches();
  });

  it('passes against default blog posts', () => {
    expect(() => assertWikilinksValid()).not.toThrow();
  });

  it('exposes getBacklinks for real sample posts after mutual links', () => {
    const result = getBacklinks('docker-deploy-guide');
    const slugs = result.map((p) => p.slug);
    expect(slugs).toContain('vps-initial-setup');
    expect(slugs).toContain('nginx-reverse-proxy');
  });
});
