export const ORGANISATION_SYNTHESIS_VERSION = "1.0.0";
export const WITHHELD_ORGANISATION_FIELDS = Object.freeze(["hierarchy", "maturity", "headcount", "performance", "ownership"]);

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const key = (value) => clean(value).toLowerCase();
const list = (value) => Array.isArray(value) ? value : [];

function sourceObject(result) {
  return result?.workUniverse?.organisationSynthesis
    || result?.work_universe?.organisation_synthesis
    || result?.organisationSynthesis
    || result?.organisation_synthesis
    || null;
}

export function buildOrganisationSynthesis(result = {}) {
  const supplied = sourceObject(result);
  const withheld = Object.fromEntries(WITHHELD_ORGANISATION_FIELDS.map((field) => [field, { status: "WITHHELD", reason: `${field} is not supplied by the cross-posting capability contract` }]));
  if (!supplied || typeof supplied !== "object") return { version: ORGANISATION_SYNTHESIS_VERSION, status: "withheld", reason: "No cross-posting organisation synthesis payload was supplied.", employer: null, groups: [], excluded: [], withheld };
  const employer = supplied.employer && typeof supplied.employer === "object" ? supplied.employer : {};
  const employerId = clean(employer.id);
  const employerName = clean(employer.name);
  if (employer.ambiguous !== false || !employerId || !employerName) return { version: ORGANISATION_SYNTHESIS_VERSION, status: "withheld", reason: "The employer set is ambiguous or lacks a stable supplied identity.", employer: null, groups: [], excluded: [], withheld };
  const postings = list(supplied.postings);
  const excluded = [];
  const byCapability = new Map();
  for (const posting of postings) {
    const sourceId = clean(posting?.sourceId || posting?.id);
    const postingEmployerId = clean(posting?.employerId);
    if (!sourceId || postingEmployerId !== employerId) { excluded.push({ sourceId: sourceId || null, reason: !sourceId ? "posting has no source identifier" : "posting belongs to a different employer identity" }); continue; }
    for (const raw of list(posting.capabilities)) {
      const object = raw && typeof raw === "object" ? raw : {};
      const label = clean(typeof raw === "string" ? raw : object.label || object.name);
      const evidenceIds = list(object.evidenceIds).map(clean).filter(Boolean);
      if (!label || !evidenceIds.length) { excluded.push({ sourceId, reason: "capability lacks a label or source evidence identifier" }); continue; }
      const capabilityKey = key(label);
      const group = byCapability.get(capabilityKey) || { id: `capability:${capabilityKey.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, label, postings: new Map(), evidenceIds: new Set() };
      group.postings.set(sourceId, { sourceId, title: clean(posting.title) || "Title withheld" });
      evidenceIds.forEach((id) => group.evidenceIds.add(id));
      byCapability.set(capabilityKey, group);
    }
  }
  const groups = [...byCapability.values()].filter((group) => group.postings.size >= 2).map((group) => ({
    id: group.id,
    label: group.label,
    postingCount: group.postings.size,
    sourceIdentifiers: [...group.postings.keys()].sort(),
    postings: [...group.postings.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
    evidenceIds: [...group.evidenceIds].sort(),
    statement: `Repeated across ${group.postings.size} supplied postings for ${employerName}.`,
  })).sort((a, b) => (b.postingCount - a.postingCount) || a.label.localeCompare(b.label));
  return {
    version: ORGANISATION_SYNTHESIS_VERSION,
    status: groups.length ? "available" : "withheld",
    reason: groups.length ? null : "No source-linked capability repeats across at least two supplied postings in the unambiguous employer set.",
    employer: { id: employerId, name: employerName, ambiguous: false },
    groups,
    excluded,
    withheld,
  };
}
