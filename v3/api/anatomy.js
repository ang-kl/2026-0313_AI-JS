// v3/api/anatomy.js - v3 - persistent store: Job Anatomy runs + ATS screening profiles.
// POST /api/anatomy:
//   { action:"get",  role, version }                         -> { hit: <anatomy obj> | null }
//   { action:"put",  role, version, source, adUuids, adCount, roleDisplay, duties, orgContext, narrative } -> { ok:bool, id? }
//   { action:"getProfile", role, version }                   -> { profile: <tiered screening profile> | null, keywordGaps:[...] }
//   { action:"putProfile", role, version, source, roleDisplay, profile:{ exactTitle, requiredQuals, hardSkills, softSkills, dutyKeywords, aiDimensions, knockouts, seniority, tools, narrative } } -> { ok:bool }
//   { action:"recordGap", role, version, missingKws:[], allMustHaveKws:[] } -> { ok:bool }   (counts only - never resume text)
// Backed by Vercel Postgres (@vercel/postgres). Stores ONLY derived data from
// public job ads (titles, employer names, classified duties, screening keywords)
// and aggregate keyword-gap counts - no raw ad HTML, no resume text, no user data.
// Numeric scores on the "put" path are re-computed server-side from the submitted
// duties, so a malicious/buggy client can never write bad numbers. If no Postgres
// connection string is set / the DB is down, every call returns a graceful empty
// result and the app behaves exactly as without the store.

// Vercel's @vercel/postgres reads POSTGRES_URL. A "Prisma Postgres" store on Vercel
// usually exposes the connection string as DATABASE_URL (and a prisma+postgres://
// Accelerate URL that this driver can't parse - in that case set a direct
// postgres:// URL as POSTGRES_URL). Fall back through the common env-var names.
if (!process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED || "";
}
import { sql } from '@vercel/postgres';

export const config = { api: { bodyParser: true }, maxDuration: 15 };

const ANATOMY_TTL = "7 days";
const PROFILE_TTL = "14 days";
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

// --- ATS screening profile sanitisers ---
function kwList(input, max) {
  if (!Array.isArray(input)) return [];
  return input.slice(0, max).map(x => {
    if (typeof x === "string") return { kw: str(x, 60) };
    if (x && typeof x === "object") return { kw: str(x.kw || x.keyword, 60), why: str(x.why, 120), fromAds: Math.max(0, Math.min(99, Number(x.fromAds) || 0)) || undefined };
    return null;
  }).filter(x => x && x.kw);
}
function sanitiseProfile(body) {
  const pb = (body && body.profile && typeof body.profile === "object") ? body.profile : (body || {});
  const exactTitle = kwList(pb.exactTitle, 6).map(x => (x.why ? { kw: x.kw, why: x.why } : { kw: x.kw }));
  const requiredQuals = kwList(pb.requiredQuals, 8).map(x => (x.why ? { kw: x.kw, why: x.why } : { kw: x.kw }));
  const hardSkills = kwList(pb.hardSkills != null ? pb.hardSkills : pb.mustHave, 32);
  const softSkills = kwList(pb.softSkills != null ? pb.softSkills : pb.niceToHave, 16).map(x => ({ kw: x.kw }));
  const knockouts = (Array.isArray(pb.knockouts) ? pb.knockouts : []).slice(0, 8).map(x => str(typeof x === "string" ? x : (x && (x.q || x.question)), 160)).filter(Boolean);
  const aiDimensions = (Array.isArray(pb.aiDimensions) ? pb.aiDimensions : []).slice(0, 6).map(x => {
    if (typeof x === "string") return { name: str(x, 60) };
    if (x && typeof x === "object") return { name: str(x.name, 60), what: str(x.what, 140) };
    return null;
  }).filter(x => x && x.name);
  const narr = pb.narrative && typeof pb.narrative === "object" ? { headline: str(pb.narrative.headline, 240), aiBar: str(pb.narrative.aiBar, 240) } : null;
  return {
    exactTitle, requiredQuals, hardSkills, softSkills,
    knockouts, aiDimensions,
    seniority: str(pb.seniority, 60),
    tools: arr(pb.tools, 8, 40),
    dutyKeywords: arr(pb.dutyKeywords, 25, 200),
    narrative: narr,
  };
}

