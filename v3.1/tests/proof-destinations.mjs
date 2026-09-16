// BLP-011 control of accepted proof destinations: resume, cover letter, interview, portfolio and
// work sample. Every assertion names, in its message, the observation that would make it fail, and
// each was checked reachable: the Supervisor's rulings Q1 to Q10 are asserted in the direction that
// would fail if the fix collapsed.
//
// Part A (node): the destination layer over the BLP-010 state layer and a real adapter bundle.
// Part B (Chromium at 1440x1000 and 430x932): the company flow, approve, revoke, approve again, the
// lapse said in words at withdrawal, the rendered destination words compared with the adapter's, the
// destination named work sample told apart from the proof type named work sample, and the print
// package's destinations section with its print instant and its not-re-checked statement.
//
// Run: node tests/proof-destinations.mjs            (BASE_URL defaults to http://127.0.0.1:4173)
//      PROOF_DESTINATIONS_NODE_ONLY=1 node tests/proof-destinations.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LEDGER_ACTOR, ACCEPTED_STATES, STALE_CAUSE, WITHHELD_CAUSE, REASONS_BY_KIND, LEDGER_VERSION, LEDGER_EVENT_KIND, LEDGER_REFUSAL_REASON,
  DESTINATION_EVENT_KINDS, DESTINATION_HUMAN_EDGES, destinationLapseText, destinationApproval, destinationRows, setDestination,
  createEmptyLedger, applyEvidenceToLedger, linkProof, reconcileLinks, bundleTargets,
  declareProofState, withdrawProofState, declareConflict, resolveConflict, setProofType,
  ledgerRows, validateLedger, validateLedgerEvent, createLedgerEvent, missingEvidenceOf, downstreamUsesOf, guardLedgerStep,
} from "../src/work-universe/candidateProofLedgerData.js";
import { buildManualPersonSource, buildManualPersonEvidence, markExcerpt } from "../src/work-universe/personEvidenceData.js";
import { buildPostingEvidence, destinationText, destinationStateText, proofStateText, ADAPTER_VERSION } from "../src/contracts/evidenceAdapter.js";
import { PROOF_DESTINATION, DESTINATION_STATE, PROOF_STATE, validateProofRecord, CONTRACT_VERSION } from "../src/contracts/evidenceContracts.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };
const deq = (a, b, msg) => { checks += 1; assert.deepEqual(a, b, msg); };
const throws = (fn, re, msg) => { checks += 1; assert.throws(fn, re, msg); };
const t = (n) => `2026-09-11T09:${String(n).padStart(2, "0")}:00.000Z`;

