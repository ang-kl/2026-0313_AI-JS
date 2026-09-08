// BLP-008 structured candidate-proof ledger: distinct source-linked records that remember.
//
// Part A (node): the ledger over BLP-007 payloads. Every assertion names, in its message, what
// would make it fail, per the Blueprint Supervisor's standing observation on vacuous
// verification. Part B (Chromium at 1440x1000 and 430x932): the panel under the ingress.
//
// Run: node tests/candidate-proof-ledger.mjs            (BASE_URL defaults to http://127.0.0.1:4173)
//      CANDIDATE_PROOF_LEDGER_NODE_ONLY=1 node tests/candidate-proof-ledger.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LEDGER_VERSION, PROOF_TYPE, PROOF_TYPE_VOCABULARY_STATUS, LEDGER_ACTOR,
  createEmptyLedger, applyEvidenceToLedger, setProofType, setClaimText, ledgerRows, ledgerCounts,
  validateLedger, validateLedgerEvent, createLedgerEvent, missingEvidenceOf, validatePayloadProof,
} from "../src/work-universe/candidateProofLedgerData.js";
import { buildManualPersonSource, buildManualPersonEvidence, markExcerpt } from "../src/work-universe/personEvidenceData.js";
import { validateProofRecord, isProofTransitionPermitted, CONTRACT_VERSION } from "../src/contracts/evidenceContracts.js";
import { LOCAL_HUMAN_ACTOR } from "../src/review/reviewerContract.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };
const deq = (a, b, msg) => { checks += 1; assert.deepEqual(a, b, msg); };
const t = (n) => `2026-09-08T12:${String(n).padStart(2, "0")}:00.000Z`;
const kinds = (ledger, id) => ledger.events.filter((e) => e.proofId === id).map((e) => e.kind);

// ---------------------------------------------------------------------------------------------
// Part A
// ---------------------------------------------------------------------------------------------
const TEXT = "Led migration of 40 pipelines to Airflow in 2025.\nCoordinated quarterly access reviews.";
const source = buildManualPersonSource(TEXT);
const a = markExcerpt(source, 0, 49).span, b = markExcerpt(source, 50, source.text.length).span;
const ex = (span) => ({ start: span.start, end: span.end, sourceTextHash: span.sourceTextHash });
const pay = (raw, excerpts, n) => buildManualPersonEvidence({ rawText: raw, confirmed: true, excerpts, confirmedAt: t(n) });

// A1 empty ledger and a null payload
const empty = createEmptyLedger();
ok(validateLedger(empty).ok, "an empty ledger validates (fails if the ledger or contract version constants drift)");
const stillEmpty = applyEvidenceToLedger(empty, null, t(1));
eq(stillEmpty.events.length, 0, "clearing an empty ledger records no event (fails if a phantom event is minted)");
ok((() => { try { applyEvidenceToLedger(empty, null, "yesterday"); return false; } catch (e) { return /ISO instant/.test(e.message); } })(), "a non-instant clock is a programmer error and throws (fails if the ledger defaults a time)");

// A2 two confirmed excerpts become two distinct, source-linked records
const p1 = pay(source.text, [ex(a), ex(b)], 1);
const l1 = applyEvidenceToLedger(empty, p1, t(1));
eq(l1.records.length, 2, "one record per confirmed excerpt (fails if records merge or duplicate)");
ok(new Set(l1.records.map((r) => r.id)).size === 2, "record ids are distinct (fails if two excerpts share a proof id)");
ok(l1.records.every((r) => r.id.startsWith("proof:") && r.sourceId === p1.sourceId && r.spanId.startsWith(`span:${p1.sourceId}:`) && r.sourceTextHash === source.textHash), "every record is linked to its source id, span id and source hash (fails if any link is missing or points elsewhere)");
ok(l1.records.every((r) => validateProofRecord(r.record).ok && r.record.id === r.id), "every record carries a contract ProofRecord that validates under the same id (fails on any contract drift)");
ok(l1.records.every((r) => r.record.state === "CLAIMED_ONLY"), "confirmed excerpts enter CLAIMED_ONLY (fails if a record enters WITHHELD or DEMONSTRATED)");
ok(l1.records.every((r) => kinds(l1, r.id).join() === "RECORDED"), "history begins with exactly one RECORDED event per record");
ok(l1.events.every((e) => e.actor === LEDGER_ACTOR.HUMAN && e.reason === "EXCERPT_CONFIRMED"), "recording follows the human's confirmation (fails if attributed to the system)");
ok(validateLedger(l1).ok, `the ledger validates after recording (${validateLedger(l1).errors[0] || "no errors"})`);
eq(l1.records[0].excerptText, a.text, "the exact excerpt text rides on the record (fails on a paraphrase or an empty string)");
ok(!empty.records.length && !empty.events.length, "the previous ledger is not mutated (fails if apply writes into its input)");

