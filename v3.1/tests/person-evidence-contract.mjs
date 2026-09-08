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

// ---------------------------------------------------------------------------------------------
// BLP-007: exact excerpts with immutable source and span identifiers over the canonical contracts.
// ---------------------------------------------------------------------------------------------
import {
  buildManualPersonSource, canonicalPersonText, manualSourceIdFor, markExcerpt, resolveExcerpts,
  SOURCE_ID_HASH_WIDTH, UNSTRUCTURED_NOTE,
} from "../src/work-universe/personEvidenceData.js";
import { validateEvidenceSource, validateEvidenceSpan, validateProofRecord, isConfirmationRecord, sha256Hex, normalisePostingText } from "../src/contracts/evidenceContracts.js";
import { LOCAL_HUMAN_ACTOR } from "../src/review/reviewerContract.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };

// (1) The proof-only payload above now carries a source, a whole-text span and a CLAIMED_ONLY proof.
ok(validateEvidenceSource(proofOnly.source).ok, "the pasted text is a valid candidate-document EvidenceSource");
eq(proofOnly.source.kind, "candidate-document", "source kind");
eq(proofOnly.source.sourceSystem, "manual-paste", "source system");
eq(proofOnly.source.completeness, "COMPLETE", "a whole paste is attested complete");
ok(/^src:manual-paste:[0-9a-f]{24}$/.test(proofOnly.sourceId), `source id is src:manual-paste:<24 hex> (${proofOnly.sourceId})`);
eq(SOURCE_ID_HASH_WIDTH, 24, "hash width matches the contract's duty: ids");
eq(proofOnly.sourceId, `src:manual-paste:${sha256Hex(proofOnly.rawText).slice(0, 24)}`, "the id is the hash of the canonical text");
eq(proofOnly.unstructured, true, "no excerpt marked: the proof is unstructured");
eq(proofOnly.proofs[0].spanId, `span:${proofOnly.sourceId}:0-${proofOnly.rawText.length}`, "the whole-text proof cites the whole-text span");
assert.deepEqual(proofOnly.proofs[0].evidenceIds, [proofOnly.proofs[0].spanId], "evidenceIds carries the span id, never a placeholder");
eq(proofOnly.proofs[0].state, "CLAIMED_ONLY", "present, confirmed evidence is CLAIMED_ONLY, not falsely WITHHELD");
eq(proofOnly.proofs[0].note, UNSTRUCTURED_NOTE, "granularity is carried in the note");
ok(validateProofRecord(proofOnly.proofs[0].record).ok, "the emitted ProofRecord validates");
ok(validateEvidenceSpan(proofOnly.excerpts[0], { source: proofOnly.source }).ok, "the emitted span validates against its source");
eq(proofOnly.confirmationRecord.confirmedBy, LOCAL_HUMAN_ACTOR.id, "confirmation names the local human actor");
ok(isConfirmationRecord(proofOnly.confirmationRecord), "the confirmation record is one the contract itself accepts (named human and a time)");
ok(/^\d{4}-\d{2}-\d{2}T/.test(proofOnly.confirmationRecord.confirmedAt), "an omitted confirmedAt is the build time, never null");
eq(proofOnly.shape, "manual-paste-2", "the payload declares its shape");
ok(/identity not recorded/.test(proofOnly.confirmationRecord.confirmedByDisplayName), "the confirmer's display name says identity is not recorded");
eq(proofOnly.proofs[0].record.destinations.resume, "UNSET", "no destination is allowed on a claim");

// (2) Stability: the same text gives the same source id and span ids across two builds; edited text a new id.
const twice = buildManualPersonEvidence({ rawText: proofOnly.rawText, selectedSkills: [], targetSkills: [], confirmed: true });
eq(twice.sourceId, proofOnly.sourceId, "same text, same source id");
eq(twice.proofs[0].id, proofOnly.proofs[0].id, "same text, same proof id");
ok(manualSourceIdFor(proofOnly.rawText + " edited") !== proofOnly.sourceId, "edited text is a different source");
eq(manualSourceIdFor("Line one\r\nLine two"), manualSourceIdFor("Line one\nLine two"), "line endings alone do not change the id (hash over canonical text)");

