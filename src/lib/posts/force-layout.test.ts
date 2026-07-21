import { describe, it, expect } from 'vitest';
import { filterGardenGraph, layoutForceGraph } from './force-layout';

describe('layoutForceGraph', () => {
  it('returns a position for every node (deterministic)', () => {
    const ids = ['a', 'b', 'c'];
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ];
    const a = layoutForceGraph(ids, edges, { iterations: 40 });
    const b = layoutForceGraph(ids, edges, { iterations: 40 });
    expect([...a.keys()].sort()).toEqual(ids);
    for (const id of ids) {
      expect(a.get(id)?.x).toBeCloseTo(b.get(id)!.x, 5);
      expect(a.get(id)?.y).toBeCloseTo(b.get(id)!.y, 5);
      expect(Number.isFinite(a.get(id)!.x)).toBe(true);
    }
  });
});

describe('filterGardenGraph', () => {
  const graph = {
    nodes: [
      { slug: 'a', series: 'S1', tags: ['t1', 't2'] },
      { slug: 'b', series: 'S1', tags: ['t2'] },
      { slug: 'c', series: 'S2', tags: ['t1'] },
    ],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'a', to: 'c' },
      { from: 'b', to: 'c' },
    ],
  };

  it('filters by series and keeps internal edges', () => {
    const out = filterGardenGraph(graph, { series: 'S1' });
    expect(out.nodes.map((n) => n.slug)).toEqual(['a', 'b']);
    expect(out.edges).toEqual([{ from: 'a', to: 'b' }]);
  });

  it('filters by tag', () => {
    const out = filterGardenGraph(graph, { tag: 't1' });
    expect(out.nodes.map((n) => n.slug).sort()).toEqual(['a', 'c']);
    expect(out.edges).toEqual([{ from: 'a', to: 'c' }]);
  });

  it('returns all when filters empty', () => {
    const out = filterGardenGraph(graph, {});
    expect(out.nodes).toHaveLength(3);
    expect(out.edges).toHaveLength(3);
  });
});
