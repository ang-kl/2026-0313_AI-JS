// v3 Step 3 - Review Studio (v3-ui-blueprint.md S4; v3-blueprint.md S5/S7/S10).
// A reviewable workspace: fixed header + sub-header, ribbon, a docked collapsible
// icon rail/drawer, a manuscript canvas (the job ad as an editorial page) and a right
// Visual Intelligence stack (the Role Graph + doctrine visuals). Phase 1: shell +
// manuscript (Read clean) + Role Graph. Dissection (O-I-A), comment margin and the
// extra visuals land in later phases. Doctrine tokens only; "AI-assisted; human decides".
import { useState } from "react";

// Doctrine exposure bands (fixed order, S1.2) - colour encodes band only.
const BANDS = {
  human:     { key: "human",     label: "Human-led",       dot: "#1d4ed8", bg: "#eaf0ff", ink: "#1d4ed8", border: "#c7d6ff" },
  assisted:  { key: "assisted",  label: "AI-assisted",     dot: "#0e7490", bg: "#e3f5fb", ink: "#0b5e74", border: "#bce6f0" },
  augmented: { key: "augmented", label: "AI-augmented",    dot: "#b45309", bg: "#fdf0dd", ink: "#92450a", border: "#f5d8a8" },
  auto:      { key: "auto",      label: "Full automation", dot: "#c2410c", bg: "#fde6da", ink: "#9a3412", border: "#f6c6ac" },
};
const PROV = {
  "from posting": { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  "from MCF":     { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  computed:       { bg: "#eef7f0", ink: "#2f7d4f", border: "#cce6d4" },
  derived:        { bg: "#f1eefc", ink: "#5b4bbd", border: "#ddd5f6" },
};
const RIBBON = [
  { group: "Review", key: "markup", items: [["clean", "Read clean"], ["suggestions", "Suggestions"], ["comments", "Comments"], ["dissect", "Dissect"]] },
  { group: "Visuals", key: "visual", items: [["jobgraph", "Job graph"], ["aioe", "AI trace"], ["workflow", "Workflow"], ["value", "Value stream"], ["org", "Org map"]] },
  { group: "Evidence", key: null, items: [["observed", "Observed"], ["interpreted", "Interpreted"], ["applied", "Applied"], ["withheld", "Withheld"], ["provenance", "Provenance"]] },
  { group: "Output", key: null, items: [["cover", "Cover letter"], ["resume", "Resume notes"], ["interview", "Interview pack"], ["print", "Print / PDF"]] },
];
const RAIL = [
  { key: "sources", icon: String.fromCharCode(0x25a4), label: "Sources" },
  { key: "trace", icon: String.fromCharCode(0x22d4), label: "Trace" },
  { key: "skilling", icon: String.fromCharCode(0x25c7), label: "Skilling" },
  { key: "advisory", icon: String.fromCharCode(0x2726), label: "Advisory" },
  { key: "cover", icon: String.fromCharCode(0x270e), label: "Cover letter" },
  { key: "boards", icon: String.fromCharCode(0x25a6), label: "Boards" },
  { key: "saved", icon: String.fromCharCode(0x2913), label: "Saved" },
];

function rsStrip(s) { return String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }
function rsFirstSentence(s) {
  const t = String(s || "").trim(); if (!t) return "";
  const m = t.match(/^.{40,220}?[.!?](\s|$)/);
  let out = m ? m[0].trim() : t.slice(0, 200);
  if (out.length < t.length && !/[.!?]$/.test(out)) out = out.replace(/\s+\S*$/, "") + String.fromCharCode(0x2026);
  return out;
}
const RS_EXP_BAND = { HIGH: "auto", MEDIUM: "augmented", LOW: "assisted", HUMAN: "human" };
function rsDominantBand(duties) {
  const c = {}; (duties || []).forEach((d) => { const b = RS_EXP_BAND[d && d.exposureNow]; if (b) c[b] = (c[b] || 0) + 1; });
  const keys = Object.keys(c); return keys.length ? keys.sort((a, b) => c[b] - c[a])[0] : null;
}

function Chip({ kind, children }) {
  const p = PROV[kind] || PROV.computed;
  return <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: p.ink, background: p.bg, border: "1px solid " + p.border, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>{children}</span>;
}

export default function ReviewStudio({ result, title, employer, source, rolePane, band, onBack }) {
  const [markup, setMarkup] = useState("clean");
  const [visual, setVisual] = useState("jobgraph");
  const [rail, setRail] = useState(null);      // open drawer key or null
  const [railOpen, setRailOpen] = useState(true); // icon rail expanded (labels) vs collapsed

  const ja = result && result.jobAnatomy;
  const rd = result && result.responsibilitiesData;
  // Verbatim duties from the engine's Job Anatomy first (each carries layer + exposure),
  // else the responsibilities extract. Non-inventive: the posting's own duty text.
  const dutyObjs = (ja && Array.isArray(ja.duties) && ja.duties.length ? ja.duties
    : (rd && Array.isArray(rd.responsibilities) ? rd.responsibilities : []));
  const duties = dutyObjs.map((d) => (typeof d === "string" ? d : d.text)).filter(Boolean);
  const firstJob = Array.isArray(result && result.jobs) ? result.jobs.find((j) => j && (j.description || j.responsibilitiesText)) : null;
  const overview = (rd && rd.summary) || (firstJob ? rsFirstSentence(rsStrip(firstJob.description || firstJob.responsibilitiesText)) : "");
  const skills = (Array.isArray(result && result.skills) ? result.skills : []).map((s) => s.skill || s).filter(Boolean);
  const derivedBand = rsDominantBand(dutyObjs);
  const bandKey = (band && BANDS[band]) ? band : derivedBand;
  const bandTok = bandKey && BANDS[bandKey] ? BANDS[bandKey] : null;

  const ribbonActive = (groupKey, k) => (groupKey === "markup" && markup === k) || (groupKey === "visual" && visual === k);
  function ribbonClick(groupKey, k) {
    if (groupKey === "markup") setMarkup(k);
    else if (groupKey === "visual") setVisual(k);
    else if (k === "cover") { setRail("cover"); }
  }

  const pillStyle = (active) => ({ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer", minHeight: 30, borderRadius: 6, padding: "5px 10px", background: active ? "#142a8e" : "#fff", color: active ? "#fff" : "#3a4456", border: "1px solid " + (active ? "#142a8e" : "#e2e0d8") });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 50px)", background: "#e9edf3" }}>
      {/* Sub-header (fixed, does not scroll) */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, flex: "none", display: "flex", alignItems: "center", gap: 18, padding: "11px 18px", background: "#fbfaf8", borderBottom: "1px solid #e2e0d8" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#1a56db", fontFamily: "'Spline Sans',sans-serif", fontWeight: 500, fontSize: "0.8125rem", flex: "none" }}><span aria-hidden="true">&#8592;</span> Postings</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".14em", color: "#8a8274" }}>REVIEWING</span>
            <Chip kind="from MCF">{String.fromCharCode(0x25cf)} {source || "from MCF"}</Chip>
          </div>
          <div style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.0625rem", color: "#16202e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{title || "this role"}</div>
        </div>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>
          {bandTok && <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: bandTok.ink, background: bandTok.bg, border: "1px solid " + bandTok.border, borderRadius: 6, padding: "4px 9px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: bandTok.dot }} />{bandTok.label}</span>}
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#64748b", background: "#fff", border: "1px solid #e6e3db", borderRadius: 6, padding: "4px 9px" }}>{duties.length} duties {String.fromCharCode(0x00b7)} {skills.length} skills</span>
        </div>
      </div>

      {/* Ribbon */}
      <div className="wis-scroll" style={{ flex: "none", display: "flex", alignItems: "stretch", padding: "8px 14px", background: "#fff", borderBottom: "1px solid #eceae2", overflowX: "auto" }}>
        {RIBBON.map((g) => (
          <div key={g.group} style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0 16px", borderRight: "1px solid #f0eee7" }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: ".14em", color: "#b3ab9c" }}>{g.group.toUpperCase()}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {g.items.map(([k, lbl]) => (
                <button key={k} type="button" aria-pressed={ribbonActive(g.key, k)} onClick={() => ribbonClick(g.key, k)} style={pillStyle(ribbonActive(g.key, k))}>{lbl}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left icon rail (docked, collapsible; does not move) */}
        <nav style={{ flex: "none", width: railOpen ? 150 : 54, background: "#f4f6fa", borderRight: "1px solid #e2e0d8", padding: "12px 9px", display: "flex", flexDirection: "column", gap: 3, transition: "width .15s" }}>
          <button onClick={() => setRailOpen((o) => !o)} aria-label={railOpen ? "Collapse rail" : "Expand rail"} style={{ alignSelf: railOpen ? "flex-end" : "center", minHeight: 36, minWidth: 36, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 8, cursor: "pointer", color: "#64748b", marginBottom: 4 }}>{railOpen ? String.fromCharCode(0x00ab) : String.fromCharCode(0x00bb)}</button>
          {RAIL.map((r) => { const on = rail === r.key; return (
            <button key={r.key} onClick={() => setRail(on ? null : r.key)} title={r.label} aria-pressed={on} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: railOpen ? "flex-start" : "center", cursor: "pointer", textAlign: "left", background: on ? "#eef2ff" : "transparent", color: on ? "#142a8e" : "#5b6b7f", border: "1px solid " + (on ? "#cdd9ff" : "transparent"), borderRadius: 8, padding: "8px 10px", minHeight: 40, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 500 }}>
              <span aria-hidden="true" style={{ fontSize: 15, width: 16, textAlign: "center", flex: "none" }}>{r.icon}</span>{railOpen && r.label}
            </button>
          ); })}
          {railOpen && <div style={{ marginTop: "auto", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", color: "#a8b0bd", lineHeight: 1.5, padding: "8px 6px 2px" }}>local + cloud</div>}
        </nav>

        {/* Drawer (floats over the canvas; collapses to the rail) */}
        {rail && (
          <aside className="wis-scroll" style={{ flex: "none", width: 300, background: "#fbfaf8", borderRight: "1px solid #e2e0d8", padding: "16px 15px", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".13em", color: "#8a8274" }}>{(RAIL.find((r) => r.key === rail) || {}).label?.toUpperCase()}</div>
              <button onClick={() => setRail(null)} aria-label="Close drawer" style={{ minHeight: 28, minWidth: 28, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55 }}>This drawer fills in the next build phase. Each note will cite the manuscript line that triggered it - it helps you decide, it never decides for you.</p>
            <p style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#2f7d4f", marginTop: 12 }}>AI-assisted {String.fromCharCode(0x00b7)} human decides</p>
          </aside>
        )}

        {/* Left: the job ad as a manuscript (~34%) */}
        <div className="wis-scroll" style={{ flex: "0 0 clamp(330px, 34%, 600px)", minWidth: 0, overflowY: "auto", padding: "22px 22px 60px", background: "#e9edf3" }}>
          <div style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, padding: "28px 30px 34px", boxShadow: "0 1px 3px rgba(20,32,46,.05)" }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".16em", color: "#8a8274", marginBottom: 8 }}>MANUSCRIPT {String.fromCharCode(0x00b7)} {(employer || "LIVE POSTING").toUpperCase()}</div>
            <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.55rem", lineHeight: 1.18, color: "#16202e", margin: "0 0 10px" }}>{title || "this role"}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <Chip kind="from MCF">{String.fromCharCode(0x25cf)} {source || "from MCF"} {String.fromCharCode(0x00b7)} verbatim</Chip>
              {bandTok && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: bandTok.ink, background: bandTok.bg, border: "1px solid " + bandTok.border, borderRadius: 5, padding: "2px 7px" }}>{bandTok.label}</span>}
            </div>
            {overview && <>
              <h2 style={manuH2}>Role overview</h2>
              <p style={manuP}>{overview}</p>
            </>}
            {duties.length > 0 && <>
              <h2 style={manuH2}>Responsibilities</h2>
              <ul style={{ margin: "0 0 18px", paddingLeft: 18 }}>{duties.map((d, i) => <li key={i} style={{ ...manuP, marginBottom: 7 }}>{d}</li>)}</ul>
            </>}
            {skills.length > 0 && <>
              <h2 style={manuH2}>Skills the posting asks for</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.slice(0, 24).map((s, i) => <span key={i} style={{ fontSize: "0.8125rem", color: "#0b5e74", background: "#e3f5fb", border: "1px solid #bce6f0", borderRadius: 14, padding: "3px 11px" }}>{s}</span>)}</div>
            </>}
            {!overview && !duties.length && <p style={manuP}>The analysed posting did not yield responsibilities text to render as a manuscript.</p>}
          </div>
        </div>

        {/* Right: Role Graph + analysis (~66%, the dominant pane) */}
        <div className="wis-scroll" style={{ flex: 1, minWidth: 0, background: "#fbfaf8", borderLeft: "1px solid #e2e0d8", overflowY: "auto", padding: "16px 18px 50px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".14em", color: "#8a8274" }}>VISUAL INTELLIGENCE</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {RIBBON[1].items.map(([k, lbl]) => (
                <button key={k} type="button" aria-pressed={visual === k} onClick={() => setVisual(k)} style={pillStyle(visual === k)}>{lbl}</button>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #eceae2", borderRadius: 12, padding: 16, minHeight: "64vh" }}>
            {visual === "jobgraph" && (rolePane || <p style={{ fontSize: "0.875rem", color: "#94a0b0" }}>The role graph appears once the role resolves duties and skills.</p>)}
            {visual !== "jobgraph" && (
              <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6, maxWidth: 560 }}>
                <strong style={{ color: "#16202e" }}>{(RIBBON[1].items.find((i) => i[0] === visual) || [])[1]}</strong> renders in the next build phase, wired to the deterministic engine output (per blueprint S10.3). The <strong style={{ color: "#16202e" }}>Job graph</strong> is live now - switch back to it.
              </p>
            )}
          </div>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#a8a193", marginTop: 8 }}>every node {String.fromCharCode(0x2190)} source span</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 18px", background: "#142a8e" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#a9b6ee" }}>Review Studio {String.fromCharCode(0x00b7)} local + cloud</span>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#fff", fontWeight: 500 }}>AI-assisted {String.fromCharCode(0x00b7)} human decides</span>
      </div>
    </div>
  );
}

const manuH2 = { fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#16202e", margin: "0 0 9px" };
const manuP = { fontSize: "0.9375rem", color: "#3a4456", lineHeight: 1.6, margin: "0 0 18px" };
