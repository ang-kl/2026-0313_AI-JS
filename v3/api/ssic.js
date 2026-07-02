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

// ── optional Postgres persistence ────────────────────────────────────────────
function withTimeout(promise, label = 'db') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), DB_TIMEOUT_MS)),
  ]);
}

async function withDb(fn, label = 'ssic db') {
  const pg = (await import('pg')).default;
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

  if (action === 'classify') {
    // Single text, or batch: { texts:[...] } -> one classification each.
    if (Array.isArray(body.texts)) {
      const limit = Number(body.limit) || 5;
      return res.status(200).json({ version: VERSION, results: body.texts.map((t) => classifyText(String(t || ''), limit)) });
    }
    const text = String(body.text || '');
    if (!text.trim()) return res.status(400).json({ error: 'Required: action="classify", text=string (or texts=array)' });
    return res.status(200).json({ version: VERSION, ...classifyText(text, Number(body.limit) || 5) });
  }

  return res.status(400).json({ error: 'Invalid action. Use classify | seed | status' });
}
