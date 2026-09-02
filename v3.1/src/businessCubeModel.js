const WORK_LAYERS = [
  { id: "execute", label: "Execute", levels: ["MEDIUM"] },
  { id: "coordinate", label: "Coordinate", levels: ["LOW"] },
  { id: "govern", label: "Govern", levels: ["HUMAN"] },
];

const ALLOCATION_LAYERS = [
  { id: "human-held", label: "Human-held" },
  { id: "augmentation-review", label: "Augmentation review" },
  { id: "agent-candidate", label: "Agent candidate" },
];

function withheldFunction(index) {
  return {
    id: `withheld-function-${index + 1}`,
    label: "Function evidence withheld",
    sourceIds: [],
    status: "withheld",
  };
}
function functionSlots(functions, clusters) {
  const counts = new Map();
  clusters.forEach((cluster) => {
    counts.set(cluster.functionId, (counts.get(cluster.functionId) || 0) + 1);
  });
  const ranked = functions
    .map((fn) => ({
      id: fn.id,
      label: fn.name || "Supplied function",
      sourceIds: [fn.id],
      status: "supplied",
      count: counts.get(fn.id) || 0,
    }))
    .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));

  if (ranked.length > 3) {
    return [
      ranked[0],
      ranked[1],
      {
        id: "other-supplied-functions",
        label: "Other supplied functions",
        sourceIds: ranked.slice(2).flatMap((item) => item.sourceIds),
        status: "supplied",
        count: ranked.slice(2).reduce((sum, item) => sum + item.count, 0),
      },
    ];
  }

  return ranked.concat(Array.from({ length: 3 - ranked.length }, (_, index) => withheldFunction(index)));
}

function allocationFor(cluster) {
  if (cluster.promoted) return "agent-candidate";
  if (cluster.level === "HUMAN") return "human-held";
  return "augmentation-review";
}

function workLayerFor(cluster) {
  if (cluster.level === "LOW") return "coordinate";
  if (cluster.level === "HUMAN") return "govern";
  return "execute";
}

export function sectorEvidenceFromRegistry(empReg) {
  const data = empReg && empReg.status === "done" ? empReg.data : null;
  if (data && data.matched === "exact" && data.primarySsicDescription) {
    return {
      status: "exact",
      label: data.primarySsicDescription,
      code: data.primarySsicCode || "",
      source: "ACRA (data.gov.sg, Information on Corporate Entities)",
      retrievedAt: empReg.retrievedAt || "",
    };
  }
  return {
    status: "withheld",
    label: "Sector evidence withheld",
    code: "",
    source: "No exact ACRA/SSIC match",
    retrievedAt: empReg && empReg.retrievedAt ? empReg.retrievedAt : "",
  };
}

export function buildBusinessCubeModel(agentModel, sectorEvidence) {
  const model = agentModel || { functions: [], clusters: [], agents: [] };
  const clusters = Array.isArray(model.clusters) ? model.clusters : [];
  const agents = Array.isArray(model.agents) ? model.agents : [];
  const functions = functionSlots(Array.isArray(model.functions) ? model.functions : [], clusters);
  const agentByCluster = new Map(agents.map((agent) => [agent.clusterId, agent]));
  const cells = [];

  functions.forEach((fn, x) => {
    WORK_LAYERS.forEach((workLayer, y) => {
      ALLOCATION_LAYERS.forEach((allocation, z) => {
        const members = clusters.filter((cluster) => (
          fn.sourceIds.includes(cluster.functionId)
          && workLayer.id === workLayerFor(cluster)
          && allocation.id === allocationFor(cluster)
        ));
        const cellAgents = members.map((cluster) => agentByCluster.get(cluster.id)).filter(Boolean);
        cells.push({
          id: `${fn.id}:${workLayer.id}:${allocation.id}`,
          x,
          y,
          z,
          function: fn,
          workLayer,
          allocation,
          count: members.length,
          status: members.length ? "evidenced" : "withheld",
          clusters: members,
          agents: cellAgents,
        });
      });
    });
  });

  return {
    sector: sectorEvidence || {
      status: "withheld",
      label: "Sector evidence withheld",
      code: "",
      source: "No exact ACRA/SSIC match",
      retrievedAt: "",
    },
    axes: {
      functions,
      workLayers: WORK_LAYERS,
      allocations: ALLOCATION_LAYERS,
    },
    cells,
    totals: {
      evidencedCells: cells.filter((cell) => cell.count > 0).length,
      clusters: clusters.length,
      agents: agents.length,
    },
  };
}
