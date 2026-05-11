// v3/api/esco.js - v3 - ESCO REST API proxy with occupation label passthrough
// POST /api/esco - body: { "action": "skills", "title": "Facilities Manager" }
// Same shape as v2/api/esco.js with one addition:
//   response.escoOccupation = { uri, preferredLabel, altLabels, iscoMajor }
// so the frontend can forward canonical labels to /api/mcf and the
// ISCO major group to /api/datagov without a second ESCO round-trip.

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

// Returns { uri, preferredLabel } picked from the search result that best
// matches the user's title (case-insensitive exact match if present, else
// the first/highest-ranked result).
async function resolveOccupation(title) {
  const url = `${ESCO_BASE}/search?text=${encodeURIComponent(title)}&type=occupation&language=en&selectedVersion=${ESCO_VERSION}&limit=10`;
  const res = await fetchWithTimeout(url, ESCO_TIMEOUT_MS);
  if (!res.ok) throw new Error(`ESCO search HTTP ${res.status}`);
  const data = await res.json();
  const results = data?._embedded?.results;
  if (!results || results.length === 0) throw new Error('No occupation found');
  const needle = title.trim().toLowerCase();
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, title } = req.body || {};

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
