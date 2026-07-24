/**
 * Build committed content snapshot under generated/content-snapshot/.
 *
 * Always materializes **production-visible** posts (`published !== false`)
 * so production runtime can load the snapshot without re-scanning MDX.
 * Dev keeps `CONTENT_BACKEND=fs` by default and still reads drafts from disk.
 *
 * Usage: `pnpm content:build`
 * Local parity with CI: `pnpm content:check` (build + `git diff --exit-code`)
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

const BANNER = '='.repeat(70);

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

function failLoud(message: string, detail?: string): never {
  console.error('');
  console.error(BANNER);
  console.error('[content:build] FAILED');
  console.error(BANNER);
  console.error(message);
  if (detail) console.error(detail);
  console.error('');
  console.error('Fix:');
  console.error('  1. Fix MDX / frontmatter / content source issues above');
  console.error('  2. pnpm content:build');
  console.error('  3. git add generated/content-snapshot && commit the snapshot');
  console.error('  4. Local CI parity: pnpm content:check');
  console.error('');
  console.error('CI red: quality job runs `pnpm content:build` then');
  console.error('  `git diff --exit-code -- generated/content-snapshot`');
  console.error('  → uncommitted snapshot drift fails the PR (same as public/feed.*).');
  console.error(BANNER);
  console.error('');
  process.exit(1);
}

function main(): void {
  let visible: PostFull[];
  try {
    visible = loadProductionVisiblePosts();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failLoud('Could not load production-visible posts from content/blog.', msg);
  }

  if (visible.length === 0) {
    failLoud(
      'No visible posts — aborting empty snapshot.',
      'Need at least one MDX with published !== false under content/blog/.',
    );
  }

  let payload;
  try {
    payload = buildContentSnapshotPayload(visible);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failLoud('Failed while building snapshot payload.', msg);
  }

  let result;
  try {
    result = writeContentSnapshot(payload, {
      force: process.env.CONTENT_BUILD_FORCE === '1',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failLoud('Failed while writing generated/content-snapshot/.', msg);
  }

  if (result.wrote) {
    console.log(
      `[content:build] wrote snapshot → ${path.relative(process.cwd(), result.root)} ` +
        `(posts=${visible.length}, hash=${result.contentHash.slice(0, 12)}…)`,
    );
    console.log(
      '[content:build] remember to commit generated/content-snapshot/ (CI gates git diff).',
    );
  } else {
    console.log(`[content:build] unchanged (hash=${result.contentHash.slice(0, 12)}…)`);
  }
}

try {
  main();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  failLoud('Unexpected content:build failure.', msg);
}
