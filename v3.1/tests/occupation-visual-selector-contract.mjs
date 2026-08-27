import assert from "node:assert/strict";
import { buildOccupationVisualProfile, OCCUPATION_VISUALS } from "../src/work-universe/occupationVisualProfileData.js";

assert.deepEqual(OCCUPATION_VISUALS.map(({ id, question }) => [id, question]), [
  ["graph", "What shape is this role?"],
  ["org", "What reports up to what?"],
  ["workflow", "Who acts when?"],
  ["stream", "Where does time go?"],
]);

const titleOnly = buildOccupationVisualProfile({ title: "Data Engineer", jobAnatomy: { duties: [{ text: "Build data pipelines" }] } });
assert.equal(titleOnly.status, "withheld");
assert.equal(titleOnly.recommendation, null);
assert.match(titleOnly.boundary, /not used to guess/i);

const unlinked = buildOccupationVisualProfile({
  occupation_visual_profile: {
    work_nature: "Engineering and technical systems",
    primary_visual: "workflow",
    why_this_visual: [{ reason: "The supplied profile declares movement of work." }],
  },
});
assert.equal(unlinked.status, "withheld");
assert.equal(unlinked.recommendation, null);
assert.match(unlinked.boundary, /no source-linked reason/i);

const supported = buildOccupationVisualProfile({
  workUniverse: {
    occupationVisualProfile: {
      escoOccupation: { id: "esco:2529", title: "Data engineer", confidence: "0.91" },
      workNature: "Engineering and technical systems",
      primaryVisual: "process flow",
      secondaryVisuals: ["role evidence map", "system architecture"],
      whyThisVisual: [{ sourceSpan: "D2", reason: "The source explicitly supplies an ordered delivery flow." }],
    },
  },
});
assert.equal(supported.status, "available");
assert.equal(supported.recommendation, "workflow");
assert.equal(supported.primary.id, "workflow");
assert.equal(supported.linkedReasons[0].evidenceId, "D2");
assert.equal(supported.escoOccupation.id, "esco:2529");
assert.deepEqual(supported.secondary.map((visual) => visual.id), ["graph", null]);
assert.deepEqual(supported.unsupported.map((visual) => visual.supplied), ["system architecture"]);

const unsupportedPrimary = buildOccupationVisualProfile({
  occupation_visual_profile: {
    primary_visual: "site map",
    why_this_visual: [{ source_span: "D1", reason: "The supplied profile requests a site map." }],
  },
});
assert.equal(unsupportedPrimary.status, "withheld");
assert.equal(unsupportedPrimary.recommendation, null);
assert.deepEqual(unsupportedPrimary.unsupported.map((visual) => visual.supplied), ["site map"]);
assert.match(unsupportedPrimary.boundary, /unavailable in this build/i);

console.log("Occupation visual selector payload contract: PASS");
