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
  PROOF_TARGET_KIND,
  SOURCE_COMPLETENESS,
  validateProofRecord,
  isProofTransitionPermitted,
  sha256Hex,
} from "../contracts/evidenceContracts.js";
import { LOCAL_HUMAN_ACTOR } from "../review/reviewerContract.js";
import { isManualPersonEvidence } from "./personEvidenceData.js";
import { proofStateText } from "../contracts/evidenceAdapter.js";

// 1.1.0 under BLP-009: the link shape, four event kinds, the link reasons and two refusals joined the
// vocabulary that validateLedger checks per record and per link, so the stamp moved with it
// (conformance-auditor D8). Minor, not patch: new_feature_added under the repo's bump_decision;
// Rule V-1 confirmation is the Human Lead's at the PR gate. Nothing persisted carries the stamp today.
// 1.2.0 under BLP-010: the six proof states become reachable through human declarations and system
// detection (STATE_SET, CONFLICT_DECLARED, CONFLICT_RESOLVED, the lost-link and dissolution
// reasons), so the vocabulary the validator checks moved again. Minor, surfaced for Rule V-1.
export const LEDGER_VERSION = "1.2.0";

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

export const LEDGER_EVENT_KIND = Object.freeze(["RECORDED", "RECONFIRMED", "STALE", "WITHHELD", "RESUMED", "PROOF_TYPE_SET", "CLAIM_SET", "LINKED", "UNLINKED", "LINK_INVALID", "LINK_RESUMED", "STATE_SET", "CONFLICT_DECLARED", "CONFLICT_RESOLVED", "STALE_CAUSE"]);
export const LEDGER_EVENT_REASON = Object.freeze([
  "EXCERPT_CONFIRMED",
  "EXCERPT_RECONFIRMED",
  "SOURCE_TEXT_CHANGED",
  "SOURCE_TEXT_RESTORED",
  "EXCERPT_REMOVED",
  "EVIDENCE_CLEARED",
  "HUMAN_CHOICE",
  "TARGET_SOURCE_CHANGED",
  "TARGET_ABSENT",
  "TARGET_UNTRUSTED",
  "TARGET_TEXT_CHANGED",
  "CANDIDATE_SOURCE_CHANGED",
  "TARGET_RESTORED",
  "TARGET_EVIDENCE_UNAVAILABLE",
  "TARGET_REEXTRACTED",
  "TARGET_EVIDENCE_READ",
  "CANDIDATE_SOURCE_RESTORED",
  "HUMAN_DECLARATION",
  "STATE_WITHDRAWN",
  "TARGET_LINK_LOST",
  "TARGET_RELINKED",
  "CONFLICT_TARGET_LOST",
  "CONFLICT_COUNTERPART_LOST",
  "CONFLICT_DISSOLVED",
  "OFFERED_AGAIN",
]);
/** Each event kind admits only the reasons that can be true of it (conformance-auditor W-3). */
export const REASONS_BY_KIND = Object.freeze({
  RECORDED: ["EXCERPT_CONFIRMED"],
  RECONFIRMED: ["EXCERPT_RECONFIRMED"],
  STALE: ["SOURCE_TEXT_CHANGED", "TARGET_LINK_LOST", "CONFLICT_TARGET_LOST", "CONFLICT_COUNTERPART_LOST"],
  WITHHELD: ["EXCERPT_REMOVED", "EVIDENCE_CLEARED", "STATE_WITHDRAWN"],
  RESUMED: ["SOURCE_TEXT_RESTORED", "EXCERPT_CONFIRMED", "STATE_WITHDRAWN", "TARGET_RESTORED", "TARGET_RELINKED", "CONFLICT_DISSOLVED", "OFFERED_AGAIN"],
  STALE_CAUSE: ["SOURCE_TEXT_CHANGED"],
  STATE_SET: ["HUMAN_DECLARATION"],
  CONFLICT_DECLARED: ["HUMAN_DECLARATION"],
  CONFLICT_RESOLVED: ["HUMAN_DECLARATION"],
  PROOF_TYPE_SET: ["HUMAN_CHOICE"],
  CLAIM_SET: ["HUMAN_CHOICE"],
  LINKED: ["HUMAN_CHOICE"],
  UNLINKED: ["HUMAN_CHOICE"],
  LINK_INVALID: ["TARGET_SOURCE_CHANGED", "TARGET_ABSENT", "TARGET_REEXTRACTED", "TARGET_UNTRUSTED", "TARGET_TEXT_CHANGED", "CANDIDATE_SOURCE_CHANGED", "TARGET_EVIDENCE_UNAVAILABLE"],
  LINK_RESUMED: ["TARGET_RESTORED", "TARGET_EVIDENCE_READ", "CANDIDATE_SOURCE_RESTORED"],
});
/** A payload the ledger will not fold is refused on the record, attributed to the system, never to the human. */
export const LEDGER_REFUSAL_REASON = Object.freeze(["PAYLOAD_REFUSED", "TRANSITION_REFUSED", "CHOICE_REFUSED", "LINK_REFUSED", "STATE_REFUSED", "LEDGER_INVALID"]);

// ---------------------------------------------------------------------------------------------
// Proof states (BLP-010). The six contract states become REACHABLE: the human declares
// DEMONSTRATED or CERTIFIED (STATE_SET), withdraws a declaration (WITHHELD then RESUMED, the only
// path the contract admits), declares a conflict between two accepted records over one shared
// target (CONFLICT_DECLARED, symmetric, enforced by the validator) and resolves it
// (CONFLICT_RESOLVED, both sides move); the system detects the loss of the link a demonstration
// stands on (STALE, TARGET_LINK_LOST) and the loss of a conflict's object or counterpart
// (dissolution: STALE then RESUMED to CLAIMED_ONLY in one act). The state semantics are SOURCED,
// not invented: script/v3-result-engine-spec.md line 185 defines them for this house
// ("demonstrated = CV achievements / certified = qualifications / claimed = self-listed skills");
// the scoring that served is out of scope. Contract-given: DEMONSTRATED and CERTIFIED require a
// USER-CONFIRMED confirmation. Structurally justified (Supervisor ruling Q2): DEMONSTRATED requires
// at least one link STANDING UNDER A LIVE JUDGEMENT, never one merely recorded VALID, because a
// demonstration must have an object and targets[] is the only place one can live; neither accepted
// state may be entered on an unstructured whole-text record. Interpretive and escalated: the mapping
// of proof types to states (WORK_SAMPLE -> DEMONSTRATED, CREDENTIAL -> CERTIFIED) is the Human
// Lead's, so the human declares the state directly and any mismatch is shown in words, never
// refused. Resumption from STALE returns to CLAIMED_ONLY, never to the pre-stale accepted state,
// although the contract's table would permit it: the excerpt was re-confirmed, the demonstration
// was not re-asserted (ruling Q5); a later reader must not "fix" this back.
// ---------------------------------------------------------------------------------------------
export const ACCEPTED_STATES = Object.freeze(["DEMONSTRATED", "CERTIFIED"]);
export const STALE_CAUSE = Object.freeze({ CANDIDATE_TEXT: "CANDIDATE_TEXT", TARGET_LINK: "TARGET_LINK" });
export const WITHHELD_CAUSE = Object.freeze({ EXCERPT_REMOVED: "EXCERPT_REMOVED", EVIDENCE_CLEARED: "EVIDENCE_CLEARED", CONFLICT_RESOLVED: "CONFLICT_RESOLVED" });
/** A stale record carries a SET of causes; it resumes only when every cause is cleared, each by the act that clears it. */
const onlyTargetLink = (record) => Array.isArray(record.staleCauses) && record.staleCauses.length === 1 && record.staleCauses[0] === STALE_CAUSE.TARGET_LINK;
/**
 * One definition of the words for each stale cause (conformance-auditor W-3, W-4): keyed on the
 * governed set with no default arm, so a cause the table does not know throws rather than being
 * narrated as the likeliest one. `onCurrentSource` tells the CANDIDATE_TEXT arm whether the text in
 * the box is the record's own (excerpt no longer marked) or another (text changed).
 */
const STALE_CAUSE_WORDS = Object.freeze({
  CANDIDATE_TEXT: (onCurrentSource) => (onCurrentSource ? "the excerpt is no longer marked on this text; mark it again to resume" : "the pasted text changed since this proof was recorded; mark the excerpt again on the current text, or restore the earlier text to resume"),
  TARGET_LINK: () => "the link this demonstration stood on no longer stands against the posting evidence; link again, or wait for the target to return, and the record resumes as claimed only",
});
const WITHHELD_CAUSE_WORDS = Object.freeze({
  EXCERPT_REMOVED: "you removed this excerpt from the marked evidence; mark and apply it again to resume",
  EVIDENCE_CLEARED: "you cleared the evidence; mark and apply the excerpt again to resume",
  CONFLICT_RESOLVED: "you withheld this excerpt at a conflict's resolution while it stays marked; applying the same evidence does not resume it, offer it again to resume",
});
export function withheldCauseText(cause) {
  const words = WITHHELD_CAUSE_WORDS[cause];
  if (!words) throw new Error(`no words are defined for withheld cause ${String(cause)}; the table must name every governed cause`);
  return words;
}
export function staleCauseText(cause, { onCurrentSource = false } = {}) {
  const words = STALE_CAUSE_WORDS[cause];
  if (!words) throw new Error(`no words are defined for stale cause ${String(cause)}; the table must name every governed cause`);
  return words(Boolean(onCurrentSource));
}
/** A declared link is LOST when judged and found not standing; a link the evidence could not judge is neither lost nor standing. */
const linkLost = (l) => l.state === "INVALID" && l.reason !== "TARGET_EVIDENCE_UNAVAILABLE";
const linkStandsOrUnjudged = (l) => l.state === "VALID" || (l.state === "INVALID" && l.reason === "TARGET_EVIDENCE_UNAVAILABLE");
export const CONFLICT_RESOLUTION = Object.freeze(["DEMONSTRATED", "CERTIFIED", "WITHHELD"]);
/** The ruled reading of a proof type onto a state, shown as words and never enforced (Supervisor ruling Q2, escalated to the Human Lead). */
export const PROOF_TYPE_STATE_READING = Object.freeze({ WORK_SAMPLE: "DEMONSTRATED", CREDENTIAL: "CERTIFIED" });
export function proofTypeStateNote(record) {
  if (!ACCEPTED_STATES.includes(record.record.state)) return null;
  const reading = PROOF_TYPE_STATE_READING[record.proofType];
  if (record.proofType === "UNSPECIFIED") return `declared ${record.record.state} with no proof type chosen; the reading of proof types onto states awaits the Human Lead`;
  if (!reading) return `declared ${record.record.state} with proof type ${PROOF_TYPE_LABEL[record.proofType]}, which has no ruled reading onto a state; the reading awaits the Human Lead`;
  if (reading !== record.record.state) return `declared ${record.record.state} while its proof type is ${PROOF_TYPE_LABEL[record.proofType]}, whose ruled reading is ${reading}; shown, not refused, because the reading awaits the Human Lead`;
  return null;
}
/** Links can be judged on an active record and on a record stale for TARGET reasons (its excerpt stands; its link does not). */
export function linksJudgeable(record) {
  return ACTIVE_STATES.includes(record.record.state) || (record.record.state === "STALE" && onlyTargetLink(record));
}

