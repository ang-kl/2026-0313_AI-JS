// v3/api/careers.js - careers.gov.sg second job source proxy
// POST /api/careers
//   { action: "jobs", title, limit?: 10 }
//   { action: "job",  uuid }          -- synthetic uuid "csg:{platform}:{jobId}:{postingNo}"
// Fetches https://raw.githubusercontent.com/opengovsg/careersgovsg-jobs-data/main/data/job-listings.json
// once, caches in module scope (6h TTL + hard size guard + AbortController timeout).
// Maps each hit through normaliseCsgJob() into the exact field set that api/mcf.js:normaliseJob()
// returns, PLUS source:"careers.gov.sg". Always returns HTTP 200 with a warm-empty on any failure.
// MIT-licensed source data (Open Government Products).

export const config = {
  api: { bodyParser: true },
  maxDuration: 30,
};

const CSG_DUMP_URL =
  "https://raw.githubusercontent.com/opengovsg/careersgovsg-jobs-data/main/data/job-listings.json";
const CACHE_TTL_MS   = 6 * 60 * 60 * 1000; // 6 hours
const FETCH_TIMEOUT  = 20000;               // 20s cold-start budget
const MAX_BYTES      = 50 * 1024 * 1024;    // 50 MB hard guard
const DESC_CAP       = 4000;
const RESP_CAP       = 2500;

const STOPWORDS = new Set([
  "and","or","of","the","a","an","in","on","for","to","with","at","by","from",
  "is","are","be","as","that","this","it","its","these","those","your","our",
  "job","jobs","role","roles","singapore","sg",
]);

// ---- module-scope cache -------------------------------------------------------
let _cache = null; // { data: Array, fetchedAt: number }

