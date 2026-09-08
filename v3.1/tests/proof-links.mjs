// BLP-009 proof-to-target links: every link targets a stable role-evidence identifier from the
// posting's evidence bundle (BLP-003); target and candidate excerpts are inspectable together
// (the target's text is snapshotted at link time and labelled as such); invalidated source
// evidence invalidates dependent links without mutating any text.
//
// Part A (node): the link layer over the BLP-008 ledger and a real adapter bundle. Every
// assertion names, in its message, what would make it fail. Part B (Chromium at 1440x1000 and
// 430x932): the company flow with a MyCareersFuture fixture whose duties are deterministic
// (VERIFIED parentage), then the person lens: confirm an excerpt, link it to a duty and a
// requirement, inspect both texts together, jump to the workspace, and see the link invalidate
// when the candidate record goes stale.
//
// Run: node tests/proof-links.mjs            (BASE_URL defaults to http://127.0.0.1:4173)
//      PROOF_LINKS_NODE_ONLY=1 node tests/proof-links.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LINKABLE_TARGET_KINDS, TARGET_KIND_AVAILABILITY, LEDGER_ACTOR, LINK_STATE,
  createEmptyLedger, applyEvidenceToLedger, linkProof, unlinkProof, relinkProof, reconcileLinks, bundleTargets, judgeLink, catalogueKey, availabilityOf,
  ledgerRows, validateLedger, validateLedgerEvent, createLedgerEvent, makeLinkId, missingEvidenceOf, downstreamUsesOf, linkStanding, REASONS_BY_KIND,
  guardLedgerStep, activeLedgerFault, ledgerFaultText, validateLedgerFault, createLedgerFault,
} from "../src/work-universe/candidateProofLedgerData.js";
import { buildManualPersonSource, buildManualPersonEvidence, markExcerpt } from "../src/work-universe/personEvidenceData.js";
import { buildPostingEvidence, DUTY_EXTRACTION_VERSION } from "../src/contracts/evidenceAdapter.js";
import { PROOF_TARGET_KIND, validateProofRecord, sha256Hex } from "../src/contracts/evidenceContracts.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };
const deq = (a, b, msg) => { checks += 1; assert.deepEqual(a, b, msg); };
const t = (n) => `2026-09-08T12:${String(n).padStart(2, "0")}:00.000Z`;

