import assert from "node:assert/strict";
import { buildGovernanceLedgerData, GOVERNANCE_HUMAN_STATES } from "../src/work-universe/governanceLedgerData.js";

const empty = buildGovernanceLedgerData({ title: "Data Engineer", duties: ["Own data pipelines"] });
assert.equal(empty.ledger.length, 0, "a role title or duty must not create governance records");
assert.equal(empty.disagreements.length, 0, "absence must not create reviewer conflict or consensus");

const fixture = {
  governanceLedger: [
    {
      id: "GOV-1",
      decision: "Release an agent-produced service report",
      evidenceIds: ["O1", "A1"],
      deterministicResult: "Required source checks passed",
      aiInterpretation: "The report is ready for owner review",
      riskClass: "material",
      scope: "One service report",
      humanOwner: "Service owner",
      allowedAction: "Draft the report",
      forbiddenAction: "Publish without sign-off",
      guardrails: ["Retain source links"],
      transparencyNote: "AI interpretation is advisory",
      overridePath: "Escalate to the service owner",
      auditTrail: [{ action: "Draft created", actor: "Reporting agent", at: "2026-08-27T10:00:00Z" }],
      agentIdentity: {
        name: "Reporting Reviewer",
        purpose: "Review supplied report evidence",
        lens: "Governance Review",
        evidenceIds: ["O1", "A1"],
        usedDeterministicCode: true,
        usedLlmJudgement: true,
        canDecide: "Recommend owner review",
        cannotDecide: "Publish the report",
        reviewCondition: "Owner checks source links",
        stopCondition: "Evidence is missing",
      },
      status: "allowed",
    },
    {
      id: "GOV-2",
      decision: "Send a candidate recommendation",
      evidenceIds: ["O2"],
      riskClass: "high",
      allowedAction: "Draft a recommendation",
      forbiddenAction: "Send it",
      status: "allowed",
    },
  ],
  governanceDisagreements: [
    {
      id: "CONFLICT-1",
      topic: "Automation boundary",
      humanQuestion: "Should the owner approve assisted drafting only?",
      positions: [
        { reviewer: "AI Exposure Reviewer", claim: "Drafting can be assisted", lens: "Exposure", evidenceIds: ["A1"] },
        { reviewer: "Governance Reviewer", claim: "Publication remains human-owned", lens: "Control", evidenceIds: ["O1"] },
      ],
    },
    {
      id: "CONFLICT-2",
      topic: "Unsupported conflict",
      positions: [{ reviewer: "Reviewer", claim: "One supplied view", evidenceIds: [] }],
    },
  ],
};

const data = buildGovernanceLedgerData(fixture, { "GOV-1": "accepted", "CONFLICT-1": "resolved" });
assert.equal(data.ledger[0].controlState, "allowed", "complete control and agent identity must be allowed");
assert.equal(data.ledger[0].humanState, "accepted", "session human decision must be applied");
assert.equal(data.ledger[1].controlState, "blocked", "payload status must not bypass missing controls");
assert.ok(data.ledger[1].missing.includes("named human owner"), "blocked record must name missing owner");
assert.ok(data.ledger[1].missing.includes("audit trail"), "blocked record must name missing audit trail");
assert.equal(data.disagreements[0].ready, true, "two complete evidence-backed positions and a human question are reviewable");
assert.equal(data.disagreements[0].humanState, "resolved", "disagreement human decision must be applied");
assert.equal(data.disagreements[1].ready, false, "an incomplete single view must remain withheld");
assert.deepEqual(GOVERNANCE_HUMAN_STATES, ["open", "accepted", "rejected", "resolved", "escalated"]);

const aiWithoutIdentity = buildGovernanceLedgerData({ governanceLedger: [{ ...fixture.governanceLedger[0], id: "GOV-3", agentIdentity: undefined }] });
assert.equal(aiWithoutIdentity.ledger[0].controlState, "blocked", "AI interpretation without complete agent identity must be blocked");
assert.ok(aiWithoutIdentity.ledger[0].missing.includes("complete agent identity"));

console.log("governance ledger contract passed");
