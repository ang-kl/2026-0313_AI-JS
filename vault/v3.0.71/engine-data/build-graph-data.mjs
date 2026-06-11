// v3/engine-data/build-graph-data.mjs — bakes the ?view=graph data from real sources.
// Reads script/graph_spec.json (the MCF ingest output), runs the deterministic engine for
// the role's computed AI-Exposure, and derives skill<->responsibility links by transparent
// token-overlap (marked "inferred", never asserted). Writes v3/src/graph-data.json.
//   run: node v3/engine-data/build-graph-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeEngine } from './engine-core.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const specPath = new URL('../../script/graph_spec.json', import.meta.url);
const outPath = new URL('../src/graph-data.json', import.meta.url);

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const t = spec.target;

// ---- deterministic token-overlap (inferred skill<->responsibility links) ----
const STOP = new Set('a an the of to for and or in on with at by is are be as you we your our this that it its will can also into across over end via e g i ll re'.split(' '));
const toks = (s) => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => (w.length > 4 ? w.replace(/(ing|ies|es|s)$/, '') : w));
function overlap(skill, resp) {
  const A = new Set(toks(skill)); if (!A.size) return 0;
  const B = new Set(toks(resp)); let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / A.size; // fraction of the skill's tokens present in the responsibility
}

const engine = computeEngine({ ssoc: t.ssoc, title: t.title });

// ---- build nodes (4 columns) + edges (real star + computed occupation + inferred skill~resp) ----
const nodes = [];
const edges = [];
const add = (n) => { nodes.push(n); return n.id; };

const roleId = add({
  id: 'role', col: 'role', label: t.title,
  status: 'stated', prov: 'mcf',
  meta: { employer: t.employer, salary: [t.salary_min, t.salary_max], seniority: t.seniority?.[0], ssoc: t.ssoc, vacancies: t.vacancies, categories: t.categories },
});

// occupation column (computed from SSOC via the engine)
const occLabel = engine.ok ? engine.occupation.label : null;
const occId = add({
  id: 'occ', col: 'occupation',
  label: occLabel || `SSOC ${t.ssoc} (no occupation resolved)`,
  status: engine.ok ? 'computed' : 'inferred', prov: engine.ok ? 'computed' : 'unverified',
  meta: engine.ok ? { isco: engine.occupation.isco, soc: engine.occupation.soc, ssoc: t.ssoc } : { ssoc: t.ssoc },
});
edges.push({ a: roleId, b: occId, kind: 'computed' });

// skills column (verbatim MCF tags)
const skillIds = (t.skills || []).map((s, i) => add({ id: `sk${i}`, col: 'skill', label: s, status: 'stated', prov: 'mcf' }));
skillIds.forEach((id) => edges.push({ a: roleId, b: id, kind: 'stated' }));

// responsibilities column (verbatim MCF lines)
const respIds = (t.responsibilities || []).map((r, i) => add({ id: `re${i}`, col: 'responsibility', label: r, status: 'stated', prov: 'mcf' }));
respIds.forEach((id) => edges.push({ a: roleId, b: id, kind: 'stated' }));

// inferred skill<->responsibility links: each skill keeps only its strongest matches
// (overlap >= 0.5 of the skill's tokens, top 4) so links stay meaningful, not generic noise.
(t.skills || []).forEach((sk, si) => {
  (t.responsibilities || [])
    .map((re, ri) => ({ ri, score: overlap(sk, re) }))
    .filter((m) => m.score >= 0.5)
    .sort((x, y) => y.score - x.score)
    .slice(0, 4)
    .forEach((m) => edges.push({ a: `sk${si}`, b: `re${m.ri}`, kind: 'inferred', score: Math.round(m.score * 100) / 100 }));
});

const out = {
  generated: spec.generated,
  role: { uuid: t.uuid, source_url: t.source_url },
  engine, // full deterministic engine result (exposure + occupation + provenance)
  columns: [
    { key: 'role', title: 'Role', sub: '🇸🇬 MyCareersFuture posting' },
    { key: 'occupation', title: 'Occupation', sub: 'SSOC → ISCO (computed)' },
    { key: 'skill', title: 'Skills', sub: 'MCF skill tags' },
    { key: 'responsibility', title: 'Responsibilities', sub: 'from the job description' },
  ],
  nodes,
  edges,
  corroboration: (spec.corroboration_set || []).map((c) => ({ title: c.title, seniority: c.seniority?.[0], salary: [c.salary_min, c.salary_max], posted: c.posted, url: c.source_url })),
};

writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`wrote ${fileURLToPath(outPath)}`);
console.log(`  nodes ${nodes.length}  edges ${edges.length} (inferred skill~resp: ${edges.filter((e) => e.kind === 'inferred').length})`);
console.log(`  exposure: ${engine.ok ? engine.exposure.index + '/100 ' + engine.exposure.band : 'withheld (' + engine.reason + ')'}`);
