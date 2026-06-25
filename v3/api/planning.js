// v3/api/planning.js - V3-only planning Kanban persistence.
// Stores storyboard board cards separately from analysis/runtime tables.
// Preferred DB: PLANNING_POSTGRES_URL. Fallback: existing POSTGRES_URL/DATABASE_URL.

process.env.POSTGRES_URL = process.env.PLANNING_POSTGRES_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED || "";

import crypto from 'crypto';
import { sql } from '@vercel/postgres';

export const config = { api: { bodyParser: true }, maxDuration: 15 };

const BOARD_KEY = 'v3-skillset-storyboard';
const LANES = new Set(['doctrine', 'ready', 'build', 'govern', 'research', 'decide', 'done']);
const SESSION_COOKIE = 'tara_sess';

const DEFAULT_LANES = [
  { id: 'doctrine', position: 0, title: 'Doctrine', cue: 'What must stay true' },
  { id: 'ready', position: 1, title: 'Ready', cue: 'Ready to shape into UI' },
  { id: 'build', position: 2, title: 'Build next', cue: 'Storyboard the product' },
  { id: 'govern', position: 3, title: 'Governance', cue: 'Keep agentic risk visible' },
  { id: 'research', position: 4, title: 'Research / data', cue: 'Evidence before advice' },
  { id: 'decide', position: 5, title: 'Needs decision', cue: 'Choose before building' },
  { id: 'done', position: 6, title: 'Done', cue: 'Accepted direction' },
];

const DEFAULT_CARDS = [
  ['north-star', 'doctrine', 'V3 north star', '0-1', 'Doctrine', 'Read a job ad as a work-system signal, not only a vacancy.', 'Every panel returns to apply, prepare, compare, redesign, agent candidate, or withhold.'],
  ['ethos', 'doctrine', 'Ethos as product test', '3', 'Values', 'Curiosity, collaboration, customer focus, first principles, breadth, systems, judgment.', 'Each new feature must name which ethos it serves and what it protects.'],
  ['deterministic-ideals', 'doctrine', 'Computed before explained', '5', 'Engine', 'Numbers come from deterministic code or verified data; LLMs narrate, not invent.', 'Every claim carries from MCF, computed, derived, AI estimate, unverified, or withheld.'],
  ['v2-inheritance', 'ready', 'Keep the V2 edge', 'Version 2', 'Continuity', 'Fast role read, ESCO skills, AI readiness, progression, crossover, comparison.', 'V3 must not bury the simple role answer under organisation theory.'],
  ['ten-c', 'ready', '10C role-reading ritual', 'Workflow', 'Workflow', 'Call, compact, cryptic, cross-reference, people, words, sentence, chain, lesson, outcome.', 'Use as the Ask-to-Decide reasoning path, not as decorative prompts.'],
  ['runtime-honesty', 'ready', 'Runtime honesty', '8', 'Runtime', 'OpenAI primary, Gemini fallback, DMM trace, provider disclosure.', 'Logs and UI disclose provider, fallback, deterministic step, and generated step.'],
  ['centre-map', 'build', 'Centre Map redesign', '13-14, 15.8', 'UI', 'RoleGraph and OrgGraph become the centre. Left floats. Right collapses.', 'On iPhone and iPad mini, the centre gets priority and side panels never crowd it.'],
  ['org-query', 'build', 'Organisation query mode', '15', 'Org', 'Typing DBS should mean: what is this organisation hiring for, building, governing, redesigning?', 'Company resolver, employer postings, function lanes, repeated duties, withhold floor.'],
  ['job-drawer', 'build', 'Floating job drawer', '10.5, 13.2', 'Evidence', 'Keep verbatim posting evidence close to the map as a movable drawer.', 'Source text is never lost while the user compares roles or organisation clusters.'],
  ['demand-proof', 'build', 'Demand-proof ranking', '7.5, 10.3, 13.5', 'Market', 'Split exact title, duty match, segment match, adjacent role, employer context.', 'A search like transformation shows title matches first, then responsibility and segment matches.'],
  ['ledger', 'govern', 'Decide as governance ledger', '6.7, 13.3', 'Govern', 'Decision, evidence, deterministic result, AI interpretation, risk, owner, allowed action.', 'No autonomous action appears deployable without owner, scope, audit, and stop condition.'],
  ['agent-identity', 'govern', 'Agent identity cards', '6.2-6.6', 'Agent', 'Every agent output names purpose, owner, evidence, limits, expiry, and whether LLM was used.', 'Agent candidate is visually distinct from deployable agent.'],
  ['aioe', 'research', 'AIOE backbone', '2.4, 5.7, 13.7', 'Data', 'SSOC to ISCO to SOC to AIOE, with lm2023, ig2023, agg2021, delta, confidence.', 'Missing chain means withhold, never silently convert missing exposure to zero.'],
  ['pro-worker', 'research', 'Pro-worker AI lens', '2.2, 4.10', 'Research', 'Prefer labor-augmenting, expertise-leveling, and new-task creating over blind automation.', 'High exposure triggers deeper reading, not fatalism.'],
  ['agent-count', 'decide', 'Are 11 agents too many?', '11, 19', 'Decision', 'Some seats may be real agents. Others may be deterministic checks or hidden review modes.', 'First release names essential seats, analysis-only seats, and deferred seats.'],
  ['withhold-floor', 'decide', 'Minimum evidence threshold', '10.3, 15.1, 19', 'Decision', 'Decide when visible postings are enough to show organisation-level claims.', 'Thin demand produces withheld or caveated cards, not confident advice.'],
  ['bpr-threshold', 'decide', 'When to recommend BPR', '4.4, 9.6, 15.6, 19', 'Decision', 'A BPR recommendation is strong; it needs enough evidence of friction or role mash-up.', 'Define the trigger from repeated duties, unclear ownership, handoff failure, or governance gap.'],
].map(([id, lane, title, source, kind, body, acceptance], position) => ({
  id, boardKey: BOARD_KEY, lane, position, title, source, kind, body, acceptance,
}));

