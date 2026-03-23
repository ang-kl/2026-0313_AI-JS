// api/esco.js - v2 Phase 1 - ESCO REST API proxy
// POST /api/esco - body: { "action": "skills", "title": "Facilities Manager" }

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

async function resolveOccupationUri(title) {
  const url = `${ESCO_BASE}/search?text=${encodeURIComponent(title)}&type=occupation&language=en&selectedVersion=${ESCO_VERSION}&limit=10`;
  const res = await fetchWithTimeout(url, ESCO_TIMEOUT_MS);
  if (!res.ok) throw new Error(`ESCO search HTTP ${res.status}`);
  const data = await res.json();
  const results = data?._embedded?.results;
  if (!results || results.length === 0) throw new Error('No occupation found');
  const needle = title.trim().toLowerCase();
  const exactMatch = results.find(r => r.title && r.title.toLowerCase() === needle);
  return exactMatch ? exactMatch.uri : results[0].uri;
}

async function fetchEssentialSkills(occupationUri) {
  const url = `${ESCO_BASE}/resource/occupation?uri=${encodeURIComponent(occupationUri)}&language=en&selectedVersion=${ESCO_VERSION}`;
  const res = await fetchWithTimeout(url, ESCO_TIMEOUT_MS);
  if (!res.ok) throw new Error(`ESCO occupation HTTP ${res.status}`);
  const data = await res.json();
  const links = data?._links?.hasEssentialSkill;
  if (!links || links.length === 0) return [];
  return links.map(s => ({
    skill: s.title,
    escoUri: s.uri,
    skillType: s.skillType || 'skill/competence',
    isEssential: true,
    isExtended: false
  }));
}

async function fetchSkillDetail(skillUri) {
  // Fetches description, reuse level, narrower skills, broader concept
  // Fails silently - all fields are enhancement only
  try {
    const url = `${ESCO_BASE}/resource/skill?uri=${encodeURIComponent(skillUri)}&language=en&selectedVersion=${ESCO_VERSION}`;
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) return {};
    const data = await res.json();

    // Description - plain text English
    const description = data?.description?.en?.literal || '';

    // Reuse level - extract from hasReuseLevel URI title
    const reuseLevelLinks = data?._links?.hasReuseLevel || [];
    const reuseLevelRaw = reuseLevelLinks[0]?.uri || '';
    let reuseLevel = '';
    if (reuseLevelRaw.includes('transversal')) reuseLevel = 'Transversal';
    else if (reuseLevelRaw.includes('cross-sector')) reuseLevel = 'Cross-sector';
    else if (reuseLevelRaw.includes('sector-specific')) reuseLevel = 'Sector-specific';
    else if (reuseLevelRaw.includes('occupation-specific')) reuseLevel = 'Occupation-specific';

    // Narrower skills - up to 5
    const narrowerSkills = (data?._links?.narrowerSkill || [])
      .slice(0, 5)
      .map(s => s.title || '')
      .filter(Boolean);

    // Broader concept - first entry title only
    const broaderConcept = data?._links?.broaderHierarchyConcept?.[0]?.title || '';

    // Alternative labels - English only, up to 6
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
    const occupationUri = await resolveOccupationUri(trimmedTitle);
    const skills = await fetchEssentialSkills(occupationUri);

    // Fetch all skill details in parallel - fail silently per skill
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
      skillCount: skills.length
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
      error: err.message
    });
  }
}
