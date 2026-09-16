import React from "react";
import { createRoot } from "react-dom/client";
import WorkUniverseLanding from "../src/work-universe/WorkUniverseLanding.jsx";

const posting = {
  title: "Investment Operations Specialist",
  employer: "Supplied test organisation",
  source: "Visual contract fixture",
  text: `
    <h2>Overview</h2><p>Support the supplied global investment operations function.</p>
    <h2>Responsibilities</h2><p>Manage the end-to-end settlement process.</p>
    <h2>Core Settlement</h2><p>Validate bond and repo trades against source documents.</p>
    <h2>Control and Exception Management</h2><p>Investigate settlement exceptions and escalate unresolved breaks.</p>
    <h2>Process Improvement &amp; Operational Excellence</h2><p>Improve controls using observed process evidence.</p>
    <h2>Job Requirements</h2><p>Five years of investment operations experience.</p>
  `,
  skills: ["Settlement Operations", "Exception Management"],
};

const result = {
  title: posting.title,
  employer: posting.employer,
  skills: [
    { skill: "Business Process Analysis" },
    { skill: "Exception Management" },
    { skill: "Operational Control" },
    { skill: "Settlement Operations" },
  ],
  jobAnatomy: {
    duties: [
      { text: "Manage the end-to-end settlement process for bonds and repos.", layer: "Activity", exposureNow: "MEDIUM" },
      { text: "Validate bond and repo trades against source documents.", layer: "Accountability", exposureNow: "LOW" },
      { text: "Investigate settlement exceptions and escalate unresolved breaks.", layer: "Judgment", exposureNow: "HUMAN" },
      { text: "Improve operational controls using observed process evidence.", layer: "Coordination", exposureNow: "LOW" },
    ],
  },
  workUniverse: {
    organisationSynthesis: {
      employer: { id: "org:supplied-test", name: "Supplied test organisation", ambiguous: false },
      postings: [
        { sourceId: "posting:one", employerId: "org:supplied-test", title: "Investment Operations Specialist", capabilities: [{ label: "Exception investigation", evidenceIds: ["D3"] }] },
        { sourceId: "posting:two", employerId: "org:supplied-test", title: "Settlement Operations Analyst", capabilities: [{ label: "Exception investigation", evidenceIds: ["D1"] }] },
      ],
    },
    occupationVisualProfile: {
      escoOccupation: { id: "esco:2411", title: "Investment operations specialist", confidence: "supplied" },
      workNature: "Ordered investment operations and exception control",
      primaryVisual: "workflow",
      secondaryVisuals: ["organisation map", "value stream map", "role graph"],
      whyThisVisual: [{ sourceSpan: "D1", reason: "The supplied evidence declares an ordered settlement workflow." }],
    },
    visualFamilies: {
      architecture: {
        contractVersion: "1.0.0",
        items: [
          { id: "architecture:source", label: "Trade source documents", description: "Supplied validation input", evidenceIds: ["D2"] },
          { id: "architecture:control", label: "Settlement control", description: "Supplied control boundary", evidenceIds: ["D1"] },
        ],
        links: [{ from: "architecture:source", to: "architecture:control", label: "validated by", evidenceIds: ["D1", "D2"] }],
      },
    },
    organisation: {
      organisationMap: {
        nodes: [
          { id: "operations-control", label: "Operations control", kind: "function", evidenceIds: ["D1"] },
          { id: "settlement-team", label: "Settlement team", kind: "team", parentId: "operations-control", evidenceIds: ["D2"] },
        ],
        functions: [{ id: "fn-operations", label: "Operations control", evidenceIds: ["D1"] }],
        reportingBoundaries: [{ label: "Settlement team to Operations control", evidenceIds: ["D2"] }],
        dependencies: [{ label: "Source-document validation", direction: "upstream", evidenceIds: ["D2"] }],
        capabilities: [{ label: "Exception investigation", evidenceIds: ["D3"] }],
        authority: [{ label: "Unresolved-break escalation", evidenceIds: ["D3"] }],
        processOwnership: [{ label: "Settlement control", owner: "Operations control", evidenceIds: ["D1"] }],
        relationships: [{ from: "Settlement team", to: "Operations control", type: "escalates to", evidenceIds: ["D3"] }],
      },
    },
    workflowMap: {
      steps: [
        { id: "validate", label: "Validate trades", order: 1, actor: "Operations specialist", evidenceIds: ["D2"] },
        { id: "investigate", label: "Investigate exceptions", order: 2, actor: "Operations specialist", queue: true, evidenceIds: ["D3"] },
        { id: "escalate", label: "Escalate unresolved breaks", order: 3, actor: "Human lead", decision: true, humanOwner: "Operations control", evidenceIds: ["D3"] },
      ],
      transitions: [
        { from: "validate", to: "investigate", type: "exception path", evidenceIds: ["D2", "D3"] },
        { from: "investigate", to: "escalate", type: "decision gate", evidenceIds: ["D3"] },
      ],
    },
    valueStreamMap: {
      hypothesis: true,
      summary: { totalTime: "3 hours", valueTime: "90 minutes", waitTime: "60 minutes" },
      stages: [
        { id: "receive", label: "Receive trade", order: 1, classification: "value", duration: 15, durationUnit: "minutes", owner: "Operations specialist", evidenceIds: ["D1"] },
        { id: "check", label: "Validate source documents", order: 2, classification: "value add", duration: 75, durationUnit: "minutes", owner: "Operations specialist", evidenceIds: ["D2"] },
        { id: "wait", label: "Await escalation decision", order: 3, classification: "wait", waitTime: 60, waitTimeUnit: "minutes", owner: "Operations control", doNotAutomate: true, evidenceIds: ["D3"] },
      ],
    },
  },
};

createRoot(document.getElementById("root")).render(
  <WorkUniverseLanding
    result={result}
    title={posting.title}
    employer={posting.employer}
    source={posting.source}
    posting={posting}
    onBack={() => {}}
    onEnterStudio={() => {}}
    onOpenRoleGraph={() => {}}
    onOpenAiMoments={() => {}}
    onPrintPackage={() => {}}
  />,
);
