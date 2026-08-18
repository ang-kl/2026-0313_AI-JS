// v3/api/ssic.js - SSIC 2020 activity-text classifier.
// Source: SingStat SSIC 2020 Alphabetical Index (updated 30 Jun 2024), compiled
// to engine-data/ssic2020-index.json (code -> activity terms + section/division).
//
// Deterministic + non-inventive: given a business-activity / job-ad text, it
// scores every SSIC code by token overlap against its official index terms and
// returns ranked matches with a confidence band. It never invents a code -
// below the floor it withholds (matched:"none").
//
// Postgres is optional: `action:"seed"` mirrors the JSON into an ssic_index
// table for other queries; the classify path is in-memory (5.4k terms) so it
// works with or without a database, exactly like ssoc.js's classify path.
//
// classifyText() below also runs, byte-for-byte identical, as a C++ endpoint on the
// GCN substrate's Railway service (research/gcn/cpp/classify.hpp, verified against
// this exact function before that port shipped - see its parity note). classify/
// classifyMany try that service first with a short timeout and fall back to the
// local computation on any failure - a pure speed/offload optimisation, never a
// correctness dependency: classifyText() here remains the source of truth.
//
// `action:"lookup"` is a separate, authoritative path: it reads the real
// registered SSIC for a company from `acra_entities` (seeded offline via
// scripts/seed-acra.mjs from the ACRA "Information on Corporate Entities"
// A-Z export) - falling back to the text classifier only when ACRA has no
// exact match for the given name/UEN.

if (!process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.SSOC_POSTGRES_URL
    || process.env.DATABASE_URL
    || process.env.PRISMA_DATABASE_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || process.env.DATABASE_URL_UNPOOLED
    || "";
}

import { readFileSync } from 'node:fs';
import pg from 'pg';
import { attachSqlTag } from '../lib/pg-sql-tag.js';

export const config = { api: { bodyParser: true }, maxDuration: 60 };

const INDEX_URL = new URL('../engine-data/ssic2020-index.json', import.meta.url);
const VERSION = '2020';
const DB_TIMEOUT_MS = Math.max(500, Math.min(10000, Number(process.env.SSIC_DB_TIMEOUT_MS) || 2500));

let cachedIndex = null;   // { entries:[...] }
let cachedTerms = null;   // [{ code, section, sectionTitle, term, tokenSet }]

function loadIndex() {
  if (cachedIndex) return cachedIndex;
  cachedIndex = JSON.parse(readFileSync(INDEX_URL, 'utf8'));
  return cachedIndex;
}

// ── deterministic text matching ──────────────────────────────────────────────
const STOP = new Set([
  'and', 'the', 'for', 'with', 'from', 'into', 'onto', 'this', 'that', 'other',
  'services', 'service', 'activities', 'activity', 'general', 'related', 'except',
  'products', 'product', 'goods', 'nec', 'etc', 'excluding', 'including', 'such',
]);

