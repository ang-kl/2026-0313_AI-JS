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
