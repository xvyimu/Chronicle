import type { LinkCategory, LinkItem } from '@/types';

/**
 * Pure link directory helpers — safe for client components.
 * Keep filesystem / repository code in `@/lib/links` only.
 */

/** Hostname for display (strip leading www.). Safe for invalid URLs. */
export function getLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function normalizeLinkFilterText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function getSearchableLinkText(item: LinkItem, category: LinkCategory): string {
  return [
    category.title,
    category.description,
    item.title,
    item.description,
    item.url,
    getLinkHost(item.url),
    item.useCase,
    item.priority,
    item.official ? '官网 official' : '',
    item.tags?.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
}

export function countLinkItems(categories: LinkCategory[]): number {
  return categories.reduce((sum, category) => sum + category.items.length, 0);
}

/** Filter categories/items by keyword (title, host, tags, use case, …). */
export function filterLinkCategories(
  categories: LinkCategory[],
  filter: string,
): LinkCategory[] {
  const normalized = normalizeLinkFilterText(filter);
  if (!normalized) return categories;

  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        getSearchableLinkText(item, category).includes(normalized),
      ),
    }))
    .filter((category) => category.items.length > 0);
}