// ---------------------------------------------------------------------------------------------
// Proof-to-target links (BLP-009). A link targets a STABLE role-evidence identifier from the
// posting's evidence bundle (BLP-003): a distilled duty span whose parentage is trusted (VERIFIED
// or USER_CONFIRMED) or a verbatim requirement span. Skills and competencies have no identifier
// class in this system, and an accepted review observation has no decision record (its
// acceptance lives in session state and is minted into nothing, owned by BLP-013), so linking to
// them is refused with a reason in the ledger's own words, never minted from a label.
//
// A link keeps a SNAPSHOT of the target at link time (source id, source hash, exact text,
// derivation state) so the target and the excerpt are inspectable together; the snapshot is
// labelled as such and never presented as the current text. Target integrity is asserted here,
// not delegated: the contract's checkCitedSpans skips a target absent from knownSpans and checks
// a verbatim target for nothing beyond presence, so it cannot fail for the common cases. A posting
// change invalidates every link on the earlier posting together (the bundle's source id is
// src:<system>:<native id> and its text hash is the canonical posting text, and a link is judged
// against BOTH, so a different posting or the same posting with different text displaces every
// link at once), a candidate-side stale record invalidates its links, and an invalid link keeps
// its snapshot for inspection and is dropped from the contract record's targets[] (which holds
// VALID links only, because a lost-trust target there would fail validateProofRecord and refuse
// the whole fold). Nothing here mutates any text.
// ---------------------------------------------------------------------------------------------
export const LINK_STATE = Object.freeze(["VALID", "INVALID"]);
export const LINK_REFUSAL = Object.freeze({
  NO_IDENTIFIER_CLASS: "NO_IDENTIFIER_CLASS",
  NO_DECISION_RECORD: "NO_DECISION_RECORD",
  TARGET_NOT_IN_BUNDLE: "TARGET_NOT_IN_BUNDLE",
  TARGET_UNTRUSTED: "TARGET_UNTRUSTED",
  RECORD_NOT_ACTIVE: "RECORD_NOT_ACTIVE",
  DUPLICATE_LINK: "DUPLICATE_LINK",
  NO_BUNDLE: "NO_BUNDLE",
  BUNDLE_NOT_OK: "BUNDLE_NOT_OK",
  NO_RELINK_CANDIDATE: "NO_RELINK_CANDIDATE",
  AMBIGUOUS_RELINK: "AMBIGUOUS_RELINK",
});
const UNKNOWN_KIND = Object.freeze({ available: false, refusal: "NO_IDENTIFIER_CLASS", text: "this target kind is not known to the ledger", owner: "unassigned" });
export function availabilityOf(kind) { return TARGET_KIND_AVAILABILITY[kind] || UNKNOWN_KIND; }
/** Which target kinds can be linked today, and why the others cannot (one definition of the words). */
export const TARGET_KIND_AVAILABILITY = Object.freeze({
  duty: { available: true, text: "duties distilled from the posting whose parentage is verified or confirmed by you" },
  requirement: { available: true, text: "requirement lines located verbatim in the posting" },
  skill: { available: false, refusal: LINK_REFUSAL.NO_IDENTIFIER_CLASS, text: "skills have no identifier class in this system yet; a label is not an identity and none is minted from one", owner: "escalated to the Human Lead" },
  competency: { available: false, refusal: LINK_REFUSAL.NO_IDENTIFIER_CLASS, text: "competencies have no identifier class in this system yet", owner: "escalated to the Human Lead" },
  "review-observation": { available: false, refusal: LINK_REFUSAL.NO_DECISION_RECORD, text: "an accepted review observation has no decision record yet: its acceptance lives in session state and would not survive the link that cites it", owner: "BLP-013" },
});
export const LINKABLE_TARGET_KINDS = Object.freeze(PROOF_TARGET_KIND.filter((k) => availabilityOf(k).available));
export const TRUSTED_PARENTAGE = Object.freeze(["VERIFIED", "USER_CONFIRMED"]);
export const ACTIVE_STATES = Object.freeze(["CLAIMED_ONLY", "DEMONSTRATED", "CERTIFIED", "CONFLICTING"]);

export function makeLinkId(proofId, targetKind, targetId) {
  return `link:${sha256Hex(`${proofId}|${targetKind}|${targetId}`).slice(0, 24)}`;
}

/** The catalogue of targets a bundle offers, each with the facts a link snapshots; unlinkable rows carry their reason. */
export function bundleTargets(bundle) {
  if (!isObject(bundle) || !isObject(bundle.source) || !nonempty(bundle.source.id) || bundle.legacy) return { sourceId: null, sourceTextHash: null, targets: [], unlinkable: [{ reason: LINK_REFUSAL.NO_BUNDLE, text: "no canonical posting evidence is available to link to" }] };
  // A bundle that did not validate, or is in any state but OK, offers nothing: its rows are not
  // evidence the ledger can stand behind (conformance-auditor W-3), said in BLP-005's own words.
  if (bundle.state !== "OK" || (bundle.validation && bundle.validation.ok === false)) return { sourceId: null, sourceTextHash: null, targets: [], unlinkable: [{ reason: LINK_REFUSAL.BUNDLE_NOT_OK, text: `the posting evidence is ${String(bundle.state)} and offers no targets${bundle.validation && bundle.validation.ok === false ? " (its own validation failed)" : ""}` }] };
  const known = isObject(bundle.byId) ? bundle.byId : {};
  const targets = [];
  const unlinkable = [];
  for (const row of Array.isArray(bundle.dutyRows) ? bundle.dutyRows : []) {
    if (row.kind !== "distilled") { unlinkable.push({ targetKind: "duty", targetId: row.id, reason: LINK_REFUSAL.TARGET_NOT_IN_BUNDLE, text: `duty row ${row.index + 1} is withheld (${row.identity})` }); continue; }
    if (!row.trusted || !TRUSTED_PARENTAGE.includes(row.derivationState)) { unlinkable.push({ targetKind: "duty", targetId: row.id, text: row.text, reason: LINK_REFUSAL.TARGET_UNTRUSTED, detail: `parentage ${row.derivationState}; only VERIFIED or USER_CONFIRMED duties can be targeted` }); continue; }
    // The one invariant the design leans on, asserted rather than assumed (W-4): a target must be
    // a span the bundle itself knows, or the contract's citation check could never see it.
    if (!known[row.id]) { unlinkable.push({ targetKind: "duty", targetId: row.id, text: row.text, reason: LINK_REFUSAL.TARGET_NOT_IN_BUNDLE, detail: "the duty row is not among the bundle's known spans" }); continue; }
    targets.push({ targetKind: "duty", targetId: row.id, text: row.text, derivationState: row.derivationState, sourceId: bundle.source.id, sourceTextHash: bundle.source.textHash, label: `D${row.index + 1}` });
  }
  for (const row of Array.isArray(bundle.requirementRows) ? bundle.requirementRows : []) {
    if (row.kind !== "verbatim") { unlinkable.push({ targetKind: "requirement", targetId: row.id, reason: LINK_REFUSAL.TARGET_NOT_IN_BUNDLE, text: `requirement row ${row.index + 1} is withheld (${row.identity})` }); continue; }
    if (!known[row.id]) { unlinkable.push({ targetKind: "requirement", targetId: row.id, text: row.text, reason: LINK_REFUSAL.TARGET_NOT_IN_BUNDLE, detail: "the requirement row is not among the bundle's known spans" }); continue; }
    targets.push({ targetKind: "requirement", targetId: row.id, text: row.text, derivationState: row.derivationState, sourceId: bundle.source.id, sourceTextHash: bundle.source.textHash, label: `R${row.index + 1}` });
  }
  return { sourceId: bundle.source.id, sourceTextHash: bundle.source.textHash, targets, unlinkable };
}

/** A key that changes whenever the linkable catalogue changes, not only when the posting does (conformance-auditor C-1). */
export function catalogueKey(bundle) {
  const c = bundleTargets(bundle);
  return sha256Hex(JSON.stringify([c.sourceId, c.sourceTextHash, c.targets.map((t) => [t.targetKind, t.targetId, t.text, t.derivationState, t.label])]));
}

/**
 * Judge a link against the bundle the way the panel will: readable, same source, present, trusted,
 * same text. Each verdict says what is true and nothing more (Supervisor rulings C-a and C-b):
 * - no bundle, or a bundle that is not OK: the target could not be READ, so the link is not judged
 *   at all; TARGET_EVIDENCE_UNAVAILABLE, which is unknown and never valid, and is not "the posting
 *   changed" (nothing is known to have changed);
 * - the target id is gone but exactly one current row of the same kind carries the snapshot text:
 *   TARGET_REEXTRACTED, with that row offered for a re-link the HUMAN makes (a duty id folds the
 *   extraction version, so a re-distillation of unchanged text orphans every duty link by
 *   construction while the duty is still there); two or more matching rows offer nothing, because
 *   choosing between them would be inference;
 * - the target id is gone and no row carries the text: TARGET_ABSENT.
 */
export function judgeLink(link, bundle) {
  const catalogue = bundleTargets(bundle);
  if (!catalogue.sourceId) return { valid: false, reason: "TARGET_EVIDENCE_UNAVAILABLE", unavailable: catalogue.unlinkable[0].reason, text: catalogue.unlinkable[0].text };
  if (catalogue.sourceId !== link.targetSourceId || catalogue.sourceTextHash !== link.targetSourceTextHash) return { valid: false, reason: "TARGET_SOURCE_CHANGED" };
  const target = catalogue.targets.find((t) => t.targetKind === link.targetKind && t.targetId === link.targetId);
  if (!target) {
    const untrusted = catalogue.unlinkable.find((u) => u.targetId === link.targetId && u.reason === LINK_REFUSAL.TARGET_UNTRUSTED);
    if (untrusted) return { valid: false, reason: "TARGET_UNTRUSTED" };
    const sameText = catalogue.targets.filter((t) => t.targetKind === link.targetKind && t.text === link.targetText);
    if (sameText.length) return { valid: false, reason: "TARGET_REEXTRACTED", matches: sameText.length, relink: sameText.length === 1 ? { targetKind: sameText[0].targetKind, targetId: sameText[0].targetId, label: sameText[0].label } : null };
    return { valid: false, reason: "TARGET_ABSENT" };
  }
  if (target.text !== link.targetText) return { valid: false, reason: "TARGET_TEXT_CHANGED" };
  return { valid: true, reason: null, live: { label: target.label, derivationState: target.derivationState } };
}

function validLinkTargets(links) {
  return (Array.isArray(links) ? links : []).filter((l) => l.state === "VALID").map((l) => ({ targetKind: l.targetKind, targetId: l.targetId }));
}

function refuseLink(ledger, at, detail) {
  const refusal = createLedgerRefusal({ at: isIso(at) ? at : null, reason: "LINK_REFUSED", detail });
  if (!validateLedgerRefusal(refusal).ok) throw new Error("a refusal needs an ISO instant");
  return { ok: false, ledger: { ...ledger, refusals: [...(ledger.refusals || []), refusal] }, error: detail };
}

/** A human links a proof record to one target from the bundle. */
export function linkProof(ledger, proofId, { targetKind, targetId }, bundle, at) {
  if (!isIso(at)) throw new Error("linkProof needs an ISO instant");
  const record = ledger.records.find((r) => r.id === proofId);
  if (!record) return refuseLink(ledger, at, `no proof record ${String(proofId)}`);
  if (!PROOF_TARGET_KIND.includes(targetKind)) return refuseLink(ledger, at, `${String(targetKind)} is not a proof target kind`);
  const availability = availabilityOf(targetKind);
  if (!availability.available) return refuseLink(ledger, at, `${availability.refusal}: ${availability.text} (owner: ${availability.owner})`);
  if (!linksJudgeable(record)) return refuseLink(ledger, at, `${LINK_REFUSAL.RECORD_NOT_ACTIVE}: proof ${proofId} is ${record.record.state}; mark the excerpt again before linking`);
  const catalogue = bundleTargets(bundle);
  if (!catalogue.sourceId) return refuseLink(ledger, at, `${LINK_REFUSAL.NO_BUNDLE}: ${catalogue.unlinkable[0].text}`);
  const target = catalogue.targets.find((t) => t.targetKind === targetKind && t.targetId === targetId);
  if (!target) {
    const why = catalogue.unlinkable.find((u) => u.targetId === targetId);
    return refuseLink(ledger, at, why ? `${why.reason}: ${why.detail || why.text}` : `${LINK_REFUSAL.TARGET_NOT_IN_BUNDLE}: ${String(targetId)} is not a target in the current posting evidence`);
  }
  const linkId = makeLinkId(proofId, targetKind, targetId);
  const links = Array.isArray(record.links) ? record.links : [];
  if (links.some((l) => l.id === linkId)) return refuseLink(ledger, at, `${LINK_REFUSAL.DUPLICATE_LINK}: proof ${proofId} is already linked to ${targetId}`);
  const link = { ledgerVersion: LEDGER_VERSION, id: linkId, targetKind, targetId, targetLabel: target.label, targetSourceId: target.sourceId, targetSourceTextHash: target.sourceTextHash, targetText: target.text, targetDerivationState: target.derivationState, state: "VALID", reason: null, linkedAt: at, lastEventAt: at };
  const nextLinks = [...links, link];
  const nextRecord = { ...record, links: nextLinks, record: { ...record.record, targets: validLinkTargets(nextLinks) }, lastEventAt: at };
  const contractVerdict = validateProofRecord(nextRecord.record, { knownSpans: Array.isArray(bundle.knownSpans) ? bundle.knownSpans : undefined });
  if (!contractVerdict.ok) return refuseLink(ledger, at, `contract refused the target: ${contractVerdict.errors[0]}`);
  const event = createLedgerEvent({ at, proofId, linkId, kind: "LINKED", from: null, to: "VALID", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN, detail: `${targetKind} ${targetId}` });
  const { record: landed, events: more } = resumeAfterRelink(nextRecord, at);
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === proofId ? landed : r)), events: [...ledger.events, event, ...more] }, at, "linkProof");
}
/** A record stale because its demonstration's link was lost returns to CLAIMED_ONLY when the human links again (ruling Q5: never straight back to DEMONSTRATED). */
function resumeAfterRelink(record, at) {
  if (!(record.record.state === "STALE" && onlyTargetLink(record))) return { record, events: [] };
  const event = createLedgerEvent({ at, proofId: record.id, kind: "RESUMED", from: "STALE", to: "CLAIMED_ONLY", reason: "TARGET_RELINKED", actor: LEDGER_ACTOR.HUMAN, detail: "the human linked again; the earlier DEMONSTRATED declaration is not re-asserted" });
  return { record: { ...withState(leaveState(record), "CLAIMED_ONLY"), lastEventAt: at }, events: [event] };
}

