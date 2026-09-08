// Manual person evidence (BLP-007): exact candidate-evidence excerpts with immutable source and
// span identifiers, built over the canonical evidence contracts rather than beside them.
//
// Shape. One pasted document becomes ONE candidate-document EvidenceSource whose id is derived
// from a content hash of its CANONICAL text (contract normalisation ptn-1), so the same text gives
// the same id in any session and an edited document is a different source whose old spans can
// never silently re-point at it. Every excerpt the user marks is a verbatim EvidenceSpan: an exact
// character range of that canonical text, id span:<sourceId>:<start>-<end>, text sliced from the
// source and never retyped. Each excerpt becomes a ProofRecord in state CLAIMED_ONLY: the
// candidate says it is theirs, nothing yet demonstrates it (DEMONSTRATED and any ALLOWED
// destination stay refused by the contract until later requirements link a proof to a target).
// With no excerpt marked the whole text is ONE proof over the whole-text span, likewise
// CLAIMED_ONLY, carrying its coarseness in a note rather than a false WITHHELD (present, confirmed
// evidence is not "unavailable"). Nothing is emitted before the human ticks the confirmation; a
// confirmed payload carries a confirmation record naming the local human actor, whose display
// name says in words that identity is not recorded.
//
// Offsets are read only against the canonical text: the ingress canonicalises the textarea so
// that what the user selects, what is hashed and what is sliced are one string by construction,
// and every span is validated against its source through the contract before it can reach a
// consumer. A span whose source text has changed is refused, never emitted.
//
// Session only: no browser storage, no upload, no parsing, no automatic claim.

import {
  SOURCE_SYSTEM,
  createEvidenceSource,
  createVerbatimSpan,
  createProofRecord,
  validateEvidenceSource,
  validateEvidenceSpan,
  validateProofRecord,
  isConfirmationRecord,
  normalisePostingText,
  sha256Hex,
  TEXT_NORMALISATION_VERSION,
} from "../contracts/evidenceContracts.js";
import { LOCAL_HUMAN_ACTOR } from "../review/reviewerContract.js";

export const PERSON_EVIDENCE_SHAPE = "manual-paste-2";
export const PERSON_SOURCE_LABEL = "Manual person evidence";
export const EXCERPT_ROLE = "candidate-excerpt";
export const UNSTRUCTURED_NOTE = "unstructured - no excerpt marked; the proof covers the whole pasted text";
/** Content-hash width shared with the contract's distilled ids (duty:<24 hex>). */
export const SOURCE_ID_HASH_WIDTH = 24;

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isInt(value) { return Number.isInteger(value); }
function isIso(value) { return typeof value === "string" && !Number.isNaN(Date.parse(value)) && /T/.test(value); }

/** The one normalisation the ingress, the source and every offset share. */
export function canonicalPersonText(rawText) {
  return normalisePostingText(rawText);
}

/** src:manual-paste:<24 hex of the canonical text>. Same text, same id; edited text, new id. */
export function manualSourceIdFor(rawText) {
  const text = canonicalPersonText(rawText);
  if (!text) return null;
  return `src:${SOURCE_SYSTEM.MANUAL_PASTE}:${sha256Hex(text).slice(0, SOURCE_ID_HASH_WIDTH)}`;
}

/** The candidate-document EvidenceSource for one pasted text, or null when the text is empty. */
export function buildManualPersonSource(rawText, { retrievedAt } = {}) {
  const text = canonicalPersonText(rawText);
  if (!text) return null;
  const source = createEvidenceSource({
    id: manualSourceIdFor(text),
    kind: "candidate-document",
    sourceSystem: SOURCE_SYSTEM.MANUAL_PASTE,
    nativeId: null,
    rawText: text,
    retrievedAt: isIso(retrievedAt) ? retrievedAt : undefined,
    label: PERSON_SOURCE_LABEL,
    complete: true,
  });
  return source;
}

/**
 * Judge a selection against a source before it becomes a span. Returns { ok: true, span } or
 * { ok: false, reason, message }. Reasons are stable codes the ingress renders in words.
 */
