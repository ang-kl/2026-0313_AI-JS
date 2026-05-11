// v3/api/datagov.js - v3 - data.gov.sg MOM job vacancy rate trend
// POST /api/datagov - body: { action: "trend", iscoMajor: 1..9 }
// Reads MOM "Job Vacancy Rate by Industry and Occupational Group, Quarterly"
// (collection 690). Maps ISCO-08 major group -> MOM occupational-group label,
// extracts the last ~12 quarters of data for that group, returns sparkline
// series + latest + YoY delta.
//
// Auth: x-api-key header from process.env.DATA_GOV_SG_API_KEY. data.gov.sg
// APIs are public; the key only raises rate limits. If key is missing, the
// function still attempts the call but returns fallback:true on failure.

export const config = {
  api: { bodyParser: true },
  maxDuration: 15,
};

const DATAGOV_BASE = 'https://api-production.data.gov.sg/v2/public/api';
// MOM "Job Vacancy Rate by Industry and Occupational Group, Quarterly".
// Resource id is intentionally configurable via env so it can be flipped
// without a code change once the exact dataset id is confirmed.
const MOM_DATASET_ID = process.env.MOM_VACANCY_DATASET_ID || 'd_ee2f8b2c0d8b1e5e2c3a8f7e6b9d4c1a';
const TIMEOUT_MS = 10000;
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

// data.gov.sg v2 dataset "poll-download" returns a presigned URL once the
// dataset is ready. For small static datasets it is usually immediate.
async function fetchDataset(datasetId, apiKey) {
  const headers = { 'accept': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;

  const pollUrl = `${DATAGOV_BASE}/datasets/${encodeURIComponent(datasetId)}/poll-download`;
  const pollRes = await fetchWithTimeout(pollUrl, { headers }, TIMEOUT_MS);
  if (!pollRes.ok) throw new Error(`poll-download HTTP ${pollRes.status}`);
  const pollData = await pollRes.json();
  const downloadUrl = pollData?.data?.url;
  if (!downloadUrl) throw new Error('poll-download returned no url');

  const csvRes = await fetchWithTimeout(downloadUrl, {}, TIMEOUT_MS);
  if (!csvRes.ok) throw new Error(`dataset HTTP ${csvRes.status}`);
  const text = await csvRes.text();
  return parseCsv(text);
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, iscoMajor } = req.body || {};
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
