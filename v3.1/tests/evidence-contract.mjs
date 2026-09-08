// BLP-002 contract test: the seven canonical evidence contracts are versioned and deterministically
// validated; the five origins stay distinguishable; unknown evidence, dates, owners and provenance
// are withheld rather than inferred. Positive and negative fixtures for every contract.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  CONTRACT_VERSION, TEXT_NORMALISATION_VERSION, ORIGIN, ORIGINS, WITHHOLD, SOURCE_SYSTEM,
  EVIDENCE_WINDOW_FIELDS, CONTRACTS,
  sha256Hex, normalisePostingText, normaliseDistilledText,
  makeSourceId, parseCsgUuid, createEvidenceSource, validateEvidenceSource,
  createVerbatimSpan, createDistilledSpan, createWithheldSpanSet, validateEvidenceSpan,
  makeVerbatimSpanId, makeDistilledSpanId, parseExtractionVersion, isLaterExtractionVersion, applyCap,
  createProofRecord, validateProofRecord, isProofTransitionPermitted,
  createReviewChange, validateReviewChange, validateReviewHistory,
  createOutputBlock, validateOutputBlock, isOutputStale, computeEvidenceHash,
  createVisualProfile, validateVisualProfile,
  createEvidenceWindow, validateEvidenceWindow,
  validateEvidenceBundle, assertValid,
} from "../src/contracts/evidenceContracts.js";

let checks = 0;
const ok = (validation, label) => { checks += 1; assert.equal(validation.ok, true, `${label} should be valid:\n${validation.errors.join("\n")}`); };
const bad = (validation, pattern, label) => {
  checks += 1;
  assert.equal(validation.ok, false, `${label} should be invalid`);
  assert.ok(validation.errors.some((e) => pattern.test(e)), `${label}: expected an error matching ${pattern}, got:\n${validation.errors.join("\n")}`);
};

// --- versioning and vocabularies -----------------------------------------------------------------
assert.equal(CONTRACT_VERSION, "1.0.0");
assert.equal(TEXT_NORMALISATION_VERSION, "ptn-1");
assert.deepEqual(ORIGINS, ["SOURCE_VERBATIM", "DETERMINISTIC", "AI_ASSISTED", "USER_AUTHORED", "WITHHELD"]);
assert.equal(Object.keys(CONTRACTS).length, 7, "exactly seven canonical contracts");
assert.deepEqual(Object.keys(CONTRACTS), ["EvidenceSource", "EvidenceSpan", "ProofRecord", "ReviewChange", "OutputBlock", "VisualProfile", "EvidenceWindow"]);
for (const [name, api] of Object.entries(CONTRACTS)) {
  assert.equal(typeof api.create, "function", `${name}.create`);
  assert.equal(typeof api.validate, "function", `${name}.validate`);
}
checks += 5;

// --- hashing is deterministic and agrees with node:crypto ---------------------------------------
for (const sample of ["", "abc", "Data Engineer\nBuild pipelines.", "ünïcödé — 日本語 🚀", "a".repeat(1000)]) {
  assert.equal(sha256Hex(sample), createHash("sha256").update(sample, "utf8").digest("hex"), `sha256 of ${JSON.stringify(sample.slice(0, 12))}`);
}
assert.equal(sha256Hex("x"), sha256Hex("x"));
checks += 6;

// --- posting-text normalisation is pinned and idempotent -----------------------------------------
const raw = "  Senior Data Engineer\r\n\r\n\r\n\r\nBuild pipelines.   \r\nOwn quality.\t\n";
const norm = normalisePostingText(raw);
assert.equal(norm, "Senior Data Engineer\n\nBuild pipelines.\nOwn quality.");
assert.equal(normalisePostingText(norm), norm, "normalisation is idempotent");
assert.equal(normaliseDistilledText("  Build   PIPELINES \n daily "), "build pipelines daily");
checks += 3;

