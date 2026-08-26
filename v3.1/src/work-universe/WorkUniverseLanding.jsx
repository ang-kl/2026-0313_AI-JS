import React, { useMemo, useState } from "react";

const C = {
  ink: "#17343a", muted: "#64777a", line: "#c8d6d3", accent: "#176775",
  soft: "#e5f0ed", panel: "#ffffff", bg: "#f4f1e8", withheld: "#8a6a16",
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
    duties.length ? signal("Source duties", duties.length, "DIRECT", "Duties available from the analysed posting/result evidence.", "Count does not establish effort, frequency or hidden responsibilities.") : withheld("Source duties", "No duty evidence is available to count.", "The landing does not invent duties."),
    skills.length ? signal("Canonical skills", skills.length, "DERIVED", "Skills already present in the existing role-analysis result.", "A role skill does not prove that a particular person possesses it.") : withheld("Canonical skills", "No mapped skills are available in the current result.", "No taxonomy count is guessed."),
    classified.length ? signal("Classified duties", classified.length, "COMPUTED", "Duties carrying an existing engine classification.", "Unclassified duties remain unclassified; missing exposure is never converted to zero.") : withheld("Classified duties", "No per-duty classification is available.", "No exposure class is inferred on this landing."),
  ];

  const employerKnown = !!String(employer || (posting && posting.employer) || "").trim();
  const caps = arr(firstDefined(org.capabilities, result && result.organisationCapabilities, result && result.organizationCapabilities));
  const authority = firstDefined(org.authority, result && result.authority);
  const orgSignals = [
    employerKnown ? signal("Employer evidence", "Available", "DIRECT", "An employer is attached to the analysed role context.", "Employer identity alone does not establish internal workflow or maturity.") : withheld("Employer evidence", "No employer evidence is attached to this role context.", "Organisation claims remain withheld."),
    caps.length ? signal("Capabilities", caps.length, "DERIVED", "Organisation capability objects supplied by the result payload.", "Count does not establish maturity, capacity or performance.") : withheld("Capabilities", "No organisation capability objects are available yet.", "The role advertisement is not enough to invent organisation capabilities."),
    authority !== null ? signal("Authority", authority, "DIRECT / DERIVED", "Authority evidence supplied by the current result.", "Only the supplied scope is shown.") : withheld("Authority", "Approval or commit authority is not established.", "Never infer authority from title or seniority."),
  ];

  const intelObjects = arr(firstDefined(intel.objects, result && result.intelligenceObjects));
  const actionable = n(firstDefined(intel.agentActionableCount, intel.agent_actionable_count));
  const humanHeavy = n(firstDefined(intel.humanHeavyCount, intel.human_heavy_count));
  const intelSignals = [
    intelObjects.length ? signal("Intelligence objects", intelObjects.length, "DERIVED", "Intelligence objects supplied by the Work Universe data.", "Existence does not establish access rights or completeness.") : withheld("Intelligence objects", "No Intelligence Graph objects have been produced yet.", "No object count is fabricated from role wording."),
    actionable !== null ? signal("Agent-actionable", actionable, "COMPUTED", "Count supplied by the governed Intelligence Graph computation.", "Agent-actionable does not mean reliably delegable.") : withheld("Agent-actionable", "Agent actionability has not been established.", "Requires access, reliability and environment evidence."),
    humanHeavy !== null ? signal("Human-heavy", humanHeavy, "COMPUTED", "Count supplied by the governed Intelligence Graph computation.", "Current human-heavy is not a permanent human-only claim.") : withheld("Human-heavy", "Human-heavy intelligence has not been established.", "No permanence claim is made."),
  ];

  const allocation = firstDefined(ha.allocation, ha.hha, result && result.humanAgentAllocation);
  const functions = n(firstDefined(ha.functionCount, ha.functionsCount, Array.isArray(ha.functions) ? ha.functions.length : null));
  const exposureBand = firstDefined(band, result && result.band, result && result.exposureBand);
  const haSignals = [
    functions !== null ? signal("Functions", functions, "COMPUTED", "Canonical execution functions supplied by Human-Agent analysis.", "A function is not a job or person.") : withheld("Functions", "No Human-Agent function analysis has been produced yet.", "No function count is inferred from title text."),
    exposureBand !== null ? signal("Exposure band", exposureBand, "COMPUTED", "Existing deterministic role-exposure result carried into the Work Universe.", "Exposure is not an H/HY/A replacement ratio.") : withheld("Exposure band", "No deterministic exposure band is available.", "Missing exposure remains withheld."),
    allocation !== null ? signal("H / HY / A", typeof allocation === "string" ? allocation : JSON.stringify(allocation), "RULE + PROJECTED", "Human / Hybrid / Agent allocation supplied by the Work Universe engine.", "Scenario allocation is not a headcount replacement forecast.") : withheld("H / HY / A", "Human / Hybrid / Agent allocation is not established by the current evidence.", "Requires work, capability, reliability, authority and adoption evidence."),
  ];

  const changing = firstDefined(tr.changingFirst, tr.changing_first);
  const formation = firstDefined(tr.highFormationCount, tr.high_formation_count);
  const delta = firstDefined(tr.personalDelta, tr.personal_delta);
  const transitionSignals = [
    changing !== null ? signal("Changing first", changing, "PROJECTED", "Scenario projection supplied by the Transition Graph.", "Projection is not observed displacement.") : withheld("Changing first", "No governed future-work projection is available yet.", "The landing does not predict change from exposure alone."),
    formation !== null ? signal("High formation", formation, "DERIVED / RULE", "Formation-value result supplied by the Transition Graph.", "High formation does not mean permanently human-only.") : withheld("High formation", "Formation value has not been established.", "No developmental judgement is invented."),
    delta !== null ? signal("Personal delta", delta, "USER + RULE", "Transition delta calculated from person evidence and future requirements.", "Must remain withheld without person evidence.") : withheld("Personal delta", "No person evidence has been supplied for a personalised transition delta.", "Role evidence alone cannot establish an individual's capability gap."),
  ];

  return [
    { id: 1, name: "LABOUR GRAPH", flow: "Role → Task → Skill", signals: labour },
    { id: 2, name: "ORGANISATION WORK", flow: "Purpose → Outcome → Work", signals: orgSignals },
    { id: 3, name: "INTELLIGENCE GRAPH", flow: "Human ↔ Org ↔ Agent ↔ External", signals: intelSignals },
    { id: 4, name: "HUMAN–AGENT GRAPH", flow: "Acquire → Analyse → Select → Commit", signals: haSignals },
    { id: 5, name: "TRANSITION GRAPH", flow: "Future Work − Individual Capital", signals: transitionSignals },
  ];
}

