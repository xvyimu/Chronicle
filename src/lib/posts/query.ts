import type { PostMeta, PostFull } from '@/types';

/**
 * 查询层 — 纯函数, 接受 posts 数组返回筛选/排序/分页结果.
 *
 * 无 fs / cache 依赖, 易于测试.
 */

export function filterByTag(posts: PostMeta[], tagName: string): PostMeta[] {
  return posts.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tagName.toLowerCase()),
  );
}

export function getAdjacent(
  posts: PostMeta[],
  slug: string,
): {
  prev: PostMeta | null;
  next: PostMeta | null;
} {
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
  };
}

export function getRelated(
  posts: PostMeta[],
  currentSlug: string,
  current: PostFull | null,
  limit = 3,
): PostMeta[] {
  if (!current) return [];
  const currentTags = new Set(current.tags.map((tag) => tag.toLowerCase()));
  return posts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => {
      const sharedTags = post.tags.filter((tag) =>
        currentTags.has(tag.toLowerCase()),
      ).length;
      const sameCategory = current.category && post.category === current.category ? 1 : 0;
      const sameSeries = current.series && post.series === current.series ? 2 : 0;
      return { post, score: sharedTags * 3 + sameCategory + sameSeries };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.post.date !== b.post.date) return a.post.date > b.post.date ? -1 : 1;
      return a.post.slug.localeCompare(b.post.slug);
    })
    .slice(0, limit)
    .map((item) => item.post);
}

export function getSeries(posts: PostMeta[], current: PostFull | null): PostMeta[] {
  if (!current?.series) return [];
  return posts
    .filter((post) => post.series === current.series)
    .sort((a, b) => {
      const orderA = a.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      if (a.date !== b.date) return a.date > b.date ? -1 : 1;
      return a.slug.localeCompare(b.slug);
    });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
  };
}
