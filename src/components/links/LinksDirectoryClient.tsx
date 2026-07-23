'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import type { LinkCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  countLinkItems,
  filterLinkCategories,
  normalizeLinkFilterText,
} from '@/lib/links-filter';
import { LinksCatalog } from './LinksCatalog';

/**
 * Client island for /links search only.
 * Unfiltered catalog is passed as RSC children so cards are not MagneticCard-hydrated.
 */
export function LinksDirectoryClient({
  categories,
  children,
}: {
  categories: LinkCategory[];
  children: ReactNode;
}) {
  const totalLinks = useMemo(() => countLinkItems(categories), [categories]);
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);
  const normalizedFilter = normalizeLinkFilterText(deferredFilter);
  const hasFilter = normalizedFilter.length > 0;

  const filteredCategories = useMemo(
    () => filterLinkCategories(categories, normalizedFilter),
    [categories, normalizedFilter],
  );

  const visibleLinks = countLinkItems(filteredCategories);

  return (
    <>
      <div className="links-directory__tools" role="search">
        <label className="links-directory__search">
          <span className="sr-only">筛选收藏链接</span>
          <svg
            className="links-directory__search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <Input
            type="search"
            size="lg"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="筛选收藏链接"
            className="links-directory__search-input h-auto"
            placeholder="筛选名称、标签、官网域名或用途…"
          />
          {filter.trim() ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="links-directory__clear"
              onClick={() => setFilter('')}
              aria-label="清除链接筛选"
            >
              清除
            </Button>
          ) : null}
        </label>
        <p className="links-directory__filter-count" aria-live="polite">
          {hasFilter ? (
            <>
              <strong className="links-directory__filter-nums">
                {visibleLinks} / {totalLinks}
              </strong>
              <span>匹配站点</span>
            </>
          ) : (
            <span>可按分类、标签、官网域名和使用场景快速定位。</span>
          )}
        </p>
      </div>

      {hasFilter ? (
        visibleLinks > 0 ? (
          <LinksCatalog categories={filteredCategories} />
        ) : (
          <div className="links-directory__empty empty-state" role="status">
            <strong className="empty-state__title">没有匹配的收藏</strong>
            <p className="empty-state__desc">
              试试搜索分类、标签、官网域名或使用场景，也可以清除筛选回到完整收藏夹。
            </p>
            <Button
              type="button"
              size="cta"
              variant="outline"
              className="empty-state__action"
              onClick={() => setFilter('')}
            >
              清除筛选
            </Button>
          </div>
        )
      ) : (
        children
      )}
    </>
  );
}
