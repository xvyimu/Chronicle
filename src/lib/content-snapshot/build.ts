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
 * Canonical JSON for hashing: sorts object keys recursively so a pure
 * key-order refactor (no value change) does not churn the hash, while any
 * value change does. Arrays keep their order — tag *order* is normalized
 * separately below, everything else is order-significant.
 *
 * Named `canonicalJson` (not `stableStringify`) to avoid colliding with the
 * unrelated `stableStringify` in `./write.ts`, which only pretty-prints.
 */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Plain UTF-16 code-unit order (matches JSON.stringify's own ordering),
      // not `localeCompare` — the goal is only "independent of insertion
      // order", and locale collation is slower and machine-locale-dependent.
      return Object.fromEntries(
        Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
          a < b ? -1 : a > b ? 1 : 0,
        ),
      );
    }
    return val;
  });
}

/**
 * Stable content fingerprint (not cryptographic integrity for security —
 * just reproducible drift detection across builds).
 *
 * Hashes the **whole** committed snapshot entry — every frontmatter field
 * (`description` / `updatedAt` / `featured` / `published` / `license` / …)
 * plus the body — not a hand-picked subset. The idempotent write path skips
 * the rewrite when this hash matches, so any field left out here becomes a
 * field whose edit silently never reaches the committed snapshot (and thus
 * production SEO dates / OG descriptions). A field list is exactly the kind
 * of double-source that drifts; hashing the entry itself cannot.
 *
 * `tags` is the one deliberate normalization: tag order in frontmatter is
 * not meaningful, so it is sorted before hashing.
 */
export function computeContentHash(posts: PostFull[]): string {
  const lines = sortPostsByDateDesc(posts).map((p) => {
    const { content, ...rest } = p;
    const meta = { ...rest, tags: [...(rest.tags ?? [])].sort() };
    const metaFp = createHash('sha256').update(canonicalJson(meta), 'utf8').digest('hex');
    const bodyFp = createHash('sha256').update(content, 'utf8').digest('hex');
    return `${metaFp}\t${bodyFp}`;
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
