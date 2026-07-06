// Determinism + golden-fixture check for the deterministic AIOE engine.
// Implements the R-SNAPSHOT recipe in v3/script/v3-result-engine.recipes.md.
//
// Two assertions per fixture:
//   (1) DETERMINISTIC   — two identical calls to computeEngine() must produce
//                         identical output. Same input, same output.
//   (2) GOLDEN MATCH    — the engine's output must match the values committed
//                         to v3/script/r-snapshot.golden.json (index, zMean,
//                         zRange, via, confidence, version, plus topShare +
//                         label for fingerprint fixtures).
//
// A changed snapshot is not a failure of THIS script — it is a real engine
// change that must be explained in the PR's [HDR] [DELTA] block AND applied
// to the golden fixture in the same PR.
//
// Exit code: 0 on pass, 1 on any failure — so `npm run verify:snapshot` fails
// the build cleanly.
//
// Usage (from v3/): node script/verify-snapshot.mjs

import { computeEngine } from '../engine-data/engine-core.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDEN_PATH = resolve(__dirname, 'r-snapshot.golden.json');

const golden = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8'));
const fixtures = golden.fixtures || {};

let failed = 0;
let passed = 0;

// Where each golden-pinned key actually lives on the engine's output tree.
// Kept explicit so future readers see the mapping without spelunking.
const FIELD_LOCATION = {
  index:      (o) => o.exposure && o.exposure.index,
  zMean:      (o) => o.exposure && o.exposure.zMean,
  zRange:     (o) => o.exposure && o.exposure.zRange,
  confidence: (o) => o.exposure && o.exposure.confidence,
  via:        (o) => o.occupation && o.occupation.via,
  isco:       (o) => o.occupation && o.occupation.isco,
  label:      (o) => o.occupation && o.occupation.label,
  version:    (o) => o.version,
  topShare:   (o) => Array.isArray(o.mirrorRoles) && o.mirrorRoles[0] ? o.mirrorRoles[0].sharePct : undefined,
};

function fmt(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function compare(name, expected, actual, key) {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return true;
  console.log(`  MISMATCH ${key}: expected ${fmt(expected)}, got ${fmt(actual)}`);
  return false;
}

for (const [name, spec] of Object.entries(fixtures)) {
  const input = spec.input || {};
  // (1) Determinism — call twice, stringify, compare.
  const a = computeEngine(input);
  const b = computeEngine(input);
  const deterministic = JSON.stringify(a) === JSON.stringify(b);
  if (!deterministic) {
    console.log(`FAIL ${name}: NON-DETERMINISTIC`);
    failed += 1;
    continue;
  }

  // (2) Golden match — compare every pinned key that has a known location.
  let ok = true;
  if (!a || a.ok !== true) {
    console.log(`FAIL ${name}: engine returned ok=false — ${a && a.reason ? a.reason : 'unknown'}`);
    failed += 1;
    continue;
  }
  for (const key of Object.keys(FIELD_LOCATION)) {
    if (!(key in spec)) continue;
    const actual = FIELD_LOCATION[key](a);
    if (!compare(name, spec[key], actual, key)) ok = false;
  }

  if (ok) {
    const exposure = a.exposure || {};
    const occupation = a.occupation || {};
    console.log(`PASS ${name}: DETERMINISTIC + GOLDEN (index=${exposure.index}, via=${occupation.via}, confidence=${exposure.confidence})`);
    passed += 1;
  } else {
    console.log(`FAIL ${name}: GOLDEN DRIFT — engine result changed from the committed fixture`);
    failed += 1;
  }
}

console.log('');
console.log(`Summary: ${passed} passed, ${failed} failed, ${Object.keys(fixtures).length} total`);
if (failed > 0) {
  console.log('');
  console.log('Next step: if the drift is intended, update v3/script/r-snapshot.golden.json');
  console.log('and explain the change in the PR\'s [HDR] [DELTA] block. Otherwise, revert.');
  process.exit(1);
}
process.exit(0);
