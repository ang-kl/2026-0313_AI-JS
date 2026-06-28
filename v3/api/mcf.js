// v3/api/mcf.js - v3 - MyCareersFuture Singapore live job postings
// POST /api/mcf - body:
//   { action: "jobs", title, escoOccupation: { preferredLabel, altLabels, broaderConcept? },
//     skills: [{ skill, isEssential }], limit?: 10, detail?: false, detailLimit?: 5 }
//   { action: "company", company: "<name>", limit?: 50 }
//   { action: "job", uuid: "<uuid>" }
// Public unauthenticated MCF API (api.mycareersfuture.gov.sg/v2/jobs).
// Cascade: title+altLabels -> ESCO essential skills -> weighted keyword fallback.
// When detail:true, also fetches per-job detail pages for the top N jobs to get
// the full (un-truncated) description and derive a "responsibilitiesText" section.

export const config = {
  api: { bodyParser: true },
  maxDuration: 60,
};

import { requireTelegramSession } from '../server/telegram-session.js';

const MCF_BASE = 'https://api.mycareersfuture.gov.sg/v2/jobs';
const MCF_TIMEOUT_MS = 8000;
const MCF_DETAIL_TIMEOUT_MS = 6000;
const MAX_OUTBOUND_CALLS = 8; // <=3 search + <=5 detail
const TIER_THRESHOLD = 5;
const PAGE_SIZE = 30;
const DESC_CAP = 4000;
const RESP_CAP = 2500;
const DEFAULT_DETAIL_LIMIT = 5;

// ---- action: "company" consts ------------------------------------------------
// Repeated-strip suffix list (R007: ASCII only). Applied after lowercasing and
// punctuation-collapsing (CO1.5 step 3), so "Pte. Ltd." has already become
// "pte ltd" before this RE runs. Anchored at end; applied repeatedly until stable.
const COMPANY_SUFFIX_RE = /\s+(pte ltd|pte limited|private limited|ltd|limited|llp|lp|llc|inc|incorporated|co|company|corp|corporation|sg|singapore|s pte ltd|asia pacific|asia)$/i;
// Page budget for company mode. 3 pages * PAGE_SIZE(30) = 90 candidates max.
// Total outbound stays within MAX_OUTBOUND_CALLS(8): 3 search, 0 detail.
const COMPANY_MAX_PAGES = 3;
// CO2.4: max detail fetches for duty enrichment. 3 search + 5 detail = 8 = MAX_OUTBOUND_CALLS.
const COMPANY_DUTY_DETAIL_LIMIT = 5;

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
  // Rejoin orphaned bullet glyphs: "•\nText" -> "• Text" (some ads put the bullet
  // marker on its own line, with the item text on the following line).
  s = s.replace(/\n[ \t]*([•·▪‣])[ \t]*\n[ \t]*/g, '\n$1 ');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