// A3 the fields criterion (ii) names, computed and never typed
const rows1 = ledgerRows(l1);
eq(rows1[0].claimText, null, "the claim is null until the human types it (fails if pre-filled from the excerpt)");
eq(rows1[0].proofType, "UNSPECIFIED", "proof type is UNSPECIFIED until chosen");
eq(rows1[0].confirmation.confirmedBy, LOCAL_HUMAN_ACTOR.id, "confirmation names the local human actor");
eq(rows1[0].confirmation.confirmedAt, t(1), "confirmation carries the payload's time");
for (const phrase of ["no claim stated in your own words", "no proof type chosen", "not yet linked to a target", "no destination approved yet", "not DEMONSTRATED or CERTIFIED"]) ok(rows1[0].missingEvidence.some((m) => m.includes(phrase)), `missing evidence names "${phrase}" (fails if the computed list omits it)`);
ok(!rows1[0].missingEvidence.some((m) => /whole pasted text/.test(m)), "an exact excerpt is not reported as unstructured");
deq(rows1[0].downstreamUses.text, ["not yet linked to a target (see target links)", "no destinations approved yet (see destination approvals)"], "downstream uses say nothing is linked or approved YET, in words, never WITHHELD and never as a finding about worth");
ok(!JSON.stringify(rows1[0].downstreamUses).includes("WITHHELD"), "a known UNSET is not falsely withheld");
const whole = applyEvidenceToLedger(empty, pay(source.text, [], 1), t(1));
ok(missingEvidenceOf(whole.records[0]).some((m) => /whole pasted text/.test(m)), "the whole-text proof is a record whose missing evidence says no exact excerpt was marked");

// A4 any edit stales EVERY active record together, detected by the system (Supervisor correction 2)
const edited = source.text + "\nAppended line.";
const p2 = pay(edited, [], 2);
const l2 = applyEvidenceToLedger(l1, p2, t(2));
const oldIds = l1.records.map((r) => r.id);
ok(oldIds.every((id) => l2.records.find((r) => r.id === id).record.state === "STALE"), "every record cut from the earlier text is STALE after an edit (fails if any survives or one is singled out)");
ok(oldIds.every((id) => { const e = l2.events.find((x) => x.proofId === id && x.kind === "STALE"); return e && e.actor === LEDGER_ACTOR.SYSTEM && e.reason === "SOURCE_TEXT_CHANGED" && e.from === "CLAIMED_ONLY"; }), "each staleness event is a system detection with reason SOURCE_TEXT_CHANGED from CLAIMED_ONLY");
eq(l2.records.length, 3, "the new text's record is added beside the stale ones (fails if stale records are dropped)");
eq(l2.records.find((r) => r.sourceId === p2.sourceId).record.state, "CLAIMED_ONLY", "the record on the new text is CLAIMED_ONLY");
ok(validateLedger(l2).ok, "the ledger validates after staleness");
ok(isProofTransitionPermitted("CLAIMED_ONLY", "STALE"), "the transition used is one the contract permits");

// A5 reverting the text resumes the SAME record: no duplicate, history intact (Supervisor correction 1)
const p3 = pay(source.text, [ex(a), ex(b)], 3);
const l3 = applyEvidenceToLedger(l2, p3, t(3));
eq(l3.records.length, 3, "reverting the text adds no record (fails with a duplicate proof id when the same source and span ids recur)");
ok(oldIds.every((id) => l3.records.find((r) => r.id === id).record.state === "CLAIMED_ONLY"), "the earlier records resume CLAIMED_ONLY");
deq(kinds(l3, oldIds[0]), ["RECORDED", "STALE", "RESUMED"], "the resumed record keeps its full history (fails if a resumed record lost the STALE event or restarted at RECORDED)");
eq(l3.events.filter((e) => e.kind === "RESUMED")[0].reason, "SOURCE_TEXT_RESTORED", "resumption names its reason");
eq(l3.records.find((r) => r.sourceId === p2.sourceId).record.state, "STALE", "the edited text's record is stale in turn");
ok(validateLedger(l3).ok, "the ledger validates after resumption");

// A6 removing one excerpt on the same text withholds that record by a human act; the other is reconfirmed
const p4 = pay(source.text, [ex(a)], 4);
const l4 = applyEvidenceToLedger(l3, p4, t(4));
const bId = l1.records.find((r) => r.spanId === b.id).id, aId = l1.records.find((r) => r.spanId === a.id).id;
eq(l4.records.find((r) => r.id === bId).record.state, "WITHHELD", "the removed excerpt's record is WITHHELD, not deleted (fails if it vanishes or goes STALE)");
const removedEvent = l4.events.find((e) => e.proofId === bId && e.kind === "WITHHELD");
ok(removedEvent && removedEvent.reason === "EXCERPT_REMOVED" && removedEvent.actor === LEDGER_ACTOR.HUMAN, "removal is a human act with reason EXCERPT_REMOVED");
eq(kinds(l4, aId).at(-1), "RECONFIRMED", "the excerpt still offered is reconfirmed without a state change");
ok(validateLedger(l4).ok, "the ledger validates after removal");

