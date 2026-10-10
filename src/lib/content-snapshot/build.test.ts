import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { PostFull } from '@/types';
import {
  buildContentSnapshotPayload,
  computeContentHash,
  resolveSnapshotBuiltAt,
} from './build';
import { resolveContentBackend } from './paths';
import { readContentSnapshot, resetContentSnapshotCacheForTests } from './read';
import { verifyContentSnapshot, writeContentSnapshot } from './write';
import { createSnapshotPostRepository } from './snapshot-repository';

function post(
  slug: string,
  content: string,
  overrides: Partial<PostFull> = {},
): PostFull {
  return {
    title: overrides.title ?? slug,
    description: overrides.description ?? `${slug} desc`,
    date: overrides.date ?? '2026-06-01',
    tags: overrides.tags ?? ['t'],
    published: overrides.published ?? true,
    featured: overrides.featured ?? false,
    slug,
    readingTime: overrides.readingTime ?? '1 min read',
    wordCount: overrides.wordCount ?? 10,
    excerpt: overrides.excerpt ?? 'excerpt',
    content,
    ...overrides,
  };
}

const tmpDirs: string[] = [];

afterEach(() => {
  resetContentSnapshotCacheForTests();
  for (const dir of tmpDirs.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

describe('resolveContentBackend', () => {
  it('honors explicit CONTENT_BACKEND', () => {
    expect(resolveContentBackend({ CONTENT_BACKEND: 'fs' })).toBe('fs');
    expect(resolveContentBackend({ CONTENT_BACKEND: 'snapshot' })).toBe('snapshot');
    expect(resolveContentBackend({ CONTENT_BACKEND: 'SNAPSHOT' })).toBe('snapshot');
  });

  it('defaults production → snapshot, otherwise fs', () => {
    expect(resolveContentBackend({ NODE_ENV: 'production' })).toBe('snapshot');
    expect(resolveContentBackend({ NODE_ENV: 'development' })).toBe('fs');
    expect(resolveContentBackend({ NODE_ENV: 'test' })).toBe('fs');
    expect(resolveContentBackend({})).toBe('fs');
  });

  it('explicit env overrides production default', () => {
    expect(
      resolveContentBackend({
        NODE_ENV: 'production',
        CONTENT_BACKEND: 'fs',
      }),
    ).toBe('fs');
  });
});

describe('buildContentSnapshotPayload', () => {
  it('sorts meta and builds payload', () => {
    const posts = [
      post('b', 'body', { date: '2026-06-02', title: 'B' }),
      post('a', 'hello', { date: '2026-06-01', title: 'A' }),
    ];
    const payload = buildContentSnapshotPayload(posts, {
      builtAt: '2026-07-01T00:00:00.000Z',
    });

    expect(payload.manifest.version).toBe(2);
    expect(payload.manifest.postCount).toBe(2);
    expect(payload.manifest.builtAt).toBe('2026-07-01T00:00:00.000Z');
    expect(payload.postsMeta.map((p) => p.slug)).toEqual(['b', 'a']);
    expect(payload.postsMeta.every((p) => !('content' in p))).toBe(true);
    expect(payload.manifest.contentHash).toBe(computeContentHash(posts));
  });

  it('handles empty posts', () => {
    const payload = buildContentSnapshotPayload([]);
    expect(payload.manifest.postCount).toBe(0);
    expect(payload.postsFull).toEqual([]);
  });

  it('changes contentHash when body is rewritten at the same length', () => {
    const a = post('x', 'abcd', { date: '2026-06-01', title: 'Same' });
    const b = post('x', 'wxyz', { date: '2026-06-01', title: 'Same' });
    expect(a.content.length).toBe(b.content.length);
    expect(computeContentHash([a])).not.toBe(computeContentHash([b]));
  });

  it('changes contentHash when seriesSlug changes without body edit', () => {
    const a = post('x', 'body', {
      date: '2026-06-01',
      title: 'Same',
      series: '路线',
      seriesSlug: 'route-a',
    });
    const b = post('x', 'body', {
      date: '2026-06-01',
      title: 'Same',
      series: '路线',
      seriesSlug: 'route-b',
    });
    expect(computeContentHash([a])).not.toBe(computeContentHash([b]));
  });

  // Regression: writeContentSnapshot skips when contentHash matches. Every
  // serialized field must therefore participate in the hash, or its edits
  // silently stay stale in production's committed snapshot.
  it.each([
    ['updatedAt', { updatedAt: '2026-10-10' }],
    ['description', { description: 'new desc' }],
    ['featured', { featured: true }],
    ['published', { published: false }],
    ['license', { license: 'MIT' }],
    ['category', { category: 'DevOps' }],
    ['image', { image: '/images/x.png' }],
    ['source', { source: 'https://example.com/repo' }],
    ['readingTime', { readingTime: '2 min read' }],
    ['wordCount', { wordCount: 20 }],
    ['excerpt', { excerpt: 'new excerpt' }],
  ])('changes contentHash when %s changes without body edit', (_, override) => {
    const original = post('x', 'body', { date: '2026-06-01' });
    const changed = post('x', 'body', {
      date: '2026-06-01',
      ...override,
    });
    expect(computeContentHash([original])).not.toBe(computeContentHash([changed]));
  });

  // The hash canonicalizes key order, so a pure property-order refactor (no
  // value change) must NOT churn it — otherwise every field reorder would
  // force a snapshot rewrite for nothing.
  it('is invariant to frontmatter key insertion order', () => {
    const a: PostFull = {
      ...post('x', 'body', { date: '2026-06-01' }),
      title: 'Same',
      description: 'desc',
    };
    const b: PostFull = {
      description: 'desc',
      date: '2026-06-01',
      content: 'body',
      slug: 'x',
      title: 'Same',
      tags: a.tags,
      published: true,
      featured: false,
      readingTime: a.readingTime,
      wordCount: a.wordCount,
      excerpt: a.excerpt,
    };
    expect(computeContentHash([a])).toBe(computeContentHash([b]));
  });
});

describe('resolveSnapshotBuiltAt', () => {
  it('prefers explicit builtAt', () => {
    expect(
      resolveSnapshotBuiltAt({
        builtAt: '2026-07-01T00:00:00.000Z',
        env: { SOURCE_DATE_EPOCH: '1' },
      }),
    ).toBe('2026-07-01T00:00:00.000Z');
  });

  it('uses SOURCE_DATE_EPOCH when set', () => {
    expect(
      resolveSnapshotBuiltAt({
        env: { SOURCE_DATE_EPOCH: '1719792000' },
      }),
    ).toBe('2024-07-01T00:00:00.000Z');
  });
});

describe('write + read snapshot', () => {
  it('round-trips payload and skips write when contentHash matches', () => {
    const posts = [
      post('a', 'body', { date: '2026-06-01' }),
      post('b', 'see [[a]]', { date: '2026-06-02' }),
    ];
    const payload = buildContentSnapshotPayload(posts, {
      builtAt: '2026-07-01T00:00:00.000Z',
    });

    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
    tmpDirs.push(cwd);

    const first = writeContentSnapshot(payload, { cwd });
    expect(first.wrote).toBe(true);

    const root = path.join(cwd, 'generated', 'content-snapshot');
    const loaded = readContentSnapshot(root);
    expect(loaded.manifest.contentHash).toBe(payload.manifest.contentHash);
    expect(loaded.postsFull.map((p) => p.slug)).toEqual(['b', 'a']);

    const second = writeContentSnapshot(
      buildContentSnapshotPayload(posts, {
        builtAt: '2099-01-01T00:00:00.000Z',
      }),
      { cwd },
    );
    expect(second.wrote).toBe(false);
    if (!second.wrote) {
      expect(second.reason).toBe('unchanged');
    }
  });

  it('throws on missing snapshot files', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-missing-'));
    tmpDirs.push(cwd);
    const root = path.join(cwd, 'generated', 'content-snapshot');
    expect(() => readContentSnapshot(root)).toThrow(/missing file/);
  });

  it('throws on version mismatch', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-ver-'));
    tmpDirs.push(cwd);
    const root = path.join(cwd, 'generated', 'content-snapshot');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(
      path.join(root, 'manifest.json'),
      JSON.stringify({
        version: 99,
        builtAt: 'x',
        postCount: 0,
        contentHash: 'abc',
      }),
      'utf8',
    );
    expect(() => readContentSnapshot(root)).toThrow(/unsupported version/);
  });
});

describe('verifyContentSnapshot', () => {
  it('passes when the on-disk snapshot matches the freshly built payload', () => {
    const posts = [
      post('a', 'body', { date: '2026-06-01' }),
      post('b', 'see [[a]]', { date: '2026-06-02' }),
    ];
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-verify-ok-'));
    tmpDirs.push(cwd);

    const payload = buildContentSnapshotPayload(posts, {
      builtAt: '2026-07-01T00:00:00.000Z',
    });
    writeContentSnapshot(payload, { cwd });

    // Rebuild with a different builtAt — contentHash must still match.
    const rebuilt = buildContentSnapshotPayload(posts, {
      builtAt: '2099-01-01T00:00:00.000Z',
    });
    const result = verifyContentSnapshot(rebuilt, { cwd });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentHash).toBe(payload.manifest.contentHash);
    }
  });

  it('fails closed when no snapshot manifest exists', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-verify-missing-'));
    tmpDirs.push(cwd);
    const payload = buildContentSnapshotPayload([post('a', 'body')], {
      builtAt: '2026-07-01T00:00:00.000Z',
    });
    const result = verifyContentSnapshot(payload, { cwd });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing');
      expect(result.actual).toBeNull();
    }
  });

  it('fails closed when the committed snapshot is stale', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-verify-stale-'));
    tmpDirs.push(cwd);

    writeContentSnapshot(
      buildContentSnapshotPayload([post('a', 'old body', { date: '2026-06-01' })], {
        builtAt: '2026-07-01T00:00:00.000Z',
      }),
      { cwd },
    );

    const drifted = buildContentSnapshotPayload(
      [post('a', 'new body', { date: '2026-06-01' })],
      { builtAt: '2026-07-01T00:00:00.000Z' },
    );
    const result = verifyContentSnapshot(drifted, { cwd });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('hash-mismatch');
      expect(result.expected).toBe(drifted.manifest.contentHash);
    }
  });
});

describe('createSnapshotPostRepository', () => {
  it('exposes meta without content and full posts by slug', () => {
    const posts = [
      post('alpha', 'content-a', {
        date: '2026-06-10',
        featured: true,
        title: 'Alpha',
      }),
      post('beta', 'body', {
        date: '2026-06-01',
        title: 'Beta',
      }),
    ];
    const payload = buildContentSnapshotPayload(posts, {
      builtAt: '2026-07-01T00:00:00.000Z',
    });
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-repo-'));
    tmpDirs.push(cwd);
    writeContentSnapshot(payload, { cwd });
    const root = path.join(cwd, 'generated', 'content-snapshot');

    const repo = createSnapshotPostRepository(root);
    const all = repo.getAllPosts();
    expect(all.map((p) => p.slug)).toEqual(['alpha', 'beta']);
    for (const p of all) {
      expect('content' in p).toBe(false);
    }
    expect(repo.getPostBySlug('alpha')?.content).toBe('content-a');
    expect(repo.getPostBySlug('missing')).toBeNull();
    expect(repo.getFeaturedPosts().map((p) => p.slug)).toEqual(['alpha']);
    expect(repo.getAllPostSlugs()).toEqual(['alpha', 'beta']);
  });
});
