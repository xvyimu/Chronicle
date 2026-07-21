import type { Metadata } from 'next';
import Link from 'next/link';
import { getGardenGraph } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';
import './garden.css';

export const metadata: Metadata = buildPageMetadata({
  title: '数字花园',
  description: '文章 wikilink 邻接一览：边列表与轻量连线，非首页力导向图。',
  path: '/garden',
});

export default function GardenPage() {
  const graph = getGardenGraph();
  const titleBySlug = new Map(graph.nodes.map((n) => [n.slug, n.title]));
  const edgeCount = graph.edges.length;
  const nodeCount = graph.nodes.length;

  // Deterministic lightweight layout for optional SVG (not force-directed).
  const positioned = graph.nodes.map((node, index) => {
    const angle = (index / Math.max(nodeCount, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = 120;
    return {
      ...node,
      x: 160 + Math.cos(angle) * radius,
      y: 160 + Math.sin(angle) * radius,
    };
  });
  const posBySlug = new Map(positioned.map((n) => [n.slug, n]));

  return (
    <section className="section garden-page">
      <div className="section__inner garden-page__inner">
        <header className="garden-page__header">
          <p className="garden-page__label">Digital garden</p>
          <h1 className="garden-page__title">笔记邻接</h1>
          <p className="garden-page__desc">
            基于正文与延伸阅读中的 <code className="garden-page__code">[[wikilink]]</code>
            ，展示站内有向边。这是次级原型：默认读边列表；在支持动效的环境下可看静态圆环连线（非力导向）。
          </p>
          <p className="garden-page__meta">
            {nodeCount} 篇笔记 · {edgeCount} 条有向边
          </p>
        </header>

        <div className="garden-page__layout">
          <div
            className="garden-page__visual garden-page__visual--motion"
            aria-hidden="true"
          >
            <svg
              className="garden-page__svg"
              viewBox="0 0 320 320"
              role="img"
              aria-label="笔记连线示意图"
            >
              {graph.edges.map((edge) => {
                const from = posBySlug.get(edge.from);
                const to = posBySlug.get(edge.to);
                if (!from || !to) return null;
                return (
                  <line
                    key={`${edge.from}->${edge.to}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className="garden-page__edge"
                  />
                );
              })}
              {positioned.map((node) => (
                <g key={node.slug}>
                  <circle cx={node.x} cy={node.y} r={5} className="garden-page__node" />
                </g>
              ))}
            </svg>
            <p className="garden-page__visual-hint">静态圆环示意 · 非力导向仿真</p>
          </div>

          <div className="garden-page__lists">
            <section
              className="article-panel garden-page__panel"
              aria-labelledby="garden-edges-title"
            >
              <div className="article-panel__head">
                <div>
                  <p className="article-panel__label">Edges</p>
                  <h2 id="garden-edges-title" className="article-panel__title">
                    有向边
                  </h2>
                  <p className="article-panel__desc">从 → 到（wikilink 出边）</p>
                </div>
              </div>
              {edgeCount === 0 ? (
                <p className="article-panel__desc">暂无 wikilink 边</p>
              ) : (
                <ul className="garden-page__edge-list">
                  {graph.edges.map((edge) => (
                    <li
                      key={`${edge.from}->${edge.to}`}
                      className="garden-page__edge-item"
                    >
                      <Link
                        href={`/blog/${edge.from}`}
                        className="garden-page__edge-link"
                      >
                        {titleBySlug.get(edge.from) ?? edge.from}
                      </Link>
                      <span className="garden-page__arrow" aria-hidden="true">
                        →
                      </span>
                      <Link href={`/blog/${edge.to}`} className="garden-page__edge-link">
                        {titleBySlug.get(edge.to) ?? edge.to}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              className="article-panel garden-page__panel"
              aria-labelledby="garden-nodes-title"
            >
              <div className="article-panel__head">
                <div>
                  <p className="article-panel__label">Notes</p>
                  <h2 id="garden-nodes-title" className="article-panel__title">
                    全部笔记
                  </h2>
                </div>
              </div>
              <ul className="garden-page__node-list">
                {graph.nodes.map((node) => (
                  <li key={node.slug}>
                    <Link href={`/blog/${node.slug}`} className="garden-page__node-link">
                      {node.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <p className="garden-page__foot">
          <Link href="/blog">← 返回博客</Link>
          {' · '}
          <Link href="/series">专题</Link>
        </p>
      </div>
    </section>
  );
}
