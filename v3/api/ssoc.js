// v3/api/ssoc.js - SSOC 2024 taxonomy store and lookup.
// Source files: SingStat SSOC 2024 Classification Structure, Detailed
// Definitions, and Type of Change at Occupational Level. The endpoint keeps a
// Postgres copy for lookup/search and falls back to the compiled JSON files if
// the database is not configured.

if (!process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.SSOC_POSTGRES_URL
    || process.env.DATABASE_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || process.env.DATABASE_URL_UNPOOLED
    || "";
}

import { readFileSync } from 'node:fs';
import { createClient } from '@vercel/postgres';
// @vercel/postgres (not raw `pg`) - matches api/anatomy.js and api/ssic.js's proven
// pattern. Vercel's bundler does not include `pg` (it's only a transitive dependency
// of @vercel/postgres, not a declared one), so importing it directly 500s in
// production ("Cannot find package 'pg'") - this endpoint silently fell back to its
// in-memory dataset because of that bug. createClient() (not the `sql` tagged
// template) because POSTGRES_URL from `vercel env pull` is a direct, non-pooled
// connection string - see scripts/seed-acra.mjs for the same finding.

export const config = { api: { bodyParser: true }, maxDuration: 300 };

const HIERARCHY_URL = new URL('../engine-data/ssoc2024-hierarchy.json', import.meta.url);
const CHANGE_URL = new URL('../engine-data/ssoc2024-type-of-change.json', import.meta.url);
const ISCO_CORR_URL = new URL('../engine-data/ssoc2024-isco08-correspondence.json', import.meta.url);
const SSOC2020_CORR_URL = new URL('../engine-data/ssoc2024-ssoc2020-correspondence.json', import.meta.url);
const VERSION = '2024';

let cachedFlat = null;
let cachedCorrespondence = null;
let ensured = false;

const safe = (value, max = 240) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
const arr = (value, max = 40) => Array.isArray(value) ? value.map((x) => safe(x, 500)).filter(Boolean).slice(0, max) : [];
const DB_TIMEOUT_MS = Math.max(500, Math.min(10000, Number(process.env.SSOC_DB_TIMEOUT_MS) || 2500));

function withTimeout(promise, label = 'db') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), DB_TIMEOUT_MS)),
  ]);
}