export function markExcerpt(source, start, end, { existing = [] } = {}) {
  if (!source || typeof source.text !== "string" || !source.text) return { ok: false, reason: "NO_SOURCE", message: "Paste some text before marking an excerpt." };
  if (!isInt(start) || !isInt(end) || start < 0 || end > source.text.length || end <= start) return { ok: false, reason: "NO_SELECTION", message: "Select the exact text you want to mark, then choose Mark exact excerpt." };
  const text = source.text.slice(start, end);
  if (!text.trim()) return { ok: false, reason: "WHITESPACE_ONLY", message: "The selection contains only spaces or line breaks; select some words." };
  const span = createVerbatimSpan(source, start, end, { role: EXCERPT_ROLE });
  if (existing.some((item) => item && item.id === span.id)) return { ok: false, reason: "DUPLICATE", message: "That exact excerpt is already marked." };
  const verdict = validateEvidenceSpan(span, { source });
  if (!verdict.ok) return { ok: false, reason: "INVALID_SPAN", message: `The excerpt could not be recorded: ${verdict.errors[0]}` };
  return { ok: true, span };
}

/**
 * Re-derive the marked spans against the CURRENT source. A stored excerpt is {start, end,
 * sourceTextHash}; the hash is MANDATORY and its comparison against the current source is the
 * drift check: a span rebuilt from the current source would match that source by construction,
 * so the contract validator below can only catch an out-of-range excerpt, not a text change.
 * An excerpt without a hash, or with a hash from an earlier text, is stale and never emitted
 * (conformance-auditor C-1).
 */
export function resolveExcerpts(source, excerpts) {
  const valid = [];
  const stale = [];
  for (const item of Array.isArray(excerpts) ? excerpts : []) {
    if (!item || !isInt(item.start) || !isInt(item.end)) continue;
    if (!source) { stale.push({ ...item, reason: "NO_SOURCE" }); continue; }
    if (!item.sourceTextHash) { stale.push({ ...item, reason: "NO_HASH" }); continue; }
    if (item.sourceTextHash !== source.textHash) { stale.push({ ...item, reason: "TEXT_CHANGED" }); continue; }
    const span = createVerbatimSpan(source, item.start, item.end, { role: EXCERPT_ROLE });
    const verdict = validateEvidenceSpan(span, { source });
    if (!verdict.ok || !span.text.trim()) { stale.push({ ...item, reason: "INVALID_SPAN", errors: verdict.errors }); continue; }
    if (valid.some((known) => known.id === span.id)) continue;
    valid.push(span);
  }
  valid.sort((a, b) => a.start - b.start || a.end - b.end);
  return { valid, stale };
}

function proofFor(source, span, { note } = {}) {
  return createProofRecord({
    candidateSourceId: source.id,
    excerptSpanId: span.id,
    state: "CLAIMED_ONLY",
    confirmation: "USER-CONFIRMED",
    targets: [],
    note,
  });
}

function proofView(proof, span, label) {
  return {
    id: proof.id,
    label,
    text: span.text,
    evidenceIds: [span.id],
    sourceId: span.sourceId,
    spanId: span.id,
    start: span.start,
    end: span.end,
    sourceTextHash: span.sourceTextHash,
    state: proof.state,
    provenance: "USER-CONFIRMED",
    note: proof.note,
    record: proof,
  };
}

/**
 * Build the session-only evidence payload. Returns null unless the human has confirmed and the
 * text is non-empty. Refuses (returns null) when any supplied excerpt is stale or any emitted
 * record fails its contract validator: a consumer never sees an unvalidated span or proof.
 * `confirmedAt` is the moment of the human's confirmation: omitted, it is the build time (the
 * build IS the confirmation act); supplied but not an ISO instant, the build is refused, because
 * the contract's confirmation record requires a named human AND a time (contract 1.0.2).
 * When excerpts are supplied, `rawText` must already be canonical: offsets whose provenance the
 * layer cannot check are refused rather than reinterpreted (conformance-auditor S-2).
 */
