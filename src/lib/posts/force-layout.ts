/**
 * Tiny deterministic force-directed layout (no d3).
 * Pure: same seeds → same positions. Safe for unit tests.
 */

export type ForceNode = { id: string; x: number; y: number; vx: number; vy: number };
export type ForceEdge = { source: string; target: string };

export type ForceLayoutOptions = {
  width?: number;
  height?: number;
  iterations?: number;
  repulsion?: number;
  springLength?: number;
  springStrength?: number;
  damping?: number;
  centerStrength?: number;
};

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function layoutForceGraph(
  nodeIds: string[],
  edges: ForceEdge[],
  options: ForceLayoutOptions = {},
): Map<string, { x: number; y: number }> {
  const width = options.width ?? 640;
  const height = options.height ?? 420;
  const iterations = options.iterations ?? 120;
  const repulsion = options.repulsion ?? 2800;
  const springLength = options.springLength ?? 90;
  const springStrength = options.springStrength ?? 0.035;
  const damping = options.damping ?? 0.82;
  const centerStrength = options.centerStrength ?? 0.01;
  const cx = width / 2;
  const cy = height / 2;

  const nodes: ForceNode[] = nodeIds.map((id) => {
    const seed = hashSeed(id);
    const angle = ((seed % 3600) / 3600) * Math.PI * 2;
    const r = 40 + (seed % 80);
    return {
      id,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const links = edges
    .map((e) => ({
      source: byId.get(e.source),
      target: byId.get(e.target),
    }))
    .filter((l): l is { source: ForceNode; target: ForceNode } =>
      Boolean(l.source && l.target && l.source !== l.target),
    );

  for (let iter = 0; iter < iterations; iter++) {
    // Coulomb-ish repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist2 = dx * dx + dy * dy;
        if (dist2 < 0.01) {
          dx = (hashSeed(a.id) % 7) - 3 || 1;
          dy = (hashSeed(b.id) % 7) - 3 || 1;
          dist2 = dx * dx + dy * dy;
        }
        const dist = Math.sqrt(dist2);
        const force = repulsion / dist2;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    // Springs along edges
    for (const link of links) {
      const a = link.source;
      const b = link.target;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const delta = dist - springLength;
      const force = delta * springStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Weak pull to center + integrate
    for (const n of nodes) {
      n.vx += (cx - n.x) * centerStrength;
      n.vy += (cy - n.y) * centerStrength;
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.min(width - 24, Math.max(24, n.x));
      n.y = Math.min(height - 24, Math.max(24, n.y));
    }
  }

  return new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}

/** Filter garden graph by series (exact) and/or tag (exact). Empty filters = all. */
export function filterGardenGraph<
  N extends { slug: string; series?: string; tags: string[] },
  E extends { from: string; to: string },
>(
  graph: { nodes: N[]; edges: E[] },
  filters: { series?: string; tag?: string },
): { nodes: N[]; edges: E[] } {
  const series = filters.series?.trim() || '';
  const tag = filters.tag?.trim() || '';
  let nodes = graph.nodes;
  if (series) {
    nodes = nodes.filter((n) => n.series === series);
  }
  if (tag) {
    nodes = nodes.filter((n) => n.tags.includes(tag));
  }
  const allowed = new Set(nodes.map((n) => n.slug));
  const edges = graph.edges.filter((e) => allowed.has(e.from) && allowed.has(e.to));
  return { nodes, edges };
}
