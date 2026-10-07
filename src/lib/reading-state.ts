import { safeLocalStorage } from '@/lib/storage';

/**
 * 本地阅读状态：收藏 + 最近阅读。
 *
 * 无账号系统，全部存 localStorage（复用 safeLocalStorage 容错封装）。
 * 只存 slug 与时间戳，不存内容；读取时与当前文章列表求交（避免脏数据）。
 */

const FAVORITES_KEY = 'chronicle:favorites';
const RECENT_KEY = 'chronicle:recent';
/** 最近阅读最多保留条数。 */
export const RECENT_LIMIT = 12;

/**
 * 条目结构：收藏与最近阅读共用（都是 slug + 时间戳）。
 * 读取时按 `at` 倒序，故两者同一类型。
 */
export type ReadingEntry = { slug: string; at: number };

function parseEntries(raw: string | null): ReadingEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ReadingEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as { slug?: unknown }).slug === 'string' &&
        typeof (e as { at?: unknown }).at === 'number',
    );
  } catch {
    return [];
  }
}

/** 读取指定 key 的条目，按时间倒序，可选截断。 */
function readSorted(key: string, limit?: number): ReadingEntry[] {
  const sorted = parseEntries(safeLocalStorage.getItem(key)).sort((a, b) => b.at - a.at);
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}

/** 读取收藏列表（按收藏时间倒序）。 */
export function getFavorites(): ReadingEntry[] {
  return readSorted(FAVORITES_KEY);
}

/** 是否已收藏。 */
export function isFavorite(slug: string): boolean {
  return getFavorites().some((e) => e.slug === slug);
}

/** 切换收藏状态，返回切换后的状态（true=已收藏）。 */
export function toggleFavorite(slug: string): boolean {
  const current = getFavorites();
  const exists = current.some((e) => e.slug === slug);
  const next = exists
    ? current.filter((e) => e.slug !== slug)
    : [{ slug, at: Date.now() }, ...current];
  safeLocalStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return !exists;
}

/** 读取最近阅读（按访问时间倒序，上限 RECENT_LIMIT）。 */
export function getRecent(): ReadingEntry[] {
  return readSorted(RECENT_KEY, RECENT_LIMIT);
}

/** 记录一次阅读（去重后置顶）。 */
export function recordRecent(slug: string): void {
  const next = [
    { slug, at: Date.now() },
    ...getRecent().filter((e) => e.slug !== slug),
  ].slice(0, RECENT_LIMIT);
  safeLocalStorage.setItem(RECENT_KEY, JSON.stringify(next));
}
