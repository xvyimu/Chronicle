/**
 * SRI smoke checks for Chronicle (Dual-B / ops).
 *
 * Offline (default):
 *   1) next.config.ts gates experimental.sri behind ENABLE_SRI === '1'
 *   2) algorithm pin is sha384 when enabled
 *   3) if .next HTML artifacts exist, report integrity= presence (non-fatal unless --require-build)
 *
 * Live (optional, network):
 *   pnpm check:sri-smoke -- --live
 *   pnpm check:sri-smoke -- --live --base-url=https://incca.ccwu.cc
 *
 * Exit codes:
 *   0 — all selected checks passed
 *   1 — gate / config / live integrity failure
 *
 * Does NOT flip production ENABLE_SRI. Does NOT run a full next build by default.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_BASE = 'https://incca.ccwu.cc';

/** @typedef {{ ok: boolean, name: string, detail: string }} CheckResult */

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  let live = false;
  let requireBuild = false;
  let json = false;
  let baseUrl = DEFAULT_BASE;
  for (const arg of argv) {
    if (arg === '--live') live = true;
    else if (arg === '--require-build') requireBuild = true;
    else if (arg === '--json') json = true;
    else if (arg.startsWith('--base-url=')) baseUrl = arg.slice('--base-url='.length);
  }
  return { live, requireBuild, json, baseUrl };
}

/**
 * @param {string} dir
 * @param {(name: string) => boolean} pred
 * @param {string[]} out
 * @param {number} max
 */
function walkFiles(dir, pred, out, max) {
  if (out.length >= max || !existsSync(dir)) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (out.length >= max) return;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'cache') continue;
      walkFiles(full, pred, out, max);
    } else if (ent.isFile() && pred(ent.name)) {
      out.push(full);
    }
  }
}

/**
 * @returns {CheckResult}
 */
