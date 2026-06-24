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
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface BudgetConfig {
  /** Glob-like prefix to match files in .next/static */
  prefix: string;
  /** Max size in KB for a single file matching this prefix */
  maxSingleKB: number;
  description: string;
}

/** Budget thresholds — adjust as the project grows */
const BUDGETS: BudgetConfig[] = [
  { prefix: 'chunks/', maxSingleKB: 300, description: 'JS chunks (per file)' },
  { prefix: 'css', maxSingleKB: 300, description: 'CSS bundles (incl. Shiki themes)' },
];

/** Total static output budget in KB (excludes font files, which are loaded on demand) */
const TOTAL_BUDGET_KB = 2048; // 2 MB total (JS + CSS only)

const STATIC_DIR = join(process.cwd(), '.next', 'static');

function formatKB(kb: number): string {
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
  const staticIdx = fullPath.indexOf('.next' + '\\static') !== -1
    ? fullPath.indexOf('.next' + '\\static')
    : fullPath.indexOf('.next/static');
  return fullPath.slice(staticIdx).replace(/\\/g, '/');
}

function checkBudgets(): { passed: boolean; violations: string[] } {
  const files = walkDir(STATIC_DIR);
  const violations: string[] = [];

  if (files.length === 0) {
    violations.push('WARNING: No files found in .next/static — did build run?');
    return { passed: false, violations };
  }

  // Check individual file budgets
  let totalKB = 0;
  const byPrefix = new Map<string, { files: { name: string; kb: number }[]; maxKB: number; desc: string }>();

  for (const prefix of BUDGETS) {
    byPrefix.set(prefix.prefix, { files: [], maxKB: prefix.maxSingleKB, desc: prefix.description });
  }

  for (const file of files) {
    const relPath = getRelativePath(file);
    const sizeBytes = statSync(file).size;
    const sizeKB = sizeBytes / 1024;

    // Skip font files — they're subsetted by next/font and loaded on demand
    const isFont = relPath.includes('/media/') || relPath.endsWith('.woff2') || relPath.endsWith('.woff');
    if (!isFont) {
      totalKB += sizeKB;
    }

    for (const budget of BUDGETS) {
      if (relPath.includes(budget.prefix)) {
        byPrefix.get(budget.prefix)!.files.push({ name: relPath, kb: sizeKB });
      }
    }
  }

  // Report per-prefix violations
  for (const [prefix, data] of byPrefix) {
    for (const f of data.files) {
      if (f.kb > data.maxKB) {
        violations.push(
          `[BUDGET EXCEEDED] ${f.name}: ${formatKB(f.kb)} > ${formatKB(data.maxKB)} (${data.desc})`
        );
      }
    }
  }

  // Check total budget
  if (totalKB > TOTAL_BUDGET_KB) {
    violations.push(
      `[TOTAL EXCEEDED] Static output: ${formatKB(totalKB)} > ${formatKB(TOTAL_BUDGET_KB)}`
    );
  }

  // Print summary
  console.log('\n📦 Bundle Budget Report');
  console.log('─'.repeat(60));
  for (const [prefix, data] of byPrefix) {
    const prefixTotal = data.files.reduce((sum, f) => sum + f.kb, 0);
    const largest = data.files.sort((a, b) => b.kb - a.kb)[0];
    if (largest) {
      const status = largest.kb > data.maxKB ? '❌' : '✅';
      console.log(`${status} ${data.desc}: ${formatKB(prefixTotal)} (largest: ${formatKB(largest.kb)})`);
    }
  }
  console.log('─'.repeat(60));
  console.log(`Total static output: ${formatKB(totalKB)} / ${formatKB(TOTAL_BUDGET_KB)}`);
  console.log('─'.repeat(60));

  if (violations.length === 0) {
    console.log('✅ All bundle budgets within limits.\n');
  } else {
    console.log(`❌ ${violations.length} budget violation(s):\n`);
    for (const v of violations) console.log(`  ${v}`);
    console.log('');
  }

  return { passed: violations.length === 0, violations };
}

const result = checkBudgets();
process.exit(result.passed ? 0 : 1);
