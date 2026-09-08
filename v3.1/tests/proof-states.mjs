// BLP-010 canonical proof states: DEMONSTRATED, CERTIFIED, CLAIMED_ONLY, WITHHELD, CONFLICTING
// and STALE become reachable with deterministic, auditable transitions. Every assertion names, in
// its message, the observation that would make it fail, and each was checked reachable: the
// Supervisor's rulings Q1 to Q7 are asserted in the direction that would fail if the fix collapsed.
//
// Part A (node): the state layer over the BLP-009 link layer and a real adapter bundle.
// Part B (Chromium at 1440x1000 and 430x932): the company flow, declare, withdraw, conflict, resolve,
// and the rendered state words compared with the adapter's own.
//
// Run: node tests/proof-states.mjs            (BASE_URL defaults to http://127.0.0.1:4173)
//      PROOF_STATES_NODE_ONLY=1 node tests/proof-states.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LEDGER_ACTOR, ACCEPTED_STATES, STALE_CAUSE, WITHHELD_CAUSE, CONFLICT_RESOLUTION, REASONS_BY_KIND, LEDGER_VERSION, withheldCauseText,
  createEmptyLedger, applyEvidenceToLedger, linkProof, unlinkProof, relinkProof, reconcileLinks, bundleTargets,
  declareProofState, withdrawProofState, offerAgain, declareConflict, resolveConflict, conflictCandidates, proofTypeStateNote, staleCauseText, linksJudgeable,
  setProofType, ledgerRows, validateLedger, validateLedgerEvent, createLedgerEvent, missingEvidenceOf, downstreamUsesOf, linkStanding,
} from "../src/work-universe/candidateProofLedgerData.js";
import { buildManualPersonSource, buildManualPersonEvidence, markExcerpt } from "../src/work-universe/personEvidenceData.js";
import { buildPostingEvidence, proofStateText, staleText, ADAPTER_VERSION, DUTY_EXTRACTION_VERSION } from "../src/contracts/evidenceAdapter.js";
import { PROOF_STATE, validateProofRecord, isProofTransitionPermitted, CONTRACT_VERSION } from "../src/contracts/evidenceContracts.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };
const deq = (a, b, msg) => { checks += 1; assert.deepEqual(a, b, msg); };
const t = (n) => `2026-09-08T13:${String(n).padStart(2, "0")}:00.000Z`;

// ---------------------------------------------------------------------------------------------
// Part A
// ---------------------------------------------------------------------------------------------
// A1 one definition of the words (ruling Q6); the adapter moved 1.1.0 -> 1.2.0 additively (Q7)
eq(ADAPTER_VERSION, "1.2.0", "the adapter is 1.2.0 (fails if the bump was not made or was made to a different number)");
eq(CONTRACT_VERSION, "1.1.0", "the contract stays 1.1.0: the adapter bump touches no contract record (fails if the two constants were coupled)");
for (const s of PROOF_STATE) ok(proofStateText(s).length > 40 && !/unrecognised/.test(proofStateText(s)), `${s} has a defined sentence`);
eq(proofStateText("STALE"), staleText("proof"), "STALE reuses staleText('proof') verbatim (fails if a second stale sentence exists)");
eq(proofStateText("STALE"), "stale: this proof was recorded against evidence that has since changed; re-confirm before relying on it", "and that sentence is the one pinned in the BLP-005 logs");
ok(/unrecognised proof state/.test(proofStateText("MAYBE")), "an unknown state is named, never guessed");
for (const s of PROOF_STATE) ok(!/strong|weak|good|poor|credible|worth|convincing/i.test(proofStateText(s)), `${s}'s sentence characterises no worth (fails if a value word crept in)`);
ok(/you declared/.test(proofStateText("DEMONSTRATED")) && /may be approved/.test(proofStateText("DEMONSTRATED")) && /licenses no destination/.test(proofStateText("CLAIMED_ONLY")), "each sentence says the act and what it licenses");

// fixtures
const BODY = ["Responsibilities", "- Monitor operational data and investigate service exceptions across the payments platform", "- Prepare the monthly management accounts and variance commentary for the finance director", "Requirements", "- Knowledge of SQL and data pipelines is required for this role", "- Degree in accountancy, business or a related discipline"].join("\n");
const posting = (uuid, text) => ({ uuid, source: "MyCareersFuture", text, description: text, textField: "description", textProvenance: { description: { cap: 30000, originalLength: text.length, truncated: false } } });
const DUTIES = ["Monitor operational data and investigate service exceptions across the payments platform", "Prepare the monthly management accounts and variance commentary for the finance director"];
const buildBundle = (uuid, text, duties) => buildPostingEvidence({ posting: posting(uuid, text), duties, extractionVersion: "responsibilities-1", retrievedAt: t(0) });
const bundle = buildBundle("MCF-2026-000123", BODY, DUTIES);
const bundle2 = buildBundle("MCF-2026-000999", BODY + "\n- Extra line.", DUTIES.slice(0, 1));
const anatomyBundle = buildPostingEvidence({ posting: posting("MCF-2026-000123", BODY), duties: DUTIES, extractionVersion: DUTY_EXTRACTION_VERSION.jobAnatomy, retrievedAt: t(0) });
const notOk = { ...bundle, state: "CONFLICTING_EVIDENCE", validation: { ok: false, errors: ["x"] } };
const catalogue = bundleTargets(bundle);
const dutyT = catalogue.targets.find((x) => x.targetKind === "duty"), reqT = catalogue.targets.find((x) => x.targetKind === "requirement");
const src = buildManualPersonSource("I monitored operational data daily and investigated every exception.\nI closed the monthly accounts.");
const ex1 = markExcerpt(src, 0, 69).span, ex2 = markExcerpt(src, 70, src.text.length).span;
const two = [{ start: 0, end: 69, sourceTextHash: ex1.sourceTextHash }, { start: 70, end: src.text.length, sourceTextHash: ex2.sourceTextHash }];
const pay = (raw, excerpts, n) => buildManualPersonEvidence({ rawText: raw, confirmed: true, excerpts, confirmedAt: t(n) });
const l0 = applyEvidenceToLedger(createEmptyLedger(), pay(src.text, two, 1), t(1), { bundle });
const [A, B] = l0.records.map((r) => r.id);
const rec = (l, id) => l.records.find((r) => r.id === id);
const forgeLinks = (l, id, mut) => ({ ...l, records: l.records.map((r) => (r.id === id ? { ...r, links: r.links.map(mut), record: { ...r.record, targets: [] } } : r)) });
eq(LEDGER_VERSION, "1.2.0", "the ledger stamp moved to 1.2.0 with the state vocabulary (surfaced for Rule V-1)");
ok(l0.records.every((r) => Array.isArray(r.staleCauses) && r.staleCauses.length === 0 && r.withheldCause === null && r.declaration === null && r.conflict === null), "a new record carries no stale cause, withheld cause, declaration or conflict");
ok(l0.events.every((e, i) => e.seq === i), "every committed event carries seq equal to its position (fails if seq is unassigned or drifts)");

