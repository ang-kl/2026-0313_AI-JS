import assert from "node:assert/strict";
import { computeEvidenceHash, sha256Hex, validateOutputBlock } from "../src/contracts/evidenceContracts.js";
import {
  GENERATION_TASKS, assembleGeneration, providerPrompt, validateGeneratedPayload, validateGenerationRequest,
} from "../api/generationPolicy.js";
import generationHandler from "../api/generation.js";

let checks = 0;
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const eq = (actual, expected, message) => { checks += 1; assert.equal(actual, expected, message); };
const evidence = [
  { id: "candidate:1", text: "Monitored operational data across 12 services.", contentHash: sha256Hex("Monitored operational data across 12 services."), role: "candidate-proof", state: "DEMONSTRATED" },
  { id: "job:1", text: "Monitor operational data and investigate service exceptions.", contentHash: sha256Hex("Monitor operational data and investigate service exceptions."), role: "job-evidence", state: "CURRENT" },
  { id: "outside:1", text: "Increased revenue by 70%.", contentHash: sha256Hex("Increased revenue by 70%."), role: "candidate-proof", state: "DEMONSTRATED" },
];
const allowlist = ["candidate:1", "job:1"];
const request = { task: "resume-claim", evidence, allowlist, evidenceHash: computeEvidenceHash(allowlist) };

ok(validateGenerationRequest(request).ok, "a complete, current evidence request passes");
eq(GENERATION_TASKS["resume-claim"].promptVersion, "resume-claim-grounded-1", "the prompt version is server-owned");
const prompt = providerPrompt(request.task, evidence, allowlist);
ok(/Return JSON only/.test(prompt.system) && !prompt.messages[0].content.includes("outside:1"), "the server builds the prompt and excludes evidence outside the allowlist");

const goodPayload = { text: "Monitored operational data across 12 services.", sourceRefs: ["candidate:1", "job:1"] };
ok(validateGeneratedPayload("resume-claim", goodPayload, request).ok, "schema-constrained, allowlisted output passes");
const assembled = assembleGeneration("resume-claim", goodPayload, request, { model: "provider/model", createdAt: "2026-09-16T07:10:00.000Z" });
ok(assembled.ok && assembled.output.policyResult === "PASS", "valid provider output becomes a proposed OutputBlock");
ok(validateOutputBlock(assembled.output, { allowlist }).ok, "the final OutputBlock independently validates against the allowlist");
eq(assembled.trace[0].sourceRefs.length, 2, "the trace retains sentence citations");

const malformed = validateGeneratedPayload("resume-claim", { text: "x", sourceRefs: ["candidate:1"], rationale: "extra" }, request);
ok(!malformed.ok && malformed.errors.some((error) => /exactly/.test(error)), "extra schema fields are refused");
const outside = validateGeneratedPayload("resume-claim", { text: "Increased revenue by 70%.", sourceRefs: ["outside:1"] }, request);
ok(!outside.ok && outside.errors.some((error) => /outside the evidence allowlist/.test(error)), "a citation outside the allowlist is refused");
const invented = validateGeneratedPayload("resume-claim", { text: "Monitored 99 services.", sourceRefs: ["candidate:1"] }, request);
ok(!invented.ok && invented.errors.some((error) => /invented number: 99/.test(error)), "an invented number is refused");
const missingCitation = validateGeneratedPayload("resume-claim", { text: "Monitored operational data.", sourceRefs: [] }, request);
ok(!missingCitation.ok && missingCitation.errors.some((error) => /at least one evidence id/.test(error)), "uncited factual output is refused");

const staleItem = { ...request, evidence: evidence.map((item, index) => index ? item : { ...item, text: `${item.text} changed` }) };
ok(!validateGenerationRequest(staleItem).ok && validateGenerationRequest(staleItem).errors.some((error) => /stale contentHash/.test(error)), "stale item content is refused before generation");
const staleSet = { ...request, evidenceHash: "0".repeat(64) };
ok(!validateGenerationRequest(staleSet).ok && validateGenerationRequest(staleSet).errors.some((error) => /stale evidenceHash/.test(error)), "a stale allowlist hash is refused before generation");

const coverPayload = { sentences: [
  { text: "I monitored operational data across 12 services.", sourceRefs: ["candidate:1"] },
  { text: "That experience aligns with monitoring operational data and investigating service exceptions.", sourceRefs: ["job:1"] },
] };
const coverRequest = { ...request, task: "cover-letter" };
const cover = assembleGeneration("cover-letter", coverPayload, coverRequest, { model: "provider/model", createdAt: "2026-09-16T07:11:00.000Z" });
ok(cover.ok && cover.trace.length === 2, "cover-letter output preserves sentence-level evidence trace");

function responseCapture() {
  const captured = { statusCode: 200, body: null };
  return { captured, response: { status(code) { captured.statusCode = code; return this; }, json(body) { captured.body = body; return body; } } };
}
const invalidCall = responseCapture();
await generationHandler({ method: "POST", body: { task: "resume-claim" } }, invalidCall.response);
eq(invalidCall.captured.statusCode, 400, "the HTTP boundary rejects invalid evidence without calling a provider");
eq(invalidCall.captured.body.code, "INVALID_EVIDENCE", "the HTTP refusal is machine-readable");
const wrongMethod = responseCapture();
await generationHandler({ method: "GET", body: {} }, wrongMethod.response);
eq(wrongMethod.captured.statusCode, 405, "the endpoint accepts POST only");

console.log(`generation service contract: PASS, ${checks} checks`);
