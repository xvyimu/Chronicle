import { describe, expect, it } from 'vitest';
import { highlightSegments, rangesForKey } from './highlight';

describe('highlightSegments', () => {
  it('returns a single plain segment when no ranges', () => {
    expect(highlightSegments('标题文本', [])).toEqual([{ text: '标题文本', hit: false }]);
  });

  it('splits text around a single range (closed interval)', () => {
    // 'PostgreSQL 性能调优'，命中 [0, 9] = "PostgreSQL"
    expect(highlightSegments('PostgreSQL 性能调优', [[0, 9]])).toEqual([
      { text: 'PostgreSQL', hit: true },
      { text: ' 性能调优', hit: false },
    ]);
  });

  it('handles multiple disjoint ranges in order', () => {
    // '索引与查询计划'，命中 [0,1]="索引" 与 [3,4]="查询"
    expect(
      highlightSegments('索引与查询计划', [
        [0, 1],
        [3, 4],
      ]),
    ).toEqual([
      { text: '索引', hit: true },
      { text: '与', hit: false },
      { text: '查询', hit: true },
      { text: '计划', hit: false },
    ]);
  });

  it('merges overlapping and adjacent ranges', () => {
    // [0,2]+[3,5] 相邻合并为一个段：'012345'.slice(0,6)
    expect(
      highlightSegments('012345', [
        [0, 2],
        [3, 5],
      ]),
    ).toEqual([{ text: '012345', hit: true }]);
    // 重叠 [0,3]+[2,5] 合并为 [0,5]
    expect(
      highlightSegments('012345', [
        [0, 3],
        [2, 5],
      ]),
    ).toEqual([{ text: '012345', hit: true }]);
  });

  it('clamps out-of-bounds ranges', () => {
    // end 超出文本长度：截到 length-1
    expect(highlightSegments('abc', [[1, 10]])).toEqual([
      { text: 'a', hit: false },
      { text: 'bc', hit: true },
    ]);
  });

  it('ignores fully invalid ranges', () => {
    // start 越界 / 倒置区间全部丢弃 → 原样输出
    expect(
      highlightSegments('abc', [
        [5, 7],
        [2, 1],
      ]),
    ).toEqual([{ text: 'abc', hit: false }]);
  });

  it('returns empty segments for empty text', () => {
    expect(highlightSegments('', [[0, 1]])).toEqual([]);
  });

  it('highlights the full text when range covers it', () => {
    expect(highlightSegments('安全', [[0, 1]])).toEqual([{ text: '安全', hit: true }]);
  });
});

describe('rangesForKey', () => {
  it('returns indices for the matching key', () => {
    const matches = [
      { key: 'title', indices: [[0, 2]] as Array<[number, number]> },
      { key: 'description', indices: [[4, 6]] as Array<[number, number]> },
    ];
    expect(rangesForKey(matches, 'title')).toEqual([[0, 2]]);
    expect(rangesForKey(matches, 'description')).toEqual([[4, 6]]);
  });

  it('returns empty when key absent or matches empty', () => {
    expect(rangesForKey([], 'title')).toEqual([]);
    expect(
      rangesForKey(
        [{ key: 'tags', indices: [[0, 1]] as Array<[number, number]> }],
        'title',
      ),
    ).toEqual([]);
  });
});
