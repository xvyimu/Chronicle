import { TAG_TO_CATEGORY } from './constants';

export function inferCategory(tags: string[]): string | null {
  for (const tag of tags) {
    const category = TAG_TO_CATEGORY[tag];
    if (category) return category;
  }
  return null;
}