/** A human removes a link; its history stays in the events. */
export function unlinkProof(ledger, proofId, linkId, at) {
  if (!isIso(at)) throw new Error("unlinkProof needs an ISO instant");
  const record = ledger.records.find((r) => r.id === proofId);
  const link = record && (record.links || []).find((l) => l.id === linkId);
  if (!record || !link) return refuseLink(ledger, at, `no link ${String(linkId)} on proof ${String(proofId)}`);
  // A human may not pull the object out from under a declaration or a conflict (ruling Q4): the
  // record's state is theirs to change first, in words, so nothing is misdescribed back to them.
  const held = declarationHolds(record, link);
  if (held) return refuseLink(ledger, at, held);
  const nextLinks = record.links.filter((l) => l.id !== linkId);
  const nextRecord = { ...record, links: nextLinks, record: { ...record.record, targets: validLinkTargets(nextLinks) }, lastEventAt: at };
  const event = createLedgerEvent({ at, proofId, linkId, kind: "UNLINKED", from: link.state, to: null, reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN, detail: `${link.targetKind} ${link.targetId}` });
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === proofId ? nextRecord : r)), events: [...ledger.events, event] }, at, "unlinkProof");
}

/**
 * A human re-links a proof whose target was re-extracted (same text, new id) to the ONE current row
 * that carries the snapshot text. One act, one commit, two events: the old link leaves (UNLINKED)
 * and the new one is linked (LINKED), each naming the other. Refused when the link is not in that
 * condition or when more than one row matches, because the app will not choose between rows.
 */
export function relinkProof(ledger, proofId, linkId, bundle, at) {
  if (!isIso(at)) throw new Error("relinkProof needs an ISO instant");
  const record = ledger.records.find((r) => r.id === proofId);
  const link = record && (record.links || []).find((l) => l.id === linkId);
  if (!record || !link) return refuseLink(ledger, at, `no link ${String(linkId)} on proof ${String(proofId)}`);
  if (!linksJudgeable(record)) return refuseLink(ledger, at, `${LINK_REFUSAL.RECORD_NOT_ACTIVE}: proof ${proofId} is ${record.record.state}; mark the excerpt again before re-linking`);
  const held = declarationHolds(record, link);
  if (held) return refuseLink(ledger, at, held);
  const verdict = judgeLink(link, bundle);
  if (verdict.reason !== "TARGET_REEXTRACTED") return refuseLink(ledger, at, `${LINK_REFUSAL.NO_RELINK_CANDIDATE}: link ${linkId} ${verdict.valid ? "stands as it is" : `is ${verdict.reason}`}; there is no re-extracted row to re-link to`);
  if (!verdict.relink) return refuseLink(ledger, at, `${LINK_REFUSAL.AMBIGUOUS_RELINK}: ${verdict.matches} current ${link.targetKind} rows carry this exact text; the app will not choose between them, so unlink and link the one you mean`);
  const target = bundleTargets(bundle).targets.find((t) => t.targetKind === verdict.relink.targetKind && t.targetId === verdict.relink.targetId);
  const newId = makeLinkId(proofId, target.targetKind, target.targetId);
  const links = record.links;
  if (links.some((l) => l.id === newId)) return refuseLink(ledger, at, `${LINK_REFUSAL.DUPLICATE_LINK}: proof ${proofId} is already linked to ${target.targetId}`);
  const newLink = { ledgerVersion: LEDGER_VERSION, id: newId, targetKind: target.targetKind, targetId: target.targetId, targetLabel: target.label, targetSourceId: target.sourceId, targetSourceTextHash: target.sourceTextHash, targetText: target.text, targetDerivationState: target.derivationState, state: "VALID", reason: null, linkedAt: at, lastEventAt: at };
  const nextLinks = [...links.filter((l) => l.id !== linkId), newLink];
  const nextRecord = { ...record, links: nextLinks, record: { ...record.record, targets: validLinkTargets(nextLinks) }, lastEventAt: at };
  const contractVerdict = validateProofRecord(nextRecord.record, { knownSpans: Array.isArray(bundle.knownSpans) ? bundle.knownSpans : undefined });
  if (!contractVerdict.ok) return refuseLink(ledger, at, `contract refused the target: ${contractVerdict.errors[0]}`);
  const gone = createLedgerEvent({ at, proofId, linkId, kind: "UNLINKED", from: link.state, to: null, reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN, detail: `${link.targetKind} ${link.targetId} re-linked to ${target.targetId}: the same text under a new id after re-extraction` });
  const born = createLedgerEvent({ at, proofId, linkId: newId, kind: "LINKED", from: null, to: "VALID", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN, detail: `${target.targetKind} ${target.targetId} re-linked from ${link.targetId}` });
  const { record: landed, events: more } = resumeAfterRelink(nextRecord, at);
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === proofId ? landed : r)), events: [...ledger.events, gone, born, ...more] }, at, "relinkProof");
}
/** The words that refuse an unlink or re-link of a link a declaration or a conflict stands on; null when nothing holds it. */
function declarationHolds(record, link) {
  const state = record.record.state;
  if (state === "DEMONSTRATED" && record.declaration && record.declaration.linkIds.includes(link.id)) return `this proof is marked demonstrated on this link; change its state first (withdraw the declaration), then unlink`;
  if (state === "CONFLICTING" && record.conflict && record.conflict.targetKind === link.targetKind && record.conflict.targetId === link.targetId) return `this proof is in a declared conflict over this link; resolve the conflict first, then unlink`;
  return null;
}

/**
 * Why a link resumes, from why it was invalid: one arm per governed invalidation reason and no
 * default, so a reason the table does not know throws instead of borrowing the likeliest story
 * (conformance-auditor W-new-1: a candidate-side resume used to say the TARGET was restored when
 * the posting never moved).
 */
const RESUME_REASON_FOR = Object.freeze({
  TARGET_SOURCE_CHANGED: "TARGET_RESTORED",
  TARGET_ABSENT: "TARGET_RESTORED",
  TARGET_REEXTRACTED: "TARGET_RESTORED",
  TARGET_UNTRUSTED: "TARGET_RESTORED",
  TARGET_TEXT_CHANGED: "TARGET_RESTORED",
  CANDIDATE_SOURCE_CHANGED: "CANDIDATE_SOURCE_RESTORED",
  TARGET_EVIDENCE_UNAVAILABLE: "TARGET_EVIDENCE_READ",
});
function resumeReasonFor(invalidReason) {
  const reason = RESUME_REASON_FOR[invalidReason];
  if (!reason) throw new Error(`no resume reason is defined for invalidation reason ${String(invalidReason)}; the table must name every governed reason`);
  return reason;
}

/** The latest instant the ledger already holds, compared as instants, not as strings (conformance-auditor W-new-4). */
const instant = (k) => (isIso(k) ? Date.parse(k) : NaN);
function ledgerLastInstant(ledger) {
  let last = null;
  const see = (k) => { if (isIso(k) && (last === null || instant(k) > instant(last))) last = k; };
  for (const e of ledger.events || []) see(e.at);
  for (const r of ledger.records || []) { see(r.recordedAt); see(r.lastEventAt); for (const l of r.links || []) { see(l.linkedAt); see(l.lastEventAt); } }
  return last;
}
/**
 * System detection is stamped no earlier than the ledger's last instant (Supervisor ruling W-a).
 * A clock that reads earlier than an event already kept would make the validator refuse the whole
 * reconcile and leave every link reading VALID from stored state, which is the over-claim the
 * reconcile exists to remove. So the stamp is clamped and the clamp is SAID in each event's detail;
 * the wall-clock reading is not hidden, it is recorded beside the stamp.
 */
function monotonicStamp(ledger, at) {
  const last = ledgerLastInstant(ledger);
  return last && instant(at) < instant(last) ? { at: last, clamped: `clock read ${at}; stamped at the ledger's last instant ${last} to keep event order` } : { at, clamped: null };
}
/** A reconcile returns a validated ledger or throws: it never hands back stored VALID links it could not re-judge (W-a). */
function commitReconcile(base, candidate, at, what) {
  const result = commit(base, candidate, at, what);
  if (!result.ok) throw new Error(`${what} produced a ledger the validator refuses (${result.error}); this is an invariant violation of the ledger, not a runtime condition, and no link state from before it may be read as current`);
  return result.ledger;
}

/**
 * Re-judge every link against the CURRENT bundle and the record's own state, by system detection.
 * A posting change invalidates every link on the earlier posting together; a stale or withheld
 * candidate record invalidates its links; a link whose target is present, trusted, on the same
 * source and with the same text resumes. Pure; called on every fold and whenever the bundle changes.
 */
