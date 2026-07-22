// v3/api/suggest.js — proxy to the GCN substrate service (Railway C++ service).
// POST /api/suggest  body: { "skills": ["python","sql"], "top": 10 }
//   -> { ok, suggestions:[{skill,score,esco,mcf,sources[]}], matched, unmatched, synthetic }
//
// The substrate authors every score deterministically (ESCO + MCF affinity); this endpoint
// only forwards and shapes the result. It NEVER fabricates a suggestion: if the service is
// unreachable or errors, it returns ok:false with a reason — same withhold-over-invent
// discipline as /api/engine.
//
// The service currently serves SYNTHETIC sample data (synthetic:true). This proxy passes
// that flag straight through so the caller (Step 3 UI) can gate/label it and never show a
// demo suggestion as if it were real.

// Substrate service base URL. Env override so the URL is not baked into the client bundle;
// defaults to the deployed Railway service.
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
    const r = await fetch(`${SUBSTRATE_URL.replace(/\/+$/, '')}/suggest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ skills, top: Number.isInteger(top) ? top : 10 }),
      signal: controller.signal,
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('[suggest] substrate error', r.status);
      return res.status(503).json({ ok: false, reason: `substrate service HTTP ${r.status}` });
    }
    // Pass the service payload through verbatim, plus ok:true. `synthetic` is preserved so
    // the UI can decide whether/how to surface it.
    return res.status(200).json({ ok: true, ...data });
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.error('[suggest] substrate unreachable:', err.message);
    return res.status(503).json({
      ok: false,
      reason: isTimeout ? 'substrate service timed out' : 'substrate service unreachable',
    });
  } finally {
    clearTimeout(timer);
  }
}
