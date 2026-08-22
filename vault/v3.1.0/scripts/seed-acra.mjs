// v3/scripts/seed-acra.mjs - one-off loader: ACRA "Information on Corporate
// Entities" A-Z CSVs (v3/data/ACRA/*.csv) -> Postgres `acra_entities`.
//
// Run locally (needs POSTGRES_URL / DATABASE_URL / PRISMA_DATABASE_URL in env):
//   node v3/scripts/seed-acra.mjs
//
// Source columns (53, header row per file) - kept fields listed in COLUMNS
// below; every "na" string is stored as SQL NULL (ACRA's own null marker,
// not a real value - keeping it as text would corrupt "not applicable" into
// a false positive on every downstream lookup).
//
// Uses @vercel/postgres (same driver as api/anatomy.js and api/ssic.js's
// ACRA lookup path) - verifies TLS against Vercel's CA, no manual bypass.

import { createReadStream, readdirSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'ACRA');
const BATCH_SIZE = 500;

if (!process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.SSOC_POSTGRES_URL
    || process.env.DATABASE_URL
    || process.env.PRISMA_DATABASE_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || process.env.DATABASE_URL_UNPOOLED
    || '';
}

if (!process.env.POSTGRES_URL) {
  console.error('[seed-acra] No Postgres connection string found in env (POSTGRES_URL / DATABASE_URL / PRISMA_DATABASE_URL).');
  process.exit(1);
}

// Table columns, in insert order. Keys must match CSV header names.
const COLUMNS = [
  'uen', 'entity_name', 'entity_type_description', 'business_constitution_description',
  'company_type_description', 'entity_status_description', 'registration_incorporation_date',
  'uen_issue_date', 'street_name', 'building_name', 'postal_code',
  'account_due_date', 'annual_return_date',
  'primary_ssic_code', 'primary_ssic_description', 'primary_user_described_activity',
  'secondary_ssic_code', 'secondary_ssic_description', 'secondary_user_described_activity',
  'no_of_officers',
  'former_entity_name1', 'former_entity_name2', 'former_entity_name3',
];

function nullify(v) {
  const s = (v == null ? '' : String(v)).trim();
  return (s === '' || s.toLowerCase() === 'na') ? null : s;
}

// Minimal RFC4180 CSV line parser (handles quoted fields with embedded commas
// and doubled quotes); ACRA's export is well-formed single-line records.
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function ensureTable(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS acra_entities (
    uen text PRIMARY KEY,
    entity_name text NOT NULL,
    entity_type_description text,
    business_constitution_description text,
    company_type_description text,
    entity_status_description text,
    registration_incorporation_date date,
    uen_issue_date date,
    street_name text,
    building_name text,
    postal_code text,
    account_due_date date,
    annual_return_date date,
    primary_ssic_code text,
    primary_ssic_description text,
    primary_user_described_activity text,
    secondary_ssic_code text,
    secondary_ssic_description text,
    secondary_user_described_activity text,
    no_of_officers integer,
    former_entity_name1 text,
    former_entity_name2 text,
    former_entity_name3 text
  )`);
  await db.query('CREATE INDEX IF NOT EXISTS acra_entities_name ON acra_entities (entity_name)');
  await db.query('CREATE INDEX IF NOT EXISTS acra_entities_primary_ssic ON acra_entities (primary_ssic_code)');
}

function toDate(v) {
  // ACRA dates are already YYYY-MM-DD or null (from nullify); pass through.
  return v;
}
function toInt(v) {
  if (v == null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

async function insertBatch(db, rows) {
  if (!rows.length) return;
  const cols = COLUMNS;
  const values = [];
  const tuples = rows.map((row, i) => {
    const base = i * cols.length;
    cols.forEach((c) => values.push(row[c]));
    return `(${cols.map((_, j) => `$${base + j + 1}`).join(',')})`;
  });
  const text = `INSERT INTO acra_entities (${cols.join(',')}) VALUES ${tuples.join(',')}
    ON CONFLICT (uen) DO UPDATE SET ${cols.filter((c) => c !== 'uen').map((c) => `${c} = EXCLUDED.${c}`).join(',')}`;
  await db.query(text, values);
}

async function seedFile(db, filePath) {
  const rl = createInterface({ input: createReadStream(filePath, 'utf8'), crlfDelay: Infinity });
  let header = null;
  let batch = [];
  let count = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (!header) { header = fields; continue; }
    const rec = {};
    header.forEach((h, i) => { rec[h] = fields[i]; });

    const row = {
      uen: nullify(rec.uen),
      entity_name: nullify(rec.entity_name),
      entity_type_description: nullify(rec.entity_type_description),
      business_constitution_description: nullify(rec.business_constitution_description),
      company_type_description: nullify(rec.company_type_description),
      entity_status_description: nullify(rec.entity_status_description),
      registration_incorporation_date: toDate(nullify(rec.registration_incorporation_date)),
      uen_issue_date: toDate(nullify(rec.uen_issue_date)),
      street_name: nullify(rec.street_name),
      building_name: nullify(rec.building_name),
      postal_code: nullify(rec.postal_code),
      account_due_date: toDate(nullify(rec.account_due_date)),
      annual_return_date: toDate(nullify(rec.annual_return_date)),
      primary_ssic_code: nullify(rec.primary_ssic_code),
      primary_ssic_description: nullify(rec.primary_ssic_description),
      primary_user_described_activity: nullify(rec.primary_user_described_activity),
      secondary_ssic_code: nullify(rec.secondary_ssic_code),
      secondary_ssic_description: nullify(rec.secondary_ssic_description),
      secondary_user_described_activity: nullify(rec.secondary_user_described_activity),
      no_of_officers: toInt(nullify(rec.no_of_officers)),
      former_entity_name1: nullify(rec.former_entity_name1),
      former_entity_name2: nullify(rec.former_entity_name2),
      former_entity_name3: nullify(rec.former_entity_name3),
    };
    if (!row.uen || !row.entity_name) continue; // skip malformed rows
    batch.push(row);
    count++;
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(db, batch);
      batch = [];
    }
  }
  if (batch.length) await insertBatch(db, batch);
  return count;
}

async function main() {
  // POSTGRES_URL pulled via `vercel env pull` is a direct (non-pooled)
  // connection string - @vercel/postgres's default `sql` export expects a
  // pooled string, so use createClient() as the library's own error message
  // recommends for direct connections.
  const { createClient } = await import('@vercel/postgres');
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  const db = { query: (text, values) => client.query(text, values) };
  await ensureTable(db);

  const files = readdirSync(DATA_DIR).filter((f) => f.toLowerCase().endsWith('.csv')).sort();
  let total = 0;
  for (const f of files) {
    const filePath = path.join(DATA_DIR, f);
    const n = await seedFile(db, filePath);
    total += n;
    console.log(`[seed-acra] ${f}: ${n} rows (running total ${total})`);
  }

  const { rows: countRows } = await db.query('SELECT COUNT(*)::int AS n FROM acra_entities');
  const { rows: ssicRows } = await db.query("SELECT COUNT(*)::int AS n FROM acra_entities WHERE primary_ssic_code IS NOT NULL");
  console.log(`[seed-acra] DONE. Parsed ${total} rows. Table has ${countRows[0].n} entities, ${ssicRows[0].n} with a primary SSIC code.`);

  await client.end();
}

main().catch((err) => {
  console.error('[seed-acra] FAILED:', err);
  process.exit(1);
});
