import type { Metadata } from 'next';
import { SITE_CONFIG } from './site';

/**
 * Build page-level metadata with consistent canonical + OpenGraph shape.
 *
 * The root layout already defines `title.template = '%s | ${SITE_CONFIG.name}'`,
 * so callers pass the page-specific title ONLY (e.g., '博客', 'Docker') — the
 * site name suffix is added by Next.js. Do NOT include `| ${SITE_CONFIG.name}`
 * manually, or the suffix will be duplicated.
 *
 * @param opts.title   Page-specific title (without site name suffix)
 * @param opts.description Short description for SEO + OG
 * @param opts.path    Absolute URL path (e.g., '/blog', '/tags/docker')
 * @param opts.type    OG type ('website' default, 'article' for posts)
 * @param opts.image   Optional OG image URL
 */
export function buildPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const url = `${SITE_CONFIG.url}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      type: opts.type ?? 'website',
      url,
      ...(opts.image ? { images: [{ url: opts.image }] } : {}),
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
    },
  };
}
