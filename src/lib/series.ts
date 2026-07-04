import { getAllPosts } from './posts';
import { decodeRouteSegment, slugifyTag } from './utils';
import type { PostMeta } from '@/types';

export interface SeriesInfo {
  name: string;
  slug: string;
  count: number;
  posts: PostMeta[];
  startDate: string;
  endDate: string;
  wordCount: number;
}

function sortSeriesPosts(posts: PostMeta[]): PostMeta[] {
  return [...posts].sort((a, b) => {
    const orderA = a.seriesOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.seriesOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.slug.localeCompare(b.slug);
  });
}

function buildSeriesInfo(name: string, posts: PostMeta[]): SeriesInfo {
  const sortedPosts = sortSeriesPosts(posts);
  const dates = sortedPosts.map((post) => post.date).sort();

  return {
    name,
    slug: slugifyTag(name),
    count: sortedPosts.length,
    posts: sortedPosts,
    startDate: dates[0] ?? '',
    endDate: dates[dates.length - 1] ?? '',
    wordCount: sortedPosts.reduce((sum, post) => sum + post.wordCount, 0),
  };
}

/** 聚合所有文章系列，按文章数和更新时间排序。 */
export function getAllSeries(): SeriesInfo[] {
  const map = new Map<string, PostMeta[]>();

  for (const post of getAllPosts()) {
    if (!post.series) continue;
    const posts = map.get(post.series) ?? [];
    posts.push(post);
    map.set(post.series, posts);
  }

  return Array.from(map.entries())
    .map(([name, posts]) => buildSeriesInfo(name, posts))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.endDate !== b.endDate) return a.endDate > b.endDate ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function getSeriesBySlug(slug: string): SeriesInfo | null {
  const decodedSlug = decodeRouteSegment(slug);
  return getAllSeries().find((series) => series.slug === decodedSlug) ?? null;
}

export function getAllSeriesSlugs(): string[] {
  return getAllSeries().map((series) => series.slug);
}