// A2 the contract-given gate is inherited, the structural gate is ruled in (Q2)
ok(rec(l0, A).record.confirmation === "USER-CONFIRMED", "the record's confirmation is USER-CONFIRMED (the contract's gate for DEMONSTRATED and CERTIFIED; the scenario's premise)");
const noLink = declareProofState(l0, A, "DEMONSTRATED", t(2), { bundle });
ok(!noLink.ok && /at least one link that stands/.test(noLink.error) && /no link/.test(noLink.error), "DEMONSTRATED with no link is refused in words (fails if a demonstration without an object is allowed)");
eq(noLink.ledger.refusals.at(-1).reason, "STATE_REFUSED", "and the refusal is on the record");
const l1 = linkProof(l0, A, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(2)).ledger;
const noBundle = declareProofState(l1, A, "DEMONSTRATED", t(3));
ok(!noBundle.ok && /no posting evidence was given to judge against/.test(noBundle.error) && /refused rather than allowed on stored link state/.test(noBundle.error), "DEMONSTRATED with a link recorded VALID but NO bundle is refused: a standing link needs a live judgement (this is the assertion that dies if stored VALID is enough)");
const unreadable = declareProofState(l1, A, "DEMONSTRATED", t(3), { bundle: notOk });
ok(!unreadable.ok && /could not be read/.test(unreadable.error), "DEMONSTRATED against an unreadable bundle is refused, not allowed on stored state");
const lapsedLink = declareProofState(l1, A, "DEMONSTRATED", t(3), { bundle: bundle2 });
ok(!lapsedLink.ok && /1 recorded VALID but none standing/.test(lapsedLink.error), "DEMONSTRATED when the recorded link no longer stands is refused with the count");
const dA = declareProofState(l1, A, "DEMONSTRATED", t(3), { bundle });
ok(dA.ok, `DEMONSTRATED on a standing link is accepted (${dA.error || "ok"})`);
const l2 = dA.ledger;
eq(rec(l2, A).record.state, "DEMONSTRATED", "the record is DEMONSTRATED");
deq(rec(l2, A).declaration, { state: "DEMONSTRATED", linkIds: [rec(l2, A).links[0].id], at: t(3) }, "the declaration names the standing link it rests on and its instant");
ok(l2.events.at(-1).kind === "STATE_SET" && l2.events.at(-1).actor === LEDGER_ACTOR.HUMAN && l2.events.at(-1).from === "CLAIMED_ONLY" && l2.events.at(-1).to === "DEMONSTRATED" && /standing against the posting evidence at declaration/.test(l2.events.at(-1).detail), "the declaration is a human STATE_SET event naming the link");
ok(validateLedger(l2).ok && validateProofRecord(rec(l2, A).record, { knownSpans: bundle.knownSpans }).ok, `the ledger and the contract record validate (${validateLedger(l2).errors[0] || "no errors"})`);
ok(!missingEvidenceOf(rec(l2, A), { bundle }).some((m) => /proof state is/.test(m)), "missing evidence no longer names the state");
ok(/declared demonstrated by you at/.test(downstreamUsesOf(rec(l2, A), { bundle }).text[0]), "downstream uses say who declared it and when");
// the whole-text record cannot enter an accepted state
const whole = applyEvidenceToLedger(createEmptyLedger(), pay(src.text, [], 1), t(1), { bundle });
ok(whole.records[0].unstructured === true, "the whole-text fixture is unstructured (premise)");
const wholeLinked = linkProof(whole, whole.records[0].id, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(2)).ledger;
for (const s of ACCEPTED_STATES) { const r = declareProofState(wholeLinked, whole.records[0].id, s, t(3), { bundle }); ok(!r.ok && /no exact excerpt marked/.test(r.error), `${s} on the whole pasted text is refused in words (fails if a coarse record is accepted silently)`); }
// CERTIFIED needs no link
const cB = declareProofState(l2, B, "CERTIFIED", t(4));
ok(cB.ok && rec(cB.ledger, B).record.state === "CERTIFIED" && rec(cB.ledger, B).declaration.linkIds.length === 0, "CERTIFIED is accepted with no link and no bundle: a qualification has no duty to stand on");
const l3 = cB.ledger;
ok(!declareProofState(l3, A, "CERTIFIED", t(5), { bundle }).ok && /withdraw the current declaration first/.test(declareProofState(l3, A, "CERTIFIED", t(5), { bundle }).error), "an accepted record is not re-declared; withdraw first");
ok(!declareProofState(l3, A, "WITHHELD", t(5), { bundle }).ok, "the human declares only DEMONSTRATED or CERTIFIED");

// A3 the proof-type reading is shown, never enforced (Q2, escalated)
const typed = setProofType(l2, A, "CREDENTIAL", t(4)).ledger;
ok(rec(typed, A).record.state === "DEMONSTRATED", "setting a credential type on a demonstrated record does not refuse or move it");
ok(/declared DEMONSTRATED while its proof type is credential, whose ruled reading is CERTIFIED; shown, not refused/.test(proofTypeStateNote(rec(typed, A))), "the mismatch is said in words with the ruled reading and that it awaits the Human Lead");
ok(missingEvidenceOf(rec(typed, A), { bundle }).some((m) => /awaits the Human Lead/.test(m)), "and appears under missing evidence");
ok(proofTypeStateNote(rec(l2, A)) !== null && /no proof type chosen/.test(proofTypeStateNote(rec(l2, A))), "an unspecified type on an accepted state is said too");
ok(proofTypeStateNote(rec(setProofType(l2, A, "WORK_SAMPLE", t(4)).ledger, A)) === null, "a work sample declared demonstrated matches the ruled reading and needs no note");
ok(proofTypeStateNote(rec(l0, A)) === null, "a claimed-only record carries no reading note");

// A4 withdrawal: back to CLAIMED_ONLY via WITHHELD, the only path the contract admits
const w = withdrawProofState(l3, A, t(5));
ok(w.ok && rec(w.ledger, A).record.state === "CLAIMED_ONLY" && rec(w.ledger, A).declaration === null, "withdrawal returns the record to CLAIMED_ONLY with no declaration");
ok(w.ledger.events.at(-2).kind === "WITHHELD" && w.ledger.events.at(-2).reason === "STATE_WITHDRAWN" && w.ledger.events.at(-1).kind === "RESUMED" && w.ledger.events.at(-1).reason === "STATE_WITHDRAWN" && w.ledger.events.slice(-2).every((e) => e.actor === LEDGER_ACTOR.HUMAN), "withdrawal is two human events, WITHHELD then RESUMED, because CLAIMED_ONLY is not reachable from DEMONSTRATED directly");
ok(!isProofTransitionPermitted("DEMONSTRATED", "CLAIMED_ONLY") && isProofTransitionPermitted("DEMONSTRATED", "WITHHELD") && isProofTransitionPermitted("WITHHELD", "CLAIMED_ONLY"), "the contract's table is the reason (the scenario's premise, checked)");
ok(rec(w.ledger, A).links.length === 1 && rec(w.ledger, A).links[0].state === "VALID", "the link is untouched by withdrawal");
ok(validateLedger(w.ledger).ok, "the ledger validates after withdrawal");
ok(!withdrawProofState(l0, A, t(5)).ok && /no declaration to withdraw/.test(withdrawProofState(l0, A, t(5)).error), "withdrawing from CLAIMED_ONLY is refused in words");

