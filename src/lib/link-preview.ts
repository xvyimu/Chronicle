import type { LinkCategory } from '@/types';

export const HOME_LINK_CATEGORY_IDS = [
  'ai',
  'engineering-docs',
  'self-hosted',
  'vps',
] as const;

export function selectHomeLinkPreviewCategories(
  categories: LinkCategory[],
): LinkCategory[] {
  const selected = HOME_LINK_CATEGORY_IDS.map((id) =>
    categories.find((category) => category.id === id),
  ).filter((category): category is LinkCategory => Boolean(category));

  return selected.length > 0 ? selected : categories.slice(0, 1);
}
