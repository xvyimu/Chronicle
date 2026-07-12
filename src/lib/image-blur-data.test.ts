import { describe, it, expect } from 'vitest';
import { blurDataFor, IMAGE_BLUR_DATA } from './image-blur-data';

describe('image-blur-data', () => {
  it('covers all project preview images', () => {
    expect(Object.keys(IMAGE_BLUR_DATA).length).toBeGreaterThanOrEqual(6);
    expect(IMAGE_BLUR_DATA['/images/projects/blog.png']).toMatch(
      /^data:image\/webp;base64,/,
    );
  });

  it('returns undefined for unknown or empty paths', () => {
    expect(blurDataFor(undefined)).toBeUndefined();
    expect(blurDataFor(null)).toBeUndefined();
    expect(blurDataFor('/images/missing.png')).toBeUndefined();
  });

  it('returns blur for known paths', () => {
    expect(blurDataFor('/images/projects/nav-site.png')).toBe(
      IMAGE_BLUR_DATA['/images/projects/nav-site.png'],
    );
  });
});