// --- 1. EvidenceSource ---------------------------------------------------------------------------
assert.deepEqual(makeSourceId({ sourceSystem: SOURCE_SYSTEM.MCF, nativeId: "MCF-2026-0001" }), { id: "src:mycareersfuture:MCF-2026-0001", withheld: null });
assert.deepEqual(makeSourceId({ sourceSystem: SOURCE_SYSTEM.CSG, platform: "careers", jobId: "12345", postingNo: "2" }), { id: "src:csg:careers:12345:2", withheld: null });
// Degenerate synthetic ids are withheld, never assigned (Supervisor condition 2).
for (const partial of [{ platform: "", jobId: "12345", postingNo: "2" }, { platform: "careers", jobId: "12345" }, { platform: "a:b", jobId: "1", postingNo: "1" }]) {
  const r = makeSourceId({ sourceSystem: SOURCE_SYSTEM.CSG, ...partial });
  assert.equal(r.id, null);
  assert.equal(r.withheld.reason, WITHHOLD.INCOMPLETE_IDENTITY);
}
assert.equal(makeSourceId({ sourceSystem: SOURCE_SYSTEM.MCF, nativeId: "  " }).withheld.reason, WITHHOLD.INCOMPLETE_IDENTITY);
assert.deepEqual(parseCsgUuid("csg:careers:12345:2"), { platform: "careers", jobId: "12345", postingNo: "2" });
assert.equal(parseCsgUuid("not-a-csg-id"), null);
checks += 8;

const mcfId = makeSourceId({ sourceSystem: SOURCE_SYSTEM.MCF, nativeId: "MCF-2026-0001" }).id;
const source = createEvidenceSource({ id: mcfId, kind: "posting", sourceSystem: SOURCE_SYSTEM.MCF, nativeId: "MCF-2026-0001", rawText: raw, retrievedAt: "2026-09-08T03:00:00Z", label: "Senior Data Engineer" });
ok(validateEvidenceSource(source), "well-formed source");
assert.equal(source.text, norm);
assert.equal(source.textHash, sha256Hex(norm));
assert.equal(source.origin, ORIGIN.SOURCE_VERBATIM);
assert.deepEqual(source.withheld, []);
// Missing retrieval time is withheld, not defaulted to now.
const noTime = createEvidenceSource({ id: mcfId, kind: "posting", sourceSystem: SOURCE_SYSTEM.MCF, rawText: raw });
assert.equal(noTime.retrievedAt, null);
assert.deepEqual(noTime.withheld, [{ field: "retrievedAt", reason: WITHHOLD.UNAVAILABLE_FIELD }]);
ok(validateEvidenceSource(noTime), "source with withheld retrievedAt");
bad(validateEvidenceSource({ ...source, textHash: "0".repeat(64) }), /textHash does not match/, "tampered hash");
bad(validateEvidenceSource({ ...source, text: source.text + "  " }), /not in canonical normalised form/, "un-normalised text");
bad(validateEvidenceSource({ ...source, contractVersion: "0.9.0" }), /contractVersion/, "wrong contract version");
bad(validateEvidenceSource({ ...source, id: "MCF-2026-0001" }), /id must be src:/, "unprefixed id");
bad(validateEvidenceSource({ ...source, origin: ORIGIN.AI_ASSISTED }), /origin must be SOURCE_VERBATIM/, "source cannot be AI-assisted");
bad(validateEvidenceSource({ ...noTime, withheld: [] }), /must be recorded as withheld/, "null date without withheld record");
bad(validateEvidenceSource({ ...source, retrievedAt: "yesterday" }), /ISO 8601/, "non-ISO date");
checks += 5;

