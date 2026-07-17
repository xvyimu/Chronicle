import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('managed E2E runner', () => {
  it('passes its lifecycle fixture suite', () => {
    const fixtureSuite = path.resolve(process.cwd(), 'scripts/run-e2e.test.mjs');
    const output = execFileSync(process.execPath, ['--test', fixtureSuite], {
      encoding: 'utf8',
    });

    expect(output).toContain('fail 0');
  });
});