// A7 clearing withholds every active record; re-applying resumes
const l5 = applyEvidenceToLedger(l4, null, t(5));
eq(l5.records.find((r) => r.id === aId).record.state, "WITHHELD", "clearing withholds the active record");
eq(l5.events.at(-1).reason, "EVIDENCE_CLEARED", "clearing names its reason");
const l6 = applyEvidenceToLedger(l5, pay(source.text, [ex(a)], 6), t(6));
eq(l6.records.find((r) => r.id === aId).record.state, "CLAIMED_ONLY", "re-applying the same excerpt resumes the withheld record");
eq(l6.events.at(-1).reason, "EXCERPT_CONFIRMED", "resumption after a clear says the human offered the excerpt again, not that the text was restored (conformance-auditor W-4)");
eq(l6.records.length, 3, "no duplicate on resumption after a clear");
ok(validateLedger(l6).ok, "the ledger validates after clear and resume");
const garbage = applyEvidenceToLedger(l6, { supplied: true, proofs: [{ id: "proof:x" }] }, t(7));
eq(garbage.records.find((r) => r.id === aId).record.state, "CLAIMED_ONLY", "a payload that is not manual person evidence changes no record (fails if a malformed payload is read as a clear and blamed on the human)");
eq(garbage.refusals.length, 1, "and is refused on the record");
ok(garbage.refusals[0].reason === "PAYLOAD_REFUSED" && garbage.refusals[0].actor === LEDGER_ACTOR.SYSTEM, "the refusal is the system's act with reason PAYLOAD_REFUSED");
// A payload that passes the shape gate but carries junk view fields (conformance-auditor C-3): refused before any record is written.
const good = pay(source.text, [ex(a)], 7);
const junk = { ...good, proofs: [{ ...good.proofs[0], text: undefined, start: "0", end: -99, sourceTextHash: undefined }] };
ok(!validatePayloadProof(junk, junk.proofs[0]).ok, "junk view fields fail the payload-proof validator (fails if start, end, text or hash are ungoverned)");
const junked = applyEvidenceToLedger(l6, junk, t(7));
eq(junked.refusals.length, 1, "a payload with junk view fields is refused (fails if the ledger copies view fields it did not check)");
eq(JSON.stringify(junked.records), JSON.stringify(l6.records), "and no record changed");
const offRange = { ...good, proofs: [{ ...good.proofs[0], start: 999, end: 1200 }] };
ok(!validatePayloadProof(offRange, offRange.proofs[0]).ok, "offsets outside the text are refused even when the text field looks fine");
ok(validateLedger(junked).ok, "a ledger carrying refusals still validates");

// A8 proof type: a governed enum with a validator; anything else refused
eq(PROOF_TYPE_VOCABULARY_STATUS, "PROVISIONAL_PENDING_HUMAN_LEAD", "the vocabulary is declared provisional until the Human Lead confirms it");
ok(Object.isFrozen(PROOF_TYPE) && PROOF_TYPE[0] === "UNSPECIFIED", "the enum is frozen with UNSPECIFIED as its first, default member (fails if the vocabulary can be extended at runtime or the default is a real type)");
const typed = setProofType(l6, aId, "CREDENTIAL", t(8));
ok(typed.ok && typed.ledger.records.find((r) => r.id === aId).proofType === "CREDENTIAL", "a governed proof type is set");
eq(typed.ledger.events.at(-1).kind, "PROOF_TYPE_SET", "setting a proof type is an event");
eq(typed.ledger.events.at(-1).actor, LEDGER_ACTOR.HUMAN, "attributed to the human");
const refused = setProofType(l6, aId, "hunch", t(8));
ok(!refused.ok && JSON.stringify(refused.ledger.records) === JSON.stringify(l6.records), "a proof type outside the enum is refused and no record changes (fails if the field accepts anything)");
eq(refused.ledger.refusals.length, l6.refusals.length + 1, "and the refusal is on the ledger's record, not lost (fails if a refused choice leaves no trace)");
ok(refused.ledger.refusals.at(-1).reason === "CHOICE_REFUSED" && /not governed/.test(refused.ledger.refusals.at(-1).detail), "with reason CHOICE_REFUSED naming the value");
ok(!setClaimText(l6, "proof:nobody", "x", t(8)).ok && setClaimText(l6, "proof:nobody", "x", t(8)).ledger.refusals.length === l6.refusals.length + 1, "a claim on an unknown record is refused on the record too");
ok(validateLedger(refused.ledger).ok, "a ledger carrying a choice refusal validates");
const tampered = { ...typed.ledger, records: typed.ledger.records.map((r) => (r.id === aId ? { ...r, proofType: "hunch" } : r)) };
ok(!validateLedger(tampered).ok && /not governed/.test(validateLedger(tampered).errors[0]), "validateLedger refuses a record whose proof type is not governed (fails if a field no validator can reject slips through)");
ok(!missingEvidenceOf(typed.ledger.records.find((r) => r.id === aId)).some((m) => /no proof type/.test(m)), "a chosen proof type leaves the missing list");

