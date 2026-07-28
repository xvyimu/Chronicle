/**
 * Bundle Budget Checker
 *
 * Runs after `next build` to enforce bundle size limits.
 * Checks individual chunk files and total static output.
 *
 * Usage: tsx scripts/check-bundle-budget.ts
 *
 * Exit codes:
 *   0 — all budgets within limits
 *   1 — one or more budgets exceeded
 *
 * The size-evaluation logic is pure (`evaluateBudgets`) so CI can assert the
 * gate without a `.next` build; the filesystem walk is only used by the CLI
 * entry point.
 *
 * Related soft residuals (mobile LH not in CI · RUM p75 pending):
 *   docs/ops/ch-rum-ci-residual-board-2026-07-28.md
 * Lab/CWV budgets (desktop CI): lighthouse.config.js
 * Assertable unit surface: src/lib/check-bundle-budget-script.test.ts (CH-PERF-011)
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
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

  if (result.violations.length === 0) {
    console.log('✅ All bundle budgets within limits.\n');
  } else {
    console.log(`❌ ${result.violations.length} budget violation(s):\n`);
    for (const v of result.violations) console.log(`  ${v}`);
    console.log('');
  }
}

function main(): void {
  const assets = collectStaticAssets();
  if (assets.length === 0) {
    console.log('\n📦 Bundle Budget Report');
    console.log('─'.repeat(60));
    console.log('  WARNING: No files found in .next/static — did build run?');
    console.log('');
    process.exit(1);
  }

  const result = evaluateBudgets(assets);
  printReport(result, TOTAL_BUDGET_KB);
  process.exit(result.passed ? 0 : 1);
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main();
}
