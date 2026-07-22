/**
 * Build committed content snapshot under generated/content-snapshot/.
 *
 * Always materializes **production-visible** posts (`published !== false`)
 * so production runtime can load the snapshot without re-scanning MDX.
 * Dev keeps `CONTENT_BACKEND=fs` by default and still reads drafts from disk.
 *
 * Usage: `pnpm content:build`
 * Env:
 *   `CONTENT_BUILD_FORCE=1` — rewrite even when contentHash is unchanged
 *   `SOURCE_DATE_EPOCH=<unix>` — freeze manifest.builtAt for reproducible builds
 *                                (CI still gates on contentHash via git diff of
 *                                posts/meta/graph; builtAt alone does not fail the gate
 *                                when contentHash matches — write is skipped).
 */
import path from 'node:path';
import { createPostRepository } from '@/lib/posts/repository';
import { filesystemSource } from '@/lib/content-source';
import {
  buildContentSnapshotPayload,
  writeContentSnapshot,
} from '@/lib/content-snapshot';
import type { PostFull } from '@/types';

/**
 * Load production-visible PostFull from the filesystem.
 * Uses the fs repository factory (never the snapshot default instance).
 * In non-production NODE_ENV the repo returns drafts too — we filter here
 * so the snapshot always matches production visibility.
 */
function loadProductionVisiblePosts(): PostFull[] {
  const repo = createPostRepository(filesystemSource);
  // Prefer full slug list: when NODE_ENV is not production, includes drafts.
  // We still filter published so the committed artifact matches prod.
  const candidates = repo.getAllPostSlugs();
  const full: PostFull[] = [];
  for (const slug of candidates) {
    const post = repo.getPostBySlug(slug);
    if (post && post.published !== false) full.push(post);
  }
  // If somehow running under production NODE_ENV, getAllPostSlugs already
  // excludes drafts — the published filter is a no-op.
  return full;
}

function main(): void {
  const visible = loadProductionVisiblePosts();
  if (visible.length === 0) {
    throw new Error('[content:build] no visible posts — aborting empty snapshot');
  }

  const payload = buildContentSnapshotPayload(visible);
  const result = writeContentSnapshot(payload, {
    force: process.env.CONTENT_BUILD_FORCE === '1',
  });

  if (result.wrote) {
    console.log(
      `[content:build] wrote snapshot → ${path.relative(process.cwd(), result.root)} ` +
        `(posts=${visible.length}, hash=${result.contentHash.slice(0, 12)}…)`,
    );
  } else {
    console.log(`[content:build] unchanged (hash=${result.contentHash.slice(0, 12)}…)`);
  }
}

main();
