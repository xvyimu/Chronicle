import { describe, it, expect } from 'vitest';
import { getAboutContent } from '@/lib/about';
import { setContentSource } from './content-source';

describe('getAboutContent', () => {
  it('returns a non-null string for the about page', () => {
    const content = getAboutContent();
    expect(content).not.toBeNull();
    expect(typeof content).toBe('string');
    expect(content!.length).toBeGreaterThan(0);
  });

  it('returns null when about.mdx does not exist', () => {
    const original = setContentSource({
      readFile: () => null,
      readDir: () => [],
      getMtime: () => null,
    });
    try {
      const content = getAboutContent();
      expect(content).toBeNull();
    } finally {
      setContentSource(original);
    }
  });

  it('returns the raw file content unchanged', () => {
    const testContent = '## Test About\n\nThis is test content.';
    const original = setContentSource({
      readFile: () => testContent,
      readDir: () => ['about.mdx'],
      getMtime: () => 1000,
    });
    try {
      const content = getAboutContent();
      expect(content).toBe(testContent);
    } finally {
      setContentSource(original);
    }
  });
});