// A9 claim: the human's own words, USER_AUTHORED, trimmed, never pre-filled
const claimed = setClaimText(typed.ledger, aId, "  I led this   migration end to end ", t(9));
eq(claimed.ledger.records.find((r) => r.id === aId).claimText, "I led this migration end to end", "the claim is stored as typed, whitespace collapsed");
eq(claimed.ledger.records.find((r) => r.id === aId).claimOrigin, "USER_AUTHORED", "the claim is USER_AUTHORED");
eq(claimed.ledger.events.at(-1).kind, "CLAIM_SET", "setting a claim is an event");
ok(!missingEvidenceOf(claimed.ledger.records.find((r) => r.id === aId)).some((m) => /no claim/.test(m)), "a stated claim leaves the missing list");
const cleared = setClaimText(claimed.ledger, aId, "   ", t(10));
eq(cleared.ledger.records.find((r) => r.id === aId).claimText, null, "an empty claim is null, not an empty string");
const badOrigin = { ...claimed.ledger, records: claimed.ledger.records.map((r) => (r.id === aId ? { ...r, claimOrigin: "AI_ASSISTED" } : r)) };
ok(!validateLedger(badOrigin).ok, "a claim with any origin but USER_AUTHORED is refused by the validator");
// A choice without its event is refused (conformance-auditor C-2): proof type and claim are derived from history like state.
const forgedType = { ...l6, records: l6.records.map((r) => (r.id === aId ? { ...r, proofType: "CREDENTIAL" } : r)) };
ok(!validateLedger(forgedType).ok && /does not follow from its history/.test(validateLedger(forgedType).errors[0]), "a proof type with no PROOF_TYPE_SET event is refused (fails if a choice can be edited without an event)");
const forgedClaim = { ...l6, records: l6.records.map((r) => (r.id === aId ? { ...r, claimText: "I did all of this personally", claimOrigin: "USER_AUTHORED" } : r)) };
ok(!validateLedger(forgedClaim).ok && /claim does not follow from its history/.test(validateLedger(forgedClaim).errors[0]), "a claim with no CLAIM_SET event is refused");
const forgedOffsets = { ...l6, records: l6.records.map((r) => (r.id === aId ? { ...r, start: 999, end: 1200 } : r)) };
ok(!validateLedger(forgedOffsets).ok, "offsets that do not match the excerpt are refused by validateLedger (fails if start and end are numbers no validator can reject)");
const forgedFlag = { ...l6, records: l6.records.map((r) => (r.id === aId ? { ...r, unstructured: "yes" } : r)) };
ok(!validateLedger(forgedFlag).ok, "a non-boolean unstructured flag is refused");
const forgedName = { ...l6, records: l6.records.map((r) => (r.id === aId ? { ...r, confirmation: { ...r.confirmation, confirmedByDisplayName: "Alice" } } : r)) };
ok(!validateLedger(forgedName).ok, "an invented confirmer display name is refused");
ok(validateLedger(claimed.ledger).ok, "the ledger validates with a claim and a proof type");
const resumedKeeps = applyEvidenceToLedger(applyEvidenceToLedger(claimed.ledger, pay(edited, [], 11), t(11)), pay(source.text, [ex(a)], 12), t(12));
const kept = resumedKeeps.records.find((r) => r.id === aId);
ok(kept.record.state === "CLAIMED_ONLY" && kept.claimText === "I led this migration end to end" && kept.proofType === "CREDENTIAL", "a record that goes stale and resumes keeps its claim and proof type (fails if resumption rebuilds the record)");

