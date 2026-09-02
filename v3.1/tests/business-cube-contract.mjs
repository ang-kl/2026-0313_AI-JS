import assert from "node:assert/strict";
import { buildBusinessCubeModel, sectorEvidenceFromRegistry } from "../src/businessCubeModel.js";

const registry = {
  status: "done",
  retrievedAt: "2026-09-02T02:30:00.000Z",
  data: {
    matched: "exact",
    primarySsicCode: "64120",
    primarySsicDescription: "FULL BANKS",
  },
};

const agentModel = {
  functions: [
    { id: "fn-banking", name: "Banking and Finance" },
    { id: "fn-technology", name: "Information Technology" },
    { id: "fn-operations", name: "Operations" },
    { id: "fn-risk", name: "Risk and Compliance" },
  ],
  clusters: [
    { id: "c1", functionId: "fn-banking", repDuty: "Reconcile settlement exceptions", level: "MEDIUM", promoted: true, recurrence: 3, provenance: [{}, {}, {}] },
    { id: "c2", functionId: "fn-technology", repDuty: "Coordinate release handoffs", level: "LOW", promoted: false, recurrence: 2, provenance: [{}, {}] },
    { id: "c3", functionId: "fn-risk", repDuty: "Approve risk controls", level: "HUMAN", promoted: false, recurrence: 2, provenance: [{}, {}] },
    { id: "c4", functionId: "fn-operations", repDuty: "Prepare operations reports", level: "MEDIUM", promoted: false, recurrence: 1, provenance: [{}] },
  ],
  agents: [{ id: "a1", clusterId: "c1", label: "an agent that reconciles settlement exceptions" }],
};

const sector = sectorEvidenceFromRegistry(registry);
const cube = buildBusinessCubeModel(agentModel, sector);

assert.equal(cube.sector.label, "FULL BANKS");
assert.equal(cube.sector.code, "64120");
assert.equal(cube.sector.status, "exact");
assert.equal(cube.cells.length, 27, "business cube must always expose a stable 3 x 3 x 3 contract");
assert.equal(cube.axes.functions.length, 3);
assert.equal(cube.axes.functions[2].label, "Other supplied functions", "additional supplied functions must be grouped, not discarded");
assert.equal(cube.axes.workLayers.map((item) => item.label).join("|"), "Execute|Coordinate|Govern");
assert.equal(cube.axes.allocations.map((item) => item.label).join("|"), "Human-held|Augmentation review|Agent candidate");

const candidate = cube.cells.find((cell) => cell.clusters.some((cluster) => cluster.id === "c1"));
assert(candidate, "promoted cluster missing from cube");
assert.equal(candidate.workLayer.id, "execute");
assert.equal(candidate.allocation.id, "agent-candidate");
assert.equal(candidate.agents[0].id, "a1");

const human = cube.cells.find((cell) => cell.clusters.some((cluster) => cluster.id === "c3"));
assert.equal(human.workLayer.id, "govern");
assert.equal(human.allocation.id, "human-held");
assert(cube.cells.some((cell) => cell.status === "withheld"), "empty evidence cells must remain explicit");

const withheldSector = sectorEvidenceFromRegistry({ status: "done", data: { matched: false } });
assert.equal(withheldSector.status, "withheld");
assert.equal(withheldSector.label, "Sector evidence withheld");

console.log("Business Rubik's Cube contract: PASS");
