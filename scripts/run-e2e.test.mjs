import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { preflightServer, waitForServer } from './run-e2e.mjs';

const BASE_URL = 'http://127.0.0.1:3999';

test('rejects a responding managed URL before spawning a server', async () => {
  await assert.rejects(
    preflightServer({
      baseUrl: BASE_URL,
      useExternalServer: false,
      fetchImpl: async () => new Response(null, { status: 404 }),
    }),
    /managed E2E port already in use/u,
  );
});

test('allows managed startup when the URL is absent', async () => {
  await preflightServer({
    baseUrl: BASE_URL,
    useExternalServer: false,
    fetchImpl: async () => {
      throw new Error('ECONNREFUSED');
    },
  });
});

test('rejects promptly when the managed child exits before readiness', async () => {
  const child = new EventEmitter();
  queueMicrotask(() => child.emit('exit', 7, null));

  await assert.rejects(
    waitForServer({
      baseUrl: BASE_URL,
      child,
      fetchImpl: async (_url, init) => {
        await new Promise((resolve, reject) => {
          init.signal.addEventListener('abort', resolve, { once: true });
          setTimeout(reject, 500, new Error('fixture fetch outlived child'));
        });
        throw new Error('aborted');
      },
      timeoutMs: 1_000,
      requestTimeoutMs: 500,
      pollIntervalMs: 1,
    }),
    /exited before readiness.*code 7/u,
  );
});

test('resolves after a successful readiness response', async () => {
  await waitForServer({
    baseUrl: BASE_URL,
    fetchImpl: async () => new Response(null, { status: 200 }),
    timeoutMs: 100,
    requestTimeoutMs: 50,
    pollIntervalMs: 1,
  });
});

test('allows a responding URL in explicit external-server mode', async () => {
  await preflightServer({
    baseUrl: BASE_URL,
    useExternalServer: true,
    fetchImpl: async () => new Response(null, { status: 200 }),
  });
});
