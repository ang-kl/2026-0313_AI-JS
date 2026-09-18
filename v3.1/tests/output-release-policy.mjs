import assert from "node:assert/strict";
import { createOutputBlock } from "../src/contracts/evidenceContracts.js";
import { outputReleaseGate, releaseGateFor, hasUnsupportedClaims, hasUnresolvedConflict, OUTPUT_ACTIONS } from "../src/review/outputReleasePolicy.js";

let checks = 0;
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const output = createOutputBlock({ id: "output:1", taskId: "resume-claim", promptVersion: "p1", schemaVersion: "s1", model: "provider/model", text: "Monitored operations.", sourceRefs: ["candidate:1", "job:1"], state: "PROPOSED", policyResult: "PASS", createdAt: "2026-09-16T08:10:00.000Z" });

const pass = outputReleaseGate(output, { currentSourceRefs: ["candidate:1", "job:1"] });
ok(pass.allowed && OUTPUT_ACTIONS.every((action) => pass.actions[action]), "all five release actions are enabled only on a current passing output");
const stale = outputReleaseGate(output, { currentSourceRefs: ["candidate:1", "job:2"] });
ok(!stale.allowed && OUTPUT_ACTIONS.every((action) => !stale.actions[action]) && stale.reasons.some((reason) => /stale/.test(reason)), "copy, save, print, PDF and export are all blocked on stale evidence");
const unsupported = outputReleaseGate(output, { currentSourceRefs: output.sourceRefs, hasUnsupported: true });
ok(!unsupported.allowed && unsupported.reasons.includes("unsupported content is present"), "unsupported content blocks every release action");
const conflict = outputReleaseGate(output, { currentSourceRefs: output.sourceRefs, hasConflict: true });
ok(!conflict.allowed && conflict.reasons.some((reason) => /marked conflicting/.test(reason) && /need not be one this output cites/.test(reason)) && conflict.flags.conflict, "unresolved conflict blocks every release action, and the reason states its quantifier: any record on the ledger, not only one this output cites");
const withheld = outputReleaseGate(createOutputBlock({ id: "output:2", taskId: "resume-claim", promptVersion: "p1", schemaVersion: "s1", state: "WITHHELD", origin: "WITHHELD", sourceRefs: [] }), { currentSourceRefs: [] });
ok(!withheld.allowed && withheld.reasons.includes("no supported output is available"), "withheld output cannot be released");


// The workbench gate: a HELD output judged against the LIVE rebuild. This is the check the first
// release could not make (it judged the live output against its own refs, a hash against itself).
const live = { output, items: [{ overclaim: { state: "SUPPORTED" } }] };
const noLedger = { records: [] };  // an EMPTY ledger: read, and free of conflict (a missing one is not)
const unassembled = releaseGateFor(null, live, noLedger);
ok(!unassembled.allowed && unassembled.reasons.includes("no output has been assembled yet") && OUTPUT_ACTIONS.every((action) => !unassembled.actions[action]), "before the human assembles, every action is blocked with the reason said");
const held = { output, trace: [], assembledAt: "2026-09-18T04:00:00.000Z" };
ok(releaseGateFor(held, live, noLedger).allowed, "a held output whose refs equal the live citable refs is released");
const moved = { output: createOutputBlock({ ...output, id: "output:3", sourceRefs: ["candidate:1"], state: "PROPOSED", policyResult: "PASS" }), items: live.items };
const staleGate = releaseGateFor(held, moved, noLedger);
ok(!staleGate.allowed && staleGate.stale && staleGate.reasons.some((reason) => /stale/.test(reason)), "when the live citable refs no longer equal the held output's, the stale branch FIRES and every action blocks (this is the assertion that dies if the gate compares the output against itself)");
const withdrawn = { output: createOutputBlock({ id: "output:4", taskId: "resume-claim", promptVersion: "p1", schemaVersion: "s1", state: "WITHHELD", origin: "WITHHELD", sourceRefs: [] }), items: [] };
ok(!releaseGateFor(held, withdrawn, noLedger).allowed && releaseGateFor(held, withdrawn, noLedger).stale, "when the live rebuild withholds everything, the held output is stale, not released on its stored refs");
// The WORDING dimension: a claim edited after assembly leaves the cited ref set untouched, so a
// refs-only gate would release the superseded wording (conformance-auditor C-1).
const reworded = { output: createOutputBlock({ ...output, id: "output:5", text: "Ran the regional operations desk.", sourceRefs: output.sourceRefs, state: "PROPOSED", policyResult: "PASS" }), items: live.items };
const textGate = releaseGateFor(held, reworded, noLedger);
ok(!textGate.allowed && textGate.stale && textGate.flags.staleText && !textGate.flags.staleRefs && textGate.reasons.some((reason) => /wording changed since assembly/.test(reason)), "when the wording moves under an unchanged ref set, the output is stale on the WORDING dimension alone (this is the assertion that dies if only refs are compared)");
ok(releaseGateFor(held, live, noLedger).flags.staleText === false && releaseGateFor(held, live, noLedger).flags.staleRefs === false, "an unmoved output is stale on neither dimension");
// The gate's flags are the signal; `stale` is read from them, never parsed back out of the prose.
ok(typeof textGate.flags === "object" && Object.keys(textGate.flags).length === 7 && textGate.flags.conflict === false, "the gate returns a flag per dimension, and an empty ledger is read as free of conflict");
ok(releaseGateFor(held, live, undefined).flags.conflict === true, "with NO ledger to read, the conflict dimension is not ruled out (fails if absence is reported as a clean bill of health)");
ok(hasUnresolvedConflict(undefined) && hasUnresolvedConflict({}) && !hasUnresolvedConflict({ records: [] }), "a missing or unreadable ledger cannot be reported as free of conflict; an empty one can");
ok(hasUnsupportedClaims([{}]) && hasUnsupportedClaims([null]), "an item carrying no overclaim assessment counts as unsupported, never as supported by default");
const unassembledActions = releaseGateFor(null, live, { records: [] }).actions;
ok(OUTPUT_ACTIONS.every((action) => unassembledActions[action] === false), "the per-action verdict covers the full governed action set even before assembly");
ok(hasUnsupportedClaims([{ overclaim: { state: "REVIEW" } }]) && !hasUnsupportedClaims([{ overclaim: { state: "SUPPORTED" } }]) && !hasUnsupportedClaims([]), "unsupported wording awaiting human review is detected from the live items' own assessment");
const reviewGate = releaseGateFor(held, { output, items: [{ overclaim: { state: "REVIEW", unsupportedWords: ["lunar"] } }] }, noLedger);
ok(!reviewGate.allowed && reviewGate.reasons.includes("unsupported content is present"), "a live proposal with unsupported wording blocks release even when the refs still match");
ok(hasUnresolvedConflict({ records: [{ record: { state: "CONFLICTING" } }] }) && !hasUnresolvedConflict({ records: [{ record: { state: "DEMONSTRATED" } }] }), "an unresolved conflict is detected from the ledger's records, and a ledger of accepted records is not");
const conflictGate = releaseGateFor(held, live, { records: [{ record: { state: "CONFLICTING" } }] });
ok(!conflictGate.allowed && conflictGate.flags.conflict && conflictGate.reasons.some((reason) => /marked conflicting/.test(reason)), "a conflict the human has not resolved blocks release");

console.log(`output release policy: PASS, ${checks} checks`);