// A5 the lost-link edge splits by cause (Q4)
const linkA = rec(l2, A).links[0];
const unlinkHeld = unlinkProof(l2, A, linkA.id, t(5));
ok(!unlinkHeld.ok && /marked demonstrated on this link; change its state first/.test(unlinkHeld.error), "a human cannot unlink the link a demonstration stands on; refused in words that keep them in charge (fails if the unlink stales the record, misdescribing the human's own act)");
eq(rec(unlinkHeld.ledger, A).record.state, "DEMONSTRATED", "and the record is untouched");
const afterWithdraw = unlinkProof(w.ledger, A, linkA.id, t(6));
ok(afterWithdraw.ok, "after withdrawal the same unlink is accepted");
const relinkHeld = relinkProof(l2, A, linkA.id, anatomyBundle, t(5));
ok(!relinkHeld.ok && /marked demonstrated on this link/.test(relinkHeld.error), "a re-link of the declared link is held the same way while DEMONSTRATED");
// system-detected loss: the target side changed
const lost = reconcileLinks(l2, bundle2, t(5));
const lostA = rec(lost, A);
ok(lostA.record.state === "STALE" && lostA.staleCauses.length === 1 && lostA.staleCauses[0] === STALE_CAUSE.TARGET_LINK, "when the posting changes under a demonstration, the record goes STALE by system detection with cause TARGET_LINK (fails if a demonstration outlives its object)");
ok(lost.events.some((e) => e.kind === "STALE" && e.reason === "TARGET_LINK_LOST" && e.actor === LEDGER_ACTOR.SYSTEM && e.proofId === A), "the event is a system STALE with reason TARGET_LINK_LOST");
ok(lostA.declaration && lostA.declaration.state === "DEMONSTRATED", "the lapsed declaration is kept on the stale record so a return of the link can be recognised");
ok(validateLedger(lost).ok, `the ledger validates with a link-stale record (${validateLedger(lost).errors[0] || "no errors"})`);
ok(missingEvidenceOf(lostA, { bundle: bundle2 }).some((m) => /the link this demonstration stood on no longer stands/.test(m)), "missing evidence names the cause");
ok(ledgerRows(lost, { bundle: bundle2 })[0].stateText === staleText("proof"), "the row's state text is the adapter's stale sentence, unchanged by the cause");
ok(!declareProofState(lost, A, "DEMONSTRATED", t(6), { bundle }).ok && /resumes to CLAIMED_ONLY first/.test(declareProofState(lost, A, "DEMONSTRATED", t(6), { bundle }).error) && /declines the contract's STALE -> DEMONSTRATED edge/.test(declareProofState(lost, A, "DEMONSTRATED", t(6), { bundle }).error), "declaring from STALE is refused and says why the contract's edge is declined (Q5)");
// the target returns: CLAIMED_ONLY, never DEMONSTRATED (Q5)
const back = reconcileLinks(lost, bundle, t(6));
ok(rec(back, A).record.state === "CLAIMED_ONLY" && rec(back, A).declaration === null && rec(back, A).staleCauses.length === 0, "when the target returns the record resumes as CLAIMED_ONLY and NOT as DEMONSTRATED (this is the assertion that dies if resumption restores the accepted state)");
ok(back.events.at(-1).kind === "RESUMED" && back.events.at(-1).reason === "TARGET_RESTORED" && back.events.at(-1).actor === LEDGER_ACTOR.SYSTEM && /not re-asserted/.test(back.events.at(-1).detail), "the resume is a system RESUMED with reason TARGET_RESTORED saying the declaration is not re-asserted");
ok(validateLedger(back).ok, "the ledger validates after the return");
// the target was re-extracted: the human re-links, and the record resumes as CLAIMED_ONLY by their act
const lostRe = reconcileLinks(l2, anatomyBundle, t(5));
ok(rec(lostRe, A).record.state === "STALE" && rec(lostRe, A).links[0].reason === "TARGET_REEXTRACTED", "a re-extraction under a demonstration stales the record with the link TARGET_REEXTRACTED");
const relinked = relinkProof(lostRe, A, rec(lostRe, A).links[0].id, anatomyBundle, t(6));
ok(relinked.ok && rec(relinked.ledger, A).record.state === "CLAIMED_ONLY" && rec(relinked.ledger, A).links.some((l) => l.state === "VALID"), `a re-link on a link-stale record is accepted and the record resumes as CLAIMED_ONLY, not DEMONSTRATED (${relinked.error || "ok"})`);
ok(relinked.ledger.events.at(-1).kind === "RESUMED" && relinked.ledger.events.at(-1).reason === "TARGET_RELINKED" && relinked.ledger.events.at(-1).actor === LEDGER_ACTOR.HUMAN, "the resume after a re-link is the human's act with reason TARGET_RELINKED");
ok(validateLedger(relinked.ledger).ok, "the ledger validates after the re-link");
// candidate-text staleness on a demonstrated record: CLAIMED_ONLY on restore (Q5)
const textStale = applyEvidenceToLedger(l2, pay(src.text + "\nAppended.", [], 7), t(7), { bundle });
ok(rec(textStale, A).record.state === "STALE" && rec(textStale, A).staleCauses.length === 1 && rec(textStale, A).staleCauses[0] === STALE_CAUSE.CANDIDATE_TEXT && rec(textStale, A).declaration === null, "a text change stales a demonstrated record with cause CANDIDATE_TEXT and drops the declaration");
ok(textStale.events.some((e) => e.kind === "STALE" && e.proofId === A && /declaration lapses and is not re-asserted/.test(e.detail)), "the stale event says the declaration lapses");
const textBack = applyEvidenceToLedger(textStale, pay(src.text, two, 8), t(8), { bundle });
ok(rec(textBack, A).record.state === "CLAIMED_ONLY" && rec(textBack, A).declaration === null, "restoring the text resumes the record as CLAIMED_ONLY, never DEMONSTRATED (Q5 for the candidate side)");
// re-confirming a link-stale record keeps it where the link loss put it
const reconfirmedLost = applyEvidenceToLedger(lost, pay(src.text, two, 6), t(6), { bundle: bundle2 });
ok(rec(reconfirmedLost, A).record.state === "STALE" && rec(reconfirmedLost, A).staleCauses.length === 1 && rec(reconfirmedLost, A).staleCauses[0] === STALE_CAUSE.TARGET_LINK, "re-confirming the excerpt does not resume a link-stale record: its text never changed, its link did");
// A5b what is ESTABLISHED about a declared link (conformance-auditor C-1): unreadable evidence establishes nothing
const unread = reconcileLinks(l2, notOk, t(4));
ok(rec(unread, A).record.state === "DEMONSTRATED" && rec(unread, A).declaration.state === "DEMONSTRATED" && rec(unread, A).links[0].state === "INVALID" && rec(unread, A).links[0].reason === "TARGET_EVIDENCE_UNAVAILABLE", "when the posting evidence cannot be read the declared link is NOT JUDGED and the demonstration is kept, not staled (this is the assertion that dies if an unreadable bundle is narrated as a lost link)");
ok(!unread.events.some((e) => e.kind === "STALE" && e.proofId === A) && validateLedger(unread).ok, `no STALE event was written and the ledger validates with a demonstration over an unjudged link (${validateLedger(unread).errors[0] || "no errors"})`);
ok(linkStanding(rec(unread, A), notOk).standing.length === 0 && /not judged: .*; unknown, not lost/.test(linkStanding(rec(unread, A), notOk).caveat), "the standing view says the link was not judged and is unknown, not that it stands, lapsed or is invalid against the evidence");
ok(missingEvidenceOf(rec(unread, A), { bundle: notOk }).some((m) => /not judged/.test(m)) && !missingEvidenceOf(rec(unread, A), { bundle: notOk }).some((m) => /every link is invalid against the current posting evidence/.test(m)), "missing evidence carries the same words and never says the link is invalid against evidence nobody could read");
const readAgain = reconcileLinks(unread, bundle, t(5));
ok(rec(readAgain, A).record.state === "DEMONSTRATED" && rec(readAgain, A).links[0].state === "VALID" && readAgain.events.at(-1).kind === "LINK_RESUMED" && readAgain.events.at(-1).reason === "TARGET_EVIDENCE_READ", "when the evidence can be read again the link resumes with reason TARGET_EVIDENCE_READ and the record never left DEMONSTRATED (fails if the record was resumed as CLAIMED_ONLY, which would mean it had been staled)");
ok(!readAgain.events.some((e) => e.kind === "RESUMED" && e.proofId === A), "no RESUMED event exists for it: nothing was lost, so nothing was restored");
ok(!declareProofState(l1, A, "DEMONSTRATED", t(3), { bundle: notOk }).ok, "and a fresh declaration on unreadable evidence is refused, the same standard applied at declaration and at re-judgement");
// A5c a record stale for its LINK alone still follows the candidate text (conformance-auditor C-3)
ok(linksJudgeable(lostA) && !linksJudgeable(rec(textStale, A)), "a link-stale record is judgeable (its excerpt stands); a text-stale one is not (premise)");
const bothCauses = applyEvidenceToLedger(lost, pay(src.text + "\nAppended.", [], 6), t(6), { bundle: bundle2 });
deq(rec(bothCauses, A).staleCauses, [STALE_CAUSE.TARGET_LINK, STALE_CAUSE.CANDIDATE_TEXT], "a text change under a link-stale record ADDS CANDIDATE_TEXT to its causes (fails if a link-stale record is exempt from the text it was cut from)");
ok(rec(bothCauses, A).record.state === "STALE" && bothCauses.events.some((e) => e.proofId === A && e.kind === "STALE_CAUSE" && e.reason === "SOURCE_TEXT_CHANGED" && e.actor === LEDGER_ACTOR.SYSTEM && e.from === null && e.to === null) && !bothCauses.events.some((e) => e.proofId === A && e.kind === "STALE" && e.reason === "SOURCE_TEXT_CHANGED"), "the change is a STALE_CAUSE event with no state edge, because the contract admits no STALE -> STALE transition");
ok(rec(bothCauses, A).links[0].state === "INVALID" && rec(bothCauses, A).links[0].reason === "CANDIDATE_SOURCE_CHANGED" && !linksJudgeable(rec(bothCauses, A)), "its links now wait on the text like any text-stale record's");
ok(validateLedger(bothCauses).ok, `the ledger validates with two causes (${validateLedger(bothCauses).errors[0] || "no errors"})`);
const targetBackOnly = reconcileLinks(bothCauses, bundle, t(7));
ok(targetBackOnly === bothCauses || (rec(targetBackOnly, A).record.state === "STALE" && rec(targetBackOnly, A).staleCauses.length === 2), "the target's return ALONE no longer resumes it: the text is still changed (this is the assertion that dies if C-3 regressed to a link-only resume)");
const textBackOnly = applyEvidenceToLedger(bothCauses, pay(src.text, two, 8), t(8), { bundle: bundle2 });
ok(rec(textBackOnly, A).record.state === "CLAIMED_ONLY" && rec(textBackOnly, A).staleCauses.length === 0 && rec(textBackOnly, A).declaration === null && rec(textBackOnly, A).links[0].state === "INVALID" && rec(textBackOnly, A).links[0].reason === "TARGET_SOURCE_CHANGED", "restoring the text resumes it as CLAIMED_ONLY with every cause cleared and no declaration; its link stays invalid against the changed posting (a claimed-only record needs no link)");
ok(missingEvidenceOf(rec(bothCauses, A), { currentSourceId: rec(bothCauses, A).sourceId, bundle: bundle2 }).filter((m) => /no longer marked on this text|no longer stands against the posting evidence/.test(m)).length === 2, "missing evidence lists BOTH causes, each in the data layer's words");
ok(ledgerRows(bothCauses, { bundle: bundle2 })[0].staleCauseTexts.length === 2 && ledgerRows(lost, { bundle: bundle2 })[0].staleCauseTexts.length === 1 && ledgerRows(l2, { bundle })[0].staleCauseTexts.length === 0, "the row exposes one sentence per cause and none on a record that is not stale");
ok(ledgerRows(lost, { bundle: bundle2 }).find((r) => r.id === A).linksJudgeable === true && ledgerRows(textStale, { bundle }).find((r) => r.id === A).linksJudgeable === false && ledgerRows(bothCauses, { bundle: bundle2 }).find((r) => r.id === A).linksJudgeable === false, "the ROW carries linksJudgeable, true for a link-stale record and false for a text-stale one, which is the field the panel gates its link controls on (conformance-auditor C-2: fails if the row stops exposing it while the function still exists)");
// A5d partial loss (conformance-auditor C-NEW-1): a demonstration declared on two links stands while one stands
const twoLinks = linkProof(l1, A, { targetKind: "requirement", targetId: reqT.targetId }, bundle, t(2)).ledger;
const dTwo = declareProofState(twoLinks, A, "DEMONSTRATED", t(3), { bundle }).ledger;
eq(rec(dTwo, A).declaration.linkIds.length, 2, "the declaration names both standing links (premise)");
const partial = reconcileLinks(dTwo, anatomyBundle, t(4));
ok(rec(partial, A).record.state === "DEMONSTRATED" && rec(partial, A).links.some((l) => l.state === "INVALID" && l.reason === "TARGET_REEXTRACTED") && rec(partial, A).links.some((l) => l.state === "VALID" && l.targetKind === "requirement"), "when ONE of two declared links is lost the demonstration still stands on the other (fails if the reconcile lapses it, or if the validator's quantifier disagrees with the reconcile's and the boundary throws)");
ok(validateLedger(partial).ok && partial.faults.length === 0 && !partial.events.some((e) => e.kind === "STALE" && e.proofId === A), `the ledger validates at partial loss and no STALE event was written (${validateLedger(partial).errors[0] || "no errors"})`);
ok(linkStanding(rec(partial, A), anatomyBundle).standing.length === 1 && linkStanding(rec(partial, A), anatomyBundle).invalid === 1, "the standing view counts one standing and one invalid link");
const fullLoss = reconcileLinks(partial, bundle2, t(5));
ok(rec(fullLoss, A).record.state === "STALE" && rec(fullLoss, A).staleCauses[0] === STALE_CAUSE.TARGET_LINK && validateLedger(fullLoss).ok, "only when EVERY declared link is lost does the demonstration lapse to STALE (the quantifier is existential on both sides)");
ok(!validateLedger(forgeLinks(partial, A, (l) => ({ ...l, state: "INVALID", reason: "TARGET_ABSENT" }))).ok, "a DEMONSTRATED record whose declared links are ALL INVALID is still refused by the validator");
eq(staleCauseText(STALE_CAUSE.CANDIDATE_TEXT, { onCurrentSource: true }), "the excerpt is no longer marked on this text; mark it again to resume", "the on-current-source words are the BLP-008 sentence, one definition");
assert.throws(() => staleCauseText("SOMETHING_ELSE"), /no words are defined for stale cause/, "a cause outside the governed set throws rather than being narrated as the likeliest one (conformance-auditor W-3)"); checks += 1;
ok(rec(applyEvidenceToLedger(l2, null, t(4), { bundle }), A).withheldCause === WITHHELD_CAUSE.EVIDENCE_CLEARED && rec(applyEvidenceToLedger(l2, pay(src.text, [two[1]], 4), t(4), { bundle }), A).withheldCause === WITHHELD_CAUSE.EXCERPT_REMOVED, "a withheld record names its cause: cleared evidence or a removed excerpt");

// A6 conflicts: human-declared, symmetric, validator-enforced (Q3)
const l4 = linkProof(l3, B, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(5)).ledger; // B is CERTIFIED and now shares A's duty
deq(conflictCandidates(l4, A, bundle), [{ counterpartId: B, targetKind: "duty", targetId: dutyT.targetId }], "the candidates are the other accepted records sharing a target that stands on both sides");
deq(conflictCandidates(l4, A), [], "with no bundle there are no candidates: a shared target must be judged to stand");
const noShare = declareConflict(l4, A, B, { targetKind: "requirement", targetId: reqT.targetId }, t(6), { bundle });
ok(!noShare.ok && /does not stand against the current posting evidence on both/.test(noShare.error), "a conflict over a target not shared is refused in words");
ok(!declareConflict(l4, A, B, { targetKind: "duty", targetId: dutyT.targetId }, t(6)).ok, "a conflict with no bundle is refused: the shared target must be judged live");
ok(!declareConflict(l0, A, B, { targetKind: "duty", targetId: dutyT.targetId }, t(6), { bundle }).ok && /DEMONSTRATED or CERTIFIED records/.test(declareConflict(l0, A, B, { targetKind: "duty", targetId: dutyT.targetId }, t(6), { bundle }).error), "a conflict between claimed-only records is refused: the contract admits no edge from CLAIMED_ONLY to CONFLICTING");
ok(!declareConflict(l4, A, A, { targetKind: "duty", targetId: dutyT.targetId }, t(6), { bundle }).ok, "a record cannot conflict with itself");
const c = declareConflict(l4, A, B, { targetKind: "duty", targetId: dutyT.targetId }, t(6), { bundle });
ok(c.ok, `a conflict over the shared standing duty is declared (${c.error || "ok"})`);
const l5 = c.ledger;
ok(rec(l5, A).record.state === "CONFLICTING" && rec(l5, B).record.state === "CONFLICTING", "both records are CONFLICTING");
ok(rec(l5, A).conflict.counterpartId === B && rec(l5, B).conflict.counterpartId === A && rec(l5, A).conflict.targetId === dutyT.targetId && rec(l5, B).conflict.targetId === dutyT.targetId, "each names the other and the same target");
ok(l5.events.slice(-2).every((e) => e.kind === "CONFLICT_DECLARED" && e.actor === LEDGER_ACTOR.HUMAN) && new Set(l5.events.slice(-2).map((e) => e.proofId)).size === 2, "two human CONFLICT_DECLARED events, one per side");
ok(rec(l5, A).declaration === null && rec(l5, B).declaration === null, "the earlier declarations lapse while in conflict");
ok(validateLedger(l5).ok, `the ledger validates with a symmetric conflict (${validateLedger(l5).errors[0] || "no errors"})`);
const oneSided = { ...l5, records: l5.records.map((r) => (r.id === B ? { ...r, record: { ...r.record, state: "CERTIFIED" }, conflict: null, declaration: { state: "CERTIFIED", linkIds: [], at: t(6) } } : r)) };
ok(!validateLedger(oneSided).ok && /conflict is not symmetric/.test(validateLedger(oneSided).errors.find((e) => /symmetric/.test(e)) || ""), "a constructed one-sided conflict is REFUSED by the validator (this is the assertion that dies if symmetry is an intention rather than a property)");
const noTarget = { ...l5, records: l5.records.map((r) => (r.id === A ? { ...r, links: r.links.map((l) => ({ ...l, state: "INVALID", reason: "TARGET_ABSENT" })), record: { ...r.record, targets: [] } } : r)) };
ok(!validateLedger(noTarget).ok, "a conflict whose side has no VALID link to the shared target is refused by the validator");
ok(missingEvidenceOf(rec(l5, A), { bundle }).some((m) => /in a conflict you declared with proof/.test(m) && /both sides/.test(m)), "missing evidence names the conflict and that both sides resolve together");
const unlinkConflict = unlinkProof(l5, A, rec(l5, A).links[0].id, t(7));
ok(!unlinkConflict.ok && /declared conflict over this link; resolve the conflict first/.test(unlinkConflict.error), "the conflict's link cannot be unlinked while the conflict stands (Q3 as Q4)");
// resolution moves both sides
ok(!resolveConflict(l5, A, { thisTo: "DEMONSTRATED", counterpartTo: "CLAIMED_ONLY" }, t(7), { bundle }).ok, "a resolution to CLAIMED_ONLY is not offered: each side goes to DEMONSTRATED, CERTIFIED or WITHHELD");
ok(!resolveConflict(l5, A, { thisTo: "DEMONSTRATED", counterpartTo: "WITHHELD" }, t(7)).ok && /no posting evidence was given/.test(resolveConflict(l5, A, { thisTo: "DEMONSTRATED", counterpartTo: "WITHHELD" }, t(7)).error), "resolving to DEMONSTRATED passes the same live-judgement gate as a declaration");
const res = resolveConflict(l5, A, { thisTo: "DEMONSTRATED", counterpartTo: "WITHHELD" }, t(7), { bundle });
ok(res.ok, `resolution for both sides is accepted (${res.error || "ok"})`);
ok(rec(res.ledger, A).record.state === "DEMONSTRATED" && rec(res.ledger, B).record.state === "WITHHELD" && rec(res.ledger, A).conflict === null && rec(res.ledger, B).conflict === null, "both sides move in one act and the conflict is cleared on both (this is the assertion that dies if a resolution is one-sided)");
ok(res.ledger.events.slice(-2).every((e) => e.kind === "CONFLICT_RESOLVED" && e.actor === LEDGER_ACTOR.HUMAN), "two human CONFLICT_RESOLVED events");
ok(validateLedger(res.ledger).ok, `the ledger validates after resolution (${validateLedger(res.ledger).errors[0] || "no errors"})`);
const bothKeep = resolveConflict(l5, A, { thisTo: "CERTIFIED", counterpartTo: "CERTIFIED" }, t(7), { bundle });
ok(bothKeep.ok && rec(bothKeep.ledger, A).record.state === "CERTIFIED" && rec(bothKeep.ledger, B).record.state === "CERTIFIED", "both sides may be kept as CERTIFIED (no link needed) if that is the human's resolution");
// the withheld side names its cause; an apply of the same evidence is NOT the act that offers it again (conformance-auditor W-1)
eq(rec(res.ledger, B).withheldCause, WITHHELD_CAUSE.CONFLICT_RESOLVED, "the side withheld at resolution carries the cause CONFLICT_RESOLVED");
const reapplied = applyEvidenceToLedger(res.ledger, pay(src.text, two, 8), t(8), { bundle });
ok(rec(reapplied, B).record.state === "WITHHELD" && rec(reapplied, A).record.state === "DEMONSTRATED" && reapplied.events.at(-1).kind !== "RESUMED", "re-applying the same evidence leaves the withheld side WITHHELD and the demonstrated side standing (this is the assertion that dies if an unchanged apply silently undoes the human's resolution)");
ok(missingEvidenceOf(rec(reapplied, B), { bundle }).some((m) => /withheld: you withheld this excerpt at a conflict's resolution/.test(m) && /offer it again/.test(m)), "missing evidence says why it stays withheld and what resumes it");
ok(ledgerRows(reapplied, { bundle }).find((r) => r.id === B).withheldCauseText === withheldCauseText(WITHHELD_CAUSE.CONFLICT_RESOLVED) && withheldCauseText(WITHHELD_CAUSE.EXCERPT_REMOVED) !== withheldCauseText(WITHHELD_CAUSE.EVIDENCE_CLEARED) && /removed this excerpt/.test(withheldCauseText(WITHHELD_CAUSE.EXCERPT_REMOVED)) && /cleared the evidence/.test(withheldCauseText(WITHHELD_CAUSE.EVIDENCE_CLEARED)), "each withheld cause has its own sentence from one table, and the row carries it (a11y-honesty-reviewer: a removed excerpt and cleared evidence are worded distinctly)");
assert.throws(() => withheldCauseText("SOMETHING"), /no words are defined for withheld cause/, "an ungoverned withheld cause throws rather than being narrated"); checks += 1;
const offered = offerAgain(reapplied, B, t(9), { bundle });
ok(offered.ok && rec(offered.ledger, B).record.state === "CLAIMED_ONLY" && rec(offered.ledger, B).withheldCause === null && rec(offered.ledger, B).declaration === null, `the human's explicit offer resumes it as CLAIMED_ONLY with no declaration (${offered.error || "ok"})`);
ok(offered.ledger.events.some((e) => e.proofId === B && e.kind === "RESUMED" && e.reason === "OFFERED_AGAIN" && e.actor === LEDGER_ACTOR.HUMAN), "the resume is a human RESUMED event with reason OFFERED_AGAIN");
ok(rec(offered.ledger, B).links[0].state === "VALID" && offered.ledger.events.at(-1).kind === "LINK_RESUMED", "and its link is re-judged at the offer, resuming against the target that still stands (fails if a resumed record reads stored INVALID links against a standing target)");
ok(validateLedger(offered.ledger).ok, `the ledger validates after the offer (${validateLedger(offered.ledger).errors[0] || "no errors"})`);
ok(!offerAgain(res.ledger, A, t(9)).ok && /only a withheld record is offered again/.test(offerAgain(res.ledger, A, t(9)).error), "offering a record that is not withheld is refused in words");
const clearedA = applyEvidenceToLedger(l2, null, t(4), { bundle });
ok(!offerAgain(clearedA, A, t(5)).ok && /withheld by clearing the evidence; mark and apply the excerpt again/.test(offerAgain(clearedA, A, t(5)).error), "offering a record withheld by clearing the evidence is refused: that record resumes by the apply, not by an offer");
// a conflict whose shared target cannot be judged is NOT dissolved: unreadable evidence establishes no loss (C-1 for conflicts)
const conflictUnread = reconcileLinks(l5, notOk, t(7));
ok(rec(conflictUnread, A).record.state === "CONFLICTING" && rec(conflictUnread, B).record.state === "CONFLICTING" && rec(conflictUnread, A).links[0].reason === "TARGET_EVIDENCE_UNAVAILABLE" && validateLedger(conflictUnread).ok, "under unreadable posting evidence both sides stay CONFLICTING with their links unjudged (fails if an unreadable bundle dissolves a conflict as a lost target)");
// the conflict loses its object: dissolved by the system, never one-sided
const dissolved = reconcileLinks(l5, bundle2, t(7));
ok(rec(dissolved, A).record.state === "CLAIMED_ONLY" && rec(dissolved, B).record.state === "CLAIMED_ONLY" && rec(dissolved, A).conflict === null && rec(dissolved, B).conflict === null, "when the shared target no longer stands the conflict is dissolved on BOTH sides to CLAIMED_ONLY (fails if one side stays CONFLICTING against a record that is not)");
ok(dissolved.events.filter((e) => e.kind === "STALE" && e.reason === "CONFLICT_TARGET_LOST" && e.actor === LEDGER_ACTOR.SYSTEM).length === 2 && dissolved.events.filter((e) => e.kind === "RESUMED" && e.reason === "CONFLICT_DISSOLVED" && e.actor === LEDGER_ACTOR.SYSTEM).length === 2, "dissolution is two system events per side, STALE then RESUMED, the only path the contract admits");
ok(validateLedger(dissolved).ok, `the ledger validates after dissolution (${validateLedger(dissolved).errors[0] || "no errors"})`);
// Under BLP-007's identity any text change stales EVERY record together, so "the counterpart alone
// went stale" is unreachable; the reachable one-sided case is the counterpart's excerpt REMOVED by
// the human (WITHHELD) while this side stands. That case was checked reachable before the assertion
// was written (the earlier draft asserted an unreachable text-change case and died on its premise).
const counterpartGone = applyEvidenceToLedger(l5, pay(src.text, [{ start: 0, end: 69, sourceTextHash: ex1.sourceTextHash }], 7), t(7), { bundle });
ok(counterpartGone.refusals.length === l5.refusals.length && rec(counterpartGone, B).record.state === "WITHHELD", "the counterpart was withheld by the human removing its excerpt (premise, and the fold was not refused)");
ok(rec(counterpartGone, A).record.state === "CLAIMED_ONLY" && rec(counterpartGone, A).conflict === null && counterpartGone.events.some((e) => e.proofId === A && e.reason === "CONFLICT_COUNTERPART_LOST" && e.actor === LEDGER_ACTOR.SYSTEM), "the other side is dissolved by the system when its counterpart leaves the conflict, with reason CONFLICT_COUNTERPART_LOST (fails if a conflict outlives its counterpart)");
ok(validateLedger(counterpartGone).ok, `the ledger validates after a counterpart left (${validateLedger(counterpartGone).errors[0] || "no errors"})`);
const bothStale = applyEvidenceToLedger(l5, pay(src.text + "\nAppended.", [], 7), t(7), { bundle });
ok(rec(bothStale, A).record.state === "STALE" && rec(bothStale, B).record.state === "STALE" && rec(bothStale, A).conflict === null && rec(bothStale, B).conflict === null && bothStale.events.filter((e) => e.kind === "STALE" && e.reason === "SOURCE_TEXT_CHANGED").length === 2, "a text change stales both sides of a conflict together with the text reason, and neither keeps a conflict object (fails if a stale record still names a counterpart)");
ok(validateLedger(bothStale).ok, `the ledger validates when both sides went stale (${validateLedger(bothStale).errors[0] || "no errors"})`);

// A7 the validator derives state from history and refuses forgeries; events are governed
const forge = (l, id, mut) => ({ ...l, records: l.records.map((r) => (r.id === id ? mut(r) : r)) });
ok(!validateLedger(forge(l1, A, (r) => ({ ...r, record: { ...r.record, state: "DEMONSTRATED" }, declaration: { state: "DEMONSTRATED", linkIds: [r.links[0].id], at: t(3) } }))).ok, "a DEMONSTRATED record with no STATE_SET event is refused (state is derived from history)");
ok(!validateLedger(forge(l2, A, (r) => ({ ...r, declaration: null }))).ok, "a DEMONSTRATED record without its declaration is refused");
ok(!validateLedger(forge(l2, A, (r) => ({ ...r, declaration: { ...r.declaration, linkIds: [] } }))).ok, "a DEMONSTRATED declaration standing on no link is refused");
ok(!validateLedger(forge(l2, A, (r) => ({ ...r, links: r.links.map((l) => ({ ...l, state: "INVALID", reason: "TARGET_ABSENT" })), record: { ...r.record, targets: [] } }))).ok, "a DEMONSTRATED record whose declared link is INVALID is refused: it must be STALE");
ok(!validateLedger(forge(l2, A, (r) => ({ ...r, unstructured: true }))).ok, "an unstructured DEMONSTRATED record is refused");
ok(!validateLedger(forge(l2, A, (r) => ({ ...r, staleCauses: ["CANDIDATE_TEXT"] }))).ok, "a stale cause on a non-stale record is refused");
ok(!validateLedger(forge(lost, A, (r) => ({ ...r, staleCauses: [] }))).ok, "a STALE record without a cause is refused");
ok(!validateLedger(forge(lost, A, (r) => ({ ...r, staleCauses: ["TARGET_LINK", "TARGET_LINK"] }))).ok && !validateLedger(forge(lost, A, (r) => ({ ...r, staleCauses: ["SOMETHING"] }))).ok, "a repeated or ungoverned cause is refused: the causes are a set drawn from the governed vocabulary");
ok(!validateLedger(forge(res.ledger, B, (r) => ({ ...r, withheldCause: null }))).ok && !validateLedger(forge(l2, A, (r) => ({ ...r, withheldCause: "EXCERPT_REMOVED" }))).ok, "a WITHHELD record without its cause, or a cause on a record not withheld, is refused");
const swapped = { ...l5, events: l5.events.map((e, i, a) => (i === a.length - 2 ? a[a.length - 1] : i === a.length - 1 ? a[a.length - 2] : e)) };
ok(!validateLedger(swapped).ok && /seq .* does not equal its position/.test(validateLedger(swapped).errors[0]), "two events at one instant reordered against their seq are refused (conformance-auditor W-2: order at one instant is a property, not an accident of array order)");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: A, linkId: null, kind: "STALE_CAUSE", from: null, to: null, reason: "TARGET_RESTORED", actor: LEDGER_ACTOR.SYSTEM })).ok, "STALE_CAUSE admits only the reason a fold can make true (SOURCE_TEXT_CHANGED); the target's return is never a cause change, because a record stale for its text is not judged");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: A, linkId: null, kind: "STATE_SET", from: "CLAIMED_ONLY", to: "DEMONSTRATED", reason: "HUMAN_DECLARATION", actor: LEDGER_ACTOR.SYSTEM })).ok, "a declaration attributed to the system is refused");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: A, linkId: null, kind: "STATE_SET", from: "STALE", to: "DEMONSTRATED", reason: "HUMAN_DECLARATION", actor: LEDGER_ACTOR.HUMAN })).ok, "a declaration from STALE is refused as an event (Q5 at the event level)");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: A, linkId: null, kind: "CONFLICT_DECLARED", from: "CLAIMED_ONLY", to: "CONFLICTING", reason: "HUMAN_DECLARATION", actor: LEDGER_ACTOR.HUMAN })).ok, "a conflict declared from CLAIMED_ONLY is refused as an event");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: A, linkId: null, kind: "RESUMED", from: "STALE", to: "CLAIMED_ONLY", reason: "TARGET_RESTORED", actor: LEDGER_ACTOR.HUMAN })).ok && !validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: A, linkId: null, kind: "RESUMED", from: "WITHHELD", to: "CLAIMED_ONLY", reason: "STATE_WITHDRAWN", actor: LEDGER_ACTOR.SYSTEM })).ok, "each resume reason names its actor: a system reason by a human, or a human reason by the system, is refused");
ok(REASONS_BY_KIND.STATE_SET.length === 1 && REASONS_BY_KIND.CONFLICT_DECLARED.length === 1 && REASONS_BY_KIND.CONFLICT_RESOLVED.length === 1 && REASONS_BY_KIND.STALE.includes("TARGET_LINK_LOST") && REASONS_BY_KIND.RESUMED.includes("CONFLICT_DISSOLVED"), "the new reasons are governed by kind");
deq([...CONFLICT_RESOLUTION], ["DEMONSTRATED", "CERTIFIED", "WITHHELD"], "the resolutions are the three the contract admits from CONFLICTING besides STALE");
eq(JSON.stringify(declareProofState(l1, A, "DEMONSTRATED", t(3), { bundle }).ledger), JSON.stringify(l2), "declaring is deterministic");
eq(JSON.stringify(reconcileLinks(l2, bundle2, t(5))), JSON.stringify(lost), "the lost-link path is deterministic");
eq(JSON.stringify(declareConflict(l4, A, B, { targetKind: "duty", targetId: dutyT.targetId }, t(6), { bundle }).ledger), JSON.stringify(l5), "declaring a conflict is deterministic");
ok(ledgerRows(l5, { bundle }).every((r) => r.stateText === proofStateText(r.state)), "every row's state text is the adapter's");

