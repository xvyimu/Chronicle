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
      className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
      role="listbox"
      aria-label="搜索结果"
    >
      <p className="text-xs text-[var(--text-dim)] px-4 pt-3 pb-1">
        {!fuseReady ? (
          <span>正在加载搜索…</span>
        ) : (
          <>
            搜索 &ldquo;{query}&rdquo;，找到 {results.length} 篇
            {results.length > 0 && (
              <span className="ml-2 opacity-60">↑↓ 导航 · Enter 打开 · Esc 关闭</span>
            )}
          </>
        )}
      </p>
      {fuseReady && results.length > 0 ? (
        results.map(({ item: post, matches }, index) => {
          const titleMatch = (matches as FuseMatch[]).find(
            (match) => match.key === 'title',
          );
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              data-result="true"
              id={`search-result-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`block px-4 py-3 transition-colors ${
                index === activeIndex
                  ? 'bg-[var(--brand-soft)] border-l-2 border-l-[var(--brand)]'
                  : 'border-l-2 border-l-transparent hover:bg-[var(--bg-soft)]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-0.5">
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
              <h4 className="font-semibold text-sm">
                {titleMatch
                  ? highlightSearchMatch(post.title, titleMatch.indices)
                  : post.title}
              </h4>
              <p className="text-xs text-[var(--text-dim)] line-clamp-1 mt-0.5">
                {post.excerpt || post.description}
              </p>
            </Link>
          );
        })
      ) : fuseReady && results.length === 0 ? (
        <p className="text-sm text-[var(--text-soft)] px-4 py-4">没有匹配的文章</p>
      ) : null}
    </div>
  );
}
