// v3/engine-data/engine-core.js — deterministic AI-Exposure engine (NO LLM, no network).
// Chain: SSOC (posting tag) -> ISCO-08 (SingStat) -> SOC 2010 (BLS) -> AIOE (Felten et al.).
// Every number here is a table lookup on verified public data — same input => same output.
// LLM has no write access to anything in this file (locked v3 contract: deterministic = control).
//
// Out of scope (honest): per-skill / per-duty exposure (needs a per-skill source). AIOE is
// occupation-level only, so we expose ONE computed index for the role, never a fabricated
// per-skill bar.
//
// E2 (engine-2): callers may pass precomputed `fingerprintIscos` (ISCO-08 unit groups from
// the ESCO skill-fingerprint, /api/esco occupationFingerprint). The engine then RECONCILES
// the SSOC prior against the skill evidence (coherence agree/conflict; on conflict the skill
// evidence wins - MCF SSOC tags can be mis-coded) and computes mirror-roles by share. The
// engine itself still makes NO network call: fingerprinting happens upstream; this file only
// does deterministic table work on whatever evidence it is handed.

import AIOE from './aioe.js';
import SSOC_ISCO from './ssoc-isco.js';
import ISCO_SOC from './isco-soc.js';
import PROV from './provenance.js';

// ---- lookups built once per cold start ----
const AIOE_BY_SOC = new Map(AIOE.map((r) => [r.soc, r]));
const AIOE_SORTED = AIOE.map((r) => r.aioe).sort((a, b) => a - b); // ascending z-scores
const N = AIOE_SORTED.length;

// ISCO-08 unit-group titles, harvested from the SingStat correspondence rows (first title
// seen per code wins - the table repeats the official ISCO title on every row). Offline.
const ISCO_TITLE = new Map();
for (const rows of Object.values(SSOC_ISCO)) {
  for (const m of rows) {
    if (m && m.isco && !ISCO_TITLE.has(m.isco)) ISCO_TITLE.set(m.isco, m.title);
  }
}

// Percentile rank of a z-score among all AIOE occupations (% with AIOE <= z). Documented
// transform: turns the signed z-score into an intuitive 0-100 "more exposed than X%" index.
function percentileOf(z) {
  let lo = 0, hi = N;
  while (lo < hi) { const m = (lo + hi) >> 1; if (AIOE_SORTED[m] <= z) lo = m + 1; else hi = m; }
  return Math.round((lo / N) * 100);
}
const bandOf = (pct) => (pct >= 80 ? 'high' : pct >= 50 ? 'moderate' : 'low');
const round3 = (x) => Math.round(x * 1000) / 1000;

export function ssocToIsco(ssoc) {
  return SSOC_ISCO[String(ssoc || '').trim()] || null; // [{isco,title,partial}] | null
}
export function iscoToSocs(isco) {
  return ISCO_SOC[String(isco || '').trim()] || []; // [{soc,title,part}]
}

// Exposure for a single ISCO-08 group: its mapped SOC codes -> AIOE -> mean/range/percentile.
export function exposureForIsco(isco) {
  const socs = iscoToSocs(isco).map((s) => ({ ...s, aioe: AIOE_BY_SOC.get(s.soc)?.aioe ?? null }));
  const vals = socs.filter((s) => s.aioe != null).map((s) => s.aioe);
  if (!vals.length) return null;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const index = percentileOf(mean);
  return {
    isco,
    index, // 0-100 percentile
    band: bandOf(index),
    zMean: round3(mean),
    zRange: [round3(Math.min(...vals)), round3(Math.max(...vals))], // true magnitude, not a point
    socs, // every mapped SOC carried (incl. any with no AIOE row), for audit
    socsWithScore: vals.length,
  };
}

// Normalise one fingerprint entry to { isco: "NNNN", weight: number } or null.
// Accepts "1330", { isco }, or ESCO-candidate-shaped { code: "2511.4", ratio } - the ISCO-08
// unit group is the first 4 digits. Invalid entries are dropped, never guessed.
function normFingerprintEntry(e) {
  const raw = typeof e === 'string' ? e : String((e && (e.isco || e.code)) || '');
  const m = raw.trim().match(/^(\d{4})/);
  if (!m) return null;
  const w = typeof e === 'object' && e ? Number(e.weight ?? e.ratio ?? e.share ?? 1) : 1;
  return { isco: m[1], weight: Number.isFinite(w) && w > 0 ? w : 1 };
}

