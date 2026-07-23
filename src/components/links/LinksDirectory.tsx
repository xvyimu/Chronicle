import type { LinkCategory } from '@/types';
import { countLinkItems } from '@/lib/links-filter';
import { LinksCatalog } from './LinksCatalog';
import { LinksDirectoryClient } from './LinksDirectoryClient';

/**
 * /links directory shell.
 * Metrics + category nav + full catalog SSR; only the search box is a client island.
 * Avoids hydrating ~123 MagneticCard instances on first paint (CH-PERF-007).
 */
export function LinksDirectory({ categories }: { categories: LinkCategory[] }) {
  const totalLinks = countLinkItems(categories);

  return (
    <div className="links-directory">
      {/* Row 1: stats only — mono digits (never display serif: 1/0 → I/O) */}
      <div className="links-directory__metrics" aria-label="收藏概览">
        <div className="links-directory__metric">
          <span className="links-directory__metric-label">分类</span>
          <strong className="links-directory__metric-value">{categories.length}</strong>
        </div>
        <div className="links-directory__metric">
          <span className="links-directory__metric-label">站点</span>
          <strong className="links-directory__metric-value">{totalLinks}</strong>
        </div>
      </div>

      {/* Row 2: category jump chips full width */}
      <nav className="links-directory__nav" aria-label="链接分类">
        {categories.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className="links-directory__nav-link"
            aria-label={`${category.title} ${category.items.length} 个`}
          >
            <span className="links-directory__nav-title">{category.title}</span>
            <span className="links-directory__nav-count">{category.items.length}</span>
          </a>
        ))}
      </nav>

      {/* Row 3+: search island + SSR catalog (or filtered client catalog) */}
      <LinksDirectoryClient categories={categories}>
        <LinksCatalog categories={categories} />
      </LinksDirectoryClient>
    </div>
  );
}
