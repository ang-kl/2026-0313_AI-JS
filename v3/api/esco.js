// v3/api/esco.js - v3 - ESCO REST API proxy with occupation label passthrough
// POST /api/esco - body:
//   { "action": "skills", "title": "Facilities Manager" }
//   { "action": "occupationFingerprint", "title": "Marketing Executive",
//     "skillPhrases": ["campaign analytics", "SQL reporting", ...] }
// "skills": resolves a title to its ESCO essential skills (+ occupation label
//   passthrough so the frontend can forward to /api/mcf and /api/datagov).
// "occupationFingerprint": given a job title + a list of skill phrases (from a
//   live posting), returns the ESCO occupations whose essential-skill lists best
//   overlap the posting - i.e. which occupations the ad is actually a blend of.
//   Deterministic: ESCO search + cached essential-skill lookups + token overlap.

const ESCO_BASE = 'https://ec.europa.eu/esco/api';
const ESCO_VERSION = 'v1.2.0';
const HYBRID_THRESHOLD = 8;
const ESCO_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Strip qualifier/locale/tool noise from a posting title so the ESCO occupation
// search matches the CORE role. e.g.
//   "Data Analyst - Talend Data Integration / Informatica BDM (Singaporean Only)" -> "Data Analyst"
// Conservative on purpose: only removes (parentheticals)/[brackets] and any text after
// the FIRST spaced dash (en/em/hyphen). It never splits on "/" or on hyphenated words,
// so "Full-Stack Engineer" and "X-Ray / CT Imaging Engineer" are preserved. Falls back
// to the raw title if cleaning would leave too little.
function cleanOccupationTitle(raw) {
  const original = String(raw || '').trim();
  let s = original.replace(/[([][^)\]]*[)\]]/g, ' '); // drop (...) and [...]
  s = s.split(/\s+[–—-]\s+/)[0];                       // keep text before the first spaced dash
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s.length >= 3 ? s : original;
}

// Returns { uri, preferredLabel } picked from the search result that best
// matches the user's title (case-insensitive exact match if present, else
// the first/highest-ranked result). Searches on the CLEANED core title so noisy
// postings ("... - Talend ... (Singaporean Only)") don't resolve to a wrong occupation.
async function resolveOccupation(title) {
  const cleaned = cleanOccupationTitle(title);
  const url = `${ESCO_BASE}/search?text=${encodeURIComponent(cleaned)}&type=occupation&language=en&selectedVersion=${ESCO_VERSION}&limit=10`;
  const res = await fetchWithTimeout(url, ESCO_TIMEOUT_MS);
  if (!res.ok) throw new Error(`ESCO search HTTP ${res.status}`);
  const data = await res.json();
  const results = data?._embedded?.results;
  if (!results || results.length === 0) throw new Error('No occupation found');
  const needle = cleaned.toLowerCase();
  const exactMatch = results.find(r => r.title && r.title.toLowerCase() === needle);
  const chosen = exactMatch || results[0];
  return { uri: chosen.uri, preferredLabel: chosen.title || '' };
}

// Returns essential skills + alt labels + ISCO major group for the occupation.
async function fetchOccupationDetail(occupationUri) {
  const url = `${ESCO_BASE}/resource/occupation?uri=${encodeURIComponent(occupationUri)}&language=en&selectedVersion=${ESCO_VERSION}`;
  const res = await fetchWithTimeout(url, ESCO_TIMEOUT_MS);
  if (!res.ok) throw new Error(`ESCO occupation HTTP ${res.status}`);
  const data = await res.json();

  const links = data?._links?.hasEssentialSkill || [];
  const skills = links.map(s => ({
    skill: s.title,
    escoUri: s.uri,
    skillType: s.skillType || 'skill/competence',
    isEssential: true,
    isExtended: false,
  }));

  const altLabels = (data?.alternativeLabel?.en || []).slice(0, 8);

  // ISCO-08 major group lives in the broader concept hierarchy. The ESCO
  // occupation URI also encodes the ISCO code. Try both, regex the first
  // digit out so the frontend can pass it to /api/datagov.
  const iscoCandidate =
    data?.code ||
    (data?._links?.broaderIscoGroup?.[0]?.uri || '') ||
    occupationUri;
  const iscoMatch = String(iscoCandidate).match(/(?:isco|^|\/|=)([1-9])\d*/);
  const iscoMajor = iscoMatch ? Number(iscoMatch[1]) : null;

  return { skills, altLabels, iscoMajor };
}

