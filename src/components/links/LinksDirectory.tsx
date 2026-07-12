'use client';

import { useMemo, useState } from 'react';
import type { LinkCategory, LinkItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MagneticCard from '@/components/ui/MagneticCard';
import MetaBadge from '@/components/ui/MetaBadge';

function getLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function normalizeFilterText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function getSearchableLinkText(item: LinkItem, category: LinkCategory): string {
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

const LINK_PRIORITY_LABELS: Record<NonNullable<LinkItem['priority']>, string> = {
  primary: '重点',
  reference: '参考',
  watchlist: '观察',
};

function LinkCard({ item }: { item: LinkItem }) {
  const hasCurationMeta = item.official || item.priority || item.lastChecked;

  return (
    <MagneticCard
      as="li"
      className="links-directory__item"
      strength={2}
      spotlightSize={260}
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="links-directory__card"
      >
        <span className="links-directory__host">{getLinkHost(item.url)}</span>
        <strong className="links-directory__title">{item.title}</strong>
        <span className="links-directory__desc">{item.description}</span>
        {item.useCase ? (
          <span className="links-directory__use-case">{item.useCase}</span>
        ) : null}
        {hasCurationMeta ? (
          <span
            className="links-directory__curation"
            aria-label={`${item.title} 收藏状态`}
          >
            {item.official ? (
              <MetaBadge className="links-directory__tag">官网</MetaBadge>
            ) : null}
            {item.priority ? (
              <MetaBadge className="links-directory__tag">
                {LINK_PRIORITY_LABELS[item.priority]}
              </MetaBadge>
            ) : null}
            {item.lastChecked ? (
              <span className="links-directory__checked">{item.lastChecked}</span>
            ) : null}
          </span>
        ) : null}
        {item.tags && item.tags.length > 0 ? (
          <span className="links-directory__tags" aria-label={`${item.title} tags`}>
            {item.tags.map((tag) => (
              <MetaBadge key={tag} className="links-directory__tag">
                {tag}
              </MetaBadge>
            ))}
          </span>
        ) : null}
      </a>
    </MagneticCard>
  );
}

export function LinksDirectory({ categories }: { categories: LinkCategory[] }) {
  const totalLinks = categories.reduce((sum, category) => sum + category.items.length, 0);
  const [filter, setFilter] = useState('');
  const normalizedFilter = normalizeFilterText(filter);

  const filteredCategories = useMemo(() => {
    if (!normalizedFilter) return categories;

    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) =>
          getSearchableLinkText(item, category).includes(normalizedFilter),
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, normalizedFilter]);

  const visibleLinks = filteredCategories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
  const hasFilter = normalizedFilter.length > 0;

  return (
    <div className="links-directory">
      <div className="links-directory__summary" aria-label="收藏概览">
        <div className="links-directory__metric">
          <span>Collections</span>
          <strong>{categories.length}</strong>
          <small>分类</small>
        </div>
        <div className="links-directory__metric">
          <span>Links</span>
          <strong>{totalLinks}</strong>
          <small>站点</small>
        </div>
        <nav className="links-directory__nav" aria-label="链接分类">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="links-directory__nav-link"
              aria-label={`${category.title} ${category.items.length} 个`}
            >
              <span>{category.title}</span>
              <small>{category.items.length} 个</small>
            </a>
          ))}
        </nav>
      </div>

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
          {hasFilter ? (
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
              <strong>
                {visibleLinks} / {totalLinks}
              </strong>
              <span>匹配站点</span>
            </>
          ) : (
            <span>可按分类、标签、官网域名和使用场景快速定位收藏。</span>
          )}
        </p>
      </div>

      <div className="links-directory__sections">
        {filteredCategories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="links-directory__category"
          >
            <div className="links-directory__category-head">
              <div>
                <MetaBadge className="links-directory__count">
                  {category.items.length} 个站点
                </MetaBadge>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </div>
            </div>
            <ul className="links-directory__grid" aria-label={`${category.title}链接`}>
              {category.items.map((item) => (
                <LinkCard key={item.url} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {hasFilter && visibleLinks === 0 ? (
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
      ) : null}
    </div>
  );
}
