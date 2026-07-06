'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

type TableOfContentsProps = {
  variant?: 'sidebar' | 'mobile';
};

export default function TableOfContents({
  variant = 'sidebar',
}: TableOfContentsProps = {}) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const article =
      document.getElementById('article-content') ?? document.querySelector('article');
    if (!article) return;

    const headings = article.querySelectorAll('h2, h3');
    const tocItems: TocItem[] = Array.from(headings).map((h) => ({
      id: h.id,
      text: h.textContent ?? '',
      level: Number(h.tagName[1]),
    }));
    setItems(tocItems);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  const list = (
    <ul className="toc__list">
      {items.map((item) => (
        <li
          key={item.id}
          className={item.level === 3 ? 'toc__item toc__item--h3' : 'toc__item'}
        >
          <a
            href={`#${item.id}`}
            className={`${activeId === item.id ? 'toc__link toc__link--active' : 'toc__link'} ${
              item.level === 3 ? 'pl-5' : 'pl-3'
            }`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === 'mobile') {
    return (
      <details className="toc toc--mobile">
        <summary className="toc__summary">
          <span>本文目录</span>
          <span className="toc__summary-count">{items.length} 节</span>
        </summary>
        <nav aria-label="移动文章目录">{list}</nav>
      </details>
    );
  }

  return (
    <nav className="toc" aria-label="文章目录">
      <h4 className="toc__title">目录</h4>
      {list}
    </nav>
  );
}
