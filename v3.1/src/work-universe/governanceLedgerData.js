const HUMAN_STATES = ["open", "accepted", "rejected", "resolved", "escalated"];

function asArray(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function unique(values) {
  return [...new Set(asArray(values).map(clean).filter(Boolean))];
}

function firstList(...values) {
  for (const value of values) {
    const list = asArray(value).filter((item) => item !== undefined && item !== null && item !== "");
    if (list.length) return list;
  }
  return [];
}

function normaliseAuditItem(value, index) {
  const object = value && typeof value === "object" ? value : {};
  const action = clean(first(object.action, object.event, object.decision, object.note, value));
  if (!action) return null;
  return {
    key: `audit-${index}`,
    action,
    actor: clean(first(object.actor, object.by, object.owner)),
    at: clean(first(object.at, object.timestamp, object.createdAt, object.created_at)),
  };
}

function normaliseAgentIdentity(value) {
  const object = value && typeof value === "object" ? value : {};
  const evidenceIds = unique(first(object.evidenceIds, object.evidence_ids, object.sourceIds, object.source_ids, object.sources));
  const identity = {
    name: clean(first(object.name, object.agentName, object.agent_name, object.persona)),
    purpose: clean(first(object.purpose, object.role)),
    lens: clean(first(object.lens, object.lensUsed, object.lens_used, object.method)),
    evidenceIds,
    deterministicUse: first(object.deterministicUse, object.deterministic_use, object.usedDeterministicCode, object.used_deterministic_code),
    llmJudgement: first(object.llmJudgement, object.llm_judgement, object.usedLlmJudgement, object.used_llm_judgement),
    canDecide: clean(first(object.canDecide, object.can_decide, object.allowedDecision, object.allowed_decision)),
    cannotDecide: clean(first(object.cannotDecide, object.cannot_decide, object.forbiddenDecision, object.forbidden_decision)),
    reviewCondition: clean(first(object.reviewCondition, object.review_condition)),
    stopCondition: clean(first(object.stopCondition, object.stop_condition)),
  };
  const required = [identity.name, identity.purpose, identity.lens, identity.evidenceIds.length, identity.canDecide, identity.cannotDecide, identity.reviewCondition, identity.stopCondition];
  return { ...identity, complete: required.every(Boolean) && typeof identity.deterministicUse === "boolean" && typeof identity.llmJudgement === "boolean" };
}

function humanState(value) {
  const state = clean(value).toLowerCase();
  return HUMAN_STATES.includes(state) ? state : "open";
}

function normaliseLedgerEntry(value, index, reviewState) {
  const object = value && typeof value === "object" ? value : {};
  const suppliedId = clean(first(object.id, object.key, object.ledgerId, object.ledger_id));
  const key = suppliedId || `governance-record-${index}`;
  const evidenceIds = unique(first(object.evidenceIds, object.evidence_ids, object.sourceEvidence, object.source_evidence, object.sourceIds, object.source_ids, object.spanIds, object.span_ids, object.sources));
  const auditTrail = firstList(object.auditTrail, object.audit_trail, object.audit, object.history)
    .map(normaliseAuditItem)
    .filter(Boolean);
  const aiInterpretation = clean(first(object.aiInterpretation, object.ai_interpretation, object.interpretation));
  const agentIdentity = normaliseAgentIdentity(first(object.agentIdentity, object.agent_identity, object.agent, object.personaAgent, object.persona_agent));
  const entry = {
    key,
    suppliedId,
    decision: clean(first(object.decision, object.decisionUnderReview, object.decision_under_review, object.title)),
    evidenceIds,
    deterministicResult: clean(first(object.deterministicResult, object.deterministic_result, object.computedResult, object.computed_result)),
    aiInterpretation,
    riskClass: clean(first(object.riskClass, object.risk_class, object.risk)),
    scope: clean(first(object.scope, object.actionScope, object.action_scope)),
    humanOwner: clean(first(object.humanOwner, object.human_owner, object.owner, object.accountableOwner, object.accountable_owner)),
    allowedAction: clean(first(object.allowedAction, object.allowed_action)),
    forbiddenAction: clean(first(object.forbiddenAction, object.forbidden_action)),
    guardrails: unique(first(object.guardrails, object.controls, object.boundaries)),
    transparencyNote: clean(first(object.transparencyNote, object.transparency_note, object.disclosure)),
    overridePath: clean(first(object.overridePath, object.override_path, object.escalationPath, object.escalation_path)),
    auditTrail,
    agentIdentity,
  };
  const requirements = [
    ["decision", entry.decision],
    ["source evidence", entry.evidenceIds.length],
    ["risk class", entry.riskClass],
    ["scope", entry.scope],
    ["named human owner", entry.humanOwner],
    ["allowed action", entry.allowedAction],
    ["forbidden action", entry.forbiddenAction],
    ["audit trail", entry.auditTrail.length],
    ["override path", entry.overridePath],
  ];
  if (entry.aiInterpretation) requirements.push(["complete agent identity", entry.agentIdentity.complete]);
  const missing = requirements.filter(([, present]) => !present).map(([label]) => label);
  return {
    ...entry,
    missing,
    controlState: missing.length ? "blocked" : "allowed",
    humanState: humanState(reviewState?.[key] ?? first(object.humanDecision, object.human_decision, object.reviewStatus, object.review_status)),
  };
}

function normalisePosition(value, index) {
  const object = value && typeof value === "object" ? value : {};
  const evidenceIds = unique(first(object.evidenceIds, object.evidence_ids, object.sourceEvidence, object.source_evidence, object.sourceIds, object.source_ids, object.spanIds, object.span_ids, object.sources));
  return {
    key: `position-${index}`,
    reviewer: clean(first(object.reviewer, object.persona, object.agent, object.name)),
    claim: clean(first(object.claim, object.position, object.interpretation, object.statement)),
    lens: clean(first(object.lens, object.lensUsed, object.lens_used, object.method)),
    evidenceIds,
    provenance: clean(first(object.provenance, object.kind, object.type)),
  };
}

function normaliseDisagreement(value, index, reviewState) {
  const object = value && typeof value === "object" ? value : {};
  const suppliedId = clean(first(object.id, object.key, object.conflictId, object.conflict_id));
  const key = suppliedId || `disagreement-${index}`;
  const positions = firstList(object.positions, object.claims, object.reviewers, object.sides)
    .map(normalisePosition)
    .filter((position) => position.reviewer || position.claim || position.evidenceIds.length);
  const question = clean(first(object.humanQuestion, object.human_question, object.resolutionPrompt, object.resolution_prompt, object.question, object.decision));
  const incompletePositions = positions.filter((position) => !position.reviewer || !position.claim || !position.evidenceIds.length);
  const ready = positions.length >= 2 && !incompletePositions.length && Boolean(question);
  return {
    key,
    suppliedId,
    topic: clean(first(object.topic, object.title, object.subject, object.label)),
    question,
    positions,
    ready,
    missing: [
      ...(positions.length < 2 ? ["two reviewer positions"] : []),
      ...(incompletePositions.length ? ["reviewer, claim and evidence for every position"] : []),
      ...(!question ? ["human decision question"] : []),
    ],
    humanState: humanState(reviewState?.[key] ?? first(object.humanDecision, object.human_decision, object.reviewStatus, object.review_status)),
  };
}

function governancePayload(result) {
  const universe = result?.workUniverse || result?.work_universe || {};
  const governance = first(universe.governance, result?.governance) || {};
  const ledger = firstList(
    result?.governanceLedger,
    result?.governance_ledger,
    universe.governanceLedger,
    universe.governance_ledger,
    governance.ledger,
    governance.decisions,
  );
  const disagreements = firstList(
    result?.governanceDisagreements,
    result?.governance_disagreements,
    result?.disagreements,
    universe.governanceDisagreements,
    universe.governance_disagreements,
    governance.disagreements,
    governance.conflicts,
  );
  return { ledger, disagreements };
}

export function buildGovernanceLedgerData(result = {}, reviewState = result?.governanceReviewState || {}) {
  const payload = governancePayload(result);
  const ledger = payload.ledger.map((value, index) => normaliseLedgerEntry(value, index, reviewState));
  const disagreements = payload.disagreements.map((value, index) => normaliseDisagreement(value, index, reviewState));
  return {
    ledger,
    disagreements,
    counts: {
      allowed: ledger.filter((entry) => entry.controlState === "allowed").length,
      blocked: ledger.filter((entry) => entry.controlState === "blocked").length,
      readyDisagreements: disagreements.filter((item) => item.ready).length,
      withheldDisagreements: disagreements.filter((item) => !item.ready).length,
    },
  };
}

export const GOVERNANCE_HUMAN_STATES = HUMAN_STATES;
