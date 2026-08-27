const DIMENSIONS = [
  { key: "functions", label: "Functions", empty: "No organisation function evidence was supplied." },
  { key: "reportingBoundaries", label: "Reporting boundaries", empty: "No reporting boundary was supplied. A job title does not establish a reporting line." },
  { key: "dependencies", label: "Dependencies", empty: "No upstream, downstream or collaboration dependency was supplied." },
  { key: "capabilities", label: "Capabilities", empty: "No organisation capability object was supplied." },
  { key: "authority", label: "Authority", empty: "No approval or irreversible commit authority was supplied." },
  { key: "processOwnership", label: "Process ownership", empty: "No named process owner was supplied." },
];

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

function itemLabel(value) {
  if (typeof value === "string" || typeof value === "number") return clean(value);
  return clean(first(value?.label, value?.name, value?.title, value?.function, value?.capability, value?.process, value?.authority, value?.description));
}

function economyList(object, kind) {
  const economy = object?.economy && typeof object.economy === "object" ? object.economy : {};
  if (kind === "agent") {
    return listFrom(
      object?.agentEconomy,
      object?.agent_economy,
      object?.agentCandidates,
      object?.agent_candidates,
      economy.agent,
      economy.agents,
      economy.agentEconomy,
      economy.agent_economy,
    );
  }
  return listFrom(
    object?.humanReservedEconomy,
    object?.human_reserved_economy,
    object?.humanReserved,
    object?.human_reserved,
    object?.humanCore,
    object?.human_core,
    economy.humanReserved,
    economy.human_reserved,
    economy.human,
  );
}

function normaliseEconomyItem(value, kind, index, ownerId = "map") {
  const object = value && typeof value === "object" ? value : {};
  const label = itemLabel(value);
  if (!label) return null;
  const evidenceIds = unique(first(object.evidenceIds, object.evidence_ids, object.sourceIds, object.source_ids, object.spanIds, object.span_ids, object.src, object.sources));
  const humanOwner = clean(first(object.humanOwner, object.human_owner, object.owner, object.accountableOwner, object.accountable_owner));
  const governanceReference = clean(first(object.governanceReference, object.governance_reference, object.governanceRef, object.governance_ref, object.approvalMode, object.approval_mode));
  const reason = clean(first(object.reason, object.reservedReason, object.reserved_reason, object.boundary, object.rationale));
  const complete = kind === "agent"
    ? Boolean(evidenceIds.length && humanOwner && governanceReference)
    : Boolean(evidenceIds.length && reason);
  return {
    id: clean(first(object.id, object.key)) || `${ownerId}-${kind}-${index + 1}`,
    kind,
    label,
    description: clean(first(object.detail, object.description, object.scope, object.note)),
    evidenceIds,
    humanOwner,
    governanceReference,
    reason,
    status: kind === "agent" ? (complete ? "governed" : "blocked") : (complete ? "reserved" : "unconfirmed"),
  };
}

function normaliseNode(value, index) {
  if (value === undefined || value === null || value === "") return null;
  const object = value && typeof value === "object" ? value : {};
  const label = itemLabel(value);
  if (!label) return null;
  const id = clean(first(object.id, object.key)) || `organisation-node-${index + 1}`;
  const agentEconomy = economyList(object, "agent")
    .map((item, itemIndex) => normaliseEconomyItem(item, "agent", itemIndex, id))
    .filter(Boolean);
  const humanReservedEconomy = economyList(object, "human")
    .map((item, itemIndex) => normaliseEconomyItem(item, "human", itemIndex, id))
    .filter(Boolean);
  return {
    id,
    label,
    kind: clean(first(object.kind, object.type, object.nodeType, object.node_type, "function")),
    description: clean(first(object.detail, object.description, object.scope, object.note)),
    parentId: clean(first(object.parentId, object.parent_id, object.reportsToId, object.reports_to_id, object.reportingToId, object.reporting_to_id)),
    evidenceIds: unique(first(object.evidenceIds, object.evidence_ids, object.sourceIds, object.source_ids, object.spanIds, object.span_ids, object.src, object.sources)),
    agentEconomy,
    humanReservedEconomy,
  };
}