const pos = {
  1: { left: "7%", top: "3%" }, 2: { right: "7%", top: "3%" },
  3: { left: "4%", bottom: "8%" }, 4: { right: "4%", bottom: "8%" },
  5: { left: "50%", bottom: "0", transform: "translateX(-50%)" },
};

export default function WorkUniverseLanding({ result, title, employer, source, band, posting, onBack, onEnterStudio }) {
  const [anchor, setAnchor] = useState("role");
  const [selected, setSelected] = useState(null);
  const graphs = useMemo(() => buildUniverse(result, title, employer, band, posting), [result, title, employer, band, posting]);
  const anchorName = anchor === "role" ? (title || "Role evidence pending") : anchor === "org" ? (employer || "Organisation evidence pending") : "Person evidence not supplied";
  const anchorSub = anchor === "role" ? "ROLE centre · analysed evidence" : anchor === "org" ? "ORGANISATION centre · same Work Universe" : "PERSON centre · USER-PROVEN evidence required";

  const selectSignal = (g, s) => setSelected({ graph: g, signal: s });

  return <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "Inter, Arial, sans-serif" }}>
    <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(244,241,232,.96)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}`, padding: "10px 18px" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: C.accent }}>STEP 3 · SHARED WORK UNIVERSE</div>
          <div style={{ fontSize: 13, color: C.muted }}>One evidence universe · five canonical graphs</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onBack && <button onClick={onBack} style={btn(false)}>← Step 2</button>}
          <button onClick={onEnterStudio} style={btn(true)}>Open Review Studio →</button>
        </div>
      </div>
    </header>

    <main style={{ maxWidth: 1220, margin: "0 auto", padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: C.muted, letterSpacing: ".08em" }}>CENTRE</span>
        {[['role','Role'],['org','Organisation'],['person','Person']].map(([k,l]) => <button key={k} onClick={() => { setAnchor(k); setSelected(null); }} style={btn(anchor === k)}>{l}</button>)}
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>Source · {source || (posting && posting.source) || "analysed posting"}</span>
      </div>

      <section style={{ position: "relative", minHeight: 700, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 30px rgba(23,52,58,.06)" }} aria-label="Shared Work Universe">
        <svg viewBox="0 0 1000 700" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {[[500,340,210,150],[500,340,790,150],[500,340,190,520],[500,340,810,520],[500,340,500,605]].map((v,i) => <line key={i} x1={v[0]} y1={v[1]} x2={v[2]} y2={v[3]} stroke={selected && selected.graph.id === i+1 ? C.accent : C.line} strokeWidth={selected && selected.graph.id === i+1 ? 3 : 2} />)}
        </svg>

        <div style={{ position: "absolute", left: "50%", top: "49%", transform: "translate(-50%,-50%)", width: 190, minHeight: 190, borderRadius: "50%", background: C.soft, border: `3px solid ${C.accent}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 18, boxSizing: "border-box" }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: C.accent, letterSpacing: ".08em" }}>{anchor.toUpperCase()} ANCHOR</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 800, lineHeight: 1.2, margin: "9px 0" }}>{anchorName}</div>
          <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.35 }}>{anchorSub}</div>
        </div>

        {graphs.map((g) => <div key={g.id} style={{ position: "absolute", width: 225, height: 225, borderRadius: "50%", background: selected && selected.graph.id === g.id ? C.soft : C.panel, border: `${selected && selected.graph.id === g.id ? 3 : 2}px solid ${selected && selected.graph.id === g.id ? C.accent : C.line}`, padding: "26px 22px 18px", boxSizing: "border-box", ...pos[g.id] }}>
          <div style={{ textAlign: "center", color: C.accent, fontWeight: 900, fontSize: 10, letterSpacing: ".035em" }}>{g.id} · {g.name}</div>
          <div style={{ textAlign: "center", fontWeight: 800, fontSize: 10, margin: "3px 0 8px" }}>{g.flow}</div>
          {g.signals.map((s, i) => <button key={i} onClick={() => selectSignal(g,s)} style={{ width: "100%", minHeight: 38, display: "grid", gridTemplateColumns: "1fr auto", gap: 5, alignItems: "center", textAlign: "left", border: `1px solid ${s.status === "withheld" ? "#d8c784" : C.line}`, borderRadius: 8, background: "rgba(255,255,255,.92)", color: C.ink, padding: "5px 7px", margin: "4px 0", cursor: "pointer" }}>
            <span><span style={{ display: "block", fontSize: 9, fontWeight: 800, lineHeight: 1.05 }}>{s.label}</span><span style={{ display: "block", fontSize: 7, color: s.status === "withheld" ? C.withheld : C.muted, marginTop: 2 }}>{s.method}</span></span>
            <strong style={{ fontSize: 11, whiteSpace: "nowrap" }}>{s.value}</strong>
          </button>)}
        </div>)}
      </section>

      <section aria-live="polite" style={{ marginTop: 12, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
        {!selected ? <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.55 }}><strong style={{ color: C.ink }}>Start at the surface.</strong> Select a statistic inside any canonical graph to inspect what the current evidence can support. Missing evidence is deliberately shown as <strong>WITHHELD</strong>. The existing Review Studio, Role Graph and working-canvas/FAB capabilities remain available through <strong>Open Review Studio</strong>.</div> : <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,.55fr) minmax(260px,1.45fr)", gap: 18 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: C.accent }}>GRAPH {selected.graph.id} · {selected.graph.name}</div>
            <h2 style={{ fontFamily: "Georgia, serif", margin: "5px 0", fontSize: 22 }}>{selected.signal.label}</h2>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{selected.signal.value}</div>
            <span style={{ display: "inline-block", marginTop: 6, border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 7px", fontSize: 9, fontWeight: 900, color: selected.signal.status === "withheld" ? C.withheld : C.accent }}>{selected.signal.method}</span>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55 }}>
            <div style={{ marginBottom: 10 }}><strong>What this means</strong><br/><span style={{ color: C.muted }}>{selected.signal.detail}</span></div>
            <div><strong>Boundary</strong><br/><span style={{ color: C.muted }}>{selected.signal.boundary}</span></div>
          </div>
        </div>}
      </section>
    </main>

    <style>{`@media(max-width:860px){.wu-mobile-note{display:block}} @media(max-width:720px){section[aria-label="Shared Work Universe"]{min-height:1180px!important} section[aria-label="Shared Work Universe"]>div[style*="position: absolute"]{transform:none!important}}`}</style>
  </div>;
}

function btn(on) {
  return { minHeight: 40, border: `1px solid ${on ? C.accent : C.line}`, borderRadius: 9, background: on ? C.soft : C.panel, color: on ? C.accent : C.ink, padding: "0 12px", fontWeight: on ? 800 : 600, cursor: "pointer" };
}