let _tableEnsured = false;
async function ensureTables() {
  if (_tableEnsured) return;
  await sql`CREATE TABLE IF NOT EXISTS anatomy_runs (
    id BIGSERIAL PRIMARY KEY, role_key TEXT NOT NULL, role_display TEXT NOT NULL, version TEXT NOT NULL,
    source TEXT, ad_uuids JSONB, ad_count INT, ai_resilience_score INT, automatability_index INT,
    layer_mix JSONB, anatomy JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS anatomy_runs_lookup ON anatomy_runs (role_key, version, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS screening_profiles (
    id BIGSERIAL PRIMARY KEY, role_key TEXT NOT NULL, role_display TEXT NOT NULL, version TEXT NOT NULL,
    source TEXT, must_have JSONB, nice_to_have JSONB, knockouts JSONB, ai_dimensions JSONB,
    seniority TEXT, tools JSONB, duty_keywords JSONB, narrative JSONB, tiers JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE screening_profiles ADD COLUMN IF NOT EXISTS tiers JSONB`;
  await sql`CREATE INDEX IF NOT EXISTS screening_profiles_lookup ON screening_profiles (role_key, version, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS screen_keyword_gaps (
    role_key TEXT NOT NULL, version TEXT NOT NULL, kw TEXT NOT NULL,
    miss_count INT NOT NULL DEFAULT 0, check_count INT NOT NULL DEFAULT 0, last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_key, version, kw))`;
  _tableEnsured = true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const action = body.action;
  const roleKey = str(body.role, 140).toLowerCase();
  const version = str(body.version, 24);

  // ---- Job Anatomy cache ----
  if (action === 'get') {
    if (!roleKey) return res.status(200).json({ hit: null });
    try {
      await ensureTables();
      const { rows } = await sql`SELECT anatomy, created_at FROM anatomy_runs WHERE role_key=${roleKey} AND version=${version || "ja1"} AND created_at > now() - ${ANATOMY_TTL}::interval ORDER BY created_at DESC LIMIT 1`;
      if (!rows.length) return res.status(200).json({ hit: null });
      const a = rows[0].anatomy;
      if (a && Array.isArray(a.duties) && a.duties.length >= 4) {
        const recomputed = scoreJobAnatomy(a.duties);
        return res.status(200).json({ hit: { ...a, ...recomputed, fallback: false, cachedAt: rows[0].created_at } });
      }
      return res.status(200).json({ hit: a ? { ...a, cachedAt: rows[0].created_at } : null });
    } catch (err) { console.error('[anatomy] get:', err && err.message); return res.status(200).json({ hit: null }); }
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
      await ensureTables();
      const { rows } = await sql`INSERT INTO anatomy_runs (role_key, role_display, version, source, ad_uuids, ad_count, ai_resilience_score, automatability_index, layer_mix, anatomy)
        VALUES (${roleKey}, ${roleDisplay}, ${version || "ja1"}, ${source}, ${JSON.stringify(adUuids)}, ${adCount}, ${scores.aiResilienceScore}, ${scores.automatabilityIndex}, ${JSON.stringify(scores.layerMix)}, ${JSON.stringify(anatomy)}) RETURNING id`;
      return res.status(200).json({ ok: true, id: rows[0] && rows[0].id });
    } catch (err) { console.error('[anatomy] put:', err && err.message); return res.status(200).json({ ok: false, reason: 'db' }); }
  }

  // ---- ATS screening profile ----
  if (action === 'getProfile') {
    if (!roleKey) return res.status(200).json({ profile: null, keywordGaps: [] });
    try {
      await ensureTables();
      const v = version || "sp2";
      const { rows } = await sql`SELECT must_have, nice_to_have, knockouts, ai_dimensions, seniority, tools, duty_keywords, narrative, tiers, created_at FROM screening_profiles WHERE role_key=${roleKey} AND version=${v} AND created_at > now() - ${PROFILE_TTL}::interval ORDER BY created_at DESC LIMIT 1`;
      let gaps = [];
      try { const g = await sql`SELECT kw, miss_count, check_count FROM screen_keyword_gaps WHERE role_key=${roleKey} AND version=${v} AND check_count >= 2 ORDER BY miss_count DESC, kw ASC LIMIT 8`; gaps = g.rows.map(r => ({ kw: r.kw, miss: r.miss_count, of: r.check_count })); } catch (_) {}
      if (!rows.length) return res.status(200).json({ profile: null, keywordGaps: gaps });
      const r = rows[0];
      const t = r.tiers || {};
      return res.status(200).json({ profile: { exactTitle: t.exactTitle || [], requiredQuals: t.requiredQuals || [], hardSkills: r.must_have || [], softSkills: r.nice_to_have || [], dutyKeywords: r.duty_keywords || [], aiDimensions: r.ai_dimensions || [], knockouts: r.knockouts || [], seniority: r.seniority || "", tools: r.tools || [], narrative: r.narrative || null, cachedAt: r.created_at }, keywordGaps: gaps });
    } catch (err) { console.error('[anatomy] getProfile:', err && err.message); return res.status(200).json({ profile: null, keywordGaps: [] }); }
  }

  if (action === 'putProfile') {
    const p = sanitiseProfile(body);
    if (!roleKey || !(p.hardSkills.length || p.exactTitle.length)) return res.status(200).json({ ok: false, reason: 'invalid' });
    const source = ["esco", "posting", "corpus"].includes(body.source) ? body.source : "esco";
    const roleDisplay = str(body.roleDisplay || body.role, 140) || roleKey;
    const tiers = { exactTitle: p.exactTitle, requiredQuals: p.requiredQuals };
    try {
      await ensureTables();
      await sql`INSERT INTO screening_profiles (role_key, role_display, version, source, must_have, nice_to_have, knockouts, ai_dimensions, seniority, tools, duty_keywords, narrative, tiers)
        VALUES (${roleKey}, ${roleDisplay}, ${version || "sp2"}, ${source}, ${JSON.stringify(p.hardSkills)}, ${JSON.stringify(p.softSkills)}, ${JSON.stringify(p.knockouts)}, ${JSON.stringify(p.aiDimensions)}, ${p.seniority}, ${JSON.stringify(p.tools)}, ${JSON.stringify(p.dutyKeywords)}, ${JSON.stringify(p.narrative)}, ${JSON.stringify(tiers)})`;
      return res.status(200).json({ ok: true });
    } catch (err) { console.error('[anatomy] putProfile:', err && err.message); return res.status(200).json({ ok: false, reason: 'db' }); }
  }

  if (action === 'recordGap') {
    // counts only - never resume text. kws come from the role's demanded set.
    const all = arr(body.allMustHaveKws, 32, 60);
    const missing = new Set(arr(body.missingKws, 32, 60));
    if (!roleKey || !all.length) return res.status(200).json({ ok: false, reason: 'invalid' });
    const v = version || "sp1";
    try {
      await ensureTables();
      await Promise.all(all.map(kw => sql`INSERT INTO screen_keyword_gaps (role_key, version, kw, miss_count, check_count)
        VALUES (${roleKey}, ${v}, ${kw}, ${missing.has(kw) ? 1 : 0}, 1)
        ON CONFLICT (role_key, version, kw) DO UPDATE SET miss_count = screen_keyword_gaps.miss_count + EXCLUDED.miss_count, check_count = screen_keyword_gaps.check_count + 1, last_seen = now()`));
      return res.status(200).json({ ok: true });
    } catch (err) { console.error('[anatomy] recordGap:', err && err.message); return res.status(200).json({ ok: false, reason: 'db' }); }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
