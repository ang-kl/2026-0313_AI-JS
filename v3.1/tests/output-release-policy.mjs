import assert from "node:assert/strict";
import { createOutputBlock } from "../src/contracts/evidenceContracts.js";
import { outputReleaseGate, OUTPUT_ACTIONS } from "../src/review/outputReleasePolicy.js";

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
ok(!conflict.allowed && conflict.reasons.includes("conflicting evidence is unresolved"), "unresolved conflict blocks every release action");
const withheld = outputReleaseGate(createOutputBlock({ id: "output:2", taskId: "resume-claim", promptVersion: "p1", schemaVersion: "s1", state: "WITHHELD", origin: "WITHHELD", sourceRefs: [] }), { currentSourceRefs: [] });
ok(!withheld.allowed && withheld.reasons.includes("no supported output is available"), "withheld output cannot be released");

console.log(`output release policy: PASS, ${checks} checks`);
