import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import OrganisationMap from "./OrganisationMap.jsx";
import WorkflowMap from "./WorkflowMap.jsx";
import ValueStreamMap from "./ValueStreamMap.jsx";
import OccupationVisualSelector from "./OccupationVisualSelector.jsx";
import PersonEvidenceIngress from "./PersonEvidenceIngress.jsx";
import GovernanceLedger from "./GovernanceLedger.jsx";

const WorkUniverseScene = lazy(() => import("./WorkUniverseScene.jsx"));

const C = {
  bg: "#f5f7fa",
  panel: "#ffffff",
  panel2: "#f8fafc",
  ink: "#1a202c",
  muted: "#6b7a8d",
  line: "#dde3ec",
  line2: "#e7edf4",
  accent: "#1a56db",
  soft: "#e8f0fe",
};

const GRAPH_DEFS = [
  { id: 1, key: "labour", name: "LABOUR GRAPH", title: "Labour Graph", flow: "Role → Task → Skill" },
  { id: 2, key: "organisation", name: "ORGANISATION WORK", title: "Organisation Work Graph", flow: "Purpose → Outcome → Work" },
  { id: 3, key: "intelligence", name: "INTELLIGENCE GRAPH", title: "Intelligence Graph", flow: "Human ↔ Org ↔ Agent ↔ External" },
  { id: 4, key: "human-agent", name: "HUMAN–AGENT GRAPH", title: "Human-Agent Graph", flow: "Acquire → Analyse → Select → Commit" },
  { id: 5, key: "transition", name: "TRANSITION GRAPH", title: "Transition Graph", flow: "Future Work − Individual Capital" },
];
const GRAPH_BY_ID = Object.fromEntries(GRAPH_DEFS.map((g) => [g.id, g]));

const PROV_LABEL = {
  direct: { label: "from posting", tone: "mcf" },
  computed: { label: "computed", tone: "computed" },
  derived: { label: "derived", tone: "derived" },
  withheld: { label: "withheld", tone: "withheld" },
};

function arr(v) { return Array.isArray(v) ? v : []; }
function clean(v) { return String(v || "").replace(/\s+/g, " ").trim(); }
function textOf(v) {
  if (typeof v === "string") return clean(v);
  if (!v || typeof v !== "object") return "";
  return clean(v.text || v.label || v.name || v.title || v.description || "");
}
function n(v) { return typeof v === "number" && Number.isFinite(v) ? v : null; }
function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}
function valueLabel(v) { return v === null || v === undefined || v === "" ? "—" : String(v); }
function uniq(items) {
  const seen = new Set();
  return arr(items).filter((item) => {
    const key = clean(typeof item === "string" ? item : item && (item.id || item.label || item.name || item.text));
    if (!key || seen.has(key.toLowerCase())) return false;
    seen.add(key.toLowerCase());
    return true;
  });
}
function uniqNums(items) {
  return [...new Set(arr(items).map((item) => Number(item)).filter((item) => Number.isFinite(item)))].sort((a, b) => a - b);
}
function compactLabel(text, fallback) {
  const s = clean(text);
  if (!s) return fallback;
  const words = s.replace(/[.;:]+$/g, "").split(/\s+/).slice(0, 7).join(" ");
  return words.length > 72 ? `${words.slice(0, 69)}...` : words;
}
function graphLinksFor(text, kind) {
  const s = clean(text).toLowerCase();
  const graphs = new Set([1]);
  if (kind === "req") graphs.add(5);
  if (/\b(govern|policy|compliance|stakeholder|business|department|organisation|organization|vendor|supplier|budget|audit|risk|outcome|kpi|performance)\b/.test(s)) graphs.add(2);
  if (/\b(data|analytic|analysis|report|dashboard|model|evidence|audit|risk|intelligence|knowledge|system|policy|metric)\b/.test(s)) graphs.add(3);
  if (/\b(ai|agent|automat|workflow|process|system|tool|approve|authori[sz]e|commit|verify|select|recommend|implement)\b/.test(s)) graphs.add(4);
  if (/\b(change|transition|future|transform|automation|develop|train|adapt|capability|skill|career|learn|strategy|optimis|optimiz)\b/.test(s)) graphs.add(5);
  return [...graphs].sort((a, b) => a - b);
}
function chipKind(methods, status) {
  if (status === "withheld" || arr(methods).some((m) => /withheld/i.test(m))) return "withheld";
  if (arr(methods).some((m) => /computed|rule/i.test(m))) return "computed";
  if (arr(methods).some((m) => /derived|inferred|llm|esco/i.test(m))) return "derived";
  return "direct";
}
function methodList(...values) {
  return values.flatMap((v) => Array.isArray(v) ? v : [v]).map((v) => clean(v)).filter(Boolean);
}
function makeSignal(id, graphId, name, value, methods, desc, items, production, boundary, status) {
  const cleanItems = arr(items).map((item) => typeof item === "string" ? item : item && item.id).filter(Boolean);
  const finalStatus = status || (value === null || value === undefined || value === "WITHHELD" || value === "—" ? "withheld" : "available");
  return {
    id,
    graphId,
    name,
    value: finalStatus === "withheld" ? "WITHHELD" : valueLabel(value),
    methods: methodList(methods),
    provenance: chipKind(methods, finalStatus),
    desc,
    items: cleanItems,
    production,
    boundary,
    status: finalStatus,
  };
}
function withheldSignal(id, graphId, name, desc, items, boundary) {
  return makeSignal(id, graphId, name, "WITHHELD", ["WITHHELD", "RULE"], desc, items, "Evidence gate failed before a value was produced.", boundary, "withheld");
}
function skillLabel(skill) {
  return clean(skill && (skill.skill || skill.label || skill.name || skill.preferredLabel || skill.title)) || "";
}
function dutyLayer(duty) { return clean(duty && (duty.layer || duty.workLayer || duty.category)); }
function dutyExposure(duty) { return clean(duty && firstDefined(duty.exposureNow, duty.band, duty.exposure, duty.level)); }
function functionVocabulary(evidence) {
  const text = evidence.map((e) => e.text).join(" ").toLowerCase();
  const out = [];
  [
    ["Acquire", /\b(source|gather|collect|procure|obtain|scan|research)\b/],
    ["Analyse", /\b(analy[sz]e|assess|evaluate|review|audit|monitor|interpret)\b/],
    ["Generate", /\b(write|draft|prepare|develop|create|produce|build)\b/],
    ["Recommend", /\b(recommend|advise|propose|strategy|optimis|optimiz)\b/],
    ["Select", /\b(select|prioriti[sz]e|decide|shortlist|choose)\b/],
    ["Authorise", /\b(authori[sz]e|approve|govern|sign.?off|commit)\b/],
    ["Implement", /\b(implement|execute|roll.?out|deliver|manage|lead|drive)\b/],
    ["Verify", /\b(verify|validate|check|ensure|compliance|risk|control)\b/],
  ].forEach(([label, re]) => { if (re.test(text)) out.push(label); });
  return out;
}
function detectCoverage(evidence) {
  const joined = evidence.map((e) => e.text).join(" ").toLowerCase();
  const dimensions = [
    ["Purpose", /\b(objective|purpose|mission|strateg)\b/],
    ["Outcome", /\b(outcome|deliver|kpi|performance|result)\b/],
    ["Work", /\b(manage|lead|drive|support|develop|implement|review)\b/],
    ["Actor", /\b(stakeholder|team|vendor|supplier|department|partner)\b/],
    ["Capability", /\b(capability|skill|expertise|experience|competenc)\b/],
    ["Resource", /\b(system|tool|budget|resource|data|platform)\b/],
    ["Policy", /\b(policy|compliance|governance|regulatory|framework)\b/],
    ["Dependency", /\b(cross-functional|liais|coordinate|partner|dependency)\b/],
    ["Evidence", /\b(report|metric|data|audit|analysis|evidence)\b/],
    ["Risk", /\b(risk|control|audit|issue|remediation)\b/],
    ["Authority", /\b(approve|approval|authori[sz]e|sign.?off|mandate)\b/],
    ["Economics", /\b(cost|budget|commercial|savings|procurement|tender)\b/],
  ];
  return dimensions.filter(([, re]) => re.test(joined)).map(([label]) => label);
}
function buildEvidence(result, posting) {
  const anatomyDuties = arr(result && result.jobAnatomy && result.jobAnatomy.duties);
  const rdDuties = arr(result && result.responsibilitiesData && result.responsibilitiesData.responsibilities);
  const dutySource = anatomyDuties.length ? anatomyDuties : rdDuties;
  const duties = dutySource.map((d, i) => ({
    id: `D${i + 1}`,
    workspaceId: `s${i}`,
    kind: "duty",
    text: textOf(d),
    quote: clean(d && d.quote),
    layer: dutyLayer(d),
    exposure: dutyExposure(d),
  })).filter((e) => e.text);

  const postingSkills = uniq(arr(posting && posting.skills).map((s) => clean(s))).slice(0, 8);
  const reqs = postingSkills.map((s, i) => ({
    id: `R${i + 1}`,
    workspaceId: null,
    kind: "req",
    text: s,
    quote: "",
    layer: "",
    exposure: "",
  }));

  return duties.concat(reqs).map((e) => ({ ...e, graphs: graphLinksFor(e.text, e.kind) }));
}
function buildInterpretations(evidence, result) {
  const duties = evidence.filter((e) => e.kind === "duty");
  const workUnits = duties.map((e, i) => ({
    id: `WU${i + 1}`,
    type: "Work Unit",
    name: e.layer ? `${e.layer}: ${compactLabel(e.text, `Work unit ${i + 1}`)}` : compactLabel(e.text, `Work unit ${i + 1}`),
    src: [e.id],
  }));
  const intelligence = duties
    .filter((e) => /data|analysis|report|policy|audit|risk|system|stakeholder|govern|metric|kpi|evidence/i.test(e.text))
    .map((e, i) => ({
      id: `INT${i + 1}`,
      type: "Intelligence",
      name: compactLabel(e.text, `Intelligence object ${i + 1}`),
      src: [e.id],
    }));
  const supplied = arr(result && result.workUniverse && (result.workUniverse.interpretations || result.workUniverse.objects))
    .map((x, i) => ({ id: clean(x.id) || `INTS${i + 1}`, type: clean(x.type) || "Supplied", name: textOf(x), src: arr(x.src || x.sourceIds) }))
    .filter((x) => x.name);
  return workUnits.concat(intelligence, supplied);
}
function buildUniverse(result, title, employer, band, posting) {
  const evidence = buildEvidence(result, posting);
  const interpretations = buildInterpretations(evidence, result);
  const duties = evidence.filter((e) => e.kind === "duty");
  const skills = uniq(arr(result && result.skills).map(skillLabel).filter(Boolean));
  const classified = duties.filter((d) => d.exposure);
  const workUnits = interpretations.filter((i) => i.type === "Work Unit");
  const intelObjects = interpretations.filter((i) => i.type === "Intelligence");
  const wu = (result && result.workUniverse) || {};
  const org = wu.organisation || wu.organization || {};
  const intel = wu.intelligence || {};
  const ha = wu.humanAgent || wu.human_agent || {};
  const tr = wu.transition || {};
  const coverage = detectCoverage(evidence);
  const functions = functionVocabulary(evidence);
  const authority = firstDefined(org.authority, result && result.authority);
  const suppliedCaps = arr(firstDefined(org.capabilities, result && result.organisationCapabilities, result && result.organizationCapabilities));
  const actionable = n(firstDefined(intel.agentActionableCount, intel.agent_actionable_count));
  const humanHeavy = n(firstDefined(intel.humanHeavyCount, intel.human_heavy_count));
  const allocation = firstDefined(ha.allocation, ha.hha, result && result.humanAgentAllocation);
  const suppliedFunctions = n(firstDefined(ha.functionCount, ha.functionsCount, Array.isArray(ha.functions) ? ha.functions.length : null));
  const exposureBand = firstDefined(band, result && result.band, result && result.exposureBand, result && result.occExposure && result.occExposure.band);
  const changing = firstDefined(tr.changingFirst, tr.changing_first);
  const formation = firstDefined(tr.highFormationCount, tr.high_formation_count);
  const delta = firstDefined(tr.personalDelta, tr.personal_delta);
  const allDutyIds = duties.map((d) => d.id);
  const allEvidenceIds = evidence.map((d) => d.id);

  const labour = [
    duties.length
      ? makeSignal("L1", 1, "Source duties", duties.length, ["OBSERVED", "DIRECT"], "Explicit responsibility lines carried from the selected role source.", allDutyIds, "Direct count of visible duty rows.", "Does not establish hidden work, frequency or effort.")
      : withheldSignal("L1", 1, "Source duties", "No duty evidence is available to count.", [], "The Work Universe does not invent duties."),
    workUnits.length
      ? makeSignal("L2", 1, "Distilled Work Units", workUnits.length, ["DERIVED", "RULE"], "Work-unit rows derived from the duty evidence currently available.", workUnits.map((w) => w.id), "One auditable work unit is produced per duty/layer row unless supplied data already gives one.", "Work-unit boundaries are interpretation, not source wording.")
      : withheldSignal("L2", 1, "Distilled Work Units", "No duty set is available to distil.", [], "No work-unit count is guessed from title text."),
    skills.length
      ? makeSignal("L3", 1, "Canonical skills", skills.length, ["DERIVED", "ESCO / RULE"], "Role skill concepts already present in the analysis result.", skills.map((_, i) => `SK${i + 1}`), "Counts the canonical role skills supplied to Step 3.", "Role requirements are not proof that any person possesses the skill.")
      : withheldSignal("L3", 1, "Canonical skills", "No mapped skill evidence is available in the current result.", [], "No taxonomy count is guessed."),
  ];
  const orgSignals = [
    coverage.length
      ? makeSignal("O1", 2, "OWG evidence coverage", `${Math.round((coverage.length / 12) * 100)}%`, ["DERIVED", "RULE"], "Organisation Work Graph dimensions with visible evidence in the selected source.", allEvidenceIds, "Keyword-gated coverage across 12 canonical organisation-work dimensions.", "Coverage is not organisation truth or maturity.")
      : withheldSignal("O1", 2, "OWG evidence coverage", "The source does not expose enough organisation-work dimensions to score.", allEvidenceIds, "A job title alone cannot establish organisation structure."),
    suppliedCaps.length || workUnits.length
      ? makeSignal("O2", 2, "Capabilities", suppliedCaps.length || workUnits.length, ["DERIVED", suppliedCaps.length ? "SUPPLIED" : "RULE"], suppliedCaps.length ? "Capability objects supplied by the current result." : "Capability clusters mirrored from the available work units.", suppliedCaps.length ? suppliedCaps.map((_, i) => `CAP${i + 1}`) : workUnits.map((w) => w.id), "Capabilities are counted only from supplied objects or visible work-unit evidence.", "Count does not establish maturity, capacity or ownership.")
      : withheldSignal("O2", 2, "Capabilities", "No organisation capability objects or duty-derived work units are available.", [], "The app does not fabricate organisation capabilities."),
    authority !== null
      ? makeSignal("O3", 2, "Authority", authority, ["DIRECT", "DERIVED"], "Authority evidence supplied by the current result.", allEvidenceIds, "Only the supplied authority scope is shown.", "No stronger approval or commit scope is inferred.")
      : withheldSignal("O3", 2, "Authority", "Approval or irreversible commit authority is not established.", allEvidenceIds, "Never infer authority from title, seniority, lead, drive or oversee."),
  ];
  const intelSignals = [
    intelObjects.length
      ? makeSignal("I1", 3, "Intelligence objects", intelObjects.length, ["DERIVED", "RULE"], "Distinct intelligence domains detected from duties and source rows.", intelObjects.map((x) => x.id), "Source rows are converted into named intelligence objects by auditable text rules.", "Object existence does not prove access, storage, API availability or data quality.")
      : withheldSignal("I1", 3, "Intelligence objects", "No Intelligence Graph objects have been produced yet.", allEvidenceIds, "No object count is fabricated from role wording."),
    actionable !== null
      ? makeSignal("I2", 3, "Agent-actionable", actionable, ["COMPUTED"], "Count supplied by governed Intelligence Graph computation.", allEvidenceIds, "Reads only the supplied agent-actionability value.", "Agent-actionable does not mean reliably delegable.")
      : withheldSignal("I2", 3, "Agent-actionable", "Agent actionability has not been established.", allEvidenceIds, "Requires access, reliability, environment and authority evidence."),
    humanHeavy !== null || classified.length
      ? makeSignal("I3", 3, "Human-heavy", humanHeavy !== null ? humanHeavy : classified.filter((d) => /human|low|accountability|relational|judgment/i.test(`${d.exposure} ${d.layer}`)).length, ["DERIVED", humanHeavy !== null ? "COMPUTED" : "RULE"], "Human-heavy signals supplied by the graph or derived from classified duty layers.", classified.map((d) => d.id), "Counts supplied human-heavy objects, or classified duties in accountability/relational/judgment bands.", "Current human-heavy does not mean permanently human-only.")
      : withheldSignal("I3", 3, "Human-heavy", "Human-heavy intelligence has not been established.", allEvidenceIds, "No permanence claim is made."),
  ];
  const haSignals = [
    suppliedFunctions !== null || functions.length
      ? makeSignal("H1", 4, "Functions evaluated", suppliedFunctions !== null ? suppliedFunctions : functions.length, ["DERIVED", suppliedFunctions !== null ? "COMPUTED" : "RULE"], "Canonical execution functions visible in the evidence.", allEvidenceIds, "Maps source verbs to Acquire / Analyse / Generate / Recommend / Select / Authorise / Implement / Verify.", "A function is not a job or a person.")
      : withheldSignal("H1", 4, "Functions evaluated", "No Human-Agent function analysis has been produced yet.", allEvidenceIds, "No function count is inferred from title alone."),
    allocation !== null
      ? makeSignal("H2", 4, "H / HY / A", typeof allocation === "string" ? allocation : JSON.stringify(allocation), ["RULE", "PROJECTED"], "Human / Hybrid / Agent allocation supplied by Work Universe data.", allEvidenceIds, "Reads the supplied scenario allocation.", "Scenario allocation is not a headcount replacement forecast.")
      : withheldSignal("H2", 4, "H / HY / A", "Human / Hybrid / Agent allocation is not established by the current evidence.", allEvidenceIds, "Requires work, capability, reliability, authority and adoption evidence."),
    exposureBand !== null
      ? makeSignal("H3", 4, "Exposure band", exposureBand, ["COMPUTED"], "Existing deterministic role-exposure result carried into the Work Universe.", classified.map((d) => d.id), "Reuses the existing exposure result; no value is recomputed here.", "Exposure is not an H/HY/A replacement ratio.")
      : withheldSignal("H3", 4, "Authority gate", "The public source does not establish exact approval or irreversible commit authority.", allEvidenceIds, "No autonomous commit can be inferred."),
  ];
  const formationCount = formation !== null ? formation : classified.filter((d) => /accountability|relational|judgment|human/i.test(`${d.layer} ${d.exposure}`)).length;
  const transitionSignals = [
    changing !== null
      ? makeSignal("T1", 5, "Changing first", changing, ["PROJECTED"], "Scenario projection supplied by the Transition Graph.", allEvidenceIds, "Reads the supplied future-work projection.", "Projection is not observed displacement.")
      : withheldSignal("T1", 5, "Changing first", "No governed future-work projection is available yet.", allEvidenceIds, "The landing does not predict change from exposure alone."),
    formation !== null || formationCount > 0
      ? makeSignal("T2", 5, "High formation", formationCount, ["DERIVED", formation !== null ? "SUPPLIED" : "RULE"], "Formation value visible in supplied data or resilient work-layer evidence.", classified.map((d) => d.id), "Counts supplied formation rows, or duties in accountability/relational/judgment layers.", "Formation value does not mean permanent human reservation.")
      : withheldSignal("T2", 5, "High formation", "Formation value has not been established.", allEvidenceIds, "No developmental judgement is invented."),
    delta !== null
      ? makeSignal("T3", 5, "Personal delta", delta, ["USER", "RULE"], "Transition delta calculated from person evidence and future requirements.", allEvidenceIds, "Reads supplied person-transition data.", "Must remain withheld without person evidence.")
      : withheldSignal("T3", 5, "Personal delta", "No person evidence has been supplied for a personalised transition delta.", allEvidenceIds, "Role evidence alone cannot establish an individual's capability gap."),
  ];
  const signalGroups = { 1: labour, 2: orgSignals, 3: intelSignals, 4: haSignals, 5: transitionSignals };
  return {
    evidence,
    interpretations,
    skills,
    duties,
    coverage,
    functions,
    graphs: GRAPH_DEFS.map((g) => ({ ...g, signals: signalGroups[g.id] })),
  };
}

