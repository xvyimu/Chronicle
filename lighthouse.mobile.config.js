/**
 * Manual mobile Lighthouse baseline.
 *
 * This config is intentionally not wired into CI. It gives maintainers a
 * repeatable mobile audit command without turning mobile Lighthouse noise into
 * a production deploy blocker.
 *
 * Manual run:
 *   pnpm build
 *   npx @lhci/cli autorun --config=./lighthouse.mobile.config.js
 */
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/blog',
        'http://localhost:3000/blog/nextjs-app-router',
        'http://localhost:3000/projects',
        'http://localhost:3000/about',
        'http://localhost:3000/links',
      ],
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'ready',
      startServerReadyTimeout: 30000,
      numberOfRuns: 2,
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.65 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],
        'errors-in-console': ['warn', { maxLength: 0 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouse-mobile',
    },
  },
};
