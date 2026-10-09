// Type stubs for the Cloudflare Workers runtime. This file provides the
// ambient types (ScheduledController, ExecutionContext) so that
// `tsc --noEmit` passes without installing @cloudflare/workers-types
// as a dependency — the Worker is deployed separately via `wrangler deploy`.
//
// `fetch`, `console`, `RequestInit`, `Response` etc. come from the `dom`
// lib in tsconfig.json, which Workers' runtime also provides.

interface ScheduledController {
  scheduledTime: number;
  noRetry(): void;
}

interface ExecutionContext {
  passThroughCapacity: number;
  waitUntil(promise: Promise<unknown>): void;
  props: Record<string, unknown>;
}
