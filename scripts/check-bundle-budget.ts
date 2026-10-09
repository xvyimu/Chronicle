/**
 * Bundle Budget Checker
 *
 * Runs after `next build` to enforce bundle size limits. Two gates:
 *
 *   1. Per-file + total static output (`.next/static` walk).
 *   2. **Per-route first load** — the gzipped JS+CSS a browser actually fetches
 *      for one route, read from Next's per-route
 *      `page_client-reference-manifest.js`. Gate 1 alone cannot see a route
 *      regression: total output was 883 KB against a 2 MB cap, so 57% of the
 *      budget was slack and no single file came close to its 300 KB cap either.
 *
 * Usage: tsx scripts/check-bundle-budget.ts
 *
 * Exit codes:
 *   0 — all budgets within limits
 *   1 — one or more budgets exceeded
 *
 * The size-evaluation logic is pure (`evaluateBudgets`, `evaluateRouteBudgets`)
 * so CI can assert the gates without a `.next` build; the filesystem walks are
 * only used by the CLI entry point.
 *
 * Related soft residuals (mobile LH not in CI · RUM p75 pending):
 *   docs/ops/ch-rum-ci-residual-board-2026-07-28.md
 * Lab/CWV budgets (desktop CI): lighthouse.config.js
 * Assertable unit surface: src/lib/check-bundle-budget-script.test.ts (CH-PERF-011)
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface BudgetConfig {
  /** Glob-like prefix to match files in .next/static */
  prefix: string;
  /** Max size in KB for a single file matching this prefix */
  maxSingleKB: number;
  description: string;
}

/** Budget thresholds — adjust as the project grows */
export const BUDGETS: BudgetConfig[] = [
  { prefix: 'chunks/', maxSingleKB: 300, description: 'JS chunks (per file)' },
  { prefix: 'css', maxSingleKB: 300, description: 'CSS bundles (incl. Shiki themes)' },
];

/** Total static output budget in KB (excludes font files, which are loaded on demand) */
export const TOTAL_BUDGET_KB = 2048; // 2 MB total (JS + CSS only)

/**
 * Per-route first-load budget, in gzipped KB (JS + CSS).
 *
 * Measured 2026-10-08 on the committed master build: heaviest route
 * `/blog/[slug]` 248 KB gz, next `/` at 217 KB gz, median 181 KB gz.
 * The cap sits ~15% above the heaviest route so normal content growth does not
 * page anyone, while a stray dependency (a date library, an icon set imported
 * wholesale) trips it. Raise it deliberately and record why.
 */
export const ROUTE_BUDGET_KB = 285;

/**
 * Routes exempt from the per-route gate.
 *
 * `/_global-error` renders without any app layout or route CSS; it is not a
 * page a visitor navigates to and its number is not comparable.
 */
export const ROUTE_BUDGET_EXEMPT = new Set(['/_global-error/page']);

const STATIC_DIR = join(process.cwd(), '.next', 'static');

/** A single static asset: path relative to `.next/static` + size in KB. */
export interface StaticAsset {
  name: string;
  kb: number;
}

export interface BudgetResult {
  passed: boolean;
  violations: string[];
  totalKB: number;
  byPrefix: Map<string, { files: StaticAsset[]; maxKB: number; desc: string }>;
}

export function formatKB(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
}

function walkDir(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return walkDir(fullPath);
    return [fullPath];
  });
}

function getRelativePath(fullPath: string): string {
  const staticIdx =
    fullPath.indexOf('.next' + '\\static') !== -1
      ? fullPath.indexOf('.next' + '\\static')
      : fullPath.indexOf('.next/static');
  return fullPath.slice(staticIdx).replace(/\\/g, '/');
}

/** True for font assets, which next/font subsets and loads on demand. */
export function isFontAsset(relPath: string): boolean {
  return (
    relPath.includes('/media/') || relPath.endsWith('.woff2') || relPath.endsWith('.woff')
  );
}

/**
 * Pure budget evaluation over an already-collected asset list.
 * Fonts are excluded from the total (subsetted + on-demand).
 * No filesystem access, so CI/unit tests can assert the gate directly.
 */
