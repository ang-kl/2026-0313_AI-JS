import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const base = String(process.env.BASE_URL || "").replace(/\/$/, "");
const expected = String(process.env.EXPECTED_DEPLOYED_COMMIT || "").trim().toLowerCase();
assert.match(base, /^https:\/\//, "BLP-027 requires an HTTPS production BASE_URL");
assert.ok(!/localhost|127\.0\.0\.1/.test(base), "BLP-027 refuses a local or preview runtime");
assert.match(expected, /^[0-9a-f]{40}$/, "BLP-027 requires the exact 40-character EXPECTED_DEPLOYED_COMMIT");

async function assertDeployedCommit() {
  const response = await fetch(`${base}/health`, { headers: { "cache-control": "no-cache" } });
  assert.equal(response.status, 200, "production health endpoint must answer 200");
  const health = await response.json();
  assert.equal(String(health.commit || "").toLowerCase(), expected, "production runtime commit must equal EXPECTED_DEPLOYED_COMMIT");
}

await assertDeployedCommit();
for (const suite of ["tests/company-flow-browser.mjs", "tests/browser-gate.mjs", "tests/blp028-responsive-matrix.mjs"]) {
  const run = spawnSync(process.execPath, [suite], { cwd: process.cwd(), env: { ...process.env, BASE_URL: base }, stdio: "inherit" });
  if (run.status !== 0) process.exit(run.status || 1);
}
await assertDeployedCommit();
console.log(`BLP-027 production Chromium gate: PASS (${expected} at ${base})`);
