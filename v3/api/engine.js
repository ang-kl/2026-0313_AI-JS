// v3/api/engine.js — deterministic AI-Exposure engine endpoint (NO LLM).
// POST /api/engine  body: { "ssoc": "21222", "title": "Salesforce Data Analyst",
//                           "skills": ["..."], "fingerprintIscos": ["1330","1219"] }
//   -> { ok, occupation, exposure{ index 0-100, band, zMean, zRange, socsUsed... },
//        coherence, mirrorRoles, provenance }
// Pure table lookups (SSOC->ISCO->SOC->AIOE). Same input => same output. The number is
// withheld (ok:false + reason) when the data chain can't be verified — never fabricated.
// E2: `fingerprintIscos` (precomputed by /api/esco occupationFingerprint) turns on the
// reconcile + coherence + mirror-roles path. No new external calls here (CSP unchanged).

import { computeEngine } from '../engine-data/engine-core.js';
import { requireTelegramSession } from '../server/telegram-session.js';

// maxDuration is set in vercel.json (repo convention).
export default async function handler(req, res) {
  if (!requireTelegramSession(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. POST { ssoc, title, skills?, fingerprintIscos? }.' });
  }
  try {
    const { ssoc, title, skills, fingerprintIscos } = req.body || {};
    const result = computeEngine({ ssoc, title, skills, fingerprintIscos });
    return res.status(200).json(result);
  } catch (err) {
    console.error('engine error:', err.message);
    // Honest failure: no computed-looking fake number.
    return res.status(200).json({ ok: false, reason: 'engine error', error: err.message, version: 'engine-3' });
  }
}
