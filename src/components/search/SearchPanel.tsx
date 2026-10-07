'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchDocs } from '@/lib/search';
import type { SearchDoc } from '@/lib/search';

type SearchPanelProps = {
  docs: SearchDoc[];
};

/**
 * 站内搜索面板（客户端岛）。
 *
 * - 客户端 Fuse 索引（20 篇规模），无服务端往返。
 * - 键盘：`/` 或 Ctrl/Cmd+K 聚焦；↑↓ 选择；Enter 打开；Esc 清空。
 * - URL 可分享：查询写入当前路径的 `?q=`（跨路径会卸载本组件，故不跳页）。
 * - 状态：空查询提示 / 无结果 / 结果列表。
 */
export default function SearchPanel({ docs }: SearchPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchDocs(docs, query), [docs, query]);
  const trimmed = query.trim();
  const isOpen = trimmed !== '' && results.length > 0;
  /** 结果项的稳定 DOM id，供 aria-activedescendant 指向当前高亮项。 */
  const optionId = (index: number) => `search-option-${index}`;

  // 全局快捷键：`/` 或 Ctrl/Cmd+K 聚焦输入框。
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (typing) return;
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 查询同步到 URL（可分享）。用 replace 避免污染历史。
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    // 写回**当前路径**（搜索面板所在页），不跨到 /blog——
    // 跨路径会把本组件卸载，结果随即消失。
    const qs = next.toString();
    const url = qs ? `${location.pathname}?${qs}` : location.pathname;
    router.replace(url, { scroll: false });
    setActiveIndex(-1);
    // 仅在 query 变化时同步；searchParams 引用变化不应重触发。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  function onKeyDownInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      router.push(`/blog/${results[activeIndex].slug}`);
    } else if (e.key === 'Escape') {
      setQuery('');
      setActiveIndex(-1);
    }
  }

  return (
    <div className="search-panel">
      <div className="search-panel__field">
        <label htmlFor="site-search" className="sr-only">
          搜索文章
        </label>
        <svg
          className="search-panel__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          id="site-search"
          ref={inputRef}
          type="search"
          className="search-panel__input"
          placeholder="搜索文章、标签、分类…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDownInput}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex] ? optionId(activeIndex) : undefined
          }
          aria-autocomplete="list"
          aria-label="搜索文章"
        />
        <kbd className="search-panel__kbd" aria-hidden="true">
          /
        </kbd>
      </div>

      <div id="search-results" className="search-panel__results" aria-live="polite">
        {!trimmed ? (
          <p className="search-panel__hint">
            输入关键词搜索标题、描述、标签或分类，或用 <kbd>/</kbd> 快速聚焦。
          </p>
        ) : results.length === 0 ? (
          <p className="search-panel__empty">没有找到匹配「{trimmed}」的文章。</p>
        ) : (
          <ul className="search-panel__list" role="listbox" aria-label="搜索结果">
            {results.map((doc, index) => (
              <li key={doc.slug} role="presentation">
                <Link
                  id={optionId(index)}
                  href={`/blog/${doc.slug}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`search-panel__item ${
                    index === activeIndex ? 'search-panel__item--active' : ''
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="search-panel__item-title">{doc.title}</span>
                  <span className="search-panel__item-desc">{doc.description}</span>
                  <span className="search-panel__item-meta">
                    {doc.category && <span>{doc.category}</span>}
                    <span>{doc.readingTime}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
