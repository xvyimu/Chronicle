/** Auto-generated blur placeholders for local project images.
 * Re-run: pnpm gen:blur  (or node scripts/generate-blur-data.mjs)
 * Do not edit by hand.
 */
export const IMAGE_BLUR_DATA: Record<string, string> = {
  '/images/projects/blog.png':
    'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAADwAQCdASoMAAcAA8BgJagCdLoAAwhAW5AA8G5889fUjBXFb/5Cm2uPt7OiIAAA',
  '/images/projects/domain-check.png':
    'data:image/webp;base64,UklGRjwAAABXRUJQVlA4IDAAAADwAQCdASoMAAcAA8BgJagCdLoAAwgWZAAA/GsJYUH/4uPuZ9sW0y/SmkiGf8wAAAA=',
  '/images/projects/hermes-hug.png':
    'data:image/webp;base64,UklGRjQAAABXRUJQVlA4ICgAAADQAQCdASoMAAcAA8BgJagCdAEOuwXvAAD6G3ENZXY/+g++3efJ1AAA',
  '/images/projects/nav-site.png':
    'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAABwAQCdASoMAAcAA8BgJagCdAFAAAD+6FS84fc65vF5h1/dOPnyvlYTvJ04AAAA',
  '/images/projects/qinghome.png':
    'data:image/webp;base64,UklGRjQAAABXRUJQVlA4ICgAAACwAQCdASoMAAcAA8BgJagCdAEOuwSAAP0vOymvP4lh8+V8rCckY4AA',
  '/images/projects/relaycheck.png':
    'data:image/webp;base64,UklGRjQAAABXRUJQVlA4ICgAAACQAQCdASoMAAcAA8BgJaAAAuab25AA+huiDor//4XF/30L/FsvgAAA',
} as const;

/** Return a precomputed blurDataURL for a known local image path. */
export function blurDataFor(src?: string | null): string | undefined {
  if (!src) return undefined;
  return IMAGE_BLUR_DATA[src];
}
