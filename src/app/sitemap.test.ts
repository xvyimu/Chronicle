import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';
import { SITE_CONFIG } from '@/lib/constants';
import { getAllCategories } from '@/lib/categories';
import { getAllPosts } from '@/lib/posts';
import { getAllProjects } from '@/lib/projects';
import { getAllTags } from '@/lib/tags';

describe('sitemap', () => {
  it('includes all public static and content routes', () => {
    const urls = new Set(sitemap().map((entry) => entry.url));

    for (const path of ['', '/blog', '/categories', '/projects', '/tags', '/about']) {
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
      expect(urls.has(`${SITE_CONFIG.url}/categories/${encodeURIComponent(category.slug)}`)).toBe(true);
    }
  });
});
