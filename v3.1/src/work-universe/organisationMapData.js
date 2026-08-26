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
    evidenceIds: unique(first(value.evidenceIds, value.evidence_ids, value.sourceIds, value.source_ids, value.spanIds, value.span_ids, value.src)),
    provenance: clean(first(value.provenance, value.source, "supplied payload")),
  };
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

  const sources = {
    functions: listFrom(map.functions, organisation.functions, result?.organisationFunctions, result?.organizationFunctions),
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
  const availableDimensions = dimensions.filter((dimension) => dimension.items.length).length;
  const evidenceIds = unique([
    ...dimensions.flatMap((dimension) => dimension.items.flatMap((item) => item.evidenceIds)),
    ...relationships.flatMap((relationship) => relationship.evidenceIds),
  ]);

  return {
    dimensions,
    relationships,
    availableDimensions,
    coverageLabel: `${availableDimensions} / ${DIMENSIONS.length}`,
    evidenceIds,
    status: availableDimensions || relationships.length ? "available" : "withheld",
    boundary: "This map shows only supplied organisation evidence. It does not infer organisation maturity, hierarchy, staffing, growth, or process quality from a job posting.",
  };
}

export { DIMENSIONS as ORGANISATION_MAP_DIMENSIONS };
