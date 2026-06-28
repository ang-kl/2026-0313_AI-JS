// v3/api/datagov.js - v3 - data.gov.sg MOM job vacancy rate trend
// POST /api/datagov - body: { action: "trend", iscoMajor: 1..9 }
// Reads MOM "Job Vacancy Rate by Industry and Occupational Group, Quarterly"
// (collection 690). Maps ISCO-08 major group -> MOM occupational-group label,
// extracts the last ~12 quarters of data for that group, returns sparkline
// series + latest + YoY delta.
//
// Auth: optional x-api-key header from process.env.DATA_GOV_SG_API_KEY.
// data.gov.sg's public dataset APIs don't require a key; it's sent only if
// present (harmless otherwise). On any failure the function returns
// fallback:true rather than erroring.

export const config = {
  api: { bodyParser: true },
  maxDuration: 30,
};

import { requireTelegramSession } from '../server/telegram-session.js';

// Dataset *downloads* go through api-open.data.gov.sg/v1 (the initiate +
// poll flow). Note: api-production.data.gov.sg/v2 is metadata-only and 404s
// these paths.
const DATAGOV_BASE = 'https://api-open.data.gov.sg/v1/public/api';
// MOM "Job Vacancy Rate by Industry and Occupational Group (Level2)",
// data.gov.sg collection 690, resource d_60ba5027f80aef9a07d747067a948bfc.
// Override via MOM_VACANCY_DATASET_ID if MOM republishes under a new id.
const MOM_DATASET_ID = process.env.MOM_VACANCY_DATASET_ID || 'd_60ba5027f80aef9a07d747067a948bfc';
const STEP_TIMEOUT_MS = 7000;   // per-request timeout for each data.gov.sg call
const POLL_MAX_ATTEMPTS = 3;    // poll-download retries (URL is usually ready on #1)
const POLL_INTERVAL_MS = 700;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h - data is quarterly

const WARM_ERRORS = {
  no_key:   { code:'NO_KEY',   message:'Vacancy-rate trends are temporarily unavailable. Please check back later.' },
  timeout:  { code:'TIMEOUT',  message:'That one took a little longer than expected. Please try again.' },
  server:   { code:'SERVER',   message:'Something went wrong fetching vacancy data. Please try again later.' },
  no_data:  { code:'NO_DATA',  message:'No quarterly vacancy data is available for this occupational group yet.' },
  unmapped: { code:'UNMAPPED', message:'No matching MOM occupational group for this role.' },
};

// ISCO-08 major group -> MOM "Job Vacancy Rate" occupational group label.
// MOM publishes seven occupational-group categories; ISCO 6 (skilled
// agricultural) folds into "Production & Transport Operators" alongside 7+8.
const ISCO_TO_MOM = {
  1: 'Managers',
  2: 'Professionals',
  3: 'Associate Professionals & Technicians',
  4: 'Clerical Support Workers',
  5: 'Service & Sales Workers',
  6: 'Production & Transport Operators',
  7: 'Production & Transport Operators',
  8: 'Production & Transport Operators',
  9: 'Cleaners, Labourers & Related Workers',
};

// Module-scope cache: { [iscoMajor]: { value, expiresAt } }.
const cache = new Map();

// ---- PRO1: ACRA entity lookup ----------------------------------------------
// "Entities Registered with ACRA" on data.gov.sg - live datastore search.
// Fields: uen, entity_name, entity_type_desc, uen_status_desc, uen_issue_date,
// reg_street_name, reg_postal_code. NOTE: the q= search is fuzzy/ranked, so a
// NORMALISED EXACT-NAME guard decides whether we show anything at all -
// withhold over a wrong company (the search returned "FINTECH SOLUTIONS" for
// "PERCEPT SOLUTIONS" in testing; a fuzzy hit must never be presented as fact).
const ACRA_RESOURCE_ID = process.env.ACRA_RESOURCE_ID || 'd_3f960c10fed6145404ca7b821f263b87';
const ACRA_BASE = 'https://data.gov.sg/api/action/datastore_search';
const ACRA_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // entities change rarely
const acraCache = new Map(); // normName -> { value, expiresAt }

