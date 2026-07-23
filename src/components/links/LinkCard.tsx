import type { LinkItem } from '@/types';
import MetaBadge from '@/components/ui/MetaBadge';
import { getLinkHost } from '@/lib/links-filter';

const LINK_PRIORITY_LABELS: Record<NonNullable<LinkItem['priority']>, string> = {
  primary: '重点',
  reference: '参考',
  watchlist: '观察',
};

/** Presentational link card — server-safe, no motion hydration. */
export function LinkCard({ item }: { item: LinkItem }) {
  const hasCurationMeta = item.official || item.priority || item.lastChecked;

  return (
    <li className="links-directory__item">
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
    </li>
  );
}