async function fetchSkillDetail(skillUri) {
  // Fetches description, reuse level, narrower skills, broader concept.
  // Fails silently - all fields are enhancement only.
  try {
    const url = `${ESCO_BASE}/resource/skill?uri=${encodeURIComponent(skillUri)}&language=en&selectedVersion=${ESCO_VERSION}`;
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) return {};
    const data = await res.json();

    const description = data?.description?.en?.literal || '';

    const reuseLevelLinks = data?._links?.hasReuseLevel || [];
    const reuseLevelRaw = reuseLevelLinks[0]?.uri || '';
    let reuseLevel = '';
    if (reuseLevelRaw.includes('transversal')) reuseLevel = 'Transversal';
    else if (reuseLevelRaw.includes('cross-sector')) reuseLevel = 'Cross-sector';
    else if (reuseLevelRaw.includes('sector-specific')) reuseLevel = 'Sector-specific';
    else if (reuseLevelRaw.includes('occupation-specific')) reuseLevel = 'Occupation-specific';

    const narrowerSkills = (data?._links?.narrowerSkill || [])
      .slice(0, 5)
      .map(s => s.title || '')
      .filter(Boolean);

    const broaderConcept = data?._links?.broaderHierarchyConcept?.[0]?.title || '';
    const altLabels = (data?.alternativeLabel?.en || []).slice(0, 6);

    return { description: description.trim(), reuseLevel, narrowerSkills, broaderConcept, altLabels };
  } catch (err) {
    return {};
  }
}

// ---- occupationFingerprint helpers ----------------------------------------

// ESCO is static; cache an occupation's essential-skill titles for the lifetime
// of the lambda instance so repeat fingerprints don't re-fetch.
const OCC_ESSENTIAL_CACHE = new Map(); // uri -> { label, code, skills:[titles] }

const STOP = new Set(['and','or','of','the','a','an','in','on','for','to','with','at','by','from','as','is','are','be','this','that','these','those','your','their','its','using','use','via','per','within','across','including','include']);
function normTokens(s) {
  return Array.from(new Set(String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && !STOP.has(t))));
}
function phraseMatch(a, b) {
  if (!a.length || !b.length) return false;
  const sa = new Set(a);
  const shared = b.filter(t => sa.has(t)).length;
  if (shared >= 2) return true;
  // single distinctive token that fully equals the other side's only meaningful token
  if (a.length === 1 && b.length === 1 && a[0] === b[0]) return true;
  return false;
}

async function searchOccupations(text, limit) {
  const url = `${ESCO_BASE}/search?text=${encodeURIComponent(text)}&type=occupation&language=en&selectedVersion=${ESCO_VERSION}&limit=${limit}`;
  try {
    const res = await fetchWithTimeout(url, ESCO_TIMEOUT_MS);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?._embedded?.results || []).map(r => ({ uri: r.uri, label: r.title || '' })).filter(r => r.uri && r.label);
  } catch (_) { return []; }
}

async function getOccupationEssential(uri) {
  if (OCC_ESSENTIAL_CACHE.has(uri)) return OCC_ESSENTIAL_CACHE.get(uri);
  const url = `${ESCO_BASE}/resource/occupation?uri=${encodeURIComponent(uri)}&language=en&selectedVersion=${ESCO_VERSION}`;
  try {
    const res = await fetchWithTimeout(url, ESCO_TIMEOUT_MS);
    if (!res.ok) { OCC_ESSENTIAL_CACHE.set(uri, null); return null; }
    const data = await res.json();
    const skills = (data?._links?.hasEssentialSkill || []).map(s => s.title).filter(Boolean);
    const code = (data?.code || '').toString();
    const out = { label: data?.title || '', code, skills };
    OCC_ESSENTIAL_CACHE.set(uri, out);
    return out;
  } catch (_) { OCC_ESSENTIAL_CACHE.set(uri, null); return null; }
}

function iscoMajorFromCode(code, uri) {
  const m = String(code || uri || '').match(/(?:^|[^0-9])([1-9])\d{2,}/);
  return m ? Number(m[1]) : null;
}

