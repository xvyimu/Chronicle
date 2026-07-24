import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Gate modules are thin dynamic() wrappers — assert source contracts so
 * SSR is not re-enabled by accident and imports stay on the deferred path.
 */
describe('client boundary gates (W4 residual)', () => {
  const root = path.resolve(__dirname, '../..');

  it('BackToTopGate uses next/dynamic with ssr:false', () => {
    const source = readFileSync(
      path.join(root, 'components/ui/BackToTopGate.tsx'),
      'utf8',
    );
    expect(source).toContain("'use client'");
    expect(source).toContain("from 'next/dynamic'");
    expect(source).toMatch(/ssr:\s*false/);
    expect(source).toContain('@/components/ui/BackToTop');
  });

  it('ReadingProgressGate uses next/dynamic with ssr:false', () => {
    const source = readFileSync(
      path.join(root, 'components/blog/ReadingProgressGate.tsx'),
      'utf8',
    );
    expect(source).toContain("'use client'");
    expect(source).toContain("from 'next/dynamic'");
    expect(source).toMatch(/ssr:\s*false/);
    expect(source).toContain('@/components/blog/ReadingProgress');
  });

  it('root layout mounts BackToTop via gate, not direct island', () => {
    const source = readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
    expect(source).toContain('BackToTopGate');
    expect(source).not.toMatch(/import BackToTop from/);
  });

  it('article page mounts ReadingProgress via gate', () => {
    const source = readFileSync(path.join(root, 'app/blog/[slug]/page.tsx'), 'utf8');
    expect(source).toContain('ReadingProgressGate');
    expect(source).not.toMatch(/import ReadingProgress from/);
  });

  it('SiteBackdropParallaxGate still dynamic-imports parallax with ssr:false', () => {
    const source = readFileSync(
      path.join(root, 'components/layout/SiteBackdropParallaxGate.tsx'),
      'utf8',
    );
    expect(source).toContain("'use client'");
    expect(source).toContain("from 'next/dynamic'");
    expect(source).toMatch(/ssr:\s*false/);
    expect(source).toContain('prefers-reduced-motion');
    expect(source).toContain('pointer: fine');
  });
});
