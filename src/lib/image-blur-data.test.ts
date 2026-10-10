import { describe, it, expect } from 'vitest';
import { blurDataFor, imageBlurProps, IMAGE_BLUR_DATA } from './image-blur-data';

describe('image-blur-data', () => {
  it('covers the chronicle project preview image', () => {
    expect(Object.keys(IMAGE_BLUR_DATA).length).toBeGreaterThanOrEqual(1);
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
    expect(blurDataFor('/images/projects/blog.png')).toBe(
      IMAGE_BLUR_DATA['/images/projects/blog.png'],
    );
  });

  it('imageBlurProps pairs placeholder with blurDataURL', () => {
    const known = imageBlurProps('/images/projects/blog.png');
    expect(known).toEqual({
      placeholder: 'blur',
      blurDataURL: IMAGE_BLUR_DATA['/images/projects/blog.png'],
    });
    expect(imageBlurProps(undefined)).toEqual({});
    expect(imageBlurProps('/images/missing.png')).toEqual({});
  });
});
