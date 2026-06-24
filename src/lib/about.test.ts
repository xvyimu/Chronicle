import { describe, it, expect } from 'vitest';
import { getAboutContent } from '@/lib/about';

describe('getAboutContent', () => {
  it('returns the about page content as a non-empty string', () => {
    const content = getAboutContent();
    expect(content).toBeTruthy();
    expect(typeof content).toBe('string');
    expect(content!.length).toBeGreaterThan(0);
  });

  it('contains expected sections', () => {
    const content = getAboutContent();
    expect(content).toContain('技术博客');
  });

  it('starts with a markdown heading', () => {
    const content = getAboutContent();
    expect(content).toMatch(/^##\s/);
  });
});