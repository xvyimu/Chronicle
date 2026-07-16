import type { PostMeta } from '@/types';
import type { SearchMatch, SearchResultItem } from './types';

const DISPLAY_MATCH_KEYS = new Set([
  'title',
  'description',
  'excerpt',
  'tags',
  'category',
  'series',
]);

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

/** Keep match metadata aligned with the public card fields. */
export function toSearchResultMatches(
  matches: readonly SearchMatch[] = [],
): SearchMatch[] {
  return matches
    .filter((match) => match.key && DISPLAY_MATCH_KEYS.has(match.key))
    .map((match) => ({
      key: match.key,
      value: match.value,
      indices: match.indices,
    }));
}
