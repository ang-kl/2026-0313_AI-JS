export const BLUEPRINT_TRACE_VERSION = "1.0.0";
export const BLUEPRINT_TRACE_STATUS = Object.freeze(["AVAILABLE", "WITHHELD", "PARTIAL", "ERROR", "STALE"]);

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

export function createBlueprintTrace({ id, requirement, component, sourceIds, status, rule, knownGap } = {}) {
  return {
    version: BLUEPRINT_TRACE_VERSION,
    id: clean(id),
    requirement: clean(requirement),
    component: clean(component),
    sourceIds: [...new Set((Array.isArray(sourceIds) ? sourceIds : []).map(clean).filter(Boolean))],
    status: clean(status).toUpperCase(),
    rule: clean(rule),
    knownGap: clean(knownGap) || null,
  };
}

export function validateBlueprintTrace(trace) {
  const errors = [];
  if (!trace || typeof trace !== "object") return { ok: false, errors: ["trace must be an object"] };
  if (trace.version !== BLUEPRINT_TRACE_VERSION) errors.push(`version must be ${BLUEPRINT_TRACE_VERSION}`);
  for (const field of ["id", "requirement", "component", "rule"]) if (!clean(trace[field])) errors.push(`${field} must be non-empty`);
  if (!Array.isArray(trace.sourceIds)) errors.push("sourceIds must be an array");
  if (!BLUEPRINT_TRACE_STATUS.includes(trace.status)) errors.push(`status must be one of ${BLUEPRINT_TRACE_STATUS.join(", ")}`);
  return { ok: errors.length === 0, errors };
}
