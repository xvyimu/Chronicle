import { describe, expect, it } from 'vitest';
import type { LinkCategory } from '@/types';
import { HOME_LINK_CATEGORY_IDS, selectHomeLinkPreviewCategories } from './link-preview';

function category(id: string): LinkCategory {
  return {
    id,
    title: id,
    description: `${id} links`,
    items: [],
  };
}

describe('link preview selection', () => {
  it('keeps the configured homepage category order', () => {
    expect(HOME_LINK_CATEGORY_IDS).toEqual([
      'ai',
      'engineering-docs',
      'self-hosted',
      'vps',
    ]);
  });

  it('selects configured categories in homepage order', () => {
    const categories = [
      category('vps'),
      category('ai'),
      category('self-hosted'),
      category('engineering-docs'),
      category('design'),
    ];

    expect(selectHomeLinkPreviewCategories(categories).map((item) => item.id)).toEqual([
      'ai',
      'engineering-docs',
      'self-hosted',
      'vps',
    ]);
  });

  it('skips missing configured categories', () => {
    const categories = [category('vps'), category('ai')];

    expect(selectHomeLinkPreviewCategories(categories).map((item) => item.id)).toEqual([
      'ai',
      'vps',
    ]);
  });

  it('falls back to the first available category when none of the configured categories exist', () => {
    const categories = [category('design'), category('ops')];

    expect(selectHomeLinkPreviewCategories(categories).map((item) => item.id)).toEqual([
      'design',
    ]);
  });
});
