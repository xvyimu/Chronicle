import { describe, it, expect } from 'vitest';
import { createLinksRepository, getLinkAssetIssues, parseLinks } from '@/lib/links';
import type { ContentSource } from '@/lib/content-source';

function makeJsonSource(data: unknown): ContentSource {
  return {
    readFile: () => JSON.stringify(data),
    readDir: () => ['links.json'],
    getMtime: () => 1000,
  };
}

function makeMissingSource(): ContentSource {
  return {
    readFile: () => null,
    readDir: () => null,
    getMtime: () => null,
  };
}

describe('parseLinks', () => {
  it('returns empty array for empty input', () => {
    expect(parseLinks([])).toEqual([]);
  });

  it('accepts minimal valid category', () => {
    const result = parseLinks([
      {
        id: 'test',
        title: 'Test',
        description: 'A test category',
        items: [{ title: 'Example', url: 'https://example.com', description: 'Desc' }],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test');
    expect(result[0].items).toHaveLength(1);
  });

  it('preserves optional item tags for curated filtering context', () => {
    const result = parseLinks([
      {
        id: 'vps',
        title: 'VPS',
        description: 'Official VPS provider links',
        items: [
          {
            title: 'HostHatch',
            url: 'https://hosthatch.com/',
            description: 'Official VPS provider website',
            tags: ['vps', 'global'],
          },
        ],
      },
    ]);

    expect(result[0].items[0].tags).toEqual(['vps', 'global']);
  });

  it('preserves optional curation metadata for operational content assets', () => {
    const result = parseLinks([
      {
        id: 'vps',
        title: 'VPS',
        description: 'Official VPS provider links',
        items: [
          {
            title: 'HostHatch',
            url: 'https://hosthatch.com/',
            description: 'Official VPS provider website',
            tags: ['vps', 'global'],
            official: true,
            priority: 'watchlist',
            useCase: '观察海外节点、促销套餐和长期口碑',
            lastChecked: '2026-07-06',
          },
        ],
      },
    ]);

    expect(result[0].items[0]).toMatchObject({
      official: true,
      priority: 'watchlist',
      useCase: '观察海外节点、促销套餐和长期口碑',
      lastChecked: '2026-07-06',
    });
  });

  it('throws when curation metadata is malformed', () => {
    expect(() =>
      parseLinks([
        {
          id: 'vps',
          title: 'VPS',
          description: 'Official VPS provider links',
          items: [
            {
              title: 'HostHatch',
              url: 'https://hosthatch.com/',
              description: 'Official VPS provider website',
              priority: 'urgent',
              lastChecked: '2026/07/06',
            },
          ],
        },
      ]),
    ).toThrow();
  });

  it('throws ZodError for missing required fields', () => {
    expect(() => parseLinks([{ id: 'incomplete' }])).toThrow();
  });

  it('throws on non-array input', () => {
    expect(() => parseLinks('not-an-array')).toThrow();
  });

  it('throws when items is not an array', () => {
    expect(() =>
      parseLinks([{ id: 'x', title: 'X', description: 'D', items: 'not-array' }]),
    ).toThrow();
  });

  it('throws on invalid url format', () => {
    expect(() =>
      parseLinks([
        {
          id: 'x',
          title: 'X',
          description: 'D',
          items: [{ title: 'Bad', url: 'not-a-url', description: 'D' }],
        },
      ]),
    ).toThrow();
  });

  it('throws on non-http link protocols', () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,hi',
      'mailto:a@example.com',
    ]) {
      expect(() =>
        parseLinks([
          {
            id: 'x',
            title: 'X',
            description: 'D',
            items: [{ title: 'Bad', url, description: 'D' }],
          },
        ]),
      ).toThrow();
    }
  });

  it('throws when a link contains affiliate or tracking parameters', () => {
    expect(() =>
      parseLinks([
        {
          id: 'vps',
          title: 'VPS',
          description: 'Official VPS provider links',
          items: [
            {
              title: 'Tracked',
              url: 'https://example.com/?utm_source=newsletter&aff=123',
              description: 'Tracked link',
            },
          ],
        },
      ]),
    ).toThrow();
  });
});

describe('getLinkAssetIssues', () => {
  it('reports duplicate categories, duplicate urls, empty categories, and tracking params', () => {
    const issues = getLinkAssetIssues([
      {
        id: 'vps',
        title: 'VPS',
        description: 'Official VPS provider links',
        items: [
          {
            title: 'Tracked',
            url: 'https://example.com/?utm_source=newsletter',
            description: 'Tracked link',
          },
          {
            title: 'Duplicate A',
            url: 'https://example.com/path/',
            description: 'First duplicate',
          },
        ],
      },
      {
        id: 'vps',
        title: 'VPS Duplicate',
        description: 'Duplicate category',
        items: [
          {
            title: 'Duplicate B',
            url: 'https://example.com/path',
            description: 'Second duplicate',
          },
        ],
      },
      {
        id: 'empty',
        title: 'Empty',
        description: 'Empty category',
        items: [],
      },
    ]);

    expect(issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        'Duplicate link category id: vps',
        'Link category must contain at least one item',
        'Link URL must not contain affiliate or tracking parameters: https://example.com/?utm_source=newsletter',
        'Duplicate link URL also used by "Duplicate A": https://example.com/path',
      ]),
    );
  });
});

describe('LinksRepository', () => {
  it('returns an array of link categories', () => {
    const repo = createLinksRepository(
      makeJsonSource([
        {
          id: 'ai',
          title: 'AI',
          description: 'AI tools',
          items: [{ title: 'GPT', url: 'https://gpt.example.com', description: 'GPT' }],
        },
      ]),
    );
    const categories = repo.getAllCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(1);
  });

  it('each category has required fields', () => {
    const repo = createLinksRepository(
      makeJsonSource([
        {
          id: 'ai',
          title: 'AI',
          description: 'AI tools',
          items: [{ title: 'GPT', url: 'https://gpt.example.com', description: 'GPT' }],
        },
      ]),
    );
    const categories = repo.getAllCategories();
    for (const cat of categories) {
      expect(cat.id).toBeTruthy();
      expect(cat.title).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(Array.isArray(cat.items)).toBe(true);
    }
  });

  it('returns the correct category for a known id', () => {
    const repo = createLinksRepository(
      makeJsonSource([
        {
          id: 'ai',
          title: 'AI',
          description: 'AI tools',
          items: [{ title: 'GPT', url: 'https://gpt.example.com', description: 'GPT' }],
        },
      ]),
    );
    const cat = repo.getCategoryById('ai');
    expect(cat).not.toBeNull();
    expect(cat!.id).toBe('ai');
  });

  it('returns null for an unknown id', () => {
    const repo = createLinksRepository(
      makeJsonSource([
        {
          id: 'ai',
          title: 'AI',
          description: 'AI tools',
          items: [],
        },
      ]),
    );
    expect(repo.getCategoryById('non-existent')).toBeNull();
  });

  it('returns empty array when file does not exist', () => {
    const repo = createLinksRepository(makeMissingSource());
    expect(repo.getAllCategories()).toEqual([]);
  });

  it('returns empty array when JSON is invalid', () => {
    const source: ContentSource = {
      readFile: () => 'not-json',
      readDir: () => ['links.json'],
      getMtime: () => 1000,
    };
    const repo = createLinksRepository(source);
    expect(repo.getAllCategories()).toEqual([]);
  });
});