function normalise(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/&amp;/g, ' and ')
    .replace(/[/+_-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value) {
  return new Set(normalise(value).split(' ').filter((t) => t.length > 2 && !STOP.has(t)));
}

function loadTerms() {
  if (cachedTerms) return cachedTerms;
  cachedTerms = [];
  for (const e of loadIndex().entries) {
    for (const term of e.terms) {
      cachedTerms.push({ code: e.code, section: e.section, sectionTitle: e.sectionTitle, term, tokenSet: tokenSet(term) });
    }
  }
  return cachedTerms;
}

// Jaccard-style overlap, weighted so a full phrase containment scores highest.
function overlap(queryTokens, termTokens) {
  if (!queryTokens.size || !termTokens.size) return 0;
  let hit = 0;
  for (const t of termTokens) if (queryTokens.has(t)) hit += 1;
  if (!hit) return 0;
  const coverage = hit / termTokens.size;          // how much of the term matched
  const precision = hit / queryTokens.size;         // how focused the query is
  return +(0.7 * coverage + 0.3 * precision).toFixed(4);
}

function band(score) {
  if (score >= 0.6) return 'high';
  if (score >= 0.35) return 'moderate';
  if (score >= 0.18) return 'thin';
  return 'withheld';
}
const FLOOR = 0.18;

// Classify one activity text -> ranked SSIC codes (best term per code kept).
function classifyText(text, limit) {
  const q = tokenSet(text);
  if (!q.size) return { matched: 'none', reason: 'empty_query', candidates: [] };
  const bestByCode = new Map();
  for (const row of loadTerms()) {
    const s = overlap(q, row.tokenSet);
    if (s < FLOOR) continue;
    const prev = bestByCode.get(row.code);
    if (!prev || s > prev.score) {
      bestByCode.set(row.code, { code: row.code, section: row.section, sectionTitle: row.sectionTitle, score: s, matchedTerm: row.term });
    }
  }
  const ranked = [...bestByCode.values()]
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code))
    .slice(0, limit || 5)
    .map((c) => ({ ...c, confidence: band(c.score) }));
  if (!ranked.length) return { matched: 'none', reason: 'below_floor', candidates: [] };
  const top = ranked[0];
  return {
    matched: top.confidence === 'withheld' ? 'none' : 'ranked',
    code: top.code,
    section: top.section,
    sectionTitle: top.sectionTitle,
    confidence: top.confidence,
    matchedTerm: top.matchedTerm,
    candidates: ranked,
  };
}

// ── C++ substrate fast-path (best-effort, local classifyText() is the fallback) ─
const SUBSTRATE_URL = process.env.SUBSTRATE_URL || 'https://job-analysis.up.railway.app';
const CLASSIFY_TIMEOUT_MS = 3000;

async function classifyViaService(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT_MS);
  try {
    const r = await fetch(`${SUBSTRATE_URL.replace(/\/+$/, '')}/classify-ssic`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// One text -> one classification. Tries the Railway C++ service; on any failure (network,
// timeout, malformed response) falls back to the identical local computation - never
// withholds, since a local answer is always available for this deterministic classifier.
async function classifyOne(text, limit) {
  const viaService = await classifyViaService({ text, limit });
  if (viaService && (viaService.matched === 'ranked' || viaService.matched === 'none')) {
    const { version, ...rest } = viaService;
    return rest;
  }
  return classifyText(text, limit);
}

// Batch: one request to the service for the whole array; falls back to local computation
// per-text (not the whole batch) if the service is unreachable or the shape looks wrong.
async function classifyMany(texts, limit) {
  const viaService = await classifyViaService({ texts, limit });
  if (viaService && Array.isArray(viaService.results) && viaService.results.length === texts.length) {
    return viaService.results;
  }
  return texts.map((t) => classifyText(String(t || ''), limit));
}

// ── optional Postgres persistence ────────────────────────────────────────────
function withTimeout(promise, label = 'db') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), DB_TIMEOUT_MS)),
  ]);
}

async function withDb(fn, label = 'ssic db') {
  const client = new pg.Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_URL && /sslmode=require/i.test(process.env.POSTGRES_URL) ? { rejectUnauthorized: false } : undefined,
  });
  await withTimeout(client.connect(), `${label} connect`);
  const db = {
    sql(strings, ...values) {
      const text = strings.reduce((acc, part, i) => `${acc}${part}${i < values.length ? `$${i + 1}` : ''}`, '');
      return client.query(text, values);
    },
    query(text, values) { return client.query(text, values); },
  };
  try { return await fn(db); }
  finally { try { await client.end(); } catch (_) {} }
}

async function ensureTable(db) {
  await db.sql`CREATE TABLE IF NOT EXISTS ssic_index (
    version text NOT NULL,
    code text NOT NULL,
    section text,
    section_title text,
    division text,
    term text NOT NULL,
    term_norm text NOT NULL
  )`;
  await db.sql`CREATE INDEX IF NOT EXISTS ssic_index_term_norm ON ssic_index (term_norm)`;
  await db.sql`CREATE INDEX IF NOT EXISTS ssic_index_code ON ssic_index (code)`;
}

