// Key-value store, backed by the project's own Postgres.
//
// Was a Vercel KV (Upstash) REST client reading KV_REST_API_URL + KV_REST_API_TOKEN.
// Replaced during the Railway migration: those credentials point at a store provisioned
// through Vercel, so carrying them across would have left the Railway deployment
// depending on the account we are closing - the migration would look finished while a
// delete of the Vercel project silently killed /api/state and the admin config.
//
// The callers never wanted Upstash specifically. They wanted a durable key-value store
// with optional TTL, and Postgres is already connected here (same connection string
// api/ssoc.js, api/ssic.js and api/anatomy.js use). So this backs onto a single table
// and introduces NO new environment variable and no new service.
//
// The exported contract is unchanged - kvAvailable(), kvGet(key),
// kvSetJson(key, value, ttlSeconds) with the same return shapes, including the
// { ok: false, reason: "not_configured" } posture when no database is configured. All
// eleven call sites across api/state.js, api/claude.js, api/admin/config.js and
// api/esco.js are untouched.

import pg from 'pg';

// Resolved locally, never written back to process.env: server.js runs every api/*.js
// handler in one shared process, so mutating process.env here would leak into the other
// handlers' own fallback resolution. Same chain and same ordering as api/anatomy.js.
const POSTGRES_URL = process.env.POSTGRES_URL
  || process.env.DATABASE_URL
  || process.env.POSTGRES_PRISMA_URL
  || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL_UNPOOLED
  || "";

const TABLE = 'kv_store';
const CONNECT_TIMEOUT_MS = 5000;

// Cheap guard so a cold database does not hang a request past the caller's own budget
// (api/state.js declares maxDuration 10).
function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), CONNECT_TIMEOUT_MS)),
  ]);
}

export function kvAvailable() {
  return Boolean(POSTGRES_URL);
}

let ensured = false;

async function connect() {
  const client = new pg.Client({
    connectionString: POSTGRES_URL,
    ssl: /sslmode=require/i.test(POSTGRES_URL) ? { rejectUnauthorized: false } : undefined,
  });
  await withTimeout(client.connect(), 'kv connect');
  return client;
}

// Created on first use rather than by a migration step, matching how api/ssoc.js and
// api/anatomy.js bootstrap their own tables. `ensured` is per-process, so the CREATE runs
// at most once per container start and is a no-op thereafter.
async function ensureTable(client) {
  if (ensured) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      key        text PRIMARY KEY,
      value      jsonb NOT NULL,
      expires_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  // Lets the lazy-expiry delete below use an index rather than a sequential scan once the
  // ESCO skills cache (30-day TTL) has grown.
  await client.query(`CREATE INDEX IF NOT EXISTS ${TABLE}_expires_at_idx ON ${TABLE} (expires_at)`);
  ensured = true;
}

/**
 * Read one key. Returns { ok: true, value } with value === null for a miss or an expired
 * row, matching what the Upstash client returned when Redis had no key.
 */
export async function kvGet(key) {
  if (!kvAvailable()) return { ok: false, reason: "not_configured" };
  let client;
  try {
    client = await connect();
    await ensureTable(client);
    const { rows } = await client.query(
      `SELECT value, expires_at FROM ${TABLE} WHERE key = $1`,
      [String(key)]
    );
    if (!rows.length) return { ok: true, value: null };

    // Lazy expiry: Postgres has no TTL of its own, so an expired row is treated as absent
    // and deleted on the way past. A key that is never read again lingers as a dead row -
    // harmless, and cheap to sweep later if it ever matters.
    const expiresAt = rows[0].expires_at;
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      await client.query(`DELETE FROM ${TABLE} WHERE key = $1`, [String(key)]);
      return { ok: true, value: null };
    }
    // jsonb comes back already parsed by `pg`, so there is no JSON.parse step here - the
    // REST client needed one because Upstash returned a string.
    return { ok: true, value: rows[0].value };
  } catch (err) {
    return { ok: false, reason: "database", error: err?.message || String(err) };
  } finally {
    if (client) { try { await client.end(); } catch (_) {} }
  }
}

/**
 * Write one key as JSON, optionally expiring after ttlSeconds. Last write wins, matching
 * the previous SET semantics (api/state.js documents no server-side merge).
 */
export async function kvSetJson(key, value, ttlSeconds) {
  if (!kvAvailable()) return { ok: false, reason: "not_configured" };
  let client;
  try {
    client = await connect();
    await ensureTable(client);
    const expiresAt = Number.isFinite(ttlSeconds) && ttlSeconds > 0
      ? new Date(Date.now() + Math.floor(ttlSeconds) * 1000).toISOString()
      : null;
    await client.query(
      `INSERT INTO ${TABLE} (key, value, expires_at, updated_at)
       VALUES ($1, $2::jsonb, $3, now())
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             expires_at = EXCLUDED.expires_at,
             updated_at = now()`,
      [String(key), JSON.stringify(value), expiresAt]
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "database", error: err?.message || String(err) };
  } finally {
    if (client) { try { await client.end(); } catch (_) {} }
  }
}