async function withDb(fn, label = 'ssoc db') {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await withTimeout(client.connect(), `${label} connect`);
  const db = {
    sql(strings, ...values) {
      const text = strings.reduce((acc, part, index) => `${acc}${part}${index < values.length ? `$${index + 1}` : ''}`, '');
      return client.query(text, values);
    },
    query(text, values) {
      return client.query(text, values);
    },
  };
  try {
    return await fn(db);
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

function loadFlat() {
  if (cachedFlat) return cachedFlat;
  const hierarchy = JSON.parse(readFileSync(HIERARCHY_URL, 'utf8'));
  const change = JSON.parse(readFileSync(CHANGE_URL, 'utf8'));
  const changeByCode = new Map((change.changes || []).map((item) => [item.code, item.change_type || '']));
  const nodes = [];

  function pushNode(node, level, parentCode, path, kind, sourceKind = 'source') {
    nodes.push({
      version: VERSION,
      code: node.code,
      level,
      kind,
      title: safe(node.title, 320),
      parent_code: parentCode || '',
      path,
      definition: safe(node.definition, 6000),
      tasks: arr(node.tasks, 80),
      examples: arr(node.examples, 80),
      exclusions: arr(node.exclusions, 80),
      change_type: changeByCode.get(node.code) || '',
      source_kind: sourceKind,
    });
  }

  for (const major of hierarchy.major_groups || []) {
    pushNode(major, 1, '', [major.code], 'major_group');
    for (const sub of major.sub_major_groups || []) {
      const subSource = sub.code.startsWith('X') && sub.code !== 'X' ? 'derived_x_bridge' : 'source';
      pushNode(sub, 2, major.code, [major.code, sub.code], 'sub_major_group', subSource);
      for (const minor of sub.minor_groups || []) {
        const minorSource = minor.code.startsWith('X') ? 'derived_x_bridge' : 'source';
        pushNode(minor, 3, sub.code, [major.code, sub.code, minor.code], 'minor_group', minorSource);
        for (const unit of minor.unit_groups || []) {
          const unitSource = unit.code.startsWith('X') ? 'derived_x_bridge' : 'source';
          pushNode(unit, 4, minor.code, [major.code, sub.code, minor.code, unit.code], 'unit_group', unitSource);
          for (const occ of unit.occupations || []) {
            pushNode(occ, 5, unit.code, [major.code, sub.code, minor.code, unit.code, occ.code], 'occupation');
          }
        }
      }
    }
  }
  cachedFlat = {
    nodes,
    counts: nodes.reduce((acc, node) => {
      acc[node.kind] = (acc[node.kind] || 0) + 1;
      return acc;
    }, {}),
  };
  return cachedFlat;
}

function loadCorrespondence() {
  if (cachedCorrespondence) return cachedCorrespondence;
  const isco = JSON.parse(readFileSync(ISCO_CORR_URL, 'utf8')).rows || [];
  const ssoc2020 = JSON.parse(readFileSync(SSOC2020_CORR_URL, 'utf8')).rows || [];
  cachedCorrespondence = [
    ...isco.map((row) => ({
      version: VERSION,
      type: 'ssoc2024_isco08',
      source_code: row.ssoc2024,
      target_code: row.isco,
      source_title: row.ssoc2024_title,
      target_title: row.isco_title,
      part: Boolean(row.isco_part),
      raw: row,
    })),
    ...ssoc2020.map((row) => ({
      version: VERSION,
      type: 'ssoc2024_ssoc2020',
      source_code: row.ssoc2024,
      target_code: row.ssoc2020,
      source_title: row.ssoc2024_title,
      target_title: row.ssoc2020_title,
      part: Boolean(row.ssoc2020_part),
      raw: row,
    })),
  ];
  return cachedCorrespondence;
}

async function ensureTables(db) {
  if (ensured) return;
  await db.sql`CREATE TABLE IF NOT EXISTS ssoc_taxonomy_nodes (
    version TEXT NOT NULL,
    code TEXT NOT NULL,
    level INT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    parent_code TEXT,
    path JSONB NOT NULL,
    definition TEXT,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    examples JSONB NOT NULL DEFAULT '[]'::jsonb,
    exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    change_type TEXT,
    source_kind TEXT NOT NULL DEFAULT 'source',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (version, code)
  )`;
  await db.sql`CREATE INDEX IF NOT EXISTS ssoc_taxonomy_nodes_title ON ssoc_taxonomy_nodes USING gin (to_tsvector('english', title || ' ' || COALESCE(definition, '')))`;
  await db.sql`CREATE INDEX IF NOT EXISTS ssoc_taxonomy_nodes_parent ON ssoc_taxonomy_nodes (version, parent_code, level)`;
  await db.sql`CREATE TABLE IF NOT EXISTS ssoc_taxonomy_meta (
    version TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    node_count INT NOT NULL,
    occupation_count INT NOT NULL,
    seeded_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await db.sql`CREATE TABLE IF NOT EXISTS ssoc_correspondence (
    version TEXT NOT NULL,
    type TEXT NOT NULL,
    source_code TEXT NOT NULL,
    target_code TEXT NOT NULL,
    source_title TEXT,
    target_title TEXT,
    part BOOLEAN NOT NULL DEFAULT false,
    raw JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (version, type, source_code, target_code)
  )`;
  await db.sql`CREATE INDEX IF NOT EXISTS ssoc_correspondence_source ON ssoc_correspondence (version, type, source_code)`;
  ensured = true;
}

async function seedDatabase() {
  const flat = loadFlat();
  const correspondence = loadCorrespondence();
  return withDb(async (db) => {
    await ensureTables(db);
    let upserted = 0;
    const columnsPerRow = 13;
    const chunkSize = 120;
    for (let start = 0; start < flat.nodes.length; start += chunkSize) {
      const chunk = flat.nodes.slice(start, start + chunkSize);
      const values = [];
      const tuples = chunk.map((node, rowIndex) => {
        const base = rowIndex * columnsPerRow;
        values.push(
          node.version,
          node.code,
          node.level,
          node.kind,
          node.title,
          node.parent_code || null,
          JSON.stringify(node.path),
          node.definition || null,
          JSON.stringify(node.tasks),
          JSON.stringify(node.examples),
          JSON.stringify(node.exclusions),
          node.change_type || null,
          node.source_kind,
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}::jsonb, $${base + 8}, $${base + 9}::jsonb, $${base + 10}::jsonb, $${base + 11}::jsonb, $${base + 12}, $${base + 13})`;
      }).join(', ');
      await db.query(`INSERT INTO ssoc_taxonomy_nodes
        (version, code, level, kind, title, parent_code, path, definition, tasks, examples, exclusions, change_type, source_kind)
        VALUES ${tuples}
        ON CONFLICT (version, code) DO UPDATE SET
          level=EXCLUDED.level,
          kind=EXCLUDED.kind,
          title=EXCLUDED.title,
          parent_code=EXCLUDED.parent_code,
          path=EXCLUDED.path,
          definition=EXCLUDED.definition,
          tasks=EXCLUDED.tasks,
          examples=EXCLUDED.examples,
          exclusions=EXCLUDED.exclusions,
          change_type=EXCLUDED.change_type,
          source_kind=EXCLUDED.source_kind,
          updated_at=now()`, values);
      upserted += chunk.length;
    }
    await db.sql`INSERT INTO ssoc_taxonomy_meta (version, source, node_count, occupation_count, seeded_at)
      VALUES (${VERSION}, ${'SingStat SSOC 2024 Classification Structure + Detailed Definitions + Type of Change'}, ${flat.nodes.length}, ${flat.counts.occupation || 0}, now())
      ON CONFLICT (version) DO UPDATE SET source=EXCLUDED.source, node_count=EXCLUDED.node_count, occupation_count=EXCLUDED.occupation_count, seeded_at=now()`;
    let correspondenceUpserted = 0;
    const corrCols = 8;
    const corrChunkSize = 160;
    for (let start = 0; start < correspondence.length; start += corrChunkSize) {
      const chunk = correspondence.slice(start, start + corrChunkSize);
      const values = [];
      const tuples = chunk.map((row, rowIndex) => {
        const base = rowIndex * corrCols;
        values.push(row.version, row.type, row.source_code, row.target_code, row.source_title, row.target_title, row.part, JSON.stringify(row.raw));
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}::jsonb)`;
      }).join(', ');
      await db.query(`INSERT INTO ssoc_correspondence
        (version, type, source_code, target_code, source_title, target_title, part, raw)
        VALUES ${tuples}
        ON CONFLICT (version, type, source_code, target_code) DO UPDATE SET
          source_title=EXCLUDED.source_title,
          target_title=EXCLUDED.target_title,
          part=EXCLUDED.part,
          raw=EXCLUDED.raw,
          updated_at=now()`, values);
      correspondenceUpserted += chunk.length;
    }
    return { ok: true, db: true, upserted, correspondence_upserted: correspondenceUpserted, counts: flat.counts };
  }, 'ssoc seed');
}

function fallbackSearch(query, limit) {
  const q = safe(query, 120).toLowerCase();
  if (!q) return [];
  return loadFlat().nodes
    .filter((node) => node.code.toLowerCase().includes(q) || node.title.toLowerCase().includes(q) || node.definition.toLowerCase().includes(q))
    .sort((a, b) => (a.level - b.level) || a.title.localeCompare(b.title))
    .slice(0, limit);
}

const CLASSIFIER_STOP = new Set([
  'and', 'the', 'for', 'with', 'from', 'into', 'onto', 'this', 'that', 'role', 'roles',
  'job', 'jobs', 'senior', 'junior', 'lead', 'principal', 'assistant', 'associate',
  'executive', 'officer', 'specialist', 'manager', 'director', 'head', 'vice', 'president',
  'svp', 'avp', 'vp', 'contract', 'permanent', 'temporary', 'intern', 'trainee',
  'singapore', 'regional', 'global', 'apac', 'asia', 'bank', 'group', 'team', 'business',
]);

function normaliseForMatch(value) {
  return safe(value, 2000)
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:wd|jr|req|job)[-\s]?\d+\b/gi, ' ')
    .replace(/&amp;/g, ' and ')
    .replace(/[/+_-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return normaliseForMatch(value)
    .split(' ')
    .filter((token) => token.length > 2 && !CLASSIFIER_STOP.has(token));
}

function tokenOverlapScore(left, right) {
  const a = new Set(tokens(left));
  const b = new Set(tokens(right));
  if (!a.size || !b.size) return 0;
  let hits = 0;
  a.forEach((token) => { if (b.has(token)) hits += 1; });
  return hits / Math.max(a.size, b.size);
}

function classifyConfidence(score) {
  if (score >= 105) return 'high';
  if (score >= 72) return 'medium';
  if (score >= 48) return 'low';
  return 'withheld';
}

function shortNode(node) {
  if (!node) return null;
  return {
    code: node.code,
    title: node.title,
    level: node.level,
    kind: node.kind,
    parent_code: node.parent_code || '',
  };
}

function hierarchyFor(node, byCode) {
  const path = Array.isArray(node?.path) ? node.path : [];
  const nodes = path.map((code) => byCode.get(code)).filter(Boolean);
  const get = (kind) => shortNode(nodes.find((item) => item.kind === kind));
  return {
    major_group: get('major_group'),
    sub_major_group: get('sub_major_group'),
    minor_group: get('minor_group'),
    unit_group: get('unit_group') || (node?.kind === 'unit_group' ? shortNode(node) : null),
    occupation: node?.kind === 'occupation' ? shortNode(node) : get('occupation'),
    path: nodes.map(shortNode),
  };
}

// scoreSsocCandidate: title stays the primary signal (SSOC 2024 report section 2.18 sanctions
// title-based coding via the alphabetical index), but duties/context can carry a posting to
// 'low' confidence on their own when the match is strong - SSOC sections 3.3 ("classification is
// by type of work performed") and 3.4 ("principal tasks and duties take priority over the broad
// job level in determining where to classify"). The strong-context tier below (+48) lets a
// contextOverlap >= 0.5 match alone clear the classifyConfidence 'low' floor (48) even with a
// weak/absent title match - it does not touch the withhold floor or any other threshold.
function scoreSsocCandidate(job, node) {
  const title = safe(job.title, 300);
  const categories = arr(job.categories, 12).join(' ');
  const skills = arr(job.skills, 24).join(' ');
  const description = safe(job.description || job.responsibilitiesText || '', 1800);
  const titleNorm = normaliseForMatch(title);
  const nodeTitle = normaliseForMatch(node.title);
  const context = `${title} ${categories} ${skills} ${description}`;
  const nodeContext = `${node.title} ${node.definition || ''} ${(node.tasks || []).slice(0, 12).join(' ')} ${(node.examples || []).slice(0, 12).join(' ')}`;
  let score = 0;
  const reasons = [];

  if (titleNorm && nodeTitle && titleNorm === nodeTitle) {
    score += 120;
    reasons.push('exact title');
  } else {
    const titleOverlap = tokenOverlapScore(title, node.title);
    if (titleOverlap >= 0.99) {
      score += 96;
      reasons.push('title token match');
    } else if (titleOverlap >= 0.66) {
      score += 72;
      reasons.push('strong title overlap');
    } else if (titleOverlap >= 0.4) {
      score += 44;
      reasons.push('partial title overlap');
    }
    if (nodeTitle && titleNorm.includes(nodeTitle) && nodeTitle.length > 6) {
      score += 50;
      reasons.push('posting contains SSOC title');
    }
    if (titleNorm && nodeTitle.includes(titleNorm) && titleNorm.length > 6) {
      score += 50;
      reasons.push('SSOC title contains posting title');
    }
  }

  const contextOverlap = tokenOverlapScore(context, nodeContext);
  if (contextOverlap >= 0.5) {
    score += 48;
    reasons.push('strong responsibility/context match');
  } else if (contextOverlap >= 0.35) {
    score += 24;
    reasons.push('responsibility/context match');
  } else if (contextOverlap >= 0.2) {
    score += 12;
    reasons.push('light context match');
  }

  if (node.kind === 'occupation') score += 6;
  if (node.kind === 'unit_group') score -= 8;

  return {
    score: Math.round(score),
    reasons,
  };
}

function classifySsocJob(job, byCode, occupations) {
  const sourceTitle = safe(job.title, 300);
  if (!sourceTitle) {
    return { id: safe(job.id || job.uuid, 120), title: '', status: 'withheld', score: 0, confidence: 'withheld', reason: 'Missing title.' };
  }
  const candidates = occupations
    .map((node) => ({ node, ...scoreSsocCandidate(job, node) }))
    .filter((item) => item.score > 6 || item.reasons.length)
    .sort((a, b) => b.score - a.score || a.node.title.localeCompare(b.node.title))
    .slice(0, 5);
  const best = candidates[0];
  const confidence = classifyConfidence(best?.score || 0);
  if (!best || confidence === 'withheld') {
    return {
      id: safe(job.id || job.uuid, 120),
      title: sourceTitle,
      status: 'withheld',
      score: best?.score || 0,
      confidence: 'withheld',
      reason: best ? 'Best SSOC score below governance threshold.' : 'No SSOC candidate scored.',
      candidates: candidates.map((item) => ({ score: item.score, confidence: classifyConfidence(item.score), node: shortNode(item.node), reasons: item.reasons })),
    };
  }
  const hierarchy = hierarchyFor(best.node, byCode);
  return {
    id: safe(job.id || job.uuid, 120),
    title: sourceTitle,
    status: 'classified',
    source: 'compiled_ssoc2024',
    score: best.score,
    confidence,
    node: serialiseRow(best.node),
    hierarchy,
    family: hierarchy.unit_group || shortNode(best.node),
    candidates: candidates.map((item) => ({ score: item.score, confidence: classifyConfidence(item.score), node: shortNode(item.node), reasons: item.reasons })),
    reasons: best.reasons,
  };
}

function classifySsocJobs(jobs) {
  const flat = loadFlat();
  const byCode = new Map(flat.nodes.map((node) => [node.code, node]));
  const occupations = flat.nodes.filter((node) => node.kind === 'occupation');
  return (Array.isArray(jobs) ? jobs : [])
    .slice(0, 80)
    .map((job) => classifySsocJob(job || {}, byCode, occupations));
}

function serialiseRow(row) {
  return {
    version: row.version || VERSION,
    code: row.code,
    level: row.level,
    kind: row.kind,
    title: row.title,
    parent_code: row.parent_code || '',
    path: row.path || [],
    definition: row.definition || '',
    tasks: row.tasks || [],
    examples: row.examples || [],
    exclusions: row.exclusions || [],
    change_type: row.change_type || '',
    source_kind: row.source_kind || 'source',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const action = body.action || 'search';
  const limit = Math.max(1, Math.min(80, Number(body.limit) || 20));

  if (action === 'seed') {
    // Disabled: destructive DB seeding has no auth gate in this build. Re-enable behind
    // an owner check only if/when the Postgres path is actually used. (Security finding fix.)
    return res.status(403).json({ ok: false, error: 'seed disabled' });
  }

  if (action === 'status') {
    try {
      const result = await withDb(async (db) => {
        await ensureTables(db);
        const meta = await db.sql`SELECT version, source, node_count, occupation_count, seeded_at FROM ssoc_taxonomy_meta WHERE version=${VERSION}`;
        const count = await db.sql`SELECT COUNT(*)::int AS n FROM ssoc_taxonomy_nodes WHERE version=${VERSION}`;
        const corr = await db.sql`SELECT type, COUNT(*)::int AS n FROM ssoc_correspondence WHERE version=${VERSION} GROUP BY type ORDER BY type`;
        return { meta, count, corr };
      }, 'ssoc status');
      return res.status(200).json({ ok: true, db: true, meta: result.meta.rows[0] || null, node_count: result.count.rows[0]?.n || 0, correspondence_counts: result.corr.rows, fallback_counts: loadFlat().counts });
    } catch (err) {
      return res.status(200).json({ ok: true, db: false, error: err.message, fallback_counts: loadFlat().counts });
    }
  }

  if (action === 'get') {
    const code = safe(body.code, 16);
    if (!code) return res.status(400).json({ error: 'Missing code' });
    try {
      const { rows } = await withDb(async (db) => {
        await ensureTables(db);
        return db.sql`SELECT * FROM ssoc_taxonomy_nodes WHERE version=${VERSION} AND code=${code} LIMIT 1`;
      }, 'ssoc get');
      if (rows.length) return res.status(200).json({ ok: true, db: true, node: serialiseRow(rows[0]) });
    } catch (_) {}
    const node = loadFlat().nodes.find((item) => item.code === code) || null;
    return res.status(200).json({ ok: Boolean(node), db: false, node });
  }

  if (action === 'search') {
    const query = safe(body.query || body.q, 120);
    if (!query) return res.status(200).json({ ok: true, db: false, results: [] });
    try {
      const like = `%${query}%`;
      const { rows } = await withDb(async (db) => {
        await ensureTables(db);
        return db.sql`SELECT * FROM ssoc_taxonomy_nodes
          WHERE version=${VERSION}
            AND (code ILIKE ${like} OR title ILIKE ${like} OR definition ILIKE ${like})
          ORDER BY level ASC, title ASC
          LIMIT ${limit}`;
      }, 'ssoc search');
      return res.status(200).json({ ok: true, db: true, results: rows.map(serialiseRow) });
    } catch (err) {
      return res.status(200).json({ ok: true, db: false, error: err.message, results: fallbackSearch(query, limit) });
    }
  }

  if (action === 'classifyTitles' || action === 'classify_jobs') {
    const jobs = Array.isArray(body.jobs) ? body.jobs : (Array.isArray(body.titles) ? body.titles.map((title, index) => ({ id: String(index + 1), title })) : []);
    if (!jobs.length) return res.status(200).json({ ok: true, db: false, classifications: [] });
    try {
      const classifications = classifySsocJobs(jobs);
      const matched = classifications.filter((item) => item.status === 'classified').length;
      return res.status(200).json({
        ok: true,
        db: false,
        source: 'compiled_ssoc2024',
        matched,
        withheld: classifications.length - matched,
        classifications,
      });
    } catch (err) {
      console.error('[ssoc] classify:', err && err.message);
      return res.status(200).json({ ok: false, db: false, error: err.message, classifications: [] });
    }
  }

  if (action === 'correspondence') {
    const code = safe(body.code, 16);
    const type = safe(body.type, 40);
    if (!code) return res.status(400).json({ error: 'Missing code' });
    try {
      const { rows } = await withDb(async (db) => {
        await ensureTables(db);
        if (type) {
          return db.sql`SELECT type, source_code, target_code, source_title, target_title, part, raw
            FROM ssoc_correspondence
            WHERE version=${VERSION} AND source_code=${code} AND type=${type}
            ORDER BY type, target_code`;
        }
        return db.sql`SELECT type, source_code, target_code, source_title, target_title, part, raw
          FROM ssoc_correspondence
          WHERE version=${VERSION} AND source_code=${code}
          ORDER BY type, target_code`;
      }, 'ssoc correspondence');
      return res.status(200).json({ ok: true, db: true, rows });
    } catch (err) {
      const rows = loadCorrespondence()
        .filter((row) => row.source_code === code && (!type || row.type === type))
        .map((row) => ({
          type: row.type,
          source_code: row.source_code,
          target_code: row.target_code,
          source_title: row.source_title,
          target_title: row.target_title,
          part: row.part,
          raw: row.raw,
        }));
      return res.status(200).json({ ok: true, db: false, error: err.message, rows });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