// A9b the same proof id with different payload facts refreshes the facts and says so (conformance-auditor C-1)
const wholeSpan = markExcerpt(source, 0, source.text.length).span;
const explicitWhole = applyEvidenceToLedger(empty, pay(source.text, [ex(wholeSpan)], 1), t(1));
eq(explicitWhole.records[0].unstructured, false, "the whole text marked by hand is an exact excerpt");
const thenUnstructured = applyEvidenceToLedger(explicitWhole, pay(source.text, [], 2), t(2));
eq(thenUnstructured.records.length, 1, "the unstructured proof over the same text is the same record");
eq(thenUnstructured.records[0].unstructured, true, "and its whole-text fact is refreshed (fails if the record keeps the fact it was first recorded with)");
ok(missingEvidenceOf(thenUnstructured.records[0]).some((m) => /whole pasted text/.test(m)), "so the required missing-evidence line appears");
ok(/whole pasted text/.test(thenUnstructured.events.at(-1).detail || ""), "and the RECONFIRMED event says what changed");
const backToExplicit = applyEvidenceToLedger(thenUnstructured, pay(source.text, [ex(wholeSpan)], 3), t(3));
ok(!missingEvidenceOf(backToExplicit.records[0]).some((m) => /whole pasted text/.test(m)), "marking the whole text by hand again removes the line (fails with a false 'no excerpt marked')");
// W-5: a stale record cut from the text now in the box is worded as such
const partial = applyEvidenceToLedger(applyEvidenceToLedger(l1, p2, t(2)), pay(source.text, [ex(a)], 3), t(3));
const rowsPartial = ledgerRows(partial, { currentSourceId: p1.sourceId });
const bRow = rowsPartial.find((r) => r.spanId === b.id);
ok(bRow.state === "STALE" && bRow.onCurrentSource && /no longer marked on this text/.test(bRow.missingEvidence[0]), "a stale record cut from the current text says it is no longer marked, not that the text changed (fails if the wording ignores the current source)");
ok(/text changed/.test(ledgerRows(partial, { currentSourceId: p2.sourceId }).find((r) => r.spanId === b.id).missingEvidence[0]), "while the same record against a different current text says the text changed");

// A10 determinism and event governance
eq(JSON.stringify(applyEvidenceToLedger(empty, p1, t(1))), JSON.stringify(l1), "identical inputs give byte-identical ledgers (fails on any clock, random id or map-order dependence)");
const chain = (seed) => { let l = seed; for (const [p, n] of [[p1, 1], [p2, 2], [p3, 3], [p4, 4], [null, 5]]) l = applyEvidenceToLedger(l, p, t(n)); return JSON.stringify(l); };
eq(chain(empty), chain(createEmptyLedger()), "a whole chain of applications is deterministic");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: aId, kind: "STALE", from: "CLAIMED_ONLY", to: "STALE", reason: "SOURCE_TEXT_CHANGED", actor: LEDGER_ACTOR.HUMAN })).ok, "a staleness event attributed to a human is refused (staleness is detected, not decided)");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: aId, kind: "RESUMED", from: "WITHHELD", to: "DEMONSTRATED", reason: "SOURCE_TEXT_RESTORED", actor: LEDGER_ACTOR.HUMAN })).ok, "a resumption into DEMONSTRATED is refused (WITHHELD cannot silently become accepted proof)");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: aId, kind: "RECORDED", to: "CLAIMED_ONLY", reason: "EXCERPT_CONFIRMED", actor: LEDGER_ACTOR.SYSTEM })).ok, "a RECORDED event attributed to the system is refused");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: aId, kind: "PROOF_TYPE_SET", from: null, to: null, reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN })).ok, "a PROOF_TYPE_SET that records no choice is refused (conformance-auditor W-3)");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: aId, kind: "RECONFIRMED", from: "CLAIMED_ONLY", to: "DEMONSTRATED", reason: "EXCERPT_RECONFIRMED", actor: LEDGER_ACTOR.HUMAN })).ok, "a RECONFIRMED carrying a state change is refused");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: aId, kind: "CLAIM_SET", from: null, to: "x", reason: "EXCERPT_CONFIRMED", actor: LEDGER_ACTOR.HUMAN })).ok, "a reason that cannot be true of its kind is refused");
const tamperedState = { ...l1, records: l1.records.map((r) => ({ ...r, record: { ...r.record, state: "DEMONSTRATED" } })) };
ok(!validateLedger(tamperedState).ok && /does not follow from its last state event/.test(validateLedger(tamperedState).errors[0]), "a record state that its own history does not explain is refused (fails if state can be edited without an event)");
const dup = { ...l1, records: [...l1.records, l1.records[0]] };
ok(!validateLedger(dup).ok && /duplicate/.test(validateLedger(dup).errors[0]), "a duplicate record id is refused");
const disordered = { ...l3, events: [...l3.events].reverse() };
ok(!validateLedger(disordered).ok, "out-of-order events are refused");
eq(l1.ledgerVersion, LEDGER_VERSION, "the ledger declares its version");
eq(l1.contractVersion, CONTRACT_VERSION, "and the contract version it was built under (the persistence hazard is named in the module)");
deq(ledgerCounts(l3), { total: 3, DEMONSTRATED: 0, CERTIFIED: 0, CLAIMED_ONLY: 2, WITHHELD: 0, CONFLICTING: 0, STALE: 1 }, "counts are computed from record states");

console.log(`Part A (node): PASS, ${checks} checks`);
fs.mkdirSync("test-results/candidate-proof-ledger", { recursive: true });
fs.writeFileSync("test-results/candidate-proof-ledger/sample-ledger.json", JSON.stringify(claimed.ledger, null, 2));