function normaliseItem(value, dimension, index) {
  const object = value && typeof value === "object" ? value : {};
  const label = itemLabel(value);
  if (!label) return null;
  const evidenceIds = unique(first(object.evidenceIds, object.evidence_ids, object.sourceIds, object.source_ids, object.spanIds, object.span_ids, object.src, object.sources));
  return {
    id: clean(first(object.id, object.key)) || `${dimension}-${index + 1}`,
    label,
    description: clean(first(object.detail, object.description, object.scope, object.boundary, object.note)),
    direction: clean(first(object.direction, object.type, object.relationship)),
    owner: clean(first(object.owner, object.accountableOwner, object.accountable_owner)),
    evidenceIds,
    provenance: clean(first(object.provenance, object.source, evidenceIds.length ? "from posting" : "supplied payload")),
    confidence: clean(first(object.confidence, object.evidenceConfidence, object.evidence_confidence, "supplied")),
  };
}

function listFrom(...values) {
  for (const value of values) {
    const list = asArray(value).filter((item) => item !== undefined && item !== null && item !== "");
    if (list.length) return list;
  }
  return [];
}

function normaliseRelationship(value, index) {
  if (!value || typeof value !== "object") return null;
  const from = clean(first(value.from, value.source, value.upstream, value.owner));
  const to = clean(first(value.to, value.target, value.downstream, value.dependent));
  if (!from || !to) return null;
  return {
    id: clean(first(value.id, value.key)) || `relationship-${index + 1}`,
    from,
    to,
    label: clean(first(value.label, value.type, value.relationship, value.description, "depends on")),
    kind: clean(first(value.kind, value.type, value.relationship, "relationship")),
    evidenceIds: unique(first(value.evidenceIds, value.evidence_ids, value.sourceIds, value.source_ids, value.spanIds, value.span_ids, value.src)),
    provenance: clean(first(value.provenance, value.source, "supplied payload")),
  };
}

function nodeLookup(nodes) {
  const lookup = new Map();
  nodes.forEach((node) => {
    lookup.set(node.id.toLowerCase(), node.id);
    lookup.set(node.label.toLowerCase(), node.id);
  });
  return lookup;
}