function personEvidenceOf(result) {
  const person = firstDefined(
    result && result.personEvidence,
    result && result.person,
    result && result.candidate,
    result && result.userProfile,
    result && result.profile,
  ) || {};
  const skills = uniq(arr(firstDefined(person.skills, person.capabilities, person.skillEvidence)).map(skillLabel).filter(Boolean));
  const work = arr(firstDefined(person.workHistory, person.experience, person.roles));
  const proofs = arr(firstDefined(person.proofs, person.evidence, person.portfolio));
  return {
    skills,
    work,
    proofs,
    authority: firstDefined(person.authority, person.commitAuthority),
    allocation: firstDefined(person.humanAgentAllocation, person.allocation),
    access: firstDefined(person.intelligenceAccess, person.agentAccess),
    supplied: skills.length > 0 || work.length > 0 || proofs.length > 0,
  };
}

function projectedSignal(signal, projection, patch) {
  return { ...signal, projection, ...patch };
}

function projectUniverse(base, anchor, result) {
  const projection = anchor === "org" ? "Organisation" : anchor === "person" ? "Person" : "Role";
  if (anchor === "role") {
    return {
      ...base,
      projection,
      graphs: base.graphs.map((graph) => ({
        ...graph,
        signals: graph.signals.map((signal) => projectedSignal(signal, projection)),
      })),
    };
  }

  const groups = Object.fromEntries(base.graphs.map((graph) => [graph.id, graph.signals]));
  if (anchor === "org") {
    const names = {
      L1: "Role duties in scope", L2: "Organisation work units", L3: "Capability demand",
      O1: "Operating-model coverage", O2: "Capabilities evidenced", O3: "Commit authority",
      I1: "Information domains", I2: "Agent-actionable objects", I3: "Human-heavy objects",
      H1: "Functions in scope", H2: "Operating allocation", H3: "Role exposure context",
      T1: "Changing work", T2: "Formation demand", T3: "Person delta",
    };
    return {
      ...base,
      projection,
      graphs: base.graphs.map((graph) => ({
        ...graph,
        signals: graph.signals.map((signal) => projectedSignal(signal, projection, {
          name: names[signal.id] || signal.name,
          desc: `${signal.desc} This view reads the claim from the organisation boundary.`,
        })),
      })),
    };
  }

  const person = personEvidenceOf(result);
  const normal = (value) => clean(value).toLowerCase();
  const personSkillSet = new Set(person.skills.map(normal));
  const missingSkills = base.skills.filter((skill) => !personSkillSet.has(normal(skill)));
  const allEvidenceIds = base.evidence.map((e) => e.id);
  const personSkillSignal = person.skills.length
    ? makeSignal("L3", 1, "Person skills evidenced", person.skills.length, ["USER-PROVEN", "DIRECT"], "Skills supplied by the person rather than inferred from the target role.", person.skills.map((_, i) => `PSK${i + 1}`), "Counts only supplied person skill evidence.", "A listed skill is not proof of proficiency without supporting evidence.")
    : withheldSignal("L3", 1, "Person skills evidenced", "No person skill evidence has been supplied.", [], "Role requirements are not silently promoted into personal capability.");
  const authoritySignal = person.authority !== null
    ? makeSignal("O3", 2, "Person authority", person.authority, ["USER-PROVEN", "DIRECT"], "Commit authority supplied in person evidence.", [], "Reads only supplied person authority.", "Title or seniority does not establish authority.")
    : withheldSignal("O3", 2, "Person authority", "No person commit-authority evidence has been supplied.", [], "Authority is never inferred from the target role.");
  const accessSignal = person.access !== null
    ? makeSignal("I2", 3, "Person access", person.access, ["USER-PROVEN", "DIRECT"], "Intelligence or agent access supplied by the person.", [], "Reads only supplied access evidence.", "Access does not establish reliability or permission to act.")
    : withheldSignal("I2", 3, "Person access", "No person intelligence-access evidence has been supplied.", [], "Target-role tools do not prove personal access.");
  const allocationSignal = person.allocation !== null
    ? makeSignal("H2", 4, "Person H / HY / A fit", typeof person.allocation === "string" ? person.allocation : JSON.stringify(person.allocation), ["USER-PROVEN", "PROJECTED"], "Person-level allocation supplied for the current scenario.", [], "Reads only supplied scenario allocation.", "This is not a replacement or employability verdict.")
    : withheldSignal("H2", 4, "Person H / HY / A fit", "No person-level Human / Hybrid / Agent allocation has been supplied.", [], "Role exposure cannot establish individual fit.");
  const deltaSignal = person.skills.length
    ? makeSignal("T3", 5, "Personal skill delta", missingSkills.length, ["USER-PROVEN", "COMPUTED"], "Canonical target-role skills not present in supplied person skill evidence.", missingSkills.map((_, i) => `GAP${i + 1}`), "Case-normalised set difference: target role skills minus supplied person skills.", "Absence from the supplied profile is not proof that the person lacks the skill.")
    : withheldSignal("T3", 5, "Personal skill delta", "No person skill evidence is available for a target-role comparison.", allEvidenceIds, "Role evidence alone cannot establish an individual's capability gap.");
  const personGroups = {
    1: [
      projectedSignal(groups[1][0], projection, { name: "Target role duties", desc: `${groups[1][0].desc} This is target-role context, not personal history.` }),
      projectedSignal(groups[1][1], projection, { name: "Target work units", desc: `${groups[1][1].desc} This is target-role context, not work the person claims to have performed.` }),
      projectedSignal(personSkillSignal, projection),
    ],
    2: [
      projectedSignal(groups[2][0], projection, { name: "Target organisation context" }),
      projectedSignal(groups[2][1], projection, { name: "Capabilities required" }),
      projectedSignal(authoritySignal, projection),
    ],
    3: [
      projectedSignal(groups[3][0], projection, { name: "Intelligence domains required" }),
      projectedSignal(accessSignal, projection),
      projectedSignal(groups[3][2], projection, { name: "Human-heavy requirements" }),
    ],
    4: [
      projectedSignal(groups[4][0], projection, { name: "Functions to perform" }),
      projectedSignal(allocationSignal, projection),
      projectedSignal(groups[4][2], projection, { name: "Role exposure context" }),
    ],
    5: [
      projectedSignal(groups[5][0], projection, { name: "Target change projection" }),
      projectedSignal(groups[5][1], projection, { name: "Formation demand" }),
      projectedSignal(deltaSignal, projection),
    ],
  };
  return {
    ...base,
    projection,
    personEvidence: person,
    graphs: base.graphs.map((graph) => ({ ...graph, signals: personGroups[graph.id] })),
  };
}

