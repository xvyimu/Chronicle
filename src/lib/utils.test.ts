import { describe, it, expect } from 'vitest';
import { slugifyTag, formatDate, assertRequiredFields } from '@/lib/utils';

describe('slugifyTag', () => {
  it('converts "Next.js" to "next-js"', () => {
    expect(slugifyTag('Next.js')).toBe('next-js');
  });

  it('lowercases and trims whitespace', () => {
    expect(slugifyTag('  React  ')).toBe('react');
  });

  it('collapses multiple dashes', () => {
    expect(slugifyTag('C++')).toBe('c');
  });

  it('handles chinese characters', () => {
    expect(slugifyTag('前端开发')).toBe('前端开发');
  });
});

describe('formatDate', () => {
  it('formats YYYY-MM-DD to Chinese locale', () => {
    expect(formatDate('2026-06-22')).toBe('2026年6月22日');
  });

  it('does not shift to previous day due to timezone', () => {
    // In UTC-8, "2026-06-22T00:00:00" would display as 2026年6月21日 without T00:00:00
    expect(formatDate('2026-06-22')).not.toBe('2026年6月21日');
  });
});

describe('assertRequiredFields', () => {
  it('passes when all fields are present', () => {
    expect(() =>
      assertRequiredFields({ title: 'Hello', date: '2026-01-01' }, ['title', 'date'], 'test.md')
    ).not.toThrow();
  });

  it('throws on missing string field', () => {
    expect(() =>
      assertRequiredFields({ date: '2026-01-01' }, ['title', 'date'], 'test.md')
    ).toThrow('test.md');
  });

  it('throws on null field', () => {
    expect(() =>
      assertRequiredFields({ title: null, date: '2026-01-01' }, ['title', 'date'], 'test.md')
    ).toThrow();
  });

  it('throws on empty string field', () => {
    expect(() =>
      assertRequiredFields({ title: '', date: '2026-01-01' }, ['title', 'date'], 'test.md')
    ).toThrow();
  });
});