export function reconcileLinks(ledger, wanted, clock) {
  if (!isIso(clock)) throw new Error("reconcileLinks needs an ISO instant");
  const base = isObject(ledger) && Array.isArray(ledger.records) ? ledger : createEmptyLedger();
  const stamp = monotonicStamp(base, clock);
  const at = stamp.at;
  const said = (text) => (stamp.clamped ? `${text}; ${stamp.clamped}` : text);
  const events = [...base.events];
  let changed = false;
  const judged = base.records.map((record) => {
    const links = Array.isArray(record.links) ? record.links : [];
    if (!links.length) return record;
    const active = linksJudgeable(record);
    const nextLinks = links.map((link) => {
      const verdict = active ? judgeLink(link, wanted) : { valid: false, reason: "CANDIDATE_SOURCE_CHANGED" };
      if (verdict.valid && link.state === "VALID") return link;
      if (!verdict.valid && link.state === "INVALID" && link.reason === verdict.reason) return link;
      changed = true;
      if (verdict.valid) {
        // The reason is the one that is true of WHY it was invalid: a displaced target that returned was
        // RESTORED; one that could not be read and now can was READ (it never left); a link that waited
        // on its own stale record resumes because the CANDIDATE text was restored, not the target.
        const reason = resumeReasonFor(link.reason);
        events.push(createLedgerEvent({ at, proofId: record.id, linkId: link.id, kind: "LINK_RESUMED", from: "INVALID", to: "VALID", reason, actor: LEDGER_ACTOR.SYSTEM, detail: said(`${link.targetKind} ${link.targetId}`) }));
        return { ...link, state: "VALID", reason: null, lastEventAt: at };
      }
      const why = verdict.reason === "TARGET_EVIDENCE_UNAVAILABLE" ? `${link.targetKind} ${link.targetId}: not judged, ${verdict.text}` : verdict.reason === "TARGET_REEXTRACTED" ? `${link.targetKind} ${link.targetId}: the same text is under ${verdict.matches === 1 ? `a new id (${verdict.relink.targetId}), re-link offered` : `${verdict.matches} new ids, none offered`}` : `${link.targetKind} ${link.targetId}`;
      events.push(createLedgerEvent({ at, proofId: record.id, linkId: link.id, kind: "LINK_INVALID", from: link.state, to: "INVALID", reason: verdict.reason, actor: LEDGER_ACTOR.SYSTEM, detail: said(why) }));
      return { ...link, state: "INVALID", reason: verdict.reason, lastEventAt: at };
    });
    if (nextLinks === links || nextLinks.every((l, i) => l === links[i])) return record;
    const relinked = { ...record, links: nextLinks, record: { ...record.record, targets: validLinkTargets(nextLinks) }, lastEventAt: at };
    // A demonstration whose declared link no longer stands lapses to STALE by system detection (ruling
    // Q4: the target side changed, and staleText("proof") is true of it); a record stale for that reason
    // returns to CLAIMED_ONLY, never to DEMONSTRATED, when a declared link stands again (ruling Q5).
    // What is ESTABLISHED about the declared links (conformance-auditor C-1): a link judged and found
    // not standing is LOST; a link the evidence could not judge is neither lost nor standing, and the
    // record keeps its declaration with judgement withheld, exactly as a fresh declaration would be
    // refused rather than allowed on unreadable evidence.
    const declared = (r) => (r.declaration ? r.declaration.linkIds.map((id) => r.links.find((l) => l.id === id)).filter(Boolean) : []);
    const standing = declared(relinked).filter((l) => l.state === "VALID");
    const lost = declared(relinked).filter(linkLost);
    if (relinked.record.state === "DEMONSTRATED" && relinked.declaration && !standing.length && lost.length) {
      events.push(createLedgerEvent({ at, proofId: record.id, kind: "STALE", from: "DEMONSTRATED", to: "STALE", reason: "TARGET_LINK_LOST", actor: LEDGER_ACTOR.SYSTEM, detail: said(`the link this demonstration stood on (${lost.map((l) => `${l.id} ${l.reason}`).join(", ")}) was judged and no longer stands against the posting evidence; the declaration lapses and is not re-asserted on resumption`) }));
      return { ...withState(relinked, "STALE"), staleCauses: [STALE_CAUSE.TARGET_LINK] };
    }
    // Only a record stale for its LINK alone is judgeable here (linksJudgeable), so `standing` can be
    // non-empty only on that record: one stale for its text as well has every link waiting on the text
    // (CANDIDATE_SOURCE_CHANGED), and the text's restoration is the act that resumes it, clearing every
    // cause together. No arm is written for a case this function cannot meet.
    if (relinked.record.state === "STALE" && onlyTargetLink(relinked) && standing.length) {
      events.push(createLedgerEvent({ at, proofId: record.id, kind: "RESUMED", from: "STALE", to: "CLAIMED_ONLY", reason: "TARGET_RESTORED", actor: LEDGER_ACTOR.SYSTEM, detail: said(`the link ${standing.map((l) => l.id).join(", ")} stands again; the record resumes as CLAIMED_ONLY and the earlier DEMONSTRATED declaration is not re-asserted`) }));
      return withState(leaveState(relinked), "CLAIMED_ONLY");
    }
    return relinked;
  });
  // A conflict whose shared target no longer stands on either side has lost its object (ruling Q3):
  // both sides are dissolved by the system, never left one-sided.
  const before = events.length;
  const records = settleConflicts(judged, events, at, said);
  if (events.length > before) changed = true;
  if (!changed) return base;
  return commitReconcile(base, { ...base, records, events }, at, "reconcileLinks");
}
/**
 * Every CONFLICTING record must face a counterpart that is CONFLICTING back over the same target
 * with a VALID link to it on both sides. Where that no longer holds, the conflict is DISSOLVED by
 * the system: CONFLICTING -> STALE (the conflict was recorded against evidence that has since
 * changed: its counterpart or its object) -> CLAIMED_ONLY (RESUMED, CONFLICT_DISSOLVED), two events
 * in one act, because the contract admits no direct edge from CONFLICTING to CLAIMED_ONLY and the
 * excerpt itself still stands. Pure over the records it is given; appends to `events`.
 */
function settleConflicts(records, events, at, said = (t) => t) {
  const byId = new Map(records.map((r) => [r.id, r]));
  const dissolved = new Set();
  const out = new Map(records.map((r) => [r.id, r]));
  for (const r of records) {
    if (r.record.state !== "CONFLICTING" || !r.conflict || dissolved.has(r.id)) continue;
    const other = byId.get(r.conflict.counterpartId);
    // A side whose link to the target could not be judged has not LOST it; only a judged loss dissolves.
    const linkStands = (x) => (x.links || []).some((l) => linkStandsOrUnjudged(l) && l.targetKind === r.conflict.targetKind && l.targetId === r.conflict.targetId);
    const mutual = other && other.record.state === "CONFLICTING" && other.conflict && other.conflict.counterpartId === r.id && other.conflict.targetKind === r.conflict.targetKind && other.conflict.targetId === r.conflict.targetId;
    const reason = !mutual ? "CONFLICT_COUNTERPART_LOST" : (!linkStands(r) || !linkStands(other)) ? "CONFLICT_TARGET_LOST" : null;
    if (!reason) continue;
    for (const side of [r, mutual ? other : null].filter(Boolean)) {
      if (dissolved.has(side.id)) continue;
      dissolved.add(side.id);
      const why = reason === "CONFLICT_TARGET_LOST" ? `the shared target ${r.conflict.targetKind} ${r.conflict.targetId} no longer stands on ${!linkStands(r) && (!other || !linkStands(other)) ? "either side" : !linkStands(r) ? `proof ${r.id}` : `proof ${other.id}`}` : `the counterpart ${r.conflict.counterpartId} is no longer in the conflict (${other ? other.record.state : "absent"})`;
      events.push(createLedgerEvent({ at, proofId: side.id, kind: "STALE", from: "CONFLICTING", to: "STALE", reason, actor: LEDGER_ACTOR.SYSTEM, detail: said(`the conflict has lost its object: ${why}`) }));
      events.push(createLedgerEvent({ at, proofId: side.id, kind: "RESUMED", from: "STALE", to: "CLAIMED_ONLY", reason: "CONFLICT_DISSOLVED", actor: LEDGER_ACTOR.SYSTEM, detail: said("the conflict is dissolved by the system; the record resumes as CLAIMED_ONLY and neither side's earlier declaration is re-asserted") }));
      out.set(side.id, { ...withState(leaveState(side), "CLAIMED_ONLY"), lastEventAt: at });
    }
  }
  return records.map((r) => out.get(r.id));
}
export const LEDGER_ACTOR = Object.freeze({ SYSTEM: "system", HUMAN: LOCAL_HUMAN_ACTOR.id });

function isObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function isIso(value) { return typeof value === "string" && /T/.test(value) && !Number.isNaN(Date.parse(value)); }
function nonempty(value) { return typeof value === "string" && value.trim().length > 0; }

// ---------------------------------------------------------------------------------------------
// Events: the one audit shape, defined here and validated here.
// ---------------------------------------------------------------------------------------------
export function createLedgerEvent({ at, proofId, linkId, kind, from, to, reason, actor, detail, seq } = {}) {
  return {
    ledgerVersion: LEDGER_VERSION,
    seq: Number.isInteger(seq) ? seq : null,
    at: isIso(at) ? at : null,
    proofId: nonempty(proofId) ? proofId : null,
    linkId: nonempty(linkId) ? linkId : null,
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
  if (!["LINKED", "UNLINKED", "LINK_INVALID", "LINK_RESUMED"].includes(event.kind) && event.linkId !== null) errors.push(`${event.kind} is not a link event and must carry no linkId`);
  if (event.seq !== null && !(Number.isInteger(event.seq) && event.seq >= 0)) errors.push("LedgerEvent.seq must be null before commit or a non-negative integer after it");
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
      if (event.kind === "WITHHELD" && event.actor !== LEDGER_ACTOR.HUMAN) errors.push("WITHHELD follows a human act (apply, remove, clear, withdraw) and must name the human actor");
      if (event.kind === "RESUMED") {
        // A resume follows the human's act (re-confirm, withdraw, re-link) except where the SYSTEM
        // detected the return of a target or the dissolution of a conflict; each reason names its actor.
        const systemResume = ["TARGET_RESTORED", "CONFLICT_DISSOLVED"].includes(event.reason);
        if (systemResume ? event.actor !== LEDGER_ACTOR.SYSTEM : event.actor !== LEDGER_ACTOR.HUMAN) errors.push(`a RESUMED event with reason ${event.reason} must name the ${systemResume ? "system" : "human actor"}`);
      }
      break;
    }
    case "STATE_SET":
      if (event.from !== "CLAIMED_ONLY") errors.push("STATE_SET declares from CLAIMED_ONLY only (a stale record resumes to CLAIMED_ONLY first)");
      if (!ACCEPTED_STATES.includes(event.to)) errors.push("STATE_SET must enter DEMONSTRATED or CERTIFIED");
      if (PROOF_STATE.includes(event.from) && PROOF_STATE.includes(event.to) && !isProofTransitionPermitted(event.from, event.to)) errors.push(`transition ${event.from} -> ${event.to} is not permitted by the contract`);
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("STATE_SET is the human's declaration");
      break;
    case "CONFLICT_DECLARED":
      if (!ACCEPTED_STATES.includes(event.from)) errors.push("CONFLICT_DECLARED leaves DEMONSTRATED or CERTIFIED (the contract admits no other edge into CONFLICTING)");
      if (event.to !== "CONFLICTING") errors.push("CONFLICT_DECLARED must enter CONFLICTING");
      if (PROOF_STATE.includes(event.from) && !isProofTransitionPermitted(event.from, "CONFLICTING")) errors.push(`transition ${event.from} -> CONFLICTING is not permitted by the contract`);
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("a conflict is declared by the human; the system infers no contradiction");
      break;
    case "CONFLICT_RESOLVED":
      if (event.from !== "CONFLICTING") errors.push("CONFLICT_RESOLVED leaves CONFLICTING");
      if (!CONFLICT_RESOLUTION.includes(event.to)) errors.push("CONFLICT_RESOLVED must enter DEMONSTRATED, CERTIFIED or WITHHELD");
      if (CONFLICT_RESOLUTION.includes(event.to) && !isProofTransitionPermitted("CONFLICTING", event.to)) errors.push(`transition CONFLICTING -> ${event.to} is not permitted by the contract`);
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("a conflict is resolved by the human");
      break;
    case "STALE_CAUSE":
      // A cause joins or leaves a STALE record without a state change; the state stays STALE.
      if (event.from !== null || event.to !== null) errors.push("STALE_CAUSE changes no state and must carry none");
      if (event.actor !== LEDGER_ACTOR.SYSTEM) errors.push("a stale cause is detected by the system");
      break;
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
    case "LINKED":
      if (!nonempty(event.linkId) || !event.linkId.startsWith("link:")) errors.push("LINKED must name its link");
      if (event.from !== null || event.to !== "VALID") errors.push("LINKED enters VALID from nothing");
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("LINKED is a human choice");
      break;
    case "UNLINKED":
      if (!nonempty(event.linkId) || !event.linkId.startsWith("link:")) errors.push("UNLINKED must name its link");
      if (!LINK_STATE.includes(event.from) || event.to !== null) errors.push("UNLINKED leaves a link state and enters nothing");
      if (event.actor !== LEDGER_ACTOR.HUMAN) errors.push("UNLINKED is a human choice");
      break;
    case "LINK_INVALID":
      if (!nonempty(event.linkId) || !event.linkId.startsWith("link:")) errors.push("LINK_INVALID must name its link");
      if (!LINK_STATE.includes(event.from) || event.to !== "INVALID") errors.push("LINK_INVALID must enter INVALID from a link state");
      if (event.actor !== LEDGER_ACTOR.SYSTEM) errors.push("link invalidation is detected by the system, not decided by a human");
      break;
    case "LINK_RESUMED":
      if (!nonempty(event.linkId) || !event.linkId.startsWith("link:")) errors.push("LINK_RESUMED must name its link");
      if (event.from !== "INVALID" || event.to !== "VALID") errors.push("LINK_RESUMED must enter VALID from INVALID");
      if (event.actor !== LEDGER_ACTOR.SYSTEM) errors.push("link resumption is detected by the system");
      break;
    default:
      errors.push(`no validation case for event kind ${String(event.kind)}; every governed kind must be validated`);
      break;
  }
  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------------------------