// E2: reconcile the posting's SSOC prior against the skill-fingerprint evidence.
// -> { iscoChosen, coherence: 'agree'|'conflict', ssocIsco, fingerprintIscos }
// agree    = the SSOC's ISCO appears among the fingerprint ISCOs (sources corroborate);
//            chosen = the corroborated codes.
// conflict = no overlap; chosen = the fingerprint ISCOs (skill evidence wins - the MCF
//            SSOC tag can be mis-coded). Both lists are surfaced either way.
export function reconcile(ssocPrior, skillFingerprintIscos) {
  const ssocIsco = [...new Set((ssocToIsco(ssocPrior) || []).map((m) => m.isco))];
  const fp = (Array.isArray(skillFingerprintIscos) ? skillFingerprintIscos : [])
    .map(normFingerprintEntry).filter(Boolean);
  const fingerprintIscos = [...new Set(fp.map((f) => f.isco))];
  if (!ssocIsco.length || !fingerprintIscos.length) {
    return { iscoChosen: ssocIsco.length ? ssocIsco : fingerprintIscos, coherence: null, ssocIsco, fingerprintIscos };
  }
  const agreed = ssocIsco.filter((i) => fingerprintIscos.includes(i));
  return agreed.length
    ? { iscoChosen: agreed, coherence: 'agree', ssocIsco, fingerprintIscos }
    : { iscoChosen: fingerprintIscos, coherence: 'conflict', ssocIsco, fingerprintIscos };
}

// E2: mirror-roles by share. Groups the fingerprint blend by ISCO-08 unit group, weights by
// the carried score (ESCO overlap ratio), and attaches each group's computed AIOE exposure.
// -> top-N of { isco, title, sharePct, index, band, zRange } - index null (not faked) when
// no SOC under that ISCO carries an AIOE score. Deterministic: stable sort, fixed rounding.
export function mirrorRolesFor(fingerprintBlend, topN = 5) {
  const fp = (Array.isArray(fingerprintBlend) ? fingerprintBlend : [])
    .map(normFingerprintEntry).filter(Boolean);
  if (!fp.length) return [];
  const byIsco = new Map();
  for (const f of fp) byIsco.set(f.isco, (byIsco.get(f.isco) || 0) + f.weight);
  const total = [...byIsco.values()].reduce((a, b) => a + b, 0);
  return [...byIsco.entries()]
    .sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1)) // weight desc, then isco asc
    .slice(0, topN)
    .map(([isco, w]) => {
      const exp = exposureForIsco(isco);
      return {
        isco,
        title: ISCO_TITLE.get(isco) || null,
        sharePct: Math.round((w / total) * 100),
        index: exp ? exp.index : null,
        band: exp ? exp.band : null,
        zRange: exp ? exp.zRange : null,
      };
    });
}