const str = (x, max = 500) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, max);
const laneOf = x => LANES.has(String(x || '')) ? String(x) : 'decide';
const positionOf = x => Math.max(0, Math.min(10000, Number.isFinite(Number(x)) ? Number(x) : 0));

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').map(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return null;
    return [part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim())];
  }).filter(Boolean));
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function readOwnerSession(req) {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  const ownerId = String(process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID || '').trim();
  if (!token || !ownerId) return null;

  const value = parseCookies(req)[SESSION_COOKIE];
  if (!value) return null;
  const [payloadB64, sigB64] = value.split('.');
  if (!payloadB64 || !sigB64) return null;

  const expected = b64url(crypto.createHmac('sha256', token).update(payloadB64).digest());
  if (!safeEqual(expected, sigB64)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (String(payload.uid) !== ownerId) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

let ensured = false;

async function ensureTables() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS planning_boards (
    board_key TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS planning_cards (
    id TEXT PRIMARY KEY,
    board_key TEXT NOT NULL REFERENCES planning_boards(board_key) ON DELETE CASCADE,
    lane TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    source TEXT,
    kind TEXT,
    body TEXT,
    acceptance TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS planning_cards_board_lane ON planning_cards (board_key, lane, position, updated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS planning_cards_deleted ON planning_cards (board_key, deleted_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS planning_lanes (
    id TEXT NOT NULL,
    board_key TEXT NOT NULL REFERENCES planning_boards(board_key) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    cue TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (board_key, id)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS planning_lanes_board ON planning_lanes (board_key, position)`;
  await sql`CREATE TABLE IF NOT EXISTS planning_card_events (
    id BIGSERIAL PRIMARY KEY,
    board_key TEXT NOT NULL,
    card_id TEXT,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS planning_card_events_board ON planning_card_events (board_key, created_at DESC)`;
  ensured = true;
}

async function logEvent(cardId, eventType, payload) {
  try {
    await sql`INSERT INTO planning_card_events (board_key, card_id, event_type, payload)
      VALUES (${BOARD_KEY}, ${cardId || null}, ${eventType}, ${JSON.stringify(payload || {})})`;
  } catch (_) {}
}

async function ensureSeed() {
  await sql`INSERT INTO planning_boards (board_key, title)
    VALUES (${BOARD_KEY}, ${'V3 Skillset Storyboard'})
    ON CONFLICT (board_key) DO NOTHING`;

  for (const lane of DEFAULT_LANES) {
    await sql`INSERT INTO planning_lanes (id, board_key, position, title, cue)
      VALUES (${lane.id}, ${BOARD_KEY}, ${lane.position}, ${lane.title}, ${lane.cue})
      ON CONFLICT (board_key, id) DO NOTHING`;
  }

  const { rows } = await sql`SELECT COUNT(*)::int AS n FROM planning_cards WHERE board_key=${BOARD_KEY}`;
  if ((rows[0] && rows[0].n) > 0) return;

  for (const card of DEFAULT_CARDS) {
    await sql`INSERT INTO planning_cards (id, board_key, lane, position, title, source, kind, body, acceptance)
      VALUES (${card.id}, ${BOARD_KEY}, ${card.lane}, ${card.position}, ${card.title}, ${card.source}, ${card.kind}, ${card.body}, ${card.acceptance})
      ON CONFLICT (id) DO NOTHING`;
  }
  await logEvent(null, 'seed', { count: DEFAULT_CARDS.length });
}

function rowToCard(row) {
  return {
    id: row.id,
    lane: row.lane,
    position: row.position,
    title: row.title,
    source: row.source || '',
    kind: row.kind || '',
    body: row.body || '',
    acceptance: row.acceptance || '',
    deletedAt: row.deleted_at || null,
    updatedAt: row.updated_at || null,
  };
}

function rowToLane(row) {
  return {
    id: row.id,
    position: row.position,
    title: row.title,
    cue: row.cue || '',
    updatedAt: row.updated_at || null,
  };
}

function laneInput(item, fallback) {
  return {
    id: fallback.id,
    position: item && Number.isFinite(Number(item.position)) ? positionOf(item.position) : fallback.position,
    title: str(item && item.title, 80) || fallback.title,
    cue: str(item && item.cue, 140) || fallback.cue,
  };
}

async function listBoard() {
  await ensureTables();
  await ensureSeed();
  const lanes = await sql`SELECT id, position, title, cue, updated_at
    FROM planning_lanes WHERE board_key=${BOARD_KEY}
    ORDER BY position ASC, id ASC`;
  const active = await sql`SELECT id, lane, position, title, source, kind, body, acceptance, deleted_at, updated_at
    FROM planning_cards WHERE board_key=${BOARD_KEY} AND deleted_at IS NULL
    ORDER BY lane ASC, position ASC, updated_at ASC`;
  const deleted = await sql`SELECT id, lane, position, title, source, kind, body, acceptance, deleted_at, updated_at
    FROM planning_cards WHERE board_key=${BOARD_KEY} AND deleted_at IS NOT NULL
    ORDER BY deleted_at DESC LIMIT 40`;
  return { lanes: lanes.rows.map(rowToLane), cards: active.rows.map(rowToCard), deletedCards: deleted.rows.map(rowToCard) };
}

async function saveCard(input) {
  const id = str(input.id, 80) || crypto.randomUUID();
  const lane = laneOf(input.lane);
  const position = positionOf(input.position);
  const title = str(input.title, 140) || 'Untitled card';
  const source = str(input.source, 80);
  const kind = str(input.kind, 40) || 'Plan';
  const body = str(input.body, 600);
  const acceptance = str(input.acceptance, 700);
  await sql`INSERT INTO planning_cards (id, board_key, lane, position, title, source, kind, body, acceptance, deleted_at, updated_at)
    VALUES (${id}, ${BOARD_KEY}, ${lane}, ${position}, ${title}, ${source}, ${kind}, ${body}, ${acceptance}, NULL, now())
    ON CONFLICT (id) DO UPDATE SET
      lane=EXCLUDED.lane,
      position=EXCLUDED.position,
      title=EXCLUDED.title,
      source=EXCLUDED.source,
      kind=EXCLUDED.kind,
      body=EXCLUDED.body,
      acceptance=EXCLUDED.acceptance,
      deleted_at=NULL,
      updated_at=now()`;
  await logEvent(id, input.id ? 'update' : 'create', { lane, position, title });
  return { id, lane, position, title, source, kind, body, acceptance };
}

async function saveOrder(cards) {
  if (!Array.isArray(cards)) return;
  for (const item of cards.slice(0, 200)) {
    const id = str(item && item.id, 80);
    if (!id) continue;
    await sql`UPDATE planning_cards
      SET lane=${laneOf(item.lane)}, position=${positionOf(item.position)}, updated_at=now()
      WHERE board_key=${BOARD_KEY} AND id=${id} AND deleted_at IS NULL`;
  }
  await logEvent(null, 'move', { count: cards.length });
}

async function saveLanes(lanes) {
  if (!Array.isArray(lanes)) return;
  const byId = new Map(lanes.filter(item => item && LANES.has(String(item.id))).map(item => [String(item.id), item]));
  for (const fallback of DEFAULT_LANES) {
    const lane = laneInput(byId.get(fallback.id), fallback);
    await sql`INSERT INTO planning_lanes (id, board_key, position, title, cue, updated_at)
      VALUES (${lane.id}, ${BOARD_KEY}, ${lane.position}, ${lane.title}, ${lane.cue}, now())
      ON CONFLICT (board_key, id) DO UPDATE SET
        position=EXCLUDED.position,
        title=EXCLUDED.title,
        cue=EXCLUDED.cue,
        updated_at=now()`;
  }
  await logEvent(null, 'lanes:update', { count: DEFAULT_LANES.length });
}

async function softDelete(id) {
  const cleanId = str(id, 80);
  if (!cleanId) return;
  await sql`UPDATE planning_cards SET deleted_at=now(), updated_at=now()
    WHERE board_key=${BOARD_KEY} AND id=${cleanId} AND deleted_at IS NULL`;
  await logEvent(cleanId, 'delete', {});
}

async function restoreCard(id, lane) {
  const cleanId = str(id, 80);
  if (!cleanId) return;
  await sql`UPDATE planning_cards SET deleted_at=NULL, lane=${laneOf(lane)}, updated_at=now()
    WHERE board_key=${BOARD_KEY} AND id=${cleanId}`;
  await logEvent(cleanId, 'restore', { lane: laneOf(lane) });
}

export default async function handler(req, res) {
  if (!readOwnerSession(req)) {
    return res.status(401).json({ ok: false, error: 'Telegram login required' });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const body = req.body || {};
  const action = body.action || 'list';

  try {
    await ensureTables();
    await ensureSeed();

    if (action === 'list') {
      const board = await listBoard();
      return res.status(200).json({ ok: true, storage: 'database', boardKey: BOARD_KEY, ...board });
    }

    if (action === 'saveCard') {
      const card = await saveCard(body.card || {});
      const board = await listBoard();
      return res.status(200).json({ ok: true, storage: 'database', card, ...board });
    }

    if (action === 'saveOrder') {
      await saveOrder(body.cards || []);
      const board = await listBoard();
      return res.status(200).json({ ok: true, storage: 'database', ...board });
    }

    if (action === 'saveLanes') {
      await saveLanes(body.lanes || []);
      const board = await listBoard();
      return res.status(200).json({ ok: true, storage: 'database', ...board });
    }

    if (action === 'deleteCard') {
      await softDelete(body.id);
      const board = await listBoard();
      return res.status(200).json({ ok: true, storage: 'database', ...board });
    }

    if (action === 'restoreCard') {
      await restoreCard(body.id, body.lane || 'decide');
      const board = await listBoard();
      return res.status(200).json({ ok: true, storage: 'database', ...board });
    }

    return res.status(400).json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    console.error('[planning]', err && err.message);
    return res.status(200).json({
      ok: false,
      storage: 'unavailable',
      error: 'planning database unavailable',
      lanes: DEFAULT_LANES,
      cards: DEFAULT_CARDS,
      deletedCards: [],
    });
  }
}
