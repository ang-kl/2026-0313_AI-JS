import assert from "node:assert/strict";
import { buildManualPersonEvidence, isManualPersonEvidence } from "../src/work-universe/personEvidenceData.js";

assert.equal(buildManualPersonEvidence({ rawText: "Data engineering", selectedSkills: ["Data engineering"], targetSkills: ["Data engineering"], confirmed: false }), null);
assert.equal(buildManualPersonEvidence({ rawText: "", selectedSkills: [], targetSkills: [], confirmed: true }), null);

const proofOnly = buildManualPersonEvidence({
  rawText: "Data engineering appears in this pasted text but must not be extracted.",
  selectedSkills: [],
  targetSkills: ["Data engineering"],
  confirmed: true,
});
assert.equal(proofOnly.supplied, true);
assert.equal(proofOnly.skills.length, 0);
assert.equal(proofOnly.proofs.length, 1);
assert.equal(proofOnly.proofs[0].text, "Data engineering appears in this pasted text but must not be extracted.");
assert.equal(isManualPersonEvidence(proofOnly), true);

const selected = buildManualPersonEvidence({
  rawText: "User-provided evidence",
  selectedSkills: ["data engineering", "Invented skill", "Stakeholder management"],
  targetSkills: ["Data engineering", "Stakeholder management"],
  confirmed: true,
});
assert.deepEqual(selected.skills, ["Data engineering", "Stakeholder management"]);
assert.equal(selected.sourceType, "manual-paste");
assert.equal(selected.sessionOnly, true);
assert.equal(selected.confirmation, "USER-CONFIRMED");

console.log("Manual person-evidence contract: PASS");
