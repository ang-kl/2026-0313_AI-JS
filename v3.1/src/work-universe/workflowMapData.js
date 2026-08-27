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
  return unique(first(
    object?.evidenceIds,
    object?.evidence_ids,
    object?.sourceIds,
    object?.source_ids,
    object?.spanIds,
    object?.span_ids,
    object?.src,
    object?.sources,
  ));
}

function normaliseStep(value, index) {
  const object = value && typeof value === "object" ? value : {};
  const label = clean(typeof value === "string" || typeof value === "number"
    ? value
    : first(object.label, object.name, object.title, object.step, object.stage, object.action, object.description));
  if (!label) return null;
  const explicitOrder = Number(first(object.order, object.sequence, object.position));
  const type = clean(first(object.type, object.kind));
  const decision = object.decision === true || /decision/i.test(type);
  const queue = object.queue === true || /queue|wait/i.test(type);
  const bottleneck = object.bottleneck === true || /bottleneck/i.test(type);
  return {
    id: clean(first(object.id, object.key)) || `workflow-step-${index + 1}`,
    label,
    description: clean(first(object.detail, object.description, object.note)),
    actor: clean(first(object.actor, object.lane, object.role)),
    owner: clean(first(object.humanOwner, object.human_owner, object.owner, object.accountableOwner, object.accountable_owner)),
    scenario: clean(first(object.scenario, object.state, object.flow)),
    friction: clean(first(object.friction, object.issue)),
    agentCandidate: clean(first(object.agentCandidate, object.agent_candidate, object.automationCandidate, object.automation_candidate)),
    decision,
    queue,
    bottleneck,
    order: Number.isFinite(explicitOrder) ? explicitOrder : index + 1,
    sourceIndex: index,
    evidenceIds: evidenceIds(object),
    provenance: clean(first(object.provenance, object.source, "supplied payload")),
    confidence: clean(first(object.confidence, object.evidenceConfidence, object.evidence_confidence, "supplied")),
  };
}

function normaliseConnection(value, index, nodeByReference) {
  if (!value || typeof value !== "object") return null;
  const fromRef = clean(first(value.from, value.source, value.upstream, value.previous));
  const toRef = clean(first(value.to, value.target, value.downstream, value.next));
  if (!fromRef || !toRef) return null;
  const from = nodeByReference.get(fromRef.toLowerCase());
  const to = nodeByReference.get(toRef.toLowerCase());
  if (!from || !to) return { unresolved: true };
  return {
    id: clean(first(value.id, value.key)) || `workflow-connection-${index + 1}`,
    from: from.id,
    to: to.id,
    fromLabel: from.label,
    toLabel: to.label,
    label: clean(first(value.label, value.type, value.relationship, value.description, "transition")),
    handoff: value.handoff === true || /handoff/i.test(clean(first(value.type, value.relationship, value.label))),
    dependency: value.dependency === true || /depend/i.test(clean(first(value.type, value.relationship, value.label))),
    evidenceIds: evidenceIds(value),
    provenance: clean(first(value.provenance, value.source, "supplied payload")),
  };
}

function workflowObject(result) {
  const universe = result?.workUniverse || {};
  const snakeUniverse = result?.work_universe || {};
  const candidates = [
    universe.workflowMap,
    universe.workflow_map,
    universe.workflow,
    snakeUniverse.workflowMap,
    snakeUniverse.workflow_map,
    snakeUniverse.workflow,
    result?.workflowMap,
    result?.workflow_map,
  ];
  return candidates.find((value) => value && typeof value === "object" && Object.keys(value).length > 0) || {};
}

export function buildWorkflowMapData(result = {}) {
  const map = workflowObject(result);
  const rawSteps = firstList(map.steps, map.stages);
  const steps = rawSteps
    .map(normaliseStep)
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.sourceIndex - b.sourceIndex || a.id.localeCompare(b.id));

  const nodeByReference = new Map();
  steps.forEach((step) => {
    nodeByReference.set(step.id.toLowerCase(), step);
    nodeByReference.set(step.label.toLowerCase(), step);
  });

  const rawConnections = firstList(map.transitions, map.handoffs, map.dependencies, map.edges);
  let unresolvedConnections = 0;
  const connections = rawConnections.map((value, index) => {
    const connection = normaliseConnection(value, index, nodeByReference);
    if (connection?.unresolved) unresolvedConnections += 1;
    return connection?.unresolved ? null : connection;
  }).filter(Boolean);

  const allEvidenceIds = unique([
    ...steps.flatMap((step) => step.evidenceIds),
    ...connections.flatMap((connection) => connection.evidenceIds),
  ]);
  const actorCount = new Set(steps.map((step) => step.actor).filter(Boolean)).size;

  return {
    steps,
    connections,
    unresolvedConnections,
    actorCount,
    decisionCount: steps.filter((step) => step.decision).length,
    queueCount: steps.filter((step) => step.queue).length,
    bottleneckCount: steps.filter((step) => step.bottleneck).length,
    evidenceIds: allEvidenceIds,
    status: steps.length ? "available" : "withheld",
    boundary: "This map shows only supplied workflow stages and explicit connections. It does not infer process order, actors, handoffs, bottlenecks, organisation maturity, or process quality from a job posting.",
    empty: "No explicit workflow stages were supplied. Source duties remain evidence, but they are not silently converted into a process sequence.",
  };
}
