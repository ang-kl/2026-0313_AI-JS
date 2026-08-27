import assert from "node:assert/strict";
import { buildOrganisationMapData, ORGANISATION_MAP_DIMENSIONS } from "../src/work-universe/organisationMapData.js";

const empty = buildOrganisationMapData({ title: "Data Engineer" });
assert.equal(empty.status, "withheld");
assert.equal(empty.availableDimensions, 0);
assert.equal(empty.dimensions.length, 6);
assert.ok(empty.dimensions.every((dimension) => dimension.status === "withheld"));
assert.equal(empty.relationships.length, 0);
assert.equal(empty.chartNodes.length, 0);
assert.equal(empty.chartEdges.length, 0);
assert.equal(empty.economy.agentStatus, "withheld");
assert.equal(empty.economy.humanReservedStatus, "withheld");

const payload = buildOrganisationMapData({
  workUniverse: {
    organisation: {
      organisationMap: {
        functions: [{ id: "fn-data", label: "Data platform", evidenceIds: ["D1"] }],
        reportingBoundaries: [{ label: "Reports to Head of Data", evidenceIds: ["D2"] }],
        dependencies: [{ label: "Analytics team", direction: "downstream", evidenceIds: ["D3"] }],
        capabilities: [{ label: "Reliable data pipelines", evidenceIds: ["D1", "D4"] }],
        authority: [{ label: "Production approval", scope: "release", evidenceIds: ["D5"] }],
        processOwnership: [{ label: "Data-quality remediation", owner: "Data platform", evidenceIds: ["D6"] }],
        relationships: [{ from: "Data platform", to: "Analytics team", type: "supplies", evidenceIds: ["D3"] }],
      },
    },
  },
});

assert.equal(payload.status, "available");
assert.equal(payload.availableDimensions, ORGANISATION_MAP_DIMENSIONS.length);
assert.equal(payload.coverageLabel, "6 / 6");
assert.equal(payload.relationships.length, 1);
assert.equal(payload.chartNodes.length, 1);
assert.equal(payload.chartNodes[0].label, "Data platform");
assert.deepEqual(payload.evidenceIds.sort(), ["D1", "D2", "D3", "D4", "D5", "D6"]);
assert.match(payload.boundary, /does not infer organisation maturity/i);

const economy = buildOrganisationMapData({
  workUniverse: {
    organisation: {
      organisationMap: {
        nodes: [
          {
            id: "platform-leadership",
            label: "Platform leadership",
            kind: "function",
            evidenceIds: ["O1"],
            agentEconomy: [
              { id: "agent-observe", label: "Observe service health", humanOwner: "Platform owner", governanceReference: "GOV-7", evidenceIds: ["O3"] },
              { id: "agent-release", label: "Release production changes", evidenceIds: ["O4"] },
            ],
            humanReservedEconomy: [
              { id: "human-risk", label: "Accept production risk", reason: "Named accountable decision", evidenceIds: ["O5"] },
              { id: "human-escalation", label: "Resolve executive escalation" },
            ],
          },
          { id: "data-platform", label: "Data platform", kind: "team", parentId: "platform-leadership", evidenceIds: ["O2"] },
        ],
        relationships: [{ from: "Data platform", to: "Platform leadership", type: "escalates to", evidenceIds: ["O6"] }],
      },
    },
  },
});

assert.equal(economy.chartNodes.length, 2);
assert.equal(economy.chartNodes.find((node) => node.id === "data-platform").depth, 1);
assert.equal(economy.dimensions.find((dimension) => dimension.key === "functions").items.length, 1);
assert.equal(economy.chartEdges.length, 2);
assert.ok(economy.chartEdges.every((edge) => edge.linked));
assert.equal(economy.economy.agentStatus, "blocked");
assert.equal(economy.economy.humanReservedStatus, "unconfirmed");
assert.deepEqual(economy.economy.agent.map((item) => item.status), ["governed", "blocked"]);
assert.deepEqual(economy.economy.humanReserved.map((item) => item.status), ["reserved", "unconfirmed"]);
assert.match(economy.boundary, /economy classifications/i);

console.log("Organisation Map payload contract: PASS");
