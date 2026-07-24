import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const STYLES_ROOT = path.join(PROJECT_ROOT, 'src', 'app', 'styles');
const ROOT_LAYOUT = path.join(PROJECT_ROOT, 'src', 'app', 'layout.tsx');

function read(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function stylePath(name: string): string {
  return path.join(STYLES_ROOT, name);
}

describe('CSS route ownership (W6 css-route-split)', () => {
  it('root layout keeps only global CSS modules', () => {
    const layout = read(ROOT_LAYOUT);
    const globalModules = [
      'tokens.css',
      'base.css',
      'components.css',
      'controls.css',
      'backdrop.css',
      'animations.css',
      'responsive.css',
    ];
    for (const mod of globalModules) {
      expect(layout, `missing global ${mod}`).toContain(`./styles/${mod}`);
    }

    const routeOnly = [
      'archive.css',
      'blog-ui.css',
      'article-ui.css',
      'prose.css',
      'search-ui.css',
      'links.css',
      'project-detail.css',
      'home.css',
      'home-hero.css',
      'home-sections.css',
    ];
    for (const mod of routeOnly) {
      expect(layout, `route module leaked into root: ${mod}`).not.toContain(
        `./styles/${mod}`,
      );
    }
  });

  it('global responsive.css no longer carries route-only selectors', () => {
    const responsive = read(stylePath('responsive.css'));
    const forbidden = [
      '.blog__item',
      '.blog__title',
      '.article-layout',
      '.article-shell',
      '.article__header',
      '.article__title',
      '.article-aside',
      '.toc--mobile',
      '.article-panel',
      '.article-nav',
      '.reading-prefs',
      '.project-detail',
      '.archive-grid',
      '.archive-card',
      '.archive-list',
      '.tag-cloud',
      '.pagination',
      '.hero',
      '.stat-pill',
    ];
    for (const sel of forbidden) {
      expect(responsive, `responsive still mentions ${sel}`).not.toContain(sel);
    }
    // print stylesheet may still hide reading-prefs / toc without shipping their layout rules
    expect(responsive).toMatch(/@media print/);
  });

  it('route modules own their media-query blocks', () => {
    const owned: Array<[string, string[]]> = [
      ['blog-ui.css', ['.blog__item', '.tag-link', '.tag-cloud']],
      ['archive.css', ['.archive-grid--3', '.archive-card']],
      ['article-ui.css', ['.article-layout', '.reading-prefs']],
      ['prose.css', ['.prose h2', '.prose pre']],
      ['project-detail.css', ['--project-detail-title-size']],
    ];

    for (const [file, needles] of owned) {
      const css = read(stylePath(file));
      expect(css, `${file} missing @media`).toMatch(/@media\s*\(max-width:/);
      for (const needle of needles) {
        expect(css, `${file} missing ${needle}`).toContain(needle);
      }
    }
  });

  it('controls.css drops dead pagination and keeps global CTA', () => {
    const controls = read(stylePath('controls.css'));
    expect(controls).toContain("[data-slot='button'][data-size='cta']");
    expect(controls).toContain('.theme-toggle');
    expect(controls).not.toContain('.pagination');
    expect(controls).not.toContain('.tag-link');
    expect(controls).not.toContain('.card--project');
    expect(controls).not.toContain('.reading-prefs');
  });

  it('components.css drops dead hero/stat-pill and keeps card--project', () => {
    const components = read(stylePath('components.css'));
    expect(components).toContain('.card--project');
    expect(components).toContain('.section');
    expect(components).not.toMatch(/(^|\s)\.hero(\s|\{|,|:)/m);
    expect(components).not.toContain('.stat-pill');
  });
});
