import type { LinkCategory } from '@/types';
import { LinkCard } from './LinkCard';

/** Full category catalog — intended for SSR so HTML ships without client card work. */
export function LinksCatalog({ categories }: { categories: LinkCategory[] }) {
  return (
    <div className="links-directory__sections">
      {categories.map((category) => (
        <section key={category.id} id={category.id} className="links-directory__category">
          <header className="links-directory__category-head">
            <p className="links-directory__category-eyebrow">
              {category.items.length} 个站点
            </p>
            <h3 className="links-directory__category-title">{category.title}</h3>
            <p className="links-directory__category-desc">{category.description}</p>
          </header>
          <ul className="links-directory__grid" aria-label={`${category.title}链接`}>
            {category.items.map((item) => (
              <LinkCard key={item.url} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
