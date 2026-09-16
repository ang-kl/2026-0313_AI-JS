import assert from "node:assert/strict";
import { buildRoleSensitiveVisual, ROLE_VISUAL_CONTRACTS } from "../src/work-universe/roleSensitiveVisualData.js";

let checks = 0;
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const families = Object.keys(ROLE_VISUAL_CONTRACTS);
assert.deepEqual(families, ["architecture", "concept", "trace", "funnel", "portfolio", "site", "control"]); checks += 1;
for (const familyId of families) {
  const contract = ROLE_VISUAL_CONTRACTS[familyId];
  ok(/^\d+\.\d+\.\d+$/.test(contract.version), `${familyId} has a dedicated semantic version`);
  const result = { workUniverse: { visualFamilies: { [familyId]: {
    contractVersion: contract.version,
    items: [
      { id: `${familyId}:one`, label: `${contract.label} one`, evidenceIds: ["D1"] },
      { id: `${familyId}:two`, label: `${contract.label} two`, evidenceIds: ["D2"] },
    ],
    links: [{ from: `${familyId}:one`, to: `${familyId}:two`, label: "supplied relationship", evidenceIds: ["D1", "D2"] }],
  } } } };
  const positive = buildRoleSensitiveVisual(result, familyId);
  ok(positive.status === "available" && positive.items.length === 2 && positive.links.length === 1, `${familyId} accepts source-linked data under its own contract`);
  ok(positive.evidenceIds.includes("D1") && positive.evidenceIds.includes("D2"), `${familyId} retains supplied evidence ids`);
  const titleOnly = buildRoleSensitiveVisual({ title: contract.label }, familyId);
  ok(titleOnly.status === "withheld" && /Role title is not used to infer/.test(titleOnly.boundary), `${familyId} is withheld on title-only input`);
  const wrongVersion = buildRoleSensitiveVisual({ workUniverse: { visualFamilies: { [familyId]: { contractVersion: "0.0.1", items: [] } } } }, familyId);
  ok(wrongVersion.status === "withheld" && wrongVersion.boundary.includes(contract.version), `${familyId} refuses another contract version`);
  const malformed = buildRoleSensitiveVisual({ workUniverse: { visualFamilies: { [familyId]: { contractVersion: contract.version, items: [{ id: "x", label: "No source" }] } } } }, familyId);
  ok(malformed.status === "withheld" && malformed.excluded.length === 1, `${familyId} withholds unlinked items`);
}
ok(buildRoleSensitiveVisual({}, "unknown").status === "unavailable", "ungoverned visual family is explicitly unavailable");

console.log(`role-sensitive visual contracts: PASS, ${checks} checks`);
