import assert from "node:assert/strict";
import { BLUEPRINT_TRACE_VERSION, createBlueprintTrace, validateBlueprintTrace } from "../src/blueprint/blueprintTraceData.js";

let checks = 0;
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const trace = createBlueprintTrace({ id: "trace:one", requirement: "BLP-026", component: "Generated panel", sourceIds: ["D1", "D1", "D2"], status: "available", rule: "Appears because two source-linked facts satisfy the panel rule.", knownGap: "Reviewer decision pending." });
ok(trace.version === BLUEPRINT_TRACE_VERSION, "trace carries the current version");
ok(validateBlueprintTrace(trace).ok, "complete trace validates");
assert.deepEqual(trace.sourceIds, ["D1", "D2"]); checks += 1;
ok(trace.status === "AVAILABLE", "trace status is normalised");
ok(!validateBlueprintTrace({ ...trace, requirement: "" }).ok, "trace without requirement is refused");
ok(!validateBlueprintTrace({ ...trace, status: "COMPLETE" }).ok, "ungoverned runtime status is refused");
ok(!validateBlueprintTrace({ ...trace, version: "0.0.1" }).ok, "old trace version is refused");

console.log(`blueprint trace contract: PASS, ${checks} checks`);