function webglAvailable() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch (_) {
    return false;
  }
}
function buttonClass(on) { return on ? "on" : ""; }
function sourceHref(posting, result) {
  return clean((posting && (posting.mcfUrl || posting.url)) || (result && result.postingMeta && result.postingMeta.mcfUrl));
}
function sourceName(source, result, posting) {
  return clean(source || (result && result.postingMeta && result.postingMeta.postingSource) || (posting && posting.source) || "source pending");
}
function roleSubject(anchor, roleTitle, orgName, personName, hasPersonEvidence) {
  if (anchor === "org") {
    return {
      eyebrow: "Organisation universe",
      title: orgName,
      meta: "Organisation centre · role evidence re-projected",
      boundary: "The same evidence is being read from the employer side; missing operating-model facts stay withheld.",
    };
  }
  if (anchor === "person") {
    return {
      eyebrow: "Person universe",
      title: hasPersonEvidence ? personName : "Person evidence not supplied",
      meta: hasPersonEvidence ? "Person centre · USER-PROVEN evidence active" : "Person centre · USER-PROVEN evidence required",
      boundary: hasPersonEvidence ? "Person claims use supplied evidence; target-role values remain clearly labelled as context." : "Role evidence cannot be silently promoted into personal capability evidence.",
    };
  }
  return {
    eyebrow: "Role universe",
    title: roleTitle,
    meta: "Role centre · selected evidence root",
    boundary: "The role source is the root; organisation and person claims remain bounded by supplied evidence.",
  };
}
function graphNames(ids) {
  return arr(ids).map((id) => GRAPH_BY_ID[id] && GRAPH_BY_ID[id].title).filter(Boolean).join(" · ");
}
function DetailMethods({ methods }) {
  return (
    <div className="wu-methods">
      {arr(methods).map((method) => <span key={method} className="wu-method">{method}</span>)}
    </div>
  );
}
function ProvChip({ kind }) {
  const p = PROV_LABEL[kind] || PROV_LABEL.withheld;
  return <span className={`wu-prov ${p.tone}`}>{p.label}</span>;
}

