import path from 'node:path';
import type { ContentBackend } from './types';

/** Relative to process.cwd() — committed artifact (not gitignored). */
export const CONTENT_SNAPSHOT_DIR = 'generated/content-snapshot';

export const CONTENT_SNAPSHOT_FILES = {
  manifest: 'manifest.json',
  postsMeta: 'posts-meta.json',
  postsFull: 'posts-full.json',
  searchDocs: 'search-docs.json',
  gardenGraph: 'garden-graph.json',
  positions: 'positions.json',
} as const;

export function getContentSnapshotRoot(cwd: string = process.cwd()): string {
  return path.join(cwd, CONTENT_SNAPSHOT_DIR);
}

/**
 * Resolve content backend from env.
 * Explicit CONTENT_BACKEND wins; otherwise production → snapshot, else fs.
 */
export function resolveContentBackend(
  env: { NODE_ENV?: string; CONTENT_BACKEND?: string } = process.env,
): ContentBackend {
  const raw = env.CONTENT_BACKEND?.trim().toLowerCase();
  if (raw === 'fs' || raw === 'snapshot') return raw;
  if (env.NODE_ENV === 'production') return 'snapshot';
  return 'fs';
}