export function buildManualPersonEvidence({ rawText, selectedSkills, targetSkills, confirmed, excerpts, confirmedAt, retrievedAt } = {}) {
  if (confirmedAt !== undefined && !isIso(confirmedAt)) return null;
  if (retrievedAt !== undefined && !isIso(retrievedAt)) return null;
  const at = confirmedAt ?? new Date().toISOString();
  const hasExcerpts = Array.isArray(excerpts) && excerpts.length > 0;
  if (hasExcerpts && String(rawText ?? "") !== canonicalPersonText(rawText)) return null;
  const source = buildManualPersonSource(rawText, { retrievedAt: retrievedAt ?? at });
  if (!confirmed || !source) return null;
  if (!validateEvidenceSource(source).ok) return null;
  const targets = unique((Array.isArray(targetSkills) ? targetSkills : []).map(clean).filter(Boolean));
  const targetByKey = new Map(targets.map((skill) => [skill.toLowerCase(), skill]));
  const skills = unique((Array.isArray(selectedSkills) ? selectedSkills : [])
    .map(clean)
    .filter((skill) => targetByKey.has(skill.toLowerCase()))
    .map((skill) => targetByKey.get(skill.toLowerCase())));
  const resolved = resolveExcerpts(source, excerpts);
  if (resolved.stale.length) return null;
  let spans = resolved.valid;
  let unstructured = false;
  if (!spans.length) {
    const whole = markExcerpt(source, 0, source.text.length);
    if (!whole.ok) return null;
    spans = [whole.span];
    unstructured = true;
  }
  const proofs = spans.map((span, index) => {
    const proof = unstructured
      ? proofFor(source, span, { note: UNSTRUCTURED_NOTE })
      : proofFor(source, span);
    if (!validateProofRecord(proof).ok) return null;
    return proofView(proof, span, unstructured ? `${PERSON_SOURCE_LABEL} (unstructured)` : `Exact excerpt ${index + 1}`);
  });
  if (proofs.some((proof) => proof === null)) return null;
  const confirmationRecord = { confirmedBy: LOCAL_HUMAN_ACTOR.id, confirmedAt: at, confirmedByDisplayName: LOCAL_HUMAN_ACTOR.displayName };
  if (!isConfirmationRecord(confirmationRecord)) return null;
  return {
    shape: PERSON_EVIDENCE_SHAPE,
    supplied: true,
    sourceType: "manual-paste",
    sessionOnly: true,
    confirmation: "USER-CONFIRMED",
    confirmationRecord,
    rawText: source.text,
    sourceId: source.id,
    source,
    normalisation: TEXT_NORMALISATION_VERSION,
    skills,
    excerpts: spans,
    unstructured,
    proofs,
  };
}

/**
 * A payload is manual person evidence only if it carries this shape, a confirmation record the
 * contract itself accepts (named human and a time), and its source and every proof re-validate.
 */
export function isManualPersonEvidence(value) {
  if (!(value && value.shape === PERSON_EVIDENCE_SHAPE && value.sourceType === "manual-paste" && value.confirmation === "USER-CONFIRMED" && value.sessionOnly === true)) return false;
  if (!isConfirmationRecord(value.confirmationRecord) || value.confirmationRecord.confirmedBy !== LOCAL_HUMAN_ACTOR.id) return false;
  if (!value.source || !validateEvidenceSource(value.source).ok || value.sourceId !== value.source.id) return false;
  if (!Array.isArray(value.proofs) || !value.proofs.length) return false;
  // Every proof view field a consumer may render is checked against the payload's own source:
  // offsets are integers inside the text, the text is the exact slice, the hash is the source's
  // (conformance-auditor C-3 under BLP-008: a number no validator can reject is not evidence).
  const text = value.source.text;
  return value.proofs.every((proof) => proof
    && typeof proof.spanId === "string" && proof.spanId.startsWith("span:") && proof.sourceId === value.source.id
    && Array.isArray(proof.evidenceIds) && proof.evidenceIds[0] === proof.spanId
    && Number.isInteger(proof.start) && Number.isInteger(proof.end) && proof.start >= 0 && proof.end > proof.start && proof.end <= text.length
    && proof.text === text.slice(proof.start, proof.end) && proof.text.trim().length > 0
    && proof.sourceTextHash === value.source.textHash
    && proof.spanId === `span:${value.source.id}:${proof.start}-${proof.end}`
    && proof.record && validateProofRecord(proof.record).ok && proof.record.id === proof.id && proof.record.excerptSpanId === proof.spanId && proof.record.candidateSourceId === proof.sourceId);
}