export default function WorkUniverseLanding({
  result, title, employer, source, band, posting, onBack, onEnterStudio, onOpenRoleGraph, onOpenAiMoments, onPrintPackage, onPersonEvidenceChange, onGovernanceDecisionChange,
}) {
  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const [anchor, setAnchor] = useState("role");
  const [mode, setMode] = useState("universe");
  const [organisationMapOpen, setOrganisationMapOpen] = useState(false);
  const [governanceView, setGovernanceView] = useState("ledger");
  const [sourceTab, setSourceTab] = useState("o");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [selectedInterpretation, setSelectedInterpretation] = useState(null);
  const [detail, setDetail] = useState({ kind: "summary" });
  const [tocActive, setTocActive] = useState("overview");
  const [treeOpen, setTreeOpen] = useState({ universe: true, graphs: true, organisation: true });
  const [footer, setFooter] = useState({ label: "Neutral", detail: "five canonical graphs visible" });
  const [geo, setGeo] = useState({ node: 230, nodeSm: 212, anchor: 205 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasWebgl, setHasWebgl] = useState(false);
  const baseData = useMemo(() => buildUniverse(result, title, employer, band, posting), [result, title, employer, band, posting]);
  const data = useMemo(() => projectUniverse(baseData, anchor, result), [baseData, anchor, result]);
  const roleTitle = clean(title || (posting && posting.title) || (result && result.title)) || "Role evidence pending";
  const orgName = clean(employer || (posting && (posting.employer || posting.companyName)) || (result && result.employer) || (result && result.postingMeta && result.postingMeta.employer)) || "Organisation evidence pending";
  const personName = clean(result && firstDefined(result.personName, result.candidateName, result.person && result.person.name, result.candidate && result.candidate.name)) || "Supplied person evidence";
  const sourceLabel = sourceName(source, result, posting);
  const srcHref = sourceHref(posting, result);
  const subject = roleSubject(anchor, roleTitle, orgName, personName, !!(data.personEvidence && data.personEvidence.supplied));
  const allSignals = useMemo(() => data.graphs.flatMap((graph) => graph.signals.map((signal) => ({ graph, signal }))), [data.graphs]);
  const filteredEvidence = data.evidence.filter((e) => sourceFilter === "all" || e.kind === sourceFilter);

  useEffect(() => {
    setHasWebgl(webglAvailable());
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return undefined;
    const fitAvailableViewport = () => {
      const rect = root.getBoundingClientRect();
      const top = Math.max(0, rect.top);
      // The preserved v3.1 shell applies html zoom on wide screens. DOM rects are
      // visual pixels while CSS height is pre-zoom, so measure the live scale
      // instead of assuming 1.0 or hard-coding the shell's current zoom value.
      const visualScale = root.offsetWidth > 0 ? rect.width / root.offsetWidth : 1;
      const cssHeight = (window.innerHeight - top) / Math.max(0.5, visualScale || 1);
      root.style.setProperty("--wu-available-height", `${Math.max(420, Math.floor(cssHeight))}px`);
    };
    fitAvailableViewport();
    window.addEventListener("resize", fitAvailableViewport);
    return () => window.removeEventListener("resize", fitAvailableViewport);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const fit = () => {
      const r = frame.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height - 32);
      const clamp = (min, val, max) => Math.max(min, Math.min(max, val));
      if (w < 480) {
        setGeo({
          node: Math.round(clamp(145, Math.min(w * 0.42, h * 0.24), 162)),
          nodeSm: Math.round(clamp(140, Math.min(w * 0.39, h * 0.23), 154)),
          anchor: Math.round(clamp(142, Math.min(w * 0.4, h * 0.23), 158)),
        });
        return;
      }
      if (w < 700) {
        setGeo({
          node: Math.round(clamp(170, Math.min(w * 0.34, h * 0.3), 220)),
          nodeSm: Math.round(clamp(164, Math.min(w * 0.31, h * 0.28), 205)),
          anchor: Math.round(clamp(160, Math.min(w * 0.29, h * 0.27), 198)),
        });
        return;
      }
      setGeo({
        node: Math.round(clamp(204, Math.min(w * 0.31, h * 0.36), 360)),
        nodeSm: Math.round(clamp(204, Math.min(w * 0.3, h * 0.34), 330)),
        anchor: Math.round(clamp(190, Math.min(w * 0.25, h * 0.3), 305)),
      });
    };
    fit();
    const ro = "ResizeObserver" in window ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(frame);
    window.addEventListener("resize", fit);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  const resetUniverse = () => {
    setMode("universe");
    setOrganisationMapOpen(false);
    setSourceTab("o");
    setSelectedGraph(null);
    setSelectedSignal(null);
    setSelectedEvidence(null);
    setSelectedInterpretation(null);
    setDetail({ kind: "summary" });
    setTocActive("overview");
    setFooter({ label: "Role summary", detail: `${roleTitle} · five canonical graphs visible` });
  };
  const openSourceFromAnchor = () => {
    setMode("source");
    setOrganisationMapOpen(false);
    setSourceTab("o");
    setSelectedGraph(null);
    setSelectedSignal(null);
    setSelectedEvidence(null);
    setSelectedInterpretation(null);
    setDetail({ kind: "anchor" });
    setTocActive("role-anchor");
    setFooter({ label: "Source evidence", detail: "role anchor opened against the left evidence panel" });
  };
  const showGraph = (graphId) => {
    const graph = data.graphs.find((g) => g.id === graphId);
    if (!graph) return;
    setMode("universe");
    setOrganisationMapOpen(false);
    setSelectedGraph(graphId);
    setSelectedSignal(null);
    setSelectedEvidence(null);
    setSelectedInterpretation(null);
    setDetail({ kind: "graph", graph });
    setTocActive(`graph-${graphId}`);
    setFooter({ label: graph.title, detail: "parent Work Universe detail loaded" });
  };
  const showSignal = (graph, signal) => {
    setMode("lineage");
    setOrganisationMapOpen(false);
    setSourceTab("a");
    setSelectedGraph(graph.id);
    setSelectedSignal(signal.id);
    setSelectedEvidence(null);
    setSelectedInterpretation(null);
    setDetail({ kind: "signal", graph, signal });
    setTocActive(`graph-${graph.id}`);
    setFooter({ label: signal.name, detail: `${signal.value} · ${graph.title} · claim detail active` });
  };
  const selectEvidence = (id) => {
    const evidence = data.evidence.find((e) => e.id === id);
    if (!evidence) return;
    setMode("source");
    setOrganisationMapOpen(false);
    setSourceTab("a");
    setSelectedEvidence(id);
    setSelectedSignal(null);
    setSelectedInterpretation(null);
    setSelectedGraph(null);
    setDetail({ kind: "evidence", evidence });
    setTocActive("evidence");
    setFooter({ label: evidence.id, detail: `${evidence.graphs.length} graph projections highlighted` });
  };
  const selectInterpretation = (id) => {
    const interpretation = data.interpretations.find((x) => x.id === id);
    if (!interpretation) return;
    const graphIds = uniqNums(interpretation.src.flatMap((sid) => {
      const e = data.evidence.find((row) => row.id === sid);
      return e ? e.graphs : [];
    }));
    setMode("source");
    setOrganisationMapOpen(false);
    setSourceTab("a");
    setSelectedInterpretation(id);
    setSelectedEvidence(null);
    setSelectedSignal(null);
    setSelectedGraph(null);
    setDetail({ kind: "interpretation", interpretation, graphIds });
    setTocActive("evidence");
    setFooter({ label: interpretation.id, detail: `${interpretation.type} selected in the evidence trace` });
  };
  const openRoleGraph = () => {
    setMode("rolegraph");
    setOrganisationMapOpen(false);
    setTocActive("role-graph");
    setDetail({ kind: "rolegraph" });
    setFooter({ label: "Role Graph", detail: "existing Role Graph workspace requested" });
    if (onOpenRoleGraph) onOpenRoleGraph();
  };
  const showOrganisationMap = () => {
    const graph = data.graphs.find((item) => item.id === 2);
    setAnchor("org");
    setMode("organisation-map");
    setOrganisationMapOpen(true);
    setSelectedGraph(2);
    setSelectedSignal(null);
    setSelectedEvidence(null);
    setSelectedInterpretation(null);
    setDetail({ kind: "organisationMap", graph });
    setTocActive("organisation-map");
    setFooter({ label: "Organisation Map", detail: "functions · boundaries · dependencies · capabilities · authority · process ownership" });
  };
  const showWorkflowMap = () => {
    const graph = data.graphs.find((item) => item.id === 2);
    setMode("workflow-map");
    setOrganisationMapOpen(false);
    setSelectedGraph(2);
    setSelectedSignal(null);
    setSelectedEvidence(null);
    setSelectedInterpretation(null);
    setDetail({ kind: "workflowMap", graph });
    setTocActive("workflow-map");
    setFooter({ label: "Workflow Map", detail: "supplied order · actors · decisions · explicit handoffs" });
  };
  const showValueStreamMap = () => {
    const graph = data.graphs.find((item) => item.id === 2);
    setAnchor("org");
    setMode("value-stream-map");
    setOrganisationMapOpen(false);
    setSelectedGraph(2);
    setSelectedSignal(null);
    setSelectedEvidence(null);
    setSelectedInterpretation(null);
    setDetail({ kind: "valueStreamMap", graph });
    setTocActive("value-stream-map");
    setFooter({ label: "Value Stream Map", detail: "supplied time · waste · handoff · AI leverage" });
  };
  const showGovernanceLedger = (view = "ledger") => {
    setMode("governance-ledger");
    setOrganisationMapOpen(false);
    setGovernanceView(view);
    setSelectedGraph(null);
    setSelectedSignal(null);
    setSelectedEvidence(null);
    setSelectedInterpretation(null);
    setDetail({ kind: view === "disagreements" ? "conflictReview" : "governanceLedger" });
    setTocActive(view === "disagreements" ? "conflict-review" : "governance-ledger");
    setFooter({ label: view === "disagreements" ? "Reviewer disagreement" : "Governance Ledger", detail: "owner · risk · action boundary · evidence · audit" });
  };
  const selectVisual = (visual) => {
    if (visual === "graph") openRoleGraph();
    else if (visual === "org") showOrganisationMap();
    else if (visual === "workflow") showWorkflowMap();
    else if (visual === "stream") showValueStreamMap();
  };
  const openAiMoments = () => {
    setTocActive("ai-moments");
    setFooter({ label: "AI Moments", detail: "organisation evidence → Cards | Neural" });
    if (onOpenAiMoments) onOpenAiMoments();
  };
  const openEvidenceWorkspace = () => {
    const graphId = detail && detail.graph ? detail.graph.id : selectedGraph;
    const evidenceId = (() => {
      if (detail && detail.evidence && detail.evidence.workspaceId) return detail.evidence.workspaceId;
      const signal = detail && detail.signal;
      if (!signal) return null;
      const evidence = data.evidence.find((row) => signal.items.includes(row.id) && row.workspaceId);
      return evidence ? evidence.workspaceId : null;
    })();
    if (graphId === 1 && onOpenRoleGraph) onOpenRoleGraph();
    else if (onEnterStudio) onEnterStudio({ kind: graphId ? "graph" : "evidence", graphId: graphId || null, signalId: selectedSignal, evidenceId });
  };
  const highlightedGraphs = useMemo(() => {
    if (selectedEvidence) {
      const e = data.evidence.find((row) => row.id === selectedEvidence);
      return e ? e.graphs : [];
    }
    if (selectedInterpretation) {
      const i = data.interpretations.find((row) => row.id === selectedInterpretation);
      return uniqNums(arr(i && i.src).flatMap((sid) => {
        const e = data.evidence.find((row) => row.id === sid);
        return e ? e.graphs : [];
      }));
    }
    return selectedGraph ? [selectedGraph] : [];
  }, [data.evidence, data.interpretations, selectedEvidence, selectedGraph, selectedInterpretation]);
  const relatedSignals = selectedEvidence
    ? allSignals.filter(({ signal }) => signal.items.includes(selectedEvidence))
    : selectedInterpretation
      ? allSignals.filter(({ signal }) => signal.items.includes(selectedInterpretation) || arr(data.interpretations.find((i) => i.id === selectedInterpretation)?.src).some((sid) => signal.items.includes(sid)))
      : selectedSignal
        ? allSignals.filter(({ signal }) => signal.id === selectedSignal)
        : [];
  const activeVisual = organisationMapOpen
    ? "org"
    : mode === "workflow-map"
      ? "workflow"
      : mode === "value-stream-map"
        ? "stream"
        : mode === "rolegraph"
          ? "graph"
          : null;

  return (
    <div ref={rootRef} data-testid="work-universe" className={`wu-root ${(organisationMapOpen || mode === "workflow-map" || mode === "value-stream-map" || mode === "governance-ledger") ? "wu-dedicatedMap" : ""} ${organisationMapOpen ? "wu-organisationMap" : ""}`}>
      <style>{`
        .wu-root{box-sizing:border-box;height:var(--wu-available-height,calc(100dvh - 64px));min-height:0;padding:0;overflow:hidden;background:${C.bg};color:${C.ink};font-family:Inter,Arial,sans-serif;line-height:1.35;--bg:${C.bg};--panel:${C.panel};--panel2:${C.panel2};--ink:${C.ink};--muted:${C.muted};--line:${C.line};--line2:${C.line2};--accent:${C.accent};--soft:${C.soft};--shadow:0 1px 3px rgba(16,24,40,.06)}
        .wu-root *{box-sizing:border-box;min-width:0}.wu-root button{font:inherit;color:inherit}
        .wu-appShell{height:100%;min-height:0;overflow:hidden;display:grid;grid-template-rows:48px 42px minmax(0,1fr) 46px;background:var(--bg)}
        .wu-globalNav{height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 18px;background:var(--panel);border-bottom:1px solid var(--line2)}
        .wu-brand{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:900;letter-spacing:.02em}.wu-mark{width:24px;height:24px;border:1px solid var(--line);border-radius:50%;display:grid;place-items:center;color:var(--accent);font-size:11px;font-weight:900}
        .wu-navMeta{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--muted);white-space:nowrap}.wu-pill{display:inline-flex;align-items:center;min-height:24px;border:1px solid var(--line);border-radius:999px;padding:3px 8px;background:var(--panel2);font-size:10px;font-weight:800;color:var(--muted)}
        .wu-secondaryBar{height:42px;display:flex;align-items:center;justify-content:center;gap:4px;padding:0 12px;background:#eee;border-bottom:1px solid var(--line2)}
        .wu-modeTab{height:42px;flex:0 0 auto;border:0;border-bottom:2px solid transparent;background:transparent;padding:0 12px;font-size:12px;cursor:pointer;color:#4d5a5c}.wu-modeTab.on{border-bottom-color:var(--ink);color:var(--ink);font-weight:800}
        .wu-modeTab:focus-visible,.wu-cmdBtn:focus-visible,.wu-tab:focus-visible,.wu-filter:focus-visible,.wu-outlineBtn:focus-visible,.wu-signal:focus-visible,.wu-anchorAction:focus-visible,.wu-graph:focus-visible,.wu-anchorNode:focus-visible,.wu-itemBtn:focus-visible,.wu-evidenceRow:focus-visible,.wu-interpRow:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
        .wu-workbench{min-height:0;overflow:hidden;display:grid;grid-template-columns:clamp(310px,20vw,560px) minmax(560px,1fr) clamp(350px,23vw,620px);border-bottom:1px solid var(--line2)}
        .wu-leftRail,.wu-centrePane,.wu-rightRail{min-height:0;overflow:hidden;background:var(--panel)}.wu-leftRail{border-right:1px solid var(--line2);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto}.wu-centrePane{display:grid;grid-template-rows:38px auto minmax(0,1fr);background:var(--bg)}.wu-rightRail{border-left:1px solid var(--line2);display:grid;grid-template-rows:minmax(240px,32%) minmax(0,68%)}
        .wu-railHead,.wu-centreHead,.wu-rightHead{height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 clamp(16px,1.1vw,26px);border-bottom:1px solid var(--line2);background:var(--panel)}.wu-railHead>div,.wu-centreHead>div,.wu-rightHead>div{min-width:0}.wu-eyebrow{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);font-weight:900;line-height:1}.wu-railTitle{font-size:12px;font-weight:900;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wu-meta{font-size:10px;color:var(--muted)}.wu-anchorSwitch{display:flex;gap:4px;flex:0 0 auto}.wu-anchorSwitch button{min-height:28px;border:1px solid var(--line);border-radius:7px;background:var(--panel);font-size:10px;font-weight:900;padding:0 7px;cursor:pointer}.wu-anchorSwitch button.on{border-color:var(--accent);background:var(--soft);color:var(--accent)}
        .wu-filters{display:flex;flex-wrap:wrap;gap:6px;padding:0 0 10px;border-bottom:1px solid var(--line2);background:var(--panel)}.wu-filter{cursor:pointer;border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:6px 8px;font-size:10px;font-weight:800;min-height:34px}.wu-filter.on{border-color:var(--accent);background:var(--soft);color:var(--accent)}
        .wu-subjectCard{margin:clamp(12px,.9vw,22px) clamp(14px,1.05vw,28px);border:1px solid var(--line2);border-radius:8px;background:var(--panel2);padding:clamp(11px,.85vw,18px) clamp(12px,.95vw,22px)}.wu-subjectName{font-family:Georgia,serif;font-size:15px;font-weight:800;line-height:1.15;margin:3px 0}.wu-subjectStats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.wu-subjectStat{border:1px solid var(--line2);border-radius:7px;background:var(--panel);padding:6px;font-size:9px}.wu-subjectStat b{display:block;font-size:12px}
        .wu-sourceBody{min-height:0;overflow-y:scroll;scrollbar-gutter:stable;padding:clamp(10px,.8vw,18px) clamp(14px,1vw,24px) clamp(16px,1vw,26px)}.wu-evidenceRow,.wu-interpRow{width:100%;border:1px solid var(--line2);border-radius:8px;padding:9px 10px;margin:0 0 7px;background:var(--panel);cursor:pointer;text-align:left;font-size:11px;line-height:1.32}.wu-evidenceRow:hover,.wu-evidenceRow.selected,.wu-interpRow:hover,.wu-interpRow.selected{border-color:var(--accent);background:var(--soft)}
        .wu-sourceBody,.wu-outlineList,.wu-drillBody,.wu-universeFrame{scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.wu-sourceBody::-webkit-scrollbar,.wu-outlineList::-webkit-scrollbar,.wu-drillBody::-webkit-scrollbar,.wu-universeFrame::-webkit-scrollbar{width:9px;height:9px}.wu-sourceBody::-webkit-scrollbar-thumb,.wu-outlineList::-webkit-scrollbar-thumb,.wu-drillBody::-webkit-scrollbar-thumb,.wu-universeFrame::-webkit-scrollbar-thumb{background:#98a8b7;border:2px solid var(--panel);border-radius:999px}
        .wu-srcid{font-size:9px;color:var(--accent);font-weight:900;letter-spacing:.04em}.wu-kind{font-size:9px;color:var(--muted);margin-top:3px}.wu-quote{color:var(--muted);font-style:italic}.wu-sourceLinkOut{display:block;margin:10px clamp(14px,1vw,24px) 12px;color:var(--accent);font-size:11px;text-decoration:none}.wu-empty{border:1px dashed var(--line);border-radius:8px;padding:10px;font-size:11px;color:var(--muted);background:var(--panel2)}
        .wu-universeFrame{position:relative;min-height:0;margin:clamp(10px,.8vw,18px);background-color:var(--panel);background-image:radial-gradient(circle,#d9e1eb 1px,transparent 1px);background-size:18px 18px;border:1px solid var(--line);box-shadow:var(--shadow);overflow:hidden}.wu-universe{--node:${geo.node}px;--node-sm:${geo.nodeSm}px;--anchor:${geo.anchor}px;--node-h:clamp(126px,calc(var(--node)*.62),190px);--anchor-h:clamp(132px,calc(var(--anchor)*.67),178px);--node-pad:clamp(9px,calc(var(--node)*.045),15px);--anchor-pad:clamp(11px,calc(var(--anchor)*.065),17px);position:absolute;inset:32px 0 0;z-index:2}.wu-canvasHead{height:32px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(12px,.8vw,20px);border-bottom:1px solid var(--line2);font-size:11px;color:var(--muted);background:rgba(255,255,255,.94);position:relative;z-index:4}.wu-connectors{position:absolute;inset:32px 0 0;width:100%;height:calc(100% - 32px);pointer-events:none;z-index:1}.wu-connectors path{fill:none;stroke:#6f9be2;stroke-width:1.35;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.wu-connectors path.active{stroke:var(--accent);stroke-width:2.35}.wu-connectors .wu-mobilePath{display:none}.wu-scene{position:absolute;inset:32px 0 0;opacity:.11;pointer-events:none;z-index:0}
        .wu-graph,.wu-anchorNode{position:absolute;border:1.5px solid #cbd7e6;border-radius:13px;background:rgba(255,255,255,.97);z-index:2;display:flex;flex-direction:column;align-items:stretch;justify-content:center;text-align:left;cursor:pointer;transition:width .14s,height .14s,border-color .12s,background-color .12s,box-shadow .12s,opacity .12s;user-select:none;overflow:hidden;box-shadow:0 4px 13px rgba(30,64,175,.07)}.wu-graph::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#8aa9d7}.wu-graph:hover,.wu-anchorNode:hover{border-color:var(--accent);box-shadow:0 0 0 3px rgba(26,86,219,.1),0 7px 18px rgba(30,64,175,.1)}.wu-graph.active,.wu-anchorNode.active{border-color:var(--accent);background:var(--soft);border-width:2px}.wu-graph.active::before{background:var(--accent)}.wu-graph.dim{opacity:.42}.wu-g1,.wu-g2,.wu-g3,.wu-g4,.wu-g5{width:min(28%,420px);height:30%}.wu-g1{left:31%;top:3%}.wu-g2{left:31%;top:50%;transform:translateY(-50%)}.wu-g3{left:31%;bottom:3%}.wu-g4{right:3%;top:12%}.wu-g5{right:3%;bottom:12%}.wu-anchorNode{width:min(24%,330px);height:26%;left:3%;top:50%;transform:translateY(-50%);border-color:var(--accent);background:#eef4ff}
        .wu-nodeInner{padding:var(--node-pad);width:100%;overflow:hidden}.wu-anchorNode .wu-nodeInner{padding:var(--anchor-pad)}.wu-g5 .wu-nodeInner{padding:var(--node-pad)}
        .wu-graphTitle{width:100%;border:0;background:transparent;cursor:pointer;text-align:left;font-size:clamp(10px,calc(var(--node)*.045),13px);font-weight:900;color:var(--accent);letter-spacing:.04em;line-height:1.08;white-space:normal;overflow-wrap:anywhere;hyphens:auto;text-wrap:balance;padding:0 0 0 2px}
        .wu-nodeFlow{font-size:clamp(9px,calc(var(--node)*.038),12px);font-weight:800;margin:3px 0 5px 2px;line-height:1.12;white-space:normal;overflow-wrap:anywhere;hyphens:auto;text-wrap:balance}.wu-anchorType{font-size:clamp(8px,calc(var(--anchor)*.046),10px);font-weight:900;color:var(--accent);letter-spacing:.08em}.wu-anchorName{font-family:Georgia,serif;font-size:clamp(14px,calc(var(--anchor)*.087),22px);font-weight:800;line-height:1.05;margin:5px 0 4px;max-width:100%;white-space:normal;overflow-wrap:anywhere;text-wrap:balance}.wu-anchorSub{font-size:clamp(8px,calc(var(--anchor)*.04),10px);color:var(--muted);line-height:1.18}.wu-anchorActions{display:grid;gap:4px;margin-top:7px}.wu-anchorAction{cursor:pointer;border:1px solid var(--line);border-radius:7px;background:#fff;color:var(--ink);font-size:clamp(8px,calc(var(--anchor)*.04),10px);font-weight:900;line-height:1.08;padding:clamp(5px,calc(var(--anchor)*.032),8px) 7px;white-space:normal;overflow-wrap:anywhere;hyphens:auto}.wu-anchorAction:hover{border-color:var(--accent);background:var(--panel);color:var(--accent)}
        .wu-signal{cursor:pointer;width:100%;min-height:clamp(32px,calc(var(--node)*.155),44px);border:1px solid var(--line);border-radius:8px;background:#fff;padding:clamp(4px,calc(var(--node)*.024),7px) clamp(6px,calc(var(--node)*.032),9px);margin:3px 0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px;text-align:left;align-items:center}.wu-signal:hover,.wu-signal.active{border-color:var(--accent);background:var(--soft)}.wu-signal.withheld{background:#fffbeb;border-style:dashed}.wu-signalLabel{display:block;font-size:clamp(9px,calc(var(--node)*.039),11px);font-weight:800;line-height:1.08;white-space:normal;overflow-wrap:break-word;word-break:normal;hyphens:none}.wu-signalMethod{display:block;font-size:clamp(7px,calc(var(--node)*.03),8px);color:var(--muted);margin-top:1px;line-height:1.05;white-space:normal;overflow-wrap:break-word;word-break:normal;hyphens:none}.wu-signalValue{font-size:clamp(11px,calc(var(--node)*.048),14px);font-weight:900;white-space:nowrap}
        .wu-outlinePane{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);border-bottom:1px solid var(--line2)}.wu-outlineList{min-height:0;overflow-y:scroll;scrollbar-gutter:stable;padding:9px clamp(12px,.9vw,20px) 14px;scroll-behavior:smooth}.wu-tree{list-style:none;margin:0;padding:0;font-size:11px}.wu-tree ul{list-style:none;margin:0 0 0 12px;padding:0 0 0 12px;border-left:1px solid #cbd5df}.wu-tree li{position:relative;margin:1px 0}.wu-tree ul>li::before{content:"";position:absolute;left:-12px;top:17px;width:10px;border-top:1px solid #cbd5df}.wu-treeRow{display:grid;grid-template-columns:22px minmax(0,1fr);align-items:center;min-height:34px;border-radius:7px}.wu-treeToggle{width:22px;height:28px;border:0;background:transparent;color:#657483;cursor:pointer;font-size:12px;padding:0}.wu-treeToggle.placeholder{pointer-events:none;color:#9aa7b4;font-size:10px}.wu-outlineBtn{width:100%;min-height:32px;border:0;border-radius:6px;background:transparent;color:#596878;display:flex;align-items:center;gap:7px;padding:6px 8px;margin:0;text-align:left;font-size:11px;line-height:1.3;cursor:pointer;transition:color .14s,background-color .14s}.wu-outlineBtn::before{content:"▧";font-size:10px;color:#8b99a8}.wu-outlineBtn.folder::before{content:"▣";color:#60758b}.wu-outlineBtn:hover{color:var(--ink);background:#f2f5f8}.wu-outlineBtn.on{color:var(--accent);font-weight:900;background:var(--soft);box-shadow:inset 3px 0 0 var(--accent)}.wu-treeRoute{margin:6px 0 2px 22px;padding:7px 9px;border:1px solid var(--line2);border-radius:7px;background:#f7f9fb;color:var(--muted);font-size:9px;line-height:1.35}
        .wu-drillPane{min-height:0;display:grid;grid-template-rows:38px minmax(0,1fr)}.wu-drillBody{min-height:0;overflow-y:scroll;scrollbar-gutter:stable;padding:clamp(12px,.85vw,20px) clamp(14px,1vw,24px) clamp(16px,1vw,26px);scroll-behavior:smooth}.wu-summaryBlock{padding-bottom:10px}.wu-detailBlock{border-top:1px solid var(--line2);margin-top:10px;padding-top:10px}.wu-detailBlock.empty{display:none}.wu-summaryGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.wu-summaryMetric{border:1px solid var(--line2);border-radius:8px;background:var(--panel2);padding:8px;font-size:10px}.wu-summaryMetric b{display:block;font-size:15px;color:var(--ink)}.wu-detailTitle{font-family:Georgia,serif;font-size:19px;font-weight:800;margin:2px 0}.wu-big{font-size:24px;font-weight:900}.wu-method{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:2px 6px;font-size:8px;font-weight:900;margin:2px 3px 2px 0}.wu-desc{font-size:11px;color:var(--muted);line-height:1.5}.wu-item,.wu-itemBtn{background:var(--soft);border-radius:7px;padding:7px 8px;margin:6px 0;font-size:10px}.wu-itemBtn{width:100%;border:1px solid transparent;text-align:left;cursor:pointer}.wu-itemBtn:hover{border-color:var(--accent)}.wu-itemGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.wu-prov{display:inline-flex;align-items:center;border:1px solid currentColor;border-radius:999px;padding:2px 7px;font-size:9px;font-weight:900;margin:2px 4px 2px 0}.wu-prov.mcf{color:#0f766e;background:#ecfeff}.wu-prov.computed{color:#1e40af;background:#eef2ff}.wu-prov.derived{color:#b45309;background:#fffbeb}.wu-prov.withheld{color:#64748b;background:#f1f5f9}
        .wu-footerBar{height:46px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px;background:var(--panel);border-top:1px solid var(--line2);font-size:11px}.wu-cmdGroup,.wu-stateGroup{display:flex;align-items:center;gap:6px;min-width:0}.wu-cmdBtn{min-height:38px;border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:0 10px;font-size:10px;font-weight:900;cursor:pointer}.wu-cmdBtn:hover{border-color:var(--accent);color:var(--accent);background:var(--soft)}.wu-stateText{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted)}.wu-stateText b{color:var(--ink)}
        @media(min-width:1800px){.wu-rightRail{grid-template-rows:minmax(280px,30%) minmax(0,70%)}.wu-subjectName{font-size:17px}.wu-detailTitle{font-size:21px}.wu-summaryGrid{grid-template-columns:repeat(3,1fr)}}
        .wu-root.wu-organisationMap .wu-workbench{grid-template-columns:minmax(0,1fr)}.wu-organisationMap .wu-leftRail,.wu-organisationMap .wu-rightRail{display:none}.wu-organisationMap .wu-centrePane{width:100%;min-width:0}
        @media(max-width:1500px){.wu-nodeInner{padding:8px}.wu-g5 .wu-nodeInner{padding:8px}.wu-graphTitle{font-size:clamp(8.5px,calc(var(--node)*.038),10px);line-height:1.03}.wu-nodeFlow{font-size:clamp(7px,calc(var(--node)*.03),8.5px);line-height:1.04;margin:2px 0 3px}.wu-signal{min-height:24px;padding:2px 6px;margin:2px 0;border-radius:7px;gap:4px}.wu-signalLabel{font-size:7.5px;line-height:1.02}.wu-signalMethod{font-size:6px;line-height:1}.wu-signalValue{font-size:9.5px}.wu-anchorName{font-size:clamp(15px,calc(var(--anchor)*.078),19px)}.wu-anchorSub{font-size:8px}.wu-anchorActions{gap:5px}.wu-anchorAction{font-size:clamp(9px,calc(var(--anchor)*.04),10px);padding:5px 7px}}
        @media(max-width:1280px){.wu-workbench{grid-template-columns:270px minmax(520px,1fr) 310px}.wu-nodeInner{padding:8px}.wu-g5 .wu-nodeInner{padding:8px}.wu-graphTitle{font-size:clamp(8px,calc(var(--node)*.04),10px);line-height:1.02}.wu-nodeFlow{font-size:clamp(7px,calc(var(--node)*.033),9px);line-height:1.04;margin:2px 0 3px}.wu-signal{min-height:20px;padding:2px 5px;margin:1px 0;border-radius:6px;gap:3px}.wu-signalLabel{font-size:8px;line-height:1}.wu-signalMethod{display:none}.wu-signalValue{font-size:10px}.wu-anchorType{font-size:8px}.wu-anchorName{font-size:clamp(13px,calc(var(--anchor)*.076),17px);line-height:1.02;margin:2px auto}.wu-anchorSub{display:none}.wu-anchorActions{gap:3px;margin-top:4px}.wu-anchorAction{font-size:8px;padding:3px 5px}}
        @media(max-width:1100px){.wu-root{height:auto;min-height:100svh;overflow:visible}.wu-appShell{height:auto;min-height:100svh;overflow:visible;grid-template-rows:48px 42px auto auto}.wu-workbench{overflow:visible;grid-template-columns:1fr;grid-template-rows:auto minmax(620px,72vh) auto}.wu-leftRail{min-height:360px;border-right:0;border-bottom:1px solid var(--line2)}.wu-sourceBody{max-height:42vh}.wu-rightRail{border-left:0;border-top:1px solid var(--line2);grid-template-rows:300px 380px}.wu-footerBar{position:static}.wu-itemGrid{grid-template-columns:1fr}.wu-scene{display:none}.wu-root.wu-dedicatedMap{height:var(--wu-available-height,100svh);min-height:0;overflow:hidden}.wu-dedicatedMap .wu-appShell{height:100%;min-height:0;overflow:hidden;grid-template-rows:48px 42px minmax(0,1fr) auto}.wu-dedicatedMap .wu-workbench{min-height:0;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr)}.wu-dedicatedMap .wu-leftRail,.wu-dedicatedMap .wu-rightRail{display:none}.wu-dedicatedMap .wu-centrePane{height:auto;min-height:0;overflow:hidden}.wu-dedicatedMap .wu-universeFrame{min-height:0}}
        @media(max-width:560px){.wu-globalNav{padding:0 10px}.wu-secondaryBar{justify-content:flex-start;overflow:auto}.wu-modeTab{white-space:nowrap}.wu-workbench{grid-template-rows:auto minmax(1180px,1180px) auto}.wu-universe{--node-h:14%;--anchor-h:14%}.wu-graph,.wu-anchorNode{left:50px!important;right:14px!important;width:auto!important;height:14%!important;transform:none!important}.wu-anchorNode{top:2%}.wu-g1{top:18%}.wu-g2{top:34%}.wu-g3{top:50%;bottom:auto}.wu-g4{top:66%;bottom:auto}.wu-g5{top:82%;bottom:auto}.wu-connectors .wu-desktopPath{display:none}.wu-connectors .wu-mobilePath{display:block}.wu-anchorAction{font-size:7.5px;white-space:nowrap;padding:4px 5px}.wu-footerBar{position:static;align-items:stretch;flex-direction:column;height:auto;min-height:62px;padding:6px 10px}.wu-cmdGroup{overflow:auto}.wu-stateGroup{width:100%}.wu-navMeta{display:none}.wu-subjectStats,.wu-summaryGrid{grid-template-columns:1fr}}
        @media(prefers-reduced-motion:reduce){.wu-graph,.wu-anchorNode,.wu-outlineBtn{transition:none}}
      `}</style>
      <div className="wu-appShell">
        <header className="wu-globalNav">
          <div className="wu-brand"><div className="wu-mark">V3</div><div>Role Reality Fixture</div></div>
          <div className="wu-navMeta"><span>{orgName}</span><span className="wu-pill">v3.1 Step 3</span></div>
        </header>
        <div className="wu-secondaryBar" role="tablist" aria-label="Work modes">
          <button className={`wu-modeTab ${buttonClass(mode === "universe")}`} type="button" onClick={resetUniverse}>Work Universe</button>
          <button className={`wu-modeTab ${buttonClass(mode === "rolegraph")}`} type="button" onClick={openRoleGraph}>Role Graph</button>
          <button className={`wu-modeTab ${buttonClass(mode === "lineage")}`} type="button" onClick={() => { setMode("lineage"); setSourceTab("a"); setDetail({ kind: "lineage" }); setTocActive("evidence"); setFooter({ label: "Evidence lineage", detail: "select a source row or statistic to inspect lineage" }); }}>Evidence Lineage</button>
        </div>
        <main className="wu-workbench">
          <aside className="wu-leftRail" aria-label="Job advertisement and source evidence" data-testid="wu-source-panel">
            <div className="wu-railHead">
              <div><div className="wu-eyebrow">Job ad / evidence</div><div className="wu-railTitle">{roleTitle}</div></div>
              <div className="wu-meta">{orgName}</div>
            </div>
            <div className="wu-leftIntro">
              <section className="wu-subjectCard" aria-label="Current projection">
                <div className="wu-eyebrow">{subject.eyebrow}</div>
                <div className="wu-subjectName">{subject.title}</div>
                <div className="wu-meta">{subject.meta}</div>
                <div className="wu-subjectStats">
                  <div className="wu-subjectStat"><b>{data.duties.length || "—"}</b>Duties</div>
                  <div className="wu-subjectStat"><b>{data.interpretations.filter((x) => x.type === "Work Unit").length || "—"}</b>Work units</div>
                  <div className="wu-subjectStat"><b>{allSignals.length}</b>Signals</div>
                </div>
              </section>
              {anchor === "person" && <PersonEvidenceIngress targetSkills={baseData.skills} value={result?.personEvidence} onChange={onPersonEvidenceChange} />}
            </div>
            <section className="wu-sourceBody">
              <div>
                <div className="wu-filters" aria-label="Source evidence filters">
                  {[["all", "ALL"], ["duty", "DUTIES"], ["req", "REQUIREMENTS"]].map(([key, label]) => (
                    <button key={key} className={`wu-filter ${buttonClass(sourceFilter === key)}`} type="button" onClick={() => setSourceFilter(key)}>{label}</button>
                  ))}
                </div>
                {filteredEvidence.length ? filteredEvidence.map((e) => (
                  <button key={e.id} data-testid="wu-evidence-row" className={`wu-evidenceRow ${selectedEvidence === e.id ? "selected" : ""}`} type="button" onClick={() => selectEvidence(e.id)}>
                    <div className="wu-srcid">{e.id} · {e.kind.toUpperCase()}</div>
                    <div>{e.text} {e.quote && <span className="wu-quote">{e.quote}</span>}</div>
                    <div className="wu-kind">supports: {graphNames(e.graphs)}</div>
                  </button>
                )) : <div className="wu-empty">No source rows are available yet. Connect a role payload or job advertisement.</div>}
              </div>
            </section>
            {srcHref ? <a className="wu-sourceLinkOut" href={srcHref} target="_blank" rel="noreferrer">Open original advertisement ↗</a> : <div className="wu-sourceLinkOut">Original source link withheld</div>}
          </aside>

          <section className="wu-centrePane" aria-label="Work Universe">
            <div className="wu-centreHead">
              <div><span className="wu-eyebrow">Centre</span> <span className="wu-railTitle">{mode === "governance-ledger" ? "Governance Ledger" : mode === "workflow-map" ? "Workflow Map" : mode === "value-stream-map" ? "Value Stream Map" : organisationMapOpen ? "Organisation Map" : "Graphify Work Universe"}</span></div>
              <div className="wu-anchorSwitch" role="group" aria-label="Projection centre">
                {[["role", "Role"], ["org", "Organisation"], ["person", "Person"]].map(([key, label]) => (
                  <button
                    key={key}
                    data-testid={`wu-anchor-${key}`}
                    type="button"
                    className={anchor === key ? "on" : ""}
                    onClick={() => {
                      setAnchor(key);
                      setMode("universe");
                      setOrganisationMapOpen(false);
                      setSelectedGraph(null);
                      setSelectedSignal(null);
                      setSelectedEvidence(null);
                      setSelectedInterpretation(null);
                      setDetail({ kind: "summary" });
                      setTocActive("overview");
                      setFooter({ label: `${label} centre`, detail: "same evidence universe re-projected with anchor-specific claim boundaries" });
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <OccupationVisualSelector
              result={result}
              activeVisual={activeVisual}
              onSelect={selectVisual}
              onEvidenceSelect={selectEvidence}
            />
            <div className="wu-universeFrame" ref={frameRef}>
              {mode === "governance-ledger" ? (
                <GovernanceLedger
                  key={governanceView}
                  result={result}
                  initialView={governanceView}
                  onBack={resetUniverse}
                  onEvidenceSelect={selectEvidence}
                  onDecisionChange={onGovernanceDecisionChange}
                />
              ) : organisationMapOpen ? (
                <OrganisationMap
                  result={result}
                  roleTitle={roleTitle}
                  organisationName={orgName}
                  onBack={() => showGraph(2)}
                  onEvidenceSelect={selectEvidence}
                  onOpenCompanyEvidence={openEvidenceWorkspace}
                  onOpenAiMoments={openAiMoments}
                />
              ) : mode === "workflow-map" ? (
                <WorkflowMap
                  result={result}
                  roleTitle={roleTitle}
                  organisationName={orgName}
                  onBack={() => showGraph(2)}
                  onEvidenceSelect={selectEvidence}
                />
              ) : mode === "value-stream-map" ? (
                <ValueStreamMap
                  result={result}
                  roleTitle={roleTitle}
                  organisationName={orgName}
                  onBack={() => showGraph(2)}
                  onEvidenceSelect={selectEvidence}
                />
              ) : (
                <>
                  <div className="wu-canvasHead">
                    <span>Level 1 · canonical five-graph projection</span>
                    <span>{highlightedGraphs.length ? `${highlightedGraphs.length} graph${highlightedGraphs.length === 1 ? "" : "s"} highlighted` : "neutral"}</span>
                  </div>
                  {hasWebgl && !reducedMotion && (
                    <div className="wu-scene">
                      <Suspense fallback={null}>
                        <WorkUniverseScene selectedGraph={selectedGraph} reducedMotion={reducedMotion} />
                      </Suspense>
                    </div>
                  )}
                  <svg className="wu-connectors" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs><marker id="wu-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="none" stroke="#7d9bc7" strokeWidth="1" /></marker></defs>
                    {[
                      [1, "M 26 50 H 28 Q 29 50 29 48 V 15 Q 29 14 31 14"],
                      [2, "M 26 50 H 31"],
                      [3, "M 26 50 H 28 Q 29 50 29 52 V 86 Q 29 87 31 87"],
                      [4, "M 26 50 H 48 Q 54 50 58 43 L 65 32 Q 67 29 70 29"],
                      [5, "M 26 50 H 48 Q 54 50 58 57 L 65 68 Q 67 71 70 71"],
                    ].map(([id, d]) => <path key={`desktop-${id}`} className={`wu-desktopPath ${highlightedGraphs.includes(id) ? "active" : ""}`} d={d} markerEnd="url(#wu-arrow)" />)}
                    {[
                      [1, "M 13 9 H 8 Q 6 9 6 11 V 25 Q 6 25 8 25 H 13"],
                      [2, "M 13 9 H 8 Q 6 9 6 11 V 41 Q 6 41 8 41 H 13"],
                      [3, "M 13 9 H 8 Q 6 9 6 11 V 57 Q 6 57 8 57 H 13"],
                      [4, "M 13 9 H 8 Q 6 9 6 11 V 73 Q 6 73 8 73 H 13"],
                      [5, "M 13 9 H 8 Q 6 9 6 11 V 89 Q 6 89 8 89 H 13"],
                    ].map(([id, d]) => <path key={`mobile-${id}`} className={`wu-mobilePath ${highlightedGraphs.includes(id) ? "active" : ""}`} d={d} markerEnd="url(#wu-arrow)" />)}
                  </svg>
                  <div className="wu-universe">
                <div className={`wu-anchorNode ${detail.kind === "anchor" ? "active" : ""}`} data-testid="wu-source-anchor" role="button" tabIndex={0} aria-label={`Role Anchor for ${roleTitle}`} onClick={openSourceFromAnchor} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSourceFromAnchor(); } }}>
                  <div className="wu-nodeInner">
                    <div className="wu-anchorType">{anchor.toUpperCase()} ANCHOR</div>
                    <div className="wu-anchorName">{anchor === "role" ? roleTitle : anchor === "org" ? orgName : subject.title}</div>
                    <div className="wu-anchorSub">{anchor === "role" ? `${sourceLabel} · selected role evidence` : anchor === "org" ? "same universe · organisation-centred" : data.personEvidence?.supplied ? "USER-PROVEN evidence active" : "USER-PROVEN evidence required"}</div>
                    <div className="wu-anchorActions">
                      <button className="wu-anchorAction" type="button" onClick={(e) => { e.stopPropagation(); openSourceFromAnchor(); }}>Source evidence</button>
                      <button data-testid="wu-anchor-role-graph" className="wu-anchorAction" type="button" onClick={(e) => { e.stopPropagation(); openRoleGraph(); }}>Role Graph →</button>
                    </div>
                  </div>
                </div>
                {data.graphs.map((graph) => {
                  const highlighted = highlightedGraphs.includes(graph.id);
                  const dim = highlightedGraphs.length > 0 && !highlighted;
                  return (
                    <div key={graph.id} data-testid={`graph-${graph.key}`} className={`wu-graph wu-g${graph.id} ${highlighted ? "active" : ""} ${dim ? "dim" : ""}`} role="button" tabIndex={0} onClick={(e) => { if (!e.target.closest(".wu-signal")) showGraph(graph.id); }} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.target.closest(".wu-signal")) { e.preventDefault(); showGraph(graph.id); } }}>
                      <div className="wu-nodeInner">
                        <button type="button" className="wu-graphTitle" onClick={() => showGraph(graph.id)} aria-label={`Select ${graph.title}`}>{graph.id} · {graph.name}</button>
                        <div className="wu-nodeFlow">{graph.flow}</div>
                        {graph.signals.map((signal) => (
                          <button key={signal.id} type="button" className={`wu-signal ${signal.status === "withheld" ? "withheld" : ""} ${selectedSignal === signal.id ? "active" : ""}`} data-withheld={signal.status === "withheld" ? "true" : "false"} onClick={(e) => { e.stopPropagation(); showSignal(graph, signal); }}>
                            <span><span className="wu-signalLabel">{signal.name}</span><span className="wu-signalMethod">{signal.methods[0]}</span></span>
                            <span className="wu-signalValue">{signal.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                  </div>
                </>
              )}
            </div>
          </section>

          <aside className="wu-rightRail" aria-label="Work Universe contents and drilldown">
            <section className="wu-outlinePane">
              <div className="wu-rightHead"><div><div className="wu-eyebrow">Contents</div><div className="wu-railTitle">Role Work Universe</div></div><div className="wu-meta">live</div></div>
              <div className="wu-outlineList" data-testid="wu-contents-tree">
                <nav aria-label="Work Universe site tree">
                  <ul className="wu-tree" role="tree">
                    <li role="treeitem" aria-expanded={treeOpen.universe}>
                      <div className="wu-treeRow">
                        <button className="wu-treeToggle" type="button" aria-label={`${treeOpen.universe ? "Collapse" : "Expand"} Work Universe`} onClick={() => setTreeOpen((open) => ({ ...open, universe: !open.universe }))}>{treeOpen.universe ? "▾" : "▸"}</button>
                        <button type="button" className={`wu-outlineBtn folder ${tocActive === "overview" ? "on" : ""}`} onClick={resetUniverse}>Work Universe</button>
                      </div>
                      {treeOpen.universe && (
                        <ul role="group">
                          <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button type="button" className={`wu-outlineBtn ${tocActive === "role-anchor" ? "on" : ""}`} onClick={openSourceFromAnchor}>Role Anchor</button></div></li>
                          <li role="treeitem" aria-expanded={treeOpen.graphs}>
                            <div className="wu-treeRow">
                              <button className="wu-treeToggle" type="button" aria-label={`${treeOpen.graphs ? "Collapse" : "Expand"} Work Graphs`} onClick={() => setTreeOpen((open) => ({ ...open, graphs: !open.graphs }))}>{treeOpen.graphs ? "▾" : "▸"}</button>
                              <button type="button" className="wu-outlineBtn folder" onClick={() => setTreeOpen((open) => ({ ...open, graphs: true }))}>Work Graphs</button>
                            </div>
                            {treeOpen.graphs && (
                              <ul role="group">
                                {GRAPH_DEFS.map((graph) => (
                                  <li key={graph.id} role="treeitem" aria-expanded={graph.id === 2 ? treeOpen.organisation : undefined}>
                                    <div className="wu-treeRow">
                                      {graph.id === 2 ? <button className="wu-treeToggle" type="button" aria-label={`${treeOpen.organisation ? "Collapse" : "Expand"} Organisation Work Graph`} onClick={() => setTreeOpen((open) => ({ ...open, organisation: !open.organisation }))}>{treeOpen.organisation ? "▾" : "▸"}</button> : <span className="wu-treeToggle placeholder">•</span>}
                                      <button type="button" className={`wu-outlineBtn ${tocActive === `graph-${graph.id}` ? "on" : ""}`} onClick={() => showGraph(graph.id)}>{graph.title}</button>
                                    </div>
                                    {graph.id === 2 && treeOpen.organisation && (
                                      <ul role="group">
                                        <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button type="button" className={`wu-outlineBtn ${tocActive === "organisation-map" ? "on" : ""}`} onClick={showOrganisationMap}>Organisation Map</button></div></li>
                                        <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button data-testid="tree-workflow-map" type="button" className={`wu-outlineBtn ${tocActive === "workflow-map" ? "on" : ""}`} onClick={showWorkflowMap}>Workflow Map</button></div></li>
                                        <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button data-testid="tree-value-stream-map" type="button" className={`wu-outlineBtn ${tocActive === "value-stream-map" ? "on" : ""}`} onClick={showValueStreamMap}>Value Stream Map</button></div></li>
                                        <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button data-testid="tree-ai-moments" type="button" className={`wu-outlineBtn ${tocActive === "ai-moments" ? "on" : ""}`} onClick={openAiMoments}>AI Moments · Cards | Neural</button></div></li>
                                      </ul>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                          <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button type="button" className={`wu-outlineBtn ${tocActive === "role-graph" ? "on" : ""}`} onClick={openRoleGraph}>Open Role Graph</button></div></li>
                          <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button type="button" className={`wu-outlineBtn ${tocActive === "evidence" ? "on" : ""}`} onClick={() => { setMode("lineage"); setSourceTab("a"); setDetail({ kind: "lineage" }); setTocActive("evidence"); }}>Evidence lineage</button></div></li>
                          <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button data-testid="tree-governance-ledger" type="button" className={`wu-outlineBtn ${tocActive === "governance-ledger" ? "on" : ""}`} onClick={() => showGovernanceLedger("ledger")}>Governance Ledger</button></div></li>
                          <li role="treeitem"><div className="wu-treeRow"><span className="wu-treeToggle placeholder">•</span><button data-testid="tree-conflict-review" type="button" className={`wu-outlineBtn ${tocActive === "conflict-review" ? "on" : ""}`} onClick={() => showGovernanceLedger("disagreements")}>Reviewer disagreement</button></div></li>
                        </ul>
                      )}
                    </li>
                  </ul>
                  <div className="wu-treeRoute">Route · Organisation Work Graph → Organisation Map → AI Moments → Cards | Neural</div>
                </nav>
              </div>
            </section>
            <section className="wu-drillPane" data-testid="wu-detail" aria-live="polite">
              <div className="wu-rightHead"><div><div className="wu-eyebrow">Summary / detail</div><div className="wu-railTitle">{anchor === "role" ? "Role view" : anchor === "org" ? "Organisation view" : "Person view"}</div></div><div className="wu-meta">{detail.kind}</div></div>
              <div className="wu-drillBody">
                <section className="wu-summaryBlock">
                  <div className="wu-srcid">{anchor.toUpperCase()} SUMMARY</div>
                  <div className="wu-detailTitle">{subject.title}</div>
                  <p className="wu-desc">{anchor === "role" ? "The visible Level-1 read is a role anchor projected across five canonical graphs." : anchor === "org" ? `The same evidence is re-projected around ${orgName}; employer facts remain limited to supplied source data.` : "The person projection is intentionally gated until a CV, proof ledger or user-proven work history is supplied."}</p>
                  <div className="wu-summaryGrid">
                    <div className="wu-summaryMetric"><b>{data.duties.length || "WITHHELD"}</b>source duties</div>
                    <div className="wu-summaryMetric"><b>{data.skills.length || "WITHHELD"}</b>canonical skills</div>
                    <div className="wu-summaryMetric"><b>{data.coverage.length ? `${Math.round((data.coverage.length / 12) * 100)}%` : "WITHHELD"}</b>OWG evidence coverage</div>
                    <div className="wu-summaryMetric"><b>{data.functions.length || "WITHHELD"}</b>execution functions</div>
                  </div>
                  <p className="wu-desc"><b>Boundary:</b> {subject.boundary}</p>
                </section>
                <section className={`wu-detailBlock ${detail.kind === "summary" ? "empty" : ""}`}>
                  {detail.kind === "anchor" && (
                    <>
                      <div className="wu-srcid">ROLE ANCHOR</div>
                      <div className="wu-detailTitle">Source evidence</div>
                      <DetailMethods methods={["DIRECT"]} />
                      <p className="wu-desc">{roleTitle} is the active evidence root. The left panel keeps the supplied job-ad rows visible while interpretations and projections remain traceable in the detail and evidence workspaces.</p>
                      <div className="wu-itemGrid"><div className="wu-item"><b>Source</b><br />{sourceLabel}</div><div className="wu-item"><b>Evidence rows</b><br />{data.evidence.length || "withheld"}</div></div>
                    </>
                  )}
                  {detail.kind === "graph" && detail.graph && (
                    <>
                      <div className="wu-srcid">PARENT · WORK UNIVERSE</div>
                      <div className="wu-detailTitle">{detail.graph.title}</div>
                      <p className="wu-desc">{detail.graph.flow}</p>
                      <div className="wu-itemGrid">{detail.graph.signals.map((signal) => <button key={signal.id} type="button" className="wu-itemBtn" onClick={() => showSignal(detail.graph, signal)}><b>{signal.name}</b><br />{signal.value} · {signal.methods.join(" / ")}</button>)}</div>
                      {detail.graph.id === 2 && <button data-testid="open-organisation-map" type="button" className="wu-cmdBtn" onClick={showOrganisationMap}>Open Organisation Map →</button>}
                      {detail.graph.id === 2 && <button data-testid="open-workflow-map" type="button" className="wu-cmdBtn" onClick={showWorkflowMap}>Open Workflow Map →</button>}
                      {detail.graph.id === 2 && <button data-testid="open-value-stream-map" type="button" className="wu-cmdBtn" onClick={showValueStreamMap}>Open Value Stream Map →</button>}
                    </>
                  )}
                  {detail.kind === "signal" && detail.signal && (
                    <>
                      <div className="wu-srcid">GRAPH {detail.graph.id} · SIGNAL CLAIM {detail.signal.id}</div>
                      <div className="wu-detailTitle">{detail.signal.name}</div>
                      <div className="wu-big">{detail.signal.value}</div>
                      <ProvChip kind={detail.signal.provenance} />
                      <DetailMethods methods={detail.signal.methods} />
                      <p className="wu-desc"><b>Projection:</b> {detail.signal.projection || data.projection}</p>
                      <p className="wu-desc">{detail.signal.desc}</p>
                      <div className="wu-srcid">Constituents / trace</div>
                      {detail.signal.items.length ? detail.signal.items.map((item) => <div key={item} className="wu-item">{item}</div>) : <div className="wu-empty">No constituent rows are available.</div>}
                      <p className="wu-desc"><b>Production:</b> {detail.signal.production}</p>
                      <p className="wu-desc"><b>Boundary:</b> {detail.signal.boundary}</p>
                      {detail.graph.id === 2 && <button data-testid="open-organisation-map" type="button" className="wu-cmdBtn" onClick={showOrganisationMap}>Open Organisation Map →</button>}
                      {detail.graph.id === 2 && <button data-testid="open-workflow-map" type="button" className="wu-cmdBtn" onClick={showWorkflowMap}>Open Workflow Map →</button>}
                      {detail.graph.id === 2 && <button data-testid="open-value-stream-map" type="button" className="wu-cmdBtn" onClick={showValueStreamMap}>Open Value Stream Map →</button>}
                      <button data-testid={detail.graph.id === 1 ? "open-role-graph" : "open-graph-workspace"} type="button" className="wu-cmdBtn" onClick={openEvidenceWorkspace}>{detail.graph.id === 1 ? "Open Role Graph" : "Open evidence workspace"} →</button>
                    </>
                  )}
                  {detail.kind === "organisationMap" && (
                    <>
                      <div className="wu-srcid">ORGANISATION WORK GRAPH · VISUAL</div>
                      <div className="wu-detailTitle">Organisation Map</div>
                      <DetailMethods methods={["SUPPLIED", "EVIDENCE-GATED"]} />
                      <p className="wu-desc">The centre map separates functions, reporting boundaries, dependencies, capabilities, authority and process ownership. Missing dimensions remain visibly withheld.</p>
                      <p className="wu-desc"><b>Boundary:</b> No organisation maturity, hierarchy, staffing condition or process quality is inferred from the posting.</p>
                      <button data-testid="open-ai-moments" type="button" className="wu-cmdBtn" onClick={openAiMoments}>Open AI Moments · Cards | Neural →</button>
                      <button data-testid="open-graph-workspace" type="button" className="wu-cmdBtn" onClick={openEvidenceWorkspace}>Open company evidence workspace →</button>
                    </>
                  )}
                  {detail.kind === "workflowMap" && (
                    <>
                      <div className="wu-srcid">WORKFLOW · DEDICATED VISUAL</div>
                      <div className="wu-detailTitle">Workflow Map</div>
                      <DetailMethods methods={["SUPPLIED", "EVIDENCE-GATED"]} />
                      <p className="wu-desc">The centre map shows supplied process stages, actors, decisions and explicit handoffs in sequence. It does not convert duty order into workflow order.</p>
                      <p className="wu-desc"><b>Boundary:</b> Missing workflow stages, owners and connections remain withheld; process quality and organisation maturity are not inferred.</p>
                      <button data-testid="open-graph-workspace" type="button" className="wu-cmdBtn" onClick={openEvidenceWorkspace}>Open company evidence workspace →</button>
                    </>
                  )}
                  {detail.kind === "valueStreamMap" && (
                    <>
                      <div className="wu-srcid">ORGANISATION WORK GRAPH · BPR VISUAL</div>
                      <div className="wu-detailTitle">Value Stream Map</div>
                      <DetailMethods methods={["SUPPLIED", "EVIDENCE-GATED", "HYPOTHESIS"]} />
                      <p className="wu-desc">The centre map separates explicitly supplied value-add work from waiting, handoffs, waste and rework, with timing and AI-leverage labels only where provided.</p>
                      <p className="wu-desc"><b>Boundary:</b> No timing, waste, savings, layoffs, automation potential, process quality or organisation maturity is inferred from the posting.</p>
                      <button data-testid="open-graph-workspace" type="button" className="wu-cmdBtn" onClick={openEvidenceWorkspace}>Open company evidence workspace →</button>
                    </>
                  )}
                  {detail.kind === "evidence" && detail.evidence && (
                    <>
                      <div className="wu-srcid">{detail.evidence.id} · {detail.evidence.kind.toUpperCase()}</div>
                      <div className="wu-detailTitle">Evidence → Work Universe</div>
                      <p className="wu-desc">{detail.evidence.text}</p>
                      <div className="wu-item"><b>Supports graphs</b><br />{graphNames(detail.evidence.graphs)}</div>
                      {relatedSignals.length ? relatedSignals.map(({ graph, signal }) => <button key={`${graph.id}-${signal.id}`} type="button" className="wu-itemBtn" onClick={() => showSignal(graph, signal)}><b>{signal.name}</b><br />{signal.id} · {signal.methods.join(" / ")}</button>) : <div className="wu-empty">No signal claims cite this row yet.</div>}
                      {detail.evidence.workspaceId && <button data-testid="open-evidence-workspace" type="button" className="wu-cmdBtn" onClick={openEvidenceWorkspace}>Open linked evidence review →</button>}
                    </>
                  )}
                  {detail.kind === "interpretation" && detail.interpretation && (
                    <>
                      <div className="wu-srcid">{detail.interpretation.id} · {detail.interpretation.type.toUpperCase()}</div>
                      <div className="wu-detailTitle">{detail.interpretation.name}</div>
                      <p className="wu-desc">Interpretation rows cite their source rows before being used by graph claims.</p>
                      <div className="wu-item"><b>Source rows</b><br />{arr(detail.interpretation.src).join(", ") || "withheld"}</div>
                      <div className="wu-item"><b>Projected graphs</b><br />{graphNames(detail.graphIds)}</div>
                    </>
                  )}
                  {detail.kind === "rolegraph" && (
                    <>
                      <div className="wu-srcid">ROLE GRAPH</div>
                      <div className="wu-detailTitle">Existing Role Graph workspace</div>
                      <p className="wu-desc">The Role Graph/FAB surface is preserved as the existing Step 3 workspace. Opening it keeps this Work Universe mounted so the selected graph or statistic survives the round trip.</p>
                      <button data-testid="open-role-graph" type="button" className="wu-cmdBtn" onClick={openRoleGraph}>Open Role Graph →</button>
                    </>
                  )}
                  {detail.kind === "lineage" && (
                    <>
                      <div className="wu-srcid">EVIDENCE LINEAGE</div>
                      <div className="wu-detailTitle">Evidence Lineage</div>
                      <p className="wu-desc">Source rows and statistic chips update this panel with the claim, constituents, production method and boundary.</p>
                      <div className="wu-itemGrid"><div className="wu-item"><b>Source rows</b><br />Duties and requirements</div><div className="wu-item"><b>Statistic chips</b><br />Claim-level drill paths</div></div>
                    </>
                  )}
                </section>
              </div>
            </section>
          </aside>
        </main>
        <footer className="wu-footerBar">
          <div className="wu-cmdGroup" aria-label="Commands">
            {onBack && <button className="wu-cmdBtn" type="button" onClick={onBack}>← Step 2</button>}
            <button className="wu-cmdBtn" type="button" onClick={resetUniverse}>Reset</button>
            {onPrintPackage && <button data-testid="wu-open-print-package" className="wu-cmdBtn" type="button" onClick={onPrintPackage}>Print / PDF</button>}
          </div>
          <div className="wu-stateGroup"><span className="wu-pill">Level 1</span><span className="wu-stateText"><b>{footer.label}</b> · {footer.detail}</span><span className="wu-pill">AI-assisted · human decides</span></div>
        </footer>
      </div>
    </div>
  );
}
