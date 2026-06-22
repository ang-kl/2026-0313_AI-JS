// graphMetrics.js - shared node-importance ranking for the WikiGraph views.
// Pure, deterministic. Used by both the radial focus-browser (WikiGraphView) and
// the force-directed neural graph (NeuralGraph) so a node ranks the same in both.

// Major / minor weight by node type (role/occupation/org = major, skill = mid, duty/qual = minor).
export const TYPE_WEIGHT = {
  role: 1.0, occupation: 0.92, iscoOccupation: 0.92,
  "mirror-occupation": 0.84, organisation: 0.8,
  skill: 0.56, escoSkill: 0.56,
  qualification: 0.32, duty: 0.3,
};

// Importance ~0.3 (minor) .. ~1.6 (centre/major). type weight + repeat count + hub bump.
export function nodeImportance(node, nodeMap) {
  if (!node) return 0.45;
  const tw = TYPE_WEIGHT[node.type] != null ? TYPE_WEIGHT[node.type] : 0.5;
  const cnt = Number(node.count) || 0;
  const countBump = Math.min(0.32, Math.max(0, cnt - 1) * 0.07);
  const kids = (node.children || []).filter(k => nodeMap && nodeMap[k]).length;
  const hubBump = Math.min(0.28, kids * 0.05);
  return tw + countBump + hubBump;
}

// Map importance to a bubble scale for the radial view (minor small, major large).
export function impToScale(imp) {
  const t = Math.max(0, Math.min(1, (imp - 0.3) / 1.05));
  return 0.56 + t * 0.46; // 0.56 (minor) .. ~1.02 (major)
}