export function createEmptyLedger() {
  return { ledgerVersion: LEDGER_VERSION, contractVersion: CONTRACT_VERSION, records: [], events: [], refusals: [], faults: [] };
}

// ---------------------------------------------------------------------------------------------
// Faults (Supervisor finding on BLP-009 at ff4c7c0). A reconcile that cannot produce a valid ledger
// THROWS (W-a: it never hands back stored VALID links as current). The boundary that catches it
// must not run a side effect inside a React updater (the BLP-008 lesson: a discarded render pass
// can commit, or clear, words about a ledger that was never kept), so the catch is a PURE value:
// the fault is recorded ON the previous ledger, governed by validateLedger, and the panel derives
// its withheld sentence from the faults the kept ledger carries. A later step that succeeds
// resolves the open faults with its instant; the record of the fault stays.
// ---------------------------------------------------------------------------------------------
export function createLedgerFault({ at, detail } = {}) {
  return { ledgerVersion: LEDGER_VERSION, at: isIso(at) ? at : null, detail: nonempty(detail) ? detail : null, actor: LEDGER_ACTOR.SYSTEM, resolvedAt: null };
}
export function validateLedgerFault(fault) {
  const errors = [];
  if (!isObject(fault)) return { ok: false, errors: ["LedgerFault must be an object"] };
  if (fault.ledgerVersion !== LEDGER_VERSION) errors.push(`LedgerFault.ledgerVersion must be ${LEDGER_VERSION}`);
  if (!isIso(fault.at)) errors.push("LedgerFault.at must be an ISO 8601 instant");
  if (!nonempty(fault.detail)) errors.push("LedgerFault.detail must say what the ledger could not do");
  if (fault.actor !== LEDGER_ACTOR.SYSTEM) errors.push("a fault is the system's, never a human's");
  if (fault.resolvedAt !== null && (!isIso(fault.resolvedAt) || instant(fault.resolvedAt) < instant(fault.at))) errors.push("LedgerFault.resolvedAt must be null or an instant no earlier than at");
  return { ok: errors.length === 0, errors };
}
/** The fault the kept ledger is under, or null; the panel's withheld sentence comes from this and nothing else. */
export function activeLedgerFault(ledger) {
  return (Array.isArray(ledger?.faults) ? ledger.faults : []).find((f) => f.resolvedAt === null) || null;
}
export function ledgerFaultText(ledger) {
  const fault = activeLedgerFault(ledger);
  return fault ? `The ledger could not be re-checked at ${fault.at} and its link state is withheld: ${fault.detail}. Nothing here is shown as current until a later fold or reconcile validates; the records and their history stay readable.` : null;
}
/**
 * Run one ledger step at a boundary. Pure: returns the step's ledger with any open faults resolved
 * at `at`, or, if the step throws, the PREVIOUS ledger with the fault recorded on it. No side effect,
 * so a React updater may call it and a discarded pass produces nothing that outlives it.
 */
export function guardLedgerStep(ledger, step, at, { rejudged = false } = {}) {
  if (!isIso(at)) throw new Error("guardLedgerStep needs an ISO instant");
  const base = isObject(ledger) && Array.isArray(ledger.records) ? { faults: [], ...ledger } : createEmptyLedger();
  try {
    const next = step(base);
    // An open fault says nothing here is current until a later fold or reconcile validates; only a step
    // that RE-JUDGED the links (a fold, a reconcile) may resolve it. A claim edit or a proof-type choice
    // that succeeds leaves it open (conformance-auditor W-NEW-1: clearing on any success made the
    // withheld sentence false).
    const kept = Array.isArray(next.faults) ? next.faults : [];
    const faults = rejudged ? kept.map((f) => (f.resolvedAt === null ? { ...f, resolvedAt: at } : f)) : kept;
    return { ...next, faults };
  } catch (error) {
    const fault = createLedgerFault({ at, detail: error && error.message ? error.message : String(error) });
    if (!validateLedgerFault(fault).ok) throw new Error("a fault needs an ISO instant and a message");
    return { ...base, faults: [...base.faults, fault] };
  }
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
  // Every committed event carries its position as a sequence number, so two events stamped at one
  // instant (a withdrawal, a dissolution) keep their order through any sort or export
  // (conformance-auditor W-2); the validator requires seq to equal the position.
  const sequenced = { ...candidate, events: candidate.events.map((e, i) => (e.seq === i ? e : { ...e, seq: i })) };
  const verdict = validateLedger(sequenced);
  if (verdict.ok) return { ok: true, ledger: sequenced };
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
    links: [],
    staleCauses: [],
    withheldCause: null,
    declaration: null,
    conflict: null,
    recordedAt: at,
    lastEventAt: at,
  };
}
/** Leaving any state clears what that state carried; each act sets what it needs afterwards. */
function leaveState(record) { return { ...record, staleCauses: [], withheldCause: null, declaration: null, conflict: null }; }

/**
 * Fold a newly applied (or cleared) person-evidence payload into the ledger. Pure: returns a new
 * ledger; `previousLedger` is not mutated; `at` is the caller's clock.
 */