// --- 2. EvidenceSpan: verbatim ----------------------------------------------------------------------
const start = norm.indexOf("Build pipelines."), end = start + "Build pipelines.".length;
const span = createVerbatimSpan(source, start, end, { role: "duty" });
assert.equal(span.id, makeVerbatimSpanId(mcfId, start, end));
assert.equal(span.text, "Build pipelines.");
ok(validateEvidenceSpan(span, { source }), "verbatim span");
// The same offsets always mint the same id: identity does not depend on render order.
assert.equal(createVerbatimSpan(source, start, end).id, span.id);
bad(validateEvidenceSpan(span, {}), /cannot be validated without its EvidenceSource/, "verbatim without source");
bad(validateEvidenceSpan({ ...span, sourceTextHash: sha256Hex("other") }, { source }), /hash does not match .*hard failure/, "hash mismatch is hard");
bad(validateEvidenceSpan({ ...span, end: norm.length + 5, id: makeVerbatimSpanId(mcfId, start, norm.length + 5) }, { source }), /exceeds source text length/, "offset overrun");
bad(validateEvidenceSpan({ ...span, text: "Build pipelines" }, { source }), /does not equal the source slice/, "text drift");
bad(validateEvidenceSpan({ ...span, id: "s3" }, { source }), /id must be span:/, "positional id rejected");
bad(validateEvidenceSpan({ ...span, start: end, end: start, id: makeVerbatimSpanId(mcfId, end, start) }, { source }), /0 <= start < end/, "inverted offsets");
// A source that changed under a span is detected through the hash.
const edited = createEvidenceSource({ id: mcfId, kind: "posting", sourceSystem: SOURCE_SYSTEM.MCF, rawText: raw.replace("Build", "Ship"), retrievedAt: "2026-09-08T03:00:00Z" });
bad(validateEvidenceSpan(span, { source: edited }), /hash does not match/, "stale span against edited source");
checks += 2;

// --- 2. EvidenceSpan: distilled with mandatory parent ---------------------------------------------
assert.deepEqual(parseExtractionVersion("duty-extract-3"), { name: "duty-extract", number: 3 });
assert.equal(parseExtractionVersion("v3"), null);
assert.equal(isLaterExtractionVersion("duty-extract-4", "duty-extract-3"), true);
assert.equal(isLaterExtractionVersion("duty-extract-3", "duty-extract-3"), false);
assert.equal(isLaterExtractionVersion("other-4", "duty-extract-3"), false, "different extractor names are not comparable");
const duty = createDistilledSpan({ text: "Build and maintain data pipelines", extractionVersion: "duty-extract-3", parentSpanIds: [span.id], sourceId: mcfId });
assert.equal(duty.kind, "distilled");
assert.equal(duty.id, makeDistilledSpanId("Build and maintain data pipelines", "duty-extract-3"));
assert.equal(duty.origin, ORIGIN.AI_ASSISTED);
ok(validateEvidenceSpan(duty, { knownSpans: [span] }), "distilled span with verbatim parent");
// Same text, same version, different casing/spacing: same id. Re-extraction: new id, same parents.
assert.equal(createDistilledSpan({ text: "  build AND maintain data   pipelines", extractionVersion: "duty-extract-3", parentSpanIds: [span.id], sourceId: mcfId }).id, duty.id);
const reextracted = createDistilledSpan({ text: "Build and maintain data pipelines", extractionVersion: "duty-extract-4", parentSpanIds: [span.id], sourceId: mcfId });
assert.notEqual(reextracted.id, duty.id);
assert.deepEqual(reextracted.parentSpanIds, duty.parentSpanIds);
// No parent: not a distilled span, an addressable withheld record.
const orphan = createDistilledSpan({ text: "Something", extractionVersion: "duty-extract-3", parentSpanIds: [], sourceId: mcfId });
assert.equal(orphan.kind, "withheld");
assert.equal(orphan.reason, WITHHOLD.NO_PARENT_SPAN);
ok(validateEvidenceSpan(orphan), "withheld orphan is itself valid");
bad(validateEvidenceSpan({ ...duty, parentSpanIds: [] }, { knownSpans: [span] }), /at least one parent/, "empty parents");
bad(validateEvidenceSpan({ ...duty, parentSpanIds: ["span:src:mycareersfuture:MCF-2026-0001:999-1000"] }, { knownSpans: [span] }), /dangling reference/, "unknown parent");
bad(validateEvidenceSpan({ ...duty, parentSpanIds: [duty.id] }, { knownSpans: [span, duty] }), /not a verbatim span/, "distilled parent");
bad(validateEvidenceSpan({ ...duty, extractionVersion: "latest" }, { knownSpans: [span] }), /name-N/, "undeclared extraction version");
bad(validateEvidenceSpan({ ...duty, text: "Build pipelines" }, { knownSpans: [span] }), /normalisedText drifted|content-addressed/, "text changed without id change");
bad(validateEvidenceSpan({ ...duty, origin: ORIGIN.SOURCE_VERBATIM }, { knownSpans: [span] }), /AI_ASSISTED or DETERMINISTIC/, "distilled cannot claim verbatim origin");
const otherSource = createEvidenceSource({ id: "src:csg:careers:1:1", kind: "posting", sourceSystem: SOURCE_SYSTEM.CSG, rawText: "Other posting text", retrievedAt: "2026-09-08T03:00:00Z" });
const otherSpan = createVerbatimSpan(otherSource, 0, 5);
bad(validateEvidenceSpan({ ...duty, parentSpanIds: [otherSpan.id] }, { knownSpans: [span, otherSpan] }), /different source/, "cross-source parent");
checks += 11;

