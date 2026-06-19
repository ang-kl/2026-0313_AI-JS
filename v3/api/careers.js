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
  s = s.replace(/[ \t ]+/g, " ");
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

// ---- Handler -----------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, title, uuid, limit } = req.body || {};

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
      return res.status(200).json({ jobs: [], total: 0, source: "careers.gov.sg", fallback: true,
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
        jobs: [], total: 0, source: "careers.gov.sg", fallback: true,
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
      jobs: [], total: 0, fallback: true, source: "careers.gov.sg",
      message: isTimeout
        ? "careers.gov.sg data is taking a moment. Please try again."
        : "Could not reach careers.gov.sg data. Please try again.",
    });
  }
}
