// GET/PUT /api/admin/config - the persisted LLM proxy provider chain + model overrides.
// Cookie-gated (owner-only). Backed by Vercel KV via REST; falls back to env-based
// defaults when KV is unconfigured or empty. See v3/script/v3-admin-module-spec.md.

import { requireAdmin } from "../../lib/admin/session.js";
import { kvAvailable, kvGet, kvSetJson } from "../../lib/admin/kv.js";

export const config = {
  api: { bodyParser: true },
  maxDuration: 10,
};

const KV_KEY = "v3:admin:llm-config";
const VALID_PROVIDERS = ["anthropic", "openai", "gemini"];
// Human Lead directive (09-07 '26): Anthropic-only (Sonnet 5) until further notice -
// matches api/claude.js's DEFAULT_CHAIN. Admin panel can still reorder/re-add providers.
const DEFAULT_CHAIN = ["anthropic"];

// Sanitise input from the admin panel. Chain must be an ordered array of unique known
// providers; overrides are per-provider string overrides for model ids. Anything else is
// dropped rather than blindly persisted - the KV blob is the source of truth for a running
// serverless instance, so garbage in there breaks every /api/claude call.
function normaliseConfig(raw) {
  const out = { chain: DEFAULT_CHAIN.slice(), overrides: {} };
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.chain)) {
      const seen = new Set();
      const cleaned = [];
      for (const p of raw.chain) {
        const key = String(p || "").toLowerCase();
        if (!VALID_PROVIDERS.includes(key)) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        cleaned.push(key);
      }
      if (cleaned.length > 0) out.chain = cleaned;
    }
    if (raw.overrides && typeof raw.overrides === "object") {
      for (const p of VALID_PROVIDERS) {
        const o = raw.overrides[p];
        if (!o || typeof o !== "object") continue;
        const clean = {};
        for (const [k, v] of Object.entries(o)) {
          if (typeof v !== "string") continue;
          const trimmed = v.trim();
          if (!trimmed) continue;
          if (trimmed.length > 120) continue;
          clean[String(k).slice(0, 40)] = trimmed;
        }
        if (Object.keys(clean).length > 0) out.overrides[p] = clean;
      }
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD" });
  }
  const auth = requireAdmin(req, res);
  if (!auth.ok) return; // requireAdmin already wrote the response

  if (req.method === "GET") {
    if (!kvAvailable()) {
      return res.status(200).json({ ok: true, kv: false, config: { chain: DEFAULT_CHAIN, overrides: {} }, source: "default" });
    }
    const r = await kvGet(KV_KEY);
    if (!r.ok) {
      console.warn(`[admin] KV get failed: ${r.reason}`);
      return res.status(200).json({ ok: true, kv: true, config: { chain: DEFAULT_CHAIN, overrides: {} }, source: "default", warning: r.reason });
    }
    const stored = normaliseConfig(r.value);
    return res.status(200).json({ ok: true, kv: true, config: stored, source: r.value ? "kv" : "default" });
  }

  // PUT
  if (!kvAvailable()) {
    return res.status(503).json({ error: "KV not configured; cannot persist config", code: "NO_KV" });
  }
  const next = normaliseConfig(req.body);
  const withMeta = { ...next, updated_at: Date.now(), updated_by: auth.userId };
  const w = await kvSetJson(KV_KEY, withMeta);
  if (!w.ok) {
    console.error(`[admin] KV set failed: ${w.reason}`);
    return res.status(503).json({ error: "Could not persist config", code: "KV_WRITE", reason: w.reason });
  }
  console.log(`[admin] config updated by ${auth.userId}: chain=${next.chain.join(">")}`);
  return res.status(200).json({ ok: true, config: withMeta });
}
