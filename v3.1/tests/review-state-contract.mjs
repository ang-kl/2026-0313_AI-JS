import assert from "node:assert/strict";
import { ORIGIN, createReviewChange, sha256Hex } from "../src/contracts/evidenceContracts.js";
import { LOCAL_HUMAN_ACTOR } from "../src/review/reviewerContract.js";
import {
  FIRST_CLASS_REVIEW_OPERATIONS,
  REVIEW_ITEM_STATUS,
  REVIEW_STATE_VERSION,
  applyReviewOperation,
  createReviewState,
  projectReviewItems,
  seedReviewEvent,
  validateReviewState,
  validateReviewTransition,
} from "../src/review/reviewState.js";

let checks = 0;
const ok = (value, message) => { checks += 1; assert.ok(value, message); };
const eq = (actual, expected, message) => { checks += 1; assert.equal(actual, expected, message); };
const deq = (actual, expected, message) => { checks += 1; assert.deepEqual(actual, expected, message); };
const t = (second) => `2026-09-16T07:00:${String(second).padStart(2, "0")}.000Z`;
const sourceText = "Monitor service exceptions. Prepare variance commentary. Coordinate access reviews.";
const sourceId = "src:posting:review-fixture";
const spans = [
  { id: "span:posting:0-27", sourceId, text: "Monitor service exceptions.", evidenceSpanIds: ["span:posting:0-27"], origin: ORIGIN.SOURCE_VERBATIM },
  { id: "span:posting:28-56", sourceId, text: "Prepare variance commentary.", evidenceSpanIds: ["span:posting:28-56"], origin: ORIGIN.SOURCE_VERBATIM },
  { id: "span:posting:18-56", sourceId, text: "exceptions. Prepare variance commentary.", evidenceSpanIds: ["span:posting:18-56"], origin: ORIGIN.SOURCE_VERBATIM },
];

deq(FIRST_CLASS_REVIEW_OPERATIONS, ["split", "merge", "relabel", "escalate", "withhold", "resolve", "reopen", "undo"], "the eight BLP-013 operations are explicit and ordered");
ok(REVIEW_ITEM_STATUS.includes("withheld"), "the projection discloses withholding as its own state rather than folding it into open");
eq(REVIEW_STATE_VERSION, "1.0.0", "review state contract is versioned");

let state = createReviewState({ sourceId, sourceText, spans });
ok(Object.isFrozen(state.source) && state.spans.every(Object.isFrozen), "source snapshot and source spans are immutable values");
ok(validateReviewState(state).ok, "an empty review state validates");

const seeds = [
  ["seed-split", "proposal", "split", "reviewer:process-redesign", [spans[0].id]],
  ["seed-merge", "proposal", "merge", "reviewer:process-redesign", [spans[0].id, spans[1].id]],
  ["seed-relabel", "proposal", "relabel", LOCAL_HUMAN_ACTOR.id, [spans[1].id]],
  ["seed-escalate", "comment", "comment", "reviewer:ai-exposure", [spans[0].id]],
  ["seed-withhold", "comment", "withhold", "reviewer:signal-auditor", [spans[1].id]],
];
for (const [index, row] of seeds.entries()) {
  const [id, kind, verb, reviewerId, targetSpanIds] = row;
  const seeded = seedReviewEvent(state, createReviewChange({
    id,
    kind,
    verb,
    targetSpanIds,
    reviewerId,
    reason: verb === "withhold" ? "Evidence is incomplete" : `Fixture ${verb}`,
    createdAt: t(index + 1),
    evidenceSpanIds: targetSpanIds,
    origin: ORIGIN.DETERMINISTIC,
    proposedText: kind === "proposal" ? `Proposed ${verb}` : undefined,
  }));
  ok(seeded.ok, `seed ${id} enters append-only history`);
  state = seeded.state;
}
eq(projectReviewItems(state).length, seeds.length, "each seeded comment or proposal projects as one open review item");

const originalSource = state.source;
const originalSpans = state.spans;
const prefix = JSON.stringify(state.history);

