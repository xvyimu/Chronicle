import type { PostFull, PostMeta } from '@/types';

/** Snapshot schema version — bump when on-disk shape breaks compatibility. */
export const CONTENT_SNAPSHOT_VERSION = 2 as const;

export type ContentBackend = 'fs' | 'snapshot';

export type ContentSnapshotManifest = {
  version: typeof CONTENT_SNAPSHOT_VERSION;
  builtAt: string; // ISO-8601
  postCount: number;
  /**
   * Stable hash over the whole serialized snapshot entry — every frontmatter
   * field (canonical key order, `tags` sorted) plus body sha256. Used for
   * idempotent builds and CI drift detection; see `computeContentHash`.
   */
  contentHash: string;
};

export type ContentSnapshotPayload = {
  manifest: ContentSnapshotManifest;
  postsMeta: PostMeta[];
  postsFull: PostFull[];
};