// --- 2. EvidenceSpan: withheld set and caps -----------------------------------------------------------
const nothing = createWithheldSpanSet(mcfId);
assert.equal(nothing.id, `withheld:${mcfId}:WITHHELD_NO_SOURCE_ROWS`);
ok(validateEvidenceSpan(nothing), "withheld span set");
bad(validateEvidenceSpan({ ...nothing, reason: "NO_ROWS" }), /known reason code/, "unknown withhold reason");
bad(validateEvidenceSpan({ ...nothing, origin: ORIGIN.DETERMINISTIC }), /origin must be WITHHELD/, "withheld with wrong origin");
const capped = applyCap([{ id: "a" }, { id: "b" }, { id: "c" }], 2);
assert.equal(capped.kept.length, 2);
assert.deepEqual(capped.withheld, { reason: WITHHOLD.CAP_EXCEEDED, cap: 2, droppedCount: 1, droppedIds: ["c"], origin: ORIGIN.WITHHELD });
assert.equal(applyCap([{ id: "a" }], 14).withheld, null);
assert.throws(() => applyCap([], -1), /non-negative integer/);
ok(validateEvidenceBundle({ source, spans: [span, duty] }), "bundle");
bad(validateEvidenceBundle({ source, spans: [] }), /no spans; supply createWithheldSpanSet/, "empty bundle must be withheld explicitly");
ok(validateEvidenceBundle({ source, spans: [nothing] }), "bundle with explicit withheld set");
bad(validateEvidenceBundle({ source, spans: [span, span] }), /duplicate span id/, "duplicate spans");
checks += 5;

// --- 3. ProofRecord ------------------------------------------------------------------------------------
const cvSource = createEvidenceSource({ id: "src:manual-paste:session-1", kind: "candidate-document", sourceSystem: SOURCE_SYSTEM.MANUAL_PASTE, rawText: "Led migration of 40 pipelines to Airflow in 2025.", retrievedAt: "2026-09-08T03:10:00Z" });
const excerpt = createVerbatimSpan(cvSource, 0, 31);
const proof = createProofRecord({ candidateSourceId: cvSource.id, excerptSpanId: excerpt.id, state: "DEMONSTRATED", confirmation: "USER-CONFIRMED", targets: [{ targetKind: "duty", targetId: duty.id }], destinations: { resume: "ALLOWED" } });
assert.equal(proof.origin, ORIGIN.USER_AUTHORED);
assert.equal(proof.destinations.coverLetter, "UNSET");
assert.ok(proof.id.startsWith("proof:"));
ok(validateProofRecord(proof), "confirmed demonstrated proof");
assert.equal(createProofRecord({ candidateSourceId: cvSource.id, excerptSpanId: excerpt.id }).state, "WITHHELD", "default state is WITHHELD");
bad(validateProofRecord({ ...proof, confirmation: null }), /requires USER-CONFIRMED/, "demonstrated without confirmation");
bad(validateProofRecord({ ...proof, state: "CLAIMED_ONLY" }), /allow a destination only in state/, "claimed-only cannot reach a destination");
bad(validateProofRecord({ ...proof, excerptSpanId: duty.id }), /verbatim span id .*never a paraphrase/, "proof must cite an exact excerpt");
bad(validateProofRecord({ ...proof, targets: [{ targetKind: "hunch", targetId: "x" }] }), /targets\[0\]/, "unknown target kind");
bad(validateProofRecord({ ...proof, origin: ORIGIN.AI_ASSISTED }), /must be USER_AUTHORED/, "proof cannot be AI-authored");
bad(validateProofRecord({ ...proof, destinations: { ...proof.destinations, resume: "YES" } }), /destinations\.resume/, "unknown destination state");
assert.equal(isProofTransitionPermitted("CLAIMED_ONLY", "DEMONSTRATED"), true);
assert.equal(isProofTransitionPermitted("WITHHELD", "DEMONSTRATED"), false, "withheld cannot silently become accepted proof");
assert.equal(isProofTransitionPermitted("STALE", "CERTIFIED"), true);
assert.equal(isProofTransitionPermitted("CONFLICTING", "CONFLICTING"), false);
checks += 8;

