import assert from "node:assert/strict";
import { buildValueStreamMapData } from "../src/work-universe/valueStreamMapData.js";

const empty = buildValueStreamMapData({
  title: "Operations Manager",
  jobAnatomy: { duties: [{ text: "Coordinate service delivery" }, { text: "Reduce delays" }] },
});
assert.equal(empty.status, "withheld");
assert.equal(empty.stages.length, 0);
assert.equal(empty.summary.length, 0);
assert.match(empty.empty, /not silently converted into timing/i);

const payload = buildValueStreamMapData({
  workUniverse: {
    valueStreamMap: {
      hypothesis: true,
      summary: { totalTime: "3 days", valueTime: "4 hours", waitTime: "2 days" },
      stages: [
        { id: "approve", label: "Human approval", order: 3, classification: "value add", duration: 30, durationUnit: "minutes", owner: "Service lead", doNotAutomate: true, evidenceIds: ["D3"] },
        { id: "receive", label: "Receive request", order: 1, classification: "value", duration: "15 minutes", owner: "Coordinator", evidenceIds: ["D1"] },
        { id: "queue", label: "Await evidence", order: 2, classification: "wait", waitTime: 2, waitTimeUnit: "days", friction: "Incomplete evidence", agentCandidate: "Chase missing fields", evidenceIds: ["D2"] },
      ],
    },
  },
});

assert.equal(payload.status, "available");
assert.deepEqual(payload.stages.map((stage) => stage.id), ["receive", "queue", "approve"]);
assert.equal(payload.timedStages, 3);
assert.equal(payload.valueStages, 2);
assert.equal(payload.nonValueStages, 1);
assert.equal(payload.summary.length, 3);
assert.equal(payload.stages[1].waitTime, "2 days");
assert.equal(payload.stages[1].agentCandidate, "");
assert.equal(payload.stages[1].agentCandidateWithheld, true);
assert.equal(payload.blockedAgentCandidates, 1);
assert.equal(payload.stages[2].doNotAutomate, true);
assert.deepEqual(payload.evidenceIds.sort(), ["D1", "D2", "D3"]);
assert.match(payload.boundary, /does not infer timing/i);

console.log("Value Stream Map payload contract: PASS");
