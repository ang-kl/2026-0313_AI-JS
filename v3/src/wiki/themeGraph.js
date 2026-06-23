// themeGraph.js - reshapes the KG payload into the O-I-A "surgical cut" structure:
// Role -> Theme groups -> duties (each duty tagged with work mode + AI exposure).
// Deterministic decorator over the FROZEN getKnowledgeGraph payload (read-only) - it adds theme
// nodes and re-routes role->duty edges through them; it invents no duty and reworders nothing.
// Falls back to the original payload (themed:false) when there are too few duties to segment.

import { buildTopics } from "./buildWikiTopics.js";

function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80); }

// Deterministic work-mode estimate from a duty's verbs (aligned to the engine's JOB_LAYERS).
// Used as the ALWAYS-ON fallback when result.jobAnatomy (lazy, LLM-classified) is not loaded yet,
// so the [work-mode] chip never blanks. The engine's layer is preferred when present.
const MODE_VERBS = {
  Relational:     ["liaise", "liaison", "advise", "advising", "advisory", "communicate", "engage", "represent", "negotiate", "respond", "correspond", "correspondence", "partner", "collaborate", "consult", "present", "influence", "relationship", "stakeholder", "engagement"],
  Judgment:       ["assess", "evaluate", "decide", "judge", "analyse", "analyze", "investigate", "determine", "recommend", "interpret", "diagnose", "examine", "appraise", "review", "reviews", "audit", "assessment"],
  Accountability: ["oversee", "ensure", "govern", "approve", "authorise", "authorize", "supervise", "own", "certify", "accountable", "mandate", "endorse", "sign", "lead"],
  Coordination:   ["coordinate", "schedule", "route", "forward", "escalate", "consolidate", "organise", "organize", "facilitate", "align", "arrange", "integrate", "manage"],
};
export function deriveWorkMode(text) {
  const words = String(text || "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "Activity";
  const lead = words[0];
  for (const layer of ["Relational", "Judgment", "Accountability", "Coordination"]) {
    if (MODE_VERBS[layer].includes(lead)) return layer;
  }
  for (const layer of ["Judgment", "Relational", "Accountability", "Coordination"]) {
    if (words.some(w => MODE_VERBS[layer].includes(w))) return layer;
  }
  return "Activity"; // hands-on production is the default
}

export function themeifyGraph(nodes, edges, result) {
  const safeNodes = nodes || [], safeEdges = edges || [];
  const roleNode = safeNodes.find(n => n.type === "role");
  const dutyNodes = safeNodes.filter(n => n.type === "duty");
  // Need a role + a real handful of duties to make segmentation meaningful (withhold otherwise).
  if (!roleNode || dutyNodes.length < 3) {
    return { nodes: safeNodes, edges: safeEdges, topics: [], dutyMeta: {}, stats: { duties: dutyNodes.length, topics: 0 }, themed: false };
  }

  // Work-mode (layer) per duty, matched from the engine's Job Anatomy by verbatim text.
  const layerByText = {};
  const ja = result && result.jobAnatomy;
  if (ja && Array.isArray(ja.duties)) {
    ja.duties.forEach(d => { const t = norm(d.text || d.duty || d.label); if (t) layerByText[t] = d.layer || null; });
  }

  const duties = dutyNodes.map(n => ({
    id: n.id, text: n.label, level: n.level || null,
    // engine layer when Job Anatomy is loaded; else the deterministic always-on estimate
    layer: layerByText[norm(n.label)] || deriveWorkMode(n.label),
  }));
  const { topics, dutyMeta, stats } = buildTopics(duties);

  // Theme nodes (derived) - the segments.
  const themeNodes = topics.map(tp => ({
    id: tp.id, type: "theme", cluster: "theme",
    label: tp.label, seed: tp.seed, source: "derived", confidence: "from R&R segmentation",
    count: tp.dutyIds.length, keywords: tp.keywords,
  }));

  // Decorate duties with their topic + work mode + extracted keywords (for the detail/panel).
  const decoratedDuties = dutyNodes.map(n => {
    const m = dutyMeta[n.id] || {};
    return { ...n, topic: m.topicId || null, mode: m.layer || null, keywords: m.keywords || [] };
  });

  // Edges: drop role->duty, route role->theme->duty; keep everything else (duty->skill, skill->occ...).
  const dutyIdSet = new Set(dutyNodes.map(n => n.id));
  const keptEdges = safeEdges.filter(e => !(e.source === roleNode.id && dutyIdSet.has(e.target)));
  const themeEdges = [];
  topics.forEach(tp => {
    themeEdges.push({ source: roleNode.id, target: tp.id, verb: "groups", weight: 0.9, source_tag: "derived" });
    tp.dutyIds.forEach(did => themeEdges.push({ source: tp.id, target: did, verb: "invokes", weight: 0.8, source_tag: "derived" }));
  });

  const nonDuty = safeNodes.filter(n => n.type !== "duty");
  return {
    nodes: [...nonDuty, ...themeNodes, ...decoratedDuties],
    edges: [...keptEdges, ...themeEdges],
    topics, dutyMeta, stats, themed: true,
  };
}