const split = applyReviewOperation(state, {
  verb: "split",
  actorId: LOCAL_HUMAN_ACTOR.id,
  predecessorId: "seed-split",
  targetSpanIds: [spans[0].id],
  parts: ["Monitor the service", "Investigate exceptions"],
  reason: "Two accountable actions are bundled",
}, t(10));
ok(split.ok && split.eventIds.length === 2, "split appends a human decision and a system change");
state = split.state;
const splitRows = state.overlays.filter((row) => row.operation === "split");
eq(splitRows.length, 2, "split creates two overlays, never edits source text");
ok(splitRows.every((row) => row.sourceId === sourceId && row.parentSpanIds.includes(spans[0].id) && row.evidenceSpanIds.includes(spans[0].id)), "every split overlay preserves source, parent and evidence identifiers");
eq(state.spans[2], originalSpans[2], "a split over one span leaves the overlapping source span byte-identical and at the same identity");

const merge = applyReviewOperation(state, {
  verb: "merge",
  actorId: LOCAL_HUMAN_ACTOR.id,
  predecessorId: "seed-merge",
  targetSpanIds: [spans[0].id, spans[1].id],
  text: "Monitor exceptions and prepare variance commentary",
  reason: "One operating-control duty",
}, t(11));
ok(merge.ok && merge.eventIds.length === 2, "merge appends a human decision and a system change");
state = merge.state;
const mergeRow = state.overlays.find((row) => row.operation === "merge");
deq(mergeRow.parentSpanIds, [spans[0].id, spans[1].id], "merge preserves every parent span id in order");
deq(mergeRow.evidenceSpanIds, [spans[0].id, spans[1].id], "merge preserves every supporting evidence id");

const relabel = applyReviewOperation(state, {
  verb: "relabel",
  actorId: LOCAL_HUMAN_ACTOR.id,
  predecessorId: "seed-relabel",
  targetSpanIds: [spans[1].id],
  label: "Finance control evidence",
  reason: "Use the supplied duty's narrower evidence label",
}, t(12));
ok(relabel.ok && relabel.eventIds.length === 2, "relabel appends a human decision and a system change");
state = relabel.state;
const relabelRow = state.overlays.find((row) => row.operation === "relabel");
eq(relabelRow.origin, ORIGIN.SOURCE_VERBATIM, "relabel keeps the parent's provenance exactly");
eq(relabelRow.text, spans[1].text, "relabel is an overlay and does not rewrite source text");

const escalated = applyReviewOperation(state, {
  verb: "escalate",
  actorId: LOCAL_HUMAN_ACTOR.id,
  predecessorId: "seed-escalate",
  targetSpanIds: [spans[0].id],
  reason: "The employer must decide whether exception ownership is operational or financial",
}, t(13));
ok(escalated.ok, "escalate succeeds with an explicit reason");
state = escalated.state;
const escalatedId = escalated.eventIds[0];
eq(projectReviewItems(state).find((item) => item.id === "seed-escalate").status, "escalated", "escalation projects distinctly");

const withheld = applyReviewOperation(state, {
  verb: "withhold",
  actorId: LOCAL_HUMAN_ACTOR.id,
  predecessorId: "seed-withhold",
  targetSpanIds: [spans[1].id],
  reason: "No outcome or threshold supports this claim",
}, t(14));
ok(withheld.ok, "withhold succeeds with an explicit reason");
state = withheld.state;
eq(projectReviewItems(state).find((item) => item.id === "seed-withhold").status, "withheld", "withholding projects distinctly");

const resolved = applyReviewOperation(state, {
  verb: "resolve",
  actorId: LOCAL_HUMAN_ACTOR.id,
  predecessorId: escalatedId,
  targetSpanIds: [spans[0].id],
  reason: "Human lead confirmed operational ownership",
}, t(15));
ok(resolved.ok, "resolve closes the escalated item without deleting its escalation");
state = resolved.state;
eq(projectReviewItems(state).find((item) => item.id === "seed-escalate").status, "resolved", "resolved status projects from the same root item");

