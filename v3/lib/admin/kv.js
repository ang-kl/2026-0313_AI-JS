// Minimal Vercel KV REST client. No new npm dependency - uses fetch.
//
// Reads KV_REST_API_URL + KV_REST_API_TOKEN from the environment (Vercel auto-populates
// them when a KV store is attached). If either is missing, kvAvailable() returns false and
// every operation returns { ok: false, reason: "not_configured" }. That is the correct
// posture for local dev when KV is not set up - the admin config falls back to env-based
// defaults in the caller.

const BASE = () => process.env.KV_REST_API_URL || "";
const TOKEN = () => process.env.KV_REST_API_TOKEN || "";

export function kvAvailable() {
  return Boolean(BASE() && TOKEN());
}

async function kvCall(command, ...args) {
  if (!kvAvailable()) return { ok: false, reason: "not_configured" };
  const url = `${BASE()}/${command}/${args.map(encodeURIComponent).join("/")}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "authorization": `Bearer ${TOKEN()}` },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, error: data?.error };
    return { ok: true, result: data?.result };
  } catch (err) {
    return { ok: false, reason: "network", error: err?.message || String(err) };
  }
}

export async function kvGet(key) {
  const r = await kvCall("get", key);
  if (!r.ok) return r;
  if (r.result == null) return { ok: true, value: null };
  try { return { ok: true, value: JSON.parse(r.result) }; }
  catch (_) { return { ok: true, value: r.result }; }
}

export async function kvSetJson(key, value) {
  // The REST API's `set/<key>/<value>` path-parameter form is limited by URL length; for
  // JSON blobs we want the POST body form. Upstash / Vercel KV both accept a raw body POST.
  if (!kvAvailable()) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetch(`${BASE()}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${TOKEN()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(value),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, error: data?.error };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "network", error: err?.message || String(err) };
  }
}
