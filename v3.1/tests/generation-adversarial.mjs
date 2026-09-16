import assert from "node:assert/strict";
import { computeEvidenceHash, sha256Hex } from "../src/contracts/evidenceContracts.js";
import { assembleGeneration, validateGeneratedPayload, validateGenerationRequest } from "../api/generationPolicy.js";

let checks = 0;
const refused = (verdict, pattern, message) => {
  checks += 1;
  assert.ok(!verdict.ok && verdict.errors.some((error) => pattern.test(error)), `${message}: ${verdict.errors.join(" | ")}`);
};
const accepted = (verdict, message) => { checks += 1; assert.ok(verdict.ok, `${message}: ${verdict.errors?.join(" | ")}`); };
const item = (id, text, role, state) => ({ id, text, role, state, contentHash: sha256Hex(text) });
const candidate = item("proof:1", "Investigated payment exceptions across 12 services.", "candidate-proof", "DEMONSTRATED");
const job = item("duty:1", "Investigate payment exceptions and monitor operational data.", "job-evidence", "CURRENT");
const evidence = [candidate, job];
const allowlist = evidence.map((entry) => entry.id);
const request = { task: "resume-claim", evidence, allowlist, evidenceHash: computeEvidenceHash(allowlist) };

accepted(validateGenerationRequest(request), "control request passes");
accepted(validateGeneratedPayload("resume-claim", { text: "Investigated payment exceptions across 12 services.", sourceRefs: allowlist }, request), "control output passes");

refused(validateGeneratedPayload("resume-claim", { text: "Increased throughput by 40%.", sourceRefs: allowlist }, request), /invented number: 40%/, "invented number is refused");
refused(validateGeneratedPayload("resume-claim", { text: "Managed payment exceptions across 12 services.", sourceRefs: allowlist }, request), /unsupported achievement verb: managed/, "unsupported ownership is refused");
refused(validateGeneratedPayload("resume-claim", { text: "Investigated payment exceptions.", sourceRefs: [candidate.id] }, request), /no current job evidence/, "candidate-only citation laundering is refused");
refused(validateGeneratedPayload("resume-claim", { text: "Investigate payment exceptions.", sourceRefs: [job.id] }, request), /no confirmed candidate proof/, "job-only citation laundering is refused");
refused(validateGeneratedPayload("resume-claim", { text: "Investigated payment exceptions.", sourceRefs: [...allowlist, "proof:outside"] }, request), /outside the evidence allowlist/, "unknown citation is refused");
refused(validateGeneratedPayload("resume-claim", { text: "Investigated payment exceptions.", sourceRefs: [] }, request), /at least one evidence id/, "missing citations are refused");
refused(validateGeneratedPayload("resume-claim", { text: "Investigated payment exceptions.", sourceRefs: allowlist, confidence: 1 }, request), /exactly/, "schema smuggling is refused");
refused(validateGeneratedPayload("resume-claim", ["Investigated payment exceptions."], request), /exactly/, "array-shaped output is refused");

for (const state of ["CLAIMED_ONLY", "WITHHELD", "CONFLICTING", "STALE"]) {
  const poisoned = [item("proof:1", candidate.text, "candidate-proof", state), job];
  refused(validateGenerationRequest({ ...request, evidence: poisoned }), new RegExp(`candidate proof proof:1 is ${state}`), `${state} candidate proof is refused before provider access`);
}
for (const state of ["STALE", "CONFLICTING", "UNKNOWN"]) {
  const poisoned = [candidate, item("duty:1", job.text, "job-evidence", state)];
  refused(validateGenerationRequest({ ...request, evidence: poisoned }), new RegExp(`job evidence duty:1 is ${state}`), `${state} job evidence is refused before provider access`);
}
const changed = [{ ...candidate, text: `${candidate.text} changed` }, job];
refused(validateGenerationRequest({ ...request, evidence: changed }), /stale contentHash/, "changed text under an old content hash is refused");
refused(validateGenerationRequest({ ...request, evidenceHash: sha256Hex("different ids") }), /stale evidenceHash/, "changed allowlist identity is refused");
refused(validateGenerationRequest({ ...request, allowlist: [...allowlist, "missing:1"], evidenceHash: computeEvidenceHash([...allowlist, "missing:1"]) }), /was not supplied/, "allowlist cannot name unsupplied evidence");

const coverRequest = { ...request, task: "cover-letter" };
refused(validateGeneratedPayload("cover-letter", { sentences: [{ text: "I saved 99 hours.", sourceRefs: allowlist }] }, coverRequest), /invented number: 99/, "invented cover-letter metric is refused");
refused(validateGeneratedPayload("cover-letter", { sentences: [{ text: "I led payment operations.", sourceRefs: allowlist }] }, coverRequest), /unsupported achievement verb: led/, "invented cover-letter leadership is refused");
refused(validateGeneratedPayload("cover-letter", { sentences: [{ text: "I investigated payment exceptions.", sourceRefs: [candidate.id] }] }, coverRequest), /no current job evidence/, "cover letter cannot omit job evidence from its trace");
refused(assembleGeneration("resume-claim", { text: "Increased throughput by 40%.", sourceRefs: allowlist }, request, { model: "provider/model", createdAt: "2026-09-16T09:00:00.000Z" }), /invented number/, "policy refusal never assembles an OutputBlock");

console.log(`generation adversarial suite: PASS, ${checks} checks`);