async function seedDatabase() {
  return withDb(async (db) => {
    await ensureTable(db);
    await db.sql`DELETE FROM ssic_index WHERE version = ${VERSION}`;
    let n = 0;
    for (const e of loadIndex().entries) {
      for (const term of e.terms) {
        await db.sql`INSERT INTO ssic_index (version, code, section, section_title, division, term, term_norm)
          VALUES (${VERSION}, ${e.code}, ${e.section}, ${e.sectionTitle}, ${e.division}, ${term}, ${normalise(term)})`;
        n += 1;
      }
    }
    return { seeded: n };
  });
}

// ── ACRA entity lookup (authoritative: name/UEN -> registered SSIC) ─────────
// Distinct from classifyText: this reads the actual registered SSIC for a
// known entity out of `acra_entities` (seeded via scripts/seed-acra.mjs from
// the ACRA "Information on Corporate Entities" A-Z export) rather than
// guessing from free text. source:"acra" (authoritative) vs the classifier's
// source:"derived" (inferred) - never conflate the two confidence levels.
function normEntityName(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/\(([^)]*)\)/g, ' ')
    .replace(/\b(PTE|PRIVATE|LTD|LIMITED|LLP|LLC|INC|CORP|CORPORATION|CO|COMPANY|SINGAPORE|SG|HOLDINGS?)\b\.?/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUen(s) {
  return /^[0-9]{8,10}[A-Z]$/i.test(String(s || '').trim());
}

// The Postgres mirror stores ACRA's "na" marker as SQL NULL (see
// scripts/seed-acra.mjs), but the live data.gov.sg datastore returns it as
// the literal string "na" - normalise both paths here so a stray "na" never
// reaches the UI looking like a real value.
function naToNull(v) {
  return (v == null || String(v).trim().toLowerCase() === 'na' || String(v).trim() === '') ? null : v;
}

function mapAcraRow(r) {
  return {
    uen: naToNull(r.uen),
    entityName: naToNull(r.entity_name),
    entityType: naToNull(r.entity_type_description),
    status: naToNull(r.entity_status_description),
    registeredSince: naToNull(r.registration_incorporation_date),
    primarySsicCode: naToNull(r.primary_ssic_code),
    primarySsicDescription: naToNull(r.primary_ssic_description),
    secondarySsicCode: naToNull(r.secondary_ssic_code),
    secondarySsicDescription: naToNull(r.secondary_ssic_description),
    street: naToNull(r.street_name),
    building: naToNull(r.building_name),
    postal: naToNull(r.postal_code),
  };
}

// Was @vercel/postgres's createClient() - its pooled `sql` tagged-template export
// requires a POOLED connection string, but POSTGRES_URL is a direct one, so every
// lookup failed live with 'invalid_connection_string' and silently fell through to
// the live data.gov.sg path. Plain `pg` + the attachSqlTag() shim below fixes that
// (same finding/fix as api/anatomy.js, api/ssoc.js, scripts/seed-acra.mjs).
async function acraDbLookup(rawQuery) {
  if (!process.env.POSTGRES_URL) return { matched: 'none', reason: 'no_database' };
  let client = null;
  try {
    const query = String(rawQuery || '').trim();
    client = new pg.Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_URL && /sslmode=require/i.test(process.env.POSTGRES_URL) ? { rejectUnauthorized: false } : undefined,
    });
    await withTimeout(client.connect(), 'acra connect');
    attachSqlTag(client);
    if (isUen(query)) {
      const { rows } = await withTimeout(client.sql`SELECT * FROM acra_entities WHERE uen = ${query.toUpperCase()} LIMIT 1`, 'acra lookup');
      if (rows.length) return { matched: 'exact', source: 'acra', ...mapAcraRow(rows[0]) };
      return { matched: 'none', reason: 'no_match' };
    }
    const norm = normEntityName(query);
    if (norm.length < 3) return { matched: 'none', reason: 'name_too_short' };
    const { rows } = await withTimeout(client.sql`SELECT * FROM acra_entities WHERE entity_name ILIKE ${`%${norm}%`} LIMIT 20`, 'acra lookup');
    const hits = rows.filter((r) => normEntityName(r.entity_name) === norm);
    if (!hits.length) return { matched: 'none', reason: 'no_exact_match' };
    const live = hits.find((r) => /live/i.test(r.entity_status_description || ''));
    const r = live || hits[0];
    return { matched: 'exact', source: 'acra', namesakes: hits.length - 1, ...mapAcraRow(r) };
  } catch (err) {
    console.error('[ssic] acra lookup:', err && err.message);
    return { matched: 'none', reason: 'db_error' };
  } finally {
    // Bounded close: never await end() unboundedly - on a failed connect the
    // neon driver's end() can wait on the never-completing connection and hang
    // the handler until Vercel's maxDuration kill (seen live in api/anatomy).
    if (client) {
      try {
        await Promise.race([client.end(), new Promise((r) => setTimeout(r, 1500))]);
      } catch (_) {}
    }
  }
}