export function applyEvidenceToLedger(previousLedger, payload, at, { bundle } = {}) {
  const base = isObject(previousLedger) && Array.isArray(previousLedger.records) ? { refusals: [], faults: [], ...previousLedger } : createEmptyLedger();
  if (!isIso(at)) throw new Error("applyEvidenceToLedger needs an ISO instant");
  // A payload that is not manual person evidence, or whose proof views disagree with their own
  // source, is REFUSED: the ledger is returned unchanged with a refusal on the record, attributed
  // to the system. Only an explicit null (the human cleared the evidence) withholds records.
  // Every refusal exit re-judges the links it holds against the bundle it was given (conformance-
  // auditor W-new-6): a refusal changes no record, but it must not leave a stored VALID link and its
  // contract target standing against posting evidence that has moved on.
  const refused = (ledger) => (bundle === undefined ? ledger : reconcileLinks(ledger, bundle, at));
  if (payload !== null && payload !== undefined) {
    if (!isManualPersonEvidence(payload)) return refused({ ...base, refusals: [...base.refusals, createLedgerRefusal({ at, reason: "PAYLOAD_REFUSED", detail: "the payload is not manual person evidence; nothing was folded and no record changed" })] });
    for (const proof of payload.proofs) {
      const verdict = validatePayloadProof(payload, proof);
      if (!verdict.ok) return refused({ ...base, refusals: [...base.refusals, createLedgerRefusal({ at, reason: "PAYLOAD_REFUSED", detail: verdict.errors[0] })] });
    }
  }
  const events = [...base.events];
  const byId = new Map(base.records.map((r) => [r.id, r]));
  const evidence = payload ? payload : null;
  const incoming = new Map(evidence ? evidence.proofs.map((p) => [p.id, p]) : []);
  const next = new Map();
  const refuse = (detail) => refused({ ...base, refusals: [...base.refusals, createLedgerRefusal({ at, reason: "TRANSITION_REFUSED", detail })] });
  const push = (event) => { const verdict = validateLedgerEvent(event); if (!verdict.ok) throw new Error(`invalid ledger event: ${verdict.errors[0]}`); events.push(event); };

  // Existing records not offered by the new payload.
  for (const record of byId.values()) {
    const current = record.record.state;
    if (incoming.has(record.id)) { next.set(record.id, record); continue; }
    // A record stale for its LINK alone still has its excerpt in play, so it follows the candidate
    // text like an active record (conformance-auditor C-3): cleared or removed it is WITHHELD, and a
    // changed text adds CANDIDATE_TEXT to its causes without a state change (the contract admits no
    // STALE -> STALE edge), so it can no longer resume on the target's return alone.
    const linkStaleOnly = current === "STALE" && onlyTargetLink(record);
    if (!["CLAIMED_ONLY", "DEMONSTRATED", "CERTIFIED", "CONFLICTING"].includes(current) && !linkStaleOnly) { next.set(record.id, record); continue; }
    if (!evidence) {
      if (!isProofTransitionPermitted(current, "WITHHELD")) return refuse(`${record.id}: ${current} -> WITHHELD is not permitted by the contract`);
      push(createLedgerEvent({ at, proofId: record.id, kind: "WITHHELD", from: current, to: "WITHHELD", reason: "EVIDENCE_CLEARED", actor: LEDGER_ACTOR.HUMAN }));
      next.set(record.id, { ...withState(leaveState(record), "WITHHELD"), withheldCause: WITHHELD_CAUSE.EVIDENCE_CLEARED, lastEventAt: at });
    } else if (evidence.sourceId === record.sourceId) {
      // Same text, this excerpt no longer offered: a human removed it.
      if (!isProofTransitionPermitted(current, "WITHHELD")) return refuse(`${record.id}: ${current} -> WITHHELD is not permitted by the contract`);
      push(createLedgerEvent({ at, proofId: record.id, kind: "WITHHELD", from: current, to: "WITHHELD", reason: "EXCERPT_REMOVED", actor: LEDGER_ACTOR.HUMAN }));
      next.set(record.id, { ...withState(leaveState(record), "WITHHELD"), withheldCause: WITHHELD_CAUSE.EXCERPT_REMOVED, lastEventAt: at });
    } else if (linkStaleOnly) {
      push(createLedgerEvent({ at, proofId: record.id, kind: "STALE_CAUSE", from: null, to: null, reason: "SOURCE_TEXT_CHANGED", actor: LEDGER_ACTOR.SYSTEM, detail: `source ${record.sourceId} replaced by ${evidence.sourceId}; CANDIDATE_TEXT joins TARGET_LINK as a cause, so the target's return alone no longer resumes this record` }));
      next.set(record.id, { ...record, staleCauses: [...record.staleCauses, STALE_CAUSE.CANDIDATE_TEXT], lastEventAt: at });
    } else {
      // Different text: the source this record was cut from is gone. Every active record on the
      // old source goes stale together; the system detects it, nobody decides it.
      if (!isProofTransitionPermitted(current, "STALE")) return refuse(`${record.id}: ${current} -> STALE is not permitted by the contract`);
      push(createLedgerEvent({ at, proofId: record.id, kind: "STALE", from: current, to: "STALE", reason: "SOURCE_TEXT_CHANGED", actor: LEDGER_ACTOR.SYSTEM, detail: `source ${record.sourceId} replaced by ${evidence.sourceId}${ACCEPTED_STATES.includes(current) ? `; the ${current} declaration lapses and is not re-asserted on resumption` : ""}` }));
      next.set(record.id, { ...withState(leaveState(record), "STALE"), staleCauses: [STALE_CAUSE.CANDIDATE_TEXT], lastEventAt: at });
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
    if (current === "WITHHELD" && existing.withheldCause === WITHHELD_CAUSE.CONFLICT_RESOLVED) {
      // Withheld by the human at a conflict's resolution: the excerpt is still marked, so an apply of
      // the same evidence is NOT the act that offers it again (conformance-auditor W-1); only the
      // human's explicit offer (offerAgain) resumes it.
      push(createLedgerEvent({ at, proofId: proof.id, kind: "RECONFIRMED", from: null, to: null, reason: "EXCERPT_RECONFIRMED", actor: LEDGER_ACTOR.HUMAN, detail: `${changed.join("; ") || "confirmed again"}; stays WITHHELD (withheld at a conflict's resolution) until offered again by the human` }));
      next.set(proof.id, refreshed);
    } else if (current === "STALE" && onlyTargetLink(existing)) {
      // Stale for TARGET reasons, not text: the excerpt is re-confirmed, the record stays where the
      // link loss put it; only the target's return or a re-link resumes it (ruling Q4).
      push(createLedgerEvent({ at, proofId: proof.id, kind: "RECONFIRMED", from: null, to: null, reason: "EXCERPT_RECONFIRMED", actor: LEDGER_ACTOR.HUMAN, detail: changed.join("; ") || undefined }));
      next.set(proof.id, refreshed);
    } else if (current === "STALE" || current === "WITHHELD") {
      // Same source, span and proof ids: the same record resumes. Never a duplicate. The reason is
      // the one that is true: the text was displaced and restored (STALE), or the human offered the
      // excerpt again after removing or clearing it (WITHHELD) (conformance-auditor W-4).
      if (!isProofTransitionPermitted(current, "CLAIMED_ONLY")) return refuse(`${proof.id}: ${current} -> CLAIMED_ONLY is not permitted by the contract`);
      push(createLedgerEvent({ at, proofId: proof.id, kind: "RESUMED", from: current, to: "CLAIMED_ONLY", reason: current === "STALE" ? "SOURCE_TEXT_RESTORED" : "EXCERPT_CONFIRMED", actor: LEDGER_ACTOR.HUMAN, detail: changed.join("; ") || undefined }));
      next.set(proof.id, withState(leaveState(refreshed), "CLAIMED_ONLY"));
    } else {
      push(createLedgerEvent({ at, proofId: proof.id, kind: "RECONFIRMED", from: null, to: null, reason: "EXCERPT_RECONFIRMED", actor: LEDGER_ACTOR.HUMAN, detail: changed.join("; ") || undefined }));
      next.set(proof.id, refreshed);
    }
  }
  // A conflict whose counterpart just went stale or withheld has lost its object on that side; both
  // sides are settled by the system before the fold is committed (ruling Q3: never a one-sided conflict).
  const settled = settleConflicts([...next.values()], events, at);
  const candidate = { ...base, ledgerVersion: LEDGER_VERSION, contractVersion: CONTRACT_VERSION, records: sortRecords(settled), events };
  const folded = commit(base, candidate, at, "applyEvidenceToLedger");
  if (!folded.ok) return refused(folded.ledger);
  // Links are re-judged after every fold: a record that went stale takes its links with it, and a
  // resumed record's links resume only if their targets still stand (bundle undefined: no bundle
  // is known here; links on active records are judged against "no bundle" only when one is passed).
  return bundle === undefined ? reconcileLinksAgainstRecords(folded.ledger, at) : reconcileLinks(folded.ledger, bundle, at);
}

/** Without a bundle, only the candidate side can be judged: links on inactive records are invalidated. */
function reconcileLinksAgainstRecords(ledger, at) {
  // No clamp here: this path runs only after a fold whose guard already accepted `at` as no earlier
  // than every instant in the ledger, so a clamp would be dead code claiming a case it cannot meet.
  const events = [...ledger.events];
  let changed = false;
  const records = ledger.records.map((record) => {
    const links = Array.isArray(record.links) ? record.links : [];
    if (!links.length || linksJudgeable(record)) return record;
    const nextLinks = links.map((link) => {
      if (link.state === "INVALID" && link.reason === "CANDIDATE_SOURCE_CHANGED") return link;
      changed = true;
      events.push(createLedgerEvent({ at, proofId: record.id, linkId: link.id, kind: "LINK_INVALID", from: link.state, to: "INVALID", reason: "CANDIDATE_SOURCE_CHANGED", actor: LEDGER_ACTOR.SYSTEM, detail: `${link.targetKind} ${link.targetId}` }));
      return { ...link, state: "INVALID", reason: "CANDIDATE_SOURCE_CHANGED", lastEventAt: at };
    });
    // A record that gained no event is returned untouched, or its lastEventAt would drift from its
    // history and the commit guard would refuse the whole batch (conformance-auditor C-2).
    if (nextLinks.every((l, i) => l === links[i])) return record;
    return { ...record, links: nextLinks, record: { ...record.record, targets: validLinkTargets(nextLinks) }, lastEventAt: at };
  });
  if (!changed) return ledger;
  return commitReconcile(ledger, { ...ledger, records, events }, at, "reconcileLinksAgainstRecords");
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
// Human acts on proof state (BLP-010). Each is refused in words when its gate does not hold; a
// refusal is recorded (STATE_REFUSED) and changes no record.
// ---------------------------------------------------------------------------------------------
function refuseState(ledger, at, detail) {
  const refusal = createLedgerRefusal({ at: isIso(at) ? at : null, reason: "STATE_REFUSED", detail });
  if (!validateLedgerRefusal(refusal).ok) throw new Error("a refusal needs an ISO instant");
  return { ok: false, ledger: { ...ledger, refusals: [...(ledger.refusals || []), refusal] }, error: detail };
}
/**
 * The gate an accepted state must pass, stated once (ruling Q2). Returns { ok, error, linkIds }:
 * contract-given (USER-CONFIRMED confirmation), structural (no unstructured whole-text record;
 * DEMONSTRATED needs a link STANDING UNDER A LIVE JUDGEMENT, so with no bundle it is refused in
 * words rather than allowed on stored state).
 */
function acceptedStateGate(record, state, bundle) {
  if (!ACCEPTED_STATES.includes(state)) return { ok: false, error: `${String(state)} is not a state the human declares; the human declares DEMONSTRATED or CERTIFIED` };
  if (record.record.confirmation !== "USER-CONFIRMED") return { ok: false, error: `${state} requires a USER-CONFIRMED confirmation (contract); this record has none` };
  if (record.unstructured) return { ok: false, error: `${state} cannot be declared on the whole pasted text with no exact excerpt marked; mark an excerpt first` };
  if (state === "CERTIFIED") return { ok: true, linkIds: [] };
  if (bundle === undefined) return { ok: false, error: "DEMONSTRATED needs a link that stands under a live judgement, and no posting evidence was given to judge against; declaration refused rather than allowed on stored link state" };
  const standing = linkStanding(record, bundle);
  if (standing.unreadable) return { ok: false, error: `DEMONSTRATED needs a link that stands, and the posting evidence could not be read (${standing.unreadable}); declaration refused` };
  if (!standing.standing.length) return { ok: false, error: `DEMONSTRATED needs at least one link that stands against the current posting evidence; this record has ${standing.recordedValid ? `${standing.recordedValid} recorded VALID but none standing` : "no link"}` };
  const linkIds = (record.links || []).filter((l) => l.state === "VALID" && standing.standing.some((t) => t.targetKind === l.targetKind && t.targetId === l.targetId)).map((l) => l.id);
  return { ok: true, linkIds };
}
/** The human declares a CLAIMED_ONLY record DEMONSTRATED or CERTIFIED. A proof-type mismatch is said, never refused. */
export function declareProofState(ledger, proofId, state, at, { bundle } = {}) {
  if (!isIso(at)) throw new Error("declareProofState needs an ISO instant");
  const record = ledger.records.find((r) => r.id === proofId);
  if (!record) return refuseState(ledger, at, `no proof record ${String(proofId)}`);
  const current = record.record.state;
  if (current !== "CLAIMED_ONLY") return refuseState(ledger, at, current === "STALE" ? `proof ${proofId} is STALE; it resumes to CLAIMED_ONLY first (${onlyTargetLink(record) ? "link again or wait for the target to return" : "restore or re-mark the text"}), then declare again; the product declines the contract's STALE -> ${String(state)} edge because the excerpt was re-confirmed, the ${String(state)} was not re-asserted` : `proof ${proofId} is ${current}; only a CLAIMED_ONLY record is declared${ACCEPTED_STATES.includes(current) ? " (withdraw the current declaration first)" : current === "CONFLICTING" ? " (resolve the conflict first)" : ""}`);
  const gate = acceptedStateGate(record, state, bundle);
  if (!gate.ok) return refuseState(ledger, at, gate.error);
  if (!isProofTransitionPermitted(current, state)) return refuseState(ledger, at, `${current} -> ${state} is not permitted by the contract`);
  const next = { ...withState(leaveState(record), state), declaration: { state, linkIds: gate.linkIds, at }, lastEventAt: at };
  const verdict = validateProofRecord(next.record);
  if (!verdict.ok) return refuseState(ledger, at, `contract refused the state: ${verdict.errors[0]}`);
  const note = proofTypeStateNote(next);
  const event = createLedgerEvent({ at, proofId, kind: "STATE_SET", from: current, to: state, reason: "HUMAN_DECLARATION", actor: LEDGER_ACTOR.HUMAN, detail: `${state === "DEMONSTRATED" ? `on ${gate.linkIds.length === 1 ? "link" : "links"} ${gate.linkIds.join(", ")}, standing against the posting evidence at declaration` : "a qualification or credential, no link required"}${note ? `; ${note}` : ""}` });
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === proofId ? next : r)), events: [...ledger.events, event] }, at, "declareProofState");
}
/**
 * The human withdraws a declaration: DEMONSTRATED or CERTIFIED -> WITHHELD -> CLAIMED_ONLY in one
 * act, two events, because the contract admits no direct edge back and the excerpt still stands.
 * Links are untouched.
 */
export function withdrawProofState(ledger, proofId, at) {
  if (!isIso(at)) throw new Error("withdrawProofState needs an ISO instant");
  const record = ledger.records.find((r) => r.id === proofId);
  if (!record) return refuseState(ledger, at, `no proof record ${String(proofId)}`);
  const current = record.record.state;
  if (!ACCEPTED_STATES.includes(current)) return refuseState(ledger, at, `proof ${proofId} is ${current}; there is no declaration to withdraw${current === "CONFLICTING" ? " (resolve the conflict instead)" : ""}`);
  const gone = createLedgerEvent({ at, proofId, kind: "WITHHELD", from: current, to: "WITHHELD", reason: "STATE_WITHDRAWN", actor: LEDGER_ACTOR.HUMAN, detail: `the ${current} declaration is withdrawn by the human; via WITHHELD because the contract admits no direct edge back to CLAIMED_ONLY` });
  const back = createLedgerEvent({ at, proofId, kind: "RESUMED", from: "WITHHELD", to: "CLAIMED_ONLY", reason: "STATE_WITHDRAWN", actor: LEDGER_ACTOR.HUMAN, detail: "the excerpt still stands as confirmed evidence; links untouched" });
  const next = { ...withState(leaveState(record), "CLAIMED_ONLY"), lastEventAt: at };
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === proofId ? next : r)), events: [...ledger.events, gone, back] }, at, "withdrawProofState");
}
/** The human offers again an excerpt withheld at a conflict's resolution (the only withheld cause an apply does not clear). */
export function offerAgain(ledger, proofId, at, { bundle } = {}) {
  if (!isIso(at)) throw new Error("offerAgain needs an ISO instant");
  const record = ledger.records.find((r) => r.id === proofId);
  if (!record) return refuseState(ledger, at, `no proof record ${String(proofId)}`);
  if (record.record.state !== "WITHHELD") return refuseState(ledger, at, `proof ${proofId} is ${record.record.state}; only a withheld record is offered again`);
  if (record.withheldCause !== WITHHELD_CAUSE.CONFLICT_RESOLVED) return refuseState(ledger, at, `proof ${proofId} was withheld by ${record.withheldCause === WITHHELD_CAUSE.EVIDENCE_CLEARED ? "clearing the evidence" : "removing the excerpt"}; mark and apply the excerpt again to resume it`);
  const event = createLedgerEvent({ at, proofId, kind: "RESUMED", from: "WITHHELD", to: "CLAIMED_ONLY", reason: "OFFERED_AGAIN", actor: LEDGER_ACTOR.HUMAN, detail: "offered again by the human after being withheld at a conflict's resolution; CLAIMED_ONLY, no declaration re-asserted" });
  const next = { ...withState(leaveState(record), "CLAIMED_ONLY"), lastEventAt: at };
  const result = commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === proofId ? next : r)), events: [...ledger.events, event] }, at, "offerAgain");
  // A resumed record's links are re-judged as after a fold: they resume only if their targets still stand.
  return result.ok && bundle !== undefined ? { ...result, ledger: reconcileLinks(result.ledger, bundle, at) } : result;
}
/** The pairs the human could declare in conflict: another accepted record sharing a target that stands on both sides under a live judgement. */
export function conflictCandidates(ledger, proofId, bundle) {
  const record = ledger.records.find((r) => r.id === proofId);
  if (!record || !ACCEPTED_STATES.includes(record.record.state) || bundle === undefined) return [];
  const mine = linkStanding(record, bundle).standing;
  const out = [];
  for (const other of ledger.records) {
    if (other.id === proofId || !ACCEPTED_STATES.includes(other.record.state)) continue;
    const theirs = linkStanding(other, bundle).standing;
    for (const t of mine) if (theirs.some((u) => u.targetKind === t.targetKind && u.targetId === t.targetId)) out.push({ counterpartId: other.id, targetKind: t.targetKind, targetId: t.targetId });
  }
  return out;
}
/**
 * The human declares two ACCEPTED records in conflict over one shared target. Symmetric by
 * construction and by validation: both records enter CONFLICTING naming each other and the target.
 * The system infers no contradiction; no model reads meaning (ruling Q3).
 */