const reopened = applyReviewOperation(state, {
  verb: "reopen",
  actorId: LOCAL_HUMAN_ACTOR.id,
  predecessorId: resolved.eventIds[0],
  targetSpanIds: [spans[0].id],
  reason: "New evidence needs review",
}, t(16));
ok(reopened.ok, "reopen adds a reversal event");
state = reopened.state;
eq(projectReviewItems(state).find((item) => item.id === "seed-escalate").status, "open", "reopen returns the item to open");

const undone = applyReviewOperation(state, {
  verb: "undo",
  actorId: LOCAL_HUMAN_ACTOR.id,
  predecessorId: reopened.eventIds[0],
  targetSpanIds: [spans[0].id],
  reason: "Reopening was accidental",
}, t(17));
ok(undone.ok, "undo appends a reversal event");
state = undone.state;
eq(projectReviewItems(state).find((item) => item.id === "seed-escalate").status, "resolved", "undo restores the visible status that existed before the reversed event");

eq(state.source, originalSource, "every operation keeps the exact immutable source snapshot object");
eq(state.spans, originalSpans, "every operation keeps the exact immutable source-span collection");
eq(state.source.text, sourceText, "source text remains byte-identical after every operation");
ok(JSON.stringify(state.history).startsWith(prefix.slice(0, -1)), "the original history remains an unchanged prefix of the append-only history");
ok(validateReviewState(state).ok, "the complete eight-operation state validates");

