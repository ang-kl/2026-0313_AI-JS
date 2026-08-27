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

function profileObject(result) {
  const universe = result?.workUniverse || {};
  const snakeUniverse = result?.work_universe || {};
  const candidates = [
    universe.occupationVisualProfile,
    universe.occupation_visual_profile,
    snakeUniverse.occupationVisualProfile,
    snakeUniverse.occupation_visual_profile,
    result?.occupationVisualProfile,
    result?.occupation_visual_profile,
  ];
  return candidates.find((value) => value && typeof value === "object" && Object.keys(value).length > 0) || null;
}

export const OCCUPATION_VISUALS = [
  { id: "graph", label: "Graph", question: "What shape is this role?" },
  { id: "org", label: "Org", question: "What reports up to what?" },
  { id: "workflow", label: "Workflow", question: "Who acts when?" },
  { id: "stream", label: "Value stream", question: "Where does time go?" },
];

const VISUAL_ALIASES = new Map([
  ["graph", "graph"],
  ["role graph", "graph"],
  ["concept graph", "graph"],
  ["role evidence map", "graph"],
  ["org", "org"],
  ["organisation", "org"],
  ["organization", "org"],
  ["organisation map", "org"],
  ["organization map", "org"],
  ["organisation chart", "org"],
  ["organization chart", "org"],
  ["operating model map", "org"],
  ["decision rights map", "org"],
  ["workflow", "workflow"],
  ["workflow map", "workflow"],
  ["process flow", "workflow"],
  ["process redesign flow", "workflow"],
  ["service blueprint", "workflow"],
  ["stream", "stream"],
  ["value stream", "stream"],
  ["value stream map", "stream"],
]);

function normaliseVisual(value) {
  const supplied = clean(typeof value === "object" && value ? first(value.id, value.key, value.label, value.name, value.visual) : value);
  const normalisedAlias = supplied.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const id = VISUAL_ALIASES.get(normalisedAlias) || null;
  const definition = OCCUPATION_VISUALS.find((visual) => visual.id === id) || null;
  return { supplied, id, supported: Boolean(definition), label: definition?.label || supplied };
}

function sourceId(value) {
  if (typeof value === "string" || typeof value === "number") return clean(value);
  if (!value || typeof value !== "object") return "";
  return clean(first(value.id, value.sourceSpan, value.source_span, value.sourceId, value.source_id, value.evidenceId, value.evidence_id));
}

function normaliseReason(value, index) {
  const object = value && typeof value === "object" ? value : {};
  const reason = clean(typeof value === "string" ? value : first(object.reason, object.explanation, object.text));
  if (!reason) return null;
  const evidenceId = sourceId(first(object.sourceSpan, object.source_span, object.sourceId, object.source_id, object.evidenceId, object.evidence_id, object.src));
  return { id: `visual-reason-${index + 1}`, reason, evidenceId, linked: Boolean(evidenceId) };
}

function normaliseEsco(value) {
  if (!value) return null;
  if (typeof value === "string") return { id: "", title: clean(value), confidence: "" };
  if (typeof value !== "object") return null;
  const occupation = {
    id: clean(first(value.id, value.uri, value.code, value.escoId, value.esco_id)),
    title: clean(first(value.title, value.label, value.name, value.preferredLabel, value.preferred_label)),
    confidence: clean(first(value.confidence, value.score)),
  };
  return occupation.id || occupation.title || occupation.confidence ? occupation : null;
}

export function buildOccupationVisualProfile(result = {}) {
  const profile = profileObject(result);
  if (!profile) {
    return {
      supplied: false,
      status: "withheld",
      recommendation: null,
      primary: null,
      secondary: [],
      unsupported: [],
      reasons: [],
      linkedReasons: [],
      escoOccupation: null,
      workNature: "",
      boundary: "No occupation visual profile was supplied. Role title and posting text are not used to guess a visual.",
    };
  }

  const primary = normaliseVisual(first(profile.primaryVisual, profile.primary_visual));
  const secondary = asArray(first(profile.secondaryVisuals, profile.secondary_visuals)).map(normaliseVisual).filter((visual) => visual.supplied);
  const reasons = asArray(first(profile.whyThisVisual, profile.why_this_visual)).map(normaliseReason).filter(Boolean);
  const linkedReasons = reasons.filter((reason) => reason.linked);
  const recommendation = primary.supported && linkedReasons.length ? primary.id : null;
  const unsupported = [primary, ...secondary].filter((visual) => visual.supplied && !visual.supported);
  let boundary = "The supplied primary visual is supported and has a source-linked reason. Selection remains human-controlled.";
  if (!primary.supplied) boundary = "The profile does not declare a primary visual. Recommendation withheld.";
  else if (!primary.supported) boundary = `The supplied primary visual “${primary.supplied}” is unavailable in this build and is not remapped.`;
  else if (!linkedReasons.length) boundary = "The supplied primary visual has no source-linked reason. Recommendation withheld.";

  return {
    supplied: true,
    status: recommendation ? "available" : "withheld",
    recommendation,
    primary,
    secondary,
    unsupported,
    reasons,
    linkedReasons,
    escoOccupation: normaliseEsco(first(profile.escoOccupation, profile.esco_occupation)),
    workNature: clean(first(profile.workNature, profile.work_nature)),
    boundary,
  };
}
