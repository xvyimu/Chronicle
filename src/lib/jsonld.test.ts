import { describe, it, expect } from 'vitest';
import {
  organizationSchema,
  websiteSchema,
  blogPostingSchema,
  breadcrumbSchema,
  toJsonLd,
} from './jsonld';
import type { PostMeta } from '@/types';

const mockPost: PostMeta = {
  title: '测试文章',
  description: '用于测试的描述',
  date: '2026-06-25',
  tags: ['Next.js', 'React'],
  published: true,
  featured: false,
  slug: 'test-post',
  readingTime: '5 min read',
  wordCount: 1000,
  excerpt: '用于测试的摘要',
  headings: ['测试章节'],
  searchText: '测试文章 测试章节',
};

describe('toJsonLd', () => {
  it('produces valid JSON that can be parsed back', () => {
    const schema = organizationSchema();
    const json = toJsonLd(schema);
    const parsed = JSON.parse(json);
    expect(parsed['@type']).toBe('Organization');
  });

  it('escapes < to prevent </script> injection (security critical)', () => {
    const malicious = { title: '</script><img src=x onerror=alert(1)>' };
    const json = toJsonLd(malicious);
    // The dangerous </script> sequence must be broken up
    expect(json).not.toContain('</script>');
    // < is escaped to \u003c, but > is left as-is (only < needs escaping)
    expect(json).toContain('\\u003c/script>');
    // Ensure the escaped output is still valid JSON
    const parsed = JSON.parse(json);
    expect(parsed.title).toBe('</script><img src=x onerror=alert(1)>');
  });

  it('escapes all < characters, not just </script>', () => {
    const data = { value: 'a < b < c' };
    const json = toJsonLd(data);
    expect(json).not.toContain('<');
    expect(json).toContain('\\u003c');
  });

  it('does not modify > characters (only < needs escaping)', () => {
    const data = { value: 'x > y' };
    const json = toJsonLd(data);
    expect(json).toContain('>');
  });

  it('handles empty objects', () => {
    const json = toJsonLd({});
    expect(json).toBe('{}');
  });

  it('handles nested objects with < in values', () => {
    const data = { outer: { inner: '<script>' } };
    const json = toJsonLd(data);
    expect(json).not.toContain('<script>');
    expect(json).toContain('\\u003cscript>');
  });
});

describe('organizationSchema', () => {
  it('returns Organization type with site config values', () => {
    const schema = organizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema.name).toBeDefined();
    expect(schema.url).toBeDefined();
    expect(schema.founder['@type']).toBe('Person');
  });
});

describe('websiteSchema', () => {
  it('returns WebSite type with correct fields', () => {
    const schema = websiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema.inLanguage).toBe('zh-CN');
  });
});

describe('blogPostingSchema', () => {
  it('returns BlogPosting type with post data', () => {
    const schema = blogPostingSchema(mockPost);
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('测试文章');
    expect(schema.description).toBe('用于测试的描述');
    expect(schema.datePublished).toBe('2026-06-25');
    expect(schema.dateModified).toBe('2026-06-25');
    expect(schema.keywords).toBe('Next.js, React');
    expect(schema.inLanguage).toBe('zh-CN');
  });

  it('includes author and publisher as nested objects', () => {
    const schema = blogPostingSchema(mockPost);
    expect(schema.author['@type']).toBe('Person');
    expect(schema.publisher['@type']).toBe('Organization');
  });

  it('includes mainEntityOfPage with correct URL', () => {
    const schema = blogPostingSchema(mockPost);
    expect(schema.mainEntityOfPage['@type']).toBe('WebPage');
    expect(schema.mainEntityOfPage['@id']).toContain('/blog/test-post');
  });

  it('handles empty tags array', () => {
    const postWithNoTags = { ...mockPost, tags: [] };
    const schema = blogPostingSchema(postWithNoTags);
    expect(schema.keywords).toBe('');
  });

  it('uses updatedAt as dateModified when present', () => {
    const schema = blogPostingSchema({ ...mockPost, updatedAt: '2026-06-28' });
    expect(schema.dateModified).toBe('2026-06-28');
  });
});

describe('breadcrumbSchema', () => {
  it('returns BreadcrumbList type with correct items', () => {
    const items = [
      { name: '首页', url: 'https://example.com' },
      { name: '博客', url: 'https://example.com/blog' },
      { name: '文章', url: 'https://example.com/blog/post' },
    ];
    const schema = breadcrumbSchema(items);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[2].position).toBe(3);
    expect(schema.itemListElement[0].name).toBe('首页');
  });

  it('handles empty items array', () => {
    const schema = breadcrumbSchema([]);
    expect(schema.itemListElement).toHaveLength(0);
  });

  it('assigns correct positions sequentially', () => {
    const items = [
      { name: 'A', url: 'a' },
      { name: 'B', url: 'b' },
      { name: 'C', url: 'c' },
      { name: 'D', url: 'd' },
    ];
    const schema = breadcrumbSchema(items);
    const positions = schema.itemListElement.map((el) => el.position);
    expect(positions).toEqual([1, 2, 3, 4]);
  });
});
