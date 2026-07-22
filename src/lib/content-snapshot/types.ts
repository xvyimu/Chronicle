import type { PostFull, PostMeta } from '@/types';
import type { GardenGraph } from '@/lib/posts/link-graph';

/** Snapshot schema version — bump when on-disk shape breaks compatibility. */
export const CONTENT_SNAPSHOT_VERSION = 1 as const;

export type ContentBackend = 'fs' | 'snapshot';

export type ContentSnapshotManifest = {
  version: typeof CONTENT_SNAPSHOT_VERSION;
  builtAt: string; // ISO-8601
  postCount: number;
  /**
   * Stable hash over sorted slug + date + title + series fields + category/tags
   * + body sha256. Used for idempotent builds and CI drift detection.
   */
  contentHash: string;
};

export type GardenPosition = { x: number; y: number };

export type ContentSnapshotPayload = {
  manifest: ContentSnapshotManifest;
  postsMeta: PostMeta[];
  postsFull: PostFull[];
  /** Same shape as Fuse document array (PostMeta with searchText/headings). */
  searchDocs: PostMeta[];
  gardenGraph: GardenGraph;
  positions: Record<string, GardenPosition>;
};
