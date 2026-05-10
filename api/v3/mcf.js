// v3/api/mcf.js - v3 - MyCareersFuture Singapore live job postings
// POST /api/v3/mcf - body:
//   { action: "jobs", title, escoOccupation: { preferredLabel, altLabels, broaderConcept? },
//     skills: [{ skill, isEssential }], limit?: 10 }
// Public unauthenticated MCF API (api.mycareersfuture.gov.sg/v2/jobs).
// Cascade: title+altLabels -> ESCO essential skills -> weighted keyword fallback.

export const config = {
  api: { bodyParser: true },
  maxDuration: 30,
};

const MCF_BASE = 'https://api.mycareersfuture.gov.sg/v2/jobs';
const MCF_TIMEOUT_MS = 8000;
const MAX_OUTBOUND_CALLS = 3;
const TIER_THRESHOLD = 5;
const PAGE_SIZE = 20;

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
    ? j.skills.map(s => (typeof s === 'string' ? s : s?.skill || '')).filter(Boolean).slice(0, 8)
    : [];
  const categories = Array.isArray(j.categories)
    ? j.categories.map(c => (typeof c === 'string' ? c : c?.category || '')).filter(Boolean)
    : [];
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
    description: (j.description || '').slice(0, 800),
    categories,
    skills,
    mcfUrl,
  };
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, title, escoOccupation, skills, limit } = req.body || {};
  if (action !== 'jobs' || !title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Invalid request. Required: action="jobs", title=string' });
  }

  const cap = Math.max(1, Math.min(20, Number(limit) || 10));
  const occ = escoOccupation || {};
  const skillList = Array.isArray(skills) ? skills : [];

  let outboundCalls = 0;
  const callIfBudget = async (fn) => {
    if (outboundCalls >= MAX_OUTBOUND_CALLS) return [];
    outboundCalls += 1;
    return fn();
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
      return res.status(200).json({
        jobs: tier1Hits.slice(0, cap),
        tier: 1,
        total: tier1Hits.length,
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
      return res.status(200).json({
        jobs: tier2Hits.slice(0, cap),
        tier: 2,
        total: tier2Hits.length,
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
          return res.status(200).json({
            jobs: scored,
            tier: 3,
            approximate: true,
            total: scored.length,
            source: 'MyCareersFuture Singapore',
          });
        }
      }
    }

    // Nothing matched anywhere - return whatever scraps tiers 1+2 produced
    // (could be 1-4 jobs) or a warm empty.
    const merged = dedupe(tier2Hits);
    if (merged.length) {
      return res.status(200).json({
        jobs: merged.slice(0, cap),
        tier: 2,
        approximate: true,
        total: merged.length,
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
