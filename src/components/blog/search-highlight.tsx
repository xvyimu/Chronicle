/**
 * Render `text` with the character ranges in `indices` wrapped in <mark>.
 * Indices come from Fuse.js (inclusive ranges). Falls back to plain text
 * when no matches are present for this field.
 */
export function highlightSearchMatch(text: string, indices: readonly [number, number][]) {
  if (!indices || indices.length === 0) return text;

  // Sort + merge to guard against overlapping/unordered ranges.
  const sorted = [...indices].sort((a, b) => a[0] - b[0]);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach(([start, end], index) => {
    if (start > cursor) segments.push(text.slice(cursor, start));
    const safeStart = Math.max(start, cursor);
    if (end + 1 > safeStart) {
      segments.push(
        <mark key={`m-${index}`} className="search-hl">
          {text.slice(safeStart, end + 1)}
        </mark>,
      );
      cursor = end + 1;
    }
  });

  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments;
}