// ---------------------------------------------------------------------------------------------
// Part A
// ---------------------------------------------------------------------------------------------
const BODY = ["Responsibilities", "- Monitor operational data and investigate service exceptions across the payments platform", "- Prepare the monthly management accounts and variance commentary for the finance director", "Requirements", "- Knowledge of SQL and data pipelines is required for this role", "- Degree in accountancy, business or a related discipline"].join("\n");
const posting = (uuid, text) => ({ uuid, source: "MyCareersFuture", text, description: text, textField: "description", textProvenance: { description: { cap: 30000, originalLength: text.length, truncated: false } } });
const DUTIES = ["Monitor operational data and investigate service exceptions across the payments platform", "Prepare the monthly management accounts and variance commentary for the finance director", "Own the leadership of a team that the posting never mentions"];
const deepFreeze = (o) => { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
const buildBundle = (uuid, text, duties) => buildPostingEvidence({ posting: posting(uuid, text), duties, extractionVersion: "responsibilities-1", retrievedAt: t(0) });
// The bundle is deep-frozen: any attempt by the link layer to mutate posting text, rows or spans
// throws in strict-mode ESM instead of passing silently (conformance-auditor S-1).
const bundle = deepFreeze(buildBundle("MCF-2026-000123", BODY, DUTIES));
const bundleSnapshot = JSON.stringify(bundle);
const catalogue = bundleTargets(bundle);
const dutyT = catalogue.targets.find((x) => x.targetKind === "duty"), reqT = catalogue.targets.find((x) => x.targetKind === "requirement");
const untrusted = catalogue.unlinkable.find((u) => u.reason === "TARGET_UNTRUSTED");

// A1 the catalogue offers only stable, trusted identifiers
eq(bundle.state, "OK", "the fixture bundle is canonical (fails if the posting identity or text is refused, which would make every later assertion vacuous)");
deq([...LINKABLE_TARGET_KINDS], ["duty", "requirement"], "only duties and requirements are linkable today (fails if a kind without an identifier class is admitted)");
ok(PROOF_TARGET_KIND.every((k) => TARGET_KIND_AVAILABILITY[k]), "every contract target kind has a declared availability (fails if a kind is neither linkable nor refused with words)");
ok(catalogue.targets.length === 4 && catalogue.targets.every((x) => /^(duty:[0-9a-f]{24}|span:src:[a-z]+:[^\s]+:\d+-\d+)$/.test(x.targetId)), `every offered target id is a content-addressed duty id or an offset span id (${catalogue.targets.map((x) => x.targetId).join(", ")})`);
ok(catalogue.targets.every((x) => x.sourceId === bundle.source.id && x.sourceTextHash === bundle.source.textHash && x.derivationState === "VERIFIED"), "every offered target carries its source id, source hash and VERIFIED parentage");
ok(untrusted && /UNVERIFIED/.test(untrusted.detail), "the AI-only duty is unlinkable with its parentage named (fails if an unverified distillation can be targeted)");
eq(bundleTargets(null).sourceId, null, "no bundle offers no targets");
eq(bundleTargets(null).unlinkable[0].reason, "NO_BUNDLE", "and says why");
const notOk = { ...bundle, state: "CONFLICTING_EVIDENCE", validation: { ok: false, errors: ["x"] } };
eq(bundleTargets(notOk).unlinkable[0].reason, "BUNDLE_NOT_OK", "a bundle whose own validation failed offers no targets (fails if a CONFLICTING_EVIDENCE bundle can be linked to)");
eq(bundleTargets(notOk).targets.length, 0, "and none of its rows are offered");
const orphanRow = { ...bundle, byId: {} };
ok(bundleTargets(orphanRow).targets.length === 0 && bundleTargets(orphanRow).unlinkable.every((u) => u.reason === "TARGET_NOT_IN_BUNDLE" || u.reason === "TARGET_UNTRUSTED"), "a row the bundle does not know as a span is not offered (fails if presence in knownSpans is assumed rather than asserted)");
eq(availabilityOf("hunch").available, false, "an unknown target kind is refused, not a crash (fails if a sixth PROOF_TARGET_KIND would throw at import)");
ok(catalogueKey(bundle) !== catalogueKey(buildBundle("MCF-2026-000123", BODY, DUTIES.slice(1))), "the catalogue key changes when the duty list changes with the posting unchanged (fails if reconcile is keyed only on the posting)");
eq(catalogueKey(bundle), catalogueKey(buildBundle("MCF-2026-000123", BODY, DUTIES)), "and is stable for the same catalogue");

// A2 a confirmed proof links to a duty and a requirement; the contract record's targets follow
const src = buildManualPersonSource("I monitored operational data daily and investigated every exception.\nI closed the monthly accounts.");
const ex = markExcerpt(src, 0, 69).span;
const pay = (raw, excerpts, n) => buildManualPersonEvidence({ rawText: raw, confirmed: true, excerpts, confirmedAt: t(n) });
const l0 = applyEvidenceToLedger(createEmptyLedger(), pay(src.text, [{ start: 0, end: 69, sourceTextHash: ex.sourceTextHash }], 1), t(1), { bundle });
const pid = l0.records[0].id;
deq(l0.records[0].links, [], "a new record has no links (fails if a link is invented)");
const r1 = linkProof(l0, pid, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(2));
ok(r1.ok, `a trusted duty can be linked (${r1.error || "ok"})`);
const l1 = r1.ledger;
const link1 = l1.records[0].links[0];
eq(link1.id, makeLinkId(pid, "duty", dutyT.targetId), "the link id follows from proof, kind and target (fails if ids are random)");
eq(link1.targetText, dutyT.text, "the link snapshots the target's exact text at link time");
ok(link1.targetSourceId === bundle.source.id && link1.targetSourceTextHash === bundle.source.textHash && link1.state === "VALID" && link1.reason === null, "the link carries the target's source id and hash and is VALID with no reason");
deq(l1.records[0].record.targets, [{ targetKind: "duty", targetId: dutyT.targetId }], "the contract record's targets equal the VALID links (fails if the record and the wrapper drift)");
ok(validateProofRecord(l1.records[0].record, { knownSpans: bundle.knownSpans }).ok, "the contract validates the record against the bundle's known spans");
eq(l1.events.at(-1).kind, "LINKED", "linking is an event");
ok(l1.events.at(-1).actor === LEDGER_ACTOR.HUMAN && l1.events.at(-1).linkId === link1.id, "attributed to the human and naming its link");
ok(validateLedger(l1).ok, `the ledger validates with a link (${validateLedger(l1).errors[0] || "no errors"})`);
const r2 = linkProof(l1, pid, { targetKind: "requirement", targetId: reqT.targetId }, bundle, t(3));
ok(r2.ok && r2.ledger.records[0].links.length === 2, "a verbatim requirement can be linked too");
const l2 = r2.ledger;
ok(!missingEvidenceOf(l2.records[0]).some((m) => /not yet linked/.test(m)), "a linked record no longer lists 'not yet linked'");
ok(/linked to 2 targets that stand against the current posting evidence/.test(ledgerRows(l2, { bundle })[0].downstreamUses.text[0]), "downstream uses count the links that stand when judged against the bundle");
ok(/2 links recorded VALID as last recorded by the ledger; link state not re-checked/.test(ledgerRows(l2)[0].downstreamUses.text[0]), "and without a bundle they say the count is as last recorded and not re-checked (fails if a stored count reads as current)");

// A3 refusals in the ledger's own words, each leaving a trace and changing no record
const before = JSON.stringify(l2.records);
for (const [kind, expect] of [["skill", "NO_IDENTIFIER_CLASS"], ["competency", "NO_IDENTIFIER_CLASS"], ["review-observation", "NO_DECISION_RECORD"]]) {
  const r = linkProof(l2, pid, { targetKind: kind, targetId: "anything" }, bundle, t(4));
  ok(!r.ok && r.error.startsWith(expect), `${kind} is refused with ${expect} (fails if an id is minted from a label or a session decision)`);
  eq(r.ledger.refusals.at(-1).reason, "LINK_REFUSED", `${kind}: the refusal is on the record`);
  eq(JSON.stringify(r.ledger.records), before, `${kind}: no record changed`);
}
ok(/owner: BLP-013/.test(linkProof(l2, pid, { targetKind: "review-observation", targetId: "c-ai" }, bundle, t(4)).error), "the observation refusal names its owner");
const rU = linkProof(l2, pid, { targetKind: "duty", targetId: untrusted.targetId }, bundle, t(4));
ok(!rU.ok && /TARGET_UNTRUSTED/.test(rU.error) && /UNVERIFIED/.test(rU.error), "an unverified duty is refused with its parentage named");
ok(!linkProof(l2, pid, { targetKind: "duty", targetId: "duty:000000000000000000000000" }, bundle, t(4)).ok, "a duty id not in the bundle is refused");
ok(/DUPLICATE_LINK/.test(linkProof(l2, pid, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(4)).error), "linking the same target twice is refused");
ok(/NO_BUNDLE/.test(linkProof(l2, pid, { targetKind: "duty", targetId: dutyT.targetId }, null, t(4)).error), "linking with no bundle is refused");
ok(/no proof record/.test(linkProof(l2, "proof:nobody", { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(4)).error), "linking an unknown record is refused");
ok(/hunch is not a proof target kind/.test(linkProof(l2, pid, { targetKind: "hunch", targetId: "x" }, bundle, t(4)).error), "an unknown target kind is refused");

// A4 a posting change invalidates every link together, without mutating any text
const BODY2 = BODY + "\n- Extra requirement line for the new posting.";
const bundle2 = buildPostingEvidence({ posting: posting("MCF-2026-000999", BODY2), duties: DUTIES.slice(0, 1), extractionVersion: "responsibilities-1", retrievedAt: t(0) });
const l3 = reconcileLinks(l2, bundle2, t(5));
ok(l3.records[0].links.every((l) => l.state === "INVALID" && l.reason === "TARGET_SOURCE_CHANGED"), "every link to the earlier posting is INVALID together with reason TARGET_SOURCE_CHANGED (fails if one survives or is examined on its own)");
deq(l3.records[0].record.targets, [], "the contract record's targets hold VALID links only (fails if an invalid target stays and could fail validateProofRecord)");
ok(l3.records[0].links.every((l, i) => l.targetText === l2.records[0].links[i].targetText), "each invalid link keeps its snapshot for inspection");
eq(l3.records[0].excerptText, l2.records[0].excerptText, "the candidate excerpt text is untouched");
eq(bundle.source.text, buildPostingEvidence({ posting: posting("MCF-2026-000123", BODY), duties: DUTIES, extractionVersion: "responsibilities-1", retrievedAt: t(0) }).source.text, "the posting text is untouched (rebuilding the bundle gives the same canonical text)");
ok(l3.events.filter((e) => e.kind === "LINK_INVALID").every((e) => e.actor === LEDGER_ACTOR.SYSTEM), "invalidation is system detection");
ok(validateLedger(l3).ok, "the ledger validates with invalid links");
eq(judgeLink(l2.records[0].links[0], bundle2).reason, "TARGET_SOURCE_CHANGED", "judgeLink names the same reason");
// Conformance-auditor C-1: Job Anatomy re-distils the same duties under an unchanged posting, so
// every duty id changes while the source id and text hash stay put. The reconcile trigger must key
// on the catalogue, and the ledger must invalidate; Supervisor ruling C-b: with the duty still
// there under a new id, the reason is TARGET_REEXTRACTED (not "no longer in the posting evidence").
const anatomyBundle = buildPostingEvidence({ posting: posting("MCF-2026-000123", BODY), duties: DUTIES, extractionVersion: DUTY_EXTRACTION_VERSION.jobAnatomy, retrievedAt: t(0) });
ok(anatomyBundle.source.id === bundle.source.id && anatomyBundle.source.textHash === bundle.source.textHash, "the re-distilled bundle has the same source id and text hash (the scenario's premise; fails if the fixture no longer models it)");
ok(bundleTargets(anatomyBundle).targets.find((x) => x.targetKind === "duty").targetId !== dutyT.targetId, "and different duty ids");
ok(catalogueKey(anatomyBundle) !== catalogueKey(bundle), "the catalogue key detects the re-distillation (fails if the trigger is keyed on the posting alone, which cannot see this)");
const afterAnatomy = reconcileLinks(l2, anatomyBundle, t(5));
eq(afterAnatomy.records[0].links.find((l) => l.targetKind === "duty").state, "INVALID", "the duty link is INVALID after the re-distillation (fails if a dead duty id still reads VALID)");
eq(afterAnatomy.records[0].links.find((l) => l.targetKind === "duty").reason, "TARGET_REEXTRACTED", "with reason TARGET_REEXTRACTED, because the duty's text is still in the posting under a new id (fails if the ledger says the duty is absent when it is there)");
eq(afterAnatomy.records[0].links.find((l) => l.targetKind === "requirement").state, "VALID", "the requirement link, an offset span on the unchanged text, stays VALID");
const sameUuidEdited = buildBundle("MCF-2026-000123", BODY + "\n- One more requirement line.", DUTIES);
ok(reconcileLinks(l2, sameUuidEdited, t(5)).records[0].links.every((l) => l.reason === "TARGET_SOURCE_CHANGED"), "the same posting id with different text displaces every link too: the judgement is on the text hash, not the id alone (fails if only the id is compared)");
eq(JSON.stringify(bundle), bundleSnapshot, "the frozen bundle is byte-identical after linking and invalidation (fails if the link layer mutated posting text, rows or spans)");

// A5 the same posting evidence returning resumes the links, with the snapshot still matching
const rebuilt = buildBundle("MCF-2026-000123", BODY, DUTIES);
const l4 = reconcileLinks(l3, rebuilt, t(6));
ok(l4.records[0].links.every((l) => l.state === "VALID" && l.reason === null), "links resume against a bundle rebuilt independently from the same inputs (fails if id derivation is not reproducible)");
ok(l4.records[0].links.every((l) => { const row = bundleTargets(rebuilt).targets.find((x) => x.targetId === l.targetId); return row && row.text === l.targetText; }), "and each resumed link's snapshot equals the rebuilt bundle's text for the same id");
deq(l4.records[0].record.targets.map((x) => x.targetId), [dutyT.targetId, reqT.targetId], "the contract targets return");
ok(l4.events.filter((e) => e.kind === "LINK_RESUMED").length === 2 && l4.events.at(-1).reason === "TARGET_RESTORED", "resumption is an event with reason TARGET_RESTORED");
eq(reconcileLinks(l4, bundle, t(7)), l4, "reconciling against an unchanged bundle returns the same ledger (fails if reconcile mints events for nothing)");

// A6 a target absent, untrusted or changed in text on the same posting is named as such
const bundleFewer = buildPostingEvidence({ posting: posting("MCF-2026-000123", BODY), duties: DUTIES.slice(1), extractionVersion: "responsibilities-1", retrievedAt: t(0) });
const l5 = reconcileLinks(l4, bundleFewer, t(8));
eq(l5.records[0].links.find((l) => l.targetKind === "duty").reason, "TARGET_ABSENT", "a duty no longer in the bundle invalidates its link with TARGET_ABSENT");
eq(l5.records[0].links.find((l) => l.targetKind === "requirement").state, "VALID", "while the requirement, still present on the same source, stays VALID");
const tampered = { ...bundle, dutyRows: bundle.dutyRows.map((r) => (r.id === dutyT.targetId ? { ...r, text: r.text + " (edited)" } : r)) };
eq(judgeLink(l4.records[0].links[0], tampered).reason, "TARGET_TEXT_CHANGED", "a target whose text differs from the snapshot is named TARGET_TEXT_CHANGED");
const untrustedBundle = { ...bundle, dutyRows: bundle.dutyRows.map((r) => (r.id === dutyT.targetId ? { ...r, trusted: false, derivationState: "DECLARED" } : r)) };
eq(judgeLink(l4.records[0].links[0], untrustedBundle).reason, "TARGET_UNTRUSTED", "a duty that lost its trust is named TARGET_UNTRUSTED");

// A7 the candidate side: a stale record takes its links with it; resumption restores them
const l6 = applyEvidenceToLedger(l4, pay(src.text + "\nAppended.", [], 9), t(9), { bundle });
const stale = l6.records.find((r) => r.id === pid);
eq(stale.record.state, "STALE", "the record went stale on the candidate edit");
ok(stale.links.every((l) => l.state === "INVALID" && l.reason === "CANDIDATE_SOURCE_CHANGED"), "its links are INVALID with reason CANDIDATE_SOURCE_CHANGED (fails if a stale record keeps valid targets)");
deq(stale.record.targets, [], "and the contract targets are empty");
const l7 = applyEvidenceToLedger(l6, pay(src.text, [{ start: 0, end: 69, sourceTextHash: ex.sourceTextHash }], 10), t(10), { bundle });
const back = l7.records.find((r) => r.id === pid);
ok(back.record.state === "CLAIMED_ONLY" && back.links.every((l) => l.state === "VALID"), "restoring the candidate text resumes the record and its links against the same bundle");
ok(l7.events.filter((e) => e.kind === "LINK_RESUMED" && e.at === t(10)).length === 2 && l7.events.filter((e) => e.kind === "LINK_RESUMED" && e.at === t(10)).every((e) => e.reason === "CANDIDATE_SOURCE_RESTORED") && l4.events.filter((e) => e.kind === "LINK_RESUMED").every((e) => e.reason === "TARGET_RESTORED"), "a link that waited on its own stale record resumes with reason CANDIDATE_SOURCE_RESTORED, not TARGET_RESTORED: the posting never moved (fails if the resume borrows the target's story)");
ok(REASONS_BY_KIND.LINK_RESUMED.includes("CANDIDATE_SOURCE_RESTORED"), "and the reason is governed");
const l6b = applyEvidenceToLedger(l4, pay(src.text + "\nAppended.", [], 9), t(9));
ok(l6b.records.find((r) => r.id === pid).links.every((l) => l.reason === "CANDIDATE_SOURCE_CHANGED"), "without a bundle, only the candidate side is judged and a stale record still loses its links");
// Two linked records in one batch (conformance-auditor C-2): every one is invalidated and the guard accepts the batch.
const ex2 = markExcerpt(src, 70, src.text.length).span;
const two = applyEvidenceToLedger(createEmptyLedger(), pay(src.text, [{ start: 0, end: 69, sourceTextHash: ex.sourceTextHash }, { start: 70, end: src.text.length, sourceTextHash: ex2.sourceTextHash }], 1), t(1), { bundle });
let twoLinked = two;
for (const r of two.records) twoLinked = linkProof(twoLinked, r.id, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(2)).ledger;
const twoCleared = applyEvidenceToLedger(twoLinked, null, t(3));
eq(twoCleared.refusals.length, 0, "a batch of two withheld records with links is accepted by the guard (fails if lastEventAt drifts on a record that gained no event)");
ok(twoCleared.records.every((r) => r.record.state === "WITHHELD" && r.links.every((l) => l.state === "INVALID" && l.reason === "CANDIDATE_SOURCE_CHANGED") && r.record.targets.length === 0), "every link on every withheld record is INVALID with empty targets (fails if a WITHHELD record keeps a VALID link)");
const twiceCleared = applyEvidenceToLedger(twoCleared, null, t(4));
eq(JSON.stringify(twiceCleared.records) + JSON.stringify(twiceCleared.events), JSON.stringify(twoCleared.records) + JSON.stringify(twoCleared.events), "clearing again mints no record change and no event (fails if reconcile rebuilds records that gained no event)");

// A10 Supervisor ruling C-a: an unreadable bundle means the link was NOT JUDGED, which is unknown,
// never "the posting changed" and never valid
const vNull = judgeLink(l2.records[0].links[0], null), vNotOk = judgeLink(l2.records[0].links[0], notOk);
eq(vNull.reason, "TARGET_EVIDENCE_UNAVAILABLE", "no bundle: the verdict is TARGET_EVIDENCE_UNAVAILABLE (fails if the link is judged against nothing)");
eq(vNotOk.reason, "TARGET_EVIDENCE_UNAVAILABLE", "a bundle whose own validation failed: the verdict is TARGET_EVIDENCE_UNAVAILABLE");
ok(vNull.reason !== "TARGET_SOURCE_CHANGED" && vNotOk.reason !== "TARGET_SOURCE_CHANGED" && vNull.reason !== judgeLink(l2.records[0].links[0], bundle2).reason, "an unreadable target and a changed posting are DIFFERENT reasons (this is the assertion that dies if the two branches collapse again)");
ok(vNull.valid === false && vNotOk.valid === false, "an unreadable target is unknown, not valid (fails if silence is read as soundness)");
ok(vNull.unavailable === "NO_BUNDLE" && vNotOk.unavailable === "BUNDLE_NOT_OK" && /validation failed/.test(vNotOk.text), "the verdict carries which unavailability it was and the bundle's own words");
const lUnavail = reconcileLinks(l2, notOk, t(5));
ok(lUnavail.records[0].links.every((l) => l.state === "INVALID" && l.reason === "TARGET_EVIDENCE_UNAVAILABLE"), "reconciling against an unreadable bundle invalidates every link with TARGET_EVIDENCE_UNAVAILABLE (fails if stored VALID survives an unreadable catalogue)");
deq(lUnavail.records[0].record.targets, [], "and the contract record asserts no target while the evidence cannot be read");
ok(lUnavail.events.filter((e) => e.kind === "LINK_INVALID").every((e) => /not judged/.test(e.detail) && e.actor === LEDGER_ACTOR.SYSTEM), "each invalidation event says the link was not judged, by the system");
ok(validateLedger(lUnavail).ok && REASONS_BY_KIND.LINK_INVALID.includes("TARGET_EVIDENCE_UNAVAILABLE"), "the ledger validates and the reason is governed");
const lReadable = reconcileLinks(lUnavail, bundle, t(6));
ok(lReadable.records[0].links.every((l) => l.state === "VALID") && lReadable.events.filter((e) => e.kind === "LINK_RESUMED").every((e) => e.reason === "TARGET_EVIDENCE_READ"), "when the same evidence can be read again the links resume with reason TARGET_EVIDENCE_READ, not TARGET_RESTORED: the target never left (fails if the resume reason lies about a restoration)");
ok(validateLedger(lReadable).ok, "and the ledger validates after the resume");

// A11 Supervisor ruling C-b: exactly one matching row offers a re-link the human makes; two or more offer nothing
const vRe = judgeLink(l2.records[0].links.find((l) => l.targetKind === "duty"), anatomyBundle);
const newDutyId = bundleTargets(anatomyBundle).targets.find((x) => x.text === dutyT.text).targetId;
ok(vRe.reason === "TARGET_REEXTRACTED" && vRe.matches === 1 && vRe.relink && vRe.relink.targetId === newDutyId && vRe.relink.targetKind === "duty", "one current duty row carries the snapshot text: TARGET_REEXTRACTED with that row offered (fails if the offer names a row whose text differs, or none)");
ok(newDutyId !== dutyT.targetId, "the offered id is the new id, not the dead one");
const twin = deepFreeze({ ...anatomyBundle, dutyRows: [...anatomyBundle.dutyRows, { ...anatomyBundle.dutyRows.find((r) => r.text === dutyT.text), id: "duty:ffffffffffffffffffffffff", index: anatomyBundle.dutyRows.length }], byId: { ...anatomyBundle.byId, "duty:ffffffffffffffffffffffff": { id: "duty:ffffffffffffffffffffffff" } } });
const vTwin = judgeLink(l2.records[0].links.find((l) => l.targetKind === "duty"), twin);
ok(vTwin.reason === "TARGET_REEXTRACTED" && vTwin.matches === 2 && vTwin.relink === null, "two current duty rows carry the snapshot text: TARGET_REEXTRACTED, two matches, NO offer (this is the assertion that dies if an ambiguous match is offered)");
const rTwin = relinkProof(afterAnatomy, pid, afterAnatomy.records[0].links.find((l) => l.targetKind === "duty").id, twin, t(6));
ok(!rTwin.ok && /AMBIGUOUS_RELINK/.test(rTwin.error) && /2 current duty rows/.test(rTwin.error) && /will not choose/.test(rTwin.error), "re-linking on an ambiguous match is refused in words that say the app will not choose (fails if it picks one)");
const dutyLinkId = afterAnatomy.records[0].links.find((l) => l.targetKind === "duty").id;
const rRe = relinkProof(afterAnatomy, pid, dutyLinkId, anatomyBundle, t(6));
ok(rRe.ok, `re-linking on the single match is accepted (${rRe.error || "ok"})`);
const reRec = rRe.ledger.records[0];
ok(!reRec.links.some((l) => l.id === dutyLinkId) && reRec.links.some((l) => l.targetId === newDutyId && l.state === "VALID" && l.targetText === dutyT.text), "the dead link is gone and the new link is VALID with the same snapshot text under the new id");
deq(reRec.record.targets.map((x) => x.targetId).sort(), [newDutyId, reqT.targetId].sort(), "the contract targets carry the new id and the untouched requirement");
ok(rRe.ledger.events.at(-2).kind === "UNLINKED" && rRe.ledger.events.at(-1).kind === "LINKED" && rRe.ledger.events.at(-2).actor === LEDGER_ACTOR.HUMAN && /re-linked to/.test(rRe.ledger.events.at(-2).detail) && /re-linked from/.test(rRe.ledger.events.at(-1).detail), "the re-link is two human events, each naming the other (fails if the re-link is attributed to the system or leaves no trace of the old link)");
ok(validateLedger(rRe.ledger).ok, `the ledger validates after the re-link (${validateLedger(rRe.ledger).errors[0] || "no errors"})`);
ok(/NO_RELINK_CANDIDATE/.test(relinkProof(l2, pid, l2.records[0].links[0].id, bundle, t(6)).error), "re-linking a link that stands is refused: nothing to re-link to");
ok(/NO_RELINK_CANDIDATE/.test(relinkProof(l3, pid, l3.records[0].links[0].id, bundle2, t(6)).error), "re-linking a link whose posting changed is refused: that is not a re-extraction");
eq(judgeLink(l4.records[0].links[0], bundleFewer).reason, "TARGET_ABSENT", "a duty whose text is in no current row stays TARGET_ABSENT (fails if absence and re-extraction are confused)");

// A12 Supervisor ruling W-a: a reconcile can never leave stored VALID links it could not re-judge
const early = "2026-09-08T11:00:00.000Z";
ok(early < l2.records[0].recordedAt, "the fixture clock reads earlier than the record (the scenario's premise)");
const lClamped = reconcileLinks(l2, bundle2, early);
eq(lClamped.refusals.length, 0, "a reconcile under a clock that reads earlier than the ledger is not refused (fails if the guard can strand stored VALID links)");
ok(lClamped.records[0].links.every((l) => l.state === "INVALID" && l.reason === "TARGET_SOURCE_CHANGED"), "and every link to the changed posting reads INVALID, none VALID");
ok(lClamped.events.at(-1).at >= lClamped.events.at(-2).at && lClamped.events.at(-1).at >= l2.events.at(-1).at, "the system stamp is clamped to keep event order");
ok(lClamped.events.slice(-2).every((e) => /clock read 2026-09-08T11:00:00.000Z; stamped at the ledger's last instant/.test(e.detail)), "and the clamp is SAID in each event's detail with the wall-clock reading beside the stamp (fails if the clamp is silent)");
ok(validateLedger(lClamped).ok, "the clamped reconcile validates");
eq(JSON.stringify(reconcileLinks(l2, bundle2, early)), JSON.stringify(lClamped), "and is deterministic");
const offsetEarly = "2026-09-08T20:01:00+08:00"; // 12:01Z, earlier than the ledger's last instant but LATER as a string
ok(offsetEarly > l2.events.at(-1).at && Date.parse(offsetEarly) < Date.parse(l2.events.at(-1).at), "the offset-form fixture sorts after the ledger as a string and before it as an instant (the scenario's premise)");
const lOffset = reconcileLinks(l2, bundle2, offsetEarly);
ok(lOffset.events.at(-1).at === l2.events.at(-1).at && /clock read 2026-09-08T20:01:00\+08:00; stamped at/.test(lOffset.events.at(-1).detail), "the clamp compares instants, not strings: an offset-form earlier clock is clamped and said (fails if monotonicity is lexicographic)");
const refusedFold = applyEvidenceToLedger(l2, { not: "manual person evidence" }, t(5), { bundle: bundle2 });
ok(refusedFold.refusals.at(-1)?.reason === "PAYLOAD_REFUSED" && refusedFold.records[0].links.every((l) => l.state === "INVALID" && l.reason === "TARGET_SOURCE_CHANGED") && refusedFold.records[0].record.targets.length === 0, "a refused fold still re-judges its links against the bundle it was given, so no stored VALID link or contract target outlives a posting change behind a refusal (fails if the refusal path returns the base ledger untouched)");
const backdatedFold = applyEvidenceToLedger(l4, pay(src.text + "\nAppended.", [], 9), early);
ok(backdatedFold.refusals.at(-1)?.reason === "LEDGER_INVALID" && JSON.stringify(backdatedFold.records) === JSON.stringify(l4.records), "a fold under a backdated clock is refused on the record and changes nothing, so its links still read VALID truthfully: no fold happened and the record is still CLAIMED_ONLY on the same text (BLP-008 guard, unchanged)");
const forged = { ...l2, records: l2.records.map((r) => ({ ...r, links: r.links.map((l) => ({ ...l, id: "link:000000000000000000000000" })) })) };
assert.throws(() => reconcileLinks(forged, bundle2, t(5)), /invariant violation/, "a reconcile that cannot produce a valid ledger THROWS rather than returning stored link state as current (fails if a refused reconcile hands back the old ledger)"); checks += 1;

// A12b Supervisor finding on ff4c7c0: the boundary that catches the W-a throw is a PURE value, and the
// panel's withheld sentence is derived from the kept ledger's faults and nothing else
const faulted = guardLedgerStep(l2, () => reconcileLinks(forged, bundle2, t(5)), t(5));
ok(JSON.stringify(faulted.records) === JSON.stringify(l2.records) && JSON.stringify(faulted.events) === JSON.stringify(l2.events), "when the step throws, the PREVIOUS ledger's records and events are kept unchanged (fails if a thrown step leaks a partial ledger)");
ok(faulted.faults.length === 1 && faulted.faults[0].resolvedAt === null && /invariant violation/.test(faulted.faults[0].detail) && faulted.faults[0].actor === LEDGER_ACTOR.SYSTEM, "the fault is recorded on the kept ledger with the thrown message, unresolved, by the system");
ok(validateLedger(faulted).ok, `the faulted ledger validates: faults are governed (${validateLedger(faulted).errors[0] || "no errors"})`);
ok(activeLedgerFault(faulted) === faulted.faults[0] && /link state is withheld: .*invariant violation/.test(ledgerFaultText(faulted)), "the withheld sentence is derived from that fault and names it (this is the assertion that dies if the sentence can be produced from anything but a fault present on the ledger)");
eq(ledgerFaultText(l2), null, "a ledger with no fault produces no withheld sentence (fails if the sentence can appear without a fault present)");
const faultedTwice = guardLedgerStep(faulted, () => reconcileLinks(forged, bundle2, t(6)), t(6));
ok(faultedTwice.faults.length === 2 && faultedTwice.faults.every((f) => f.resolvedAt === null) && ledgerFaultText(faultedTwice) !== null, "a second throw appends a second fault and the sentence stays (fails if a throwing pass clears the warning)");
const recovered = guardLedgerStep(faultedTwice, (l) => reconcileLinks(l, bundle2, t(7)), t(7));
ok(recovered.faults.length === 2 && recovered.faults.every((f) => f.resolvedAt === t(7)) && ledgerFaultText(recovered) === null && recovered.records[0].links.every((l) => l.state === "INVALID"), "only a step that SUCCEEDS resolves the open faults, at its own instant, and the sentence lifts; the faults stay on the record (fails if the sentence is cleared while a fault is open, or if resolution forgets the fault)");
ok(validateLedger(recovered).ok, "the recovered ledger validates with resolved faults");
ok(!validateLedger({ ...l2, faults: [{ ...createLedgerFault({ at: t(1), detail: "x" }), actor: LEDGER_ACTOR.HUMAN }] }).ok && !validateLedger({ ...l2, faults: [{ ...createLedgerFault({ at: t(2), detail: "x" }), resolvedAt: t(1) }] }).ok && !validateLedgerFault({}).ok, "a fault attributed to a human, resolved before it happened, or shapeless is refused by the validator (fails if faults are an ungoverned field)");
assert.throws(() => guardLedgerStep(l2, (l) => l, "not an instant"), /ISO instant/, "the boundary needs a clock, read once outside the updater"); checks += 1;
eq(JSON.stringify(guardLedgerStep(l2, () => reconcileLinks(forged, bundle2, t(5)), t(5))), JSON.stringify(faulted), "the boundary is deterministic and pure (no side effect could make two runs differ)");

// A13 Supervisor ruling W-b: a view built without a bundle says so; a view built with one re-judges
const stored = l2.records[0]; // links recorded VALID against `bundle`
ok(missingEvidenceOf(stored).some((m) => /2 links recorded VALID as last recorded by the ledger; link state not re-checked against the posting evidence in this view/.test(m)), "without a bundle, missing evidence SAYS the link state was not re-checked (fails if the omission is invisible)");
deq(linkStanding(stored).standing, [], "without a bundle the standing list is EMPTY and the stored links sit under `recorded` (fails if a consumer can read stored state as standing)");
eq(linkStanding(stored).recorded.length, 2, "recorded carries the two stored VALID links");
const allInvalid = l3.records[0];
ok(/every link INVALID as last recorded by the ledger; link state not re-checked/.test(downstreamUsesOf(allInvalid).text[0]) && missingEvidenceOf(allInvalid).some((m) => /no link currently stands: every link INVALID as last recorded by the ledger; link state not re-checked/.test(m)), "an all-invalid record read without a bundle also says it was not re-checked, in both views (fails if the omission is invisible only when every link is invalid)");
const inactiveWithValid = { ...stale, links: stale.links.map((l) => ({ ...l, state: "VALID", reason: null })) };
const inactiveView = linkStanding(inactiveWithValid, bundle);
ok(inactiveView.standing.length === 0 && inactiveView.lapsed === 0 && /2 links recorded VALID; not checked: this proof record is STALE, not active/.test(inactiveView.caveat), "a VALID link on an inactive record is reported as not checked because the RECORD is inactive, never as lapsed against the posting (fails if the caveat blames the posting for a candidate-side state)");
ok(/as last recorded by the ledger; link state not re-checked/.test(downstreamUsesOf(stored).text[0]), "and downstream uses say the same");
ok(!missingEvidenceOf(stored, { bundle }).some((m) => /not re-checked|no longer stand/.test(m)), "with the same bundle, the links stand and no caveat is printed");
eq(downstreamUsesOf(stored, { bundle }).text[0], "linked to 2 targets that stand against the current posting evidence", "downstream uses name the links as standing against the current evidence");
ok(missingEvidenceOf(stored, { bundle: bundle2 }).some((m) => /no link currently stands: 2 links recorded VALID no longer stand against the current posting evidence, pending the ledger's re-check/.test(m)), "with a changed posting, stored VALID links are reported as no longer standing (fails if a consumer reads the over-claim)");
ok(/no link currently stands: 2 links recorded VALID no longer stand/.test(downstreamUsesOf(stored, { bundle: bundle2 }).text[0]), "and downstream uses say so too");
deq(downstreamUsesOf(stored, { bundle: bundle2 }).linkStanding.standing, [], "the standing list is empty while the stored targets stay for inspection");
ok(missingEvidenceOf(stored, { bundle: anatomyBundle }).some((m) => /1 link recorded VALID no longer stands/.test(m)) && downstreamUsesOf(stored, { bundle: anatomyBundle }).linkStanding.standing.length === 1, "a partial lapse is counted exactly (one of two)");
ok(ledgerRows(l2, { bundle: bundle2 })[0].missingEvidence.some((m) => /no longer stand/.test(m)) && ledgerRows(l2)[0].missingEvidence.some((m) => /not re-checked/.test(m)), "ledgerRows threads the bundle through and says when it has none");
ok(missingEvidenceOf(stored, { bundle: null }).some((m) => /no link currently stands: 2 links recorded VALID could not be judged: no canonical posting evidence is available/.test(m)), "a null bundle (unreadable) counts as judged, finds nothing standing and says the links could not be judged, not that they lapsed (fails if null is confused with omitted, or unreadable with changed)");
ok(/could not be judged: the posting evidence is CONFLICTING_EVIDENCE/.test(downstreamUsesOf(stored, { bundle: notOk }).text[0]), "a bundle that failed its own validation is reported in its own words as unjudgeable");
ok(linkStanding(stored).judged === false && linkStanding(stored, bundle).judged === true, "the standing view carries whether it was judged");

// A8 unlinking is a human act whose history stays
const r3 = unlinkProof(l4, pid, l4.records[0].links[0].id, t(11));
ok(r3.ok && r3.ledger.records[0].links.length === 1 && r3.ledger.records[0].record.targets.length === 1, "unlinking removes the link and its target");
eq(r3.ledger.events.at(-1).kind, "UNLINKED", "unlinking is an event");
ok(validateLedger(r3.ledger).ok, "the ledger validates after an unlink (the UNLINKED event explains the vanished link)");
ok(!unlinkProof(l4, pid, "link:nope", t(11)).ok, "unlinking an unknown link is refused");

// A9 forged links are refused by the validator; determinism
const forge = (mut) => ({ ...l4, records: l4.records.map((r) => mut(r)) });
ok(!validateLedger(forge((r) => ({ ...r, record: { ...r.record, targets: [] } }))).ok, "a record whose targets do not equal its VALID links is refused");
ok(!validateLedger(forge((r) => ({ ...r, links: r.links.map((l) => ({ ...l, state: "VALID", reason: null, id: "link:000000000000000000000000" })) }))).ok, "a link whose id does not follow from its proof and target is refused");
ok(!validateLedger(forge((r) => ({ ...r, links: [...r.links, { ...r.links[0], id: makeLinkId(r.id, "duty", "duty:ffffffffffffffffffffffff"), targetId: "duty:ffffffffffffffffffffffff" }], record: { ...r.record, targets: [...r.record.targets, { targetKind: "duty", targetId: "duty:ffffffffffffffffffffffff" }] } }))).ok, "a link with no LINKED event is refused");
ok(!validateLedger(forge((r) => ({ ...r, links: r.links.map((l) => ({ ...l, targetKind: "skill" })) }))).ok, "a link to a kind without an identifier class is refused");
ok(!validateLedger(forge((r) => ({ ...r, links: r.links.map((l) => ({ ...l, targetText: "" })) }))).ok, "a link with an empty snapshot is refused");
ok(!validateLedger(forge((r) => ({ ...r, links: r.links.map((l) => ({ ...l, targetDerivationState: "VERIFIED_BY_ME" })) }))).ok, "a link whose snapshot parentage is not a trusted parentage is refused (fails if a rendered field has no validator)");
ok(!validateLedger(forge((r) => ({ ...r, links: r.links.map((l) => ({ ...l, targetLabel: "D99x" })) }))).ok, "a link whose label is not a row label is refused");
ok(!validateLedger(forge((r) => ({ ...r, links: r.links.map((l) => ({ ...l, state: "INVALID", reason: "HUMAN_CHOICE" })) }))).ok, "an INVALID link with a reason that is not an invalidation reason is refused");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: pid, linkId: link1.id, kind: "LINK_INVALID", from: "VALID", to: "INVALID", reason: "TARGET_ABSENT", actor: LEDGER_ACTOR.HUMAN })).ok, "link invalidation attributed to a human is refused");
ok(!validateLedgerEvent(createLedgerEvent({ at: t(1), proofId: pid, kind: "CLAIM_SET", linkId: link1.id, from: null, to: "x", reason: "HUMAN_CHOICE", actor: LEDGER_ACTOR.HUMAN })).ok, "a non-link event carrying a linkId is refused");
eq(JSON.stringify(reconcileLinks(l2, bundle2, t(5))), JSON.stringify(l3), "invalidation is deterministic (identical inputs, identical ledger)");
eq(JSON.stringify(linkProof(l0, pid, { targetKind: "duty", targetId: dutyT.targetId }, bundle, t(2)).ledger), JSON.stringify(l1), "linking is deterministic");
ok([...LINK_STATE].join() === "VALID,INVALID", "link states are the two declared");
ok(sha256Hex("x").length === 64, "hash helper present (guards the id derivation used above)");

console.log(`Part A (node): PASS, ${checks} checks`);
fs.mkdirSync("test-results/proof-links", { recursive: true });
fs.writeFileSync("test-results/proof-links/sample-ledger.json", JSON.stringify(l4, null, 2));
if (process.env.PROOF_LINKS_NODE_ONLY === "1") { console.log("Part B (browser): NOT_RUN (PROOF_LINKS_NODE_ONLY=1)"); process.exit(0); }

// ---------------------------------------------------------------------------------------------
// Part B
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
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text }], model: "proof-links-fixture" }) });
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
  const availability = await page.getByTestId("cpl-link-availability").innerText();
  ok(/skills \(/.test(availability) && /competencies \(/.test(availability) && /accepted review observations \(/.test(availability) && /BLP-013/.test(availability) && (availability.match(/escalated to the Human Lead/g) || []).length >= 2, `${tag}: the panel names each unlinkable kind with its own reason and owner (fails if competencies borrow the skill text or an owner is dropped)`);

  // 1. Confirm an excerpt and link it to a verified duty and a requirement.
  const textarea = page.getByTestId("person-evidence-paste");
  await textarea.fill(CV);
  await textarea.evaluate((el) => el.blur());
  await page.waitForFunction((w) => document.querySelector('[data-testid="person-evidence-paste"]').value === w, CV, { timeout: 5000 });
  await select(page, 0, WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-record"]').length === 1, null, { timeout: 5000 });
  ok(await page.getByTestId("cpl-no-links").isVisible(), `${tag}: a fresh record says it is not yet linked`);
  // The duties are distilled from the responsibilities fixture asynchronously; the bundle reaches the
  // ledger when they land, so the pick list is awaited rather than assumed (fails loudly if no duty
  // ever becomes linkable, instead of racing).
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="cpl-link-select"] option')].some((o) => o.value.startsWith("duty|duty:")), null, { timeout: 30000 });
  const sel = page.getByTestId("cpl-link-select").first();
  const options = await sel.locator("option").evaluateAll((els) => els.map((o) => ({ value: o.value, text: o.textContent })));
  const dutyOpt = options.find((o) => o.value.startsWith("duty|duty:")), reqOpt = options.find((o) => o.value.startsWith("requirement|span:"));
  ok(dutyOpt && reqOpt, `${tag}: the target list offers content-addressed duties and offset-span requirements from the posting (${options.length - 1} targets)`);
  ok(!options.some((o) => /skill|competenc|observation/i.test(o.value)), `${tag}: no skill, competency or observation is offered as a target`);
  await sel.selectOption(dutyOpt.value);
  await page.getByTestId("cpl-link-button").first().click();
  await page.locator('[data-testid="cpl-link"]').first().waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId("cpl-link-select").first().selectOption(reqOpt.value);
  const noticeBeforeSecondLink = await noticeText(page);
  await page.getByTestId("cpl-link-button").first().click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-link"]').length === 2, null, { timeout: 5000 });
  let rows = await links(page);
  eq(rows[0].targetId, dutyOpt.value.split("|")[1], `${tag}: the link cites the duty's canonical id`);
  ok(rows.every((r) => r.state === "VALID"), `${tag}: both links are VALID`);
  ok(rows.every((r) => r.text && r.text.length > 20), `${tag}: each link shows the target's text beside the excerpt (inspectable together)`);
  ok(/at link time/.test(await page.locator('[data-testid="cpl-link"]').first().innerText()) && /not the current text/.test(await page.locator('[data-testid="cpl-link"]').first().innerText()), `${tag}: the target text is labelled as a snapshot at link time, never as the current text`);
  ok(/stands against the current posting evidence/.test(rows[0].stateText) && !/not yet re-checked/.test(rows[0].stateText), `${tag}: a valid link re-judged at render says the target stands against the current posting evidence, with no pending caveat (fails if stored state alone is rendered)`);
  ok(/linked to 2 targets that stand against the current posting evidence/.test(await page.locator('[data-testid="cpl-uses"]').first().innerText()), `${tag}: downstream uses are computed with the live bundle, so they say the links stand rather than that they were not re-checked (Supervisor ruling W-b)`);
  await noticeChanged(page, noticeBeforeSecondLink);
  ok(/Link recorded at/.test(await page.getByTestId("cpl-notice").innerText()), `${tag}: the notice, derived from the kept ledger, says the link was recorded`);
  const excerptText = await page.locator('[data-testid="cpl-excerpt"]').first().textContent();
  eq(excerptText, WANTED, `${tag}: the candidate excerpt sits in the same row as the target texts`);
  ok(!/not yet linked/.test(await page.locator('[data-testid="cpl-missing"]').first().innerText()), `${tag}: missing evidence no longer says not yet linked`);
  ok(/linked to 2 targets/.test(await page.locator('[data-testid="cpl-uses"]').first().innerText()), `${tag}: downstream uses count two valid links`);
  eq(await page.getByTestId("cpl-link-select").first().locator("option").count(), options.length - 2, `${tag}: linked targets leave the pick list`);

  // 2. Jump to the target in the evidence workspace: the target is opened where BLP-003 renders it.
  await page.getByTestId("cpl-link-open").first().click();
  const workspaceRow = page.locator(`[data-testid="v31-workspace-evidence-${rows[0].targetId}"]`);
  await workspaceRow.waitFor({ state: "visible", timeout: 15000 });
  ok(await workspaceRow.isVisible(), `${tag}: the linked duty is opened in the evidence workspace by its canonical id (fails if the jump invents or loses the id)`);
  // Return to the person lens the way BLP-003's round trip does (the workspace keeps the Landing mounted).
  await page.getByTestId("return-work-universe").click();
  await page.getByTestId("candidate-proof-ledger").waitFor({ state: "visible", timeout: 15000 });
  rows = await links(page);
  eq(rows.length, 2, `${tag}: the links survive the workspace round trip (the ledger lives in session state)`);

  // 3. The candidate side goes stale: links invalidate with the reason in words and no text changes.
  await textarea.fill(`${CV}\nAppended line.`);
  await textarea.evaluate((el) => el.blur());
  await page.getByTestId("person-evidence-excerpt-remove").first().click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 0, null, { timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  const noticeBeforeStale = await noticeText(page);
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="cpl-link"]')].some((el) => el.dataset.state === "INVALID"), null, { timeout: 5000 });
  rows = await links(page);
  ok(rows.filter((r) => r.reason === "CANDIDATE_SOURCE_CHANGED").length === 2, `${tag}: both links are INVALID with reason CANDIDATE_SOURCE_CHANGED when the proof record goes stale`);
  ok(rows.every((r) => r.text && r.text.length > 20), `${tag}: invalid links keep their target snapshot for inspection`);
  ok(/stale or withheld/.test(rows[0].stateText), `${tag}: the reason is said in words`);
  ok(await page.getByTestId("cpl-link-blocked").first().isVisible(), `${tag}: a stale record says linking waits until it is active again`);
  await noticeChanged(page, noticeBeforeStale);
  ok(/The system invalidated 2 links \(the proof record itself is stale or withheld/.test(await page.getByTestId("cpl-notice").innerText()), `${tag}: the notice counts the whole batch of two invalidations at one instant, not the last one alone (conformance-auditor S-d)`);
  ok(/no link currently stands/.test(await page.locator('[data-testid="cpl-uses"]').first().innerText()), `${tag}: downstream uses say no link currently stands while the record is stale`);

  // 4. Restore the candidate text: the record and its links resume.
  await textarea.fill(CV);
  await textarea.evaluate((el) => el.blur());
  await select(page, 0, WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  const noticeBeforeRestore = await noticeText(page);
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction(() => { const els = [...document.querySelectorAll('[data-testid="cpl-link"]')]; return els.length === 2 && els.every((el) => el.dataset.state === "VALID"); }, null, { timeout: 5000 });
  rows = await links(page);
  ok(rows.every((r) => r.state === "VALID"), `${tag}: restoring the text resumes both links`);
  await noticeChanged(page, noticeBeforeRestore);
  ok(/The system resumed 2 links at/.test(await page.getByTestId("cpl-notice").innerText()), `${tag}: the resume batch is announced with its count`);
  ok((await page.getByTestId("cpl-relink").count()) === 0 && (await page.getByTestId("cpl-links-unjudged-note").count()) === 0 && (await page.getByTestId("cpl-links-reextracted-note").count()) === 0, `${tag}: with the same posting evidence readable and unchanged, no re-link is offered and no unjudged or re-extracted note is shown (fails if those notes fire without their condition)`);

  // 5. Unlink one by hand; storage and touch targets.
  const noticeBeforeUnlink = await noticeText(page);
  await page.getByTestId("cpl-unlink").first().click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-link"]').length === 1, null, { timeout: 5000 });
  await noticeChanged(page, noticeBeforeUnlink);
  ok(/Link removed at/.test(await page.getByTestId("cpl-notice").innerText()), `${tag}: unlinking is said in words`);
  ok((await page.locator('[data-testid="cpl-link-state"]').first().getAttribute("data-recheck")) === "current", `${tag}: a valid link re-judged at render against the live catalogue reads current`);
  ok(/parentage then VERIFIED; not the current text or the current parentage/.test(await page.locator('[data-testid="cpl-link"]').first().innerText()), `${tag}: the snapshot label covers text and parentage`);
  // The posting side cannot be driven through the UI: returning to Step 2 unmounts the Work Universe
  // and its session ledger, and Job Anatomy (the late duty re-distillation that changes every duty
  // id under an unchanged posting) needs three or more corpus ads, which no fixture path here
  // supplies. That case is asserted in Part A (A4, A11) and is recorded on the register as a known omission
// at the IMPLEMENTED_UNVERIFIED record.

  const storage = await page.evaluate(async () => { const dbs = typeof indexedDB.databases === "function" ? await indexedDB.databases() : []; return `${Object.values(localStorage).join(" ")} ${Object.values(sessionStorage).join(" ")} ${document.cookie} ${JSON.stringify(dbs)}`; });
  ok(!storage.includes(MARKER) && !/link:/.test(storage), `${tag}: neither the pasted text nor a link id reaches browser storage`);
  const boxes = await page.locator('[data-testid="cpl-link-select"], [data-testid="cpl-link-button"], [data-testid="cpl-unlink"], [data-testid="cpl-link-open"]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  ok(boxes.length >= 4 && boxes.every((h) => h >= 44), `${tag}: every link control is at least 44px tall (${boxes.map(Math.round).join(", ")})`);
  const geometry = await ledger.evaluate((el) => ({ right: el.getBoundingClientRect().right, viewport: window.innerWidth }));
  ok(geometry.right <= geometry.viewport + 1, `${tag}: the ledger does not overflow the viewport`);
  await page.screenshot({ path: `test-results/proof-links/${name}.png`, fullPage: true });
  await page.close();
}
try {
  await runViewport({ name: "desktop-1440x1000", width: 1440, height: 1000, phone: false });
  await runViewport({ name: "phone-430x932", width: 430, height: 932, phone: true });
} finally { await browser.close(); }
ok(errors.length === 0, `no page or console errors: ${errors.join(" | ")}`);
console.log(`Part B (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