function resolveChart(nodes, relationships) {
  const lookup = nodeLookup(nodes);
  const ids = new Set(nodes.map((node) => node.id));
  const depthMemo = new Map();
  const depthFor = (node, visiting = new Set()) => {
    if (depthMemo.has(node.id)) return depthMemo.get(node.id);
    const parentId = lookup.get(node.parentId.toLowerCase()) || node.parentId;
    if (!parentId || !ids.has(parentId) || visiting.has(node.id)) {
      depthMemo.set(node.id, 0);
      return 0;
    }
    const parent = nodes.find((candidate) => candidate.id === parentId);
    const nextVisiting = new Set(visiting).add(node.id);
    const depth = parent ? Math.min(5, depthFor(parent, nextVisiting) + 1) : 0;
    depthMemo.set(node.id, depth);
    return depth;
  };
  const chartNodes = nodes.map((node) => ({ ...node, depth: depthFor(node) }));
  const parentEdges = chartNodes.flatMap((node) => {
    const parentId = lookup.get(node.parentId.toLowerCase()) || node.parentId;
    if (!parentId || !ids.has(parentId)) return [];
    return [{
      id: `parent-${parentId}-${node.id}`,
      fromId: parentId,
      toId: node.id,
      label: "reporting boundary",
      kind: "reporting",
      evidenceIds: node.evidenceIds,
      linked: Boolean(node.evidenceIds.length),
    }];
  });
  const relationshipEdges = relationships.flatMap((relationship) => {
    const fromId = lookup.get(relationship.from.toLowerCase());
    const toId = lookup.get(relationship.to.toLowerCase());
    if (!fromId || !toId) return [];
    return [{
      ...relationship,
      fromId,
      toId,
      linked: Boolean(relationship.evidenceIds.length),
    }];
  });
  const seen = new Set();
  const chartEdges = [...parentEdges, ...relationshipEdges].filter((edge) => {
    const key = `${edge.fromId}|${edge.toId}|${edge.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { chartNodes, chartEdges };
}

export function buildOrganisationMapData(result = {}) {
  const universe = result?.workUniverse || result?.work_universe || {};
  const organisation = universe.organisation || universe.organization || result?.organisation || result?.organization || {};
  const map = first(
    organisation.organisationMap,
    organisation.organizationMap,
    organisation.map,
    universe.organisationMap,
    universe.organizationMap,
    result?.organisationMap,
    result?.organizationMap,
  ) || {};

  const explicitNodes = listFrom(map.nodes, map.organisationNodes, map.organisation_nodes, map.organizationNodes, map.organization_nodes, organisation.nodes);
  const explicitFunctionNodes = explicitNodes.filter((value) => {
    const object = value && typeof value === "object" ? value : {};
    return clean(first(object.kind, object.type, object.nodeType, object.node_type)).toLowerCase() === "function";
  });

  const sources = {
    functions: listFrom(map.functions, organisation.functions, result?.organisationFunctions, result?.organizationFunctions, explicitFunctionNodes),
    reportingBoundaries: listFrom(map.reportingBoundaries, map.reporting_boundaries, map.reporting, organisation.reportingBoundaries, organisation.reporting_boundaries),
    dependencies: listFrom(map.dependencies, organisation.dependencies, result?.organisationDependencies, result?.organizationDependencies),
    capabilities: listFrom(map.capabilities, organisation.capabilities, result?.organisationCapabilities, result?.organizationCapabilities),
    authority: listFrom(map.authority, map.authorities, organisation.authority, organisation.authorities, result?.authority),
    processOwnership: listFrom(map.processOwnership, map.process_ownership, map.processOwners, map.process_owners, organisation.processOwnership, organisation.process_ownership),
  };

  const dimensions = DIMENSIONS.map((definition) => {
    const items = sources[definition.key]
      .map((value, index) => normaliseItem(value, definition.key, index))
      .filter(Boolean);
    return { ...definition, items, status: items.length ? "available" : "withheld" };
  });

  const relationships = listFrom(map.relationships, map.edges, organisation.relationships, organisation.edges)
    .map(normaliseRelationship)
    .filter(Boolean);
  const nodeValues = explicitNodes.length ? explicitNodes : sources.functions;
  const nodes = nodeValues.map(normaliseNode).filter(Boolean);
  const { chartNodes, chartEdges } = resolveChart(nodes, relationships);
  const mapAgentEconomy = economyList(map, "agent")
    .map((item, index) => normaliseEconomyItem(item, "agent", index))
    .filter(Boolean);
  const mapHumanReservedEconomy = economyList(map, "human")
    .map((item, index) => normaliseEconomyItem(item, "human", index))
    .filter(Boolean);
  const agentEconomy = [...mapAgentEconomy, ...chartNodes.flatMap((node) => node.agentEconomy)];
  const humanReservedEconomy = [...mapHumanReservedEconomy, ...chartNodes.flatMap((node) => node.humanReservedEconomy)];
  const availableDimensions = dimensions.filter((dimension) => dimension.items.length).length;
  const evidenceIds = unique([
    ...dimensions.flatMap((dimension) => dimension.items.flatMap((item) => item.evidenceIds)),
    ...relationships.flatMap((relationship) => relationship.evidenceIds),
    ...chartNodes.flatMap((node) => node.evidenceIds),
    ...agentEconomy.flatMap((item) => item.evidenceIds),
    ...humanReservedEconomy.flatMap((item) => item.evidenceIds),
  ]);

  return {
    dimensions,
    relationships,
    chartNodes,
    chartEdges,
    economy: {
      agent: agentEconomy,
      humanReserved: humanReservedEconomy,
      agentStatus: agentEconomy.length ? (agentEconomy.every((item) => item.status === "governed") ? "governed" : "blocked") : "withheld",
      humanReservedStatus: humanReservedEconomy.length ? (humanReservedEconomy.every((item) => item.status === "reserved") ? "reserved" : "unconfirmed") : "withheld",
    },
    availableDimensions,
    coverageLabel: `${availableDimensions} / ${DIMENSIONS.length}`,
    evidenceIds,
    status: availableDimensions || relationships.length || chartNodes.length || agentEconomy.length || humanReservedEconomy.length ? "available" : "withheld",
    boundary: "This map shows only supplied organisation evidence. It does not infer organisation maturity, hierarchy, staffing, growth, process quality, or Agent / Human-reserved economy classifications from a job posting.",
  };
}

export { DIMENSIONS as ORGANISATION_MAP_DIMENSIONS };
