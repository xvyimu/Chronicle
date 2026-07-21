/** localStorage helpers for /garden interactive view (filters + node positions). */

export const GARDEN_VIEW_STORAGE_KEY = 'blog:garden-view:v1';

export type GardenViewPosition = { x: number; y: number };

export type GardenSavedView = {
  version: 1;
  series: string;
  tag: string;
  positions: Record<string, GardenViewPosition>;
  savedAt: string;
};

export function serializeGardenView(
  series: string,
  tag: string,
  positions: Map<string, GardenViewPosition> | Record<string, GardenViewPosition>,
  savedAt: string = new Date().toISOString(),
): GardenSavedView {
  const record =
    positions instanceof Map ? Object.fromEntries(positions.entries()) : { ...positions };
  return {
    version: 1,
    series: series.trim(),
    tag: tag.trim(),
    positions: record,
    savedAt,
  };
}

export function parseGardenView(raw: unknown): GardenSavedView | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  if (typeof o.series !== 'string' || typeof o.tag !== 'string') return null;
  if (typeof o.savedAt !== 'string') return null;
  if (!o.positions || typeof o.positions !== 'object') return null;
  const positions: Record<string, GardenViewPosition> = {};
  for (const [k, v] of Object.entries(o.positions as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const p = v as Record<string, unknown>;
    if (typeof p.x !== 'number' || typeof p.y !== 'number') continue;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    positions[k] = { x: p.x, y: p.y };
  }
  return {
    version: 1,
    series: o.series,
    tag: o.tag,
    positions,
    savedAt: o.savedAt,
  };
}

export function loadGardenViewFromStorage(
  storage: Pick<Storage, 'getItem'> | null | undefined,
): GardenSavedView | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(GARDEN_VIEW_STORAGE_KEY);
    if (!raw) return null;
    return parseGardenView(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveGardenViewToStorage(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  view: GardenSavedView,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(GARDEN_VIEW_STORAGE_KEY, JSON.stringify(view));
    return true;
  } catch {
    return false;
  }
}

export function clearGardenViewStorage(
  storage: Pick<Storage, 'removeItem'> | null | undefined,
): void {
  if (!storage) return;
  try {
    storage.removeItem(GARDEN_VIEW_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Merge force layout with optional saved positions (saved wins for matching slugs). */
export function mergePositions(
  layout: Map<string, GardenViewPosition>,
  saved: Record<string, GardenViewPosition> | null | undefined,
): Map<string, GardenViewPosition> {
  const out = new Map(layout);
  if (!saved) return out;
  for (const [slug, pos] of Object.entries(saved)) {
    if (out.has(slug)) out.set(slug, pos);
  }
  return out;
}
