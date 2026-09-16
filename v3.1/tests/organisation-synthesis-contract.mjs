import assert from "node:assert/strict";
import { buildOrganisationSynthesis, ORGANISATION_SYNTHESIS_VERSION, WITHHELD_ORGANISATION_FIELDS } from "../src/work-universe/organisationSynthesisData.js";

let checks = 0;
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const eq = (actual, expected, message) => { checks += 1; assert.equal(actual, expected, message); };
const base = {
  workUniverse: { organisationSynthesis: {
    employer: { id: "uen:123", name: "Supplied Bank", ambiguous: false },
    postings: [
      { sourceId: "posting:1", employerId: "uen:123", title: "Role one", capabilities: [{ label: "Exception investigation", evidenceIds: ["D1"] }, { label: "Settlement control", evidenceIds: ["D2"] }] },
      { sourceId: "posting:2", employerId: "uen:123", title: "Role two", capabilities: [{ label: "exception investigation", evidenceIds: ["D3"] }] },
      { sourceId: "posting:3", employerId: "uen:other", title: "Other employer", capabilities: [{ label: "Exception investigation", evidenceIds: ["D4"] }] },
      { sourceId: "posting:4", employerId: "uen:123", title: "No provenance", capabilities: [{ label: "Exception investigation", evidenceIds: [] }] },
    ],
  } },
};
const data = buildOrganisationSynthesis(base);
eq(data.version, ORGANISATION_SYNTHESIS_VERSION, "synthesis contract is versioned");
eq(data.status, "available", "unambiguous source-linked repeated capabilities are available");
eq(data.groups.length, 1, "only capabilities repeated across two postings are grouped");
eq(data.groups[0].postingCount, 2, "group count uses distinct source postings");
assert.deepEqual(data.groups[0].sourceIdentifiers, ["posting:1", "posting:2"]); checks += 1;
assert.deepEqual(data.groups[0].evidenceIds, ["D1", "D3"]); checks += 1;
ok(data.excluded.some((item) => /different employer/.test(item.reason)), "posting from another employer identity is excluded");
ok(data.excluded.some((item) => /lacks a label or source evidence/.test(item.reason)), "unlinked capability is excluded");
ok(WITHHELD_ORGANISATION_FIELDS.every((field) => data.withheld[field].status === "WITHHELD"), "hierarchy, maturity, headcount, performance and ownership stay withheld");
eq(buildOrganisationSynthesis({ workUniverse: { organisationSynthesis: { ...base.workUniverse.organisationSynthesis, employer: { id: "uen:123", name: "Supplied Bank", ambiguous: true } } } }).status, "withheld", "ambiguous employer set is withheld");
eq(buildOrganisationSynthesis({}).status, "withheld", "missing synthesis is withheld");

console.log(`organisation synthesis contract: PASS, ${checks} checks`);
