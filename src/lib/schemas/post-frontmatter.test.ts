import { describe, expect, it } from 'vitest';
import { postFrontmatterSchema } from './post-frontmatter';

const valid = {
  title: 'Test post',
  description: 'Description',
  date: '2026-06-15',
};

describe('postFrontmatterSchema', () => {
  it('rejects unknown frontmatter keys instead of silently stripping them', () => {
    expect(() => postFrontmatterSchema.parse({ ...valid, publised: false })).toThrow();
  });

  it('rejects dates that have the right shape but are not real calendar dates', () => {
    expect(() => postFrontmatterSchema.parse({ ...valid, date: '2026-02-30' })).toThrow();
  });

  it('rejects updatedAt dates that are not real calendar dates', () => {
    expect(() =>
      postFrontmatterSchema.parse({ ...valid, updatedAt: '2026-13-01' }),
    ).toThrow();
  });
});
