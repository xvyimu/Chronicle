import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { getAllTags } from '@/lib/tags';
import { SITE_CONFIG } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const postPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const tagPages: MetadataRoute.Sitemap = getAllTags().map((tag) => ({
    url: `${baseUrl}/tags/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }));

  return [...staticPages, ...postPages, ...tagPages];
}