export function declareConflict(ledger, proofId, counterpartId, { targetKind, targetId }, at, { bundle } = {}) {
  if (!isIso(at)) throw new Error("declareConflict needs an ISO instant");
  const a = ledger.records.find((r) => r.id === proofId), b = ledger.records.find((r) => r.id === counterpartId);
  if (!a || !b) return refuseState(ledger, at, `no proof record ${!a ? String(proofId) : String(counterpartId)}`);
  if (proofId === counterpartId) return refuseState(ledger, at, "a record cannot conflict with itself");
  for (const r of [a, b]) if (!ACCEPTED_STATES.includes(r.record.state)) return refuseState(ledger, at, `proof ${r.id} is ${r.record.state}; a conflict is declared between two DEMONSTRATED or CERTIFIED records (the contract admits no other edge into CONFLICTING)`);
  if (bundle === undefined) return refuseState(ledger, at, "a conflict is declared over a target that stands on both sides under a live judgement, and no posting evidence was given to judge against; refused");
  const shared = conflictCandidates(ledger, proofId, bundle).some((c) => c.counterpartId === counterpartId && c.targetKind === targetKind && c.targetId === targetId);
  if (!shared) return refuseState(ledger, at, `${String(targetKind)} ${String(targetId)} does not stand against the current posting evidence on both proof ${proofId} and proof ${counterpartId}; a conflict needs one shared standing target`);
  const conflictWith = (other) => ({ counterpartId: other.id, targetKind, targetId, declaredAt: at });
  const nextA = { ...withState(leaveState(a), "CONFLICTING"), conflict: conflictWith(b), lastEventAt: at };
  const nextB = { ...withState(leaveState(b), "CONFLICTING"), conflict: conflictWith(a), lastEventAt: at };
  const ev = (self, other) => createLedgerEvent({ at, proofId: self.id, kind: "CONFLICT_DECLARED", from: self.record.state, to: "CONFLICTING", reason: "HUMAN_DECLARATION", actor: LEDGER_ACTOR.HUMAN, detail: `declared by the human in conflict with proof ${other.id} over ${targetKind} ${targetId}; the earlier ${self.record.state} declaration lapses until resolved` });
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === a.id ? nextA : r.id === b.id ? nextB : r)), events: [...ledger.events, ev(a, b), ev(b, a)] }, at, "declareConflict");
}
/**
 * The human resolves a conflict for BOTH sides in one act: each side goes to DEMONSTRATED,
 * CERTIFIED or WITHHELD, an accepted state passing the same gate a declaration passes. A one-sided
 * resolution is not offered (ruling Q3).
 */
export function resolveConflict(ledger, proofId, { thisTo, counterpartTo }, at, { bundle } = {}) {
  if (!isIso(at)) throw new Error("resolveConflict needs an ISO instant");
  const a = ledger.records.find((r) => r.id === proofId);
  if (!a) return refuseState(ledger, at, `no proof record ${String(proofId)}`);
  if (a.record.state !== "CONFLICTING" || !a.conflict) return refuseState(ledger, at, `proof ${proofId} is ${a.record.state}; there is no conflict to resolve`);
  const b = ledger.records.find((r) => r.id === a.conflict.counterpartId);
  if (!b || b.record.state !== "CONFLICTING" || !b.conflict || b.conflict.counterpartId !== a.id) return refuseState(ledger, at, `the conflict on proof ${proofId} has no counterpart in the conflict; the system dissolves it on the next fold`);
  for (const to of [thisTo, counterpartTo]) if (!CONFLICT_RESOLUTION.includes(to)) return refuseState(ledger, at, `${String(to)} is not a resolution; each side goes to DEMONSTRATED, CERTIFIED or WITHHELD`);
  const settle = (r, to) => {
    if (to === "WITHHELD") return { ok: true, record: { ...withState(leaveState(r), "WITHHELD"), withheldCause: WITHHELD_CAUSE.CONFLICT_RESOLVED, lastEventAt: at }, detail: "withheld by the human at resolution; an apply of the same evidence does not resume it, only the human's explicit offer" };
    const gate = acceptedStateGate(r, to, bundle);
    if (!gate.ok) return { ok: false, error: `proof ${r.id} -> ${to}: ${gate.error}` };
    const next = { ...withState(leaveState(r), to), declaration: { state: to, linkIds: gate.linkIds, at }, lastEventAt: at };
    const note = proofTypeStateNote(next);
    return { ok: true, record: next, detail: `${to === "DEMONSTRATED" ? `on ${gate.linkIds.join(", ")}, standing at resolution` : "a qualification or credential"}${note ? `; ${note}` : ""}` };
  };
  const ra = settle(a, thisTo); if (!ra.ok) return refuseState(ledger, at, ra.error);
  const rb = settle(b, counterpartTo); if (!rb.ok) return refuseState(ledger, at, rb.error);
  const ev = (r, to, detail, other) => createLedgerEvent({ at, proofId: r.id, kind: "CONFLICT_RESOLVED", from: "CONFLICTING", to, reason: "HUMAN_DECLARATION", actor: LEDGER_ACTOR.HUMAN, detail: `resolved by the human with proof ${other.id}: ${detail}` });
  return commit(ledger, { ...ledger, records: ledger.records.map((r) => (r.id === a.id ? ra.record : r.id === b.id ? rb.record : r)), events: [...ledger.events, ev(a, thisTo, ra.detail, b), ev(b, counterpartTo, rb.detail, a)] }, at, "resolveConflict");
}

// ---------------------------------------------------------------------------------------------
// Views: missing evidence and downstream uses are COMPUTED from the record, never typed.
// ---------------------------------------------------------------------------------------------
/**
 * How the links stand: from stored state alone when no bundle is given, and re-judged live against
 * the bundle when one is (Supervisor ruling W-b). The omission is VISIBLE in the output: a view built
 * without a bundle says its link state was not re-checked, so a caller cannot receive a stale answer
 * that reads as authoritative.
 */
export function linkStanding(record, bundle) {
  const links = Array.isArray(record.links) ? record.links : [];
  const judged = bundle !== undefined;
  const catalogue = judged ? bundleTargets(bundle) : null;
  const unreadable = judged && !catalogue.sourceId ? catalogue.unlinkable[0].text : null;
  const recordedValid = links.filter((l) => l.state === "VALID");
  const notJudged = links.filter((l) => l.state === "INVALID" && l.reason === "TARGET_EVIDENCE_UNAVAILABLE");
  const recorded = recordedValid.map((l) => ({ targetKind: l.targetKind, targetId: l.targetId }));
  const active = linksJudgeable(record);
  // `standing` holds only links judged live and found standing; without a bundle it is EMPTY and
  // `recorded` carries what the ledger last stored, so a consumer reading the list cannot take stored
  // state for a current finding (conformance-auditor S-new-1).
  const standing = judged && active && !unreadable ? recordedValid.filter((l) => judgeLink(l, bundle).valid) : [];
  const lapsed = judged && active && !unreadable ? recordedValid.length - standing.length : 0;
  // One sentence per condition, each naming exactly what was and was not done; no arm falls through
  // to a cause nobody established (conformance-auditor W-new-2, W-new-3).
  const caveat = !links.length ? null
    : !judged ? (recordedValid.length ? `${plural(recordedValid.length, "link")} recorded VALID` : `every link INVALID`) + " as last recorded by the ledger; link state not re-checked against the posting evidence in this view"
    : unreadable ? (recordedValid.length ? `${plural(recordedValid.length, "link")} recorded VALID could not be judged: ${unreadable}` : notJudged.length ? `${plural(notJudged.length, "link")} not judged: ${unreadable}; unknown, not lost` : null)
    : !active ? (recordedValid.length ? `${plural(recordedValid.length, "link")} recorded VALID; not checked: this proof record is ${record.record.state}, not active` : null)
    : lapsed ? `${plural(lapsed, "link")} recorded VALID no longer ${lapsed === 1 ? "stands" : "stand"} against the current posting evidence, pending the ledger's re-check`
    : null;
  return { judged, active, unreadable, total: links.length, recordedValid: recordedValid.length, recorded, standing: standing.map((l) => ({ targetKind: l.targetKind, targetId: l.targetId })), lapsed, invalid: links.length - recordedValid.length, caveat };
}
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function missingEvidenceOf(record, { currentSourceId, bundle } = {}) {
  const missing = [];
  const state = record.record.state;
  if (state === "STALE") for (const cause of record.staleCauses) missing.push(staleCauseText(cause, { onCurrentSource: Boolean(currentSourceId && currentSourceId === record.sourceId) }));
  if (state === "WITHHELD") missing.push(`withheld: ${withheldCauseText(record.withheldCause)}`);
  if (state === "CONFLICTING" && record.conflict) missing.push(`in a conflict you declared with proof ${record.conflict.counterpartId} over ${record.conflict.targetKind} ${record.conflict.targetId}; resolve it, for both sides, before either licenses a destination`);
  const typeNote = proofTypeStateNote(record);
  if (typeNote) missing.push(typeNote);
  if (record.unstructured) missing.push("no exact excerpt marked; the proof covers the whole pasted text");
  if (!record.claimText) missing.push("no claim stated in your own words");
  if (record.proofType === "UNSPECIFIED") missing.push("no proof type chosen");
  const links = linkStanding(record, bundle);
  if (!links.standing.length) missing.push(!links.total ? "not yet linked to a target (see target links)" : links.caveat ? `no link currently stands: ${links.caveat} (see target links)` : "no valid link to a target: every link is invalid against the current posting evidence (see target links)");
  else if (links.caveat) missing.push(`${links.caveat} (see target links)`);
  if (!PROOF_DESTINATION.some((key) => record.record.destinations[key] === "ALLOWED")) missing.push("no destination approved yet (see destination approvals)");
  if (!ACCEPTED_STATES.includes(state)) missing.push(state === "CLAIMED_ONLY" ? "proof state is CLAIMED_ONLY, not DEMONSTRATED or CERTIFIED: declare it, on a standing link for demonstrated" : `proof state is ${state}, not DEMONSTRATED or CERTIFIED`);
  if (record.sourceCompleteness !== "COMPLETE") missing.push("the source is not attested complete");
  return missing;
}

export function downstreamUsesOf(record, { bundle } = {}) {
  const allowed = PROOF_DESTINATION.filter((key) => record.record.destinations[key] === "ALLOWED");
  const revoked = PROOF_DESTINATION.filter((key) => record.record.destinations[key] === "REVOKED");
  const links = linkStanding(record, bundle);
  const kept = links.invalid ? ` (${plural(links.invalid, "invalid link")} kept for inspection)` : "";
  const lapsed = links.caveat && links.standing.length ? `; ${links.caveat}` : "";
  return {
    destinations: { ...record.record.destinations },
    targets: [...record.record.targets],
    linkStanding: links,
    declaration: record.declaration ? { ...record.declaration, linkIds: [...record.declaration.linkIds] } : null,
    conflict: record.conflict ? { ...record.conflict } : null,
    text: [
      record.record.state === "DEMONSTRATED" && record.declaration ? `declared demonstrated by you at ${record.declaration.at} on ${plural(record.declaration.linkIds.length, "link")}` : record.record.state === "CERTIFIED" && record.declaration ? `declared certified by you at ${record.declaration.at}` : record.record.state === "CONFLICTING" && record.conflict ? `in conflict with proof ${record.conflict.counterpartId} over ${record.conflict.targetKind} ${record.conflict.targetId}, declared at ${record.conflict.declaredAt}` : null,
      !links.total ? "not yet linked to a target (see target links)"
        : !links.judged ? `${links.caveat}${kept}`
        : !links.standing.length ? `no link currently stands${links.caveat ? `: ${links.caveat}` : ""}${kept}`
        : `linked to ${plural(links.standing.length, "target")} that ${links.standing.length === 1 ? "stands" : "stand"} against the current posting evidence${lapsed}${kept}`,
      allowed.length ? `approved for ${allowed.join(", ")}` : "no destinations approved yet (see destination approvals)",
      revoked.length ? `revoked for ${revoked.join(", ")}` : null,
    ].filter(Boolean),
  };
}

