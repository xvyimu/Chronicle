import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PORT = process.env.E2E_PORT ?? '3001';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const useExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const isCI = Boolean(process.env.CI);
const isWindows = process.platform === 'win32';
const forwardedArgs = process.argv.slice(2);
const requireFromHere = createRequire(import.meta.url);

function packageFile(packageName, filename) {
  return path.join(
    path.dirname(requireFromHere.resolve(`${packageName}/package.json`)),
    filename,
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithTimeout(baseUrl, fetchImpl, requestTimeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetchImpl(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function preflightServer({
  baseUrl,
  useExternalServer: external,
  fetchImpl = fetch,
  requestTimeoutMs = 2_000,
}) {
  if (external) return;

  try {
    await requestWithTimeout(baseUrl, fetchImpl, requestTimeoutMs);
  } catch {
    return;
  }

  throw new Error(
    `The managed E2E port already in use at ${baseUrl}. Stop that service or set E2E_PORT to a free port.`,
  );
}

export async function waitForServer({
  baseUrl = BASE_URL,
  child,
  fetchImpl = fetch,
  timeoutMs = 60_000,
  requestTimeoutMs = 2_000,
  pollIntervalMs = 500,
} = {}) {
  const started = Date.now();
  let lastError;
  let rejectChildFailure;
  const childFailure = new Promise((_, reject) => {
    rejectChildFailure = reject;
  });
  const onExit = (code, signal) => {
    const detail = code === null ? `signal ${signal ?? 'unknown'}` : `code ${code}`;
    rejectChildFailure(
      new Error(`Managed E2E server exited before readiness with ${detail}.`),
    );
  };
  const onError = (error) => {
    rejectChildFailure(
      new Error(`Managed E2E server failed before readiness: ${String(error)}`),
    );
  };

  child?.once('exit', onExit);
  child?.once('error', onError);

  try {
    while (Date.now() - started < timeoutMs) {
      try {
        const response = await Promise.race([
          requestWithTimeout(baseUrl, fetchImpl, requestTimeoutMs),
          childFailure,
        ]);
        if (response.ok) return;
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
        if (error instanceof Error && error.message.includes('before readiness')) {
          throw error;
        }
      }
      await Promise.race([delay(pollIntervalMs), childFailure]);
    }

    throw new Error(`Timed out waiting for ${baseUrl}. Last error: ${String(lastError)}`);
  } finally {
    child?.off('exit', onExit);
    child?.off('error', onError);
  }
}

function spawnManaged(command, args, env = process.env) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    detached: !isWindows,
  });
}

async function stopProcessTree(child) {
  if (!child.pid || child.exitCode !== null) return;

  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn(
        'C:\\Windows\\System32\\taskkill.exe',
        ['/pid', String(child.pid), '/t', '/f'],
        {
          stdio: 'ignore',
        },
      );
      killer.once('exit', () => resolve());
      killer.once('error', () => resolve());
    });
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // Process already exited.
    }
  }
}

async function main() {
  const nextBin = packageFile('next', path.join('dist', 'bin', 'next'));
  const playwrightCli = packageFile('playwright', 'cli.js');

  if (useExternalServer) {
    await preflightServer({ baseUrl: BASE_URL, useExternalServer: true });
    await waitForServer({ baseUrl: BASE_URL });
    const result = spawnSync(
      process.execPath,
      [playwrightCli, 'test', ...forwardedArgs],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PLAYWRIGHT_BASE_URL: BASE_URL,
          PLAYWRIGHT_SKIP_WEB_SERVER: '1',
        },
        stdio: 'inherit',
      },
    );
    if (result.error) throw result.error;
    process.exit(result.status ?? (result.signal ? 1 : 0));
  }

  await preflightServer({ baseUrl: BASE_URL, useExternalServer: false });

  const server = spawnManaged(process.execPath, [
    nextBin,
    isCI ? 'start' : 'dev',
    '--port',
    PORT,
  ]);

  const shutdown = async (exitCode) => {
    await stopProcessTree(server);
    process.exit(exitCode);
  };

  process.once('SIGINT', () => {
    void shutdown(130);
  });
  process.once('SIGTERM', () => {
    void shutdown(143);
  });

  let exitCode = 0;
  try {
    await waitForServer({ baseUrl: BASE_URL, child: server });
    const result = spawnSync(
      process.execPath,
      [playwrightCli, 'test', ...forwardedArgs],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PLAYWRIGHT_BASE_URL: BASE_URL,
          PLAYWRIGHT_SKIP_WEB_SERVER: '1',
        },
        stdio: 'inherit',
      },
    );
    if (result.error) throw result.error;
    exitCode = result.status ?? (result.signal ? 1 : 0);
  } finally {
    await stopProcessTree(server);
  }

  process.exit(exitCode);
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(path.resolve(entryPath)).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
