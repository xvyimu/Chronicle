import type { PostMeta } from '@/types';
import { createCache } from '@/lib/cache';
import { CONTENT_DIR } from '@/lib/content-dirs';
import { postRepository } from './repository';
import { extractWikilinks } from './wikilink';

export type LinkGraphPost = {
  slug: string;
  content: string;
} & Partial<PostMeta>;

type BacklinkIndexPayload = {
  /** target slug -> unique source slugs (unsorted) */
  reverse: Map<string, string[]>;
  /** slug -> PostMeta for visible posts (no content) */
  metaBySlug: Map<string, PostMeta>;
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

export function createLinkGraph(options: {
  getVisiblePosts: () => PostMeta[];
  getPostContent: (slug: string) => string | null;
}): { getBacklinks(slug: string): PostMeta[]; assertValid(): void } {
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
    return { reverse, metaBySlug };
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

  function assertValid(): void {
    // Force rebuild / validation
    cache.invalidate();
    getPayload();
  }

  return { getBacklinks, assertValid };
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

/**
 * Fail-closed validation: throws if any wikilink target is not a visible slug.
 */
export function assertWikilinksValid(): void {
  defaultGraph.assertValid();
}