// --- 4. ReviewChange and append-only history -------------------------------------------------------------
const t0 = "2026-09-08T04:00:00Z", t1 = "2026-09-08T04:01:00Z", t2 = "2026-09-08T04:02:00Z";
const comment = createReviewChange({ id: "rc-1", kind: "comment", verb: "comment", targetSpanIds: [span.id], reviewerId: "reviewer:process-redesign", reason: "Vague ownership", createdAt: t0, origin: ORIGIN.DETERMINISTIC });
const proposal = createReviewChange({ id: "rc-2", kind: "proposal", verb: "replace", targetSpanIds: [span.id], reviewerId: "reviewer:process-redesign", createdAt: t1, origin: ORIGIN.AI_ASSISTED, proposedText: "Own the ingestion workflow end to end." });
const decision = createReviewChange({ id: "rc-3", kind: "decision", verb: "accept", targetSpanIds: [span.id], reviewerId: "human:editor", predecessorId: "rc-2", createdAt: t2, origin: ORIGIN.USER_AUTHORED });
ok(validateReviewChange(comment), "comment"); ok(validateReviewChange(proposal), "proposal"); ok(validateReviewChange(decision), "decision");
ok(validateReviewHistory([comment, proposal, decision]), "append-only history");
bad(validateReviewChange({ ...decision, origin: ORIGIN.AI_ASSISTED }), /model may not execute review decisions/, "AI decision");
bad(validateReviewChange({ ...proposal, proposedText: null }), /requires proposedText/, "replace without text");
bad(validateReviewChange(createReviewChange({ id: "rc-4", kind: "decision", verb: "escalate", targetSpanIds: [span.id], reviewerId: "human:editor", createdAt: t2, origin: ORIGIN.USER_AUTHORED })), /requires an explicit reason/, "escalate without reason");
bad(validateReviewChange(createReviewChange({ id: "rc-5", kind: "decision", verb: "undo", targetSpanIds: [span.id], reviewerId: "human:editor", createdAt: t2, origin: ORIGIN.USER_AUTHORED })), /must name the event it reverses/, "undo without predecessor");
bad(validateReviewChange(createReviewChange({ id: "rc-6", kind: "change", verb: "split", targetSpanIds: [span.id], reviewerId: "system", createdAt: t2, origin: ORIGIN.DETERMINISTIC })), /must name its predecessor/, "executed change without predecessor");
bad(validateReviewChange({ ...comment, createdAt: null }), /createdAt is required/, "event without a time");
bad(validateReviewChange({ ...comment, verb: "map" }), /verb must be one of/, "verb outside the provisional vocabulary");
bad(validateReviewHistory([comment, { ...decision, id: "rc-9", predecessorId: "rc-404" }]), /not an earlier event/, "dangling predecessor");
bad(validateReviewHistory([comment, { ...proposal, id: "rc-1" }]), /duplicate event id/, "duplicate id");
bad(validateReviewHistory([proposal, { ...comment, createdAt: t0 }]), /goes backwards/, "time reversal");
checks += 4;