// Full engine output for one posting. SSOC-prior path by default; when the caller supplies
// `fingerprintIscos` (precomputed ESCO skill evidence) the occupation is RECONCILED and
// `coherence` + `mirrorRoles` are populated (via:'reconcile'). `skills` is echoed for audit
// only - raw skill text is never scored here (no per-skill source; non-inventive).
export function computeEngine({ ssoc, title = null, skills = null, fingerprintIscos = null } = {}) {
  const ssocKey = String(ssoc || '').trim();
  const matches = ssocToIsco(ssocKey);

  // Echo what evidence the caller supplied (audit trail); keys appear only when provided so
  // the SSOC-only output stays shape-compatible with the engine-1 snapshot.
  const input = { ssoc: ssocKey, title };
  if (Array.isArray(skills)) input.skillsCount = skills.length;
  const fpNorm = (Array.isArray(fingerprintIscos) ? fingerprintIscos : []).map(normFingerprintEntry).filter(Boolean);
  if (fpNorm.length) input.fingerprintIscos = [...new Set(fpNorm.map((f) => f.isco))];

  if (!matches || !matches.length) {
    // Non-inventive: unknown SSOC -> withhold the number, say why. (Computing from the
    // fingerprint alone is a later, explicitly-specced path - not silently done here.)
    return {
      ok: false,
      reason: ssocKey ? 'SSOC not found in SingStat correspondence table' : 'No SSOC provided',
      input,
      occupation: null,
      exposure: null,
      provenance: PROV,
      version: 'engine-2',
    };
  }

  const partial = matches.some((m) => m.partial);

  // E2: reconcile the SSOC prior with the skill evidence when the caller supplied it.
  // agree -> corroborated codes; conflict -> skill evidence wins; both lists surfaced.
  const rec = fpNorm.length ? reconcile(ssocKey, fingerprintIscos) : null;
  const iscoCodes = rec ? rec.iscoChosen : [...new Set(matches.map((m) => m.isco))];
  const via = rec ? 'reconcile' : 'ssoc';
  const coherence = rec ? { status: rec.coherence, ssocIsco: rec.ssocIsco, fingerprintIscos: rec.fingerprintIscos } : null;
  const mirrorRoles = fpNorm.length ? mirrorRolesFor(fingerprintIscos) : null;
  const label = (rec && ISCO_TITLE.get(iscoCodes[0])) || matches[0].title;

  // Union the SOC codes across every chosen ISCO (handles SSOC->multi-ISCO splits), then
  // aggregate AIOE once over the union so a split occupation is weighted as one.
  const socMap = new Map();
  for (const isco of iscoCodes) {
    for (const s of iscoToSocs(isco)) {
      if (!socMap.has(s.soc)) {
        socMap.set(s.soc, { soc: s.soc, title: s.title, fromIsco: isco, aioe: AIOE_BY_SOC.get(s.soc)?.aioe ?? null });
      }
    }
  }
  const socs = [...socMap.values()];
  const vals = socs.filter((s) => s.aioe != null).map((s) => s.aioe);

  if (!vals.length) {
    return {
      ok: false,
      reason: 'No AIOE score for any SOC mapped from this occupation',
      input,
      occupation: { ssoc: ssocKey, isco: iscoCodes, label, via, partial },
      exposure: null,
      coherence,
      mirrorRoles,
      provenance: PROV,
      version: 'engine-2',
    };
  }

  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const index = percentileOf(mean);
  // confidence: clean single full ISCO + all SOCs scored = high; splits / missing scores lower
  // it; a reconcile CONFLICT demotes one band (sources disagree - treat the code with caution).
  const allScored = vals.length === socs.length;
  let confidence = !partial && iscoCodes.length === 1 && allScored ? 'high' : (partial || iscoCodes.length > 1) ? 'medium' : 'medium';
  if (coherence && coherence.status === 'conflict') confidence = confidence === 'high' ? 'medium' : 'low';

  return {
    ok: true,
    input,
    occupation: {
      ssoc: ssocKey,
      isco: iscoCodes,
      label,
      soc: socs.map((s) => s.soc),
      via, // 'reconcile' when skill evidence was supplied, else 'ssoc'
      partial,
    },
    exposure: {
      index, // AI-Exposure Index, 0-100
      band: bandOf(index),
      zMean: round3(mean),
      zRange: [round3(Math.min(...vals)), round3(Math.max(...vals))],
      socsUsed: socs.map((s) => ({ soc: s.soc, title: s.title, aioe: s.aioe == null ? null : round3(s.aioe), fromIsco: s.fromIsco })),
      socsWithScore: vals.length,
      source: 'AIOE (Felten, Raj & Seamans 2021)',
      crosswalk: 'SSOC->ISCO-08->SOC 2010->AIOE',
      confidence,
    },
    coherence, // { status: 'agree'|'conflict', ssocIsco, fingerprintIscos } | null
    mirrorRoles, // [{ isco, title, sharePct, index, band, zRange }] | null
    provenance: PROV,
    version: 'engine-2',
  };
}

export const provenance = PROV;
