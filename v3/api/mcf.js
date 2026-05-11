// v3/api/mcf.js - v3 - MyCareersFuture Singapore live job postings
// POST /api/mcf - body:
//   { action: "jobs", title, escoOccupation: { preferredLabel, altLabels, broaderConcept? },
//     skills: [{ skill, isEssential }], limit?: 10, detail?: false, detailLimit?: 5 }
// Public unauthenticated MCF API (api.mycareersfuture.gov.sg/v2/jobs).
// Cascade: title+altLabels -> ESCO essential skills -> weighted keyword fallback.
// When detail:true, also fetches per-job detail pages for the top N jobs to get
// the full (un-truncated) description and derive a "responsibilitiesText" section.

export const config = {
  api: { bodyParser: true },
  maxDuration: 60,
};

const MCF_BASE = 'https://api.mycareersfuture.gov.sg/v2/jobs';
const MCF_TIMEOUT_MS = 8000;
const MCF_DETAIL_TIMEOUT_MS = 6000;
const MAX_OUTBOUND_CALLS = 8; // <=3 search + <=5 detail
const TIER_THRESHOLD = 5;
const PAGE_SIZE = 20;
const DESC_CAP = 4000;
const RESP_CAP = 2500;
const DEFAULT_DETAIL_LIMIT = 5;

const WARM_ERRORS = {
  busy:     { code:'BUSY',     message:'MyCareersFuture is taking a short break. Please try again in a moment.' },
  timeout:  { code:'TIMEOUT',  message:'That one took a little longer than expected. Please try again - it usually resolves on the second attempt.' },
  server:   { code:'SERVER',   message:'Something went wrong fetching live jobs. Please wait a moment and try again.' },
  empty:    { code:'EMPTY',    message:'No matching live jobs on MyCareersFuture right now. Check back tomorrow - postings refresh daily.' },
};

const STOPWORDS = new Set([
  'and','or','of','the','a','an','in','on','for','to','with','at','by','from',
  'is','are','be','as','that','this','it','its','these','those','your','our',
  'job','jobs','role','roles','singapore','sg'
]);

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'accept': 'application/json' },
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ---- HTML / text helpers --------------------------------------------------

const HTML_ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&apos;': "'", '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘',
  '&ldquo;': '“', '&rdquo;': '”', '&hellip;': '…', '&mdash;': '—',
  '&ndash;': '–', '&bull;': '•',
};