// ── ACRA live lookup (data.gov.sg collection 2, no Postgres needed) ─────────
// "ACRA Information on Corporate Entities" - 27 A-Z datasets + "Others",
// updated monthly (collection_id=2). Each dataset's datasetId doubles as its
// datastore_search resource_id directly - no separate resource lookup. Split
// by first letter of entity_name; queried live, so this works with zero DB
// setup. Same fields as acra_entities (primary/secondary SSIC, status, dates).
const ACRA_LIVE_BASE = 'https://data.gov.sg/api/action/datastore_search';
const ACRA_LIVE_TIMEOUT_MS = 7000;
const ACRA_LIVE_RESOURCE_BY_LETTER = {
  A: 'd_8575e84912df3c28995b8e6e0e05205a', B: 'd_3a3807c023c61ddfba947dc069eb53f2',
  C: 'd_c0650f23e94c42e7a20921f4c5b75c24', D: 'd_acbc938ec77af18f94cecc4a7c9ec720',
  E: 'd_124a9bd407c7a25f8335b93b86e50fdd', F: 'd_4526d47d6714d3b052eed4a30b8b1ed6',
  G: 'd_b58303c68e9cf0d2ae93b73ffdbfbfa1', H: 'd_fa2ed456cf2b8597bb7e064b08fc3c7c',
  I: 'd_85518d970b8178975850457f60f1e738', J: 'd_478f45a9c541cbe679ca55d1cd2b970b',
  K: 'd_5573b0db0575db32190a2ad27919a7aa', L: 'd_a2141adf93ec2a3c2ec2837b78d6d46e',
  M: 'd_9af9317c646a1c881bb5591c91817cc6', N: 'd_67e99e6eabc4aad9b5d48663b579746a',
  O: 'd_5c4ef48b025fdfbc80056401f06e3df9', P: 'd_181005ca270b45408b4cdfc954980ca2',
  Q: 'd_4130f1d9d365d9f1633536e959f62bb7', R: 'd_2b8c54b2a490d2fa36b925289e5d9572',
  S: 'd_df7d2d661c0c11a7c367c9ee4bf896c1', T: 'd_72f37e5c5d192951ddc5513c2b134482',
  U: 'd_0cc5f52a1f298b916f317800251057f3', V: 'd_e97e8e7fc55b85a38babf66b0fa46b73',
  W: 'd_af2042c77ffaf0db5d75561ce9ef5688', X: 'd_1cd970d8351b42be4a308d628a6dd9d3',
  Y: 'd_31af23fdb79119ed185c256f03cb5773', Z: 'd_4e3db8955fdcda6f9944097bef3d2724',
};
const ACRA_LIVE_OTHERS_RESOURCE = 'd_300ddc8da4e8f7bdc1bfc62d0d99e2e7';
const acraLiveCache = new Map(); // normName -> { value, expiresAt }
const ACRA_LIVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function acraResourceForName(entityName) {
  const first = String(entityName || '').trim().toUpperCase()[0];
  return ACRA_LIVE_RESOURCE_BY_LETTER[first] || ACRA_LIVE_OTHERS_RESOURCE;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    clearTimeout(timer);
    return null;
  }
}

