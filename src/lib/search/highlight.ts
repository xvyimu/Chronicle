import type { MatchRange } from './engine';

/**
 * 词高亮分段（R14）：把文本按匹配区间切成 plain / hit 片段，
 * 供 React 顺序渲染——hit 片段包 <mark>，plain 片段原样输出。
 *
 * 纯函数、无 DOM 依赖；区间来自 Fuse includeMatches 的
 * indices（[start, end] 闭区间，字符索引）。
 */

/** 一个输出片段：hit = 是否匹配段。 */
export type HighlightSegment = {
  text: string;
  hit: boolean;
};

/** 合并重叠区间并按起点排序（Fuse 理论上有序，防御性处理）。 */
function normalizeRanges(
  ranges: ReadonlyArray<readonly [number, number]>,
  textLength: number,
): Array<[number, number]> {
  const valid = ranges
    .filter(([s, e]) => s >= 0 && e >= s && s < textLength)
    .map(([s, e]) => [s, Math.min(e, textLength - 1)] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [];
  for (const range of valid) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1] + 1) {
      // 相邻或重叠：合并（相邻 = [0,2]+[3,5] 也并成一个高亮段，视觉上更连贯）
      last[1] = Math.max(last[1], range[1]);
    } else {
      merged.push([...range] as [number, number]);
    }
  }
  return merged;
}

/**
 * 把文本按匹配区间切成分段数组。
 * 区间为空或全部越界时返回单个 plain 片段（原样渲染，无 mark）。
 *
 * @param text 待分段文本
 * @param ranges Fuse indices 闭区间数组
 */
export function highlightSegments(
  text: string,
  ranges: ReadonlyArray<readonly [number, number]>,
): HighlightSegment[] {
  if (!text) return [];
  if (ranges.length === 0) return [{ text, hit: false }];

  const normalized = normalizeRanges(ranges, text.length);
  if (normalized.length === 0) return [{ text, hit: false }];

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of normalized) {
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), hit: false });
    }
    segments.push({ text: text.slice(start, end + 1), hit: true });
    cursor = end + 1;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), hit: false });
  }
  return segments;
}

/**
 * 从一条搜索结果的 matches 里取出指定字段（如 title）的区间。
 * tags 等数组字段匹配时 value 与索引对不上 SearchDoc 的序列化值，
 * 故只对字符串字段做高亮（title / description）。
 */
export function rangesForKey(
  matches: readonly MatchRange[],
  key: string,
): ReadonlyArray<readonly [number, number]> {
  const found = matches.find((m) => m.key === key);
  return found ? found.indices : [];
}
