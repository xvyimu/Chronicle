import { afterEach, describe, expect, it, vi } from 'vitest';
import sitemap from './sitemap';
import { SITE_CONFIG } from '@/lib/site';
import { getAllCategories } from '@/lib/categories';
import { getAllPosts } from '@/lib/posts';
import { getAllProjects } from '@/lib/projects';
import { getAllSeries } from '@/lib/series';
import { getAllTags } from '@/lib/tags';

function serializeLastModifiedValues(): Array<[string, string]> {
  return sitemap().map((entry) => [
    entry.url,
    entry.lastModified instanceof Date
      ? entry.lastModified.toISOString()
      : String(entry.lastModified),
  ]);
}

describe('sitemap', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('includes all public static and content routes', () => {
    const urls = new Set(sitemap().map((entry) => entry.url));

    for (const path of [
      '',
      '/blog',
      '/categories',
      '/projects',
      '/tags',
      '/series',
      '/about',
    ]) {
      expect(urls.has(`${SITE_CONFIG.url}${path}`)).toBe(true);
    }

    for (const post of getAllPosts()) {
      expect(urls.has(`${SITE_CONFIG.url}/blog/${post.slug}`)).toBe(true);
    }

    for (const project of getAllProjects()) {
      expect(urls.has(`${SITE_CONFIG.url}/projects/${project.id}`)).toBe(true);
    }

    for (const tag of getAllTags()) {
      expect(urls.has(`${SITE_CONFIG.url}/tags/${tag.slug}`)).toBe(true);
    }

    for (const category of getAllCategories()) {
      expect(
        urls.has(`${SITE_CONFIG.url}/categories/${encodeURIComponent(category.slug)}`),
      ).toBe(true);
    }

    for (const series of getAllSeries()) {
      expect(
        urls.has(`${SITE_CONFIG.url}/series/${encodeURIComponent(series.slug)}`),
      ).toBe(true);
    }
  });

  it('uses content-derived stable lastModified values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
    const first = serializeLastModifiedValues();

    vi.setSystemTime(new Date('2040-01-01T00:00:00.000Z'));
    const second = serializeLastModifiedValues();

    expect(second).toEqual(first);
    expect(first.some(([, lastModified]) => lastModified.startsWith('2030-'))).toBe(
      false,
    );
    expect(first.some(([, lastModified]) => lastModified.startsWith('2040-'))).toBe(
      false,
    );
  });
});
