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

function firstList(...values) {
  for (const value of values) {
    const list = asArray(value).filter((item) => item !== undefined && item !== null && item !== "");
    if (list.length) return list;
  }
  return [];
}

function unique(values) {
  return [...new Set(asArray(values).flatMap((value) => asArray(value)).map(clean).filter(Boolean))];
}

function evidenceIds(object) {
  return unique(first(object?.evidenceIds, object?.evidence_ids, object?.sourceIds, object?.source_ids, object?.spanIds, object?.span_ids, object?.src, object?.sources));
}

function measurement(value, unit) {
  const label = clean(value);
  if (!label) return "";
  const cleanUnit = clean(unit);
  return cleanUnit && !/[a-zA-Z]/.test(label) ? `${label} ${cleanUnit}` : label;
}

function classificationOf(object) {
  const supplied = clean(first(object.valueClass, object.value_class, object.classification, object.type, object.valueType, object.value_type, object.value)).toLowerCase();
  if (/^(value|value add|value-add|value added|value-added)$/.test(supplied)) return { key: "value", label: "VALUE ADD" };
  if (/^(wait|waiting|queue|queued)$/.test(supplied)) return { key: "wait", label: "WAIT / QUEUE" };
  if (/^handoff$/.test(supplied)) return { key: "handoff", label: "HANDOFF" };
  if (/^(waste|non-value|non value|non-value-added|non value added)$/.test(supplied)) return { key: "waste", label: "WASTE" };
  if (/^rework$/.test(supplied)) return { key: "rework", label: "REWORK" };
  return { key: "unclassified", label: "UNCLASSIFIED" };
}

function normaliseStage(value, index) {
  const object = value && typeof value === "object" ? value : {};
  const label = clean(typeof value === "string" || typeof value === "number"
    ? value
    : first(object.label, object.name, object.title, object.stage, object.step, object.segment, object.action, object.description));
  if (!label) return null;
  const explicitOrder = Number(first(object.order, object.sequence, object.position));
  const classification = classificationOf(object);
  const owner = clean(first(object.humanOwner, object.human_owner, object.owner, object.accountableOwner, object.accountable_owner));
  const governanceId = clean(first(object.governanceId, object.governance_id, object.governanceRef, object.governance_ref, object.ledgerId, object.ledger_id));
  const agentCandidate = clean(first(object.agentCandidate, object.agent_candidate));
  return {
    id: clean(first(object.id, object.key)) || `value-stream-stage-${index + 1}`,
    label,
    description: clean(first(object.detail, object.description, object.note)),
    classification: classification.key,
    classificationLabel: classification.label,
    owner,
    handoffOwner: clean(first(object.handoffOwner, object.handoff_owner)),
    scenario: clean(first(object.scenario, object.state, object.flow)),
    duration: measurement(first(object.duration, object.cycleTime, object.cycle_time, object.processingTime, object.processing_time), first(object.durationUnit, object.duration_unit, object.unit)),
    waitTime: measurement(first(object.waitTime, object.wait_time, object.queueTime, object.queue_time), first(object.waitTimeUnit, object.wait_time_unit, object.durationUnit, object.duration_unit, object.unit)),
    handoffCost: measurement(first(object.handoffCost, object.handoff_cost), first(object.costUnit, object.cost_unit)),
    friction: clean(first(object.friction, object.waste, object.issue)),
    customerImpact: clean(first(object.customerImpact, object.customer_impact, object.delayImpact, object.delay_impact)),
    aiLeverage: clean(first(object.aiLeverage, object.ai_leverage, object.aiOpportunity, object.ai_opportunity)),
    doNotAutomate: object.doNotAutomate === true || object.do_not_automate === true || object.agentForbidden === true || object.agent_forbidden === true,
    automationBoundary: clean(first(object.automationBoundary, object.automation_boundary, object.humanBoundary, object.human_boundary)),
    agentCandidate: agentCandidate && owner && governanceId ? agentCandidate : "",
    agentCandidateWithheld: Boolean(agentCandidate && (!owner || !governanceId)),
    governanceId,
    humanValidation: clean(first(object.humanValidation, object.human_validation, object.validationRequired, object.validation_required)),
    order: Number.isFinite(explicitOrder) ? explicitOrder : index + 1,
    sourceIndex: index,
    evidenceIds: evidenceIds(object),
    provenance: clean(first(object.provenance, object.source, "supplied payload")),
    confidence: clean(first(object.confidence, object.evidenceConfidence, object.evidence_confidence, "supplied")),
  };
}

function valueStreamObject(result) {
  const universe = result?.workUniverse || {};
  const snakeUniverse = result?.work_universe || {};
  const candidates = [
    universe.valueStreamMap,
    universe.value_stream_map,
    universe.valueStream,
    universe.value_stream,
    snakeUniverse.valueStreamMap,
    snakeUniverse.value_stream_map,
    snakeUniverse.valueStream,
    snakeUniverse.value_stream,
    result?.valueStreamMap,
    result?.value_stream_map,
  ];
  return candidates.find((value) => value && typeof value === "object" && Object.keys(value).length > 0) || {};
}

function normaliseSummary(map) {
  const summary = first(map.summary, map.totals, map.metrics) || {};
  if (!summary || typeof summary !== "object") return [];
  return [
    ["Total time", first(summary.totalTime, summary.total_time)],
    ["Value time", first(summary.valueTime, summary.value_time)],
    ["Wait time", first(summary.waitTime, summary.wait_time)],
    ["Rework time", first(summary.reworkTime, summary.rework_time)],
    ["Handoff cost", first(summary.handoffCost, summary.handoff_cost)],
  ].map(([label, value]) => ({ label, value: clean(value) })).filter((item) => item.value);
}

export function buildValueStreamMapData(result = {}) {
  const map = valueStreamObject(result);
  const stages = firstList(map.stages, map.steps, map.segments)
    .map(normaliseStage)
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.sourceIndex - b.sourceIndex || a.id.localeCompare(b.id));
  const summary = normaliseSummary(map);
  const allEvidenceIds = unique(stages.flatMap((stage) => stage.evidenceIds));
  return {
    stages,
    summary,
    evidenceIds: allEvidenceIds,
    timedStages: stages.filter((stage) => stage.duration || stage.waitTime).length,
    valueStages: stages.filter((stage) => stage.classification === "value").length,
    nonValueStages: stages.filter((stage) => ["wait", "handoff", "waste", "rework"].includes(stage.classification)).length,
    blockedAgentCandidates: stages.filter((stage) => stage.agentCandidateWithheld).length,
    hypothesisLabel: "BPR hypothesis",
    status: stages.length ? "available" : "withheld",
    boundary: "This map shows only supplied value-stream stages and labels. It does not infer timing, waste, savings, layoffs, automation potential, organisation maturity, or process quality from a job posting.",
    empty: "No explicit value-stream stages were supplied. Duties and workflow stages are not silently converted into timing, waste, handoff cost or AI-leverage claims.",
  };
}
