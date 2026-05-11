// v3/api/anatomy.js - v3 - persistent store for Job Anatomy runs.
// POST /api/anatomy:
//   { action:"get", role, version } -> { hit: <anatomy object> | null }
//   { action:"put", role, version, source, adUuids, adCount, roleDisplay,
//     duties:[...], orgContext:{...}, narrative:{...} } -> { ok:bool, id? }
// Backed by Vercel Postgres (@vercel/postgres). Stores only DERIVED data from
// public job ads (titles, employer names, the extracted/classified duties) - no
// raw ad HTML, no user data. The "put" path strictly validates the payload shape
// and RE-COMPUTES every numeric score server-side from the submitted duties, so a
// malicious or buggy client can never write bad numbers (it can at most write
// shape-valid junk duties, which only shadows a role's cache until the next
// genuine run). If POSTGRES_URL is unset / the DB is down, every call returns a
// graceful empty result and the app behaves exactly as without the store.

import { sql } from '@vercel/postgres';

export const config = { api: { bodyParser: true }, maxDuration: 15 };

const TTL_DAYS = 7;
const JOB_LAYER_ORDER = ["Activity", "Coordination", "Accountability", "Relational", "Judgment"];
const _layerSet = new Set(JOB_LAYER_ORDER);
const _expoSet = new Set(["HUMAN", "LOW", "MEDIUM", "HIGH"]);
const _exposureBand = { HUMAN: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };
const _layerBlurb = {
  Activity: "hands-on production",
  Coordination: "orchestrating people and process",
  Accountability: "owning outcomes and decisions",
  Relational: "trust, negotiation and influence",
  Judgment: "framing and deciding under ambiguity",
};

// Pure - MUST mirror scoreJobAnatomy() in v3/src/App.jsx. Bump JOB_ANATOMY_VERSION
// (in App.jsx) whenever this formula changes so stale rows are not re-served.
function scoreJobAnatomy(duties) {
  const w = d => Math.max(1, Number(d.count) || 1);
  const totalW = duties.reduce((a, d) => a + w(d), 0) || 1;
  const layerW = {}; JOB_LAYER_ORDER.forEach(L => layerW[L] = 0);
  duties.forEach(d => { layerW[d.layer] = (layerW[d.layer] || 0) + w(d); });
  const layerMix = {}; JOB_LAYER_ORDER.forEach(L => layerMix[L] = Math.round((layerW[L] / totalW) * 100));
  const expoRes  = { HUMAN: 1.0, LOW: 0.72, MEDIUM: 0.38, HIGH: 0.10 };
  const layRes   = { Activity: 0.15, Coordination: 0.45, Accountability: 0.90, Relational: 0.95, Judgment: 0.85 };
  const expoAuto = { HIGH: 1.0, MEDIUM: 0.60, LOW: 0.25, HUMAN: 0.05 };
  const wmean = fn => duties.reduce((a, d) => a + fn(d) * w(d), 0) / totalW;
  const aiResilienceScore   = Math.round(100 * wmean(d => Math.max(expoRes[d.exposureNow] ?? 0.4, (layRes[d.layer] ?? 0.2) * 0.85)));
  const resilience2y        = Math.round(100 * wmean(d => Math.max(expoRes[d.exposure2y] ?? 0.4, (layRes[d.layer] ?? 0.2) * 0.85)));
  const automatabilityIndex = Math.round(100 * wmean(d => expoAuto[d.exposureNow] ?? 0.4));
  const cog = JOB_LAYER_ORDER.slice().sort((a, b) => layerW[b] - layerW[a])[0] || "Activity";
  const nRising = duties.filter(d => (_exposureBand[d.exposure2y] ?? 1) > (_exposureBand[d.exposureNow] ?? 1)).length;
  return {
    layerMix, aiResilienceScore, resilience2y, automatabilityIndex,
    centreOfGravity: { layer: cog, line: `Most of this role is ${_layerBlurb[cog] || "varied"} work today.` },
    trajectory2y: { nRising, nDuties: duties.length, line: `${nRising} of ${duties.length} duties move further into AI's reach within ~2 years — resilience ~${aiResilienceScore} → ~${resilience2y} by ~2027.` },
  };
}

