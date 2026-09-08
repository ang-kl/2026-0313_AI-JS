// Structured candidate-proof ledger (BLP-008): distinct, source-linked proof records that
// REMEMBER, built over the canonical evidence contracts and BLP-007's person-evidence payload.
//
// The payload is rebuilt on every apply and refuses stale excerpts (BLP-007); the ledger is the
// layer that holds history. Every record is one contract ProofRecord (validated through
// validateProofRecord on every transition) carried with its source id, span id, source text hash
// and exact excerpt text, plus the ledger fields criterion (ii) names: the human's own claim
// (USER_AUTHORED, never pre-filled from the excerpt, null until typed), the proof type (a
// governed enum, human-chosen, UNSPECIFIED until chosen), the confirmation record, the missing
// evidence (computed deterministically from the record, never typed), and the downstream uses
// (the five destinations and the target links exactly as they stand).
//
// Staleness (criterion iii). A record's identity is a pure function of its source and span, and
// the source id is a content hash of the canonical text, so ANY edit changes the source id and
// stales EVERY active record at once: this is coarse but honest, and the panel says so rather
// than implying each proof was examined on its own. Editing the text back reproduces the same
// source, span and proof ids, so the same record RESUMES (STALE -> CLAIMED_ONLY, permitted by
// the contract's transition table) with its history intact; a duplicate is never appended.
// Removing an excerpt and re-applying the same text is a human act: the record moves to WITHHELD
// (evidence no longer offered) and can resume the same way. Clearing the session evidence
// withholds every active record.
//
// Purity: no module-level state and no clock; `previousLedger` and `at` are arguments, and the
// same inputs give byte-identical output. Events are the one audit shape, defined and validated
// here (a ReviewChange is a review act over posting text and is not reused for this).
//
// Forward hazard, named with an owner: this is the first structure in the programme that carries
// contract records forward in time. In memory that is safe; the contract's exact-version
// equality rests on nothing persisted carrying a stamp, so the day anyone persists a ledger a
// later CONTRACT_VERSION bump refuses every stored record. Owner: whoever adds persistence, with
// a migration rule in the contract changelog first. Nothing here touches browser storage.

import {
  CONTRACT_VERSION,
  PROOF_DESTINATION,
  PROOF_STATE,
  SOURCE_COMPLETENESS,
  validateProofRecord,
  isProofTransitionPermitted,
} from "../contracts/evidenceContracts.js";
import { LOCAL_HUMAN_ACTOR } from "../review/reviewerContract.js";
import { isManualPersonEvidence } from "./personEvidenceData.js";

export const LEDGER_VERSION = "1.0.0";

/**
 * Proof-type vocabulary. MECHANISM settled by the Blueprint Supervisor (a governed enum,
 * human-chosen per record, UNSPECIFIED until chosen and listed as missing evidence). WORDS are
 * product vocabulary reserved to the Human Lead and are PROVISIONAL until confirmed: one axis
 * only (what the thing is), because a "who vouches" axis would restate the CLAIMED_ONLY /
 * DEMONSTRATED / CERTIFIED ladder the contract already enforces. Anything outside this list is
 * refused by validateLedger and setProofType.
 */
export const PROOF_TYPE = Object.freeze(["UNSPECIFIED", "WORK_SAMPLE", "CREDENTIAL", "TESTIMONIAL"]);
export const PROOF_TYPE_LABEL = Object.freeze({
  UNSPECIFIED: "not chosen",
  WORK_SAMPLE: "work sample",
  CREDENTIAL: "credential",
  TESTIMONIAL: "testimonial",
});
export const PROOF_TYPE_VOCABULARY_STATUS = "PROVISIONAL_PENDING_HUMAN_LEAD";

