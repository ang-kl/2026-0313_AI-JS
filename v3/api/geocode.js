// v3/api/geocode.js - EMP5: OneMap-backed postal-code geocode + static-pin
// proxy. Server-side only (Vercel egress), so the browser never talks to an
// external host directly - keeps img-src 'self' data: / connect-src 'self'
// valid with zero vercel.json CSP edit (EMP6).
//
// Provider: OneMap (Singapore Land Authority, data.gov.sg family) - free,
// SG-gov, same non-inventive sourcing lineage as ACRA/MCF. [UNVERIFIED: exact
// auth requirement for OneMap's search + static-map endpoints was not
// confirmed against a live account at build time - this file is written to
// degrade gracefully (matched:"none") if OneMap requires a token that is not
// configured, per the withhold-over-invent contract.]
//
// Deterministic + non-inventive: a geocode is accepted only when OneMap's
// search returns a SINGLE result for the exact postal code (matched:"single").
// A multi-hit or fuzzy result is never presented as a pin - matched:"none".
// Always resolves 200 with a graceful shape; never throws to the caller.

const ONEMAP_SEARCH_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';
const ONEMAP_STATICMAP_URL = 'https://www.onemap.gov.sg/api/staticmap/getStaticImage';
const GEOCODE_TIMEOUT_MS = 6000;
const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const geocodeCache = new Map(); // postal -> { value, expiresAt }
const imageCache = new Map();   // postal -> { buf, contentType, expiresAt }

function onemapToken() {
  // Not provisioned as of v3.0.184 (EMP9 confirmed zero MAPS/GEOCODE env
  // vars) - reads the env var so this lights up the moment one is added,
  // with no code change required.
  return process.env.ONEMAP_TOKEN || process.env.ONEMAP_API_TOKEN || '';
}

async function fetchWithTimeout(url, opts, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (_) {
    clearTimeout(timer);
    return null;
  }
}

function isValidSgPostal(postal) {
  return /^[0-9]{6}$/.test(String(postal || '').trim());
}

async function onemapLocate(postal) {
  const cached = geocodeCache.get(postal);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  if (!isValidSgPostal(postal)) {
    const out = { matched: 'none', reason: 'invalid_postal' };
    geocodeCache.set(postal, { value: out, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS });
    return out;
  }

  const headers = { accept: 'application/json' };
  const token = onemapToken();
  if (token) headers.Authorization = token;

  const url = `${ONEMAP_SEARCH_URL}?searchVal=${encodeURIComponent(postal)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
  const res = await fetchWithTimeout(url, { headers }, GEOCODE_TIMEOUT_MS);
  if (!res || !res.ok) {
    const out = { matched: 'none', reason: res ? `http_${res.status}` : 'timeout' };
    geocodeCache.set(postal, { value: out, expiresAt: Date.now() + 5 * 60 * 1000 }); // short TTL on transient failure
    return out;
  }
  let json;
  try { json = await res.json(); } catch (_) {
    const out = { matched: 'none', reason: 'bad_response' };
    geocodeCache.set(postal, { value: out, expiresAt: Date.now() + 5 * 60 * 1000 });
    return out;
  }
  const results = Array.isArray(json && json.results) ? json.results : [];
  // Exact-match guard: accept only a single high-confidence hit for this
  // postal code. Multiple or zero results -> withhold, never a fuzzy centroid.
  const exact = results.filter((r) => String(r.POSTAL || '').trim() === postal);
  const hits = exact.length === 1 ? exact : (results.length === 1 ? results : []);
  if (hits.length !== 1) {
    const out = { matched: 'none', reason: results.length === 0 ? 'no_result' : 'ambiguous' };
    geocodeCache.set(postal, { value: out, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS });
    return out;
  }
  const r = hits[0];
  const lat = Number(r.LATITUDE), lng = Number(r.LONGITUDE);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const out = { matched: 'none', reason: 'bad_coords' };
    geocodeCache.set(postal, { value: out, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS });
    return out;
  }
  const out = { matched: 'single', lat, lng, provider: 'onemap' };
  geocodeCache.set(postal, { value: out, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS });
  return out;
}

async function onemapStaticImage(postal) {
  const cached = imageCache.get(postal);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const loc = await onemapLocate(postal);
  if (loc.matched !== 'single') return null;

  const token = onemapToken();
  if (!token) return null; // static-map endpoint needs a token; degrade silently (EMP9 #1)

  const url = `${ONEMAP_STATICMAP_URL}?layerchosen=default&latitude=${loc.lat}&longitude=${loc.lng}&zoom=17&width=640&height=320&points=[[${loc.lat},${loc.lng},"red","1"]]&token=${encodeURIComponent(token)}`;
  const res = await fetchWithTimeout(url, { headers: { accept: 'image/*' } }, GEOCODE_TIMEOUT_MS);
  if (!res || !res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/png';
  const value = { buf, contentType, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS };
  imageCache.set(postal, value);
  return value;
}

export default async function handler(req, res) {
  // GET ?action=render&postal=NNNNNN - proxies the static-map PNG bytes
  // through our own origin so <img src="/api/geocode?..."> never hot-links
  // an external host (EMP6: img-src 'self' data: stays valid, no CSP edit).
  if (req.method === 'GET') {
    const q = req.query || {};
    if (q.action !== 'render') return res.status(400).json({ error: 'Invalid action. Use action=render&postal=NNNNNN' });
    const postal = String(q.postal || '').trim();
    if (!isValidSgPostal(postal)) return res.status(400).json({ error: 'postal must be a 6-digit SG postal code' });
    try {
      const img = await onemapStaticImage(postal);
      if (!img) return res.status(204).end(); // no image available - client degrades to address text
      res.setHeader('Content-Type', img.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(img.buf);
    } catch (err) {
      console.error('[geocode] render:', err && err.message);
      return res.status(204).end();
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const action = body.action || 'locate';

  if (action === 'locate') {
    const postal = String(body.postal || '').trim();
    if (!postal) return res.status(200).json({ matched: 'none', reason: 'no_postal' });
    try {
      const out = await onemapLocate(postal);
      return res.status(200).json(out);
    } catch (err) {
      console.error('[geocode] locate:', err && err.message);
      return res.status(200).json({ matched: 'none', reason: 'server_error' });
    }
  }

  return res.status(400).json({ error: 'Invalid action. Use locate (POST) | render (GET)' });
}