const acceptedSeed = seedReviewEvent(state, createReviewChange({ id: "seed-accept", kind: "comment", verb: "comment", targetSpanIds: [spans[2].id], reviewerId: "reviewer:candidate-advocate", reason: "Candidate proof question", createdAt: t(18), evidenceSpanIds: [spans[2].id], origin: ORIGIN.DETERMINISTIC }));
ok(acceptedSeed.ok, "a later proposal appends after the complete operation history");
const beforeAccept = acceptedSeed.state;
const accepted = applyReviewOperation(beforeAccept, { verb: "accept", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-accept", targetSpanIds: [spans[2].id], reason: "Evidence reviewed" }, t(19));
ok(accepted.ok, "accept appends an auditable human decision");
eq(projectReviewItems(accepted.state).find((item) => item.id === "seed-accept").status, "accepted", "accepted status projects without deleting the proposal");
ok(validateReviewTransition(beforeAccept, accepted.state).ok, "accept is an immutable append-only transition");

const rejectSeed = seedReviewEvent(accepted.state, createReviewChange({ id: "seed-reject", kind: "comment", verb: "comment", targetSpanIds: [spans[2].id], reviewerId: "reviewer:candidate-advocate", reason: "Second candidate proof question", createdAt: t(20), evidenceSpanIds: [spans[2].id], origin: ORIGIN.DETERMINISTIC }));
ok(rejectSeed.ok, "a reject fixture proposal appends");
const rejected = applyReviewOperation(rejectSeed.state, { verb: "reject", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-reject", targetSpanIds: [spans[2].id], reason: "The evidence does not support the comment" }, t(21));
ok(rejected.ok, "reject appends an auditable human decision");
eq(projectReviewItems(rejected.state).find((item) => item.id === "seed-reject").status, "rejected", "rejected status projects while the proposal remains in history");
ok(rejected.state.history.some((event) => event.id === "seed-reject") && rejected.state.history.some((event) => event.verb === "reject" && event.predecessorId === "seed-reject"), "reject preserves both proposal and decision events");
state = rejected.state;
const rejectedStructural = applyReviewOperation(state, { verb: "split", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: rejected.eventIds[0], targetSpanIds: [spans[2].id], parts: ["first", "second"], reason: "must remain rejected" }, t(22));
ok(!rejectedStructural.ok && /requires an open review item/.test(rejectedStructural.error), "a rejected item cannot be structurally changed or promoted back to open by another action");
eq(projectReviewItems(rejectedStructural.state).find((item) => item.id === "seed-reject").status, "rejected", "the refused structural action leaves the rejected decision visible");
state = rejectedStructural.state;

const overlapSeed = seedReviewEvent(state, createReviewChange({ id: "seed-overlap", kind: "proposal", verb: "merge", targetSpanIds: [spans[0].id, spans[2].id], reviewerId: "reviewer:process-redesign", reason: "Overlapping-span fixture", createdAt: t(23), evidenceSpanIds: [spans[0].id, spans[2].id], origin: ORIGIN.DETERMINISTIC, proposedText: "Commonised exception duty" }));
ok(overlapSeed.ok, "an overlapping-span merge proposal is recorded without collapsing either source span");
const overlapMerge = applyReviewOperation(overlapSeed.state, { verb: "merge", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-overlap", targetSpanIds: [spans[0].id, spans[2].id], text: "Commonised exception duty", reason: "Reviewer confirmed the overlap" }, t(24));
ok(overlapMerge.ok, "a guarded merge can cite two overlapping spans explicitly");
const overlapOverlay = overlapMerge.state.overlays.find((overlay) => overlay.createdByEventId === overlapMerge.eventIds[1]);
deq(overlapOverlay.parentSpanIds, [spans[0].id, spans[2].id], "the overlap overlay preserves both distinct parents instead of coalescing their identifiers");
eq(overlapMerge.state.spans[0], originalSpans[0], "the first overlapping source span remains immutable");
eq(overlapMerge.state.spans[2], originalSpans[2], "the second overlapping source span remains immutable");
state = overlapMerge.state;

const swappedText = `${state.source.text} changed`;
const replacedSource = { ...state, source: Object.freeze({ ...state.source, text: swappedText, textHash: sha256Hex(swappedText) }) };
ok(validateReviewState(replacedSource).errors.every((error) => !/source/.test(error)), "the swapped source is internally consistent, so state validation raises no source error and cannot satisfy the assertion below");
deq(validateReviewTransition(state, replacedSource).errors.filter((error) => /source/.test(error)), ["review source is immutable across transitions"], "a self-consistent source swap is caught by the transition guard itself, named exactly");
const rewrittenHistory = { ...state, history: state.history.map((event, index) => index === 0 ? { ...event, reason: "rewritten" } : event) };
ok(!validateReviewTransition(state, rewrittenHistory).ok && validateReviewTransition(state, rewrittenHistory).errors.some((error) => /unchanged prefix/.test(error)), "rewriting an earlier event fails append-only validation");
const shortenedHistory = { ...state, history: state.history.slice(1) };
ok(!validateReviewTransition(state, shortenedHistory).ok && validateReviewTransition(state, shortenedHistory).errors.some((error) => /unchanged prefix|predecessor/.test(error)), "deleting earlier history fails validation");

const reject = (request, at, pattern, label) => {
  const before = state.history;
  const result = applyReviewOperation(state, request, at);
  ok(!result.ok && pattern.test(result.error), label);
  eq(result.state.history, before, `${label}: refusal appends no history event`);
  state = result.state;
};
reject({ verb: "split", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-split", targetSpanIds: [spans[0].id], parts: ["only one"] }, t(25), /at least two/, "invalid split is guarded");
reject({ verb: "merge", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-merge", targetSpanIds: [spans[0].id] }, t(26), /at least two/, "invalid merge is guarded");
reject({ verb: "relabel", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-relabel", targetSpanIds: [spans[1].id], label: "Upgraded", origin: ORIGIN.DETERMINISTIC }, t(27), /cannot change or upgrade provenance/, "relabel provenance upgrade is refused");
reject({ verb: "escalate", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-escalate", targetSpanIds: [spans[0].id] }, t(28), /explicit reason/, "escalation without reason is refused");
reject({ verb: "withhold", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-withhold", targetSpanIds: [spans[1].id] }, t(29), /explicit reason/, "withholding without reason is refused");
reject({ verb: "resolve", actorId: LOCAL_HUMAN_ACTOR.id, targetSpanIds: [spans[0].id] }, t(30), /requires the event/, "resolve without a predecessor is refused");
reject({ verb: "reopen", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-relabel", targetSpanIds: [spans[1].id] }, t(31), /latest event/, "reopening from superseded history is refused");
reject({ verb: "undo", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: resolved.eventIds[0], targetSpanIds: [spans[0].id] }, t(32), /latest event/, "undo of earlier history is refused");
reject({ verb: "withhold", actorId: "reviewer:signal-auditor", predecessorId: "seed-withhold", targetSpanIds: [spans[1].id], reason: "Reviewer tried to decide" }, t(33), /require human:local-user/, "reviewer voices cannot execute human operations");

const staleState = createReviewState({ sourceId, sourceText, spans: [{ ...spans[0], stale: true }] });
const staleSeed = seedReviewEvent(staleState, createReviewChange({ id: "stale-seed", kind: "comment", verb: "comment", targetSpanIds: [spans[0].id], reviewerId: "reviewer:ai-exposure", reason: "stale fixture", createdAt: t(1), evidenceSpanIds: [spans[0].id], origin: ORIGIN.DETERMINISTIC })).state;
const staleResult = applyReviewOperation(staleSeed, { verb: "withhold", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "stale-seed", targetSpanIds: [spans[0].id], reason: "stale" }, t(2));
ok(!staleResult.ok && /stale target/.test(staleResult.error), "a stale span cannot be acted on or upgraded");

// ---------------------------------------------------------------------------
// BLP-013 obligations. Each entry below closes a gap the audit measured: a
// mutation of the library that the delivered suite did not notice. The comment
// on each names the mutation it must kill, so a later reader can re-run the
// harness and check the remedy against the survivor it claims to close.
// ---------------------------------------------------------------------------

// OBLIGATION 1 - kills M06 (relabel accepts an empty label).
reject({ verb: "relabel", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-relabel", targetSpanIds: [spans[1].id], label: "   " }, t(34), /relabel requires a non-empty label/, "relabel with a whitespace-only label is refused");

// OBLIGATION 2 - kills M08 (resolve permitted from any status). seed-reject is
// rejected and its latest event is the reject decision, so every earlier guard
// passes and only the resolve precondition can refuse this.
reject({ verb: "resolve", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: rejected.eventIds[0], targetSpanIds: [spans[2].id], reason: "rejected items are not resolvable" }, t(35), /resolve requires an open, escalated or withheld item; .* is rejected/, "resolve is refused on a rejected item");

// OBLIGATION 3 - kills M09 (reopen permitted from any status). A freshly seeded
// item is open and its own seed is its latest event, so only the reopen
// precondition can refuse this.
const openSeed = seedReviewEvent(state, createReviewChange({ id: "seed-open", kind: "comment", verb: "comment", targetSpanIds: [spans[2].id], reviewerId: "reviewer:ai-exposure", reason: "an item left open", createdAt: t(36), evidenceSpanIds: [spans[2].id], origin: ORIGIN.DETERMINISTIC }));
ok(openSeed.ok, "an open item is seeded for the reopen precondition");
state = openSeed.state;
reject({ verb: "reopen", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-open", targetSpanIds: [spans[2].id], reason: "already open" }, t(37), /reopen requires a closed, escalated or withheld item; .* is open/, "reopen is refused on an item that is already open");

// OBLIGATION 6 - kills M24 (split accepts more than one target span).
reject({ verb: "split", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-open", targetSpanIds: [spans[0].id, spans[1].id], parts: ["first", "second"], reason: "two targets" }, t(38), /split requires one target/, "split naming two target spans is refused");

// OBLIGATION 4 - kills M20 (the relabel invariant in validateReviewState). That
// invariant is defensive: no state the library builds can violate it, so it is
// unreachable without hand-building the violation.
const forgedRelabel = { ...state, overlays: state.overlays.map((overlay) => overlay.operation === "relabel" ? { ...overlay, origin: ORIGIN.USER_AUTHORED } : overlay) };
ok(!validateReviewState(forgedRelabel).ok && validateReviewState(forgedRelabel).errors.some((error) => /relabel overlay .* changed provenance/.test(error)), "a relabel overlay whose origin differs from its parent is refused by state validation");

// OBLIGATION 5 - kills M21 (the overlay half of append-only). The suite already
// covers the history prefix; nothing covered overlays.
const rewrittenOverlay = { ...state, overlays: state.overlays.map((overlay, index) => index === 0 ? { ...overlay, text: "rewritten overlay text" } : overlay) };
ok(!validateReviewTransition(state, rewrittenOverlay).ok && validateReviewTransition(state, rewrittenOverlay).errors.some((error) => /overlays must preserve every earlier overlay as an unchanged prefix/.test(error)), "rewriting an earlier overlay fails append-only validation");

// OBLIGATION 8 - relabel origin inheritance across ALL FIVE origins. The
// delivered check hardcoded SOURCE_VERBATIM against fixtures that were all
// SOURCE_VERBATIM, so it could not tell inheritance from a constant.
for (const [name, origin] of Object.entries(ORIGIN)) {
  const parentId = `span:origin:${name}`;
  let originState = createReviewState({ sourceId, sourceText, spans: [{ id: parentId, sourceId, text: spans[0].text, evidenceSpanIds: [parentId], origin }] });
  originState = seedReviewEvent(originState, createReviewChange({ id: `seed-origin-${name}`, kind: "proposal", verb: "relabel", targetSpanIds: [parentId], reviewerId: LOCAL_HUMAN_ACTOR.id, reason: `Relabel fixture for ${name}`, createdAt: t(1), evidenceSpanIds: [parentId], origin: ORIGIN.DETERMINISTIC, proposedText: "Proposed relabel" })).state;
  const relabelled = applyReviewOperation(originState, { verb: "relabel", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: `seed-origin-${name}`, targetSpanIds: [parentId], label: "Reviewer label", reason: "Origin inheritance fixture" }, t(2));
  ok(relabelled.ok, `relabel succeeds over a ${name} parent`);
  eq(relabelled.state.overlays.find((overlay) => overlay.operation === "relabel").origin, origin, `relabel inherits the parent's ${name} provenance instead of asserting a constant`);
}

// OBLIGATION 9 - merge across two sources. Criterion (2) is "preserve all source
// and parent identifiers"; every delivered merge fixture shared one source.
const twoSourceSpans = [
  { id: "span:multi:a", sourceId, text: spans[0].text, evidenceSpanIds: ["span:multi:a"], origin: ORIGIN.SOURCE_VERBATIM },
  { id: "span:multi:b", sourceId: "src:posting:second-source", text: spans[1].text, evidenceSpanIds: ["span:multi:b"], origin: ORIGIN.SOURCE_VERBATIM },
];
let multiState = createReviewState({ sourceId, sourceText, spans: twoSourceSpans });
multiState = seedReviewEvent(multiState, createReviewChange({ id: "seed-multi", kind: "proposal", verb: "merge", targetSpanIds: ["span:multi:a", "span:multi:b"], reviewerId: "reviewer:process-redesign", reason: "Two-source merge fixture", createdAt: t(1), evidenceSpanIds: ["span:multi:a", "span:multi:b"], origin: ORIGIN.DETERMINISTIC, proposedText: "Proposed merge" })).state;
const multiMerge = applyReviewOperation(multiState, { verb: "merge", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-multi", targetSpanIds: ["span:multi:a", "span:multi:b"], text: "One duty drawn from two postings", reason: "The same duty appears in both" }, t(2));
ok(multiMerge.ok, "a merge may cite spans from two different sources");
const multiOverlay = multiMerge.state.overlays.find((overlay) => overlay.operation === "merge");
deq(multiOverlay.sourceIds, [sourceId, "src:posting:second-source"], "a two-source merge preserves BOTH source identifiers");
eq(multiOverlay.sourceId, null, "a two-source merge withholds the singular sourceId rather than silently picking one");
deq(multiOverlay.parentSpanIds, ["span:multi:a", "span:multi:b"], "a two-source merge preserves both parent identifiers");
ok(validateReviewState(multiMerge.state).ok, "the two-source merge state validates");

// OBLIGATION 10 - the replacement for the check whose subject could not fail it.
// Drives an undo and reads the PROJECTION, rather than asserting membership of a
// frozen array. True both before and after "undone" leaves the vocabulary.
const undoFixture = applyReviewOperation(state, { verb: "escalate", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-open", targetSpanIds: [spans[2].id], reason: "Escalated so the undo has a prior status to restore" }, t(39));
ok(undoFixture.ok, "an item is escalated so that undo has a prior status to restore");
eq(projectReviewItems(undoFixture.state).find((item) => item.id === "seed-open").status, "escalated", "the fixture item is escalated before the undo");
const undoneItem = applyReviewOperation(undoFixture.state, { verb: "undo", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: undoFixture.eventIds[0], targetSpanIds: [spans[2].id], reason: "The escalation was accidental" }, t(40));
ok(undoneItem.ok, "undo appends a reversal event");
const afterUndo = projectReviewItems(undoneItem.state).find((item) => item.id === "seed-open").status;
eq(afterUndo, "open", "undo restores the status the item held before the reversed event");
ok(afterUndo !== "undone", "an undone item projects as its RESTORED status and never as \"undone\" - the status no operation can produce");
ok(!projectReviewItems(undoneItem.state).some((item) => item.status === "undone"), "no projected item anywhere carries the unreachable \"undone\" status");

// OBLIGATION 11 - the merge-origin branches. Supervisor ruling (ii), taken by the
// Human Lead: ORIGIN says how a STRING came to exist, not who decided to make it.
// A merge with no supplied text is a deterministic join of the parents' own text and
// no human wrote a character of it, so it reads DETERMINISTIC. A merge whose text the
// person typed reads USER_AUTHORED. Split parts are always typed, so they stay
// USER_AUTHORED - that is correct rather than merely conservative.
let originState2 = createReviewState({ sourceId, sourceText, spans });
for (const [id, verb, targets] of [["seed-join", "merge", [spans[0].id, spans[1].id]], ["seed-typed", "merge", [spans[0].id, spans[1].id]], ["seed-parts", "split", [spans[2].id]]]) {
  originState2 = seedReviewEvent(originState2, createReviewChange({ id, kind: "proposal", verb, targetSpanIds: targets, reviewerId: "reviewer:process-redesign", reason: `Origin-branch fixture ${id}`, createdAt: t(1), evidenceSpanIds: targets, origin: ORIGIN.DETERMINISTIC, proposedText: "Proposed" })).state;
}
const joined = applyReviewOperation(originState2, { verb: "merge", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-join", targetSpanIds: [spans[0].id, spans[1].id], reason: "No text supplied; the engine joins the parents" }, t(2));
ok(joined.ok, "a merge with no supplied text succeeds");
const joinedOverlay = joined.state.overlays.find((overlay) => overlay.operation === "merge");
eq(joinedOverlay.text, `${spans[0].text}; ${spans[1].text}`, "a merge with no supplied text joins the parents' own text deterministically");
eq(joinedOverlay.origin, ORIGIN.DETERMINISTIC, "a merge no human wrote reads DETERMINISTIC, not USER_AUTHORED");

const typed = applyReviewOperation(joined.state, { verb: "merge", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-typed", targetSpanIds: [spans[0].id, spans[1].id], text: "One operating-control duty", reason: "The person wrote the merged text" }, t(3));
ok(typed.ok, "a merge with supplied text succeeds");
const typedOverlay = typed.state.overlays.find((overlay) => overlay.text === "One operating-control duty");
eq(typedOverlay.origin, ORIGIN.USER_AUTHORED, "a merge whose text the person typed reads USER_AUTHORED");

const partsSplit = applyReviewOperation(typed.state, { verb: "split", actorId: LOCAL_HUMAN_ACTOR.id, predecessorId: "seed-parts", targetSpanIds: [spans[2].id], parts: ["Own the exception queue", "Write the variance note"], reason: "The person authors both parts" }, t(4));
ok(partsSplit.ok, "a split succeeds");
ok(partsSplit.state.overlays.filter((overlay) => overlay.operation === "split" && overlay.createdByEventId === partsSplit.eventIds[1]).every((overlay) => overlay.origin === ORIGIN.USER_AUTHORED), "split parts read USER_AUTHORED because the person types them");

console.log(`Review-state contract: PASS, ${checks} checks`);