if (process.env.CANDIDATE_PROOF_LEDGER_NODE_ONLY === "1") { console.log("Part B (browser): NOT_RUN (CANDIDATE_PROOF_LEDGER_NODE_ONLY=1)"); process.exit(0); }

// ---------------------------------------------------------------------------------------------
// Part B
// ---------------------------------------------------------------------------------------------
const { chromium } = await import("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const MARKER = "LEDGER-MARKER-DO-NOT-PERSIST";
const BODY = `Led migration of 40 pipelines to Airflow in 2025 ${MARKER}.\nCoordinated quarterly access reviews.`;
const WANTED = `Led migration of 40 pipelines to Airflow in 2025 ${MARKER}.`;
const roleFixture = [
  { title: "Data Engineer", iscoCode: "2529", iscoGroup: "Database and network professionals not elsewhere classified", industry: "Technology", description: "Designs and maintains data pipelines and platforms.", isAltLabel: false },
  { title: "Database Designer", iscoCode: "2521", iscoGroup: "Database designers and administrators", industry: "Technology", description: "Designs database structures and data models.", isAltLabel: false },
];
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
async function newPage(viewport) {
  const page = await browser.newPage({ viewport, ...(viewport.width < 600 ? { isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" } : {}) });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource:")) errors.push(`console: ${m.text()}`); });
  await page.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  for (const [p, v] of [["**/api/mcf", { jobs: [], tier: 1, approximate: false }], ["**/api/careers", { jobs: [] }], ["**/api/ssoc", { results: [], classifications: [] }], ["**/api/esco", { occupations: [], skills: [] }], ["**/api/anatomy", { ok: true, found: false, data: null }], ["**/api/state**", { ok: false, kv: false }]]) await page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(v) }));
  await page.route("**/api/claude", async (r) => {
    let bd = {}; try { bd = r.request().postDataJSON(); } catch (_) {}
    const sys = String(bd?.system || ""); const pr = String(bd?.messages?.[0]?.content || "");
    let text = "[]";
    if (/occupational classification expert/i.test(sys) && /Search term:/i.test(pr)) text = JSON.stringify(roleFixture);
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text }], model: "candidate-proof-ledger-fixture" }) });
  });
  return page;
}
const select = (page, start, end) => page.getByTestId("person-evidence-paste").evaluate((el, [s, e]) => { el.focus(); el.setSelectionRange(s, e); }, [start, end]);
const records = (page) => page.locator('[data-testid="cpl-record"]').evaluateAll((els) => els.map((el) => ({ id: el.dataset.proofId, state: el.dataset.state, spanId: el.dataset.spanId, sourceId: el.dataset.sourceId, type: el.dataset.proofType, current: el.dataset.currentSource, text: el.querySelector('[data-testid="cpl-excerpt"]')?.textContent, missing: [...el.querySelectorAll('[data-testid="cpl-missing"] li')].map((li) => li.textContent), uses: [...el.querySelectorAll('[data-testid="cpl-uses"] li')].map((li) => li.textContent), events: [...el.querySelectorAll('[data-testid="cpl-events"] li')].map((li) => li.textContent), claimState: el.querySelector('[data-testid="cpl-claim-state"]')?.textContent, claimValue: el.querySelector('[data-testid="cpl-claim-input"]')?.value })));