const str = (x, max) => String(x == null ? "" : x).replace(/"/g, "").trim().slice(0, max || 240);
const arr = (x, max, len) => Array.isArray(x) ? x.map(s => str(s, len || 60)).filter(Boolean).slice(0, max) : [];

function sanitiseDuties(input) {
  if (!Array.isArray(input)) return null;
  const lvl = x => (_expoSet.has(x) ? x : "MEDIUM");
  const lay = x => (_layerSet.has(x) ? x : "Activity");
  const out = input.slice(0, 30).map(d => {
    if (!d || typeof d !== "object") return null;
    const text = str(d.text, 200); if (!text) return null;
    const exposureNow = lvl(d.exposureNow); const exposure2y = lvl(d.exposure2y || exposureNow);
    let trj = ["stable", "rising", "sharp"].includes(d.trajectory) ? d.trajectory : "stable";
    if (exposure2y === exposureNow) trj = "stable";
    return {
      text, layer: lay(d.layer), exposureNow, exposure2y, trajectory: trj,
      count: Math.max(1, Math.min(99, Number(d.count) || 1)),
      of: Math.max(1, Math.min(99, Number(d.of) || 1)),
      kind: ["task", "decision", "outcome"].includes(d.kind) ? d.kind : "task",
      confidence: Math.max(0, Math.min(1, Number(d.confidence) || 0.6)),
    };
  }).filter(Boolean);
  return out.length >= 4 ? out : null;
}
function sanitiseOrgContext(o) {
  if (!o || typeof o !== "object") return {};
  return {
    reportsTo: str(o.reportsTo, 80), teamSize: str(o.teamSize, 60), seniorityYears: str(o.seniorityYears, 40),
    scopeRegions: arr(o.scopeRegions, 4, 50), tools: arr(o.tools, 6, 40), stakeholders: arr(o.stakeholders, 6, 40),
  };
}
function sanitiseNarrative(n) {
  if (!n || typeof n !== "object") return null;
  return {
    headline: str(n.headline, 220), whatTheJobReallyIs: str(n.whatTheJobReallyIs, 360), whatSupervisorsExpect: str(n.whatSupervisorsExpect, 360),
    prepFocus: Array.isArray(n.prepFocus) ? n.prepFocus.slice(0, 3).map(p => ({ layer: str(p && p.layer, 40), why: str(p && p.why, 140), action: str(p && p.action, 140) })).filter(p => p.layer) : [],
  };
}

let _tableEnsured = false;
async function ensureTable() {
  if (_tableEnsured) return;
  await sql`CREATE TABLE IF NOT EXISTS anatomy_runs (
    id BIGSERIAL PRIMARY KEY,
    role_key TEXT NOT NULL,
    role_display TEXT NOT NULL,
    version TEXT NOT NULL,
    source TEXT,
    ad_uuids JSONB,
    ad_count INT,
    ai_resilience_score INT,
    automatability_index INT,
    layer_mix JSONB,
    anatomy JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS anatomy_runs_lookup ON anatomy_runs (role_key, version, created_at DESC)`;
  _tableEnsured = true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const action = body.action;
  const roleKey = str(body.role, 140).toLowerCase();
  const version = str(body.version, 24) || "ja1";

  if (action === 'get') {
    if (!roleKey) return res.status(200).json({ hit: null });
    try {
      await ensureTable();
      const { rows } = await sql`SELECT anatomy, created_at FROM anatomy_runs WHERE role_key=${roleKey} AND version=${version} AND created_at > now() - interval '7 days' ORDER BY created_at DESC LIMIT 1`;
      if (!rows.length) return res.status(200).json({ hit: null });
      const a = rows[0].anatomy;
      if (a && Array.isArray(a.duties) && a.duties.length >= 4) {
        // re-derive every numeric field from the stored duties (deterministic) so a
        // row written by an older/buggy code path is still self-consistent on read
        const recomputed = scoreJobAnatomy(a.duties);
        return res.status(200).json({ hit: { ...a, ...recomputed, fallback: false, cachedAt: rows[0].created_at } });
      }
      return res.status(200).json({ hit: a ? { ...a, cachedAt: rows[0].created_at } : null });
    } catch (err) {
      console.error('[anatomy] get error:', err && err.message);
      return res.status(200).json({ hit: null });
    }
  }

  if (action === 'put') {
    const duties = sanitiseDuties(body.duties);
    if (!roleKey || !duties) return res.status(200).json({ ok: false, reason: 'invalid' });
    const scores = scoreJobAnatomy(duties);
    const orgContext = sanitiseOrgContext(body.orgContext);
    const narrative = sanitiseNarrative(body.narrative);
    const adUuids = arr(body.adUuids, 30, 64);
    const adCount = Math.max(1, Math.min(99, Number(body.adCount) || adUuids.length || 1));
    const source = ["esco", "posting", "corpus"].includes(body.source) ? body.source : "esco";
    const roleDisplay = str(body.roleDisplay || body.role, 140) || roleKey;
    const anatomy = { fallback: false, ...scores, orgContext, adCount, duties, narrative };
    try {
      await ensureTable();
      const { rows } = await sql`INSERT INTO anatomy_runs
        (role_key, role_display, version, source, ad_uuids, ad_count, ai_resilience_score, automatability_index, layer_mix, anatomy)
        VALUES (${roleKey}, ${roleDisplay}, ${version}, ${source}, ${JSON.stringify(adUuids)}, ${adCount}, ${scores.aiResilienceScore}, ${scores.automatabilityIndex}, ${JSON.stringify(scores.layerMix)}, ${JSON.stringify(anatomy)})
        RETURNING id`;
      return res.status(200).json({ ok: true, id: rows[0] && rows[0].id });
    } catch (err) {
      console.error('[anatomy] put error:', err && err.message);
      return res.status(200).json({ ok: false, reason: 'db' });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
