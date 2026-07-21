'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { GardenGraph } from '@/lib/posts/link-graph';
import { filterGardenGraph, layoutForceGraph } from '@/lib/posts/force-layout';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const WIDTH = 640;
const HEIGHT = 420;

export default function GardenExplorer({ graph }: { graph: GardenGraph }) {
  const reducedMotion = usePrefersReducedMotion();
  const [series, setSeries] = useState('');
  const [tag, setTag] = useState('');
  const [focus, setFocus] = useState<string | null>(null);

  const seriesOptions = useMemo(() => {
    const set = new Set<string>();
    for (const n of graph.nodes) {
      if (n.series) set.add(n.series);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [graph.nodes]);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    for (const n of graph.nodes) {
      for (const t of n.tags) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [graph.nodes]);

  const filtered = useMemo(
    () => filterGardenGraph(graph, { series, tag }),
    [graph, series, tag],
  );

  const positions = useMemo(() => {
    if (reducedMotion || filtered.nodes.length === 0) return null;
    return layoutForceGraph(
      filtered.nodes.map((n) => n.slug),
      filtered.edges.map((e) => ({ source: e.from, target: e.to })),
      { width: WIDTH, height: HEIGHT, iterations: 140 },
    );
  }, [filtered, reducedMotion]);

  const titleBySlug = useMemo(
    () => new Map(graph.nodes.map((n) => [n.slug, n.title])),
    [graph.nodes],
  );

  // Clear focus if filtered out
  useEffect(() => {
    if (focus && !filtered.nodes.some((n) => n.slug === focus)) {
      setFocus(null);
    }
  }, [filtered.nodes, focus]);

  return (
    <div className="garden-explorer">
      <div className="garden-explorer__filters" role="group" aria-label="花园筛选">
        <label className="garden-explorer__field">
          <span className="garden-explorer__field-label">专题</span>
          <select
            className="garden-explorer__select"
            value={series}
            onChange={(e) => setSeries(e.target.value)}
          >
            <option value="">全部专题</option>
            {seriesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="garden-explorer__field">
          <span className="garden-explorer__field-label">标签</span>
          <select
            className="garden-explorer__select"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">全部标签</option>
            {tagOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {(series || tag) && (
          <button
            type="button"
            className="garden-explorer__reset"
            onClick={() => {
              setSeries('');
              setTag('');
            }}
          >
            清除筛选
          </button>
        )}
        <p className="garden-explorer__count">
          {filtered.nodes.length} 节点 · {filtered.edges.length} 边
          {reducedMotion ? ' · 已按系统设置关闭力导向动画' : ' · 力导向布局'}
        </p>
      </div>

      {positions ? (
        <div className="garden-explorer__canvas-wrap">
          <svg
            className="garden-explorer__svg"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label="笔记力导向连线"
          >
            {filtered.edges.map((edge) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;
              const dim = focus != null && focus !== edge.from && focus !== edge.to;
              return (
                <line
                  key={`${edge.from}->${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className={
                    dim
                      ? 'garden-explorer__edge garden-explorer__edge--dim'
                      : 'garden-explorer__edge'
                  }
                />
              );
            })}
            {filtered.nodes.map((node) => {
              const p = positions.get(node.slug);
              if (!p) return null;
              const active = focus === node.slug;
              const dim = focus != null && !active;
              return (
                <g key={node.slug} transform={`translate(${p.x},${p.y})`}>
                  <a href={`/blog/${node.slug}`} className="garden-explorer__node-link">
                    <circle
                      r={active ? 8 : 6}
                      className={
                        dim
                          ? 'garden-explorer__node garden-explorer__node--dim'
                          : 'garden-explorer__node'
                      }
                      onMouseEnter={() => setFocus(node.slug)}
                      onMouseLeave={() => setFocus(null)}
                      onFocus={() => setFocus(node.slug)}
                      onBlur={() => setFocus(null)}
                    />
                    <title>{node.title}</title>
                  </a>
                  <text
                    y={-12}
                    textAnchor="middle"
                    className={
                      dim
                        ? 'garden-explorer__label garden-explorer__label--dim'
                        : 'garden-explorer__label'
                    }
                  >
                    {node.title.length > 10 ? `${node.title.slice(0, 10)}…` : node.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <p className="garden-explorer__list-only-hint">
          {filtered.nodes.length === 0
            ? '当前筛选下没有节点，试试清除筛选。'
            : '力导向图已关闭（减少动态），请使用下方边列表浏览。'}
        </p>
      )}

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
              <p className="article-panel__desc">筛选后的从 → 到</p>
            </div>
          </div>
          {filtered.edges.length === 0 ? (
            <p className="article-panel__desc">暂无边</p>
          ) : (
            <ul className="garden-page__edge-list">
              {filtered.edges.map((edge) => (
                <li key={`${edge.from}->${edge.to}`} className="garden-page__edge-item">
                  <Link href={`/blog/${edge.from}`} className="garden-page__edge-link">
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
                笔记
              </h2>
            </div>
          </div>
          <ul className="garden-page__node-list">
            {filtered.nodes.map((node) => (
              <li key={node.slug}>
                <Link href={`/blog/${node.slug}`} className="garden-page__node-link">
                  {node.title}
                </Link>
                {node.series ? (
                  <span className="garden-explorer__meta-chip">{node.series}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
