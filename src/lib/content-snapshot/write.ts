import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_SNAPSHOT_FILES, getContentSnapshotRoot } from './paths';
import type { ContentSnapshotManifest, ContentSnapshotPayload } from './types';

function stableStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readExistingManifest(root: string): ContentSnapshotManifest | null {
  const filePath = path.join(root, CONTENT_SNAPSHOT_FILES.manifest);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as ContentSnapshotManifest;
  } catch {
    return null;
  }
}

export type WriteContentSnapshotResult =
  | { wrote: false; reason: 'unchanged'; contentHash: string }
  | { wrote: true; contentHash: string; root: string };

/**
 * Write snapshot files under generated/content-snapshot.
 * If contentHash matches the on-disk manifest, skip write (idempotent / quiet CI).
 * Uses temp dir + rename for atomic-ish replacement.
 */
export function writeContentSnapshot(
  payload: ContentSnapshotPayload,
  options?: { cwd?: string; force?: boolean },
): WriteContentSnapshotResult {
  const root = getContentSnapshotRoot(options?.cwd);
  const existing = readExistingManifest(root);

  if (
    !options?.force &&
    existing?.contentHash === payload.manifest.contentHash &&
    existing.version === payload.manifest.version
  ) {
    return {
      wrote: false,
      reason: 'unchanged',
      contentHash: payload.manifest.contentHash,
    };
  }

  // Preserve prior builtAt only when contentHash unchanged is already handled;
  // on content change, keep the new builtAt from payload.
  const files: Record<string, string> = {
    [CONTENT_SNAPSHOT_FILES.manifest]: stableStringify(payload.manifest),
    [CONTENT_SNAPSHOT_FILES.postsMeta]: stableStringify(payload.postsMeta),
    [CONTENT_SNAPSHOT_FILES.postsFull]: stableStringify(payload.postsFull),
    [CONTENT_SNAPSHOT_FILES.searchDocs]: stableStringify(payload.searchDocs),
    [CONTENT_SNAPSHOT_FILES.gardenGraph]: stableStringify(payload.gardenGraph),
    [CONTENT_SNAPSHOT_FILES.positions]: stableStringify(payload.positions),
  };

  fs.mkdirSync(root, { recursive: true });

  const tmpRoot = path.join(
    root,
    `.tmp-snapshot-${process.pid}-${Date.now().toString(36)}`,
  );
  fs.mkdirSync(tmpRoot, { recursive: true });

  try {
    for (const [name, body] of Object.entries(files)) {
      fs.writeFileSync(path.join(tmpRoot, name), body, 'utf8');
    }
    for (const name of Object.keys(files)) {
      const from = path.join(tmpRoot, name);
      const to = path.join(root, name);
      fs.renameSync(from, to);
    }
  } finally {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }

  return {
    wrote: true,
    contentHash: payload.manifest.contentHash,
    root,
  };
}