export function ledgerRows(ledger, { currentSourceId, bundle } = {}) {
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
    stateText: proofStateText(record.record.state),
    staleCauses: [...(record.staleCauses || [])],
    staleCauseTexts: record.record.state === "STALE" ? record.staleCauses.map((c) => staleCauseText(c, { onCurrentSource: Boolean(currentSourceId && currentSourceId === record.sourceId) })) : [],
    withheldCause: record.withheldCause,
    withheldCauseText: record.record.state === "WITHHELD" ? withheldCauseText(record.withheldCause) : null,
    linksJudgeable: linksJudgeable(record),
    declaration: record.declaration ? { ...record.declaration, linkIds: [...record.declaration.linkIds] } : null,
    conflict: record.conflict ? { ...record.conflict } : null,
    proofTypeStateNote: proofTypeStateNote(record),
    proofType: record.proofType,
    proofTypeLabel: PROOF_TYPE_LABEL[record.proofType],
    claimText: record.claimText,
    claimOrigin: record.claimOrigin,
    confirmation: record.confirmation,
    onCurrentSource: Boolean(currentSourceId && currentSourceId === record.sourceId),
    links: (Array.isArray(record.links) ? record.links : []).map((link) => ({ ...link })),
    missingEvidence: missingEvidenceOf(record, { currentSourceId, bundle }),
    downstreamUses: downstreamUsesOf(record, { bundle }),
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
    const lastState = [...own].reverse().find((e) => ["RECORDED", "STALE", "WITHHELD", "RESUMED", "STATE_SET", "CONFLICT_DECLARED", "CONFLICT_RESOLVED"].includes(e.kind));
    if (lastState && lastState.to !== record.record.state) errors.push(`${record.id}: state ${record.record.state} does not follow from its last state event (${lastState.to})`);
    // Human choices are derived from history the same way state is: a choice without its event is refused.
    const lastType = [...own].reverse().find((e) => e.kind === "PROOF_TYPE_SET");
    if ((lastType ? lastType.to : "UNSPECIFIED") !== record.proofType) errors.push(`${record.id}: proof type ${record.proofType} does not follow from its history (${lastType ? lastType.to : "no PROOF_TYPE_SET event"})`);
    const lastClaim = [...own].reverse().find((e) => e.kind === "CLAIM_SET");
    if ((lastClaim ? lastClaim.to : null) !== record.claimText) errors.push(`${record.id}: claim does not follow from its history (${lastClaim ? "last CLAIM_SET differs" : "no CLAIM_SET event"})`);
    if (own.length && own[own.length - 1].at !== record.lastEventAt) errors.push(`${record.id}: lastEventAt does not match its last event`);
    // Proof states (BLP-010): what each state carries, and only that state.
    const st = record.record?.state;
    const causes = Array.isArray(record.staleCauses) ? record.staleCauses : null;
    if (!causes || new Set(causes).size !== causes.length || !causes.every((c) => Object.values(STALE_CAUSE).includes(c))) errors.push(`${record.id}: staleCauses must be a set drawn from the governed causes`);
    else if (st === "STALE" ? !causes.length : causes.length) errors.push(`${record.id}: staleCauses must be non-empty on a STALE record and empty otherwise`);
    if (st === "WITHHELD" ? !Object.values(WITHHELD_CAUSE).includes(record.withheldCause) : record.withheldCause !== null) errors.push(`${record.id}: withheldCause must name a cause on a WITHHELD record and be null otherwise`);
    const decl = record.declaration;
    const declAllowed = ACCEPTED_STATES.includes(st) || (st === "STALE" && causes && causes.includes(STALE_CAUSE.TARGET_LINK));
    if (!declAllowed && decl !== null) errors.push(`${record.id}: a ${st} record carries no declaration`);
    if (ACCEPTED_STATES.includes(st)) {
      if (!isObject(decl) || decl.state !== st || !Array.isArray(decl.linkIds) || !isIso(decl.at)) errors.push(`${record.id}: a ${st} record must carry the human's declaration of ${st} with its instant`);
      // The quantifier is EXISTENTIAL, the same one reconcileLinks applies when it lapses a demonstration
      // (no declared link standing and at least one lost): a declaration on two links keeps standing while
      // one of them does (conformance-auditor C-NEW-1: a universal rule here contradicted the reconcile
      // rule at partial loss and made commitReconcile throw on a state the ledger can legitimately hold).
      else if (st === "DEMONSTRATED" && (!decl.linkIds.length || !decl.linkIds.some((id) => (record.links || []).some((l) => l.id === id && linkStandsOrUnjudged(l))))) errors.push(`${record.id}: DEMONSTRATED must stand on at least one declared link that is VALID or not yet judged; a declaration whose links were ALL judged and found lost makes the record STALE, not DEMONSTRATED`);
      if (record.unstructured) errors.push(`${record.id}: the whole pasted text with no exact excerpt marked cannot be ${st}`);
      const born = lastState && ["STATE_SET", "CONFLICT_RESOLVED"].includes(lastState.kind) && lastState.to === st;
      if (!born) errors.push(`${record.id}: ${st} must follow from a STATE_SET or CONFLICT_RESOLVED event, the human's declaration`);
    }
    if (st === "STALE" && causes && causes.includes(STALE_CAUSE.TARGET_LINK) && (!isObject(decl) || decl.state !== "DEMONSTRATED")) errors.push(`${record.id}: stale for a lost link must carry the DEMONSTRATED declaration that lapsed`);
    if (st === "CONFLICTING") {
      const c = record.conflict;
      if (!isObject(c) || !nonempty(c.counterpartId) || !PROOF_TARGET_KIND.includes(c.targetKind) || !nonempty(c.targetId) || !isIso(c.declaredAt)) errors.push(`${record.id}: a CONFLICTING record must name its counterpart, the shared target and the instant`);
      else {
        const other = ledger.records.find((r) => r.id === c.counterpartId);
        if (!other || other.record?.state !== "CONFLICTING" || !isObject(other.conflict) || other.conflict.counterpartId !== record.id || other.conflict.targetKind !== c.targetKind || other.conflict.targetId !== c.targetId) errors.push(`${record.id}: conflict is not symmetric; proof ${c.counterpartId} must be CONFLICTING back over the same target (a one-sided conflict is an intention, not a property)`);
        if (!(record.links || []).some((l) => linkStandsOrUnjudged(l) && l.targetKind === c.targetKind && l.targetId === c.targetId)) errors.push(`${record.id}: a conflict needs a link to its shared target that stands or is not yet judged; a judged loss dissolves it`);
      }
    } else if (record.conflict !== null) errors.push(`${record.id}: a ${st} record carries no conflict`);
    // Links (BLP-009): every link governed, targets[] equal to the VALID links, each link born of a LINKED event.
    const links = Array.isArray(record.links) ? record.links : null;
    if (!links) errors.push(`${record.id}: links must be an array`);
    else {
      const linkIds = new Set();
      for (const link of links) {
        if (!isObject(link) || !nonempty(link.id) || !link.id.startsWith("link:")) { errors.push(`${record.id}: link without an id`); continue; }
        if (linkIds.has(link.id)) errors.push(`${record.id}: duplicate link ${link.id}`);
        linkIds.add(link.id);
        if (link.ledgerVersion !== LEDGER_VERSION) errors.push(`${link.id}: ledgerVersion must be ${LEDGER_VERSION}`);
        if (!LINKABLE_TARGET_KINDS.includes(link.targetKind)) errors.push(`${link.id}: target kind ${link.targetKind} cannot be linked in this system`);
        if (!nonempty(link.targetId)) errors.push(`${link.id}: no target id`);
        if (link.id !== makeLinkId(record.id, link.targetKind, link.targetId)) errors.push(`${link.id}: id does not follow from its proof, kind and target`);
        if (!nonempty(link.targetSourceId) || !/^[0-9a-f]{64}$/.test(String(link.targetSourceTextHash))) errors.push(`${link.id}: target source id and sha256 hash are required`);
        if (!nonempty(link.targetText)) errors.push(`${link.id}: the target text snapshot is empty`);
        if (!TRUSTED_PARENTAGE.includes(link.targetDerivationState)) errors.push(`${link.id}: snapshot parentage ${link.targetDerivationState} is not a trusted parentage`);
        if (!/^[DR]\d+$/.test(String(link.targetLabel))) errors.push(`${link.id}: target label ${link.targetLabel} is not a row label`);
        if (!LINK_STATE.includes(link.state)) errors.push(`${link.id}: state must be VALID or INVALID`);
        if (link.state === "VALID" && link.reason !== null) errors.push(`${link.id}: a VALID link carries no reason`);
        if (link.state === "INVALID" && !REASONS_BY_KIND.LINK_INVALID.includes(link.reason)) errors.push(`${link.id}: an INVALID link must carry an invalidation reason`);
        if (!isIso(link.linkedAt) || !isIso(link.lastEventAt) || link.lastEventAt < link.linkedAt) errors.push(`${link.id}: linkedAt and lastEventAt must be instants in order`);
        const born = own.find((e) => e.kind === "LINKED" && e.linkId === link.id);
        if (!born) errors.push(`${link.id}: no LINKED event (a link without its human act)`);
        const lastLinkEvent = [...own].reverse().find((e) => e.linkId === link.id && ["LINKED", "LINK_INVALID", "LINK_RESUMED"].includes(e.kind));
        if (lastLinkEvent && lastLinkEvent.to !== link.state) errors.push(`${link.id}: state ${link.state} does not follow from its last link event (${lastLinkEvent.to})`);
        if (lastLinkEvent && lastLinkEvent.kind === "LINK_INVALID" && lastLinkEvent.reason !== link.reason) errors.push(`${link.id}: reason does not follow from its last invalidation event`);
      }
      const expectedTargets = JSON.stringify(validLinkTargets(links));
      if (JSON.stringify(record.record?.targets) !== expectedTargets) errors.push(`${record.id}: the contract record's targets do not equal the VALID links`);
      for (const e of own) if (e.linkId && !linkIds.has(e.linkId) && !own.some((u) => u.kind === "UNLINKED" && u.linkId === e.linkId)) errors.push(`${record.id}: event names link ${e.linkId} that neither exists nor was unlinked`);
    }
  }
  ledger.refusals.forEach((refusal, i) => { const v = validateLedgerRefusal(refusal); if (!v.ok) errors.push(`refusals[${i}]: ${v.errors[0]}`); });
  if (!Array.isArray(ledger.faults)) errors.push("faults must be an array");
  else ledger.faults.forEach((fault, i) => { const v = validateLedgerFault(fault); if (!v.ok) errors.push(`faults[${i}]: ${v.errors[0]}`); });
  ledger.events.forEach((event, i) => {
    const verdict = validateLedgerEvent(event);
    if (!verdict.ok) errors.push(`events[${i}]: ${verdict.errors[0]}`);
    else if (event.seq !== i) errors.push(`events[${i}]: seq ${event.seq} does not equal its position; two events at one instant keep their order by seq`);
    else if (!ids.has(event.proofId)) errors.push(`events[${i}]: names unknown record ${event.proofId}`);
    if (i > 0 && ledger.events[i - 1].at > event.at) errors.push(`events[${i}]: out of order`);
  });
  return { ok: errors.length === 0, errors };
}