console.log(`Part A (node): PASS, ${checks} checks`);
fs.mkdirSync("test-results/proof-states", { recursive: true });
fs.writeFileSync("test-results/proof-states/sample-ledger.json", JSON.stringify(res.ledger, null, 2));
if (process.env.PROOF_STATES_NODE_ONLY === "1") { console.log("Part B (browser): NOT_RUN (PROOF_STATES_NODE_ONLY=1)"); process.exit(0); }

// ---------------------------------------------------------------------------------------------
// Part B (harness shared with tests/proof-links.mjs)
// ---------------------------------------------------------------------------------------------
const { chromium } = await import("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const MCF_BODY = ["Responsibilities", "- Monitor operational data and investigate service exceptions across the payments platform", "- Prepare the monthly management accounts and variance commentary for the finance director", "- Support various ad-hoc reporting requests and other duties as assigned to the operations team", "- Coordinate quarterly access reviews with the technology risk function and document outcomes", "Requirements", "- Knowledge of SQL and data pipelines is required for this role", "- Degree in accountancy, business or a related discipline", "- At least three years in an operations or finance operations role", "Benefits", "- Hybrid working arrangement with two office days a week"].join("\n");
const job = { uuid: "MCF-2026-000123", title: "Operations Analyst", employer: "EXAMPLE BANK LTD", description: MCF_BODY, responsibilitiesText: MCF_BODY, skills: ["Data Analytics", "SQL", "Operations"], categories: ["Banking and Finance"], employmentType: "Permanent", positionLevels: ["Professional"], salaryMin: 5000, salaryMax: 7000, postedDate: "2026-09-01T00:00:00.000Z", postedDateRaw: "2026-09-01", source: "MyCareersFuture", mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000123" };
const job2 = { ...job, uuid: "MCF-2026-000456", title: "Finance Operations Lead", description: MCF_BODY + "\n- Lead the quarterly close for the regional entities", responsibilitiesText: MCF_BODY + "\n- Lead the quarterly close for the regional entities", mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000456" };
const companyPayload = { query: job.employer, queryKey: "example bank ltd", ambiguous: false, totalPostings: 2, pagesPolled: 1, matches: [{ key: "example bank ltd", displayName: job.employer, name: job.employer, count: 2, jobs: [job, job2] }] };
const duties = ["Monitor operational data and investigate service exceptions across the payments platform", "Prepare the monthly management accounts and variance commentary for the finance director", "Support various ad-hoc reporting requests and other duties as assigned to the operations team", "Coordinate quarterly access reviews with the technology risk function and document outcomes"];
const respFx = JSON.stringify({ summary: "Runs operational monitoring and finance reporting for the payments platform.", responsibilities: duties.map((text, i) => ({ n: i + 1, text, cat: "Delivery & Execution", freq: "Core", sk: [] })) });
const MARKER = "LINK-MARKER-DO-NOT-PERSIST";
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
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text }], model: "proof-states-fixture" }) });
  });
  return page;
}
const select = (page, start, end) => page.getByTestId("person-evidence-paste").evaluate((el, [s, e]) => { el.focus(); el.setSelectionRange(s, e); }, [start, end]);
const links = (page) => page.locator('[data-testid="cpl-link"]').evaluateAll((els) => els.map((el) => ({ id: el.dataset.linkId, kind: el.dataset.targetKind, targetId: el.dataset.targetId, state: el.dataset.state, reason: el.dataset.reason, text: el.querySelector('[data-testid="cpl-link-target-text"]')?.textContent, stateText: el.querySelector('[data-testid="cpl-link-state"]')?.textContent })));