async function runViewport({ name, width, height, phone }) {
  const page = await newPage({ width, height });
  const tag = phone ? "phone" : "desktop";
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  const search = page.locator('input[name="job-title"]');
  await search.waitFor({ state: "visible", timeout: 15000 });
  await search.fill("Data Engineer");
  await page.waitForTimeout(2200);
  await page.getByText("Data Engineer", { exact: true }).first().click();
  await page.getByTestId("work-universe").waitFor({ state: "visible", timeout: 60000 });
  if (phone) { await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone", null, { timeout: 15000 }); await page.getByTestId("wu-quick-fab").click(); await page.getByTestId("wu-quick-job-ad").click(); }
  else { const sh = page.getByTestId("wu-start-here"); if (await sh.count() && await sh.isVisible()) await page.getByTestId("wu-explore-full-map").click(); }
  await page.getByTestId("wu-individual-person").click();
  await page.getByTestId("wu-add-person-evidence").click();
  const ledger = page.getByTestId("candidate-proof-ledger");
  await ledger.waitFor({ state: "visible", timeout: 15000 });
  ok(await page.getByTestId("cpl-empty").isVisible(), `${tag}: an empty ledger says so in words (fails if rows are invented before any confirmation)`);
  const textarea = page.getByTestId("person-evidence-paste");

  // 1. Confirm one exact excerpt: one record, linked to the ingress's span id, CLAIMED_ONLY, claim not pre-filled.
  await textarea.fill(BODY);
  await textarea.evaluate((el) => el.blur());
  await page.waitForFunction((w) => document.querySelector('[data-testid="person-evidence-paste"]').value === w, BODY, { timeout: 5000 });
  const start = BODY.indexOf(WANTED);
  await select(page, start, start + WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  const ingressSpanId = await page.locator('[data-testid="person-evidence-excerpt"]').first().getAttribute("data-span-id");
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-record"]').length === 1, null, { timeout: 5000 });
  let rows = await records(page);
  eq(rows[0].spanId, ingressSpanId, `${tag}: the ledger record cites the same span id the ingress marked (fails if the ledger mints its own)`);
  eq(rows[0].state, "CLAIMED_ONLY", `${tag}: a confirmed excerpt is CLAIMED_ONLY`);
  eq(rows[0].text, WANTED, `${tag}: the record shows the exact excerpt under "what the document says"`);
  eq(rows[0].claimValue, "", `${tag}: the claim field is empty, never pre-filled from the excerpt`);
  ok(/No claim stated yet/.test(rows[0].claimState), `${tag}: the claim state says none is stated`);
  eq(rows[0].type, "UNSPECIFIED", `${tag}: proof type is not chosen`);
  for (const phrase of ["no claim stated in your own words", "no proof type chosen", "not yet linked to a target", "no destination approved yet"]) ok(rows[0].missing.some((m) => m.includes(phrase)), `${tag}: missing evidence lists "${phrase}"`);
  ok(rows[0].uses.some((u) => /not yet linked/.test(u)) && rows[0].uses.some((u) => /no destinations approved yet/.test(u)), `${tag}: downstream uses say "not yet", in words`);
  ok(!rows[0].uses.join(" ").includes("WITHHELD"), `${tag}: a known UNSET is not shown as withheld`);
  ok(/identity not recorded/.test(await page.getByTestId("cpl-confirmation").first().innerText()), `${tag}: the confirmer is the local human with identity withheld in words`);
  eq(rows[0].current, "true", `${tag}: the record is marked as cut from the text currently applied`);

  // 2. Human choices: proof type and claim, each an event.
  await page.getByTestId("cpl-type-select").first().selectOption("CREDENTIAL");
  await page.waitForFunction(() => document.querySelector('[data-testid="cpl-record"]')?.dataset.proofType === "CREDENTIAL", null, { timeout: 5000 });
  await page.getByTestId("cpl-claim-input").first().fill("I led this migration end to end");
  const noticeBeforeClaim = await page.getByTestId("cpl-notice").textContent();
  await page.getByTestId("cpl-claim-save").first().click();
  await page.waitForFunction(() => /Claim recorded/.test(document.querySelector('[data-testid="cpl-claim-state"]')?.textContent || ""), null, { timeout: 5000 });
  eq(await page.evaluate(() => document.activeElement?.dataset.testid || document.activeElement?.tagName), "cpl-claim-state", `${tag}: after saving, focus moves to the announced claim state, not to body (W-6)`);
  eq(await page.getByTestId("cpl-claim-state").first().getAttribute("role"), "status", `${tag}: the claim state is a status region`);
  // The notice is derived from the kept ledger in an effect, so it lands one render after the claim
  // state (run 34236469225 raced it at phone width). The wait is for the notice to CHANGE from what it
  // said before the save, not for the expected words: the assertion below keeps its power to fail with
  // its message when the notice says the wrong thing (Supervisor finding on 22d2413). A wait for
  // "non-empty" would not do, because the notice already carries the proof-type choice's text.
  await page.waitForFunction((prev) => { const t = document.querySelector('[data-testid="cpl-notice"]')?.textContent || ""; return t.trim().length > 0 && t !== prev; }, noticeBeforeClaim, { timeout: 5000 });
  ok(/Claim recorded at/.test(await page.getByTestId("cpl-notice").innerText()), `${tag}: the panel notice says the claim was recorded`);
  await page.locator('[data-testid="cpl-record"] summary').first().click();
  rows = await records(page);
  ok(/USER_AUTHORED/.test(rows[0].claimState), `${tag}: the claim is recorded USER_AUTHORED`);
  ok(rows[0].events.some((e) => /PROOF_TYPE_SET/.test(e)) && rows[0].events.some((e) => /CLAIM_SET/.test(e)), `${tag}: both choices appear in the record's history`);
  ok(!rows[0].missing.some((m) => /no claim|no proof type/.test(m)), `${tag}: the missing list no longer names the claim or the proof type`);
  ok(rows[0].events.every((e) => /identity not recorded|system/.test(e)), `${tag}: every event names its actor as the local human or the system`);

  // 3. Edit the text and apply: the old record is STALE, said in words and announced; the new one CLAIMED_ONLY.
  await textarea.fill(`${BODY}\nAppended line.`);
  await textarea.evaluate((el) => el.blur());
  await page.getByTestId("person-evidence-excerpt-remove").first().click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 0, null, { timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-record"]').length === 2, null, { timeout: 5000 });
  rows = await records(page);
  const old = rows.find((r) => r.spanId === ingressSpanId), fresh = rows.find((r) => r.spanId !== ingressSpanId);
  eq(old.state, "STALE", `${tag}: the earlier record is STALE after the edit`);
  eq(old.current, "false", `${tag}: and is marked as not cut from the current text`);
  eq(fresh.state, "CLAIMED_ONLY", `${tag}: the whole-text record on the new text is CLAIMED_ONLY`);
  ok(fresh.missing.some((m) => /whole pasted text/.test(m)), `${tag}: the whole-text record says no exact excerpt was marked`);
  const note = page.getByTestId("cpl-stale-note");
  eq(await note.getAttribute("role"), "status", `${tag}: the stale note is an announced status region`);
  ok(/stale together/.test(await note.innerText()) && /did not examine proofs one by one/.test(await note.innerText()), `${tag}: the note says every earlier record went stale together and that no per-proof examination happened`);
  eq(await ledger.getAttribute("data-stale-count"), "1", `${tag}: the stale count is one`);

  // 4. Restore the text and confirm the same excerpt: the same record resumes, no duplicate, choices kept.
  await textarea.fill(BODY);
  await textarea.evaluate((el) => el.blur());
  await select(page, start, start + WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction((id) => { const el = [...document.querySelectorAll('[data-testid="cpl-record"]')].find((r) => r.dataset.spanId === id); return el && el.dataset.state === "CLAIMED_ONLY"; }, ingressSpanId, { timeout: 5000 });
  rows = await records(page);
  eq(rows.length, 2, `${tag}: restoring the text adds no record (fails with a duplicate when the same ids recur)`);
  const resumed = rows.find((r) => r.spanId === ingressSpanId);
  eq(resumed.type, "CREDENTIAL", `${tag}: the resumed record keeps its proof type`);
  ok(/Claim recorded/.test(resumed.claimState), `${tag}: and its claim`);
  await page.locator(`[data-testid="cpl-record"][data-span-id="${ingressSpanId}"] summary`).click();
  rows = await records(page);
  ok(rows.find((r) => r.spanId === ingressSpanId).events.some((e) => /RESUMED/.test(e)) && rows.find((r) => r.spanId === ingressSpanId).events.some((e) => /STALE/.test(e)), `${tag}: the resumed record's history holds both the STALE and the RESUMED event`);
  eq(rows.find((r) => r.spanId !== ingressSpanId).state, "STALE", `${tag}: the edited text's record is stale in turn`);

  // 5. Clear: every active record is withheld, none deleted; nothing in browser storage; controls at 44px.
  await page.getByTestId("person-evidence-clear").click();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="cpl-record"]')].every((r) => r.dataset.state === "WITHHELD" || r.dataset.state === "STALE"), null, { timeout: 5000 });
  rows = await records(page);
  eq(rows.length, 2, `${tag}: clearing deletes no record`);
  eq(rows.find((r) => r.spanId === ingressSpanId).state, "WITHHELD", `${tag}: the active record is WITHHELD after clearing`);
  const proofId = rows[0].id;
  const storage = await page.evaluate(async () => { const dbs = typeof indexedDB.databases === "function" ? await indexedDB.databases() : []; return `${Object.values(localStorage).join(" ")} ${Object.values(sessionStorage).join(" ")} ${document.cookie} ${JSON.stringify(dbs)}`; });
  ok(!storage.includes(MARKER) && !storage.includes(proofId) && !/proof:/.test(storage), `${tag}: neither the pasted text nor a proof id reaches localStorage, sessionStorage, cookies or IndexedDB`);
  const boxes = await page.locator('[data-testid="cpl-type-select"], [data-testid="cpl-claim-save"], [data-testid="cpl-record"] summary').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  ok(boxes.length >= 3 && boxes.every((h) => h >= 44), `${tag}: every ledger control is at least 44px tall (${boxes.map(Math.round).join(", ")})`);
  const geometry = await ledger.evaluate((el) => ({ right: el.getBoundingClientRect().right, viewport: window.innerWidth }));
  ok(geometry.right <= geometry.viewport + 1, `${tag}: the ledger does not overflow the viewport`);
  ok(/provisional, pending the Human Lead/.test(await ledger.innerText()), `${tag}: the proof-type vocabulary is shown as provisional`);
  await page.screenshot({ path: `test-results/candidate-proof-ledger/${name}.png`, fullPage: true });
  await page.close();
}
try {
  await runViewport({ name: "desktop-1440x1000", width: 1440, height: 1000, phone: false });
  await runViewport({ name: "phone-430x932", width: 430, height: 932, phone: true });
} finally { await browser.close(); }
ok(errors.length === 0, `no page or console errors: ${errors.join(" | ")}`);
console.log(`Part B (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