export const LEDGER_EVENT_KIND = Object.freeze(["RECORDED", "RECONFIRMED", "STALE", "WITHHELD", "RESUMED", "PROOF_TYPE_SET", "CLAIM_SET"]);
export const LEDGER_EVENT_REASON = Object.freeze([
  "EXCERPT_CONFIRMED",
  "EXCERPT_RECONFIRMED",
  "SOURCE_TEXT_CHANGED",
  "SOURCE_TEXT_RESTORED",
  "EXCERPT_REMOVED",
  "EVIDENCE_CLEARED",
  "HUMAN_CHOICE",
]);
/** Each event kind admits only the reasons that can be true of it (conformance-auditor W-3). */
export const REASONS_BY_KIND = Object.freeze({
  RECORDED: ["EXCERPT_CONFIRMED"],
  RECONFIRMED: ["EXCERPT_RECONFIRMED"],
  STALE: ["SOURCE_TEXT_CHANGED"],
  WITHHELD: ["EXCERPT_REMOVED", "EVIDENCE_CLEARED"],
  RESUMED: ["SOURCE_TEXT_RESTORED", "EXCERPT_CONFIRMED"],
  PROOF_TYPE_SET: ["HUMAN_CHOICE"],
  CLAIM_SET: ["HUMAN_CHOICE"],
});
/** A payload the ledger will not fold is refused on the record, attributed to the system, never to the human. */
export const LEDGER_REFUSAL_REASON = Object.freeze(["PAYLOAD_REFUSED", "TRANSITION_REFUSED", "CHOICE_REFUSED", "LEDGER_INVALID"]);
export const LEDGER_ACTOR = Object.freeze({ SYSTEM: "system", HUMAN: LOCAL_HUMAN_ACTOR.id });

function isObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function isIso(value) { return typeof value === "string" && /T/.test(value) && !Number.isNaN(Date.parse(value)); }
function nonempty(value) { return typeof value === "string" && value.trim().length > 0; }

// ---------------------------------------------------------------------------------------------
// Events: the one audit shape, defined here and validated here.
// ---------------------------------------------------------------------------------------------
export function createLedgerEvent({ at, proofId, kind, from, to, reason, actor, detail } = {}) {
  return {
    ledgerVersion: LEDGER_VERSION,
    at: isIso(at) ? at : null,
    proofId: nonempty(proofId) ? proofId : null,
    kind: LEDGER_EVENT_KIND.includes(kind) ? kind : null,
    from: from ?? null,
    to: to ?? null,
    reason: LEDGER_EVENT_REASON.includes(reason) ? reason : null,
    actor: actor === LEDGER_ACTOR.SYSTEM || actor === LEDGER_ACTOR.HUMAN ? actor : null,
    detail: nonempty(detail) ? detail : null,
  };
}

