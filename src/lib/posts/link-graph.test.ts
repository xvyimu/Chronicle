import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetAllCaches } from '@/lib/cache';
import type { PostMeta } from '@/types';
import {
  buildBacklinkIndex,
  buildGardenEdges,
  createLinkGraph,
  assertWikilinksValid,
  getBacklinks,
  getGardenGraph,
  getNeighbors,
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

describe('buildGardenEdges', () => {
  it('emits unique directed edges and skips self-links', () => {
    const edges = buildGardenEdges([
      { slug: 'a', content: '[[b]] [[b|Bee]] [[a]] [[c]]' },
      { slug: 'b', content: '[[c]]' },
    ]);
    expect(edges).toEqual([
      { from: 'a', to: 'b' },
      { from: 'a', to: 'c' },
      { from: 'b', to: 'c' },
    ]);
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

  it('exposes garden graph nodes and edges with series/tags', () => {
    const posts = [
      meta('a', { title: 'A', series: 'S1', tags: ['t1'] }),
      meta('b', { title: 'B', tags: ['t2'] }),
    ];
    const graph = createLinkGraph({
      getVisiblePosts: () => posts,
      getPostContent: (slug) => (slug === 'a' ? 'to [[b]]' : 'plain'),
    });
    const garden = graph.getGardenGraph();
    expect(garden.nodes.map((n) => n.slug).sort()).toEqual(['a', 'b']);
    expect(garden.nodes.find((n) => n.slug === 'a')?.series).toBe('S1');
    expect(garden.nodes.find((n) => n.slug === 'a')?.tags).toEqual(['t1']);
    expect(garden.edges).toEqual([{ from: 'a', to: 'b' }]);
  });

  it('getNeighbors returns outbound and inbound', () => {
    const posts = [meta('a'), meta('b'), meta('c')];
    const graph = createLinkGraph({
      getVisiblePosts: () => posts,
      getPostContent: (slug) => {
        if (slug === 'a') return '[[b]] [[c]]';
        if (slug === 'c') return '[[b]]';
        return 'x';
      },
    });
    const n = graph.getNeighbors('b');
    expect(n.outbound).toEqual([]);
    expect(n.inbound.map((p) => p.slug).sort()).toEqual(['a', 'c']);
    const fromA = graph.getNeighbors('a');
    expect(fromA.outbound.map((p) => p.slug)).toEqual(['b', 'c']);
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

  it('getGardenGraph includes real posts and edges', () => {
    const garden = getGardenGraph();
    expect(garden.nodes.length).toBeGreaterThanOrEqual(14);
    expect(garden.edges.length).toBeGreaterThan(0);
    expect(garden.edges.some((e) => e.from === 'docker-deploy-guide')).toBe(true);
    expect(garden.nodes.every((n) => Array.isArray(n.tags))).toBe(true);
  });

  it('getNeighbors works on real sample post', () => {
    const n = getNeighbors('docker-deploy-guide');
    expect(n.outbound.map((p) => p.slug)).toEqual(
      expect.arrayContaining(['vps-initial-setup', 'nginx-reverse-proxy']),
    );
    expect(n.inbound.length).toBeGreaterThan(0);
  });
});