// Normalise a company name for comparison: case, punctuation, and the legal
// suffixes ACRA appends (PTE. LTD., LLP, ...) all stripped.
function normCompanyName(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/\(([^)]*)\)/g, ' ')                  // drop parentheticals
    .replace(/\b(PTE|PRIVATE|LTD|LIMITED|LLP|LLC|INC|CORP|CORPORATION|CO|COMPANY|SINGAPORE|SG|HOLDINGS?)\b\.?/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function acraLookup(rawName) {
  const norm = normCompanyName(rawName);
  if (norm.length < 3) return { matched: 'none', reason: 'name_too_short' };
  const cached = acraCache.get(norm);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  // PRO1.1: two-step lookup. (1) filters= EXACT entity_name equality on the raw
  // uppercased name - precise, immune to the fuzzy ranker drowning common tokens
  // ("DBS BANK LTD." resolves first try). (2) Fall back to a SANITISED q search
  // (datastore_search 409s "q is invalid" on punctuation like the trailing dot in
  // "LTD.") - the exact-name guard below still decides what may be shown.
  // DATA_GOV_SG_API_KEY (already provisioned for the trend action) is sent when
  // present - the datastore endpoint is public, the key lifts rate limits.
  const headers = { accept: 'application/json' };
  if (process.env.DATA_GOV_SG_API_KEY) headers['x-api-key'] = process.env.DATA_GOV_SG_API_KEY;
  async function hit(url) {
    try {
      const res = await fetchWithTimeout(url, { headers }, STEP_TIMEOUT_MS);
      if (!res.ok) return { err: `http_${res.status}` };
      return { json: await res.json() };
    } catch (err) {
      return { err: err.name === 'AbortError' ? 'timeout' : 'error' };
    }
  }
  let records = [];
  const exactFilter = encodeURIComponent(JSON.stringify({ entity_name: rawName.toUpperCase().trim().slice(0, 120) }));
  const r1 = await hit(`${ACRA_BASE}?resource_id=${encodeURIComponent(ACRA_RESOURCE_ID)}&filters=${exactFilter}&limit=5`);
  if (r1.json?.result?.records?.length) {
    records = r1.json.result.records;
  } else {
    const q = rawName.replace(/[^A-Za-z0-9 &-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (q.length < 3) return { matched: 'none', reason: 'name_too_short' };
    const r2 = await hit(`${ACRA_BASE}?resource_id=${encodeURIComponent(ACRA_RESOURCE_ID)}&q=${encodeURIComponent(q)}&limit=20`);
    if (r2.err && r1.err) return { matched: 'none', reason: r2.err };
    records = r2.json?.result?.records || [];
  }
  // exact-name guard: only a record whose NORMALISED name equals the query's
  // normalised name is presented; everything else is withheld.
  const hits = records.filter(r => normCompanyName(r.entity_name) === norm);
  if (!hits.length) {
    const out = { matched: 'none', reason: 'no_exact_match' };
    acraCache.set(norm, { value: out, expiresAt: Date.now() + ACRA_CACHE_TTL_MS });
    return out;
  }
  // Prefer a live registration over a deregistered namesake.
  const live = hits.find(r => /registered|live/i.test(r.uen_status_desc || '') && !/de-?registered/i.test(r.uen_status_desc || ''));
  const r = live || hits[0];
  const out = {
    matched: 'exact',
    uen: r.uen || '',
    entityName: r.entity_name || '',
    entityType: r.entity_type_desc || '',
    status: r.uen_status_desc || '',
    since: r.uen_issue_date || '',
    street: r.reg_street_name || '',
    postal: r.reg_postal_code || '',
    namesakes: hits.length - 1,
  };
  acraCache.set(norm, { value: out, expiresAt: Date.now() + ACRA_CACHE_TTL_MS });
  return out;
}

async function fetchWithTimeout(url, opts, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// data.gov.sg dataset download (api-open.data.gov.sg/v1): poll-download returns
// a presigned URL once a CSV export is ready. For non-CSV / already-prepared
// datasets you can poll directly; CSV datasets need an initiate-download first.
// The API has been inconsistent about initiate's HTTP method, so we try POST
// then GET and tolerate a 404 there (then just keep polling).
async function fetchDataset(datasetId, apiKey) {
  const headers = { 'accept': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const jsonHeaders = { ...headers, 'content-type': 'application/json' };
  const base = `${DATAGOV_BASE}/datasets/${encodeURIComponent(datasetId)}`;
  const tried = [];

  async function getJson(url, opts) {
    let res;
    try { res = await fetchWithTimeout(url, opts, STEP_TIMEOUT_MS); }
    catch (err) { return { ok: false, status: err.name === 'AbortError' ? 'timeout' : 'error' }; }
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, json: await res.json().catch(() => null) };
  }

  // Kick off the export (best-effort: a 404 here just means "poll directly").
  for (const opts of [{ method: 'POST', headers: jsonHeaders, body: '{}' }, { method: 'GET', headers }]) {
    const r = await getJson(`${base}/initiate-download`, opts);
    tried.push(`initiate(${opts.method})=${r.ok ? 'ok' : r.status}`);
    if (r.ok) break;
  }

  // Poll for the presigned download URL.
  let downloadUrl = null;
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS && !downloadUrl; attempt++) {
    if (attempt > 0) await sleep(POLL_INTERVAL_MS);
    const r = await getJson(`${base}/poll-download`, { method: 'GET', headers });
    tried.push(`poll#${attempt + 1}=${r.ok ? (r.json?.data?.url ? 'url' : 'no-url') : r.status}`);
    if (r.ok) downloadUrl = r.json?.data?.url || null;
  }
  if (!downloadUrl) throw new Error(`no download url [${tried.join(' ')}]`);

  const csvRes = await fetchWithTimeout(downloadUrl, {}, STEP_TIMEOUT_MS);
  if (!csvRes.ok) throw new Error(`dataset HTTP ${csvRes.status}`);
  return parseCsv(await csvRes.text());
}

// Lightweight CSV parser - MOM datasets do not contain quoted commas in
// the columns we care about. If the header changes shape upstream the
// caller will simply find no rows and we will fall back gracefully.
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });
    return row;
  });
}