export function validateLedgerEvent(event) {
  const errors = [];
  if (!isObject(event)) return { ok: false, errors: ["LedgerEvent must be an object"] };
  if (event.ledgerVersion !== LEDGER_VERSION) errors.push(`LedgerEvent.ledgerVersion must be ${LEDGER_VERSION}`);
  if (!isIso(event.at)) errors.push("LedgerEvent.at must be an ISO 8601 instant");
  if (!nonempty(event.proofId) || !event.proofId.startsWith("proof:")) errors.push("LedgerEvent.proofId must name a proof record");
  if (!LEDGER_EVENT_KIND.includes(event.kind)) errors.push(`LedgerEvent.kind must be one of ${LEDGER_EVENT_KIND.join(", ")}`);
  if (!LEDGER_EVENT_REASON.includes(event.reason)) errors.push(`LedgerEvent.reason must be one of ${LEDGER_EVENT_REASON.join(", ")}`);
  if (event.actor !== LEDGER_ACTOR.SYSTEM && event.actor !== LEDGER_ACTOR.HUMAN) errors.push("LedgerEvent.actor must be the system or the local human actor");
  if (LEDGER_EVENT_KIND.includes(event.kind) && LEDGER_EVENT_REASON.includes(event.reason) && !REASONS_BY_KIND[event.kind].includes(event.reason)) errors.push(`reason ${event.reason} cannot be true of a ${event.kind} event`);
  switch (event.kind) {
    case "RECORDED":
      if (event.from !== null) errors.push("RECORDED leaves no state");
      if (!PROOF_STATE.includes(event.to)) errors.push("RECORDED must name the state entered");
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("RECORDED follows the human's confirmation and must name the human actor");
      break;
    case "STALE":
    case "WITHHELD":
    case "RESUMED": {
      const expectedTo = event.kind === "RESUMED" ? "CLAIMED_ONLY" : event.kind;
      if (!PROOF_STATE.includes(event.from)) errors.push(`${event.kind} must name the state it left`);
      if (event.to !== expectedTo) errors.push(`a ${event.kind} event must enter ${expectedTo}`);
      if (PROOF_STATE.includes(event.from) && !isProofTransitionPermitted(event.from, expectedTo)) errors.push(`transition ${event.from} -> ${expectedTo} is not permitted by the contract`);
      if (event.kind === "STALE" && event.actor !== LEDGER_ACTOR.SYSTEM) errors.push("staleness is detected by the system, not decided by a human");
      if (event.kind !== "STALE" && event.actor !== LEDGER_ACTOR.HUMAN) errors.push(`${event.kind} follows a human act (apply, remove, clear) and must name the human actor`);
      break;
    }
    case "RECONFIRMED":
      if (event.from !== null || event.to !== null) errors.push("RECONFIRMED changes no state and must carry none");
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("RECONFIRMED follows the human's confirmation");
      break;
    case "PROOF_TYPE_SET":
      if (!PROOF_TYPE.includes(event.to)) errors.push("PROOF_TYPE_SET must record which governed proof type was chosen");
      if (event.from !== null && !PROOF_TYPE.includes(event.from)) errors.push("PROOF_TYPE_SET must record the governed proof type it left, or null");
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("PROOF_TYPE_SET is a human choice");
      break;
    case "CLAIM_SET":
      if (event.to !== null && !nonempty(event.to)) errors.push("CLAIM_SET carries the claim text or null");
      if (event.from !== null && !nonempty(event.from)) errors.push("CLAIM_SET carries the previous claim text or null");
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("CLAIM_SET is a human choice");
      break;
    default:
      break;
  }
  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------------------------
export function createEmptyLedger() {
  return { ledgerVersion: LEDGER_VERSION, contractVersion: CONTRACT_VERSION, records: [], events: [], refusals: [] };
}

export function createLedgerRefusal({ at, reason, detail } = {}) {
  return { ledgerVersion: LEDGER_VERSION, at: isIso(at) ? at : null, reason: LEDGER_REFUSAL_REASON.includes(reason) ? reason : null, detail: nonempty(detail) ? detail : null, actor: LEDGER_ACTOR.SYSTEM };
}

export function validateLedgerRefusal(refusal) {
  const errors = [];
  if (!isObject(refusal)) return { ok: false, errors: ["LedgerRefusal must be an object"] };
  if (refusal.ledgerVersion !== LEDGER_VERSION) errors.push(`LedgerRefusal.ledgerVersion must be ${LEDGER_VERSION}`);
  if (!isIso(refusal.at)) errors.push("LedgerRefusal.at must be an ISO 8601 instant");
  if (!LEDGER_REFUSAL_REASON.includes(refusal.reason)) errors.push(`LedgerRefusal.reason must be one of ${LEDGER_REFUSAL_REASON.join(", ")}`);
  if (!nonempty(refusal.detail)) errors.push("LedgerRefusal.detail must say what was refused");
  if (refusal.actor !== LEDGER_ACTOR.SYSTEM) errors.push("a refusal is the system's act, never attributed to the human");
  return { ok: errors.length === 0, errors };
}

/** The payload view fields the ledger copies must agree with the payload's own source (conformance-auditor C-3). */
export function validatePayloadProof(payload, proof) {
  const errors = [];
  if (!isObject(proof)) return { ok: false, errors: ["proof must be an object"] };
  const text = payload?.source?.text;
  if (typeof text !== "string") errors.push("payload has no source text");
  if (!Number.isInteger(proof.start) || !Number.isInteger(proof.end) || proof.start < 0 || proof.end <= proof.start) errors.push(`${proof.id}: start and end must be integers with 0 <= start < end`);
  else if (typeof text === "string" && (proof.end > text.length || proof.text !== text.slice(proof.start, proof.end))) errors.push(`${proof.id}: excerpt text is not the source slice`);
  if (!nonempty(proof.text) || !proof.text.trim()) errors.push(`${proof.id}: excerpt text is empty`);
  if (proof.sourceTextHash !== payload?.source?.textHash) errors.push(`${proof.id}: source text hash does not match the payload source`);
  if (proof.sourceId !== payload?.sourceId) errors.push(`${proof.id}: source id does not match the payload`);
  if (!isObject(proof.record) || !validateProofRecord(proof.record).ok) errors.push(`${proof.id}: contract record fails validation`);
  else if (proof.record.id !== proof.id || proof.record.excerptSpanId !== proof.spanId || proof.record.candidateSourceId !== proof.sourceId) errors.push(`${proof.id}: view ids drifted from the contract record`);
  return { ok: errors.length === 0, errors };
}

/** Every ledger mutation passes through here: an invalid result never becomes state. */
function commit(previous, candidate, at, detail) {
  const verdict = validateLedger(candidate);
  if (verdict.ok) return { ok: true, ledger: candidate };
  const refusal = createLedgerRefusal({ at, reason: "LEDGER_INVALID", detail: `${detail}: ${verdict.errors[0]}` });
  return { ok: false, ledger: { ...previous, refusals: [...(previous.refusals || []), refusal] }, error: verdict.errors[0] };
}

function withState(record, state) {
  return { ...record, record: { ...record.record, state } };
}

function sortRecords(records) {
  return [...records].sort((a, b) => (a.recordedAt < b.recordedAt ? -1 : a.recordedAt > b.recordedAt ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function recordFromPayloadProof(payload, proof, at) {
  return {
    ledgerVersion: LEDGER_VERSION,
    id: proof.id,
    record: proof.record,
    sourceId: proof.sourceId,
    spanId: proof.spanId,
    sourceTextHash: proof.sourceTextHash,
    excerptText: proof.text,
    start: proof.start,
    end: proof.end,
    unstructured: payload.unstructured === true,
    sourceCompleteness: payload.source?.completeness ?? null,
    confirmation: { confirmedBy: payload.confirmationRecord.confirmedBy, confirmedAt: payload.confirmationRecord.confirmedAt, confirmedByDisplayName: payload.confirmationRecord.confirmedByDisplayName },
    proofType: "UNSPECIFIED",
    claimText: null,
    claimOrigin: null,
    recordedAt: at,
    lastEventAt: at,
  };
}

/**
 * Fold a newly applied (or cleared) person-evidence payload into the ledger. Pure: returns a new
 * ledger; `previousLedger` is not mutated; `at` is the caller's clock.
 */
export function applyEvidenceToLedger(previousLedger, payload, at) {
  const base = isObject(previousLedger) && Array.isArray(previousLedger.records) ? { refusals: [], ...previousLedger } : createEmptyLedger();
  if (!isIso(at)) throw new Error("applyEvidenceToLedger needs an ISO instant");
  // A payload that is not manual person evidence, or whose proof views disagree with their own
  // source, is REFUSED: the ledger is returned unchanged with a refusal on the record, attributed
  // to the system. Only an explicit null (the human cleared the evidence) withholds records.
  if (payload !== null && payload !== undefined) {
    if (!isManualPersonEvidence(payload)) return { ...base, refusals: [...base.refusals, createLedgerRefusal({ at, reason: "PAYLOAD_REFUSED", detail: "the payload is not manual person evidence; nothing was folded and no record changed" })] };
    for (const proof of payload.proofs) {
      const verdict = validatePayloadProof(payload, proof);
      if (!verdict.ok) return { ...base, refusals: [...base.refusals, createLedgerRefusal({ at, reason: "PAYLOAD_REFUSED", detail: verdict.errors[0] })] };
    }
  }
  const events = [...base.events];
  const byId = new Map(base.records.map((r) => [r.id, r]));
  const evidence = payload ? payload : null;
  const incoming = new Map(evidence ? evidence.proofs.map((p) => [p.id, p]) : []);
  const next = new Map();
  const refuse = (detail) => ({ ...base, refusals: [...base.refusals, createLedgerRefusal({ at, reason: "TRANSITION_REFUSED", detail })] });
  const push = (event) => { const verdict = validateLedgerEvent(event); if (!verdict.ok) throw new Error(`invalid ledger event: ${verdict.errors[0]}`); events.push(event); };

  // Existing records not offered by the new payload.
  for (const record of byId.values()) {
    const current = record.record.state;
    if (incoming.has(record.id)) { next.set(record.id, record); continue; }
    if (!["CLAIMED_ONLY", "DEMONSTRATED", "CERTIFIED", "CONFLICTING"].includes(current)) { next.set(record.id, record); continue; }
    if (!evidence) {
      if (!isProofTransitionPermitted(current, "WITHHELD")) return refuse(`${record.id}: ${current} -> WITHHELD is not permitted by the contract`);
      push(createLedgerEvent({ at, proofId: record.id, kind: "WITHHELD", from: current, to: "WITHHELD", reason: "EVIDENCE_CLEARED", actor: LEDGER_ACTOR.HUMAN }));
      next.set(record.id, { ...withState(record, "WITHHELD"), lastEventAt: at });
    } else if (evidence.sourceId === record.sourceId) {
      // Same text, this excerpt no longer offered: a human removed it.
      if (!isProofTransitionPermitted(current, "WITHHELD")) return refuse(`${record.id}: ${current} -> WITHHELD is not permitted by the contract`);
      push(createLedgerEvent({ at, proofId: record.id, kind: "WITHHELD", from: current, to: "WITHHELD", reason: "EXCERPT_REMOVED", actor: LEDGER_ACTOR.HUMAN }));
      next.set(record.id, { ...withState(record, "WITHHELD"), lastEventAt: at });
    } else {
      // Different text: the source this record was cut from is gone. Every active record on the
      // old source goes stale together; the system detects it, nobody decides it.
      if (!isProofTransitionPermitted(current, "STALE")) return refuse(`${record.id}: ${current} -> STALE is not permitted by the contract`);
      push(createLedgerEvent({ at, proofId: record.id, kind: "STALE", from: current, to: "STALE", reason: "SOURCE_TEXT_CHANGED", actor: LEDGER_ACTOR.SYSTEM, detail: `source ${record.sourceId} replaced by ${evidence.sourceId}` }));
      next.set(record.id, { ...withState(record, "STALE"), lastEventAt: at });
    }
  }

  // Records offered by the new payload.
  for (const proof of incoming.values()) {
    const existing = byId.get(proof.id);
    if (!existing) {
      push(createLedgerEvent({ at, proofId: proof.id, kind: "RECORDED", from: null, to: proof.record.state, reason: "EXCERPT_CONFIRMED", actor: LEDGER_ACTOR.HUMAN }));
      next.set(proof.id, recordFromPayloadProof(evidence, proof, at));
      continue;
    }
    const current = existing.record.state;
    // The same proof id can arrive with different payload facts (the whole text marked explicitly
    // is the same span as the unstructured proof), so the payload-derived facts are refreshed and
    // any change is said in the event (conformance-auditor C-1).
    const unstructured = evidence.unstructured === true;
    const sourceCompleteness = evidence.source?.completeness ?? null;
    const changed = [];
    if (existing.unstructured !== unstructured) changed.push(unstructured ? "now the whole pasted text with no exact excerpt marked" : "now an exact excerpt marked by hand");
    if (existing.sourceCompleteness !== sourceCompleteness) changed.push(`source completeness ${existing.sourceCompleteness} -> ${sourceCompleteness}`);
    const refreshed = { ...existing, unstructured, sourceCompleteness, confirmation: { confirmedBy: evidence.confirmationRecord.confirmedBy, confirmedAt: evidence.confirmationRecord.confirmedAt, confirmedByDisplayName: evidence.confirmationRecord.confirmedByDisplayName }, lastEventAt: at };
    if (current === "STALE" || current === "WITHHELD") {
      // Same source, span and proof ids: the same record resumes. Never a duplicate. The reason is
      // the one that is true: the text was displaced and restored (STALE), or the human offered the
      // excerpt again after removing or clearing it (WITHHELD) (conformance-auditor W-4).
      if (!isProofTransitionPermitted(current, "CLAIMED_ONLY")) return refuse(`${proof.id}: ${current} -> CLAIMED_ONLY is not permitted by the contract`);
      push(createLedgerEvent({ at, proofId: proof.id, kind: "RESUMED", from: current, to: "CLAIMED_ONLY", reason: current === "STALE" ? "SOURCE_TEXT_RESTORED" : "EXCERPT_CONFIRMED", actor: LEDGER_ACTOR.HUMAN, detail: changed.join("; ") || undefined }));
      next.set(proof.id, withState(refreshed, "CLAIMED_ONLY"));
    } else {
      push(createLedgerEvent({ at, proofId: proof.id, kind: "RECONFIRMED", from: null, to: null, reason: "EXCERPT_RECONFIRMED", actor: LEDGER_ACTOR.HUMAN, detail: changed.join("; ") || undefined }));
      next.set(proof.id, refreshed);
    }
  }
  const candidate = { ...base, ledgerVersion: LEDGER_VERSION, contractVersion: CONTRACT_VERSION, records: sortRecords([...next.values()]), events };
  return commit(base, candidate, at, "applyEvidenceToLedger").ledger;
}

/** Every refused choice leaves a trace: the ledger is the single record of what was refused. */
function refuseChoice(ledger, at, detail) {
  const refusal = createLedgerRefusal({ at: isIso(at) ? at : null, reason: "CHOICE_REFUSED", detail });
  if (!validateLedgerRefusal(refusal).ok) throw new Error("a refusal needs an ISO instant");
  return { ok: false, ledger: { ...ledger, refusals: [...(ledger.refusals || []), refusal] }, error: detail };
}

export function setProofType(ledger, proofId, proofType, at) {
  if (!isIso(at)) throw new Error("setProofType needs an ISO instant");
  if (!PROOF_TYPE.includes(proofType)) return refuseChoice(ledger, at, `proof type ${String(proofType)} is not governed; it must be one of ${PROOF_TYPE.join(", ")}`);
  const record = ledger.records.find((r) => r.id === proofId);
  if (!record) return refuseChoice(ledger, at, `no proof record ${String(proofId)}`);
  if (record.proofType === proofType) return { ok: true, ledger };
  const event = createLedgerEvent({ at, proofId, kind: "PROOF_TYPE_SET", from: record.proofType, to: proofType, reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN });
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === proofId ? { ...r, proofType, lastEventAt: at } : r)), events: [...ledger.events, event] }, at, "setProofType");
}

