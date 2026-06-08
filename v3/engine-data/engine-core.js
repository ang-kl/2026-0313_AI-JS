// v3/engine-data/engine-core.js — deterministic AI-Exposure engine (NO LLM, no network).
// Chain: SSOC (posting tag) -> ISCO-08 (SingStat) -> SOC 2010 (BLS) -> AIOE (Felten et al.).
// Every number here is a table lookup on verified public data — same input => same output.
// LLM has no write access to anything in this file (locked v3 contract: deterministic = control).
//
// Out of scope (honest): per-skill / per-duty exposure (needs a per-skill source). AIOE is
// occupation-level only, so we expose ONE computed index for the role, never a fabricated
// per-skill bar. Coherence vs skill-fingerprint is layered on later (needs the ESCO API).

import AIOE from './aioe.js';
import SSOC_ISCO from './ssoc-isco.js';
import ISCO_SOC from './isco-soc.js';
import PROV from './provenance.js';

// ---- lookups built once per cold start ----
const AIOE_BY_SOC = new Map(AIOE.map((r) => [r.soc, r]));
const AIOE_SORTED = AIOE.map((r) => r.aioe).sort((a, b) => a - b); // ascending z-scores
const N = AIOE_SORTED.length;

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

// Full engine output for one posting (SSOC-prior path). `skills`/`title` reserved for the
// later coherence/fingerprint layer; ignored here so the result stays deterministic + offline.
export function computeEngine({ ssoc, title = null /*, skills */ } = {}) {
  const ssocKey = String(ssoc || '').trim();
  const matches = ssocToIsco(ssocKey);

  if (!matches || !matches.length) {
    // Non-inventive: unknown SSOC -> withhold the number, say why.
    return {
      ok: false,
      reason: ssocKey ? 'SSOC not found in SingStat correspondence table' : 'No SSOC provided',
      input: { ssoc: ssocKey, title },
      occupation: null,
      exposure: null,
      provenance: PROV,
      version: 'engine-1',
    };
  }

  const partial = matches.some((m) => m.partial);
  const iscoCodes = [...new Set(matches.map((m) => m.isco))];

  // Union the SOC codes across every mapped ISCO (handles SSOC->multi-ISCO splits), then
  // aggregate AIOE once over the union so a split SSOC is weighted as one occupation.
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
      reason: 'No AIOE score for any SOC mapped from this SSOC',
      input: { ssoc: ssocKey, title },
      occupation: { ssoc: ssocKey, isco: iscoCodes, label: matches[0].title, via: 'ssoc' },
      exposure: null,
      provenance: PROV,
      version: 'engine-1',
    };
  }

  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const index = percentileOf(mean);
  // confidence: clean single full ISCO + all SOCs scored = high; splits / missing scores lower it.
  const allScored = vals.length === socs.length;
  const confidence = !partial && iscoCodes.length === 1 && allScored ? 'high' : (partial || iscoCodes.length > 1) ? 'medium' : 'medium';

  return {
    ok: true,
    input: { ssoc: ssocKey, title },
    occupation: {
      ssoc: ssocKey,
      isco: iscoCodes,
      label: matches[0].title,
      soc: socs.map((s) => s.soc),
      via: 'ssoc', // PR2 will add reconcile(ssoc, skill-fingerprint) + coherence
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
    coherence: null, // computed in PR2 (needs the ESCO skill-fingerprint)
    mirrorRoles: null, // computed in PR2
    provenance: PROV,
    version: 'engine-1',
  };
}

export const provenance = PROV;