// --- 5. OutputBlock -----------------------------------------------------------------------------------------
const block = createOutputBlock({ id: "ob-1", taskId: "resume-claim", promptVersion: "resume-claim-1", schemaVersion: "resume-claim-schema-1", model: "provider/model", text: "Migrated 40 pipelines to Airflow.", sourceRefs: [excerpt.id, duty.id], state: "PROPOSED", policyResult: "PASS", createdAt: t2 });
ok(validateOutputBlock(block, { allowlist: [excerpt.id, duty.id, span.id] }), "output within allowlist");
assert.equal(block.evidenceHash, computeEvidenceHash([duty.id, excerpt.id]), "evidence hash is order-independent");
bad(validateOutputBlock(block, { allowlist: [span.id] }), /outside the supplied allowlist/, "citation outside allowlist");
bad(validateOutputBlock({ ...block, sourceRefs: [] , evidenceHash: computeEvidenceHash([]) }), /at least one evidence id/, "unsupported factual text");
bad(validateOutputBlock({ ...block, evidenceHash: "0".repeat(64) }), /evidenceHash does not match/, "hash drift");
bad(validateOutputBlock({ ...block, state: "ACCEPTED", policyResult: "NOT_RUN" }), /requires policyResult PASS/, "accepted without policy pass");
bad(validateOutputBlock({ ...block, model: null }), /must record the model/, "AI output without model");
bad(validateOutputBlock({ ...block, origin: ORIGIN.DETERMINISTIC }), /origin must be/, "output claiming deterministic origin");
assert.equal(isOutputStale(block, [excerpt.id, duty.id]), false);
assert.equal(isOutputStale(block, [excerpt.id]), true, "a changed evidence set makes the block stale");
const withheldBlock = createOutputBlock({ id: "ob-2", taskId: "cover-letter", promptVersion: "cl-1", schemaVersion: "cl-schema-1", state: "WITHHELD", origin: ORIGIN.WITHHELD, sourceRefs: [] });
ok(validateOutputBlock(withheldBlock), "withheld block needs no citations");
checks += 3;

// --- 6. VisualProfile ---------------------------------------------------------------------------------------
const linkedProfile = createVisualProfile({ primaryVisual: "workflow", reasons: [{ sourceSpanId: span.id, reason: "The posting describes a sequenced handover." }], secondaryVisuals: ["org"] });
assert.equal(linkedProfile.recommendation, "workflow");
assert.deepEqual(linkedProfile.withheld, []);
ok(validateVisualProfile(linkedProfile), "linked recommendation");
const unlinked = createVisualProfile({ primaryVisual: "workflow", reasons: [{ reason: "It feels like a process role." }] });
assert.equal(unlinked.recommendation, null, "a reason without a source span cannot recommend");
assert.deepEqual(unlinked.withheld, [{ field: "recommendation", reason: WITHHOLD.NO_SOURCE_ROWS }]);
ok(validateVisualProfile(unlinked), "unlinked profile is valid and withheld");
const unsupported = createVisualProfile({ primaryVisual: "campaign funnel", reasons: [{ sourceSpanId: span.id, reason: "Marketing role." }] });
assert.equal(unsupported.supported, false);
assert.equal(unsupported.recommendation, null);
assert.ok(unsupported.withheld.some((w) => w.reason === WITHHOLD.UNSUPPORTED_VISUAL));
ok(validateVisualProfile(unsupported), "unsupported visual is named, not remapped");
const empty = createVisualProfile({});
assert.equal(empty.primaryVisual, null);
assert.equal(empty.withheld.length, 2);
bad(validateVisualProfile({ ...unlinked, recommendation: "workflow" }), /only with a supported primary and a source-linked reason/, "forced recommendation");
bad(validateVisualProfile({ ...linkedProfile, origin: ORIGIN.AI_ASSISTED }), /never classifies from a title/, "AI-assisted selector");
bad(validateVisualProfile({ ...linkedProfile, supported: false }), /supported must equal/, "supported flag drift");
checks += 8;