export function evaluateBudgets(
  assets: StaticAsset[],
  budgets: BudgetConfig[] = BUDGETS,
  totalBudgetKB: number = TOTAL_BUDGET_KB,
): BudgetResult {
  const violations: string[] = [];
  const byPrefix = new Map<
    string,
    { files: StaticAsset[]; maxKB: number; desc: string }
  >();

  for (const budget of budgets) {
    byPrefix.set(budget.prefix, {
      files: [],
      maxKB: budget.maxSingleKB,
      desc: budget.description,
    });
  }

  let totalKB = 0;
  for (const asset of assets) {
    if (!isFontAsset(asset.name)) {
      totalKB += asset.kb;
    }
    for (const budget of budgets) {
      if (asset.name.includes(budget.prefix)) {
        byPrefix.get(budget.prefix)!.files.push(asset);
      }
    }
  }

  for (const [, data] of byPrefix) {
    for (const f of data.files) {
      if (f.kb > data.maxKB) {
        violations.push(
          `[BUDGET EXCEEDED] ${f.name}: ${formatKB(f.kb)} > ${formatKB(data.maxKB)} (${data.desc})`,
        );
      }
    }
  }

  if (totalKB > totalBudgetKB) {
    violations.push(
      `[TOTAL EXCEEDED] Static output: ${formatKB(totalKB)} > ${formatKB(totalBudgetKB)}`,
    );
  }

  return { passed: violations.length === 0, violations, totalKB, byPrefix };
}

/** Collect assets from `.next/static` on disk (CLI-only path). */
export function collectStaticAssets(staticDir: string = STATIC_DIR): StaticAsset[] {
  return walkDir(staticDir).map((file) => ({
    name: getRelativePath(file),
    kb: statSync(file).size / 1024,
  }));
}

/** One route's first-load assets, as gzipped KB. */
export interface RouteAssets {
  /** Human-facing route path from app-path-routes-manifest, e.g. `/blog/[slug]`. */
  routePath: string;
  /** Next's internal manifest key, e.g. `/blog/[slug]/page`. */
  manifestKey: string;
  /** Gzipped KB the browser downloads for this route (JS + CSS). */
  kb: number;
}

export interface RouteBudgetResult {
  passed: boolean;
  violations: string[];
}

/**
 * Pure per-route budget evaluation. Takes already-measured route sizes so the
 * gate can be asserted without a build.
 */
export function evaluateRouteBudgets(
  routes: RouteAssets[],
  budgetKB: number = ROUTE_BUDGET_KB,
  exempt: Set<string> = ROUTE_BUDGET_EXEMPT,
): RouteBudgetResult {
  const violations: string[] = [];
  for (const route of routes) {
    if (exempt.has(route.manifestKey)) continue;
    if (route.kb > budgetKB) {
      violations.push(
        `[ROUTE EXCEEDED] ${route.routePath}: ${formatKB(route.kb)} gz > ${formatKB(budgetKB)} (first-load JS+CSS)`,
      );
    }
  }
  return { passed: violations.length === 0, violations };
}

/**
 * Parse a `page_client-reference-manifest.js`.
 *
 * The file is JavaScript, not JSON:
 *   globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};
 *   globalThis.__RSC_MANIFEST["/route/page"] = {...};
 * so slice out the key and the object literal rather than evaluating it.
 */
export function parseClientReferenceManifest(source: string): {
  manifestKey: string;
  manifest: {
    entryJSFiles?: Record<string, string[]>;
    entryCSSFiles?: Record<string, Array<{ path: string }>>;
  };
} | null {
  const match = /__RSC_MANIFEST\["([^"]+)"\]\s*=\s*/.exec(source);
  if (!match) return null;
  const assignEnd = match.index + match[0].length;
  const start = source.indexOf('{', assignEnd);
  const end = source.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  return {
    manifestKey: match[1],
    manifest: JSON.parse(source.slice(start, end + 1)),
  };
}

/**
 * Gzipped KB of a set of `.next/static`-relative paths, skipping any that are
 * not on disk. Next emits entries for modules that may not produce a file
 * (e.g. an empty CSS entry), so missing files are expected, not an error.
 */
