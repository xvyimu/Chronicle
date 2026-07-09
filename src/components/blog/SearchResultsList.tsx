import Link from 'next/link';
import type { RefObject } from 'react';
import MetaBadge from '@/components/ui/MetaBadge';
import { highlightSearchMatch } from './search-highlight';
import type { FuseMatch, SearchResult } from './useFuseSearch';

export default function SearchResultsList({
  query,
  fuseReady,
  results,
  activeIndex,
  listRef,
}: {
  query: string;
  fuseReady: boolean;
  results: SearchResult[];
  activeIndex: number;
  listRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={listRef}
      id="search-results"
      className="search-results-popover"
      role="listbox"
      aria-label="搜索结果"
    >
      <p className="search-results-popover__summary">
        {!fuseReady ? (
          <span>正在加载搜索…</span>
        ) : (
          <>
            搜索 &ldquo;{query}&rdquo;，找到 {results.length} 篇
            {results.length > 0 && (
              <span className="search-results-popover__hint">
                ↑↓ 导航 · Enter 打开 · Esc 关闭
              </span>
            )}
          </>
        )}
      </p>
      {fuseReady && results.length > 0 ? (
        results.map(({ item: post, matches }, index) => {
          const titleMatch = (matches as FuseMatch[]).find(
            (match) => match.key === 'title',
          );
          const descriptionText = post.excerpt || post.description;
          const descriptionMatch = (matches as FuseMatch[]).find(
            (match) =>
              (match.key === 'description' || match.key === 'excerpt') &&
              match.value === descriptionText,
          );
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              data-result="true"
              id={`search-result-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`search-results-popover__item ${
                index === activeIndex ? 'is-active' : ''
              }`}
            >
              <div className="search-results-popover__meta">
                <time dateTime={post.date}>{post.date}</time>
                {post.category && (
                  <MetaBadge className="search-results__badge">{post.category}</MetaBadge>
                )}
                {post.series && (
                  <MetaBadge className="search-results__badge">{post.series}</MetaBadge>
                )}
                {post.featured && (
                  <MetaBadge
                    variant="secondary"
                    className="search-results__badge search-results__badge--featured"
                  >
                    精选
                  </MetaBadge>
                )}
              </div>
              <h4 className="search-results-popover__title">
                {titleMatch
                  ? highlightSearchMatch(post.title, titleMatch.indices)
                  : post.title}
              </h4>
              <p className="search-results-popover__desc">
                {descriptionMatch
                  ? highlightSearchMatch(descriptionText, descriptionMatch.indices)
                  : descriptionText}
              </p>
            </Link>
          );
        })
      ) : fuseReady && results.length === 0 ? (
        <div className="search-results-popover__empty">
          <strong>没有匹配的文章</strong>
          <span>换个关键词，或从下面的入口重新探索。</span>
          <div className="search-results-popover__empty-actions">
            <Link href="/blog">查看全部文章</Link>
            <Link href="/tags">浏览标签</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
