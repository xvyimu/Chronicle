import { describe, expect, it } from 'vitest';
import { extractWikilinks, wikilinkHref, normalizeWikilinkSlug } from './wikilink';

describe('extractWikilinks', () => {
  it('extracts [[slug]] with slug as label', () => {
    expect(extractWikilinks('见 [[some-post]]。')).toEqual([
      { slug: 'some-post', label: 'some-post', raw: '[[some-post]]' },
    ]);
  });

  it('extracts [[slug|label]] with custom label', () => {
    expect(extractWikilinks('见 [[some-post|一篇文章]]。')).toEqual([
      { slug: 'some-post', label: '一篇文章', raw: '[[some-post|一篇文章]]' },
    ]);
  });

  it('falls back to slug for an empty label', () => {
    expect(extractWikilinks('[[a|]]')[0].label).toBe('a');
  });

  it('extracts multiple links in order', () => {
    const r = extractWikilinks('[[a]] 和 [[b|c]]');
    expect(r.map((m) => m.slug)).toEqual(['a', 'b']);
  });

  it('ignores wikilinks inside fenced code blocks', () => {
    expect(extractWikilinks('```\n[[a]]\n```')).toEqual([]);
  });

  it('ignores wikilinks inside inline code', () => {
    expect(extractWikilinks('use `[[a]]` syntax')).toEqual([]);
  });

  it('returns empty when no wikilinks', () => {
    expect(extractWikilinks('普通文本')).toEqual([]);
  });
});

describe('wikilinkHref', () => {
  it('builds a /blog/<slug> href', () => {
    expect(wikilinkHref('some-post')).toBe('/blog/some-post');
  });
});

describe('normalizeWikilinkSlug', () => {
  it('trims whitespace', () => {
    expect(normalizeWikilinkSlug('  a  ')).toBe('a');
  });

  it('throws on empty target', () => {
    expect(() => normalizeWikilinkSlug('   ')).toThrow(/empty target slug/);
  });
});