async function getDump() {
  const now = Date.now();
  if (_cache && now - _cache.fetchedAt < CACHE_TTL_MS) return _cache.data;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  let data;
  try {
    const res = await fetch(CSG_DUMP_URL, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Guard against unexpectedly large responses
    const contentLength = Number(res.headers.get("content-length") || 0);
    if (contentLength > MAX_BYTES) throw new Error("dump too large");
    const text = await res.text();
    if (text.length > MAX_BYTES) throw new Error("dump too large");
    data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("unexpected shape");
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
  _cache = { data, fetchedAt: now };
  return data;
}

// ---- HTML / text helpers (own copy; must not import from frozen mcf.js) -------

const HTML_ENTITIES = {
  "&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'",
  "&apos;":"'","&nbsp;":" ","&rsquo;":"’","&lsquo;":"‘",
  "&ldquo;":"“","&rdquo;":"”","&hellip;":"…",
  "&mdash;":"—","&ndash;":"–","&bull;":"•",
};

function decodeEntities(s) {
  return String(s || "")
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

function htmlToText(html) {
  if (!html) return "";
  let s = String(html);
  s = s.replace(/<\s*(br|hr)\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\s*\/\s*(p|div|li|tr|h[1-6]|ul|ol|section|article)\s*>/gi, "\n");
  s = s.replace(/<\s*li[^>]*>/gi, "\n- ");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  s = s.replace(/\r/g, "");
  s = s.replace(/[ \t ]+/g, " ");
  s = s.replace(/ *\n */g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

// ---- Canonical URL per platform (CSG1) ----------------------------------------
function csgUrl(platform, jobId, postingNo) {
  const p = (platform || "").toLowerCase();
  if (p === "hrp") {
    return `https://jobs.careers.gov.sg/jobs/${platform}/${jobId}/${postingNo}`;
  }
  if (p === "greenhouse") {
    return `https://jobs.careers.gov.sg/jobs/${platform}/${jobId}?gh_jid=${jobId}`;
  }
  if (p === "workable") {
    return `https://apply.workable.com/j/${postingNo}`;
  }
  // unknown platform - use the generic careers.gov.sg search
  return `https://jobs.careers.gov.sg/jobs/${platform}/${jobId}/${postingNo}`;
}

// ---- Synthetic stable uuid (CSG2) --------------------------------------------
function makeCsgUuid(platform, jobId, postingNo) {
  return `csg:${platform || ""}:${jobId || ""}:${postingNo || ""}`;
}

// ---- normaliseCsgJob (CSG2 contract) -----------------------------------------
// Maps one careers.gov.sg record into the exact field set normaliseJob() returns
// in api/mcf.js, plus source:"careers.gov.sg".
function normaliseCsgJob(r) {
  if (!r || !r.jobId) return null;
  const platform   = r.platform   || "";
  const jobId      = String(r.jobId      || "");
  const postingNo  = String(r.postingNo  || "");
  const agency     = (r.agency || "").trim();
  const jobTitle   = (r.jobTitle || "").trim();
  if (!jobTitle) return null;

  // description: concatenate all three text fields, sanitise
  const rawDesc = [r.jobDescription, r.jobResponsibilities, r.jobRequirements]
    .filter(Boolean)
    .join("\n\n");
  const description = htmlToText(rawDesc).slice(0, DESC_CAP);

  // responsibilitiesText: CSG gives duties verbatim - higher fidelity than regex extraction
  const responsibilitiesText = htmlToText(r.jobResponsibilities || r.jobDescription || "").slice(0, RESP_CAP);

  return {
    uuid:                makeCsgUuid(platform, jobId, postingNo),
    title:               jobTitle,
    employer:            agency,
    postedCompanyName:   agency,
    hiringCompanyName:   agency,
    salaryMin:           null,
    salaryMax:           null,
    employmentType:      r.employmentType || "",
    postedDate:          r.startDate ? new Date(r.startDate).toISOString() : "",
    expiryDate:          r.closingDate ? new Date(r.closingDate).toISOString() : "",
    minimumYearsExperience: (typeof r.experienceYearsMin === "number") ? r.experienceYearsMin : null,
    positionLevels:      [],
    schemes:             [],
    description,
    responsibilitiesText,
    categories:          [r.functionalArea, r.field, r.industry].filter(Boolean),
    skills:              [],
    mcfUrl:              csgUrl(platform, jobId, postingNo),
    source:              "careers.gov.sg",
  };
}

// ---- Token matching (same discipline as mcf.js tier-3) -----------------------
function tokenise(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scoreRecord(r, tokens) {
  const title = (r.jobTitle || "").toLowerCase();
  const body  = [r.jobDescription, r.functionalArea, r.field, r.industry]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (title.includes(t)) score += 3;
    else if (body.includes(t)) score += 1;
  }
  return score;
}

// ---- Agency matching (for action:"company") ----------------------------------
// Short words an agency name drops when people say its acronym aloud.
const AGENCY_STOP = new Set(["of", "and", "the", "for", "to", "a", "an", "in", "on", "&"]);

// Extract parenthetical acronym from agency string, e.g. "Home Team Science (HTX)" -> "htx"
function extractAcronym(agency) {
  const m = agency.match(/\(([A-Z0-9]{2,10})\)/);
  return m ? m[1].toLowerCase() : null;
}

// Build the initialisms a person might type for an agency the data spells out in
// full. Ministry acronyms are irregular - some keep the "of" (MOH, MOE, MOM), some
// drop it (MND) - so we return BOTH the all-words and the significant-words forms.
// e.g. "Ministry of Health" -> ["moh","mh"]; "Land Transport Authority" -> ["lta"].
function initialisms(agency) {
  const words = agency.toLowerCase().replace(/\(.*?\)/g, " ").split(/[^a-z0-9]+/).filter(Boolean);
  if (words.length < 2) return [];
  const all = words.map((w) => w[0]).join("");
  const sig = words.filter((w) => !AGENCY_STOP.has(w)).map((w) => w[0]).join("");
  return sig && sig !== all ? [all, sig] : [all];
}

function agencyMatchScore(agency, queryTokens, queryRaw) {
  if (!agency) return 0;
  const q = queryRaw.toLowerCase().trim();
  const agencyLower = agency.toLowerCase();
  // 1. Substring - strongest signal ("ministry of health" inside "Ministry of Health").
  if (agencyLower.includes(q)) return 10;
  // 2. Parenthetical acronym verbatim in the data, e.g. "(HTX)" === "htx".
  const acronym = extractAcronym(agency);
  if (acronym && acronym === q) return 9;
  // 3. Initialism of the agency's own words - catches user-typed acronyms (LTA, MOH,
  //    MOE, MND) for agencies the dataset spells out in full.
  const qc = q.replace(/[^a-z0-9]/g, "");
  if (qc.length >= 2 && initialisms(agency).includes(qc)) return 9;
  // 4. ALL query content-tokens must be present (AND, not OR). Prevents one shared
  //    token ("ministry") from pulling in every ministry and inflating the count.
  const agencyTokens = tokenise(agency);
  if (queryTokens.length === 0) return 0;
  for (const t of queryTokens) {
    if (!agencyTokens.includes(t)) return 0;
  }
  return queryTokens.length;
}

// ---- Handler -----------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, title, uuid, company, limit } = req.body || {};

  // ---- action: "company" - filter by agency name ----------------------------
  if (action === "company") {
    if (!company || typeof company !== "string") {
      return res.status(400).json({ error: 'Required: action="company", company=string' });
    }
    const cap = Math.max(1, Math.min(50, Number(limit) || 50));
    const queryRaw = company.trim();
    const queryTokens = Array.from(new Set(tokenise(queryRaw))).slice(0, 8);
    try {
      const dump = await getDump();
      const scored = dump
        .map(function(r) {
          return { r, score: agencyMatchScore(r.agency || "", queryTokens, queryRaw) };
        })
        .filter(function(x) { return x.score > 0; })
        .sort(function(a, b) { return b.score - a.score || (b.r.startDate || 0) - (a.r.startDate || 0); });
      const total = scored.length;
      const hits = scored.slice(0, cap).map(function(x) { return normaliseCsgJob(x.r); }).filter(Boolean);
      if (hits.length === 0) {
        return res.status(200).json({
          jobs: [], total: 0, source: "careers.gov.sg", fallback: true, code: "EMPTY",
          message: "No careers.gov.sg roles for that employer - careers.gov.sg lists government bodies, so try a ministry or statutory board (e.g. Ministry of Health, LTA, HTX).",
        });
      }
      return res.status(200).json({
        jobs: hits,
        total,
        capped: total > cap,
        source: "careers.gov.sg",
      });
    } catch (err) {
      const isTimeout = err.name === "AbortError";
      console.error("[careers/company] " + (isTimeout ? "Timeout" : "Error") + ":", err.message);
      return res.status(200).json({
        jobs: [], total: 0, fallback: true, source: "careers.gov.sg", code: isTimeout ? "TIMEOUT" : "SERVER",
        message: isTimeout
          ? "careers.gov.sg data is taking a moment. Please try again."
          : "Could not reach careers.gov.sg data. Please try again.",
      });
    }
  }

  // ---- action: "job" - look up one posting by synthetic uuid ----------------
  if (action === "job") {
    const uid = (uuid || "").toString().trim();
    if (!uid) {
      return res.status(400).json({ error: 'Required: action="job", uuid=string' });
    }
    try {
      const dump  = await getDump();
      // synthetic uuid: "csg:{platform}:{jobId}:{postingNo}"
      const parts = uid.split(":");
      // parts[0]="csg", [1]=platform, [2]=jobId, [3]=postingNo
      const [, platform, jobId, postingNo] = parts;
      const raw   = dump.find(
        (r) =>
          String(r.jobId)      === String(jobId || "")      &&
          String(r.postingNo || "") === String(postingNo || "") &&
          (r.platform || "")   === (platform || ""),
      );
      const job = raw ? normaliseCsgJob(raw) : null;
      if (!job) {
        return res.status(200).json({
          job: null, fallback: true,
          message: "Posting not found in careers.gov.sg dump.",
          source: "careers.gov.sg",
        });
      }
      return res.status(200).json({ job, source: "careers.gov.sg" });
    } catch (err) {
      return res.status(200).json({
        job: null, fallback: true,
        message: "Could not reach careers.gov.sg data. Please try again.",
        source: "careers.gov.sg",
      });
    }
  }

  // ---- action: "jobs" - title search ----------------------------------------
  if (action !== "jobs" || !title || typeof title !== "string") {
    return res.status(400).json({ error: 'Invalid request. Required: action="jobs", title=string' });
  }

  const cap    = Math.max(1, Math.min(50, Number(limit) || 10));
  const tokens = Array.from(new Set(tokenise(title))).slice(0, 8);

  try {
    const dump = await getDump();

    if (tokens.length === 0) {
      return res.status(200).json({ jobs: [], total: 0, source: "careers.gov.sg", fallback: true, code: "EMPTY",
        message: "Search term too short." });
    }

    const scored = dump
      .map((r) => ({ r, score: scoreRecord(r, tokens) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (b.r.startDate || 0) - (a.r.startDate || 0));

    const total = scored.length;
    const hits  = scored.slice(0, cap).map((x) => normaliseCsgJob(x.r)).filter(Boolean);

    if (hits.length === 0) {
      return res.status(200).json({
        jobs: [], total: 0, source: "careers.gov.sg", fallback: true, code: "EMPTY",
        message: "No matching public-service postings on careers.gov.sg right now.",
      });
    }

    return res.status(200).json({
      jobs:   hits,
      total,
      capped: total > cap,
      source: "careers.gov.sg",
    });
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    console.error("[careers] " + (isTimeout ? "Timeout" : "Error") + ":", err.message);
    return res.status(200).json({
      jobs: [], total: 0, fallback: true, source: "careers.gov.sg", code: isTimeout ? "TIMEOUT" : "SERVER",
      message: isTimeout
        ? "careers.gov.sg data is taking a moment. Please try again."
        : "Could not reach careers.gov.sg data. Please try again.",
    });
  }
}