// ---------------------------------------------------------------------------------------------
// Part A
// ---------------------------------------------------------------------------------------------
// A1 one definition of the words (ruling Q6); the versions (ruling Q9)
eq(ADAPTER_VERSION, "1.3.0", "the adapter is 1.3.0 (fails if the bump was not made or was made to a different number)");
eq(LEDGER_VERSION, "1.3.0", "the ledger stamp moved to 1.3.0 with the destination vocabulary (surfaced for Rule V-1)");
eq(CONTRACT_VERSION, "1.1.0", "the contract stays 1.1.0: no contract record changed (fails if the constants were coupled)");
deq(PROOF_DESTINATION, ["resume", "coverLetter", "interview", "portfolio", "workSample"], "the five destinations are the contract's (premise)");
deq(PROOF_DESTINATION.map(destinationText), ["resume", "cover letter", "interview", "portfolio", "work sample"], "the destination names are the register requirement's own words (fails if a key leaks through or a name is renamed)");
for (const s of DESTINATION_STATE) ok(destinationStateText(s).length > 40 && !/unrecognised/.test(destinationStateText(s)), `${s} has a defined sentence`);
for (const s of DESTINATION_STATE) ok(!/strong|weak|good|poor|credible|worth|convincing/i.test(destinationStateText(s)), `${s}'s sentence characterises no worth`);
ok(/unrecognised destination \(/.test(destinationText("pdf")) && /unrecognised destination state \(/.test(destinationStateText("MAYBE")), "an unknown destination or state is named, never guessed");
ok(/lapsed when the record left its accepted state/.test(destinationStateText("UNSET")) && /until you revoke it or the record leaves its accepted state/.test(destinationStateText("ALLOWED")) && /approve it again/.test(destinationStateText("REVOKED")), "each sentence says the act and what it licenses");
ok(LEDGER_EVENT_KIND.includes("DESTINATION_SET") && LEDGER_EVENT_KIND.includes("DESTINATION_LAPSED") && DESTINATION_EVENT_KINDS.length === 2, "two destination event kinds are governed (ruling Q5)");
deq(REASONS_BY_KIND.DESTINATION_SET, ["HUMAN_CHOICE"], "a human sets a destination by choice");
deq([...REASONS_BY_KIND.DESTINATION_LAPSED].sort(), ["EVIDENCE_CLEARED", "EXCERPT_REMOVED", "HUMAN_DECLARATION", "SOURCE_TEXT_CHANGED", "STATE_WITHDRAWN", "TARGET_LINK_LOST"].sort(), "a lapse carries exactly the reasons of the six transitions that leave an accepted state");
for (const r of REASONS_BY_KIND.DESTINATION_LAPSED) ok(destinationLapseText(r).length > 20, `lapse reason ${r} has words`);
throws(() => destinationLapseText("TARGET_RESTORED"), /no words are defined for lapse reason/, "an ungoverned lapse reason throws rather than borrowing a story (no default arm)");
deq(DESTINATION_HUMAN_EDGES, [["UNSET", "ALLOWED"], ["REVOKED", "ALLOWED"], ["ALLOWED", "REVOKED"]], "the three human edges (ruling Q4): approve from UNSET or REVOKED, revoke from ALLOWED");
ok(LEDGER_REFUSAL_REASON.includes("DESTINATION_REFUSED"), "a destination refusal has its own governed reason");

// fixtures (the BLP-010 suite's, so the two layers are tested over the same evidence)
const BODY = ["Responsibilities", "- Monitor operational data and investigate service exceptions across the payments platform", "- Prepare the monthly management accounts and variance commentary for the finance director", "Requirements", "- Knowledge of SQL and data pipelines is required for this role", "- Degree in accountancy, business or a related discipline"].join("\n");
const posting = (uuid, text) => ({ uuid, source: "MyCareersFuture", text, description: text, textField: "description", textProvenance: { description: { cap: 30000, originalLength: text.length, truncated: false } } });
const DUTIES = ["Monitor operational data and investigate service exceptions across the payments platform", "Prepare the monthly management accounts and variance commentary for the finance director"];
const buildBundle = (uuid, text, duties) => buildPostingEvidence({ posting: posting(uuid, text), duties, extractionVersion: "responsibilities-1", retrievedAt: t(0) });
const bundle = buildBundle("MCF-2026-000123", BODY, DUTIES);
const bundle2 = buildBundle("MCF-2026-000999", BODY + "\n- Extra line.", DUTIES.slice(0, 1));
const notOk = { ...bundle, state: "CONFLICTING_EVIDENCE", validation: { ok: false, errors: ["x"] } };
const catalogue = bundleTargets(bundle);
const dutyT = catalogue.targets.find((x) => x.targetKind === "duty");
const src = buildManualPersonSource("I monitored operational data daily and investigated every exception.\nI closed the monthly accounts.");
const ex1 = markExcerpt(src, 0, 69).span, ex2 = markExcerpt(src, 70, src.text.length).span;
const two = [{ start: 0, end: 69, sourceTextHash: ex1.sourceTextHash }, { start: 70, end: src.text.length, sourceTextHash: ex2.sourceTextHash }];
const pay = (raw, excerpts, n) => buildManualPersonEvidence({ rawText: raw, confirmed: true, excerpts, confirmedAt: t(n) });
const l0 = applyEvidenceToLedger(createEmptyLedger(), pay(src.text, two, 1), t(1), { bundle });
const [A, B] = l0.records.map((r) => r.id);
const rec = (l, id) => l.records.find((r) => r.id === id);
const dest = (l, id, key) => rec(l, id).record.destinations[key];
const rowOf = (l, id, key) => destinationRows(rec(l, id), l.events).find((d) => d.destination === key);
const l1 = linkProof(l0, A, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(2)).ledger;
const l2 = declareProofState(l1, A, "DEMONSTRATED", t(3), { bundle }).ledger;
const l3 = declareProofState(l2, B, "CERTIFIED", t(4)).ledger;
ok(rec(l3, A).record.state === "DEMONSTRATED" && rec(l3, B).record.state === "CERTIFIED", "premise: A demonstrated on a standing duty link, B certified");
ok(PROOF_DESTINATION.every((k) => dest(l3, A, k) === "UNSET" && dest(l3, B, k) === "UNSET"), "every destination starts UNSET on both records (fails if a declaration pre-approves anything)");
ok(l3.events.every((e) => e.destination === null), "no event before a destination act carries a destination (fails if the governed field leaks onto other kinds)");

// A2 the one operative exclusion: the contract's rule (criterion iii reading)
for (const s of ["CLAIMED_ONLY", "STALE", "WITHHELD", "CONFLICTING"]) {
  const v = validateProofRecord({ ...rec(l3, A).record, state: s, targets: [], destinations: { ...rec(l3, A).record.destinations, resume: "ALLOWED" } });
  ok(!v.ok && v.errors.some((e) => /may allow a destination only in state DEMONSTRATED or CERTIFIED/.test(e)), `${s} with an ALLOWED destination is refused by the contract's own rule (the exclusion is inherited, not rebuilt)`);
}
const onClaimed = setDestination(l1, A, "resume", "ALLOWED", t(5), { bundle });
ok(!onClaimed.ok && /CLAIMED_ONLY and licenses no destination/.test(onClaimed.error) && /the contract allows a destination only in state DEMONSTRATED or CERTIFIED/.test(onClaimed.error), "approval on a CLAIMED_ONLY record is refused in words that quote the contract's rule (fails if the family rule is not named)");
eq(onClaimed.ledger.refusals.at(-1).reason, "DESTINATION_REFUSED", "and the refusal is on the record under its own reason");
eq(onClaimed.ledger.records.length, l1.records.length, "and no record changed");
// every state is answered by the gate, with no default arm
for (const s of PROOF_STATE) { const g = destinationApproval({ ...rec(l3, A), record: { ...rec(l3, A).record, state: s } }, bundle); ok(typeof g.ok === "boolean" && (g.ok || /licenses no destination|needs/.test(g.error)), `destinationApproval answers state ${s} (${g.ok ? "offered" : g.error.slice(0, 60)})`); }
throws(() => destinationApproval({ ...rec(l3, A), record: { ...rec(l3, A).record, state: "MAYBE" } }, bundle), /no approval rule for proof state MAYBE/, "an ungoverned state throws rather than falling into a default arm");
const unconfirmed = destinationApproval({ ...rec(l3, B), record: { ...rec(l3, B).record, confirmation: "UNCONFIRMED" } });
ok(!unconfirmed.ok && /not USER-CONFIRMED/.test(unconfirmed.error), "unconfirmed proof is excluded in words even where the state reads accepted (criterion iii: unconfirmed)");

// A3 approval on DEMONSTRATED needs the live re-judge (ruling Q2); on CERTIFIED it needs no bundle
const noBundle = setDestination(l3, A, "resume", "ALLOWED", t(5));
ok(!noBundle.ok && /no posting evidence was given to judge against/.test(noBundle.error) && /refused rather than allowed on stored link state/.test(noBundle.error), "approval on a DEMONSTRATED record with a link recorded VALID but NO bundle is refused (this is the assertion that dies if stored VALID is enough)");
const unreadable = setDestination(l3, A, "resume", "ALLOWED", t(5), { bundle: notOk });
ok(!unreadable.ok && /could not be read/.test(unreadable.error), "approval against an unreadable bundle is refused, not allowed on stored state");
const lapsedLink = setDestination(l3, A, "resume", "ALLOWED", t(5), { bundle: bundle2 });
ok(!lapsedLink.ok && /1 declared link judged and none standing/.test(lapsedLink.error), "approval when the declared link no longer stands live is refused with the count, before any reconcile has staled the record");
const aResume = setDestination(l3, A, "resume", "ALLOWED", t(5), { bundle });
ok(aResume.ok, `approval on a standing demonstration is accepted (${aResume.error || "ok"})`);
const l4 = aResume.ledger;
eq(dest(l4, A, "resume"), "ALLOWED", "the destination is ALLOWED on the contract record");
const evA = l4.events.at(-1);
ok(evA.kind === "DESTINATION_SET" && evA.destination === "resume" && evA.from === "UNSET" && evA.to === "ALLOWED" && evA.reason === "HUMAN_CHOICE" && evA.actor === LEDGER_ACTOR.HUMAN && evA.linkId === null, "the approval is a human DESTINATION_SET event naming the destination in its governed field, from UNSET to ALLOWED, with no linkId");
ok(/standing against the posting evidence at approval/.test(evA.detail) && new RegExp(rec(l4, A).links[0].id).test(evA.detail), "the event names the declared link that stood at approval");
ok(validateLedger(l4).ok && validateProofRecord(rec(l4, A).record, { knownSpans: bundle.knownSpans }).ok, `the ledger and the contract record validate (${validateLedger(l4).errors[0] || "no errors"})`);
const bCover = setDestination(l4, B, "coverLetter", "ALLOWED", t(6));
ok(bCover.ok && dest(bCover.ledger, B, "coverLetter") === "ALLOWED", "approval on a CERTIFIED record with NO bundle is accepted: its basis is the human's declaration, not the posting evidence (the asymmetry, ruling Q2)");
ok(/no link is re-judged because a certification stands on your declaration/.test(bCover.ledger.events.at(-1).detail), "and the event says why no link was re-judged");
const l5 = bCover.ledger;

// A4 the human edges (ruling Q4)
const again = setDestination(l5, A, "resume", "ALLOWED", t(7), { bundle });
ok(!again.ok && /already approved/.test(again.error), "approving an approved destination is refused in words");
const revokeUnset = setDestination(l5, A, "interview", "REVOKED", t(7));
ok(!revokeUnset.ok && /interview is UNSET on proof/.test(revokeUnset.error) && /only an approved destination can be revoked/.test(revokeUnset.error), "REVOKED from UNSET is refused (fails if a never-approved destination can be revoked)");
const revoked = setDestination(l5, A, "resume", "REVOKED", t(7));
ok(revoked.ok && dest(revoked.ledger, A, "resume") === "REVOKED", "revoke from ALLOWED is accepted, with no bundle: a revocation needs no judgement");
const evR = revoked.ledger.events.at(-1);
ok(evR.kind === "DESTINATION_SET" && evR.from === "ALLOWED" && evR.to === "REVOKED" && evR.actor === LEDGER_ACTOR.HUMAN && evR.destination === "resume", "the revocation is a human DESTINATION_SET from ALLOWED to REVOKED");
ok(/revoked for resume at/.test(rowOf(revoked.ledger, A, "resume").text) && /approved earlier at/.test(rowOf(revoked.ledger, A, "resume").text), "the row says revoked, with the earlier approval instant");
const twice = setDestination(revoked.ledger, A, "resume", "REVOKED", t(8));
ok(!twice.ok && /resume is REVOKED on proof/.test(twice.error), "revoking twice is refused");
const reapprove = setDestination(revoked.ledger, A, "resume", "ALLOWED", t(8), { bundle });
ok(reapprove.ok && dest(reapprove.ledger, A, "resume") === "ALLOWED" && reapprove.ledger.events.at(-1).from === "REVOKED", "approve again from REVOKED is accepted, through the same live gate, and the event leaves REVOKED");
ok(!setDestination(reapprove.ledger, A, "resume", "ALLOWED", t(9), { bundle: bundle2 }).ok, "and the same gate refuses it when the link no longer stands live");
const unset = setDestination(l5, A, "resume", "UNSET", t(7));
ok(!unset.ok && /UNSET is reached only when an approval lapses/.test(unset.error), "a human cannot set UNSET (only a lapse returns a destination to it)");
const unknownDest = setDestination(l5, A, "pdf", "ALLOWED", t(7), { bundle });
ok(!unknownDest.ok && /pdf is not a governed destination/.test(unknownDest.error), "an ungoverned destination is refused by name");
ok(!setDestination(l5, "proof:nobody", "resume", "ALLOWED", t(7), { bundle }).ok, "an unknown record is refused");

// A5 the proof type never gates a destination (ruling Q8)
const credA = setProofType(l5, A, "CREDENTIAL", t(7)).ledger;
const credWork = setDestination(credA, A, "workSample", "ALLOWED", t(8), { bundle });
ok(credWork.ok, "a proof of type credential is approved for the destination work sample (fails if the type gates the destination)");
const wsB = setProofType(l5, B, "WORK_SAMPLE", t(7)).ledger;
ok(setDestination(wsB, B, "interview", "ALLOWED", t(8)).ok, "a proof of type work sample is approved for the destination interview");

// A6 lapse by withdrawal (ruling Q3): every ALLOWED -> UNSET by the system, BEFORE the state event; REVOKED untouched
const l6 = setDestination(setDestination(l5, A, "interview", "ALLOWED", t(7), { bundle }).ledger, A, "portfolio", "REVOKED", t(8));
ok(!l6.ok, "premise check: portfolio was never approved, so it cannot be revoked");
const l6b = setDestination(setDestination(setDestination(l5, A, "interview", "ALLOWED", t(7), { bundle }).ledger, A, "portfolio", "ALLOWED", t(8), { bundle }).ledger, A, "portfolio", "REVOKED", t(9)).ledger;
deq([dest(l6b, A, "resume"), dest(l6b, A, "interview"), dest(l6b, A, "portfolio"), dest(l6b, A, "coverLetter")], ["ALLOWED", "ALLOWED", "REVOKED", "UNSET"], "premise: two approved, one revoked, one unset on A");
const w = withdrawProofState(l6b, A, t(10));
ok(w.ok && rec(w.ledger, A).record.state === "CLAIMED_ONLY", "withdrawal returns A to CLAIMED_ONLY");
deq([dest(w.ledger, A, "resume"), dest(w.ledger, A, "interview"), dest(w.ledger, A, "portfolio"), dest(w.ledger, A, "coverLetter")], ["UNSET", "UNSET", "REVOKED", "UNSET"], "every ALLOWED destination lapsed to UNSET; the REVOKED one is untouched (fails if a lapse revokes, or if REVOKED is cleared)");
const tail = w.ledger.events.slice(-4);
deq(tail.map((e) => e.kind), ["DESTINATION_LAPSED", "DESTINATION_LAPSED", "WITHHELD", "RESUMED"], "the two lapse events PRECEDE the state event that takes the record out (fails if they follow it, or are missing)");
ok(tail.slice(0, 2).every((e) => e.actor === LEDGER_ACTOR.SYSTEM && e.reason === "STATE_WITHDRAWN" && e.from === "ALLOWED" && e.to === "UNSET" && e.at === t(10)), "each lapse is the system's, carries the causing transition's reason, and is stamped at the act's own instant");
deq(tail.slice(0, 2).map((e) => e.destination), ["resume", "interview"], "each lapse names its destination in the governed field");
ok(/2 approved destinations lapsed/.test(tail[2].detail), "the withdrawal event counts the lapses");
ok(validateLedger(w.ledger).ok, `the ledger validates after the lapse (${validateLedger(w.ledger).errors[0] || "no errors"})`);
const lapsedRow = rowOf(w.ledger, A, "resume");
ok(lapsedRow.state === "UNSET" && /^approved for resume at 2026-09-11T09:05:00.000Z; lapsed at 2026-09-11T09:10:00.000Z because you withdrew the declaration/.test(lapsedRow.text), `the row says from history "approved at; lapsed at because", never merely UNSET (${lapsedRow.text})`);
ok(lapsedRow.lapsedAt === t(10) && lapsedRow.lapseReason === "STATE_WITHDRAWN" && lapsedRow.approvedAt === t(5), "and carries the instants and the reason as data");
eq(rowOf(w.ledger, A, "coverLetter").text, "not approved for cover letter", "a destination never approved says so plainly");
// re-declaring does NOT restore the lapsed approval
const redeclared = declareProofState(w.ledger, A, "DEMONSTRATED", t(11), { bundle }).ledger;
ok(rec(redeclared, A).record.state === "DEMONSTRATED" && dest(redeclared, A, "resume") === "UNSET" && dest(redeclared, A, "portfolio") === "REVOKED", "a later declaration does not restore a lapsed approval and leaves the revoked one revoked; approve again is a human act (fails if resumption re-approves)");
ok(/lapsed at/.test(rowOf(redeclared, A, "resume").text), "and the row still says the approval lapsed");
ok(setDestination(redeclared, A, "resume", "ALLOWED", t(12), { bundle }).ok && rowOf(setDestination(redeclared, A, "resume", "ALLOWED", t(12), { bundle }).ledger, A, "resume").text === `approved for resume at ${t(12)}`, "approving again after the lapse is accepted and the row names the NEW instant");

// A7 lapse at every other accepted exit: the link lost by system detection, the text changed, the excerpt removed, the evidence cleared, a conflict declared
const l7 = setDestination(l5, A, "interview", "ALLOWED", t(7), { bundle }).ledger;
const lost = reconcileLinks(l7, bundle2, t(8));
ok(rec(lost, A).record.state === "STALE" && rec(lost, A).staleCauses[0] === STALE_CAUSE.TARGET_LINK, "premise: the posting change stales the demonstration by system detection");
deq([dest(lost, A, "resume"), dest(lost, A, "interview")], ["UNSET", "UNSET"], "both approvals lapsed when the link was lost");
const lostTail = lost.events.filter((e) => e.proofId === A).slice(-3);
deq(lostTail.map((e) => e.kind), ["DESTINATION_LAPSED", "DESTINATION_LAPSED", "STALE"], "the lapses precede the STALE event");
ok(lostTail.slice(0, 2).every((e) => e.reason === "TARGET_LINK_LOST" && e.actor === LEDGER_ACTOR.SYSTEM), "each carries TARGET_LINK_LOST, the transition's own reason");
ok(/lapsed at .* because the link the demonstration stood on no longer stands/.test(rowOf(lost, A, "resume").text), "the row's words name the lost link as the cause");
ok(validateLedger(lost).ok, `the ledger validates (${validateLedger(lost).errors[0] || "no errors"})`);
ok(dest(lost, B, "coverLetter") === "ALLOWED", "B's certified approval is untouched by a change on A's target");
// text changed (fold STALE SOURCE_TEXT_CHANGED)
const srcX = buildManualPersonSource(src.text + " More.");
const changed = applyEvidenceToLedger(l7, pay(srcX.text, [], 8), t(8), { bundle });
ok(rec(changed, A).record.state === "STALE" && rec(changed, B).record.state === "STALE", "premise: a different text stales every record");
ok(PROOF_DESTINATION.every((k) => dest(changed, A, k) === "UNSET" && dest(changed, B, k) === "UNSET"), "every approval on both records lapsed with the text change");
ok(changed.events.filter((e) => e.kind === "DESTINATION_LAPSED").every((e) => e.reason === "SOURCE_TEXT_CHANGED") && changed.events.filter((e) => e.kind === "DESTINATION_LAPSED").length === 3, "three lapses, each with SOURCE_TEXT_CHANGED");
const idxLapse = changed.events.findIndex((e) => e.kind === "DESTINATION_LAPSED" && e.proofId === A), idxStale = changed.events.findIndex((e) => e.kind === "STALE" && e.proofId === A);
ok(idxLapse >= 0 && idxLapse < idxStale, "A's lapses precede A's STALE event in the fold");
ok(/because the pasted text changed/.test(rowOf(changed, A, "resume").text), "the row names the text change as the cause");
// restoration resumes to CLAIMED_ONLY and does not restore approvals
const restored = applyEvidenceToLedger(changed, pay(src.text, two, 9), t(9), { bundle });
ok(rec(restored, A).record.state === "CLAIMED_ONLY" && PROOF_DESTINATION.every((k) => dest(restored, A, k) === "UNSET"), "restoration resumes as CLAIMED_ONLY with nothing re-approved");
// excerpt removed (fold WITHHELD EXCERPT_REMOVED)
const removed = applyEvidenceToLedger(l7, pay(src.text, [two[1]], 8), t(8), { bundle });
ok(rec(removed, A).record.state === "WITHHELD" && rec(removed, A).withheldCause === WITHHELD_CAUSE.EXCERPT_REMOVED, "premise: removing A's excerpt withholds A");
ok(dest(removed, A, "resume") === "UNSET" && dest(removed, A, "interview") === "UNSET" && dest(removed, B, "coverLetter") === "ALLOWED", "A's approvals lapsed; B's stands");
ok(removed.events.filter((e) => e.kind === "DESTINATION_LAPSED").every((e) => e.reason === "EXCERPT_REMOVED" && e.proofId === A), "each lapse carries EXCERPT_REMOVED");
ok(/because you removed the excerpt/.test(rowOf(removed, A, "resume").text), "the row names the removal");
// evidence cleared (fold WITHHELD EVIDENCE_CLEARED)
const cleared = applyEvidenceToLedger(l7, null, t(8), { bundle });
ok(rec(cleared, A).record.state === "WITHHELD" && rec(cleared, B).record.state === "WITHHELD", "premise: clearing withholds both");
ok(PROOF_DESTINATION.every((k) => dest(cleared, A, k) === "UNSET" && dest(cleared, B, k) === "UNSET") && cleared.events.filter((e) => e.kind === "DESTINATION_LAPSED").length === 3 && cleared.events.filter((e) => e.kind === "DESTINATION_LAPSED").every((e) => e.reason === "EVIDENCE_CLEARED"), "every approval lapsed with EVIDENCE_CLEARED");
ok(/because you cleared the evidence/.test(rowOf(cleared, B, "coverLetter").text), "the row names the clearing");
// conflict declared (both sides)
const bothDemo = declareProofState(linkProof(l0, B, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(2)).ledger, B, "DEMONSTRATED", t(3), { bundle }).ledger;
const bothLinkedA = declareProofState(linkProof(bothDemo, A, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(4)).ledger, A, "DEMONSTRATED", t(5), { bundle }).ledger;
const approvedBoth = setDestination(setDestination(bothLinkedA, A, "resume", "ALLOWED", t(6), { bundle }).ledger, B, "portfolio", "ALLOWED", t(7), { bundle }).ledger;
const conflict = declareConflict(approvedBoth, A, B, { targetKind: "duty", targetId: dutyT.targetId }, t(8), { bundle });
ok(conflict.ok, `premise: the conflict over the shared duty is declared (${conflict.error || "ok"})`);
ok(dest(conflict.ledger, A, "resume") === "UNSET" && dest(conflict.ledger, B, "portfolio") === "UNSET", "both sides' approvals lapsed at the conflict's declaration");
const cTail = conflict.ledger.events.slice(-4);
deq(cTail.map((e) => `${e.kind}:${e.proofId === A ? "A" : "B"}`), ["DESTINATION_LAPSED:A", "CONFLICT_DECLARED:A", "DESTINATION_LAPSED:B", "CONFLICT_DECLARED:B"], "each side's lapse precedes its own CONFLICT_DECLARED event");
ok(cTail[0].reason === "HUMAN_DECLARATION" && cTail[2].reason === "HUMAN_DECLARATION", "a lapse at a conflict carries HUMAN_DECLARATION, the declaration's own reason");
ok(/because you declared the record in conflict with another/.test(rowOf(conflict.ledger, A, "resume").text), "the row names the conflict");
ok(validateLedger(conflict.ledger).ok, "the ledger validates after the conflict");
const resolved = resolveConflict(conflict.ledger, A, { thisTo: "DEMONSTRATED", counterpartTo: "WITHHELD" }, t(9), { bundle }).ledger;
ok(rec(resolved, A).record.state === "DEMONSTRATED" && dest(resolved, A, "resume") === "UNSET" && !resolved.events.slice(-4).some((e) => e.kind === "DESTINATION_LAPSED"), "resolution from CONFLICTING lapses nothing (nothing was ALLOWED there) and restores nothing");

// A8 the validator derives every destination from history (ruling Q5)
const forge = (l, id, mut) => ({ ...l, records: l.records.map((r) => (r.id === id ? mut(r) : r)) });
ok(!validateLedger(forge(l3, A, (r) => ({ ...r, record: { ...r.record, destinations: { ...r.record.destinations, resume: "ALLOWED" } } }))).ok, "an ALLOWED destination without its DESTINATION_SET event is refused (a state with no act)");
ok(/does not follow from its history/.test(validateLedger(forge(l3, A, (r) => ({ ...r, record: { ...r.record, destinations: { ...r.record.destinations, resume: "ALLOWED" } } }))).errors[0]), "and the error names the missing history");
ok(!validateLedger(forge(l4, A, (r) => ({ ...r, record: { ...r.record, destinations: { ...r.record.destinations, resume: "UNSET" } } }))).ok, "a destination UNSET while its last event says ALLOWED is refused");
ok(!validateLedger(forge(l4, A, (r) => ({ ...r, record: { ...r.record, state: "CLAIMED_ONLY" }, declaration: null }))).ok, "an ALLOWED destination on a record forged back to CLAIMED_ONLY is refused (the contract's rule reaches the ledger)");
const evOk = (o) => validateLedgerEvent(createLedgerEvent(o)).ok;
ok(evOk({ at: t(1), proofId: A, destination: "resume", kind: "DESTINATION_SET", from: "UNSET", to: "ALLOWED", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN }), "a well-formed approval event validates (premise)");
ok(!evOk({ at: t(1), proofId: A, kind: "DESTINATION_SET", from: "UNSET", to: "ALLOWED", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN }), "a DESTINATION_SET without a destination is refused");
ok(!evOk({ at: t(1), proofId: A, destination: "pdf", kind: "DESTINATION_SET", from: "UNSET", to: "ALLOWED", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN }), "an ungoverned destination is dropped by createLedgerEvent and the event refused");
ok(!evOk({ at: t(1), proofId: A, destination: "resume", kind: "STATE_SET", from: "CLAIMED_ONLY", to: "CERTIFIED", reason: "HUMAN_DECLARATION", actor: LEDGER_ACTOR.HUMAN }), "a destination on a non-destination event is refused");
ok(!evOk({ at: t(1), proofId: A, destination: "resume", kind: "DESTINATION_SET", from: "ALLOWED", to: "UNSET", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN }), "a human edge ALLOWED -> UNSET is refused");
ok(!evOk({ at: t(1), proofId: A, destination: "resume", kind: "DESTINATION_SET", from: "UNSET", to: "REVOKED", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN }), "a human edge UNSET -> REVOKED is refused");
ok(!evOk({ at: t(1), proofId: A, destination: "resume", kind: "DESTINATION_SET", from: "UNSET", to: "ALLOWED", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.SYSTEM }), "a DESTINATION_SET by the system is refused");
ok(evOk({ at: t(1), proofId: A, destination: "resume", kind: "DESTINATION_LAPSED", from: "ALLOWED", to: "UNSET", reason: "STATE_WITHDRAWN", actor: LEDGER_ACTOR.SYSTEM }), "a well-formed lapse validates (premise)");
ok(!evOk({ at: t(1), proofId: A, destination: "resume", kind: "DESTINATION_LAPSED", from: "ALLOWED", to: "UNSET", reason: "STATE_WITHDRAWN", actor: LEDGER_ACTOR.HUMAN }), "a lapse by the human is refused");
ok(!evOk({ at: t(1), proofId: A, destination: "resume", kind: "DESTINATION_LAPSED", from: "REVOKED", to: "UNSET", reason: "STATE_WITHDRAWN", actor: LEDGER_ACTOR.SYSTEM }), "a lapse from REVOKED is refused (a revoked destination is untouched by a lapse)");
ok(!evOk({ at: t(1), proofId: A, destination: "resume", kind: "DESTINATION_LAPSED", from: "ALLOWED", to: "UNSET", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.SYSTEM }), "a lapse with a reason that is not a transition's is refused");
ok(!evOk({ at: t(1), proofId: A, destination: "resume", linkId: "link:abc", kind: "DESTINATION_SET", from: "UNSET", to: "ALLOWED", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN }), "a destination event with a linkId is refused");

// A9 views: words not keys; rows; missing evidence; the panel boundary
const uses = downstreamUsesOf(rec(l5, A), { bundle });
ok(uses.text.some((x) => x === "approved for resume"), `downstream uses print the destination's WORDS (${uses.text.join(" | ")})`);
const usesR = downstreamUsesOf(rec(setDestination(setDestination(l5, A, "coverLetter", "ALLOWED", t(7), { bundle }).ledger, A, "resume", "REVOKED", t(8)).ledger, A), { bundle });
ok(usesR.text.includes("approved for cover letter") && usesR.text.includes("revoked for resume"), `approved and revoked are printed in words, never as coverLetter (${usesR.text.join(" | ")})`);
ok(!usesR.text.some((x) => /coverLetter|workSample/.test(x)), "no contract key reaches the text");
ok(missingEvidenceOf(rec(l3, A), { bundle }).some((m) => /no destination approved yet/.test(m)) && !missingEvidenceOf(rec(l5, A), { bundle }).some((m) => /no destination approved yet/.test(m)), "missing evidence names the absence of an approval and drops it once one stands");
const rows5 = ledgerRows(l5, { bundle });
ok(rows5.every((r) => Array.isArray(r.destinations) && r.destinations.length === 5 && r.destinations.every((d) => d.name === destinationText(d.destination) && d.stateText === destinationStateText(d.state) && typeof d.text === "string")), "every row carries five destination rows with the adapter's words and a history sentence");
ok(rows5.find((r) => r.id === A).destinationApproval.ok && !ledgerRows(l1, { bundle }).find((r) => r.id === A).destinationApproval.ok, "the row carries the data layer's own approval gate (offered on A demonstrated; withheld on A claimed only)");
ok(!ledgerRows(l5).find((r) => r.id === A).destinationApproval.ok && ledgerRows(l5).find((r) => r.id === B).destinationApproval.ok, "with no bundle the gate withholds approval on the demonstrated record and offers it on the certified one (the asymmetry reaches the view)");
const stepped = guardLedgerStep(l5, (l) => setDestination(l, A, "interview", "ALLOWED", t(7), { bundle }).ledger, t(7));
ok(dest(stepped, A, "interview") === "ALLOWED" && stepped.faults.length === 0, "a destination act runs through the pure boundary like any other choice");

// A10 determinism
eq(JSON.stringify(setDestination(l3, A, "resume", "ALLOWED", t(5), { bundle }).ledger), JSON.stringify(l4), "approving is deterministic");
eq(JSON.stringify(withdrawProofState(l6b, A, t(10)).ledger), JSON.stringify(w.ledger), "the lapse is deterministic");
eq(JSON.stringify(destinationRows(rec(w.ledger, A), w.ledger.events)), JSON.stringify(destinationRows(rec(w.ledger, A), w.ledger.events)), "the rows are deterministic");

console.log(`Part A (node): PASS, ${checks} checks`);
if (process.env.PROOF_DESTINATIONS_NODE_ONLY === "1") { console.log("Part B (browser): NOT_RUN (PROOF_DESTINATIONS_NODE_ONLY=1)"); process.exit(0); }

// ---------------------------------------------------------------------------------------------
// Part B (harness shared with tests/proof-states.mjs)
// ---------------------------------------------------------------------------------------------
const { chromium } = await import("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const MCF_BODY = ["Responsibilities", "- Monitor operational data and investigate service exceptions across the payments platform", "- Prepare the monthly management accounts and variance commentary for the finance director", "- Support various ad-hoc reporting requests and other duties as assigned to the operations team", "- Coordinate quarterly access reviews with the technology risk function and document outcomes", "Requirements", "- Knowledge of SQL and data pipelines is required for this role", "- Degree in accountancy, business or a related discipline", "- At least three years in an operations or finance operations role", "Benefits", "- Hybrid working arrangement with two office days a week"].join("\n");
const job = { uuid: "MCF-2026-000123", title: "Operations Analyst", employer: "EXAMPLE BANK LTD", description: MCF_BODY, responsibilitiesText: MCF_BODY, skills: ["Data Analytics", "SQL", "Operations"], categories: ["Banking and Finance"], employmentType: "Permanent", positionLevels: ["Professional"], salaryMin: 5000, salaryMax: 7000, postedDate: "2026-09-01T00:00:00.000Z", postedDateRaw: "2026-09-01", source: "MyCareersFuture", mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000123" };
const job2 = { ...job, uuid: "MCF-2026-000456", title: "Finance Operations Lead", description: MCF_BODY + "\n- Lead the quarterly close for the regional entities", responsibilitiesText: MCF_BODY + "\n- Lead the quarterly close for the regional entities", mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000456" };
const companyPayload = { query: job.employer, queryKey: "example bank ltd", ambiguous: false, totalPostings: 2, pagesPolled: 1, matches: [{ key: "example bank ltd", displayName: job.employer, name: job.employer, count: 2, jobs: [job, job2] }] };
const duties = ["Monitor operational data and investigate service exceptions across the payments platform", "Prepare the monthly management accounts and variance commentary for the finance director", "Support various ad-hoc reporting requests and other duties as assigned to the operations team", "Coordinate quarterly access reviews with the technology risk function and document outcomes"];
const respFx = JSON.stringify({ summary: "Runs operational monitoring and finance reporting for the payments platform.", responsibilities: duties.map((text, i) => ({ n: i + 1, text, cat: "Delivery & Execution", freq: "Core", sk: [] })) });
const MARKER = "DEST-MARKER-DO-NOT-PERSIST";
const CV = `I monitored operational data daily and investigated every payments exception ${MARKER}.\nI closed the monthly accounts.`;
const WANTED = `I monitored operational data daily and investigated every payments exception ${MARKER}.`;
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
async function newPage(viewport) {
  const page = await browser.newPage({ viewport, ...(viewport.width < 600 ? { isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" } : {}) });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource:")) errors.push(`console: ${m.text()}`); });
  await page.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("**/api/mcf", async (r) => { let b = {}; try { b = r.request().postDataJSON(); } catch (_) {} r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b.action === "company" ? companyPayload : { jobs: [], tier: 1, approximate: false }) }); });
  for (const [p, v] of [["**/api/careers", { jobs: [], total: 0 }], ["**/api/ssoc", { results: [], classifications: [] }], ["**/api/ssic", { matched: false, results: [] }], ["**/api/esco", { occupations: [], skills: [] }], ["**/api/anatomy", { ok: true, found: false, data: null }], ["**/api/company-registry", { matched: false }], ["**/api/geocode**", { matched: false }], ["**/api/state**", { ok: false, kv: false }]]) await page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(v) }));
  await page.route("**/api/claude", async (r) => {
    let b = {}; try { b = r.request().postDataJSON(); } catch (_) {}
    const sys = String(b?.system || ""); const pr = String(b?.messages?.[0]?.content || "");
    let text = "[]";
    if (/job-analysis specialist/i.test(sys) && /Extract the real responsibilities/i.test(pr)) text = respFx;
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text }], model: "proof-destinations-fixture" }) });
  });
  return page;
}
const select = (page, start, end) => page.getByTestId("person-evidence-paste").evaluate((el, [s, e]) => { el.focus(); el.setSelectionRange(s, e); }, [start, end]);
// The notice is derived from the kept ledger in an effect, so every read captures the notice BEFORE
// the action and waits for it to CHANGE, then asserts its words; no wait is its own assertion.
const noticeText = (page) => page.getByTestId("cpl-notice").textContent();
const noticeChanged = (page, prev) => page.waitForFunction((before) => { const t = document.querySelector('[data-testid="cpl-notice"]')?.textContent || ""; return t.trim().length > 0 && t !== before; }, prev, { timeout: 5000 });
const waitState = (page, i, state) => page.waitForFunction(([n, s]) => document.querySelectorAll('[data-testid="cpl-record"]')[n]?.dataset.state === s, [i, state], { timeout: 5000 });
const record = (page, i) => page.locator('[data-testid="cpl-record"]').nth(i);
const destRow = (page, i, key) => record(page, i).locator(`[data-testid="cpl-dest"][data-destination="${key}"]`);
const waitDest = (page, i, key, state) => page.waitForFunction(([n, k, s]) => document.querySelectorAll('[data-testid="cpl-record"]')[n]?.querySelector(`[data-testid="cpl-dest"][data-destination="${k}"]`)?.dataset.destState === s, [i, key, state], { timeout: 5000 });
async function openPrint(page) {
  await page.getByTestId("wu-open-print-package").click();
  await page.getByTestId("print-package-preview").waitFor({ state: "visible", timeout: 15000 });
  return page.getByTestId("print-proof-destinations");
}
async function closePrint(page) {
  await page.locator(".v31-print-controls .close").click();
  await page.getByTestId("return-work-universe").click();
  await page.getByTestId("v31-universe-surface").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("candidate-proof-ledger").waitFor({ state: "visible", timeout: 15000 });
}
// The print package can be opened ONCE per session from the Work Universe: the legacy studio
// applies each intent by its JSON key and a second { kind: "print" } is the same key, so a second
// open lands on the workspace with no overlay (pre-existing, recorded as a known omission for the
// round-trip owner BLP-012). Each print reading therefore takes its own page.
async function setupPage({ width, height, phone }) {
  const page = await newPage({ width, height });
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: "Search by employer" }).click();
  await page.getByRole("searchbox", { name: "Company name" }).fill(job.employer);
  await page.getByRole("button", { name: "Find company postings" }).click();
  await page.getByTestId("company-opportunity-grid").waitFor({ state: "visible", timeout: 15000 });
  await page.getByRole("button", { name: /Analyse this posting|Analyse role/ }).first().click();
  await page.getByTestId("work-universe").waitFor({ state: "visible", timeout: 60000 });
  if (phone) { await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone", null, { timeout: 15000 }); await page.getByTestId("wu-quick-fab").click(); await page.getByTestId("wu-quick-job-ad").click(); }
  else { const sh = page.getByTestId("wu-start-here"); if (await sh.count() && await sh.isVisible()) await page.getByTestId("wu-explore-full-map").click(); }
  await page.getByTestId("wu-individual-person").click();
  await page.getByTestId("wu-add-person-evidence").click();
  const ledger = page.getByTestId("candidate-proof-ledger");
  await ledger.waitFor({ state: "visible", timeout: 15000 });

  // 1. Two excerpts confirmed. Nothing approved: the controls are withheld with the contract's rule, in words.
  const textarea = page.getByTestId("person-evidence-paste");
  await textarea.fill(CV);
  await textarea.evaluate((el) => el.blur());
  await page.waitForFunction((w) => document.querySelector('[data-testid="person-evidence-paste"]').value === w, CV, { timeout: 5000 });
  await select(page, 0, WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  await select(page, WANTED.length + 1, CV.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 2, null, { timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-record"]').length === 2, null, { timeout: 5000 });
  return { page, ledger };
}
async function runViewport({ name, width, height, phone }) {
  const tag = phone ? "phone" : "desktop";
  // 0. Print package before any approval, on its own page: withheld in words with the record count.
  const first = await setupPage({ width, height, phone });
  let section = await openPrint(first.page);
  eq(await section.getAttribute("data-carried"), "0", `${tag}: the print package carries nothing before an approval`);
  ok(/WITHHELD/.test(await section.innerText()) && /No proof is approved for any destination \(2 records on the ledger/.test(await section.innerText()), `${tag}: the print section withholds in words, with the record count, rather than inventing a carried proof`);
  ok(/Package assembled at 20\d\d-\d\d-\d\dT[^ ]+, re-stamped at the print command/.test(await section.locator('[data-testid="print-proof-destinations-instant"]').innerText()) && /link standing was not re-checked at print time/.test(await section.locator('[data-testid="print-proof-destinations-instant"]').innerText()) && /a register of approvals across the five destinations, not an export for any one of them/.test(await section.locator('[data-testid="print-proof-destinations-instant"]').innerText()), `${tag}: the section states its instant (committed, re-stamped at the print command), that link standing was not re-checked at print time, and what the section is`);
  await first.page.close();

  // 1. Two excerpts confirmed. Nothing approved: the controls are withheld with the contract's rule, in words.
  const { page, ledger } = await setupPage({ width, height, phone });
  eq(await record(page, 0).locator('[data-testid="cpl-dest"]').count(), 5, `${tag}: five destination rows per record`);
  deq(await record(page, 0).locator('[data-testid="cpl-dest-name"]').allInnerTexts(), PROOF_DESTINATION.map((k) => `destination: ${destinationText(k)}`), `${tag}: each row is labelled "destination: <the adapter's name>" (fails if a key or another gloss is rendered)`);
  eq(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-state-text"]').innerText(), destinationStateText("UNSET"), `${tag}: the rendered UNSET words equal the adapter's`);
  eq(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-history"]').innerText(), "not approved for resume", `${tag}: a never-approved destination says so plainly`);
  ok(/Approval is not offered: proof .* is CLAIMED_ONLY and licenses no destination/.test(await record(page, 0).locator('[data-testid="cpl-dest-why"]').innerText()) && /the contract allows a destination only in state DEMONSTRATED or CERTIFIED/.test(await record(page, 0).locator('[data-testid="cpl-dest-why"]').innerText()), `${tag}: on a claimed-only record the reason quotes the contract's rule`);
  ok((await record(page, 0).locator('[data-testid="cpl-dest-approve"]').evaluateAll((els) => els.every((b) => b.disabled))) && (await record(page, 0).locator('[data-testid="cpl-dest-revoke"]').evaluateAll((els) => els.every((b) => b.disabled))), `${tag}: every approve and revoke control is disabled on a claimed-only record`);
  ok(/a proof of any type may be approved for any destination, and the destination named work sample takes proof of any type/.test(await page.getByTestId("cpl-dest-note").innerText()) && (await page.getByTestId("cpl-dest-note").count()) === 1, `${tag}: the note says once, as an observation, that the proof type gates no destination (ruling Q8; once, not once per record)`);
  // the destination named work sample and the proof type named work sample are told apart in text
  const typeOptions = await record(page, 0).locator('[data-testid="cpl-type-select"] option').allInnerTexts();
  ok(typeOptions.includes("work sample") && (await destRow(page, 0, "workSample").locator('[data-testid="cpl-dest-name"]').innerText()) === "destination: work sample" && /Proof type \(your choice\)/.test(await record(page, 0).innerText()), `${tag}: "work sample" appears as a proof type option under "Proof type (your choice)" and as "destination: work sample" under Destinations, two labelled places (fails if either label is dropped)`);
  const shapes = await page.evaluate(() => { const rec = document.querySelectorAll('[data-testid="cpl-record"]')[0]; const row = rec.querySelector('[data-testid="cpl-dest"][data-destination="workSample"]'); const sel = rec.querySelector('[data-testid="cpl-type-select"]'); return { rowTag: row.tagName, rowBorder: getComputedStyle(row).borderLeftStyle, rowBorderWidth: parseFloat(getComputedStyle(row).borderLeftWidth), selTag: sel.tagName, selValue: sel.options[sel.selectedIndex].textContent }; });
  ok(shapes.rowTag === "LI" && shapes.rowBorder === "solid" && shapes.rowBorderWidth > 0 && shapes.selTag === "SELECT" && shapes.selValue === "not chosen", `${tag}: the destination named work sample is a bordered list card and the proof type is a select control reading "not chosen", two shapes as well as two labels (${JSON.stringify(shapes)})`);

  // 2. Link, declare demonstrated, approve resume: the notice and the row say so in the adapter's words.
  const options = await page.getByTestId("cpl-link-select").first().locator("option").evaluateAll((els) => els.map((o) => o.value).filter(Boolean));
  const dutyOption = options.find((v) => v.startsWith("duty|"));
  await page.getByTestId("cpl-link-select").first().selectOption(dutyOption);
  let before = await noticeText(page);
  await page.getByTestId("cpl-link-button").first().click();
  await noticeChanged(page, before);
  await page.waitForFunction(() => !document.querySelector('[data-testid="cpl-declare-demonstrated"]')?.disabled, null, { timeout: 5000 });
  before = await noticeText(page);
  await page.getByTestId("cpl-declare-demonstrated").first().click();
  await noticeChanged(page, before);
  await waitState(page, 0, "DEMONSTRATED");
  eq(await record(page, 0).locator('[data-testid="cpl-destinations"]').getAttribute("data-approval"), "offered", `${tag}: approval is offered once the record is demonstrated on a standing link`);
  eq(await record(page, 0).locator('[data-testid="cpl-dest-why"]').count(), 0, `${tag}: the withholding reason is gone`);
  ok(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-approve"]').isEnabled(), `${tag}: approve is enabled`);
  before = await noticeText(page);
  await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-approve"]').click();
  await noticeChanged(page, before);
  await waitDest(page, 0, "resume", "ALLOWED");
  ok(/Destination resume approved at/.test(await noticeText(page)) && /standing against the posting evidence at approval/.test(await noticeText(page)), `${tag}: the notice says what was approved and on what (${await noticeText(page)})`);
  eq(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-state-text"]').innerText(), destinationStateText("ALLOWED"), `${tag}: the rendered ALLOWED words equal the adapter's`);
  ok(/^approved for resume at 20\d\d-/.test(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-history"]').innerText()), `${tag}: the row says approved and when`);
  ok(/approved for resume/.test(await record(page, 0).locator('[data-testid="cpl-uses"]').innerText()), `${tag}: downstream uses say approved for resume, in words`);
  ok(!/no destination approved yet/.test(await record(page, 0).locator('[data-testid="cpl-missing"]').innerText()), `${tag}: missing evidence no longer names the absence`);
  ok(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-approve"]').isDisabled() && await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-revoke"]').isEnabled(), `${tag}: on an approved destination approve is disabled and revoke enabled`);
  ok(await destRow(page, 0, "interview").locator('[data-testid="cpl-dest-revoke"]').isDisabled(), `${tag}: revoke stays disabled on a destination never approved (REVOKED from UNSET is not offered)`);

  // 4. Revoke, approve again.
  before = await noticeText(page);
  await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-revoke"]').click();
  await noticeChanged(page, before);
  await waitDest(page, 0, "resume", "REVOKED");
  ok(/Destination resume revoked at/.test(await noticeText(page)), `${tag}: the revocation is said in words`);
  eq(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-state-text"]').innerText(), destinationStateText("REVOKED"), `${tag}: the rendered REVOKED words equal the adapter's`);
  ok(/revoked for resume at .*; approved earlier at/.test(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-history"]').innerText()), `${tag}: the row keeps the earlier approval in its history`);
  eq(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-approve"]').innerText(), "Approve again", `${tag}: the control reads approve again from REVOKED`);
  before = await noticeText(page);
  await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-approve"]').click();
  await noticeChanged(page, before);
  await waitDest(page, 0, "resume", "ALLOWED");
  ok(/Destination resume approved at/.test(await noticeText(page)), `${tag}: approve again from REVOKED is accepted through the same gate`);
  before = await noticeText(page);
  await destRow(page, 0, "workSample").locator('[data-testid="cpl-dest-approve"]').click();
  await noticeChanged(page, before);
  await waitDest(page, 0, "workSample", "ALLOWED");
  await record(page, 0).locator('[data-testid="cpl-type-select"]').selectOption("CREDENTIAL");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-record"]')[0]?.dataset.proofType === "CREDENTIAL", null, { timeout: 5000 });
  eq(await destRow(page, 0, "workSample").getAttribute("data-dest-state"), "ALLOWED", `${tag}: choosing the proof type credential leaves the approval for the destination work sample standing (the type gates nothing)`);

  // 5. Certified record: approved with no link and no judgement; then withdraw the demonstrated record and read the lapse.
  before = await noticeText(page);
  await page.getByTestId("cpl-declare-certified").nth(0).click();
  await noticeChanged(page, before);
  await waitState(page, 1, "CERTIFIED");
  before = await noticeText(page);
  await destRow(page, 1, "coverLetter").locator('[data-testid="cpl-dest-approve"]').click();
  await noticeChanged(page, before);
  await waitDest(page, 1, "coverLetter", "ALLOWED");
  ok(/Destination cover letter approved at/.test(await noticeText(page)) && /no link is re-judged because a certification stands on your declaration/.test(await noticeText(page)), `${tag}: the certified approval says why no link was re-judged`);
  before = await noticeText(page);
  await page.getByTestId("cpl-withdraw").first().click();
  await noticeChanged(page, before);
  await waitState(page, 0, "CLAIMED_ONLY");
  ok(/Declaration withdrawn at/.test(await noticeText(page)) && /2 approved destinations lapsed \(resume, work sample: STATE_WITHDRAWN\)/.test(await noticeText(page)), `${tag}: the withdrawal notice headlines the act and says the lapses after it (${await noticeText(page)})`);
  await waitDest(page, 0, "resume", "UNSET");
  ok(/^approved for resume at 20\d\d-.*; lapsed at 20\d\d-.* because you withdrew the declaration/.test(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-history"]').innerText()), `${tag}: the lapsed row says approved at, lapsed at, because (never merely not approved): ${await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-history"]').innerText()}`);
  eq(await destRow(page, 0, "resume").locator('[data-testid="cpl-dest-state-text"]').innerText(), destinationStateText("UNSET"), `${tag}: and the state words are the adapter's UNSET sentence`);
  eq(await destRow(page, 1, "coverLetter").getAttribute("data-dest-state"), "ALLOWED", `${tag}: the certified record's approval is untouched by the other record's withdrawal`);
  ok(/Approval is not offered/.test(await record(page, 0).locator('[data-testid="cpl-dest-why"]').innerText()), `${tag}: back on claimed only, approval is withheld again with its reason`);

  // 6. Storage, touch targets and overflow are read BEFORE the single print opening, which ends the universe reading.
  const storage = await page.evaluate(async () => { const dbs = typeof indexedDB.databases === "function" ? await indexedDB.databases() : []; return `${Object.values(localStorage).join(" ")} ${Object.values(sessionStorage).join(" ")} ${document.cookie} ${JSON.stringify(dbs)}`; });
  ok(!storage.includes(MARKER) && !/ALLOWED|REVOKED|DESTINATION/.test(storage), `${tag}: no destination state reaches browser storage`);
  const boxes = await page.locator('[data-testid="cpl-dest-approve"], [data-testid="cpl-dest-revoke"]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  ok(boxes.length === 20 && boxes.every((h) => h >= 44), `${tag}: every destination control is at least 44px tall (${boxes.length} controls)`);
  const geometry = await ledger.evaluate((el) => ({ right: el.getBoundingClientRect().right, viewport: window.innerWidth, scroll: document.documentElement.scrollWidth }));
  ok(geometry.right <= geometry.viewport + 1 && geometry.scroll <= geometry.viewport + 1, `${tag}: the ledger does not overflow the viewport`);
  await page.screenshot({ path: `test-results/proof-destinations/${name}.png`, fullPage: true });

  // 7. Print package: the certified record is carried with its destination in words; the withdrawn one is not.
  section = await openPrint(page);
  eq(await section.getAttribute("data-carried"), "1", `${tag}: exactly one record is carried (fails if a lapsed approval is printed)`);
  const printed = section.locator('[data-testid="print-proof-destination-row"]');
  eq(await printed.count(), 1, `${tag}: one printed row`);
  ok(/destination: cover letter \(approved for cover letter at 20\d\d-/.test(await printed.first().locator('[data-testid="print-proof-destination-approved"]').innerText()), `${tag}: the printed row names the destination in the adapter's words with the row's own history sentence and its approval instant`);
  ok(!/revoked/.test(await printed.first().locator('[data-testid="print-proof-destination-approved"]').innerText()), `${tag}: a revoked destination is never named as a place to carry the proof`);
  ok(new RegExp(`CERTIFIED · ${proofStateText("CERTIFIED").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} Declared by you at`).test(await printed.first().innerText()) && /I closed the monthly accounts/.test(await printed.first().innerText()), `${tag}: the printed row carries the state with the adapter's sentence, the declaration instant and the excerpt`);
  ok(/no link recorded/.test(await printed.first().innerText()), `${tag}: with no link the row says so rather than claiming one stands`);
  ok(/Not carried: 1 record with no approval that stands/.test(await section.innerText()), `${tag}: the excluded record is counted in words`);
  ok(/link standing was not re-checked at print time/.test(await section.innerText()) && !/stands against the current posting evidence/.test(await section.innerText()), `${tag}: nothing in the print section claims a link stands currently`);
  ok(/Candidate proof destinations/.test(await page.getByTestId("print-package-preview").innerText()) && /AI-assisted · human decides/.test(await page.getByTestId("print-package-preview").innerText()), `${tag}: the section is titled and the honesty footer stands`);
  ok(!/coverLetter|workSample/.test(await section.innerText()), `${tag}: no contract key reaches the print`);
  const printGeometry = await page.evaluate(() => ({ viewport: window.innerWidth, scroll: document.documentElement.scrollWidth }));
  ok(printGeometry.scroll <= printGeometry.viewport + 1, `${tag}: the print package does not overflow the viewport`);
  await page.screenshot({ path: `test-results/proof-destinations/${name}-print.png`, fullPage: true });

  // 8. Back on the universe: a lapse with no other headline is its own headline (conformance-auditor
  // W-1). The claimed-only record's link is removed first so no link batch follows the clearing.
  await closePrint(page);
  before = await noticeText(page);
  await page.getByTestId("cpl-unlink").first().click();
  await noticeChanged(page, before);
  ok(/Link removed at/.test(await noticeText(page)), `${tag}: premise, the claimed-only record's link is removed`);
  before = await noticeText(page);
  await page.getByTestId("person-evidence-clear").click();
  await noticeChanged(page, before);
  await waitState(page, 1, "WITHHELD");
  ok(/^Record proof:.* left its accepted state at 20\d\d-.* \(WITHHELD: EVIDENCE_CLEARED\); 1 approved destination lapsed \(cover letter: EVIDENCE_CLEARED\)/.test(await noticeText(page)), `${tag}: clearing the evidence under a certified approval is announced as the lapse it is, not dropped (${await noticeText(page)})`);
  ok(/lapsed at 20\d\d-.* because you cleared the evidence/.test(await destRow(page, 1, "coverLetter").locator('[data-testid="cpl-dest-history"]').innerText()), `${tag}: the row names the clearing as the cause`);
  await page.close();
}
fs.mkdirSync("test-results/proof-destinations", { recursive: true });
try {
  await runViewport({ name: "desktop-1440x1000", width: 1440, height: 1000, phone: false });
  await runViewport({ name: "phone-430x932", width: 430, height: 932, phone: true });
} finally { await browser.close(); }
ok(errors.length === 0, `no page or console errors: ${errors.join(" | ")}`);
console.log(`Part B (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