/** The claim is the human's own words, USER_AUTHORED, never generated and never pre-filled. */
export function setClaimText(ledger, proofId, text, at) {
  if (!isIso(at)) throw new Error("setClaimText needs an ISO instant");
  const record = ledger.records.find((r) => r.id === proofId);
  if (!record) return refuseChoice(ledger, at, `no proof record ${String(proofId)}`);
  const claim = nonempty(text) ? String(text).replace(/\s+/g, " ").trim() : null;
  if (claim === record.claimText) return { ok: true, ledger };
  const event = createLedgerEvent({ at, proofId, kind: "CLAIM_SET", from: record.claimText, to: claim, reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN });
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === proofId ? { ...r, claimText: claim, claimOrigin: claim ? "USER_AUTHORED" : null, lastEventAt: at } : r)), events: [...ledger.events, event] }, at, "setClaimText");
}

// ---------------------------------------------------------------------------------------------
// Views: missing evidence and downstream uses are COMPUTED from the record, never typed.
// ---------------------------------------------------------------------------------------------
export function missingEvidenceOf(record, { currentSourceId } = {}) {
  const missing = [];
  const state = record.record.state;
  if (state === "STALE") missing.push(currentSourceId && currentSourceId === record.sourceId ? "the excerpt is no longer marked on this text; mark it again to resume" : "the pasted text changed since this proof was recorded; mark the excerpt again on the current text, or restore the earlier text to resume");
  if (state === "WITHHELD") missing.push("this excerpt is no longer offered as evidence; mark it again to resume");
  if (record.unstructured) missing.push("no exact excerpt marked; the proof covers the whole pasted text");
  if (!record.claimText) missing.push("no claim stated in your own words");
  if (record.proofType === "UNSPECIFIED") missing.push("no proof type chosen");
  if (!record.record.targets.length) missing.push("not yet linked to a target (see target links)");
  if (!PROOF_DESTINATION.some((key) => record.record.destinations[key] === "ALLOWED")) missing.push("no destination approved yet (see destination approvals)");
  if (!["DEMONSTRATED", "CERTIFIED"].includes(state)) missing.push(`proof state is ${state}, not DEMONSTRATED or CERTIFIED`);
  if (record.sourceCompleteness !== "COMPLETE") missing.push("the source is not attested complete");
  return missing;
}

