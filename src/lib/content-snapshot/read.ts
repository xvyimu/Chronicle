import fs from 'node:fs';
import path from 'node:path';
import type { PostFull, PostMeta } from '@/types';
import type { GardenGraph } from '@/lib/posts/link-graph';
import { CONTENT_SNAPSHOT_FILES, getContentSnapshotRoot } from './paths';
import {
  CONTENT_SNAPSHOT_VERSION,
  type ContentSnapshotManifest,
  type ContentSnapshotPayload,
  type GardenPosition,
} from './types';

let cached: ContentSnapshotPayload | null = null;
let cachedRoot: string | null = null;

function readJsonFile<T>(filePath: string): T {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new Error(
        `[content-snapshot] missing file: ${filePath}. Run \`pnpm content:build\`.`,
      );
    }
    throw e;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`[content-snapshot] invalid JSON: ${filePath}`);
  }
}

function assertManifest(manifest: ContentSnapshotManifest): void {
  if (manifest.version !== CONTENT_SNAPSHOT_VERSION) {
    throw new Error(
      `[content-snapshot] unsupported version ${String(manifest.version)} (expected ${CONTENT_SNAPSHOT_VERSION}). Run \`pnpm content:build\`.`,
    );
  }
  if (typeof manifest.contentHash !== 'string' || !manifest.contentHash) {
    throw new Error('[content-snapshot] manifest.contentHash is required');
  }
  if (typeof manifest.postCount !== 'number') {
    throw new Error('[content-snapshot] manifest.postCount is required');
  }
}

/**
 * Synchronously load and validate the committed content snapshot (Node only).
 * Results are cached per rootDir for the process lifetime.
 */
export function readContentSnapshot(rootDir?: string): ContentSnapshotPayload {
  const root = rootDir ?? getContentSnapshotRoot();
  if (cached && cachedRoot === root) return cached;

  const manifest = readJsonFile<ContentSnapshotManifest>(
    path.join(root, CONTENT_SNAPSHOT_FILES.manifest),
  );
  assertManifest(manifest);

  const postsMeta = readJsonFile<PostMeta[]>(
    path.join(root, CONTENT_SNAPSHOT_FILES.postsMeta),
  );
  const postsFull = readJsonFile<PostFull[]>(
    path.join(root, CONTENT_SNAPSHOT_FILES.postsFull),
  );
  const searchDocs = readJsonFile<PostMeta[]>(
    path.join(root, CONTENT_SNAPSHOT_FILES.searchDocs),
  );
  const gardenGraph = readJsonFile<GardenGraph>(
    path.join(root, CONTENT_SNAPSHOT_FILES.gardenGraph),
  );
  const positions = readJsonFile<Record<string, GardenPosition>>(
    path.join(root, CONTENT_SNAPSHOT_FILES.positions),
  );

  if (postsMeta.length !== manifest.postCount) {
    throw new Error(
      `[content-snapshot] postCount mismatch: manifest=${manifest.postCount}, posts-meta=${postsMeta.length}`,
    );
  }

  cached = {
    manifest,
    postsMeta,
    postsFull,
    searchDocs,
    gardenGraph,
    positions,
  };
  cachedRoot = root;
  return cached;
}

export function getSnapshotPostsMeta(rootDir?: string): PostMeta[] {
  return readContentSnapshot(rootDir).postsMeta;
}

export function getSnapshotPostBySlug(slug: string, rootDir?: string): PostFull | null {
  const { postsFull } = readContentSnapshot(rootDir);
  return postsFull.find((p) => p.slug === slug) ?? null;
}

export function getSnapshotGardenGraph(rootDir?: string): GardenGraph {
  return readContentSnapshot(rootDir).gardenGraph;
}

export function getSnapshotPositions(rootDir?: string): Record<string, GardenPosition> {
  return readContentSnapshot(rootDir).positions;
}

/** Test-only: clear module-level snapshot cache. */
export function resetContentSnapshotCacheForTests(): void {
  cached = null;
  cachedRoot = null;
}
