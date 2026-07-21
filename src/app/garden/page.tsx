import type { Metadata } from 'next';
import Link from 'next/link';
import { getGardenGraph } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';
import GardenExplorer from '@/components/blog/GardenExplorer';
import './garden.css';

export const metadata: Metadata = buildPageMetadata({
  title: '数字花园',
  description:
    '文章 wikilink 邻接：专题/标签筛选、力导向布局与边列表（可按系统设置关闭动效）。',
  path: '/garden',
});

export default function GardenPage() {
  const graph = getGardenGraph();

  return (
    <section className="section garden-page">
      <div className="section__inner garden-page__inner">
        <header className="garden-page__header">
          <p className="garden-page__label">Digital garden</p>
          <h1 className="garden-page__title">笔记邻接</h1>
          <p className="garden-page__desc">
            基于正文与延伸阅读中的 <code className="garden-page__code">[[wikilink]]</code>
            。支持专题/标签筛选与力导向布局；
            <code className="garden-page__code">prefers-reduced-motion</code>{' '}
            时仅保留列表。
          </p>
          <p className="garden-page__meta">
            全库 {graph.nodes.length} 篇 · {graph.edges.length} 条有向边
          </p>
        </header>

        <GardenExplorer graph={graph} />

        <p className="garden-page__foot">
          <Link href="/blog">← 返回博客</Link>
          {' · '}
          <Link href="/series">专题</Link>
        </p>
      </div>
    </section>
  );
}
