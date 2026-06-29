import { describe, it, expect } from 'vitest';
import {
  extractPostHeadings,
  extractPostExcerpt,
  buildPostSearchText,
} from './search-text';

describe('extractPostHeadings', () => {
  it('extracts h2 and h3 headings without trailing hashes', () => {
    const mdx = [
      '## First Section',
      'Body',
      '### Nested Topic ###',
      'More body',
    ].join('\n');
    expect(extractPostHeadings(mdx)).toEqual(['First Section', 'Nested Topic']);
  });

  it('ignores h1 and h4+', () => {
    const mdx = '# H1\n## H2\n### H3\n#### H4';
    expect(extractPostHeadings(mdx)).toEqual(['H2', 'H3']);
  });

  it('returns empty array when no headings', () => {
    expect(extractPostHeadings('Just body text')).toEqual([]);
  });
});

describe('extractPostExcerpt', () => {
  const mdx = [
    '> Opening note',
    '',
    '## First Section',
    'The first paragraph links to [Next.js](https://nextjs.org).',
    '',
    '### Nested Topic ###',
    'Inline `code` should remain searchable.',
    '',
    '```ts',
    'const hidden = true;',
    '```',
  ].join('\n');

  it('builds a plain-text excerpt from MDX content', () => {
    expect(extractPostExcerpt(mdx, 80)).toContain('Opening note');
    expect(extractPostExcerpt(mdx, 80)).not.toContain('hidden');
  });

  it('preserves inline code text without backticks', () => {
    expect(extractPostExcerpt(mdx, 200)).toContain('code should remain searchable');
  });

  it('does not truncate when content fits within maxLength', () => {
    const short = 'Short content';
    expect(extractPostExcerpt(short, 100)).toBe(short);
  });

  it('appends ellipsis when truncated', () => {
    const long = 'a'.repeat(200);
    const excerpt = extractPostExcerpt(long, 50);
    expect(excerpt.endsWith('...')).toBe(true);
    expect(excerpt.length).toBeLessThan(long.length);
  });
});

describe('buildPostSearchText', () => {
  const mdx = [
    '## First Section',
    'Body content with [link](https://example.com).',
  ].join('\n');

  it('builds search text from frontmatter, headings, and body content', () => {
    const searchText = buildPostSearchText({
      title: 'Searchable Title',
      description: 'Searchable description',
      tags: ['Next.js'],
      category: 'Frontend',
      series: 'App Router',
    }, mdx);

    expect(searchText).toContain('Searchable Title');
    expect(searchText).toContain('First Section');
    expect(searchText).toContain('Next.js');
    expect(searchText).toContain('link');
  });

  it('handles missing optional fields', () => {
    const searchText = buildPostSearchText({
      title: 'Title Only',
      description: 'Desc',
      tags: [],
    }, mdx);
    expect(searchText).toContain('Title Only');
  });
});
