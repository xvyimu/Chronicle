import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('documentation link checker', () => {
  it('passes its parser fixture suite', () => {
    const fixtureSuite = path.resolve(process.cwd(), 'scripts/check-doc-links.test.mjs');
    const output = execFileSync(process.execPath, ['--test', fixtureSuite], {
      encoding: 'utf8',
    });

    expect(output).toContain('fail 0');
  });

  it('exposes the standard command and scans the current repository', () => {
    const packageJson = JSON.parse(
      readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.['check:docs']).toBe('node scripts/check-doc-links.mjs');

    const command = process.platform === 'win32' ? 'cmd.exe' : 'pnpm';
    const args =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm check:docs']
        : ['check:docs'];
    const output = execFileSync(command, args, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const scannedFiles = /passed \((\d+) Markdown files\)\./u.exec(output);

    expect(scannedFiles).not.toBeNull();
    expect(Number(scannedFiles?.[1])).toBeGreaterThan(0);
  });

  it('returns a non-zero exit code and actionable output for a broken link', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'blog-doc-links-cli-'));
    const checker = path.resolve(process.cwd(), 'scripts/check-doc-links.mjs');

    try {
      writeFileSync(path.join(root, 'README.md'), '[Missing](docs/missing.md)\n');
      const result = spawnSync(process.execPath, [checker], {
        cwd: root,
        encoding: 'utf8',
      });

      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('README.md');
      expect(result.stderr).toContain('docs/missing.md');
      expect(result.stderr).toContain('target does not exist');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
