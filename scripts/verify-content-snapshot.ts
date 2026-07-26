/**
 * Verify the committed content snapshot is in sync with the MDX sources —
 * WITHOUT writing to the working tree.
 *
 * Complements the CI `git diff --exit-code -- generated/content-snapshot` gate:
 * that gate only catches drift after `pnpm content:build` mutates files, and it
 * depends on a clean git tree. This check rebuilds the payload in-memory and
 * compares its contentHash against the on-disk manifest, so it fails closed on
 * stale/missing/version-mismatched snapshots even outside git (local, hooks).
 *
 * Usage: `pnpm content:verify`
 *
 * Exit codes:
 *   0 — snapshot matches sources
 *   1 — snapshot missing, stale, or on a different schema version
 */
import { createPostRepository } from '@/lib/posts/repository';
import { filesystemSource } from '@/lib/content-source';
import {
  buildContentSnapshotPayload,
  verifyContentSnapshot,
} from '@/lib/content-snapshot';
import type { PostFull } from '@/types';

function loadProductionVisiblePosts(): PostFull[] {
  const repo = createPostRepository(filesystemSource);
  const candidates = repo.getAllPostSlugs();
  const full: PostFull[] = [];
  for (const slug of candidates) {
    const post = repo.getPostBySlug(slug);
    if (post && post.published !== false) full.push(post);
  }
  return full;
}

function main(): void {
  const visible = loadProductionVisiblePosts();
  if (visible.length === 0) {
    console.error(
      '[content:verify] no visible posts — refusing to verify empty snapshot',
    );
    process.exit(1);
  }

  const payload = buildContentSnapshotPayload(visible);
  const result = verifyContentSnapshot(payload);

  if (result.ok) {
    console.log(
      `[content:verify] snapshot in sync (posts=${visible.length}, hash=${result.contentHash.slice(0, 12)}…)`,
    );
    return;
  }

  const hint = 'Run `pnpm content:build` and commit generated/content-snapshot.';
  switch (result.reason) {
    case 'missing':
      console.error(
        `[content:verify] snapshot manifest missing (expected hash=${result.expected.slice(0, 12)}…). ${hint}`,
      );
      break;
    case 'version-mismatch':
      console.error(
        `[content:verify] snapshot schema version mismatch: on-disk=${result.actual}, expected=${result.expected}. ${hint}`,
      );
      break;
    case 'hash-mismatch':
      console.error(
        `[content:verify] snapshot is stale: on-disk hash=${(result.actual ?? '∅').slice(0, 12)}…, ` +
          `sources hash=${result.expected.slice(0, 12)}…. ${hint}`,
      );
      break;
  }
  process.exit(1);
}

main();