// --- 7. EvidenceWindow ------------------------------------------------------------------------------------------
const full = createEvidenceWindow({ publishedAt: "2026-09-01T00:00:00+08:00", closingAt: "2026-09-30T23:59:00+08:00", retrievedAt: "2026-09-08T03:00:00Z", analysedAt: "2026-09-08T03:05:00Z", corpusRange: { from: "2026-08-01T00:00:00Z", to: "2026-09-08T00:00:00Z" }, postingCount: 27, sourceTimezone: "Asia/Singapore" });
ok(validateEvidenceWindow(full), "complete window");
for (const key of EVIDENCE_WINDOW_FIELDS) { assert.notEqual(full[key].value, null, key); assert.notEqual(full[key].origin, ORIGIN.WITHHELD, key); }
assert.equal(full.publishedAt.origin, ORIGIN.SOURCE_VERBATIM);
assert.equal(full.retrievedAt.origin, ORIGIN.DETERMINISTIC);
// Each unavailable field is withheld on its own; the others are untouched; nothing is substituted.
const partial = createEvidenceWindow({ publishedAt: "2026-09-01T00:00:00+08:00", retrievedAt: "2026-09-08T03:00:00Z", postingCount: "27", sourceTimezone: "SGT", corpusRange: { from: "2026-09-08T00:00:00Z", to: "2026-08-01T00:00:00Z" } });
ok(validateEvidenceWindow(partial), "partial window");
assert.equal(partial.publishedAt.value, "2026-09-01T00:00:00+08:00");
assert.deepEqual(partial.closingAt, { value: null, origin: ORIGIN.WITHHELD, withheldReason: WITHHOLD.UNAVAILABLE_FIELD });
assert.deepEqual(partial.analysedAt, { value: null, origin: ORIGIN.WITHHELD, withheldReason: WITHHOLD.UNAVAILABLE_FIELD });
assert.equal(partial.postingCount.value, null, "a string count is not a count");
assert.equal(partial.sourceTimezone.value, null, "an abbreviation is not an IANA zone");
assert.equal(partial.corpusRange.value, null, "an inverted range is withheld");
const none = createEvidenceWindow({});
for (const key of EVIDENCE_WINDOW_FIELDS) assert.equal(none[key].origin, ORIGIN.WITHHELD, `${key} withheld when absent`);
ok(validateEvidenceWindow(none), "fully withheld window is still a valid record");
bad(validateEvidenceWindow({ ...full, publishedAt: { value: "2026-09-01T00:00:00+08:00", origin: ORIGIN.AI_ASSISTED, withheldReason: null } }), /dates are never inferred/, "AI-inferred date");
bad(validateEvidenceWindow({ ...full, closingAt: { value: null, origin: ORIGIN.SOURCE_VERBATIM, withheldReason: null } }), /null value must be origin WITHHELD/, "silent null");
bad(validateEvidenceWindow({ ...full, freshness: { value: "recent", origin: ORIGIN.DETERMINISTIC, withheldReason: null } }), /unknown fields: freshness/, "generic freshness substitute");
bad(validateEvidenceWindow({ ...full, postingCount: { value: 27, origin: ORIGIN.WITHHELD, withheldReason: null } }), /carries a value but claims origin WITHHELD/, "value with withheld origin");
checks += 15;

// --- assertValid ------------------------------------------------------------------------------------------------------
assert.equal(assertValid(validateEvidenceSource(source), "source"), true);
assert.throws(() => assertValid(validateEvidenceSource({ ...source, textHash: "x" }), "source"), /source invalid:/);
checks += 2;

console.log(`Evidence contract test passed: 7 contracts, ${checks} checks, contract ${CONTRACT_VERSION}, normalisation ${TEXT_NORMALISATION_VERSION}.`);
