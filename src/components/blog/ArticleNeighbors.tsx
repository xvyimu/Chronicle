import Link from 'next/link';
import type { PostMeta } from '@/types';

function NeighborList({ label, posts }: { label: string; posts: PostMeta[] }) {
  if (posts.length === 0) {
    return <p className="article-neighbors__empty">暂无{label}</p>;
  }
  return (
    <ul className="article-neighbors__list">
      {posts.map((p) => (
        <li key={p.slug}>
          <Link href={`/blog/${p.slug}`} className="article-neighbors__link">
            <span className="article-neighbors__title">{p.title}</span>
            {p.series ? (
              <span className="article-neighbors__chip">{p.series}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Folded adjacency panel for article pages (outbound + inbound).
 * Zero hydration: native details/summary.
 */
export default function ArticleNeighbors({
  outbound,
  inbound,
}: {
  outbound: PostMeta[];
  inbound: PostMeta[];
}) {
  const total = outbound.length + inbound.length;
  if (total === 0) return null;

  return (
    <details className="article-panel article-neighbors">
      <summary className="article-neighbors__summary">
        <span className="article-panel__label">Neighbors</span>
        <span className="article-neighbors__summary-title">邻接笔记</span>
        <span className="article-neighbors__summary-meta">
          出 {outbound.length} · 入 {inbound.length}
        </span>
      </summary>
      <div className="article-neighbors__body">
        <div>
          <h3 className="article-neighbors__heading">本文链出</h3>
          <NeighborList label="出边" posts={outbound} />
        </div>
        <div>
          <h3 className="article-neighbors__heading">链到本文</h3>
          <NeighborList label="入边" posts={inbound} />
        </div>
        <p className="article-neighbors__foot">
          <Link href="/garden">打开全站花园 →</Link>
        </p>
      </div>
    </details>
  );
}
