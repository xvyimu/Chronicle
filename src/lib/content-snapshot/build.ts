import { createHash } from 'node:crypto';
import type { PostFull, PostMeta } from '@/types';
import { CONTENT_SNAPSHOT_VERSION, type ContentSnapshotPayload } from './types';

function sortPostsByDateDesc(posts: PostFull[]): PostFull[] {
  return [...posts].sort((a, b) => {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return a.slug.localeCompare(b.slug);
  });
}

function toMeta(post: PostFull): PostMeta {
  const { content: _content, ...meta } = post;
  return meta;
}

/**
 * Stable content fingerprint (not cryptographic integrity for security —
 * just reproducible drift detection across builds).
 * Includes full body text so equal-length MDX rewrites still change the hash,
 * plus route-relevant frontmatter (series / seriesSlug / order / category / tags)
 * so IA metadata drift is not skipped by the idempotent write path.
 */
export function computeContentHash(posts: PostFull[]): string {
  const lines = sortPostsByDateDesc(posts).map((p) => {
    const bodyFp = createHash('sha256').update(p.content, 'utf8').digest('hex');
    const tags = [...(p.tags ?? [])].sort().join(',');
    return [
      p.slug,
      p.date,
      p.title,
      p.series ?? '',
      p.seriesSlug ?? '',
      p.seriesOrder ?? '',
      p.category ?? '',
      tags,
      bodyFp,
    ].join('\t');
  });
  return createHash('sha256').update(lines.join('\n'), 'utf8').digest('hex');
}

/** Prefer explicit builtAt, then SOURCE_DATE_EPOCH (reproducible builds), else wall clock. */
export function resolveSnapshotBuiltAt(options?: {
  builtAt?: string;
  env?: Record<string, string | undefined>;
}): string {
  if (options?.builtAt) return options.builtAt;
  const env = options?.env ?? process.env;
  const epoch = env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) {
    return new Date(Number(epoch) * 1000).toISOString();
  }
  return new Date().toISOString();
}

/**
 * Pure builder: input already-parsed **visible** PostFull[], output snapshot DTO.
 */
export function buildContentSnapshotPayload(
  visiblePosts: PostFull[],
  options?: { builtAt?: string },
): ContentSnapshotPayload {
  const postsFull = sortPostsByDateDesc(visiblePosts);
  const postsMeta = postsFull.map(toMeta);
  const contentHash = computeContentHash(postsFull);

  return {
    manifest: {
      version: CONTENT_SNAPSHOT_VERSION,
      builtAt: resolveSnapshotBuiltAt({ builtAt: options?.builtAt }),
      postCount: postsFull.length,
      contentHash,
    },
    postsMeta,
    postsFull,
  };
}
