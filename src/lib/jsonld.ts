import { SITE_CONFIG } from './constants';
import type { PostMeta } from '@/types';

/**
 * JSON-LD 结构化数据生成工具
 * @see https://schema.org
 */

/** 站点级 Organization + WebSite schema */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    founder: {
      '@type': 'Person',
      name: SITE_CONFIG.author.name,
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    inLanguage: 'zh-CN',
  };
}

/** 文章级 BlogPosting schema */
export function blogPostingSchema(post: PostMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: SITE_CONFIG.author.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    inLanguage: 'zh-CN',
  };
}

/** 面包屑导航 schema */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** 将 schema 对象序列化为 JSON-LD script 标签内容。
 *  转义 < 防止 </script> 注入（JSON.stringify 不会转义 HTML 字符）。 */
export function toJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}
