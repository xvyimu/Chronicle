import type { Metadata } from 'next';
import Link from 'next/link';
import { getGardenGraph, getGardenPositions } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';
import PageSection from '@/components/layout/PageSection';
import GardenExplorer from '@/components/blog/GardenExplorer';
import './garden.css';

export const metadata: Metadata = buildPageMetadata({
  title: '数字花园',
  description:
    '文章 wikilink 邻接：专题/标签筛选、力导向与节点拖拽、本机保存视图；可按系统设置关闭动效。',
  path: '/garden',
});

export default function GardenPage() {
  const graph = getGardenGraph();
  // T7: seed client force layout with T2 snapshot positions (or fs recompute).
  const initialPositions = getGardenPositions();

  return (
    <PageSection
      eyebrow="Garden"
      title="数字花园"
      subtitle={
        <>
          基于正文与延伸阅读中的 <code className="garden-page__code">[[wikilink]]</code>
          。支持专题/标签筛选与力导向布局；
          <code className="garden-page__code">prefers-reduced-motion</code> 时仅保留列表。
          全库 {graph.nodes.length} 篇 · {graph.edges.length} 条有向边。
        </>
      }
      action={
        <div className="section__action-group">
          <Link href="/blog" className="section__link">
            博客
          </Link>
          <Link href="/series" className="section__link">
            专题
          </Link>
        </div>
      }
    >
      <GardenExplorer graph={graph} initialPositions={initialPositions} />
    </PageSection>
  );
}
