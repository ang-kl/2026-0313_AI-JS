export const ROLE_VISUAL_CONTRACTS = Object.freeze({
  architecture: Object.freeze({ version: "1.0.0", label: "System architecture", question: "What depends on what?", itemName: "component", layout: "architecture" }),
  concept: Object.freeze({ version: "1.0.0", label: "Concept map", question: "What themes and gaps recur?", itemName: "concept", layout: "network" }),
  trace: Object.freeze({ version: "1.0.0", label: "AI exposure trace", question: "How was exposure derived?", itemName: "trace step", layout: "trace" }),
  funnel: Object.freeze({ version: "1.0.0", label: "Hiring funnel", question: "Where does selection narrow?", itemName: "funnel stage", layout: "funnel" }),
  portfolio: Object.freeze({ version: "1.0.0", label: "Portfolio board", question: "What work can be inspected?", itemName: "portfolio item", layout: "board" }),
  site: Object.freeze({ version: "1.0.0", label: "Site map", question: "Where does work happen?", itemName: "site zone", layout: "site" }),
  control: Object.freeze({ version: "1.0.0", label: "Control map", question: "Where does accountability sit?", itemName: "control", layout: "control" }),
});

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const list = (value) => Array.isArray(value) ? value : [];

function payloadOf(result, familyId) {
  const universe = result?.workUniverse || result?.work_universe || {};
  const families = universe.visualFamilies || universe.visual_families || result?.visualFamilies || result?.visual_families || {};
  return families[familyId] || null;
}

export function buildRoleSensitiveVisual(result = {}, familyId) {
  const contract = ROLE_VISUAL_CONTRACTS[familyId];
  if (!contract) return { status: "unavailable", familyId, contract: null, items: [], links: [], excluded: [], boundary: `Visual family ${String(familyId)} is not governed in this build.` };
  const payload = payloadOf(result, familyId);
  if (!payload || typeof payload !== "object") return { status: "withheld", familyId, contract, items: [], links: [], excluded: [], boundary: `No versioned supplied-data payload was provided for ${contract.label}. Role title is not used to infer one.` };
  if (payload.contractVersion !== contract.version) return { status: "withheld", familyId, contract, items: [], links: [], excluded: [], boundary: `${contract.label} requires contract ${contract.version}; supplied ${clean(payload.contractVersion) || "no version"}.` };
  const excluded = [];
  const seen = new Set();
  const items = list(payload.items).flatMap((raw, index) => {
    const item = raw && typeof raw === "object" ? raw : {};
    const id = clean(item.id);
    const label = clean(item.label || item.name);
    const evidenceIds = [...new Set(list(item.evidenceIds).map(clean).filter(Boolean))];
    if (!id || !label || !evidenceIds.length || seen.has(id)) { excluded.push({ index, id: id || null, reason: seen.has(id) ? "duplicate item id" : "item requires id, label and evidenceIds" }); return []; }
    seen.add(id);
    return [{ id, label, description: clean(item.description || item.detail), evidenceIds, state: clean(item.state || item.status) || "supplied", order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1 }];
  }).sort((a, b) => a.order - b.order);
  const ids = new Set(items.map((item) => item.id));
  const links = list(payload.links).flatMap((raw, index) => {
    const from = clean(raw?.from), to = clean(raw?.to), evidenceIds = [...new Set(list(raw?.evidenceIds).map(clean).filter(Boolean))];
    if (!ids.has(from) || !ids.has(to) || !evidenceIds.length) { excluded.push({ index, id: clean(raw?.id) || null, reason: "link endpoints and evidence must resolve to supplied items" }); return []; }
    return [{ id: clean(raw.id) || `link:${from}:${to}:${index + 1}`, from, to, label: clean(raw.label || raw.type) || "linked to", evidenceIds }];
  });
  const evidenceIds = [...new Set([...items.flatMap((item) => item.evidenceIds), ...links.flatMap((link) => link.evidenceIds)])];
  return {
    status: items.length ? "available" : "withheld",
    familyId,
    contract,
    items,
    links,
    evidenceIds,
    excluded,
    boundary: items.length ? `${contract.label} uses only its supplied contract ${contract.version}; missing structure is withheld.` : `${contract.label} payload contains no source-linked ${contract.itemName} items.`,
  };
}
