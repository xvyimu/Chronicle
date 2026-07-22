/**
 * Local SRI presence checker (Dual-B Codex absorb · wave7).
 *
 * Scopes markup to script[src] and link[rel~=stylesheet][href] whose URL path
 * is under /_next/static/. Does NOT require every Next static tag to be SRI-
 * eligible (on builds legitimately mix protected + unprotected tags).
 *
 * Usage:
 *   node scripts/check-sri.mjs --file path/to.html --expect on|off
 *   node scripts/check-sri.mjs --url http://127.0.0.1:3000/ --expect on
 *   pnpm check:sri -- --file .next/server/pages/500.html --expect on
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const SHA384_RE = /sha384-[A-Za-z0-9+/=]+/;

function parseArgs(argv) {
  const args = { file: null, url: null, expect: null, json: false };
  const a = [...argv];
  // pnpm may forward a leading "--"
  if (a[0] === '--') a.shift();
  for (let i = 0; i < a.length; i++) {
    const t = a[i];
    if (t === '--file') args.file = a[++i];
    else if (t === '--url') args.url = a[++i];
    else if (t === '--expect') args.expect = a[++i];
    else if (t === '--json') args.json = true;
    else if (t === '--help' || t === '-h') args.help = true;
  }
  return args;
}

function isNextStaticUrl(raw) {
  if (!raw) return false;
  try {
    // absolute or root-relative
    if (raw.startsWith('/_next/static/')) return true;
    if (raw.includes('/_next/static/')) {
      const u = raw.startsWith('http') ? new URL(raw) : null;
      if (u) return u.pathname.startsWith('/_next/static/');
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Minimal HTML attribute scrape (no full DOM). Good enough for Next-emitted tags.
 * @returns {{ tag: string, src?: string, href?: string, integrity?: string, rel?: string }[]}
 */
export function extractCandidateTags(html) {
  const tags = [];
  const re = /<(script|link)\b([^>]*?)(?:\/>|>)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const name = m[1].toLowerCase();
    const attrs = m[2];
    const get = (key) => {
      const am = new RegExp(
        `\\b${key}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`,
        'i',
      ).exec(attrs);
      if (!am) return undefined;
      return am[2] ?? am[3] ?? am[4];
    };
    const src = get('src');
    const href = get('href');
    const integrity = get('integrity');
    const rel = get('rel');
    if (name === 'script') {
      if (!src || !isNextStaticUrl(src)) continue;
      tags.push({ tag: 'script', src, integrity });
    } else if (name === 'link') {
      if (!href || !isNextStaticUrl(href)) continue;
      if (!rel || !/\bstylesheet\b/i.test(rel)) continue;
      tags.push({ tag: 'link', href, rel, integrity });
    }
  }
  return tags;
}

export function analyze(html, expect) {
  const tags = extractCandidateTags(html);
  const withIntegrity = tags.filter((t) => t.integrity && SHA384_RE.test(t.integrity));
  const without = tags.filter((t) => !t.integrity || !SHA384_RE.test(t.integrity));
  let ok = true;
  let reason = 'ok';
  if (expect === 'on') {
    if (withIntegrity.length === 0) {
      ok = false;
      reason =
        'expect on but no sha384 integrity on /_next/static/ script|stylesheet tags';
    }
  } else if (expect === 'off') {
    if (withIntegrity.length > 0) {
      ok = false;
      reason = `expect off but found ${withIntegrity.length} integrity attribute(s)`;
    }
  } else {
    ok = false;
    reason = 'expect must be on|off';
  }
  return {
    ok,
    reason,
    expect,
    protected: withIntegrity.length,
    unprotected: without.length,
    total: tags.length,
  };
}

async function loadHtml(args) {
  if (args.file) {
    const p = path.resolve(args.file);
    return fs.readFileSync(p, 'utf8');
  }
  if (args.url) {
    const res = await fetch(args.url);
    if (!res.ok) throw new Error(`fetch ${args.url} -> ${res.status}`);
    return await res.text();
  }
  throw new Error('provide --file or --url');
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help || (!args.file && !args.url)) {
    console.log(`Usage: node scripts/check-sri.mjs --file <html> --expect on|off
       node scripts/check-sri.mjs --url <url> --expect on|off
       pnpm check:sri -- --file .next/... --expect on`);
    process.exit(args.help ? 0 : 2);
  }
  if (args.expect !== 'on' && args.expect !== 'off') {
    console.error('error: --expect on|off required');
    process.exit(2);
  }
  const html = await loadHtml(args);
  const result = analyze(html, args.expect);
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `SRI check expect=${result.expect} total=${result.total} protected=${result.protected} unprotected=${result.unprotected}`,
    );
    console.log(result.ok ? 'PASS' : `FAIL: ${result.reason}`);
  }
  process.exit(result.ok ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