function checkNextConfigGate() {
  const configPath = path.join(rootDir, 'next.config.ts');
  if (!existsSync(configPath)) {
    return { ok: false, name: 'next-config-exists', detail: 'next.config.ts missing' };
  }
  const src = readFileSync(configPath, 'utf8');

  const hasEnableGate =
    /process\.env\.ENABLE_SRI\s*===\s*['"]1['"]/.test(src) ||
    /ENABLE_SRI\s*===\s*['"]1['"]/.test(src);
  if (!hasEnableGate) {
    return {
      ok: false,
      name: 'enable-sri-gate',
      detail: 'ENABLE_SRI === "1" gate not found in next.config.ts',
    };
  }

  const hasSha384 = /algorithm:\s*['"]sha384['"]/.test(src);
  if (!hasSha384) {
    return {
      ok: false,
      name: 'sri-algorithm',
      detail: 'expected experimental SRI algorithm sha384 when ENABLE_SRI is set',
    };
  }

  // SRI should be spread into experimental, not always-on object without gate.
  const alwaysOn =
    /experimental\s*:\s*\{[^}]*sri\s*:\s*\{[^}]*algorithm/s.test(src) &&
    !/ENABLE_SRI/.test(src);
  if (alwaysOn) {
    return {
      ok: false,
      name: 'sri-always-on',
      detail: 'experimental.sri appears unconditional; must stay behind ENABLE_SRI',
    };
  }

  const spreadsExperiment = /(?:\.\.\.sriExperiment|sriExperiment)/.test(src);
  if (!spreadsExperiment) {
    return {
      ok: false,
      name: 'sri-spread',
      detail: 'sriExperiment (or equivalent) not referenced in next.config.ts',
    };
  }

  return {
    ok: true,
    name: 'next-config-sri-gate',
    detail: 'ENABLE_SRI=1 gate + sha384 + sriExperiment present',
  };
}

/**
 * @param {boolean} requireBuild
 * @returns {CheckResult}
 */
function checkLocalBuildArtifacts(requireBuild) {
  const nextDir = path.join(rootDir, '.next');
  if (!existsSync(nextDir)) {
    if (requireBuild) {
      return {
        ok: false,
        name: 'local-build-artifacts',
        detail: '.next missing; run production-shaped build with ENABLE_SRI=1 first',
      };
    }
    return {
      ok: true,
      name: 'local-build-artifacts',
      detail: 'skip (no .next); offline gate-only mode',
    };
  }

  /** @type {string[]} */
  const htmlFiles = [];
  walkFiles(nextDir, (n) => n.endsWith('.html'), htmlFiles, 80);

  let integrityHits = 0;
  let filesWithIntegrity = 0;
  const sample = [];
  for (const file of htmlFiles) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const matches = text.match(/integrity="sha384-[A-Za-z0-9+/=]+"/g) || [];
    if (matches.length > 0) {
      filesWithIntegrity += 1;
      integrityHits += matches.length;
      if (sample.length < 3) {
        sample.push(`${path.relative(rootDir, file)}×${matches.length}`);
      }
    }
  }

  const envOn = process.env.ENABLE_SRI === '1';
  if (requireBuild && envOn && integrityHits === 0) {
    return {
      ok: false,
      name: 'local-build-artifacts',
      detail: `ENABLE_SRI=1 and --require-build but 0 integrity attrs in ${htmlFiles.length} html under .next`,
    };
  }

  if (requireBuild && !envOn && integrityHits > 0) {
    return {
      ok: false,
      name: 'local-build-artifacts',
      detail: `ENABLE_SRI unset but found ${integrityHits} integrity attrs (unexpected for off build)`,
    };
  }

  return {
    ok: true,
    name: 'local-build-artifacts',
    detail:
      htmlFiles.length === 0
        ? '.next present but no html scanned'
        : `html=${htmlFiles.length} integrityHits=${integrityHits} filesWithIntegrity=${filesWithIntegrity}` +
          (sample.length ? ` sample=${sample.join(',')}` : '') +
          (envOn ? ' (ENABLE_SRI=1)' : ' (ENABLE_SRI off/unset)'),
  };
}

/**
 * @param {string} baseUrl
 * @returns {Promise<CheckResult>}
 */
async function checkLiveHomepage(baseUrl) {
  let url;
  try {
    url = new URL('/', baseUrl).toString();
  } catch {
    return { ok: false, name: 'live-homepage', detail: `invalid base url: ${baseUrl}` };
  }

  let res;
  try {
    res = await fetch(url, {
      headers: { Accept: 'text/html', 'User-Agent': 'chronicle-sri-smoke/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, name: 'live-homepage', detail: `fetch failed: ${msg}` };
  }

  if (!res.ok) {
    return {
      ok: false,
      name: 'live-homepage',
      detail: `HTTP ${res.status} for ${url}`,
    };
  }

  const html = await res.text();
  const staticScriptTags =
    html.match(/<script[^>]+src="[^"]*\/_next\/static\/[^"]+"[^>]*>/gi) || [];
  const integrityAttrs = html.match(/integrity="sha384-[A-Za-z0-9+/=]+"/g) || [];
  const staticWithIntegrity =
    html.match(
      /<script[^>]+src="[^"]*\/_next\/static\/[^"]+"[^>]*integrity="sha384-[A-Za-z0-9+/=]+"/gi,
    ) ||
    html.match(
      /<script[^>]+integrity="sha384-[A-Za-z0-9+/=]+"[^>]*src="[^"]*\/_next\/static\/[^"]+"/gi,
    ) ||
    [];

  // Production is documented as ENABLE_SRI=1; require at least one static integrity.
  if (integrityAttrs.length === 0) {
    return {
      ok: false,
      name: 'live-homepage',
      detail: `${url}: 0 integrity=sha384 attrs (staticScripts≈${staticScriptTags.length})`,
    };
  }

  return {
    ok: true,
    name: 'live-homepage',
    detail: `${url}: integrityAttrs=${integrityAttrs.length} staticScripts≈${staticScriptTags.length} staticWithIntegrity≈${staticWithIntegrity.length}`,
  };
}

/**
 * @param {string} baseUrl
 * @returns {Promise<CheckResult>}
 */
async function checkLiveCspHint(baseUrl) {
  let url;
  try {
    url = new URL('/', baseUrl).toString();
  } catch {
    return { ok: false, name: 'live-csp-hint', detail: `invalid base url: ${baseUrl}` };
  }

  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/html', 'User-Agent': 'chronicle-sri-smoke/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, name: 'live-csp-hint', detail: `fetch failed: ${msg}` };
  }

  const csp =
    res.headers.get('content-security-policy') ||
    res.headers.get('Content-Security-Policy') ||
    '';
  if (!csp) {
    // HTML may still set CSP via meta; treat missing header as soft pass with note.
    return {
      ok: true,
      name: 'live-csp-hint',
      detail: 'no CSP response header (may be document-only); not failing SRI smoke',
    };
  }

  const hasNonce = /nonce-/.test(csp) || /'nonce-/.test(csp);
  const hasStrictDynamic = /strict-dynamic/.test(csp);
  if (!hasNonce && !hasStrictDynamic) {
    return {
      ok: false,
      name: 'live-csp-hint',
      detail: 'CSP header present but missing nonce/strict-dynamic markers',
    };
  }

  return {
    ok: true,
    name: 'live-csp-hint',
    detail: `CSP header ok (nonce=${hasNonce} strict-dynamic=${hasStrictDynamic})`,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  /** @type {CheckResult[]} */
  const results = [];

  results.push(checkNextConfigGate());
  results.push(checkLocalBuildArtifacts(args.requireBuild));

  if (args.live) {
    results.push(await checkLiveHomepage(args.baseUrl));
    results.push(await checkLiveCspHint(args.baseUrl));
  }

  const failed = results.filter((r) => !r.ok);
  const payload = {
    ok: failed.length === 0,
    mode: args.live ? 'offline+live' : 'offline',
    baseUrl: args.live ? args.baseUrl : null,
    results,
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log('Chronicle SRI smoke');
    console.log(`mode: ${payload.mode}`);
    for (const r of results) {
      console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}: ${r.detail}`);
    }
    console.log(failed.length === 0 ? 'SRI_SMOKE_EXIT=0' : 'SRI_SMOKE_EXIT=1');
  }

  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
