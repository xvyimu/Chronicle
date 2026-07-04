import { describe, it, expect } from 'vitest';
import { cn, slugifyTag, formatDate } from '@/lib/utils';

describe('cn', () => {
  it('joins truthy class values', () => {
    expect(cn('card', false, null, undefined, 'card--active')).toBe('card card--active');
  });

  it('merges Tailwind class conflicts', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4');
  });
});

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