// (3) The Supervisor's required normalisation fixture: CRLF, a trailing space, a zero-width
// character and three consecutive newlines BEFORE the selected range. The span text must equal
// the source slice AND the substring the user actually selected.
const messy = "First line \r\nSecond​ line\n\n\nLed migration of 40 pipelines to Airflow in 2025.\r\nClosing line.";
const messySource = buildManualPersonSource(messy);
eq(messySource.text, "First line\nSecond line\n\nLed migration of 40 pipelines to Airflow in 2025.\nClosing line.", "canonical text");
eq(messySource.text, normalisePostingText(messy), "canonical text is the contract's normalisation, no second rule");
ok(messySource.text.length !== messy.length, "the fixture really changes string length");
const wanted = "Led migration of 40 pipelines to Airflow in 2025.";
const start = messySource.text.indexOf(wanted);
const marked = markExcerpt(messySource, start, start + wanted.length);
ok(marked.ok, "a selection after the constructs is accepted");
eq(marked.span.text, messySource.text.slice(marked.span.start, marked.span.end), "span text equals the source slice");
eq(marked.span.text, wanted, "span text equals what the user selected");
eq(marked.span.id, `span:${messySource.id}:${start}-${start + wanted.length}`, "span id is span:<sourceId>:<start>-<end>");
eq(marked.span.sourceTextHash, messySource.textHash, "span carries the source text hash");
ok(canonicalPersonText(messySource.text) === messySource.text, "canonicalisation is idempotent");

// (4) Refusals: empty selection, whitespace-only, out of range, duplicate.
eq(markExcerpt(messySource, 5, 5).reason, "NO_SELECTION", "empty selection refused");
eq(markExcerpt(messySource, 10, 11).reason, "WHITESPACE_ONLY", "whitespace-only refused");
eq(markExcerpt(messySource, 0, messySource.text.length + 1).reason, "NO_SELECTION", "out of range refused");
eq(markExcerpt(messySource, start, start + wanted.length, { existing: [marked.span] }).reason, "DUPLICATE", "duplicate refused");
eq(markExcerpt(null, 0, 1).reason, "NO_SOURCE", "no source refused");

// (5) A confirmed payload with marked excerpts: one CLAIMED_ONLY proof per excerpt, no whole-text proof.
const second = markExcerpt(messySource, 0, 10);
eq(buildManualPersonEvidence({ rawText: messy, confirmed: true, excerpts: [{ start: marked.span.start, end: marked.span.end, sourceTextHash: marked.span.sourceTextHash }] }), null, "excerpts over NON-canonical raw text are refused, not reinterpreted");
const withExcerpts = buildManualPersonEvidence({
  rawText: messySource.text, selectedSkills: [], targetSkills: [], confirmed: true,
  excerpts: [{ start: marked.span.start, end: marked.span.end, sourceTextHash: marked.span.sourceTextHash }, { start: 0, end: 10, sourceTextHash: second.span.sourceTextHash }],
  confirmedAt: "2026-09-08T12:00:00.000Z",
});
ok(withExcerpts, "confirmed excerpts build a payload");
eq(withExcerpts.unstructured, false, "excerpts marked: not unstructured");
eq(withExcerpts.proofs.length, 2, "one proof per excerpt");
eq(withExcerpts.proofs[0].spanId, second.span.id, "proofs are ordered by offset");
eq(withExcerpts.proofs[1].text, wanted, "each proof carries the exact excerpt text");
ok(withExcerpts.proofs.every((p) => p.state === "CLAIMED_ONLY" && p.note === null && p.sourceId === withExcerpts.sourceId), "every excerpt proof is CLAIMED_ONLY on the same source");
ok(withExcerpts.proofs.every((p) => validateProofRecord(p.record).ok), "every excerpt proof validates");
ok(isManualPersonEvidence(withExcerpts), "the payload is recognised as manual person evidence");
eq(withExcerpts.confirmationRecord.confirmedAt, "2026-09-08T12:00:00.000Z", "confirmation time is the one supplied");

