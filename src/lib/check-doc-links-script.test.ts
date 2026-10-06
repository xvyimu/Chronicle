import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('documentation link checker', () => {
  // 这两个用例 spawn 子进程跑 `node --test` / `pnpm check:docs`，
  // 并发全量跑时子进程启动+扫描 138 个 md 文件可能超过 vitest 默认 5s 超时。
  // 显式放宽超时（不改变断言语义），消除 R10 记录的间歇性 flaky。
  const SUBPROCESS_TIMEOUT_MS = 30_000;

  it(
    'passes its parser fixture suite',
    () => {
      const fixtureSuite = path.resolve(
        process.cwd(),
        'scripts/check-doc-links.test.mjs',
      );
      const output = execFileSync(process.execPath, ['--test', fixtureSuite], {
        encoding: 'utf8',
      });

      expect(output).toContain('fail 0');
    },
    SUBPROCESS_TIMEOUT_MS,
  );

  it(
    'exposes the standard command and scans the current repository',
    () => {
      const packageJson = JSON.parse(
        readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
      ) as { scripts?: Record<string, string> };

      expect(packageJson.scripts?.['check:docs']).toBe(
        'node scripts/check-doc-links.mjs',
      );

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
    },
    SUBPROCESS_TIMEOUT_MS,
  );

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
