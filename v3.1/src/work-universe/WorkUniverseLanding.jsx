import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";

const WorkUniverseScene = lazy(() => import("./WorkUniverseScene.jsx"));

const C = {
  ink: "#17343a", muted: "#64777a", line: "#c8d6d3", accent: "#176775",
  soft: "#e5f0ed", panel: "#ffffff", bg: "#f4f1e8", withheld: "#8a6a16",
  navy: "#274d72", paper: "#fbfaf6",
};

function arr(v) { return Array.isArray(v) ? v : []; }
function n(v) { return typeof v === "number" && Number.isFinite(v) ? v : null; }
function labelValue(v) { return v === null || v === undefined || v === "" ? "—" : String(v); }
function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}
function signal(label, value, method, detail, boundary, status = "available") {
  return { label, value: labelValue(value), method, detail, boundary, status };
}
function withheld(label, detail, boundary) {
  return signal(label, "—", "WITHHELD", detail, boundary, "withheld");
}

function buildUniverse(result, title, employer, band, posting) {
  const anatomy = result && result.jobAnatomy;
  const rd = result && result.responsibilitiesData;
  const duties = arr(anatomy && anatomy.duties).length ? arr(anatomy.duties) : arr(rd && rd.responsibilities);
  const skills = arr(result && result.skills);
  const classified = duties.filter((d) => d && typeof d === "object" && firstDefined(d.exposureNow, d.band, d.exposure));
  const wu = (result && result.workUniverse) || {};
  const org = wu.organisation || wu.organization || {};
  const intel = wu.intelligence || {};
  const ha = wu.humanAgent || wu.human_agent || {};
  const tr = wu.transition || {};

  const labour = [
    duties.length
      ? signal("Source duties", duties.length, "DIRECT", "Duties carried from the Step 2 posting and analysed result evidence.", "The count does not establish effort, frequency or hidden responsibilities.")
      : withheld("Source duties", "No duty evidence is available to count.", "The Work Universe does not invent duties."),
    skills.length
      ? signal("Canonical skills", skills.length, "DERIVED", "Skills already present in the role-analysis result passed into Step 3.", "A role skill does not prove that a particular person possesses it.")
      : withheld("Canonical skills", "No mapped skills are available in the current result.", "No taxonomy count is guessed."),
    classified.length
      ? signal("Classified duties", classified.length, "COMPUTED", "Duties carrying an existing engine classification.", "Unclassified duties remain unclassified; missing exposure is never converted to zero.")
      : withheld("Classified duties", "No per-duty classification is available.", "No exposure class is inferred on this landing."),
  ];

  const employerKnown = !!String(employer || (posting && posting.employer) || "").trim();
  const caps = arr(firstDefined(org.capabilities, result && result.organisationCapabilities, result && result.organizationCapabilities));
  const authority = firstDefined(org.authority, result && result.authority);
  const orgSignals = [
    employerKnown
      ? signal("Employer evidence", "Available", "DIRECT", "The selected Step 2 role context carries an employer.", "Employer identity alone does not establish internal workflow or maturity.")
      : withheld("Employer evidence", "No employer evidence is attached to this role context.", "Organisation claims remain withheld."),
    caps.length
      ? signal("Capabilities", caps.length, "DERIVED", "Organisation capability objects supplied by the current result.", "Count does not establish maturity, capacity or performance.")
      : withheld("Capabilities", "No organisation capability objects are available yet.", "A job advertisement is not enough to invent organisation capabilities."),
    authority !== null
      ? signal("Authority", authority, "DIRECT / DERIVED", "Authority evidence supplied by the current result.", "Only the supplied scope is shown.")
      : withheld("Authority", "Approval or commit authority is not established.", "Never infer authority from title or seniority."),
  ];

  const intelObjects = arr(firstDefined(intel.objects, result && result.intelligenceObjects));
  const actionable = n(firstDefined(intel.agentActionableCount, intel.agent_actionable_count));
  const humanHeavy = n(firstDefined(intel.humanHeavyCount, intel.human_heavy_count));
  const intelSignals = [
    intelObjects.length
      ? signal("Intelligence objects", intelObjects.length, "DERIVED", "Intelligence objects supplied by Work Universe data.", "Existence does not establish access rights or completeness.")
      : withheld("Intelligence objects", "No Intelligence Graph objects have been produced yet.", "No object count is fabricated from role wording."),
    actionable !== null
      ? signal("Agent-actionable", actionable, "COMPUTED", "Count supplied by the governed Intelligence Graph computation.", "Agent-actionable does not mean reliably delegable.")
      : withheld("Agent-actionable", "Agent actionability has not been established.", "Requires access, reliability and environment evidence."),
    humanHeavy !== null
      ? signal("Human-heavy", humanHeavy, "COMPUTED", "Count supplied by the governed Intelligence Graph computation.", "Current human-heavy is not a permanent human-only claim.")
      : withheld("Human-heavy", "Human-heavy intelligence has not been established.", "No permanence claim is made."),
  ];

  const allocation = firstDefined(ha.allocation, ha.hha, result && result.humanAgentAllocation);
  const functions = n(firstDefined(ha.functionCount, ha.functionsCount, Array.isArray(ha.functions) ? ha.functions.length : null));
  const exposureBand = firstDefined(band, result && result.band, result && result.exposureBand);
  const haSignals = [
    functions !== null
      ? signal("Functions", functions, "COMPUTED", "Canonical execution functions supplied by Human-Agent analysis.", "A function is not a job or a person.")
      : withheld("Functions", "No Human-Agent function analysis has been produced yet.", "No function count is inferred from title text."),
    exposureBand !== null
      ? signal("Exposure band", exposureBand, "COMPUTED", "Existing deterministic role-exposure result carried into the Work Universe.", "Exposure is not an H/HY/A replacement ratio.")
      : withheld("Exposure band", "No deterministic exposure band is available.", "Missing exposure remains withheld."),
    allocation !== null
      ? signal("H / HY / A", typeof allocation === "string" ? allocation : JSON.stringify(allocation), "RULE + PROJECTED", "Human / Hybrid / Agent allocation supplied by Work Universe data.", "Scenario allocation is not a headcount replacement forecast.")
      : withheld("H / HY / A", "Human / Hybrid / Agent allocation is not established by the current evidence.", "Requires work, capability, reliability, authority and adoption evidence."),
  ];

  const changing = firstDefined(tr.changingFirst, tr.changing_first);
  const formation = firstDefined(tr.highFormationCount, tr.high_formation_count);
  const delta = firstDefined(tr.personalDelta, tr.personal_delta);
  const transitionSignals = [
    changing !== null
      ? signal("Changing first", changing, "PROJECTED", "Scenario projection supplied by the Transition Graph.", "Projection is not observed displacement.")
      : withheld("Changing first", "No governed future-work projection is available yet.", "The landing does not predict change from exposure alone."),
    formation !== null
      ? signal("High formation", formation, "DERIVED / RULE", "Formation-value result supplied by the Transition Graph.", "High formation does not mean permanently human-only.")
      : withheld("High formation", "Formation value has not been established.", "No developmental judgement is invented."),
    delta !== null
      ? signal("Personal delta", delta, "USER + RULE", "Transition delta calculated from person evidence and future requirements.", "Must remain withheld without person evidence.")
      : withheld("Personal delta", "No person evidence has been supplied for a personalised transition delta.", "Role evidence alone cannot establish an individual's capability gap."),
  ];

  return [
    { id: 1, key: "labour", name: "LABOUR GRAPH", flow: "Role → Task → Skill", signals: labour, action: "Open Role Graph" },
    { id: 2, key: "organisation", name: "ORGANISATION WORK", flow: "Purpose → Outcome → Work", signals: orgSignals, action: "Open evidence workspace" },
    { id: 3, key: "intelligence", name: "INTELLIGENCE GRAPH", flow: "Human ↔ Org ↔ Agent ↔ External", signals: intelSignals, action: "Open evidence workspace" },
    { id: 4, key: "human-agent", name: "HUMAN–AGENT GRAPH", flow: "Acquire → Analyse → Select → Commit", signals: haSignals, action: "Open evidence workspace" },
    { id: 5, key: "transition", name: "TRANSITION GRAPH", flow: "Future Work − Individual Capital", signals: transitionSignals, action: "Open evidence workspace" },
  ];
}