function gzipKbFor(relPaths: Iterable<string>, staticDir: string): number {
  let bytes = 0;
  for (const rel of relPaths) {
    const file = join(staticDir, rel.replace(/^\/?static\//, ''));
    if (!existsSync(file)) continue;
    bytes += gzipSync(readFileSync(file)).length;
  }
  return bytes / 1024;
}

/**
 * Per-route first-load JS+CSS (gzipped) from the build on disk.
 *
 * Route → file mapping comes from Next's own per-route client-reference
 * manifest, which is what the server uses to emit `<script>`/`<link>` tags.
 * Verified 2026-10-08 against a served production page: the union computed here
 * matched the HTML's asset list exactly (14 JS + 5 CSS for `/blog/[slug]`).
 */
export function collectRouteAssets(
  nextDir: string = join(process.cwd(), '.next'),
): RouteAssets[] {
  const staticDir = join(nextDir, 'static');
  const serverAppDir = join(nextDir, 'server', 'app');
  if (!existsSync(serverAppDir)) return [];

  // Framework chunks every route loads. polyfillFiles is the legacy-browser
  // bundle; it is in the served HTML (checked 2026-10-08) so it counts.
  let sharedFiles: string[] = [];
  const buildManifestPath = join(nextDir, 'build-manifest.json');
  if (existsSync(buildManifestPath)) {
    const buildManifest = JSON.parse(readFileSync(buildManifestPath, 'utf8')) as {
      rootMainFiles?: string[];
      polyfillFiles?: string[];
    };
    sharedFiles = [
      ...(buildManifest.rootMainFiles ?? []),
      ...(buildManifest.polyfillFiles ?? []),
    ];
  }

  let manifestKeyToRoute: Record<string, string> = {};
  const appRoutesPath = join(nextDir, 'app-path-routes-manifest.json');
  if (existsSync(appRoutesPath)) {
    manifestKeyToRoute = JSON.parse(readFileSync(appRoutesPath, 'utf8')) as Record<
      string,
      string
    >;
  }

  const routes: RouteAssets[] = [];
  for (const manifestPath of walkDir(serverAppDir)) {
    if (!manifestPath.endsWith('page_client-reference-manifest.js')) continue;
    const parsed = parseClientReferenceManifest(readFileSync(manifestPath, 'utf8'));
    if (!parsed) continue;

    const files = new Set(sharedFiles);
    for (const list of Object.values(parsed.manifest.entryJSFiles ?? {})) {
      for (const file of list) files.add(file);
    }
    for (const list of Object.values(parsed.manifest.entryCSSFiles ?? {})) {
      for (const entry of list) files.add(entry.path);
    }

    routes.push({
      routePath: manifestKeyToRoute[parsed.manifestKey] ?? parsed.manifestKey,
      manifestKey: parsed.manifestKey,
      kb: gzipKbFor(files, staticDir),
    });
  }

  return routes.sort((a, b) => b.kb - a.kb);
}

function printReport(result: BudgetResult, totalBudgetKB: number): void {
  console.log('\n📦 Bundle Budget Report');
  console.log('─'.repeat(60));
  for (const [, data] of result.byPrefix) {
    const prefixTotal = data.files.reduce((sum, f) => sum + f.kb, 0);
    const largest = [...data.files].sort((a, b) => b.kb - a.kb)[0];
    if (largest) {
      const status = largest.kb > data.maxKB ? '❌' : '✅';
      console.log(
        `${status} ${data.desc}: ${formatKB(prefixTotal)} (largest: ${formatKB(largest.kb)})`,
      );
    }
  }
  console.log('─'.repeat(60));
  console.log(
    `Total static output: ${formatKB(result.totalKB)} / ${formatKB(totalBudgetKB)}`,
  );
  console.log('─'.repeat(60));
}

function printRouteReport(routes: RouteAssets[], budgetKB: number): void {
  console.log('📦 Per-route first load (gzipped JS+CSS)');
  console.log('─'.repeat(60));
  const top = routes.slice(0, 5);
  for (const route of top) {
    const status = route.kb > budgetKB ? '❌' : '✅';
    console.log(
      `${status} ${route.routePath.padEnd(30)} ${formatKB(route.kb).padStart(10)} / ${formatKB(budgetKB)}`,
    );
  }
  if (routes.length > top.length) {
    console.log(`   … ${routes.length - top.length} more routes under budget`);
  }
  console.log('─'.repeat(60));
}

/** Both gates' output plus the per-route table, printed as one report. */
function printAll(
  result: BudgetResult,
  routeResult: RouteBudgetResult,
  routes: RouteAssets[],
): void {
  printReport(result, TOTAL_BUDGET_KB);
  printRouteReport(routes, ROUTE_BUDGET_KB);

  const violations = [...result.violations, ...routeResult.violations];
  if (violations.length === 0) {
    console.log('✅ All bundle budgets within limits.\n');
    return;
  }
  console.log(`❌ ${violations.length} budget violation(s):\n`);
  for (const v of violations) console.log(`  ${v}`);
  console.log('');
  process.exitCode = 1;
}

function main(): void {
  const assets = collectStaticAssets();
  const routes = collectRouteAssets();
  if (assets.length === 0 || routes.length === 0) {
    console.error(
      'WARNING: no .next/static assets or route manifests found — did the build run?',
    );
    process.exitCode = 1;
    return;
  }

  printAll(evaluateBudgets(assets), evaluateRouteBudgets(routes), routes);
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main();
}
