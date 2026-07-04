import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from './parse-frontmatter';

describe('parseFrontmatter', () => {
  it('parses standard YAML frontmatter (quoted date → string, matches real mdx files)', () => {
    const raw = "---\ntitle: Hello\ndate: '2026-06-23'\n---\nBody text";
    const { data, content } = parseFrontmatter(raw);
    expect(data).toEqual({ title: 'Hello', date: '2026-06-23' });
    expect(content).toBe('Body text');
  });

  it('parses unquoted ISO date as Date object (YAML/js-yaml behavior, matches gray-matter safeLoad)', () => {
    const raw = '---\ndate: 2026-06-23\n---\nBody';
    const { data } = parseFrontmatter(raw);
    expect(data.date).toBeInstanceOf(Date);
  });

  it('strips exactly one leading newline from content', () => {
    const raw = '---\ntitle: Hi\n---\n\nBody';
    const { content } = parseFrontmatter(raw);
    // gray-matter strips one \n → content keeps the blank line's \n
    expect(content).toBe('\nBody');
  });

  it('handles CRLF line endings', () => {
    const raw = "---\r\ntitle: Hi\r\ndate: '2026-06-23'\r\n---\r\n\r\nBody";
    const { data, content } = parseFrontmatter(raw);
    expect(data).toEqual({ title: 'Hi', date: '2026-06-23' });
    expect(content).toBe('\r\nBody');
  });

  it('returns empty data and original content when no frontmatter', () => {
    const raw = 'Just some markdown\n# Heading';
    const { data, content } = parseFrontmatter(raw);
    expect(data).toEqual({});
    expect(content).toBe(raw);
  });

  it('treats `----` (markdown hr) as no frontmatter', () => {
    const raw = '----\ntitle: Hi\n----\nBody';
    const { data, content } = parseFrontmatter(raw);
    expect(data).toEqual({});
    expect(content).toBe(raw);
  });

  it('returns empty data when no closing delimiter', () => {
    const raw = '---\ntitle: Hi\nbut no close';
    const { data, content } = parseFrontmatter(raw);
    expect(data).toEqual({});
    expect(content).toBe(raw);
  });

  it('strips BOM before parsing', () => {
    const raw = '\uFEFF---\ntitle: Hi\n---\nBody';
    const { data, content } = parseFrontmatter(raw);
    expect(data).toEqual({ title: 'Hi' });
    expect(content).toBe('Body');
  });

  it('parses frontmatter with tags array', () => {
    const raw = "---\ntitle: Post\ntags: ['Next.js', 'React']\nfeatured: true\n---\nBody";
    const { data } = parseFrontmatter(raw);
    expect(data).toEqual({ title: 'Post', tags: ['Next.js', 'React'], featured: true });
  });

  it('returns empty data when YAML result is a scalar (non-object)', () => {
    const raw = '---\njust a string\n---\nBody';
    const { data } = parseFrontmatter(raw);
    expect(data).toEqual({});
  });

  it('returns empty data when YAML result is an array', () => {
    const raw = '---\n- item1\n- item2\n---\nBody';
    const { data } = parseFrontmatter(raw);
    expect(data).toEqual({});
  });

  it('returns empty content when frontmatter has no body', () => {
    const raw = '---\ntitle: Hi\n---';
    const { data, content } = parseFrontmatter(raw);
    expect(data).toEqual({ title: 'Hi' });
    expect(content).toBe('');
  });

  it('handles empty frontmatter block', () => {
    const raw = '---\n---\nBody';
    const { data, content } = parseFrontmatter(raw);
    expect(data).toEqual({});
    expect(content).toBe('Body');
  });

  it('handles quoted string values with special chars', () => {
    const raw = "---\ntitle: 'Hello: World'\ndesc: \"a 'b' c\"\n---\nBody";
    const { data } = parseFrontmatter(raw);
    expect(data).toEqual({ title: 'Hello: World', desc: "a 'b' c" });
  });
});