export function downstreamUsesOf(record) {
  const allowed = PROOF_DESTINATION.filter((key) => record.record.destinations[key] === "ALLOWED");
  const revoked = PROOF_DESTINATION.filter((key) => record.record.destinations[key] === "REVOKED");
  return {
    destinations: { ...record.record.destinations },
    targets: [...record.record.targets],
    text: [
      record.record.targets.length ? `linked to ${record.record.targets.length} target${record.record.targets.length === 1 ? "" : "s"}` : "not yet linked to a target (see target links)",
      allowed.length ? `approved for ${allowed.join(", ")}` : "no destinations approved yet (see destination approvals)",
      revoked.length ? `revoked for ${revoked.join(", ")}` : null,
    ].filter(Boolean),
  };
}

export function ledgerRows(ledger, { currentSourceId } = {}) {
  const events = Array.isArray(ledger?.events) ? ledger.events : [];
  return (Array.isArray(ledger?.records) ? ledger.records : []).map((record) => ({
    id: record.id,
    sourceId: record.sourceId,
    spanId: record.spanId,
    sourceTextHash: record.sourceTextHash,
    excerptText: record.excerptText,
    start: record.start,
    end: record.end,
    unstructured: record.unstructured,
    state: record.record.state,
    proofType: record.proofType,
    proofTypeLabel: PROOF_TYPE_LABEL[record.proofType],
    claimText: record.claimText,
    claimOrigin: record.claimOrigin,
    confirmation: record.confirmation,
    onCurrentSource: Boolean(currentSourceId && currentSourceId === record.sourceId),
    missingEvidence: missingEvidenceOf(record, { currentSourceId }),
    downstreamUses: downstreamUsesOf(record),
    recordedAt: record.recordedAt,
    lastEventAt: record.lastEventAt,
    events: events.filter((e) => e.proofId === record.id),
  }));
}

