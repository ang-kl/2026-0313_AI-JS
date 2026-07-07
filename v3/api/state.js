// GET/PUT /api/state - cross-device persistence for user selections and review work.
// KV-1 (Human Lead, 07-07 '26): "all in memory isn't helpful".
//
// Identity, in order:
//   1. A valid admin session cookie (Telegram-verified owner) -> uid "tg:<id>" - the same
//      state follows the owner across devices.
//   2. An `x-device-key` header carrying a client-generated UUID -> uid "dev:<uuid>" -
//      per-device persistence for anonymous visitors (server-side localStorage, in effect).
// No cookie AND no valid device key -> 400. Writes are size-capped and scope-allowlisted;
// a scope is one JSON blob (last-write-wins - no merge semantics on the server).
//
// When KV is not configured the endpoint answers 200 { ok:false, kv:false } so the client
// quietly stays on its localStorage mirror - persistence degrades, never breaks.

import { verifySession, readCookie } from "../lib/admin/session.js";
import { kvAvailable, kvGet, kvSetJson } from "../lib/admin/kv.js";

export const config = {
  api: { bodyParser: true },
  maxDuration: 10,
};

const SCOPES = ["prefs", "queue", "review", "boards"];
const MAX_BYTES = 64 * 1024; // per scope - selections and decisions, not documents
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveUid(req) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) {
    const sess = verifySession(readCookie(req), secret);
    if (sess.ok) return "tg:" + sess.userId;
  }
  const dk = String(req.headers["x-device-key"] || "");
  if (UUID_RE.test(dk)) return "dev:" + dk.toLowerCase();
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD" });
  }
  if (!kvAvailable()) return res.status(200).json({ ok: false, kv: false, reason: "not_configured" });

  const uid = resolveUid(req);
  if (!uid) return res.status(400).json({ error: "No identity - device key or session required", code: "NO_ID" });

  const scope = String((req.method === "GET" ? req.query.scope : req.body && req.body.scope) || "");
  if (!SCOPES.includes(scope)) return res.status(400).json({ error: "Unknown scope", code: "SCOPE", allowed: SCOPES });

  const key = `v3:state:${uid}:${scope}`;

  if (req.method === "GET") {
    const r = await kvGet(key);
    if (!r.ok) return res.status(200).json({ ok: false, kv: true, reason: r.reason });
    return res.status(200).json({ ok: true, kv: true, scope, value: r.value ?? null });
  }

  // PUT
  const value = req.body ? req.body.value : undefined;
  if (value === undefined) return res.status(400).json({ error: "Missing value", code: "VALUE" });
  let size = 0;
  try { size = JSON.stringify(value).length; } catch (_) { return res.status(400).json({ error: "Value not serialisable", code: "VALUE" }); }
  if (size > MAX_BYTES) return res.status(413).json({ error: "Value too large", code: "SIZE", max: MAX_BYTES });

  const w = await kvSetJson(key, { v: value, updated_at: Date.now() });
  if (!w.ok) return res.status(200).json({ ok: false, kv: true, reason: w.reason });
  return res.status(200).json({ ok: true, kv: true, scope });
}