function decodeEntities(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, n) => {
      const code = parseInt(n, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
      const code = parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&[a-zA-Z][a-zA-Z0-9]+;|&#39;/g, (m) => HTML_ENTITIES[m] || m);
}

// Convert an HTML-ish description into plain text with line breaks preserved
// for block-level elements / list items.
function htmlToText(html) {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<\s*(br|hr)\s*\/?\s*>/gi, '\n');
  s = s.replace(/<\s*\/\s*(p|div|li|tr|h[1-6]|ul|ol|section|article)\s*>/gi, '\n');
  s = s.replace(/<\s*li[^>]*>/gi, '\n• ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  s = s.replace(/\r/g, '');
  s = s.replace(/[ \t ]+/g, ' ');
  s = s.replace(/ *\n */g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

const RESP_START_RE = /^[\s•\-*]*(key\s+)?(responsibilit|job\s+description|the\s+role|role\s+description|what\s+you('|’)?ll\s+do|what\s+you\s+will\s+do|duties|key\s+accountabilit|main\s+duties|job\s+scope|job\s+summary|primary\s+responsibilit|your\s+role|day\s+to\s+day|role\s+overview)/i;
const RESP_STOP_RE  = /^[\s•\-*]*(requirement|qualification|who\s+(you\s+are|we('|’)?re\s+looking)|what\s+we('|’)?re\s+looking|what\s+we\s+offer|we\s+offer|benefit|perks?\b|about\s+(us|the|our|you)|the\s+ideal|ideal\s+candidate|skills?\s*:|competenc|education\s*:|experience\s*:|to\s+be\s+successful|preferred\s+qualif|nice\s+to\s+have|minimum\s+requirement|key\s+requirement|desired\s+skills)/i;

// Heuristically extract the "responsibilities / duties" portion of a job
// description. Falls back to the full text when no clear section is found.
function extractResponsibilities(text) {
  const clean = htmlToText(text);
  if (!clean) return '';
  const lines = clean.split('\n');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.length <= 80 && RESP_START_RE.test(line)) { startIdx = i; break; }
  }
  if (startIdx === -1) {
    return clean.slice(0, RESP_CAP);
  }
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.length <= 80 && RESP_STOP_RE.test(line)) { endIdx = i; break; }
  }
  const section = lines.slice(startIdx, endIdx).join('\n').trim();
  return (section || clean).slice(0, RESP_CAP);
}

// ---- Job normalisation ----------------------------------------------------

// Trim each MCF job to the fields the UI needs. Strip everything else
// (no PII, no recruiter contact details).
function normaliseJob(j) {
  if (!j || !j.uuid) return null;
  const employer =
    j.postedCompany?.name ||
    j.hiringCompany?.name ||
    j.metadata?.companyName ||
    '';
  const salary = j.salary || {};
  const slug = (j.metadata?.jobPostId || j.uuid || '').toString();
  const mcfUrl = j.metadata?.jobDetailsUrl
    || (slug ? `https://www.mycareersfuture.gov.sg/job/${slug}` : 'https://www.mycareersfuture.gov.sg/');
  const skills = Array.isArray(j.skills)
    ? j.skills.map(s => (typeof s === 'string' ? s : s?.skill || '')).filter(Boolean).slice(0, 12)
    : [];
  const categories = Array.isArray(j.categories)
    ? j.categories.map(c => (typeof c === 'string' ? c : c?.category || '')).filter(Boolean)
    : [];
  const positionLevels = Array.isArray(j.positionLevels)
    ? j.positionLevels.map(p => (typeof p === 'string' ? p : p?.position || '')).filter(Boolean)
    : [];
  const schemes = Array.isArray(j.schemes)
    ? j.schemes.map(s => (typeof s === 'string' ? s : s?.scheme?.scheme || s?.scheme || s?.scheme_name || '')).filter(Boolean)
    : [];
  const rawDesc = (j.description || '').toString();
  return {
    uuid: j.uuid,
    title: j.title || '',
    employer,
    salaryMin: salary.minimum ?? null,
    salaryMax: salary.maximum ?? null,
    employmentType: Array.isArray(j.employmentTypes)
      ? j.employmentTypes.map(t => t?.employmentType || t).filter(Boolean).join(', ')
      : '',
    postedDate: j.metadata?.originalPostingDate || j.metadata?.newPostingDate || '',
    expiryDate: j.metadata?.expiryDate || '',
    minimumYearsExperience: (typeof j.minimumYearsExperience === 'number') ? j.minimumYearsExperience : null,
    positionLevels,
    schemes,
    description: rawDesc.slice(0, DESC_CAP),
    responsibilitiesText: extractResponsibilities(rawDesc),
    categories,
    skills,
    mcfUrl,
  };
}

// Fetch a single job's detail page. Returns the raw job object or null.
// MCF detail endpoint: GET /v2/jobs/{uuid}
async function fetchJobDetail(uuid) {
  if (!uuid) return null;
  const url = `${MCF_BASE}/${encodeURIComponent(uuid)}`;
  try {
    const res = await fetchWithTimeout(url, MCF_DETAIL_TIMEOUT_MS);
    if (!res.ok) return null;
    const data = await res.json();
    // Some endpoints wrap the job; tolerate both shapes.
    return (data && data.uuid) ? data : (data?.result || data?.job || null);
  } catch (err) {
    return null;
  }
}

// Merge a fuller detail object onto an already-normalised job (keeping the
// existing fields when detail is missing/empty).
function mergeDetail(normalised, detailRaw) {
  if (!detailRaw) return normalised;
  const merged = { ...normalised };
  const rawDesc = (detailRaw.description || '').toString();
  if (rawDesc && rawDesc.length > (normalised.description || '').length) {
    merged.description = rawDesc.slice(0, DESC_CAP);
    merged.responsibilitiesText = extractResponsibilities(rawDesc);
  }
  if ((!merged.skills || !merged.skills.length) && Array.isArray(detailRaw.skills)) {
    merged.skills = detailRaw.skills.map(s => (typeof s === 'string' ? s : s?.skill || '')).filter(Boolean).slice(0, 12);
  }
  if ((!merged.categories || !merged.categories.length) && Array.isArray(detailRaw.categories)) {
    merged.categories = detailRaw.categories.map(c => (typeof c === 'string' ? c : c?.category || '')).filter(Boolean);
  }
  if (merged.minimumYearsExperience == null && typeof detailRaw.minimumYearsExperience === 'number') {
    merged.minimumYearsExperience = detailRaw.minimumYearsExperience;
  }
  if ((!merged.positionLevels || !merged.positionLevels.length) && Array.isArray(detailRaw.positionLevels)) {
    merged.positionLevels = detailRaw.positionLevels.map(p => (typeof p === 'string' ? p : p?.position || '')).filter(Boolean);
  }
  return merged;
}

function dedupe(jobs) {
  const seen = new Set();
  const out = [];
  for (const j of jobs) {
    if (seen.has(j.uuid)) continue;
    seen.add(j.uuid);
    out.push(j);
  }
  return out;
}

function tokenise(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function scoreJob(job, tokens, broaderConcept) {
  const title = (job.title || '').toLowerCase();
  const haystack = `${(job.description || '').toLowerCase()} ${job.skills.join(' ').toLowerCase()}`;
  let score = 0;
  for (const t of tokens) {
    if (title.includes(t)) score += 3;
    else if (haystack.includes(t)) score += 1;
  }
  if (broaderConcept) {
    const bc = broaderConcept.toLowerCase();
    if (job.categories.some(c => c.toLowerCase().includes(bc))) score += 2;
  }
  return score;
}

// Single MCF search call. Returns array of normalised jobs (or [] on failure).
// MCF v2 search uses ?search=<term>&limit=&offset=. Quoted phrases allowed.
async function mcfSearch(query, { limit = PAGE_SIZE } = {}) {
  if (!query || !query.trim()) return [];
  const url = `${MCF_BASE}?search=${encodeURIComponent(query)}&limit=${limit}&offset=0`;
  try {
    const res = await fetchWithTimeout(url, MCF_TIMEOUT_MS);
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.results || [];
    return results.map(normaliseJob).filter(Boolean);
  } catch (err) {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, title, escoOccupation, skills, limit, detail, detailLimit } = req.body || {};
  if (action !== 'jobs' || !title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Invalid request. Required: action="jobs", title=string' });
  }

  const cap = Math.max(1, Math.min(20, Number(limit) || 10));
  const wantDetail = detail === true;
  const detLimit = Math.max(1, Math.min(8, Number(detailLimit) || DEFAULT_DETAIL_LIMIT));
  const occ = escoOccupation || {};
  const skillList = Array.isArray(skills) ? skills : [];

  let outboundCalls = 0;
  const callIfBudget = async (fn) => {
    if (outboundCalls >= MAX_OUTBOUND_CALLS) return [];
    outboundCalls += 1;
    return fn();
  };

  // After the cascade picks a result set, optionally enrich the top jobs with
  // their detail pages (run in parallel, fully graceful on failure).
  const enrich = async (jobs) => {
    if (!wantDetail || !jobs.length) return jobs;
    const headCount = Math.min(detLimit, jobs.length, Math.max(0, MAX_OUTBOUND_CALLS - outboundCalls));
    if (headCount <= 0) return jobs;
    const head = jobs.slice(0, headCount);
    outboundCalls += headCount;
    const details = await Promise.allSettled(head.map(j => fetchJobDetail(j.uuid)));
    const enrichedHead = head.map((j, i) => {
      const d = details[i];
      return (d && d.status === 'fulfilled' && d.value) ? mergeDetail(j, d.value) : j;
    });
    return enrichedHead.concat(jobs.slice(headCount));
  };

  try {
    // ---- Tier 1: canonical title (user title + ESCO preferredLabel + altLabels) ----
    const tier1Queries = [];
    const seenQ = new Set();
    const pushQ = (q) => {
      const k = (q || '').trim().toLowerCase();
      if (k && !seenQ.has(k)) { seenQ.add(k); tier1Queries.push(q.trim()); }
    };
    pushQ(title);
    pushQ(occ.preferredLabel || '');
    for (const a of (occ.altLabels || []).slice(0, 4)) pushQ(a);

    let tier1Hits = [];
    for (const q of tier1Queries) {
      if (outboundCalls >= MAX_OUTBOUND_CALLS) break;
      const hits = await callIfBudget(() => mcfSearch(`"${q}"`, { limit: PAGE_SIZE }));
      tier1Hits = dedupe(tier1Hits.concat(hits));
      if (tier1Hits.length >= TIER_THRESHOLD) break;
    }
    if (tier1Hits.length >= TIER_THRESHOLD) {
      const jobs = await enrich(tier1Hits.slice(0, cap));
      return res.status(200).json({
        jobs, tier: 1, total: tier1Hits.length, detail: wantDetail,
        source: 'MyCareersFuture Singapore',
      });
    }

    // ---- Tier 2: ESCO essential skills ----
    let tier2Hits = tier1Hits.slice();
    const topSkills = skillList.filter(s => s && s.isEssential !== false).slice(0, 3);
    for (const s of topSkills) {
      if (outboundCalls >= MAX_OUTBOUND_CALLS) break;
      const hits = await callIfBudget(() => mcfSearch(s.skill || '', { limit: PAGE_SIZE }));
      tier2Hits = dedupe(tier2Hits.concat(hits));
      if (tier2Hits.length >= TIER_THRESHOLD) break;
    }
    if (tier2Hits.length >= TIER_THRESHOLD) {
      const jobs = await enrich(tier2Hits.slice(0, cap));
      return res.status(200).json({
        jobs, tier: 2, total: tier2Hits.length, detail: wantDetail,
        source: 'MyCareersFuture Singapore',
      });
    }

    // ---- Tier 3: weighted keyword fallback (only if 1 + 2 both empty) ----
    if (tier1Hits.length === 0 && tier2Hits.length === 0 && outboundCalls < MAX_OUTBOUND_CALLS) {
      const tokens = Array.from(new Set([
        ...tokenise(title),
        ...skillList.flatMap(s => tokenise(s?.skill || '')),
      ])).slice(0, 6);
      if (tokens.length) {
        const broadQuery = tokens.slice(0, 3).join(' ');
        const broadHits = await callIfBudget(() => mcfSearch(broadQuery, { limit: PAGE_SIZE * 2 }));
        const broaderConcept =
          (skillList.find(s => s?.broaderConcept)?.broaderConcept) || '';
        const scored = broadHits
          .map(j => ({ job: j, score: scoreJob(j, tokens, broaderConcept) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, cap)
          .map(x => x.job);
        if (scored.length) {
          const jobs = await enrich(scored);
          return res.status(200).json({
            jobs, tier: 3, approximate: true, total: scored.length, detail: wantDetail,
            source: 'MyCareersFuture Singapore',
          });
        }
      }
    }

    // Nothing matched anywhere - return whatever scraps tiers 1+2 produced
    // (could be 1-4 jobs) or a warm empty.
    const merged = dedupe(tier2Hits);
    if (merged.length) {
      const jobs = await enrich(merged.slice(0, cap));
      return res.status(200).json({
        jobs, tier: 2, approximate: true, total: merged.length, detail: wantDetail,
        source: 'MyCareersFuture Singapore',
      });
    }
    return res.status(200).json({
      jobs: [],
      tier: 0,
      total: 0,
      fallback: true,
      ...WARM_ERRORS.empty,
      source: 'MyCareersFuture Singapore',
    });

  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.error(`[mcf] ${isTimeout ? 'Timeout' : 'Fetch error'}:`, err.message);
    return res.status(200).json({
      jobs: [],
      tier: 0,
      total: 0,
      fallback: true,
      ...(isTimeout ? WARM_ERRORS.timeout : WARM_ERRORS.server),
      source: 'MyCareersFuture Singapore',
    });
  }
}
