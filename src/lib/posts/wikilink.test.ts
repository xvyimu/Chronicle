import { describe, it, expect } from 'vitest';
import { normalizeWikilinkSlug, wikilinkHref, extractWikilinks } from './wikilink';

describe('normalizeWikilinkSlug', () => {
  it('trims whitespace', () => {
    expect(normalizeWikilinkSlug('  docker-deploy-guide  ')).toBe('docker-deploy-guide');
  });

  it('rejects empty after trim', () => {
    expect(() => normalizeWikilinkSlug('   ')).toThrow(/empty target/);
    expect(() => normalizeWikilinkSlug('')).toThrow(/empty target/);
  });
});

describe('wikilinkHref', () => {
  it('builds /blog/{slug}', () => {
    expect(wikilinkHref('docker-deploy-guide')).toBe('/blog/docker-deploy-guide');
  });
});

describe('extractWikilinks', () => {
  it('parses [[slug]]', () => {
    expect(extractWikilinks('see [[docker-deploy-guide]] now')).toEqual([
      {
        slug: 'docker-deploy-guide',
        label: 'docker-deploy-guide',
        raw: '[[docker-deploy-guide]]',
      },
    ]);
  });

  it('parses [[slug|label]] with Chinese label', () => {
    expect(extractWikilinks('见 [[docker-deploy-guide|Docker 部署]]')).toEqual([
      {
        slug: 'docker-deploy-guide',
        label: 'Docker 部署',
        raw: '[[docker-deploy-guide|Docker 部署]]',
      },
    ]);
  });

  it('extracts multiple links on one line', () => {
    const matches = extractWikilinks('[[a]] and [[b|Bee]] then [[c]]');
    expect(matches.map((m) => m.slug)).toEqual(['a', 'b', 'c']);
    expect(matches[1].label).toBe('Bee');
  });

  it('trims target and label; empty label falls back to slug', () => {
    expect(extractWikilinks('[[  foo  |  bar  ]]')[0]).toMatchObject({
      slug: 'foo',
      label: 'bar',
    });
    expect(extractWikilinks('[[foo|]]')[0]).toMatchObject({
      slug: 'foo',
      label: 'foo',
    });
    expect(extractWikilinks('[[foo|   ]]')[0]).toMatchObject({
      slug: 'foo',
      label: 'foo',
    });
  });

  it('rejects empty [[ ]] and [[|x]]', () => {
    expect(extractWikilinks('[[ ]]')).toEqual([]);
    expect(extractWikilinks('[[|label]]')).toEqual([]);
  });

  it('ignores wikilinks inside fenced code blocks', () => {
    const content = [
      'before [[keep-me]]',
      '```bash',
      'echo [[inside-fence]]',
      '```',
      'after [[also-keep]]',
    ].join('\n');
    const slugs = extractWikilinks(content).map((m) => m.slug);
    expect(slugs).toEqual(['keep-me', 'also-keep']);
  });

  it('ignores wikilinks inside inline code', () => {
    const content = 'use `[[inline-code]]` but keep [[visible]]';
    expect(extractWikilinks(content).map((m) => m.slug)).toEqual(['visible']);
  });
});
