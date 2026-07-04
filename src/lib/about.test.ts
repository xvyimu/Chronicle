import { describe, it, expect } from 'vitest';
import { createAboutReader } from '@/lib/about';
import type { ContentSource } from '@/lib/content-source';

function makeSource(content: string | null): ContentSource {
  return {
    readFile: () => content,
    readDir: () => ['about.mdx'],
    getMtime: () => 1000,
  };
}

describe('getAboutContent', () => {
  it('returns a non-null string for the about page', () => {
    const reader = createAboutReader(makeSource('## About\n\nSome content.'));
    expect(reader.getContent()).toBe('## About\n\nSome content.');
  });

  it('returns null when about.mdx does not exist', () => {
    const reader = createAboutReader(makeSource(null));
    expect(reader.getContent()).toBeNull();
  });

  it('returns the raw file content unchanged', () => {
    const testContent = '## Test About\n\nThis is test content.';
    const reader = createAboutReader(makeSource(testContent));
    expect(reader.getContent()).toBe(testContent);
  });
});