function splitCsvLine(line) {
  // Handles simple quoted fields. Sufficient for MOM CSVs.
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { q = !q; continue; }
    if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

// Find the column whose header best matches one of the candidates.
function colKey(row, candidates) {
  if (!row) return null;
  const keys = Object.keys(row);
  for (const want of candidates) {
    const w = want.toLowerCase();
    const hit = keys.find(k => k.toLowerCase().includes(w));
    if (hit) return hit;
  }
  return null;
}

function buildSeries(rows, momGroupLabel) {
  if (!rows.length) return [];
  const sample = rows[0];
  const groupCol = colKey(sample, ['occupational group', 'occupation group', 'group']);
  const quarterCol = colKey(sample, ['quarter', 'period', 'date']);
  const rateCol = colKey(sample, ['vacancy_rate', 'vacancy rate', 'rate', 'value']);
  if (!groupCol || !quarterCol || !rateCol) return [];

  const wantedLower = momGroupLabel.toLowerCase();
  const filtered = rows.filter(r => (r[groupCol] || '').toLowerCase().includes(wantedLower.split(' ')[0]));
  // Best-effort sort by quarter ascending (string sort works for "2024-Q1").
  filtered.sort((a, b) => String(a[quarterCol]).localeCompare(String(b[quarterCol])));
  const series = filtered
    .map(r => ({ quarter: r[quarterCol], rate: Number(r[rateCol]) }))
    .filter(p => p.quarter && Number.isFinite(p.rate));
  // Last 12 quarters (3 years) keeps the sparkline readable.
  return series.slice(-12);
}

export default async function handler(req, res) {
  if (!requireTelegramSession(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, iscoMajor } = req.body || {};

  // PRO1: ACRA entity lookup - { action:"acra", name:"<company>" }.
  // Returns matched:"exact" with the register facts, or matched:"none"
  // (withheld) - never a fuzzy guess presented as fact.
  if (action === 'acra') {
    const name = String(req.body?.name || '').trim();
    if (name.length < 3) return res.status(400).json({ error: 'Invalid request. Required: action="acra", name=string' });
    try {
      const out = await acraLookup(name);
      return res.status(200).json(out);
    } catch (err) {
      console.error('[datagov] acra error:', err.message);
      return res.status(200).json({ matched: 'none', reason: 'error' });
    }
  }

  if (action !== 'trend' || !Number.isInteger(iscoMajor)) {
    return res.status(400).json({ error: 'Invalid request. Required: action="trend", iscoMajor=integer 1..9' });
  }

  const momGroup = ISCO_TO_MOM[iscoMajor];
  if (!momGroup) {
    return res.status(200).json({
      group: null,
      series: [],
      fallback: true,
      ...WARM_ERRORS.unmapped,
    });
  }

  const cached = cache.get(iscoMajor);
  if (cached && cached.expiresAt > Date.now()) {
    return res.status(200).json(cached.value);
  }

  const apiKey = process.env.DATA_GOV_SG_API_KEY || '';

  try {
    const rows = await fetchDataset(MOM_DATASET_ID, apiKey);
    const series = buildSeries(rows, momGroup);

    if (!series.length) {
      console.error(
        `[datagov] no series for "${momGroup}"; rows=${rows.length}; columns=`,
        rows[0] ? Object.keys(rows[0]) : '(none)',
      );
      const payload = {
        group: momGroup,
        iscoMajor,
        series: [],
        fallback: true,
        ...WARM_ERRORS.no_data,
        source: 'MOM Job Vacancy Survey via data.gov.sg',
        asOf: new Date().toISOString(),
      };
      cache.set(iscoMajor, { value: payload, expiresAt: Date.now() + 60 * 60 * 1000 }); // 1h on empty
      return res.status(200).json(payload);
    }

    const latest = series[series.length - 1];
    const yoyAnchor = series.length >= 5 ? series[series.length - 5] : series[0];
    const deltaYoY = yoyAnchor ? +(latest.rate - yoyAnchor.rate).toFixed(2) : null;

    const payload = {
      group: momGroup,
      iscoMajor,
      series,
      latest,
      deltaYoY,
      source: 'MOM Job Vacancy Survey via data.gov.sg',
      asOf: new Date().toISOString(),
    };

    cache.set(iscoMajor, { value: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.status(200).json(payload);

  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.error(`[datagov] ${isTimeout ? 'Timeout' : 'Fetch error'}:`, err.message);
    const reason = !apiKey ? 'no_key' : (isTimeout ? 'timeout' : 'server');
    return res.status(200).json({
      group: momGroup,
      iscoMajor,
      series: [],
      fallback: true,
      reason,
      ...(WARM_ERRORS[reason] || WARM_ERRORS.server),
      source: 'MOM Job Vacancy Survey via data.gov.sg',
    });
  }
}