export function ledgerCounts(ledger) {
  const counts = { total: 0 };
  for (const state of PROOF_STATE) counts[state] = 0;
  for (const record of ledger?.records || []) { counts.total += 1; counts[record.record.state] += 1; }
  return counts;
}

export function validateLedger(ledger) {
  const errors = [];
  if (!isObject(ledger)) return { ok: false, errors: ["ledger must be an object"] };
  if (ledger.ledgerVersion !== LEDGER_VERSION) errors.push(`ledgerVersion must be ${LEDGER_VERSION}`);
  if (ledger.contractVersion !== CONTRACT_VERSION) errors.push(`contractVersion must be ${CONTRACT_VERSION}`);
  if (!Array.isArray(ledger.records) || !Array.isArray(ledger.events) || !Array.isArray(ledger.refusals)) return { ok: false, errors: [...errors, "records, events and refusals must be arrays"] };
  const ids = new Set();
  for (const record of ledger.records) {
    if (!isObject(record) || !nonempty(record.id)) { errors.push("record without an id"); continue; }
    if (ids.has(record.id)) errors.push(`duplicate proof record ${record.id}`);
    ids.add(record.id);
    if (record.ledgerVersion !== LEDGER_VERSION) errors.push(`${record.id}: record ledgerVersion must be ${LEDGER_VERSION}`);
    const verdict = validateProofRecord(record.record);
    if (!verdict.ok) errors.push(`${record.id}: ${verdict.errors[0]}`);
    if (record.record?.id !== record.id) errors.push(`${record.id}: ledger id and contract id differ`);
    if (record.record?.candidateSourceId !== record.sourceId || record.record?.excerptSpanId !== record.spanId) errors.push(`${record.id}: source or span id drifted from the contract record`);
    if (!nonempty(record.sourceTextHash) || !/^[0-9a-f]{64}$/.test(record.sourceTextHash)) errors.push(`${record.id}: source text hash must be a sha256 hex`);
    if (typeof record.excerptText !== "string" || !record.excerptText.trim()) errors.push(`${record.id}: no excerpt text`);
    if (!Number.isInteger(record.start) || !Number.isInteger(record.end) || record.start < 0 || record.end <= record.start) errors.push(`${record.id}: start and end must be integers with 0 <= start < end`);
    else if (typeof record.excerptText === "string" && record.excerptText.length !== record.end - record.start) errors.push(`${record.id}: excerpt length does not match its offsets`);
    else if (nonempty(record.spanId) && record.spanId !== `span:${record.sourceId}:${record.start}-${record.end}`) errors.push(`${record.id}: span id does not match its source and offsets`);
    if (typeof record.unstructured !== "boolean") errors.push(`${record.id}: unstructured must be a boolean`);
    if (!SOURCE_COMPLETENESS.includes(record.sourceCompleteness)) errors.push(`${record.id}: source completeness must be one of ${SOURCE_COMPLETENESS.join(", ")}`);
    if (!PROOF_TYPE.includes(record.proofType)) errors.push(`${record.id}: proof type ${record.proofType} is not governed`);
    if (record.claimText !== null && (!nonempty(record.claimText) || record.claimOrigin !== "USER_AUTHORED")) errors.push(`${record.id}: a claim must be non-empty and USER_AUTHORED`);
    if (record.claimText === null && record.claimOrigin !== null) errors.push(`${record.id}: no claim, so no claim origin`);
    if (!isObject(record.confirmation) || record.confirmation.confirmedBy !== LOCAL_HUMAN_ACTOR.id || !isIso(record.confirmation.confirmedAt) || record.confirmation.confirmedByDisplayName !== LOCAL_HUMAN_ACTOR.displayName) errors.push(`${record.id}: confirmation must name the local human actor, its display name and a time`);
    if (!isIso(record.recordedAt)) errors.push(`${record.id}: recordedAt must be an instant`);
    if (!isIso(record.lastEventAt) || record.lastEventAt < record.recordedAt) errors.push(`${record.id}: lastEventAt must be an instant no earlier than recordedAt`);
    const own = ledger.events.filter((e) => e.proofId === record.id);
    if (!own.length || own[0].kind !== "RECORDED") errors.push(`${record.id}: history must begin with a RECORDED event`);
    const lastState = [...own].reverse().find((e) => ["RECORDED", "STALE", "WITHHELD", "RESUMED"].includes(e.kind));
    if (lastState && lastState.to !== record.record.state) errors.push(`${record.id}: state ${record.record.state} does not follow from its last state event (${lastState.to})`);
    // Human choices are derived from history the same way state is: a choice without its event is refused.
    const lastType = [...own].reverse().find((e) => e.kind === "PROOF_TYPE_SET");
    if ((lastType ? lastType.to : "UNSPECIFIED") !== record.proofType) errors.push(`${record.id}: proof type ${record.proofType} does not follow from its history (${lastType ? lastType.to : "no PROOF_TYPE_SET event"})`);
    const lastClaim = [...own].reverse().find((e) => e.kind === "CLAIM_SET");
    if ((lastClaim ? lastClaim.to : null) !== record.claimText) errors.push(`${record.id}: claim does not follow from its history (${lastClaim ? "last CLAIM_SET differs" : "no CLAIM_SET event"})`);
    if (own.length && own[own.length - 1].at !== record.lastEventAt) errors.push(`${record.id}: lastEventAt does not match its last event`);
  }
  ledger.refusals.forEach((refusal, i) => { const v = validateLedgerRefusal(refusal); if (!v.ok) errors.push(`refusals[${i}]: ${v.errors[0]}`); });
  ledger.events.forEach((event, i) => {
    const verdict = validateLedgerEvent(event);
    if (!verdict.ok) errors.push(`events[${i}]: ${verdict.errors[0]}`);
    else if (!ids.has(event.proofId)) errors.push(`events[${i}]: names unknown record ${event.proofId}`);
    if (i > 0 && ledger.events[i - 1].at > event.at) errors.push(`events[${i}]: out of order`);
  });
  return { ok: errors.length === 0, errors };
}