function btn(active) {
  return {
    minHeight: 44, padding: "0 13px", borderRadius: 999,
    border: `1px solid ${active ? C.accent : C.line}`,
    background: active ? C.accent : C.panel, color: active ? "#fff" : C.ink,
    fontSize: 12, fontWeight: 800, cursor: "pointer",
  };
}

function webglAvailable() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch (_) { return false; }
}

export default function WorkUniverseLanding({
  result, title, employer, source, band, posting, onBack, onEnterStudio, onOpenRoleGraph,
}) {
  const [anchor, setAnchor] = useState("role");
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasWebgl, setHasWebgl] = useState(false);
  const graphs = useMemo(() => buildUniverse(result, title, employer, band, posting), [result, title, employer, band, posting]);

  useEffect(() => {
    setHasWebgl(webglAvailable());
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const roleTitle = title || (posting && posting.title) || "Role evidence pending";
  const orgName = employer || (posting && (posting.employer || posting.companyName)) || "Organisation evidence pending";
  const anchorName = anchor === "role" ? roleTitle : anchor === "org" ? orgName : "Person evidence not supplied";
  const anchorSub = anchor === "role"
    ? "ROLE centre · analysed Step 2 evidence"
    : anchor === "org"
      ? "ORGANISATION centre · same evidence universe"
      : "PERSON centre · USER-PROVEN evidence required";
  const sourceLabel = source || (posting && posting.source) || "analysed posting";

  const selectGraph = (graphId) => {
    setSelectedGraph(graphId);
    const graph = graphs.find((g) => g.id === graphId);
    if (graph && !selected) setSelected({ kind: "graph", graph });
  };
  const selectSignal = (graph, item) => {
    setSelectedGraph(graph.id);
    setSelected({ kind: "signal", graph, signal: item });
  };
  const selectAnchor = () => setSelected({
    kind: "anchor",
    label: anchor === "role" ? "Role source anchor" : anchor === "org" ? "Organisation anchor" : "Person anchor",
    detail: anchor === "role"
      ? `The Work Universe was entered from the selected role evidence: ${roleTitle}.`
      : anchor === "org"
        ? `The same evidence universe is re-projected around ${orgName}.`
        : "Person-centred claims stay withheld until USER-PROVEN evidence is supplied.",
    boundary: anchor === "person" ? "Role or organisation evidence cannot be silently promoted into personal capability evidence." : "Changing centre changes the projection, not the underlying evidence.",
    method: anchor === "person" ? "USER-PROVEN / WITHHELD" : "DIRECT",
  });

  const openSelected = () => {
    const graphId = selected && selected.graph ? selected.graph.id : selectedGraph;
    if (graphId === 1 && onOpenRoleGraph) onOpenRoleGraph();
    else if (onEnterStudio) onEnterStudio(graphId || null);
  };

  return (
    <div data-testid="work-universe" className="wu-root">
      <style>{`
        .wu-root{min-height:100vh;background:${C.bg};color:${C.ink};font-family:Inter,Arial,sans-serif}
        .wu-main{max-width:1220px;margin:0 auto;padding:18px}
        .wu-stage{position:relative;min-height:720px;border:1px solid ${C.line};border-radius:22px;overflow:hidden;background:radial-gradient(circle at 50% 43%,rgba(229,240,237,.86),rgba(255,255,255,.96) 42%,rgba(251,250,246,.98) 74%);box-shadow:0 10px 34px rgba(23,52,58,.07)}
        .wu-scene{position:absolute;inset:0;opacity:.78;pointer-events:auto}
        .wu-centre{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);width:190px;height:190px;border-radius:50%;background:rgba(251,250,246,.93);border:3px solid ${C.accent};display:flex;align-items:center;justify-content:center;padding:17px;box-sizing:border-box;z-index:4;box-shadow:0 12px 30px rgba(23,52,58,.12)}
        .wu-centre button{border:0;background:transparent;color:inherit;cursor:pointer;text-align:center;width:100%;min-height:120px;border-radius:50%}
        .wu-graph{position:absolute;width:226px;height:226px;border-radius:50%;background:rgba(255,255,255,.92);border:2px solid ${C.line};padding:24px 20px 18px;box-sizing:border-box;z-index:5;box-shadow:0 9px 22px rgba(23,52,58,.08);transition:transform .18s ease,border-color .18s ease,background .18s ease}
        .wu-graph[data-selected="true"]{border:3px solid ${C.accent};background:rgba(229,240,237,.95);transform:scale(1.025)}
        .wu-g1{left:5%;top:4%}.wu-g2{right:5%;top:4%}.wu-g3{left:3%;bottom:7%}.wu-g4{right:3%;bottom:7%}.wu-g5{left:50%;bottom:-1%;transform:translateX(-50%)}
        .wu-g5[data-selected="true"]{transform:translateX(-50%) scale(1.025)}
        .wu-graph-title{width:100%;border:0;background:transparent;color:${C.accent};font-weight:900;font-size:10px;letter-spacing:.035em;cursor:pointer;text-align:center;min-height:28px;padding:0 4px}
        .wu-flow{text-align:center;font-weight:800;font-size:10px;margin:2px 0 8px;color:${C.ink}}
        .wu-signal{width:100%;min-height:40px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px;align-items:center;text-align:left;border:1px solid ${C.line};border-radius:9px;background:rgba(255,255,255,.91);padding:5px 7px;margin:4px 0;cursor:pointer;color:${C.ink}}
        .wu-signal[data-withheld="true"]{border-color:#d8c784;background:#fffdf4}
        .wu-signal-label{font-size:9px;font-weight:800;line-height:1.15}.wu-signal-value{font-size:10px;font-weight:900;color:${C.accent};max-width:86px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wu-signal[data-withheld="true"] .wu-signal-value{color:${C.withheld}}
        .wu-context{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}.wu-source{margin-left:auto;font-size:11px;color:${C.muted};max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wu-detail{margin-top:14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start;border:1px solid ${C.line};border-radius:14px;background:${C.panel};padding:14px 16px}
        .wu-kicker{font-size:10px;font-weight:900;letter-spacing:.07em;color:${C.accent};text-transform:uppercase}.wu-detail h2{font-family:Georgia,serif;font-size:20px;margin:5px 0 7px}.wu-detail p{font-size:12px;line-height:1.5;margin:5px 0;color:${C.ink}}.wu-boundary{color:${C.muted}!important}.wu-method{display:inline-flex;padding:4px 8px;border-radius:999px;border:1px solid ${C.line};font-size:10px;font-weight:900;letter-spacing:.03em;background:${C.paper}}
        .wu-footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 2px 4px;font-size:10px;color:${C.muted}}
        @media(max-width:900px){.wu-scene{display:none}.wu-stage{min-height:0;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;overflow:visible}.wu-centre,.wu-graph{position:relative;left:auto;right:auto;top:auto;bottom:auto;transform:none!important;width:100%;height:auto;min-height:190px;border-radius:18px}.wu-centre{grid-column:1/-1}.wu-graph{padding:18px}.wu-detail{grid-template-columns:1fr}.wu-source{margin-left:0;width:100%;max-width:none}}
        @media(max-width:560px){.wu-stage{grid-template-columns:1fr}.wu-centre{grid-column:auto}.wu-main{padding:12px}.wu-graph{min-height:210px}.wu-context{gap:6px}}
        @media(prefers-reduced-motion:reduce){.wu-graph{transition:none}}
      `}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(244,241,232,.96)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}`, padding: "10px 18px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".08em", color: C.accent }}>STEP 3 · SHARED WORK UNIVERSE</div>
            <div style={{ fontSize: 13, color: C.muted }}>One evidence universe · five canonical graphs · centre changes the projection</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {onBack && <button type="button" onClick={onBack} style={btn(false)}>← Step 2</button>}
            {onEnterStudio && <button data-testid="open-workspace" type="button" onClick={() => onEnterStudio(null)} style={btn(true)}>Open evidence workspace →</button>}
          </div>
        </div>
      </header>

      <main className="wu-main">
        <div className="wu-context" aria-label="Work Universe centre">
          <span style={{ fontSize: 10, fontWeight: 900, color: C.muted, letterSpacing: ".08em" }}>CENTRE</span>
          {[["role", "Role"], ["org", "Organisation"], ["person", "Person"]].map(([key, label]) => (
            <button key={key} data-testid={`wu-anchor-${key}`} type="button" onClick={() => { setAnchor(key); setSelected(null); setSelectedGraph(null); }} style={btn(anchor === key)}>{label}</button>
          ))}
          <span className="wu-source">Source · {sourceLabel}</span>
        </div>

        <section className="wu-stage" aria-label="Shared Work Universe five-graph projection">
          {hasWebgl && (
            <div className="wu-scene">
              <Suspense fallback={null}>
                <WorkUniverseScene selectedGraph={selectedGraph} reducedMotion={reducedMotion} onSelectGraph={selectGraph} />
              </Suspense>
            </div>
          )}

          <div className="wu-centre">
            <button data-testid="wu-source-anchor" type="button" onClick={selectAnchor} aria-label={`Open ${anchor} source context`}>
              <div style={{ fontSize: 10, fontWeight: 900, color: C.accent, letterSpacing: ".08em" }}>{anchor.toUpperCase()} ANCHOR</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 800, lineHeight: 1.2, margin: "9px 0" }}>{anchorName}</div>
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.35 }}>{anchorSub}</div>
            </button>
          </div>

          {graphs.map((graph) => (
            <div key={graph.id} className={`wu-graph wu-g${graph.id}`} data-selected={selectedGraph === graph.id ? "true" : "false"} data-testid={`graph-${graph.key}`}>
              <button type="button" className="wu-graph-title" onClick={() => { setSelectedGraph(graph.id); setSelected({ kind: "graph", graph }); }} aria-label={`Select ${graph.name}`}>
                {graph.id} · {graph.name}
              </button>
              <div className="wu-flow">{graph.flow}</div>
              {graph.signals.map((item, index) => (
                <button key={`${graph.id}-${index}`} type="button" className="wu-signal" data-withheld={item.status === "withheld" ? "true" : "false"} onClick={() => selectSignal(graph, item)}>
                  <span className="wu-signal-label">{item.label}</span>
                  <span className="wu-signal-value">{item.value}</span>
                </button>
              ))}
            </div>
          ))}
        </section>

        {selected && (
          <section className="wu-detail" data-testid="wu-detail" aria-live="polite">
            <div>
              <div className="wu-kicker">{selected.kind === "anchor" ? "Evidence anchor" : selected.graph.name}</div>
              <h2>{selected.kind === "signal" ? selected.signal.label : selected.kind === "graph" ? selected.graph.flow : selected.label}</h2>
              {selected.kind === "signal" && <div className="wu-method">{selected.signal.method}</div>}
              {selected.kind === "anchor" && <div className="wu-method">{selected.method}</div>}
              <p>{selected.kind === "signal" ? selected.signal.detail : selected.kind === "graph" ? "Select one of the three first-order signals inside this graph to inspect its evidence and boundary." : selected.detail}</p>
              <p className="wu-boundary"><strong>Boundary:</strong> {selected.kind === "signal" ? selected.signal.boundary : selected.kind === "graph" ? "The graph can only expose claims supported by the current evidence universe; missing claims stay withheld." : selected.boundary}</p>
            </div>
            {selected.kind !== "anchor" && (
              <button data-testid={selected.graph.id === 1 ? "open-role-graph" : "open-graph-workspace"} type="button" onClick={openSelected} style={btn(true)}>
                {selected.graph.action} →
              </button>
            )}
          </section>
        )}

        <div className="wu-footer">
          <span>Production method is shown per claim · WITHHELD is a valid result</span>
          <span>AI-assisted · human decides</span>
        </div>
      </main>
    </div>
  );
}
