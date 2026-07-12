import type { PostMeta } from '@/types';
import type { SearchResultItem } from './types';

/** Project PostMeta → wire-safe search card (drops searchText / headings / body stats). */
export function toSearchResultItem(post: PostMeta): SearchResultItem {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
    category: post.category,
    series: post.series,
    featured: post.featured,
    excerpt: post.excerpt,
  };
}
