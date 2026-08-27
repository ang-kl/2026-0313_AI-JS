import assert from "node:assert/strict";
import { buildWorkflowMapData } from "../src/work-universe/workflowMapData.js";

const empty = buildWorkflowMapData({
  title: "Data Engineer",
  jobAnatomy: { duties: [{ text: "Build data pipelines" }, { text: "Review data quality" }] },
});
assert.equal(empty.status, "withheld");
assert.equal(empty.steps.length, 0);
assert.equal(empty.connections.length, 0);
assert.match(empty.empty, /not silently converted into a process sequence/i);

const payload = buildWorkflowMapData({
  workUniverse: {
    workflowMap: {
      steps: [
        { id: "approve", label: "Approve release", order: 3, actor: "Human lead", decision: true, humanOwner: "Head of Data", evidenceIds: ["D3"] },
        { id: "observe", label: "Observe pipeline", order: 1, actor: "Data engineer", evidenceIds: ["D1"] },
        { id: "review", label: "Review exception", order: 2, actor: "Data engineer", queue: true, bottleneck: true, evidenceIds: ["D2"] },
      ],
      transitions: [
        { from: "observe", to: "review", type: "handoff", evidenceIds: ["D1", "D2"] },
        { from: "review", to: "approve", type: "decision gate", evidenceIds: ["D3"] },
        { from: "missing", to: "approve", type: "invalid" },
      ],
    },
  },
});

assert.equal(payload.status, "available");
assert.deepEqual(payload.steps.map((step) => step.id), ["observe", "review", "approve"]);
assert.equal(payload.actorCount, 2);
assert.equal(payload.decisionCount, 1);
assert.equal(payload.queueCount, 1);
assert.equal(payload.bottleneckCount, 1);
assert.equal(payload.connections.length, 2);
assert.equal(payload.connections[0].handoff, true);
assert.equal(payload.unresolvedConnections, 1);
assert.deepEqual(payload.evidenceIds.sort(), ["D1", "D2", "D3"]);
assert.match(payload.boundary, /does not infer process order/i);

console.log("Workflow Map payload contract: PASS");
