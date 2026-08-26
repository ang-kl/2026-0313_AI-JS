import assert from "node:assert/strict";
import { buildOrganisationMapData, ORGANISATION_MAP_DIMENSIONS } from "../src/work-universe/organisationMapData.js";

const empty = buildOrganisationMapData({ title: "Data Engineer" });
assert.equal(empty.status, "withheld");
assert.equal(empty.availableDimensions, 0);
assert.equal(empty.dimensions.length, 6);
assert.ok(empty.dimensions.every((dimension) => dimension.status === "withheld"));
assert.equal(empty.relationships.length, 0);

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
assert.deepEqual(payload.evidenceIds.sort(), ["D1", "D2", "D3", "D4", "D5", "D6"]);
assert.match(payload.boundary, /does not infer organisation maturity/i);

console.log("Organisation Map payload contract: PASS");
