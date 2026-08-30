import assert from "node:assert/strict";
import { jobAdSections, jobAdText } from "../src/review/job-ad-sections.js";

const source = jobAdText({ description: `
  <h2>Overview</h2><p>Support the global investment operations function.</p>
  <h2>Responsibilities</h2><p>Manage the end-to-end settlement process.</p>
  <h2>Core Settlement</h2><p>Validate bond and repo trades against source documents.</p>
  <h2>Control and Exception Management</h2><p>Investigate settlement exceptions and escalate unresolved breaks.</p>
  <h2>Process Improvement &amp; Operational Excellence</h2><p>Improve controls using observed process evidence.</p>
  <h2>Job Requirements</h2><p>Five years of investment operations experience.</p>
` });

const sections = jobAdSections(source);
assert.deepEqual(
  sections.map((section) => section.canon || section.title),
  [
    "Role overview",
    "Responsibilities",
    "Core Settlement",
    "Control and Exception Management",
    "Process Improvement & Operational Excellence",
    "Job Requirements",
  ],
  "The Work Universe and Role Graph must share the posting's real section order",
);
assert.equal(sections[2].lines[0], "Validate bond and repo trades against source documents.");

const noInventedSections = jobAdSections("Overview\nA supplied overview sentence.");
assert.deepEqual(noInventedSections.map((section) => section.canon || section.title), ["Role overview"]);

const schedule = jobAdSections("Overview\nA supplied overview sentence.\nFriday: 8:30 AM - 5:30 PM\nRequirements\nA supplied requirement.");
assert.equal(schedule.some((section) => section.title === "Friday: 8:30 AM - 5:30 PM"), false, "Schedules must not become headings");
assert.equal(schedule.at(-1).canon, "Requirements");

console.log("job-ad-sections-contract: PASS");