async function acraLiveLookup(rawQuery) {
  const query = String(rawQuery || '').trim();
  if (isUen(query)) {
    // UEN alone doesn't tell us which A-Z dataset holds it - query all 28 is
    // too slow for one request, so UEN-only lookups need the DB path.
    return { matched: 'none', reason: 'uen_needs_database' };
  }
  const norm = normEntityName(query);
  if (norm.length < 3) return { matched: 'none', reason: 'name_too_short' };
  const cached = acraLiveCache.get(norm);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const resourceId = acraResourceForName(query);
  const exactFilter = encodeURIComponent(JSON.stringify({ entity_name: query.toUpperCase().trim().slice(0, 120) }));
  let json = await fetchWithTimeout(`${ACRA_LIVE_BASE}?resource_id=${resourceId}&filters=${exactFilter}&limit=5`, ACRA_LIVE_TIMEOUT_MS);
  let records = json?.result?.records || [];
  if (!records.length) {
    const q = query.replace(/[^A-Za-z0-9 &-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (q.length >= 3) {
      json = await fetchWithTimeout(`${ACRA_LIVE_BASE}?resource_id=${resourceId}&q=${encodeURIComponent(q)}&limit=20`, ACRA_LIVE_TIMEOUT_MS);
      records = json?.result?.records || [];
    }
  }
  const hits = records.filter((r) => normEntityName(r.entity_name) === norm);
  if (!hits.length) {
    const out = { matched: 'none', reason: 'no_exact_match' };
    acraLiveCache.set(norm, { value: out, expiresAt: Date.now() + ACRA_LIVE_CACHE_TTL_MS });
    return out;
  }
  const live = hits.find((r) => /live/i.test(r.entity_status_description || ''));
  const r = live || hits[0];
  const out = { matched: 'exact', source: 'acra', namesakes: hits.length - 1, ...mapAcraRow(r) };
  acraLiveCache.set(norm, { value: out, expiresAt: Date.now() + ACRA_LIVE_CACHE_TTL_MS });
  return out;
}

// ── handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const action = body.action || 'classify';

  if (action === 'status') {
    const idx = loadIndex();
    return res.status(200).json({ version: VERSION, codes: idx.codeCount, terms: idx.termCount, source: idx.source });
  }

  if (action === 'seed') {
    if (!process.env.POSTGRES_URL) return res.status(200).json({ ok: false, reason: 'no_database' });
    try { return res.status(200).json({ ok: true, ...(await seedDatabase()) }); }
    catch (err) { console.error('[ssic] seed:', err && err.message); return res.status(200).json({ ok: false, reason: 'db_error' }); }
  }

  if (action === 'lookup') {
    // Authoritative first: exact ACRA registration match by UEN or name.
    // Order: Postgres mirror (fast, if seeded) -> live data.gov.sg datastore
    // (always available, no DB needed) -> text classifier only as a last
    // resort when ACRA has no exact record. The three are never blended into
    // one confidence score - each response says exactly which one answered.
    const query = String(body.query || body.name || body.uen || '');
    if (!query.trim()) return res.status(400).json({ error: 'Required: action="lookup", query=string (company name or UEN)' });
    let acra = await acraDbLookup(query);
    if (acra.matched !== 'exact') acra = await acraLiveLookup(query);
    if (acra.matched === 'exact') return res.status(200).json({ version: VERSION, ...acra });
    const fallback = await classifyOne(query, Number(body.limit) || 5);
    return res.status(200).json({ version: VERSION, acra, fallback: { source: 'derived', ...fallback } });
  }

  if (action === 'classify') {
    // Single text, or batch: { texts:[...] } -> one classification each.
    if (Array.isArray(body.texts)) {
      const limit = Number(body.limit) || 5;
      return res.status(200).json({ version: VERSION, results: await classifyMany(body.texts.map((t) => String(t || '')), limit) });
    }
    const text = String(body.text || '');
    if (!text.trim()) return res.status(400).json({ error: 'Required: action="classify", text=string (or texts=array)' });
    return res.status(200).json({ version: VERSION, ...(await classifyOne(text, Number(body.limit) || 5)) });
  }

  return res.status(400).json({ error: 'Invalid action. Use classify | lookup | seed | status' });
}
