import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { assertPostsDirectory, loadRssPosts } from '../../scripts/generate-rss';

const temporaryDirectories: string[] = [];

function createTemporaryDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-rss-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  vi.unstubAllEnvs();
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('generate-rss content validation', () => {
  it('fails instead of silently skipping invalid frontmatter', () => {
    const directory = createTemporaryDirectory();
    const filename = '2026-07-invalid.mdx';
    fs.writeFileSync(
      path.join(directory, filename),
      `---\ntitle: Invalid post\ndescription: Test\ndate: 2026-02-30\ntags: []\n---\nBody`,
    );

    expect(() => loadRssPosts([filename], directory)).toThrow(
      `[RSS] ${filename} frontmatter invalid`,
    );
  });

  it('fails a production build when the posts directory is missing', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const missingDirectory = path.join(
      createTemporaryDirectory(),
      'missing-content-blog',
    );

    expect(() => assertPostsDirectory(missingDirectory)).toThrow(
      '[RSS] content/blog directory is missing',
    );
  });
});