// The notice is derived from the kept ledger in an effect, so it lands one render after the row it
// describes (run 34236469225 raced the BLP-008 suite's equivalent read at phone width). The wait is
// for the notice to CHANGE from what it said before the action, never for the expected words: each
// assertion that follows keeps its power to fail, with its message, when the notice says the wrong
// thing (Supervisor finding on 22d2413). A wait for "non-empty" would not do either, because the
// notice usually still carries the previous action's text.
const noticeText = (page) => page.getByTestId("cpl-notice").textContent();
const noticeChanged = (page, prev) => page.waitForFunction((before) => { const t = document.querySelector('[data-testid="cpl-notice"]')?.textContent || ""; return t.trim().length > 0 && t !== before; }, prev, { timeout: 5000 });

const stateOf = (page, i) => page.locator('[data-testid="cpl-record"]').nth(i).getAttribute("data-state");
const stateTextOf = (page, i) => page.locator('[data-testid="cpl-record"]').nth(i).locator('[data-testid="cpl-record-state-text"]').innerText();
const waitState = (page, i, state) => page.waitForFunction(([n, s]) => document.querySelectorAll('[data-testid="cpl-record"]')[n]?.dataset.state === s, [i, state], { timeout: 5000 });
async function runViewport({ name, width, height, phone }) {
  const page = await newPage({ width, height });
  const tag = phone ? "phone" : "desktop";
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

  // 1. Two excerpts confirmed; the first linked to a verified duty. Words come from the adapter.
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
  eq(await stateTextOf(page, 0), proofStateText("CLAIMED_ONLY"), `${tag}: the rendered CLAIMED_ONLY words equal the adapter's (fails if a local gloss returns)`);
  ok(/Demonstrated is not offered: not yet linked to a target/.test(await page.locator('[data-testid="cpl-declare-why"]').first().innerText()), `${tag}: with no link, demonstrated is withheld with the reason`);
  ok(await page.getByTestId("cpl-declare-demonstrated").first().isDisabled(), `${tag}: the demonstrated control is disabled without a standing link`);
  const options = await page.getByTestId("cpl-link-select").first().locator("option").evaluateAll((els) => els.map((o) => o.value).filter(Boolean));
  const dutyOption = options.find((v) => v.startsWith("duty|"));
  await page.getByTestId("cpl-link-select").first().selectOption(dutyOption);
  let before = await noticeText(page);
  await page.getByTestId("cpl-link-button").first().click();
  await noticeChanged(page, before);
  await page.waitForFunction(() => !document.querySelector('[data-testid="cpl-declare-demonstrated"]')?.disabled, null, { timeout: 5000 });
  const firstWhy = page.locator('[data-testid="cpl-record"]').first().locator('[data-testid="cpl-declare-why"]');
  ok((await firstWhy.count()) === 0, `${tag}: with a standing link the first record's withholding reason is gone (the second, unlinked record keeps its own)`);
  ok(/not yet linked to a target/.test(await page.locator('[data-testid="cpl-record"]').nth(1).locator('[data-testid="cpl-declare-why"]').innerText()), `${tag}: the unlinked record still says why demonstrated is not offered`);

  // 2. Declare demonstrated on the standing link; withdraw; declare certified on the second.
  before = await noticeText(page);
  await page.getByTestId("cpl-declare-demonstrated").first().click();
  await noticeChanged(page, before);
  await waitState(page, 0, "DEMONSTRATED");
  eq(await stateTextOf(page, 0), proofStateText("DEMONSTRATED"), `${tag}: the rendered DEMONSTRATED words equal the adapter's`);
  ok(/Declared DEMONSTRATED at/.test(await noticeText(page)) && /standing against the posting evidence at declaration/.test(await noticeText(page)), `${tag}: the notice says what was declared and on what`);
  ok(/declared demonstrated by you at/.test(await page.locator('[data-testid="cpl-uses"]').first().innerText()), `${tag}: downstream uses carry the declaration`);
  ok(!/proof state is/.test(await page.locator('[data-testid="cpl-missing"]').first().innerText()), `${tag}: missing evidence no longer names the state`);
  ok(await page.getByTestId("cpl-unlink").first().isEnabled(), `${tag}: the unlink control stays enabled (the refusal comes from the data layer, in words)`);
  before = await noticeText(page);
  await page.getByTestId("cpl-unlink").first().click();
  await noticeChanged(page, before);
  ok(/Refused: this proof is marked demonstrated on this link; change its state first/.test(await noticeText(page)), `${tag}: unlinking the declared link is refused in words that keep the human in charge (fails if the record is staled instead)`);
  eq(await stateOf(page, 0), "DEMONSTRATED", `${tag}: and the record is unchanged`);
  before = await noticeText(page);
  await page.getByTestId("cpl-withdraw").first().click();
  await noticeChanged(page, before);
  await waitState(page, 0, "CLAIMED_ONLY");
  ok(/Declaration withdrawn at/.test(await noticeText(page)) && /CLAIMED_ONLY again/.test(await noticeText(page)), `${tag}: withdrawal is said in words`);
  eq(await stateTextOf(page, 0), proofStateText("CLAIMED_ONLY"), `${tag}: back to the adapter's CLAIMED_ONLY words`);
  before = await noticeText(page);
  await page.getByTestId("cpl-declare-certified").nth(1).click();
  await noticeChanged(page, before);
  await waitState(page, 1, "CERTIFIED");
  eq(await stateTextOf(page, 1), proofStateText("CERTIFIED"), `${tag}: the rendered CERTIFIED words equal the adapter's`);
  await page.getByTestId("cpl-type-select").nth(1).selectOption("WORK_SAMPLE");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-record"]')[1]?.dataset.proofType === "WORK_SAMPLE", null, { timeout: 5000 });
  ok(/declared CERTIFIED while its proof type is work sample, whose ruled reading is DEMONSTRATED; shown, not refused/.test(await page.locator('[data-testid="cpl-type-state-note"]').first().innerText()), `${tag}: a proof-type mismatch is shown in words and the state is not refused`);
  eq(await stateOf(page, 1), "CERTIFIED", `${tag}: the mismatch moved nothing`);

  // 3. Conflict: both records demonstrated on the same duty, declared in conflict, resolved for both.
  before = await noticeText(page);
  await page.getByTestId("cpl-declare-demonstrated").first().click();
  await noticeChanged(page, before);
  await waitState(page, 0, "DEMONSTRATED");
  await page.getByTestId("cpl-link-select").nth(1).selectOption(dutyOption);
  before = await noticeText(page);
  await page.getByTestId("cpl-link-button").nth(1).click();
  await noticeChanged(page, before);
  await page.getByTestId("cpl-conflict-select").first().waitFor({ state: "visible", timeout: 5000 });
  const conflictOptions = await page.getByTestId("cpl-conflict-select").first().locator("option").evaluateAll((els) => els.map((o) => o.value).filter(Boolean));
  ok(conflictOptions.length === 1 && /\|duty\|/.test(conflictOptions[0]), `${tag}: exactly one conflict candidate is offered, the other accepted record over the shared duty (fails if a conflict is offered over a target not shared)`);
  await page.getByTestId("cpl-conflict-select").first().selectOption(conflictOptions[0]);
  before = await noticeText(page);
  await page.getByTestId("cpl-conflict-declare").first().click();
  await noticeChanged(page, before);
  await waitState(page, 0, "CONFLICTING");
  await waitState(page, 1, "CONFLICTING");
  eq(await stateTextOf(page, 0), proofStateText("CONFLICTING"), `${tag}: the rendered CONFLICTING words equal the adapter's`);
  ok(/Conflict declared at .* for both records/.test(await noticeText(page)), `${tag}: the notice says both records entered the conflict`);
  ok((await page.locator('[data-testid="cpl-resolve"]').count()) === 2, `${tag}: both sides offer the resolution, for both`);
  await page.getByTestId("cpl-resolve-this").first().selectOption("DEMONSTRATED");
  await page.getByTestId("cpl-resolve-counterpart").first().selectOption("WITHHELD");
  before = await noticeText(page);
  await page.getByTestId("cpl-resolve-button").first().click();
  await noticeChanged(page, before);
  await waitState(page, 0, "DEMONSTRATED");
  await waitState(page, 1, "WITHHELD");
  ok(/Conflict resolved at .* for both records/.test(await noticeText(page)), `${tag}: resolution is said for both`);
  eq(await stateTextOf(page, 1), proofStateText("WITHHELD"), `${tag}: the rendered WITHHELD words equal the adapter's`);
  ok(/withheld this excerpt at a conflict's resolution/.test(await page.getByTestId("cpl-state-withheld-note").innerText()) && /offer it again/.test(await page.getByTestId("cpl-state-withheld-note").innerText()), `${tag}: the withheld note says the cause and what resumes it`);
  ok((await page.locator('[data-testid="cpl-record"]').first().locator('[data-testid="cpl-conflict-none"]').count()) === 1 && /No conflict can be declared/.test(await page.locator('[data-testid="cpl-record"]').first().locator('[data-testid="cpl-conflict-none"]').innerText()), `${tag}: with the counterpart withheld the demonstrated record says no conflict can be declared (fails if a candidate is offered over a record that is not accepted)`);
  // Re-applying the same evidence does not resume the withheld side (W-1); the human's offer does.
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-events"] li').length > 0, null, { timeout: 5000 });
  await page.waitForFunction(() => (document.querySelectorAll('[data-testid="cpl-record"]')[1]?.querySelectorAll('[data-testid="cpl-events"] li').length || 0) > 0, null, { timeout: 5000 });
  eq(await stateOf(page, 1), "WITHHELD", `${tag}: applying the same evidence again leaves the record withheld at resolution WITHHELD (fails if an unchanged apply undoes the resolution)`);
  ok(await page.getByTestId("cpl-offer-again").isEnabled(), `${tag}: the offer-again control is offered on the record withheld at resolution`);
  before = await noticeText(page);
  await page.getByTestId("cpl-offer-again").click();
  await noticeChanged(page, before);
  await waitState(page, 1, "CLAIMED_ONLY");
  ok(/Offered again at .*CLAIMED_ONLY again/.test(await noticeText(page)), `${tag}: the offer is said in words`);
  ok((await page.locator('[data-testid="cpl-offer-again"]').count()) === 0, `${tag}: the control is gone once the record is claimed only`);

  // 4. The candidate text changes: the demonstrated record goes stale with the adapter's sentence and its cause beside it; restore resumes as claimed only.
  await textarea.fill(`${CV}\nAppended line.`);
  await textarea.evaluate((el) => el.blur());
  await page.getByTestId("person-evidence-excerpt-remove").first().click();
  await page.getByTestId("person-evidence-excerpt-remove").first().click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 0, null, { timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await waitState(page, 0, "STALE");
  eq(await stateTextOf(page, 0), proofStateText("STALE"), `${tag}: the rendered STALE words are staleText('proof') verbatim`);
  ok(/cause: the pasted text changed/.test(await page.locator('[data-testid="cpl-stale-cause"]').first().innerText()) && (await page.locator('[data-testid="cpl-stale-cause"]').first().getAttribute("data-cause")) === "CANDIDATE_TEXT", `${tag}: the cause is said beside the definition, not inside it, in the data layer's words`);
  ok(/Linking waits until this proof record is active again \(it is STALE for its text\)/.test(await page.locator('[data-testid="cpl-link-blocked"]').first().innerText()), `${tag}: linking on a text-stale record is blocked with the reason (a link-stale record would not be)`);
  await textarea.fill(CV);
  await textarea.evaluate((el) => el.blur());
  await select(page, 0, WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await waitState(page, 0, "CLAIMED_ONLY");
  ok(await stateOf(page, 0) === "CLAIMED_ONLY", `${tag}: restoring the text resumes the record as CLAIMED_ONLY, never as DEMONSTRATED (Q5)`);
  const storage = await page.evaluate(async () => { const dbs = typeof indexedDB.databases === "function" ? await indexedDB.databases() : []; return `${Object.values(localStorage).join(" ")} ${Object.values(sessionStorage).join(" ")} ${document.cookie} ${JSON.stringify(dbs)}`; });
  ok(!storage.includes(MARKER) && !/DEMONSTRATED|CONFLICTING/.test(storage), `${tag}: no state reaches browser storage`);
  const boxes = await page.locator('[data-testid="cpl-declare-demonstrated"], [data-testid="cpl-declare-certified"], [data-testid="cpl-withdraw"], [data-testid="cpl-resolve-button"], [data-testid="cpl-conflict-declare"], [data-testid="cpl-offer-again"], [data-testid="cpl-conflict-select"], [data-testid="cpl-resolve-this"], [data-testid="cpl-resolve-counterpart"], [data-testid="cpl-link-select"]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  ok(boxes.length >= 1 && boxes.every((h) => h >= 44), `${tag}: every state control is at least 44px tall (${boxes.map(Math.round).join(", ")})`);
  const geometry = await ledger.evaluate((el) => ({ right: el.getBoundingClientRect().right, viewport: window.innerWidth }));
  ok(geometry.right <= geometry.viewport + 1, `${tag}: the ledger does not overflow the viewport`);
  await page.screenshot({ path: `test-results/proof-states/${name}.png`, fullPage: true });
  await page.close();
}
try {
  await runViewport({ name: "desktop-1440x1000", width: 1440, height: 1000, phone: false });
  await runViewport({ name: "phone-430x932", width: 430, height: 932, phone: true });
} finally { await browser.close(); }
ok(errors.length === 0, `no page or console errors: ${errors.join(" | ")}`);
console.log(`Part B (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