const RESP_START_RE = /^[\s•\-*]*(key\s+)?(responsibilit|job\s+description|the\s+role|role\s+description|what\s+you('|’)?ll\s+do|what\s+you\s+will\s+do|duties|key\s+accountabilit|main\s+duties|job\s+scope|job\s+summary|primary\s+responsibilit|your\s+role|day\s+to\s+day|role\s+overview)/i;
const RESP_STOP_RE  = /^[\s•\-*]*(requirement|qualification|who\s+(you\s+are|we('|’)?re\s+looking)|what\s+we('|’)?re\s+looking|what\s+we\s+offer|we\s+offer|benefit|perks?\b|about\s+(us|the|our|you)|the\s+ideal|ideal\s+candidate|skills?\s*:|competenc|education\s*:|experience\s*:|to\s+be\s+successful|preferred\s+qualif|nice\s+to\s+have|minimum\s+requirement|key\s+requirement|desired\s+skills|pre[\s-]?requisites?|requisites?|what\s+we\s+(look\s+for|need))/i;

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
    // who POSTED the ad vs who is HIRING - when they differ (or the poster is a
    // recruitment/staffing firm) the role is likely agency-posted / outsourced. Both
    // already come from MCF; we just stop collapsing them so the client can flag it.
    postedCompanyName: j.postedCompany?.name || '',
    hiringCompanyName: j.hiringCompany?.name || '',
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
  if (!merged.postedCompanyName && detailRaw.postedCompany?.name) merged.postedCompanyName = detailRaw.postedCompany.name;
  if (!merged.hiringCompanyName && detailRaw.hiringCompany?.name) merged.hiringCompanyName = detailRaw.hiringCompany.name;
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

// ---- action: "company" helpers -----------------------------------------------

// Paged MCF search - offset version used exclusively by resolveCompany.
// Does NOT modify mcfSearch (frozen). Returns normalised jobs or [] on failure.
async function mcfSearchPage(query, offset) {
  if (!query || !query.trim()) return [];
  const url = `${MCF_BASE}?search=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}`;
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

// Deterministic company-name normaliser (CO1.5). Applied identically to the
// user query and to each MCF postedCompanyName / hiringCompanyName.
// Steps: decode HTML entities -> lowercase -> non-alphanumeric runs to single
// space -> trim -> repeatedly strip trailing legal suffix -> collapse + trim.
function normaliseCompanyName(raw) {
  let s = decodeEntities(String(raw || ''));
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, ' ');
  s = s.trim();
  // Strip trailing legal suffix tokens repeatedly until none remain.
  let prev;
  do {
    prev = s;
    s = s.replace(COMPANY_SUFFIX_RE, '').trim();
  } while (s !== prev);
  return s.replace(/\s+/g, ' ').trim();
}

// Whole-token-prefix match: does employer key e match query key q?
// EXACT: e === q
// PREFIX: e starts with (q + " ") OR q starts with (e + " ")
// NO substring match (guards "dbs" swallowing "dbsx").
function companyKeyMatches(q, e) {
  if (!q || !e) return false;
  if (e === q) return true;
  if (e.startsWith(q + ' ')) return true;
  if (q.startsWith(e + ' ')) return true;
  return false;
}

// Resolve employer from an MCF search: poll up to COMPANY_MAX_PAGES pages,
// filter jobs by matching company name, group by normalised employer key.
// Returns { matches, query, queryKey, ambiguous, totalPostings, pagesPolled, source }
// or throws on hard error (caught by caller).
// Never calls fetchJobDetail - search pages only.
async function resolveCompany(companyQuery, limitCap) {
  const query = String(companyQuery || '').trim();
  const queryKey = normaliseCompanyName(query);

  if (!queryKey) {
    return {
      matches: [], query, queryKey, ambiguous: false, totalPostings: 0,
      pagesPolled: 0, fallback: true, ...WARM_ERRORS.empty,
      source: 'MyCareersFuture Singapore',
    };
  }

  // Poll up to COMPANY_MAX_PAGES search pages. Use the original query as the
  // MCF full-text search term so MCF pre-filters candidate postings.
  let allJobs = [];
  let pagesPolled = 0;
  for (let page = 0; page < COMPANY_MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const hits = await mcfSearchPage(query, offset);
    pagesPolled++;
    allJobs = allJobs.concat(hits);
    if (hits.length < PAGE_SIZE) break; // last page reached
  }

  // Deduplicate by uuid.
  const seen = new Set();
  const unique = [];
  for (const j of allJobs) {
    if (seen.has(j.uuid)) continue;
    seen.add(j.uuid);
    unique.push(j);
  }

  // Filter: keep only jobs whose posted OR hiring company key matches the query key.
  const filtered = unique.filter(j => {
    const pk = normaliseCompanyName(j.postedCompanyName);
    const hk = normaliseCompanyName(j.hiringCompanyName);
    return companyKeyMatches(queryKey, pk) || companyKeyMatches(queryKey, hk);
  });

  if (!filtered.length) {
    return {
      matches: [], query, queryKey, ambiguous: false, totalPostings: 0,
      pagesPolled, fallback: true,
      code: 'EMPTY',
      message: 'No live MyCareersFuture postings found for that company.',
      source: 'MyCareersFuture Singapore',
    };
  }

  // Group by normalised employer key. The key is derived from postedCompanyName
  // (preferred) or hiringCompanyName. displayName is the verbatim MCF name from
  // the first (latest-posted) job in the group - never re-cased by us.
  const groups = {};
  for (const j of filtered) {
    const pk = normaliseCompanyName(j.postedCompanyName);
    const hk = normaliseCompanyName(j.hiringCompanyName);
    // Use whichever key actually matched the query.
    const matchKey = companyKeyMatches(queryKey, pk) ? pk : hk;
    const verbatim = companyKeyMatches(queryKey, pk)
      ? (j.postedCompanyName || j.hiringCompanyName)
      : (j.hiringCompanyName || j.postedCompanyName);
    if (!groups[matchKey]) {
      groups[matchKey] = { key: matchKey, displayName: verbatim, jobs: [] };
    }
    groups[matchKey].jobs.push(j);
  }

  // Sort groups: count desc, then displayName asc.
  let matches = Object.values(groups).sort((a, b) => {
    const dc = b.jobs.length - a.jobs.length;
    return dc !== 0 ? dc : a.displayName.localeCompare(b.displayName);
  });

  // Apply limit cap to the jobs within each match (not to the groups themselves).
  if (limitCap > 0) {
    matches = matches.map(m => ({ ...m, jobs: m.jobs.slice(0, limitCap) }));
  }

  // Add count as a stable field (pass-through arithmetic, never minted).
  matches = matches.map(m => ({ ...m, count: m.jobs.length }));

  const totalPostings = matches.reduce((acc, m) => acc + m.count, 0);
  const ambiguous = matches.length >= 2;

  return {
    matches, query, queryKey, ambiguous, totalPostings, pagesPolled,
    source: 'MyCareersFuture Singapore',
  };
}

export default async function handler(req, res) {
  if (!requireTelegramSession(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, title, escoOccupation, skills, limit, detail, detailLimit } = req.body || {};

  // ---- action: "company" — resolve employer name + list its live postings --------
  // Deterministic: no LLM, no invented count. Polls MCF search pages only (no
  // per-job detail fetch). resolveCompany normalises the name and groups by key.
  // CO2.4: optional duties:true flag - when a single employer is confirmed,
  // detail-fetches the top COMPANY_DUTY_DETAIL_LIMIT postings to get full
  // responsibilitiesText. Budget: pagesPolled + detail <= MAX_OUTBOUND_CALLS.
  // Ambiguous result -> dutiesWithheld:"ambiguous"; never duty-fetches across groups.
  if (action === 'company') {
    const company = (req.body?.company || '').toString().trim();
    if (!company) {
      return res.status(400).json({ error: 'Required: action="company", company=string' });
    }
    const limitCap = Math.max(1, Math.min(50, Number(req.body?.limit) || 50));
    const wantDuties = req.body?.duties === true;
    const detailLimitReq = Math.max(1, Math.min(COMPANY_DUTY_DETAIL_LIMIT, Number(req.body?.detailLimit) || COMPANY_DUTY_DETAIL_LIMIT));
    try {
      const result = await resolveCompany(company, limitCap);

      // CO2.4: duty enrichment - only when a single employer group is confirmed.
      if (wantDuties) {
        if (result.ambiguous || result.matches.length !== 1) {
          // Multiple or zero matches: withhold duties until user picks.
          result.dutiesWithheld = 'ambiguous';
        } else if (result.matches.length === 1) {
          const group = result.matches[0];
          // Budget: already spent pagesPolled search calls. Remaining = MAX_OUTBOUND_CALLS - pagesPolled.
          const budgetRemaining = Math.max(0, MAX_OUTBOUND_CALLS - (result.pagesPolled || 0));
          const fetchCount = Math.min(detailLimitReq, group.jobs.length, budgetRemaining);
          // Sort jobs by postedDate desc (most recent first) to pick top N.
          const sorted = group.jobs.slice().sort((a, b) => {
            const da = a.postedDate ? new Date(a.postedDate).getTime() : 0;
            const db = b.postedDate ? new Date(b.postedDate).getTime() : 0;
            return db - da;
          });
          // Detail-fetch top fetchCount jobs in parallel, graceful on failure.
          const toFetch = sorted.slice(0, fetchCount);
          const fetchedUuids = new Set(toFetch.map(j => j.uuid));
          const details = fetchCount > 0
            ? await Promise.allSettled(toFetch.map(j => fetchJobDetail(j.uuid)))
            : [];
          const detailMap = {};
          toFetch.forEach((j, i) => {
            const d = details[i];
            if (d && d.status === 'fulfilled' && d.value) detailMap[j.uuid] = d.value;
          });
          // Rebuild the group's jobs with enriched responsibilitiesText + dutyDetail flag.
          const enrichedJobs = group.jobs.map(j => {
            if (!fetchedUuids.has(j.uuid)) return { ...j, dutyDetail: false };
            const merged = mergeDetail(j, detailMap[j.uuid] || null);
            return { ...merged, dutyDetail: !!detailMap[j.uuid] };
          });
          // Patch the match in-place (result is a plain object).
          result.matches = [{ ...group, jobs: enrichedJobs }];
          result.dutiesEnriched = true;
          result.detailFetched = toFetch.filter(j => !!detailMap[j.uuid]).length;
        }
      }

      return res.status(200).json(result);
    } catch (err) {
      const isTimeout = err && err.name === 'AbortError';
      return res.status(200).json({
        matches: [], query: company, queryKey: normaliseCompanyName(company),
        ambiguous: false, totalPostings: 0, pagesPolled: 0,
        fallback: true,
        ...(isTimeout ? WARM_ERRORS.timeout : WARM_ERRORS.server),
        source: 'MyCareersFuture Singapore',
      });
    }
  }

  // ---- action: "job" — fetch ONE posting by uuid (+ a rough live-demand proxy) ----
  // Powers the ?view=leap stakeholder graph. Best-effort, always 200 with a warm
  // empty on failure (mirrors the rest of this handler).
  if (action === 'job') {
    const uuid = (req.body?.uuid || '').toString().trim();
    if (!uuid) return res.status(400).json({ error: 'Required: action="job", uuid=string' });
    try {
      const raw = await fetchJobDetail(uuid);
      const job = raw ? normaliseJob(raw) : null;
      if (!job) {
        return res.status(200).json({ job: null, fallback: true, ...WARM_ERRORS.empty, source: 'MyCareersFuture Singapore' });
      }
      // rough live-demand proxy: how many similar live postings share the title (1 call, capped)
      let demand = null;
      try { demand = (await mcfSearch(`"${job.title}"`, { limit: 30 })).length; } catch (_) {}
      return res.status(200).json({ job, demand, source: 'MyCareersFuture Singapore' });
    } catch (err) {
      return res.status(200).json({ job: null, fallback: true, ...WARM_ERRORS.server, source: 'MyCareersFuture Singapore' });
    }
  }

  if (action !== 'jobs' || !title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Invalid request. Required: action="jobs", title=string' });
  }

  const cap = Math.max(1, Math.min(50, Number(limit) || 10));
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
        jobs, tier: 1, total: tier1Hits.length, capped: tier1Hits.length > cap, detail: wantDetail,
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
        jobs, tier: 2, total: tier2Hits.length, capped: tier2Hits.length > cap, detail: wantDetail,
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
        const scoredAll = broadHits
          .map(j => ({ job: j, score: scoreJob(j, tokens, broaderConcept) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score);
        const scored = scoredAll.slice(0, cap).map(x => x.job);
        if (scored.length) {
          const jobs = await enrich(scored);
          return res.status(200).json({
            jobs, tier: 3, approximate: true, total: scoredAll.length, capped: scoredAll.length > cap, detail: wantDetail,
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
        jobs, tier: 2, approximate: true, total: merged.length, capped: merged.length > cap, detail: wantDetail,
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
