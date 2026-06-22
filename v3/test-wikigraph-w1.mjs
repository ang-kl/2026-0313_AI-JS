// W1 unit tests: buildEmployerWiki acceptance criteria (W1.8, items 1-8)
// Self-contained Node.js script; no test framework required.
// Run: node v3/test-wikigraph-w1.mjs
// Mocks the CO2 model; asserts invariants without a browser or React.

// ---- Inline minimal copies of the pure functions used by buildEmployerWiki ----
// (These are byte-identical to the App.jsx implementations; copying here avoids
//  a JSX parse dependency while keeping the test deterministic.)

const COMPANY_AGENT_MAX_DUTIES   = 15;
const COMPANY_AGENT_MIN_RECURRENCE = 2;

function _phraseNorm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function _wikiSlug(s) {
  return _phraseNorm(s).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

function buildEmployerWiki(model) {
  if (!model) return { notes: [], withheld: [], nextMove: null, stats: {} };

  const notes = [];

  const orgSlug = _wikiSlug(model.company || "employer");
  const orgId = "org:" + orgSlug;
  notes.push({
    id: orgId,
    title: model.company || "",
    type: "employer",
    wikilink: "[[employer:" + orgSlug + "|" + (model.company || "") + "]]",
    source: "from MCF",
    confidence: model.stats ? (model.stats.postings + " posting" + (model.stats.postings === 1 ? "" : "s") + " sampled") : "from MCF",
    fields: [],
    body: "",
    links: [],
    backlinks: [],
    kgNodeId: null,
  });

  const uuidToJob = {};
  (model._jobs || []).forEach(function(j) { if (j && j.uuid) uuidToJob[j.uuid] = j; });
  (model.clusters || []).forEach(function(c) {
    (c.provenance || []).forEach(function(p) {
      if (p && p.uuid && !uuidToJob[p.uuid]) uuidToJob[p.uuid] = p;
    });
  });

  const jobadIds = {};
  Object.keys(uuidToJob).forEach(function(uuid) {
    const j = uuidToJob[uuid];
    const jobId = "jobad:" + uuid;
    jobadIds[uuid] = jobId;
    notes.push({
      id: jobId,
      title: j.title || ("Posting " + uuid.slice(0, 8)),
      type: "jobad",
      wikilink: "[[jobad:" + uuid + "|" + (j.title || uuid.slice(0, 8)) + "]]",
      source: "from MCF",
      confidence: j.postedDate ? ("posted " + j.postedDate.slice(0, 10)) : "from MCF",
      fields: [],
      body: "",
      links: [],
      backlinks: [],
      kgNodeId: null,
    });
  });

  const _agentClusterIds = new Set((model.agents || []).map(function(a) { return a.clusterId; }));
  const keptClusters = (model.clusters || []).slice()
    .sort(function(a, b) { return (b.recurrence - a.recurrence) || a.repDuty.localeCompare(b.repDuty); })
    .filter(function(c, i) { return i < COMPANY_AGENT_MAX_DUTIES || _agentClusterIds.has(c.id); });

  const dutyIds = {};
  keptClusters.forEach(function(c) {
    const dutyId = "duty:" + c.id;
    dutyIds[c.id] = dutyId;
    notes.push({
      id: dutyId,
      title: c.repDuty,
      type: "duty",
      wikilink: "[[duty:" + c.id + "|" + c.repDuty + "]]",
      source: "derived",
      confidence: "recurs across " + c.recurrence + " role" + (c.recurrence === 1 ? "" : "s") + ", " + c.level,
      fields: [],
      body: "",
      links: [],
      backlinks: [],
      kgNodeId: c.id,
    });
  });

  const skillSeen = {};
  keptClusters.forEach(function(c) {
    (c.skills || []).forEach(function(sk) {
      const skillStr = typeof sk === "string" ? sk : (sk.skill || "");
      if (!skillStr) return;
      const slug = _wikiSlug(skillStr);
      if (!slug) return;
      const skillId = "skill:" + slug;
      if (!skillSeen[slug]) {
        skillSeen[slug] = skillId;
        notes.push({
          id: skillId,
          title: skillStr,
          type: "skill",
          wikilink: "[[skill:" + slug + "|" + skillStr + "]]",
          source: "from MCF",
          confidence: "from posting",
          fields: [],
          body: "",
          links: [],
          backlinks: [],
          kgNodeId: null,
        });
      }
    });
  });

  const agentIds = {};
  const emitAgents = !(model.withheld && model.withheld.length > 0 && (model.agents || []).length === 0);
  if (emitAgents) {
    (model.agents || []).forEach(function(ag) {
      const agentNoteId = "agent:" + ag.id;
      agentIds[ag.id] = agentNoteId;
      notes.push({
        id: agentNoteId,
        title: ag.label,
        type: "agent",
        wikilink: "[[agent:" + ag.id + "|" + ag.label + "]]",
        source: "derived",
        confidence: "score " + ag.score + ", recurs across " + ag.recurrence + " role" + (ag.recurrence === 1 ? "" : "s"),
        fields: [],
        body: "",
        links: [],
        backlinks: [],
        kgNodeId: ag.id,
      });
    });
  }

  const noteById = {};
  notes.forEach(function(n) { noteById[n.id] = n; });

  function safeWikilink(targetId) {
    var t = noteById[targetId];
    if (!t) return null;
    // Use the full targetId in the token so the renderer can resolve it back to the note.
    return "[[" + targetId + "|" + t.title + "]]";
  }

  function addLink(fromId, toId) {
    var src = noteById[fromId];
    var tgt = noteById[toId];
    if (!src || !tgt) return;
    if (src.links.indexOf(toId) === -1) src.links.push(toId);
  }

  Object.keys(jobadIds).forEach(function(uuid) { addLink(orgId, jobadIds[uuid]); });
  (model.agents || []).forEach(function(ag) {
    if (agentIds[ag.id]) addLink(orgId, agentIds[ag.id]);
  });

  var orgNote = noteById[orgId];
  orgNote.fields = [
    ["Type", "Employer (employer persona)"],
    ["Postings sampled", String((model.stats && model.stats.postings) || 0)],
    ["Duty clusters", String((model.stats && model.stats.clusters) || 0)],
    ["Agent candidates", String((model.stats && model.stats.agents) || 0)],
  ];
  var jobadWikilinks = Object.keys(jobadIds).slice(0, 6).map(function(uuid) {
    return safeWikilink(jobadIds[uuid]);
  }).filter(Boolean).join(", ");
  orgNote.body = (model.company || "This employer") + " has " + ((model.stats && model.stats.postings) || 0)
    + " sampled posting" + (((model.stats && model.stats.postings) || 0) === 1 ? "" : "s") + " on MyCareersFuture."
    + (jobadWikilinks ? " Postings include: " + jobadWikilinks + "." : "")
    + ((model.withheld && model.withheld.length > 0) ? " Note: " + model.withheld[0] : "");

  keptClusters.forEach(function(c) {
    var dutyNoteId = dutyIds[c.id];
    if (!dutyNoteId) return;
    c.roleUuids.forEach(function(uuid) {
      if (jobadIds[uuid]) {
        addLink(dutyNoteId, jobadIds[uuid]);
        addLink(jobadIds[uuid], dutyNoteId);
      }
    });
    (c.skills || []).forEach(function(sk) {
      var skillStr = typeof sk === "string" ? sk : (sk.skill || "");
      if (!skillStr) return;
      var slug = _wikiSlug(skillStr);
      var skillId = "skill:" + slug;
      if (skillSeen[slug]) {
        addLink(dutyNoteId, skillId);
        c.roleUuids.forEach(function(uuid) {
          if (jobadIds[uuid]) addLink(jobadIds[uuid], skillId);
        });
      }
    });
    var backingAgent = (model.agents || []).find(function(a) { return a.clusterId === c.id; });
    if (backingAgent && agentIds[backingAgent.id]) addLink(dutyNoteId, agentIds[backingAgent.id]);
  });

  (model.agents || []).forEach(function(ag) {
    if (!agentIds[ag.id]) return;
    var agentNoteId = agentIds[ag.id];
    if (dutyIds[ag.clusterId]) addLink(agentNoteId, dutyIds[ag.clusterId]);
    var cluster = keptClusters.find(function(c) { return c.id === ag.clusterId; });
    if (cluster) {
      cluster.roleUuids.forEach(function(uuid) {
        if (jobadIds[uuid]) addLink(agentNoteId, jobadIds[uuid]);
      });
    }
  });

  keptClusters.forEach(function(c) {
    var dutyNoteId = dutyIds[c.id];
    if (!dutyNoteId) return;
    var dutyNote = noteById[dutyNoteId];
    dutyNote.fields = [
      ["Exposure band", c.level],
      ["Recurrence", c.recurrence + " of " + ((model.stats && model.stats.postings) || "sampled") + " roles"],
      ["AI-adjacent signals", String(c.aiAdjacency || 0)],
      ["Promoted", c.promoted ? "yes" : "no"],
    ];
    var jobadLinks = c.roleUuids.slice(0, 4).map(function(uuid) { return safeWikilink(jobadIds[uuid]); }).filter(Boolean).join(", ");
    var skillLinks = (c.skills || []).slice(0, 4).map(function(sk) {
      var skillStr = typeof sk === "string" ? sk : (sk.skill || "");
      if (!skillStr) return null;
      var slug = _wikiSlug(skillStr);
      return safeWikilink("skill:" + slug);
    }).filter(Boolean).join(", ");
    var backingAgent = (model.agents || []).find(function(a) { return a.clusterId === c.id; });
    var agentLink = (backingAgent && agentIds[backingAgent.id]) ? safeWikilink(agentIds[backingAgent.id]) : null;
    dutyNote.body = "Recurring duty: \"" + c.repDuty + "\". "
      + "Appears across " + c.recurrence + " of the sampled roles"
      + (jobadLinks ? " (" + jobadLinks + ")" : "") + ". "
      + "Exposure: " + c.level + "."
      + (skillLinks ? " Related skills: " + skillLinks + "." : "")
      + (agentLink ? " Agent candidate: " + agentLink + "." : "");
  });

  Object.keys(uuidToJob).forEach(function(uuid) {
    var jobadNote = noteById[jobadIds[uuid]];
    if (!jobadNote) return;
    var j = uuidToJob[uuid];
    jobadNote.fields = [
      ["Posted", j.postedDate ? j.postedDate.slice(0, 10) : "[UNVERIFIED]"],
      ["Employer", safeWikilink(orgId) || (model.company || "")],
    ];
    if (j.mcfUrl) jobadNote.fields.push(["MCF URL", j.mcfUrl]);
    var spanningDuties = keptClusters.filter(function(c) { return c.roleUuids.indexOf(uuid) !== -1; });
    var dutyLinks = spanningDuties.slice(0, 4).map(function(c) { return safeWikilink(dutyIds[c.id]); }).filter(Boolean).join(", ");
    jobadNote.body = "Job ad for " + (j.title || "this role") + " at " + (safeWikilink(orgId) || model.company || "this employer") + "."
      + (dutyLinks ? " Recurring duties from this posting: " + dutyLinks + "." : "");
  });

  Object.keys(skillSeen).forEach(function(slug) {
    var skillId = "skill:" + slug;
    var skillNote = noteById[skillId];
    if (!skillNote) return;
    var spanningDuties = keptClusters.filter(function(c) {
      return (c.skills || []).some(function(sk) {
        var s = typeof sk === "string" ? sk : (sk.skill || "");
        return _wikiSlug(s) === slug;
      });
    });
    var spanUuids = new Set();
    spanningDuties.forEach(function(c) { c.roleUuids.forEach(function(u) { spanUuids.add(u); }); });
    skillNote.fields = [["Seen in", spanUuids.size + " of " + ((model.stats && model.stats.postings) || "sampled") + " roles"]];
    var dutyLinks = spanningDuties.slice(0, 3).map(function(c) { return safeWikilink(dutyIds[c.id]); }).filter(Boolean).join(", ");
    var jobadLinks = Array.from(spanUuids).slice(0, 3).map(function(uuid) { return safeWikilink(jobadIds[uuid]); }).filter(Boolean).join(", ");
    skillNote.body = "Skill: \"" + skillNote.title + "\". "
      + "Appears in " + spanUuids.size + " of the sampled postings"
      + (jobadLinks ? " (" + jobadLinks + ")" : "") + "."
      + (dutyLinks ? " Related duties: " + dutyLinks + "." : "");
  });

  (model.agents || []).forEach(function(ag) {
    if (!agentIds[ag.id]) return;
    var agentNote = noteById[agentIds[ag.id]];
    if (!agentNote) return;
    var cluster = keptClusters.find(function(c) { return c.id === ag.clusterId; });
    agentNote.fields = [
      ["Score", String(ag.score)],
      ["Recurrence", ag.recurrence + " role" + (ag.recurrence === 1 ? "" : "s")],
      ["Exposure", ag.level],
    ];
    var dutyLink = (cluster && dutyIds[cluster.id]) ? safeWikilink(dutyIds[cluster.id]) : null;
    var jobadLinks = cluster ? cluster.roleUuids.slice(0, 3).map(function(uuid) { return safeWikilink(jobadIds[uuid]); }).filter(Boolean).join(", ") : "";
    agentNote.body = "Agent candidate: " + ag.label + ". "
      + "Backed by " + (dutyLink ? "duty " + dutyLink : "a recurring duty cluster") + ". "
      + "Recurs across " + ag.recurrence + " of this employer's sampled role" + (ag.recurrence === 1 ? "" : "s")
      + (jobadLinks ? " (" + jobadLinks + ")" : "") + ".";
  });

  // Closure pass: backlinks
  notes.forEach(function(n) { n.backlinks = []; });
  notes.forEach(function(n) {
    n.links.forEach(function(targetId) {
      var tgt = noteById[targetId];
      if (tgt && tgt.backlinks.indexOf(n.id) === -1) tgt.backlinks.push(n.id);
    });
  });

  // nextMove
  var nextMove = null;
  var agentList = model.agents || [];
  if (agentList.length > 0) {
    var a0 = agentList[0];
    nextMove = {
      kind: "agent",
      targetId: "agent:" + a0.id,
      line: "your next best move is to review " + a0.label + " - it recurs across " + a0.recurrence + " of this employer's sampled role" + (a0.recurrence === 1 ? "" : "s"),
      source: "derived",
      prov: "derived",
    };
  } else if (keptClusters.length > 0) {
    var humanDuties = keptClusters.filter(function(c) { return c.level === "HUMAN"; });
    if (humanDuties.length > 0) {
      var best = humanDuties.slice().sort(function(a, b) {
        if (b.recurrence !== a.recurrence) return b.recurrence - a.recurrence;
        return a.repDuty.localeCompare(b.repDuty);
      })[0];
      var bestDutyId = dutyIds[best.id];
      if (bestDutyId && noteById[bestDutyId]) {
        nextMove = {
          kind: "duty",
          targetId: bestDutyId,
          line: "the work most likely to stay human-led here is " + safeWikilink(bestDutyId) + ", recurring across " + best.recurrence + " role" + (best.recurrence === 1 ? "" : "s"),
          source: "derived",
          prov: "derived",
        };
      }
    }
  }

  if (model.withheld && model.withheld.length > 0 && agentList.length === 0) nextMove = null;

  return {
    notes,
    withheld: model.withheld || [],
    nextMove,
    stats: {
      notes: notes.length,
      byType: {
        employer: notes.filter(function(n) { return n.type === "employer"; }).length,
        jobad:    notes.filter(function(n) { return n.type === "jobad"; }).length,
        duty:     notes.filter(function(n) { return n.type === "duty"; }).length,
        skill:    notes.filter(function(n) { return n.type === "skill"; }).length,
        agent:    notes.filter(function(n) { return n.type === "agent"; }).length,
      },
    },
  };
}

// Minimal companyAgentsToKgPayload (mirrors the real one for kgNodeId validity check)
function companyAgentsToKgPayload(model) {
  if (!model) return null;
  const nodes = [];
  const edges = [];
  (model.functions || []).forEach(function(fn) {
    nodes.push({ id: fn.id, type: "organisation", label: fn.name, cluster: "functions", source: "mcf" });
  });
  const _agentClusterIds = new Set((model.agents || []).map(function(a) { return a.clusterId; }));
  const _dutyClusters = (model.clusters || []).slice()
    .sort(function(a, b) { return (b.recurrence - a.recurrence) || a.repDuty.localeCompare(b.repDuty); })
    .filter(function(c, i) { return i < COMPANY_AGENT_MAX_DUTIES || _agentClusterIds.has(c.id); });
  _dutyClusters.forEach(function(c) {
    nodes.push({ id: c.id, type: "duty", label: c.repDuty.slice(0, 80), cluster: "duties", source: "derived" });
    edges.push({ source: c.functionId, target: c.id, verb: "recurs in" });
  });
  (model.agents || []).forEach(function(ag) {
    nodes.push({ id: ag.id, type: "agent", label: ag.label.slice(0, 80), cluster: "agents", source: "derived" });
    edges.push({ source: ag.clusterId, target: ag.id, verb: "could become" });
  });
  return { version: "kg1", nodes, edges };
}

// ---- Test fixtures ----

// Full model: 5 postings, 2 clusters, 1 agent
const MOCK_UUID1 = "aaaaaaaabbbbcccc1111222233334444";
const MOCK_UUID2 = "bbbbbbbbccccdddd2222333344445555";
const MOCK_UUID3 = "ccccccccddddeeee3333444455556666";
const MOCK_UUID4 = "ddddddddeeeeffffaaaa111122223333";
const MOCK_UUID5 = "eeeeeeeeffffggggbbbb222233334444";

const MOCK_MODEL = {
  company: "Metta Welfare Association",
  functions: [
    { id: "fn-social-services", name: "Social Services", roleUuids: [MOCK_UUID1, MOCK_UUID2, MOCK_UUID3], clusterIds: ["cluster-1"] },
  ],
  clusters: [
    {
      id: "cluster-1",
      repDuty: "coordinate care plans for residents",
      roleTitles: ["Social Worker", "Case Manager", "Care Coordinator"],
      roleUuids: [MOCK_UUID1, MOCK_UUID2, MOCK_UUID3],
      skills: [{ skill: "Case Management", fromUuid: MOCK_UUID1 }, { skill: "Communication", fromUuid: MOCK_UUID2 }],
      recurrence: 3,
      level: "HUMAN",
      exposureWeight: 0,
      aiAdjacency: 1,
      score: 0,
      promoted: true,
      functionId: "fn-social-services",
      functionName: "Social Services",
      provenance: [
        { uuid: MOCK_UUID1, title: "Social Worker", postedDate: "2026-05-01", mcfUrl: "https://mcf.sg/j/1", dutyDetail: true },
        { uuid: MOCK_UUID2, title: "Case Manager", postedDate: "2026-05-03", mcfUrl: "https://mcf.sg/j/2", dutyDetail: true },
        { uuid: MOCK_UUID3, title: "Care Coordinator", postedDate: "2026-05-05", mcfUrl: "https://mcf.sg/j/3", dutyDetail: false },
      ],
    },
    {
      id: "cluster-2",
      repDuty: "prepare monthly reports for stakeholders",
      roleTitles: ["Data Analyst", "Reporting Officer"],
      roleUuids: [MOCK_UUID4, MOCK_UUID5],
      skills: [{ skill: "Excel", fromUuid: MOCK_UUID4 }, { skill: "Communication", fromUuid: MOCK_UUID5 }],
      recurrence: 2,
      level: "MEDIUM",
      exposureWeight: 2,
      aiAdjacency: 3,
      score: 4,
      promoted: true,
      functionId: "fn-social-services",
      functionName: "Social Services",
      provenance: [
        { uuid: MOCK_UUID4, title: "Data Analyst", postedDate: "2026-05-10", mcfUrl: "https://mcf.sg/j/4", dutyDetail: true },
        { uuid: MOCK_UUID5, title: "Reporting Officer", postedDate: "2026-05-12", mcfUrl: "https://mcf.sg/j/5", dutyDetail: false },
      ],
    },
  ],
  agents: [
    {
      id: "agent-cluster-2",
      label: "an agent that prepares monthly reports",
      spansRoles: ["Data Analyst", "Reporting Officer"],
      recurrence: 2,
      level: "MEDIUM",
      score: 4,
      clusterId: "cluster-2",
      functionId: "fn-social-services",
    },
  ],
  sat: { indicators: [], ach: [], keyAssumptions: [], qoi: { postingsAnalysed: 5, dutiesClustered: 10, detailFetched: 3, tag: "rich" } },
  withheld: [],
  stats: { postings: 5, duties: 10, clusters: 2, agents: 1 },
};

// Thin/withheld model: agents:[], withheld non-empty
const THIN_MODEL = {
  company: "Tiny Co",
  functions: [],
  clusters: [],
  agents: [],
  sat: { indicators: [], ach: [], keyAssumptions: [], qoi: { postingsAnalysed: 2, dutiesClustered: 0, detailFetched: 0, tag: "thin" } },
  withheld: ["Too few of \"Tiny Co\"'s postings carry detailed duties to read recurring AI-exposable work reliably - showing the postings only. (2 postings found; need at least 4)"],
  stats: { postings: 2, duties: 0, clusters: 0, agents: 0 },
};

// ---- Test helpers ----
let passed = 0;
let failed = 0;

function assert(condition, name, detail) {
  if (condition) {
    console.log("  PASS: " + name);
    passed++;
  } else {
    console.error("  FAIL: " + name + (detail ? " -- " + detail : ""));
    failed++;
  }
}

// ---- Run tests ----
console.log("\n=== WikiGraph W1 unit tests ===\n");

const wiki = buildEmployerWiki(MOCK_MODEL);
const noteById = {};
wiki.notes.forEach(function(n) { noteById[n.id] = n; });

// 1. No dangling wikilinks: every id in links[] exists in notes[]
console.log("1. No dangling wikilinks");
{
  let dangling = 0;
  wiki.notes.forEach(function(n) {
    n.links.forEach(function(targetId) {
      if (!noteById[targetId]) {
        console.error("     dangling link: " + n.id + " -> " + targetId);
        dangling++;
      }
    });
  });
  // Also check body/fields for [[type:id|...]] tokens where the targetId is prefix:rest
  const wlRe = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  wiki.notes.forEach(function(n) {
    const texts = [n.body].concat(n.fields.map(function(f) { return String(f[1] || ""); }));
    texts.forEach(function(text) {
      var match;
      wlRe.lastIndex = 0;
      while ((match = wlRe.exec(text)) !== null) {
        // match[1] is the full note id (e.g. "org:metta-welfare-association")
        var fullId = match[1];
        if (!noteById[fullId]) {
          console.error("     dangling body wikilink in " + n.id + ": " + fullId);
          dangling++;
        }
      }
    });
  });
  assert(dangling === 0, "zero dangling wikilinks (links[] + body tokens)", "found " + dangling);
}

// 2. Provenance is a subset: every uuid in any note was in the input model
console.log("2. Provenance subset");
{
  const allModelUuids = new Set();
  (MOCK_MODEL.clusters || []).forEach(function(c) {
    (c.provenance || []).forEach(function(p) { if (p.uuid) allModelUuids.add(p.uuid); });
  });
  const jobadNotes = wiki.notes.filter(function(n) { return n.type === "jobad"; });
  let foreign = 0;
  jobadNotes.forEach(function(n) {
    var uuid = n.id.replace("jobad:", "");
    if (!allModelUuids.has(uuid)) {
      console.error("     jobad uuid not in model: " + uuid);
      foreign++;
    }
  });
  assert(foreign === 0, "all jobad uuids come from model provenance", "found " + foreign + " foreign");
}

// 3. Withhold on thin: agents.length===0 + withheld non-empty => nextMove===null, zero agent notes
console.log("3. Withhold on thin model");
{
  const thinWiki = buildEmployerWiki(THIN_MODEL);
  const agentNotes = thinWiki.notes.filter(function(n) { return n.type === "agent"; });
  assert(thinWiki.nextMove === null, "nextMove is null on thin model");
  assert(agentNotes.length === 0, "zero agent notes on thin model");
  assert(thinWiki.withheld.length > 0, "withheld line propagated on thin model");
  const employerNotes = thinWiki.notes.filter(function(n) { return n.type === "employer"; });
  assert(employerNotes.length === 1, "employer note still present on thin model");
}

// 4. No invented node: agent notes 1:1 with model.agents
console.log("4. No invented node (agents 1:1)");
{
  const agentNotes = wiki.notes.filter(function(n) { return n.type === "agent"; });
  assert(agentNotes.length === MOCK_MODEL.agents.length,
    "agent notes count equals model.agents.length",
    agentNotes.length + " vs " + MOCK_MODEL.agents.length);
  // Also verify duty notes 1:1 with kept clusters
  const dutyNotes = wiki.notes.filter(function(n) { return n.type === "duty"; });
  assert(dutyNotes.length === MOCK_MODEL.clusters.length,
    "duty notes count equals model.clusters.length (all clusters kept; < MAX_DUTIES)",
    dutyNotes.length + " vs " + MOCK_MODEL.clusters.length);
}

// 5. nextMove.targetId === "agent:" + model.agents[0].id
console.log("5. nextMove targets rank-0 agent");
{
  const expectedTarget = "agent:" + MOCK_MODEL.agents[0].id;
  assert(wiki.nextMove !== null, "nextMove is not null for model with agents");
  assert(wiki.nextMove && wiki.nextMove.targetId === expectedTarget,
    "nextMove.targetId === 'agent:' + agents[0].id",
    (wiki.nextMove && wiki.nextMove.targetId) + " vs " + expectedTarget);
  // Recurrence in line matches model value (not recomputed)
  const expectedRecurrence = MOCK_MODEL.agents[0].recurrence;
  assert(wiki.nextMove && wiki.nextMove.line.includes(String(expectedRecurrence)),
    "nextMove.line contains verbatim recurrence " + expectedRecurrence);
}

// 6. Backlink symmetry: for every A.links includes B, B.backlinks includes A
console.log("6. Backlink symmetry");
{
  let asymmetric = 0;
  wiki.notes.forEach(function(a) {
    a.links.forEach(function(bId) {
      var b = noteById[bId];
      if (b && b.backlinks.indexOf(a.id) === -1) {
        console.error("     backlink missing: " + bId + " should have " + a.id + " in backlinks");
        asymmetric++;
      }
    });
  });
  assert(asymmetric === 0, "backlinks are symmetric", "found " + asymmetric + " asymmetric pairs");
}

// 7. kgNodeId validity: every non-null kgNodeId exists in companyAgentsToKgPayload nodes
console.log("7. kgNodeId validity");
{
  const kg = companyAgentsToKgPayload(MOCK_MODEL);
  const kgNodeIds = new Set(kg.nodes.map(function(n) { return n.id; }));
  let invalid = 0;
  wiki.notes.forEach(function(n) {
    if (n.kgNodeId !== null && !kgNodeIds.has(n.kgNodeId)) {
      console.error("     invalid kgNodeId: " + n.id + " -> " + n.kgNodeId + " not in kg.nodes");
      invalid++;
    }
  });
  assert(invalid === 0, "all non-null kgNodeIds exist in kg.nodes", "found " + invalid + " invalid");
}

// 8. Byte-identical re-run (determinism)
console.log("8. Byte-identical re-run");
{
  const run1 = JSON.stringify(buildEmployerWiki(MOCK_MODEL));
  const run2 = JSON.stringify(buildEmployerWiki(MOCK_MODEL));
  assert(run1 === run2, "two runs produce identical JSON output");
  // Also test thin model
  const thinRun1 = JSON.stringify(buildEmployerWiki(THIN_MODEL));
  const thinRun2 = JSON.stringify(buildEmployerWiki(THIN_MODEL));
  assert(thinRun1 === thinRun2, "two runs on thin model produce identical output");
}

// Additional: nextMove falls back to HUMAN duty when no agents
console.log("9. nextMove falls back to highest-recurrence HUMAN duty (no agents)");
{
  const noAgentsModel = Object.assign({}, MOCK_MODEL, { agents: [], withheld: [] });
  const noAgentsWiki = buildEmployerWiki(noAgentsModel);
  // cluster-1 is HUMAN with recurrence 3; cluster-2 is MEDIUM
  assert(noAgentsWiki.nextMove !== null, "nextMove not null when HUMAN duty exists");
  assert(noAgentsWiki.nextMove && noAgentsWiki.nextMove.targetId === "duty:cluster-1",
    "nextMove targets highest-recurrence HUMAN duty",
    noAgentsWiki.nextMove && noAgentsWiki.nextMove.targetId);
}

// Summary
console.log("\n=== Results: " + passed + " passed, " + failed + " failed ===\n");
if (failed > 0) process.exit(1);