async function occupationFingerprint(title, skillPhrases) {
  const phrases = (Array.isArray(skillPhrases) ? skillPhrases : []).map(p => String(p || '').trim()).filter(Boolean).slice(0, 30);
  const phraseTokens = phrases.map(normTokens).filter(t => t.length);

  // 1) Candidate occupations: search on the CLEANED core title + the most distinctive skill phrases.
  const searchTerms = [cleanOccupationTitle(title).slice(0, 120)];
  for (const p of phrases.slice(0, 5)) if (p.length >= 4) searchTerms.push(p.slice(0, 120));
  const searchResults = await Promise.allSettled(searchTerms.map((t, i) => searchOccupations(t, i === 0 ? 8 : 5)));
  const nominalUri = (searchResults[0].status === 'fulfilled' && searchResults[0].value[0]) ? searchResults[0].value[0] : null;

  // Tally how often each occupation appears across the searches; keep the strongest.
  const tally = new Map(); // uri -> { uri, label, hits }
  searchResults.forEach(r => {
    if (r.status !== 'fulfilled') return;
    r.value.forEach((o, rank) => {
      const cur = tally.get(o.uri) || { uri: o.uri, label: o.label, hits: 0 };
      cur.hits += Math.max(1, 6 - rank); // earlier results weigh more
      tally.set(o.uri, cur);
    });
  });
  const candidates = Array.from(tally.values()).sort((a, b) => b.hits - a.hits).slice(0, 14);
  if (!candidates.length) return { candidates: [], nominal: null, fallback: true, reason: 'no_candidates' };

  // 2) Fetch each candidate's essential-skill list (cached, parallel).
  const details = await Promise.allSettled(candidates.map(c => getOccupationEssential(c.uri)));

  // 3) Score by overlap with the posting's skill phrases.
  const scored = candidates.map((c, i) => {
    const d = (details[i].status === 'fulfilled') ? details[i].value : null;
    if (!d || !d.skills.length) return null;
    const occTokens = d.skills.map(normTokens);
    const matchedSkills = [];
    let matchCount = 0;
    for (let pi = 0; pi < phraseTokens.length; pi++) {
      const pt = phraseTokens[pi];
      let best = null;
      for (let oi = 0; oi < occTokens.length; oi++) {
        if (phraseMatch(pt, occTokens[oi])) { best = d.skills[oi]; break; }
      }
      if (best) { matchCount++; matchedSkills.push(phrases[pi]); }
    }
    const denom = Math.max(phraseTokens.length, Math.min(d.skills.length, 25)) || 1;
    return {
      uri: c.uri,
      label: d.label || c.label,
      code: d.code || '',
      iscoMajor: iscoMajorFromCode(d.code, c.uri),
      essentialCount: d.skills.length,
      matchCount,
      ratio: matchCount / denom,
      matchedSkills: matchedSkills.slice(0, 8),
      isNominal: nominalUri ? c.uri === nominalUri.uri : false,
    };
  }).filter(Boolean).filter(s => s.matchCount > 0);

  if (!scored.length) return { candidates: [], nominal: nominalUri, fallback: true, reason: 'no_overlap' };

  // Composite score: overlap ratio is the signal; matchCount breaks ties.
  scored.sort((a, b) => (b.ratio - a.ratio) || (b.matchCount - a.matchCount) || a.label.localeCompare(b.label));
  return {
    candidates: scored.slice(0, 8),
    nominal: nominalUri ? { uri: nominalUri.uri, label: nominalUri.label } : null,
    phraseCount: phrases.length,
    fallback: false,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, title } = req.body || {};

  if (action === 'occupationFingerprint') {
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Invalid request. Required: action="occupationFingerprint", title=string' });
    }
    try {
      const out = await occupationFingerprint(title, req.body?.skillPhrases);
      return res.status(200).json(out);
    } catch (err) {
      console.error('ESCO occupationFingerprint error:', err.message);
      return res.status(200).json({ candidates: [], nominal: null, fallback: true, reason: 'error', error: err.message });
    }
  }

  if (action !== 'skills' || !title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Invalid request. Required: action="skills", title=string' });
  }

  const trimmedTitle = title.trim().slice(0, 140);

  try {
    const { uri: occupationUri, preferredLabel } = await resolveOccupation(trimmedTitle);
    const { skills, altLabels, iscoMajor } = await fetchOccupationDetail(occupationUri);

    const details = await Promise.all(
      skills.map(s => fetchSkillDetail(s.escoUri))
    );

    const skillsWithDetail = skills.map((s, i) => ({
      ...s,
      escoDescription:  details[i].description    || '',
      reuseLevel:       details[i].reuseLevel      || '',
      narrowerSkills:   details[i].narrowerSkills  || [],
      broaderConcept:   details[i].broaderConcept  || '',
      altLabels:        details[i].altLabels        || [],
    }));

    return res.status(200).json({
      skills: skillsWithDetail,
      occupationUri,
      escoVersion: ESCO_VERSION,
      needsHybrid: skills.length < HYBRID_THRESHOLD,
      skillCount: skills.length,
      escoOccupation: {
        uri: occupationUri,
        preferredLabel,
        altLabels,
        iscoMajor,
      },
    });

  } catch (err) {
    console.error('ESCO proxy error:', err.message);
    return res.status(200).json({
      skills: [],
      occupationUri: null,
      escoVersion: ESCO_VERSION,
      needsHybrid: true,
      skillCount: 0,
      fallback: true,
      error: err.message,
      escoOccupation: { uri: null, preferredLabel: '', altLabels: [], iscoMajor: null },
    });
  }
}
