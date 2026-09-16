import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { BLP028_STATES, BLP028_VIEWPORTS } from "./support/blp028-matrix.mjs";

const suites = ["tests/evidence-failure-paths.mjs", "tests/proof-links.mjs"];
for (const suite of suites) {
  const run = spawnSync(process.execPath, [suite], { cwd: process.cwd(), env: process.env, stdio: "inherit" });
  if (run.status !== 0) process.exit(run.status || 1);
}

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const evidence = read("test-results/evidence-failure-paths/blp028-state-matrix.json");
const proofs = read("test-results/proof-links/blp028-state-matrix.json");
const all = evidence.concat(proofs);

for (const viewport of BLP028_VIEWPORTS) {
  const records = all.filter((entry) => entry.viewport === viewport.name && entry.width === viewport.width && entry.height === viewport.height);
  assert.ok(records.length >= 2, `${viewport.name}: both evidence and proof runtime records are required`);
  const states = new Set(records.flatMap((entry) => entry.states));
  assert.deepEqual([...states].sort(), [...BLP028_STATES].sort(), `${viewport.name}: positive, empty, withheld, error and stale must all pass`);
}

fs.mkdirSync("test-results/blp028-responsive-matrix", { recursive: true });
const summary = {
  baseUrl: process.env.BASE_URL || "http://127.0.0.1:4173",
  viewports: BLP028_VIEWPORTS.map(({ name, width, height }) => ({ name, width, height, states: [...BLP028_STATES] })),
  geometryGate: "visible, horizontally contained, unobstructed and reachable after scroll",
};
fs.writeFileSync("test-results/blp028-responsive-matrix/summary.json", JSON.stringify(summary, null, 2));
console.log(`BLP-028 responsive matrix: PASS (${BLP028_VIEWPORTS.length} widths x ${BLP028_STATES.length} states)`);
