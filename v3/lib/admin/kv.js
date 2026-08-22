// Key-value store, backed by the Railway Redis plugin.
//
// Was a Vercel KV (Upstash) REST client reading KV_REST_API_URL + KV_REST_API_TOKEN.
// Replaced during the Railway migration: those credentials do not exist in the Vercel
// project any more, so that store was already gone and every KV-backed feature was
// degrading in production. Railway's own Redis plugin restores the capability inside the
// project we are migrating to, with no dependency on the Vercel account being closed.
//
// The exported contract is unchanged - kvAvailable(), kvGet(key),
// kvSetJson(key, value, ttlSeconds) with the same return shapes, including the
// { ok: false, reason: "not_configured" } posture when Redis is not configured. All
// eleven call sites across api/state.js, api/claude.js, api/admin/config.js and
// api/esco.js are untouched.

import { createClient } from 'redis';

// Railway injects these when the Redis plugin is attached to the service. REDIS_URL is
// the public endpoint; REDIS_PRIVATE_URL stays on Railway's private network - preferred,
// because it avoids egress and is not reachable from outside the project.
//
// Resolved into a local const, never written back to process.env: server.js runs every
// api/*.js handler in one shared process, so mutating process.env here would leak into
// other handlers' own fallback resolution.
const REDIS_URL = process.env.REDIS_PRIVATE_URL
  || process.env.REDIS_URL
  || "";

const CONNECT_TIMEOUT_MS = 5000;
// Every call is bounded, not just the connect. api/state.js declares maxDuration 10, so a
// Redis that accepts a socket and then stalls must not outlive the caller's own budget.
const OP_TIMEOUT_MS = 5000;

export function kvAvailable() {
  return Boolean(REDIS_URL);
}

function withTimeout(promise, label, ms = OP_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

// One client for the process, not one per request: server.js is a long-lived Express
// server, so a per-call connect/quit would pay a handshake on every read. node-redis
// reconnects on its own; the 'error' handler exists so a transient drop surfaces as a
// rejected command rather than an unhandled event that would take the process down.
let clientPromise = null;

function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: CONNECT_TIMEOUT_MS,
        // Without this, node-redis retries a dead endpoint forever with backoff and
        // connect() never settles - the caller hangs well past its own maxDuration
        // instead of degrading. Returning an Error stops the retry loop and rejects.
        reconnectStrategy: (retries) =>
          retries > 2 ? new Error('redis unreachable') : Math.min(retries * 200, 1000),
      },
    });
    client.on('error', (err) => {
      console.error('[kv] redis error:', err?.message || String(err));
    });
    await withTimeout(client.connect(), 'kv connect', CONNECT_TIMEOUT_MS);
    return client;
  })().catch((err) => {
    // Let the next call retry instead of caching a permanently rejected promise - a
    // database that was briefly unreachable at boot should not disable KV for the life
    // of the container.
    clientPromise = null;
    throw err;
  });
  return clientPromise;
}

/**
 * Read one key. Returns { ok: true, value } with value === null for a miss or an expired
 * key - Redis expires keys itself, so there is no lazy-expiry step here.
 */
export async function kvGet(key) {
  if (!kvAvailable()) return { ok: false, reason: "not_configured" };
  try {
    const client = await getClient();
    const raw = await withTimeout(client.get(String(key)), 'kv get');
    if (raw == null) return { ok: true, value: null };
    // Values are written as JSON below, but tolerate a plain string so a key set by hand
    // (redis-cli, an older writer) does not throw.
    try { return { ok: true, value: JSON.parse(raw) }; }
    catch (_) { return { ok: true, value: raw }; }
  } catch (err) {
    return { ok: false, reason: "redis", error: err?.message || String(err) };
  }
}

/**
 * Write one key as JSON, optionally expiring after ttlSeconds. Last write wins, matching
 * the previous SET semantics (api/state.js documents no server-side merge).
 */
export async function kvSetJson(key, value, ttlSeconds) {
  if (!kvAvailable()) return { ok: false, reason: "not_configured" };
  try {
    const client = await getClient();
    const opts = Number.isFinite(ttlSeconds) && ttlSeconds > 0
      ? { EX: Math.floor(ttlSeconds) }
      : undefined;
    await withTimeout(client.set(String(key), JSON.stringify(value), opts), 'kv set');
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "redis", error: err?.message || String(err) };
  }
}
