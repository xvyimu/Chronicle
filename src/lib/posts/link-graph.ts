import type { PostMeta } from '@/types';
import { createCache } from '@/lib/cache';
import { CONTENT_DIR } from '@/lib/content-dirs';
import { postRepository } from './repository';
import { extractWikilinks } from './wikilink';

export type LinkGraphPost = {
  slug: string;
  content: string;
} & Partial<PostMeta>;

export type GardenGraphNode = {
  slug: string;
  title: string;
  series?: string;
  tags: string[];
  category?: string;
};

export type GardenGraphEdge = {
  from: string;
  to: string;
};

export type GardenGraph = {
  nodes: GardenGraphNode[];
  edges: GardenGraphEdge[];
};

export type NeighborBundle = {
  /** Outbound wikilink targets (unique, slug asc). */
  outbound: PostMeta[];
  /** Inbound backlinks (date desc — same as getBacklinks). */
  inbound: PostMeta[];
};

type BacklinkIndexPayload = {
  /** target slug -> unique source slugs (unsorted) */
  reverse: Map<string, string[]>;
  /** slug -> PostMeta for visible posts (no content) */
  metaBySlug: Map<string, PostMeta>;
  /** directed outbound edges (self-links omitted) */
  edges: GardenGraphEdge[];
};

/**
 * Pure reverse-index builder.
 * Returns Map: target -> sorted unique source slugs (date not available → slug asc).
 * Self-links are recorded here; getBacklinks filters them out.
 */
export function buildBacklinkIndex(
  posts: Array<{ slug: string; content: string } & Partial<PostMeta>>,
): Map<string, string[]> {
  const reverse = new Map<string, Set<string>>();

  for (const post of posts) {
    const links = extractWikilinks(post.content);
    for (const link of links) {
      const set = reverse.get(link.slug) ?? new Set<string>();
      set.add(post.slug);
      reverse.set(link.slug, set);
    }
  }

  const out = new Map<string, string[]>();
  for (const [target, sources] of reverse) {
    out.set(
      target,
      [...sources].sort((a, b) => a.localeCompare(b)),
    );
  }
  return out;
}

/** Unique directed edges from post bodies (self-links skipped). */
export function buildGardenEdges(
  posts: Array<{ slug: string; content: string }>,
): GardenGraphEdge[] {
  const seen = new Set<string>();
  const edges: GardenGraphEdge[] = [];
  for (const post of posts) {
    for (const link of extractWikilinks(post.content)) {
      if (link.slug === post.slug) continue;
      const key = `${post.slug}\0${link.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: post.slug, to: link.slug });
    }
  }
  edges.sort((a, b) => {
    const f = a.from.localeCompare(b.from);
    return f !== 0 ? f : a.to.localeCompare(b.to);
  });
  return edges;
}

export function createLinkGraph(options: {
  getVisiblePosts: () => PostMeta[];
  getPostContent: (slug: string) => string | null;
}): {
  getBacklinks(slug: string): PostMeta[];
  getGardenGraph(): GardenGraph;
  getNeighbors(slug: string): NeighborBundle;
  assertValid(): void;
} {
  function buildPayload(): BacklinkIndexPayload {
    const visible = options.getVisiblePosts();
    const metaBySlug = new Map<string, PostMeta>();
    const withContent: Array<{ slug: string; content: string } & Partial<PostMeta>> = [];

    for (const meta of visible) {
      metaBySlug.set(meta.slug, meta);
      const content = options.getPostContent(meta.slug);
      if (content == null) {
        throw new Error(`[wikilink] missing content for visible post: ${meta.slug}`);
      }
      withContent.push({ ...meta, content });
    }

    // Fail closed: every extracted target must be in the visible slug set
    const visibleSlugs = new Set(metaBySlug.keys());
    for (const post of withContent) {
      for (const link of extractWikilinks(post.content)) {
        if (!visibleSlugs.has(link.slug)) {
          throw new Error(`[wikilink] broken link: ${post.slug} -> ${link.slug}`);
        }
      }
    }

    const reverse = buildBacklinkIndex(withContent);
    const edges = buildGardenEdges(withContent);
    return { reverse, metaBySlug, edges };
  }

  // Cache is created per factory instance so tests can inject fixtures
  const cache = createCache<BacklinkIndexPayload>({
    watchPath: CONTENT_DIR.blog,
  });

  function getPayload(): BacklinkIndexPayload {
    return cache.getOrCompute(buildPayload);
  }

  function getBacklinks(slug: string): PostMeta[] {
    const { reverse, metaBySlug } = getPayload();
    const sources = reverse.get(slug) ?? [];
    const metas = sources
      .filter((source) => source !== slug)
      .map((source) => metaBySlug.get(source))
      .filter((m): m is PostMeta => m != null);

    return metas.sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return a.slug.localeCompare(b.slug);
    });
  }

  function getGardenGraph(): GardenGraph {
    const { metaBySlug, edges } = getPayload();
    const nodes = [...metaBySlug.values()]
      .map((m) => ({
        slug: m.slug,
        title: m.title,
        series: m.series,
        tags: m.tags ?? [],
        category: m.category,
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
    return { nodes, edges };
  }

  function getNeighbors(slug: string): NeighborBundle {
    const { edges, metaBySlug } = getPayload();
    const outboundSlugs = [
      ...new Set(edges.filter((e) => e.from === slug).map((e) => e.to)),
    ].sort((a, b) => a.localeCompare(b));
    const outbound = outboundSlugs
      .map((s) => metaBySlug.get(s))
      .filter((m): m is PostMeta => m != null);
    return { outbound, inbound: getBacklinks(slug) };
  }

  function assertValid(): void {
    // Force rebuild / validation
    cache.invalidate();
    getPayload();
  }

  return { getBacklinks, getGardenGraph, getNeighbors, assertValid };
}

const defaultGraph = createLinkGraph({
  getVisiblePosts: () => postRepository.getAllPosts(),
  getPostContent: (slug) => postRepository.getPostBySlug(slug)?.content ?? null,
});

/**
 * Posts that link **to** `slug` (inbound edges).
 * Sorted: date desc, then slug asc. Excludes self-links. Dedupes by source.
 */
export function getBacklinks(slug: string): PostMeta[] {
  return defaultGraph.getBacklinks(slug);
}

/** Full garden adjacency for secondary UI (nodes + directed edges). */
export function getGardenGraph(): GardenGraph {
  return defaultGraph.getGardenGraph();
}

/** Outbound + inbound neighbors for article fold panel. */
export function getNeighbors(slug: string): NeighborBundle {
  return defaultGraph.getNeighbors(slug);
}

/**
 * Fail-closed validation: throws if any wikilink target is not a visible slug.
 */
export function assertWikilinksValid(): void {
  defaultGraph.assertValid();
}