// (6) Unconfirmed raw evidence cannot become confirmed proof.
eq(buildManualPersonEvidence({ rawText: messy, excerpts: [{ start: 0, end: 10 }], confirmed: false }), null, "unconfirmed excerpts emit nothing");
eq(buildManualPersonEvidence({ rawText: messySource.text, confirmed: true, confirmedAt: "yesterday" }), null, "a confirmation without an ISO instant is refused (contract 1.0.2: a confirmer AND a time)");
eq(buildManualPersonEvidence({ rawText: messySource.text, confirmed: true, confirmedAt: null }), null, "a null confirmedAt is refused, not defaulted");
ok(!isManualPersonEvidence({ ...withExcerpts, confirmationRecord: { ...withExcerpts.confirmationRecord, confirmedAt: null } }), "a payload whose confirmation record lacks a time is not manual person evidence");
ok(!isManualPersonEvidence({ ...withExcerpts, confirmationRecord: { ...withExcerpts.confirmationRecord, confirmedBy: "reviewer:role-analyst" } }), "a payload confirmed by a non-human actor is not manual person evidence");
ok(!isManualPersonEvidence({ ...withExcerpts, shape: "manual-paste-1" }), "an earlier payload shape is refused");
ok(!isManualPersonEvidence({ ...withExcerpts, source: { ...withExcerpts.source, text: withExcerpts.source.text + "x" } }), "a payload whose source text drifted from its hash is not manual person evidence");
ok(!isManualPersonEvidence({ ...withExcerpts, proofs: [{ ...withExcerpts.proofs[0], spanId: "PRAW1", evidenceIds: ["PRAW1"] }] }), "a proof without a span id is refused");

// (7) A span marked against earlier text is stale, never emitted; removal leaves no orphan.
const edited = messySource.text + "\nAppended line.";
const editedSource = buildManualPersonSource(edited);
const resolved = resolveExcerpts(editedSource, [{ start: marked.span.start, end: marked.span.end, sourceTextHash: marked.span.sourceTextHash }]);
eq(resolved.valid.length, 0, "an excerpt marked against the old text does not resolve");
eq(resolved.stale[0].reason, "TEXT_CHANGED", "and is reported as stale for that reason");
eq(buildManualPersonEvidence({ rawText: edited, confirmed: true, excerpts: [{ start: marked.span.start, end: marked.span.end, sourceTextHash: marked.span.sourceTextHash }] }), null, "a payload with a stale excerpt is refused outright");
// The hash is mandatory: without it a span rebuilt from the current source matches that source by
// construction, so an excerpt from a different document would resolve as valid (auditor C-1).
const hashless = resolveExcerpts(buildManualPersonSource("Wrote poetry for a decade."), [{ start: 0, end: 12 }]);
eq(hashless.valid.length, 0, "an excerpt without a source hash never resolves");
eq(hashless.stale[0].reason, "NO_HASH", "and is stale for that reason");
eq(buildManualPersonEvidence({ rawText: "Wrote poetry for a decade.", confirmed: true, excerpts: [{ start: 0, end: 12 }] }), null, "a hashless excerpt refuses the whole payload");
const outOfRange = resolveExcerpts(messySource, [{ start: 0, end: messySource.text.length + 5, sourceTextHash: messySource.textHash }]);
eq(outOfRange.stale[0].reason, "INVALID_SPAN", "an out-of-range excerpt is stale");
const afterRemoval = buildManualPersonEvidence({ rawText: messySource.text, confirmed: true, excerpts: [{ start: 0, end: 10, sourceTextHash: second.span.sourceTextHash }] });
eq(afterRemoval.proofs.length, 1, "removing an excerpt removes its proof");
ok(!afterRemoval.proofs.some((p) => p.spanId === marked.span.id), "no orphan evidenceIds reference remains");
ok(afterRemoval.proofs.every((p) => afterRemoval.excerpts.some((s) => s.id === p.spanId)), "every proof cites a span the payload carries");

console.log(`BLP-007 exact excerpts: PASS, ${checks} checks`);
