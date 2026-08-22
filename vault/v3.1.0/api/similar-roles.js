// v3/api/similar-roles.js — proxy to the GCN substrate service (Railway C++ service).
// POST /api/similar-roles  body: { "skills": ["python","sql"], "top": 8 }
//   -> { ok, roles:[{title,score,shared,sharedSkills[]}], matched, unmatched, bridged, synthetic }
//
// The substrate authors every score deterministically (ESCO occupation<->skill overlap, with
// an MCF-posting bridge for thin cases); this endpoint only forwards and shapes. It NEVER
// fabricates a role: if the service is unreachable or errors, it returns ok:false with a
// reason — same withhold-over-invent discipline as /api/suggest and /api/engine.
//
// The service serves SYNTHETIC sample data (synthetic:true) until the real harvest is baked
// in; this proxy passes that flag through so the UI can gate/label it. `bridged` marks roles
// found via MCF co-occurrence rather than direct ESCO overlap (a weaker basis to disclose).

const SUBSTRATE_URL = process.env.SUBSTRATE_URL || 'https://job-analysis.up.railway.app';
const TIMEOUT_MS = 10000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'Method not allowed. POST { skills:[...], top? }.' });
  }
  const { skills, top } = req.body || {};
  if (!Array.isArray(skills) || !skills.length) {
    return res.status(400).json({ ok: false, reason: 'Body must include a non-empty skills array.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${SUBSTRATE_URL.replace(/\/+$/, '')}/similar-roles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ skills, top: Number.isInteger(top) ? top : 8 }),
      signal: controller.signal,
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('[similar-roles] substrate error', r.status);
      return res.status(503).json({ ok: false, reason: `substrate service HTTP ${r.status}` });
    }
    // Pass the service payload through verbatim; `ok` is pinned AFTER the spread so the
    // substrate can never override the proxy's contract flag.
    return res.status(200).json({ ...data, ok: true });
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.error('[similar-roles] substrate unreachable:', err.message);
    return res.status(503).json({
      ok: false,
      reason: isTimeout ? 'substrate service timed out' : 'substrate service unreachable',
    });
  } finally {
    clearTimeout(timer);
  }
}
