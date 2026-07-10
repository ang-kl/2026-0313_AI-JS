// v3/src/review/shared.jsx - PR 1 (Part B.4): presentation tokens + the components
// shared by several windows, moved verbatim from ReviewStudio.jsx. A separate module
// (not per-window files) so window files never import from ReviewStudio.jsx - that
// would create a new import cycle. (shared -> App.jsx for fetchEmployerRegistration
// preserves the pre-existing App<->ReviewStudio cycle shape, not a new one.)
import { useState, useEffect, Fragment } from "react";
import { fetchEmployerRegistration } from "../App.jsx";
import { RS_DOT, RS_EXP_BAND } from "./rs-rules.js";

export const BANDS = {
  human:     { key: "human",     label: "Human-led",       dot: "#1d4ed8", bg: "#eaf0ff", ink: "#1d4ed8", border: "#c7d6ff" },
  assisted:  { key: "assisted",  label: "AI-assisted",     dot: "#0e7490", bg: "#e3f5fb", ink: "#0b5e74", border: "#bce6f0" },
  augmented: { key: "augmented", label: "AI-augmented",    dot: "#b45309", bg: "#fdf0dd", ink: "#92450a", border: "#f5d8a8" },
  auto:      { key: "auto",      label: "Full automation", dot: "#d97706", bg: "#fef3e0", ink: "#8a4b0a", border: "#f7d4a0" },
};
export const PROV = {
  "from posting": { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  "from MCF":     { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  // PB1: employer facts pass through verbatim from ACRA (data.gov.sg) - same
  // "sourced fact" family styling as "from posting"/"from MCF" (no red/green).
  "from ACRA":    { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  // Audit (07-07 '26): computed was the one green swatch left in the chip vocabulary -
  // moved to the blue family so all five prov chips sit inside blue/violet/amber.
  computed:       { bg: "#eaf0ff", ink: "#1d4ed8", border: "#c7d6ff" },
  derived:        { bg: "#f1eefc", ink: "#5b4bbd", border: "#ddd5f6" },
  "AI estimate":  { bg: "#fff4e6", ink: "#9a6113", border: "#f5dcb0" },
  // A11y (governance audit): unverified was brick-red (#a13a3a) - the one warm "danger" hue
  // outside the blue/orange ramp, and a red-vs-green tension against the computed chip. Moved
  // to the amber family (shared with "AI estimate"); the label text carries the meaning.
  unverified:     { bg: "#fff4e6", ink: "#9a6113", border: "#f5dcb0" },
};
// O-I-A lens colours (S7) and reviewer persona colours (S5.5).
export const LENS = { ROLE: "#1d4ed8", ORG: "#5b4bbd", AI: "#b45309" };
export const PERSONA = {
  "AI Exposure Reviewer": "#b45309", "Process Redesign Reviewer": "#5b4bbd",
  "Role Analyst": "#1d4ed8", "Candidate Advocate": "#0e7490", "Evidence Auditor": "#64748b",
  "Signal Auditor": "#9a6113",
};
// Tracked-span styling by exposure band (S5.2): tint + 2px underline, colour-blind safe.
export const SPAN_STYLE = {
  augmented: { bg: "#fdf0dd", under: "#b45309", color: "#7a3c08" },
  auto:      { bg: "#fef3e0", under: "#d97706", color: "#7a4b0a" },
  human:     { bg: "#eaf0ff", under: "#1d4ed8", color: "#1b3aa0" },
  assisted:  { bg: "#e3f5fb", under: "#0e7490", color: "#0b4f60" },
};
// Withheld span (engine did not classify): a neutral dashed "general note", no band claim.
export const SPAN_STYLE_WITHHELD = { bg: "#fff3cf", under: "#d4a72c", color: "#7a5712" };

export const manuH2 = { fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#16202e", margin: "0 0 9px" };
export const manuP = { fontSize: "0.9375rem", color: "#3a4456", lineHeight: 1.6, margin: "0 0 12px" };
export const oiaKick = { fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5rem", fontWeight: 600, letterSpacing: ".12em", color: "#b3ab9c", marginBottom: 6 };
export const critH3 = { fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#16202e", margin: "8px 0 5px" };

// No.136 G1 (§7 explainability): every generated section declares WHY it appeared - the
// triggering evidence + the governing spec section. Deterministic string, no LLM.
export function WhyLine({ why, sec }) {
  return <p style={{ margin: "0 0 6px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>shown because {why} {RS_DOT} {sec}</p>;
}

// One O-I-A finding card (Observation -> Interpretation -> Application), reused by every
// Critical-Read lens. Verbatim observation, deterministic interpretation, a counter-move to apply.
export function CritCard({ tag, obs, interp, appl, persona, accent, obsChip, onExpand }) {
  const ac = accent || "#9a6113";
  const who = persona || "SIGNAL AUDITOR";
  const oc = obsChip || "from posting";
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fbfaf8", borderBottom: "1px solid #f0eee7" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: ac, borderRadius: 4, padding: "2px 7px" }}>{String(tag).toUpperCase()}</span>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>{who}</span>
        {onExpand && (
          <button type="button" onClick={onExpand} aria-label={"Open " + who + " card in the detail drawer"} title="Open in drawer"
            style={{ marginLeft: "auto", flex: "none", minHeight: 28, minWidth: 44, border: "1px solid #e6e3db", background: "#fff", borderRadius: 6, cursor: "pointer", color: "#1a56db", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", padding: "0 8px" }}>expand</button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
          <div style={oiaKick}>OBSERVATION</div>
          <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.45, margin: "0 0 8px" }}>{String.fromCharCode(0x201c)}{obs}{String.fromCharCode(0x201d)}</p>
          <Chip kind={oc}>{oc}</Chip>
        </div>
        <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
          <div style={oiaKick}>INTERPRETATION</div>
          <p style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{interp}</p>
          {/* Audit fix: the confidence clause was a fixed "moderate" for every lens - an unearned,
    non-varying claim. "rule (deterministic)" is true and sufficient; per-lens confidence
    returns only if a lens actually computes one. */}
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#5b4bbd" }}>method {RS_DOT} rule (deterministic)</span>
        </div>
        <div style={{ padding: "12px 13px" }}>
          <div style={oiaKick}>APPLICATION</div>
          <p style={{ fontSize: "0.8125rem", color: "#16202e", fontWeight: 600, lineHeight: 1.5, margin: "0 0 8px" }}>{appl}</p>
          <Chip kind="derived">derived</Chip>
        </div>
      </div>
    </div>
  );
}

// Advisory (LLM) card for the batched Critical Read pass - devil's advocate, teleology,
// pro-worker, real-demand. Clearly tagged "AI estimate - advisory": it challenges, it never
// authors a number or overrides the engine's read.
export function AdvisoryCard({ persona, children, onExpand }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f5dcb0", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fff9f0", borderBottom: "1px solid #f5e6cc" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: "#9a6113", borderRadius: 4, padding: "2px 7px" }}>{persona}</span>
        <Chip kind="AI estimate">AI estimate {String.fromCharCode(0x00b7)} advisory</Chip>
        {onExpand && (
          <button type="button" onClick={onExpand} aria-label={"Open " + persona + " card in the detail drawer"} title="Open in drawer"
            style={{ marginLeft: "auto", flex: "none", minHeight: 28, minWidth: 44, border: "1px solid #f5dcb0", background: "#fff", borderRadius: 6, cursor: "pointer", color: "#1a56db", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", padding: "0 8px" }}>expand</button>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}


export function Chip({ kind, children }) {
  const p = PROV[kind] || PROV.computed;
  return <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: p.ink, background: p.bg, border: "1px solid " + p.border, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>{children}</span>;
}


// ── PB1 (v3-preinterview-brief-spec.md): the pre-interview brief - assembly only,
// no LLM, no new number. Every row is a sourced pass-through of a value already
// computed elsewhere (engine occExposure/ssocResolution, Critical Read's own
// indicators/salaryPos/blindSpots, and the shipped ACRA lookup). A row that has no
// source in state is simply omitted - it never blocks, errors, or guesses (spec §8).
export function PbRow({ label, chip, children }) {
  return (
    <div style={{ padding: "9px 0", borderBottom: "1px solid #f0eee7" }}>
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".08em", color: "#b3ab9c", marginBottom: 4 }}>{String(label).toUpperCase()}</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#16202e", lineHeight: 1.5, flex: "1 1 240px" }}>{children}</p>
        <Chip kind={chip}>{chip}</Chip>
      </div>
    </div>
  );
}

// Employer (ACRA) row - the one row with its own async fetch (module-cached,
// always-resolves). Surfaces ONLY matched:"exact" fields; on "none" shows the
// honest not-matched line, never the derived-classifier fallback (same guard the
// shipped fetchEmployerRegistration already applies before this component sees it).
export function PbEmployerRow({ employerName }) {
  const [emp, setEmp] = useState({ status: "idle", data: null });
  useEffect(() => {
    const name = String(employerName || "").trim();
    if (!name) { setEmp({ status: "done", data: { matched: "none", reason: "no_employer" } }); return undefined; }
    let cancelled = false;
    setEmp({ status: "loading", data: null });
    fetchEmployerRegistration(name).then((d) => { if (!cancelled) setEmp({ status: "done", data: d }); });
    return () => { cancelled = true; };
  }, [employerName]);
  if (emp.status !== "done") {
    return <PbRow label="Employer (ACRA)" chip="from ACRA">Checking ACRA registration{String.fromCharCode(0x2026)}</PbRow>;
  }
  const d = emp.data;
  if (!d || d.matched !== "exact") {
    return <PbRow label="Employer (ACRA)" chip="from ACRA">Not matched in the ACRA business register (may be a statutory board, agency, or a name variant ACRA does not carry).</PbRow>;
  }
  const parts = [d.entityType, d.status, d.registeredSince ? "registered " + d.registeredSince : null].filter(Boolean);
  const ssic = d.primarySsicCode ? d.primarySsicCode + (d.primarySsicDescription ? " - " + d.primarySsicDescription : "") : null;
  const ssic2 = d.secondarySsicCode ? d.secondarySsicCode + (d.secondarySsicDescription ? " - " + d.secondarySsicDescription : "") : null;
  return (
    <PbRow label="Employer (ACRA)" chip="from ACRA">
      {parts.length ? parts.join(" " + RS_DOT + " ") : "ACRA match found but no entity fields on record."}
      {ssic ? <span style={{ display: "block", marginTop: 3 }}>Primary SSIC: {ssic}</span> : null}
      {ssic2 ? <span style={{ display: "block", marginTop: 2 }}>Secondary SSIC: {ssic2}</span> : null}
      {d.namesakes > 0 ? <span style={{ display: "block", marginTop: 3, color: "#9a6113" }}>ACRA lists +{d.namesakes} other {d.namesakes === 1 ? "entity" : "entities"} with this name - showing the live-status match.</span> : null}
    </PbRow>
  );
}

export function PreInterviewBrief({ result, title, employer, posting, critical }) {
  const [open, setOpen] = useState(true);
  const ssoc = result && result.ssocResolution;
  const occ = result && result.occExposure;
  const indicators = (critical && critical.indicators) || [];
  const empType = indicators.find((x) => x.id === "ind-emptype");
  const triage = indicators.filter((x) => x.id !== "ind-emptype");
  const salaryPos = critical && critical.salaryPos;
  const blindSpots = (critical && critical.blindSpots) || [];
  const employerName = (posting && posting.employer) || employer || "";
  return (
    <div style={{ border: "1px solid #e6e3db", borderRadius: 12, overflow: "hidden", marginBottom: 16, background: "#fff" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44, padding: "10px 14px", background: open ? "#142a8e" : "#fbfaf8", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.875rem", fontWeight: 700, color: open ? "#fff" : "#16202e" }}>Pre-interview brief</span>
        <span aria-hidden="true" style={{ fontSize: "0.75rem", color: open ? "#c7d6ff" : "#94a0b0", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>&#9660;</span>
      </button>
      {open && (
        <div style={{ padding: "4px 14px 12px" }}>
          <PbRow label="Role as classified" chip="computed">
            {title || "role withheld"}{ssoc && ssoc.code ? " " + RS_DOT + " SSOC " + ssoc.code : ""}
          </PbRow>
          {(occ && (occ.band || occ.index != null)) ? (
            <PbRow label="AI-exposure headline" chip="computed">
              {occ.band || "band withheld"}{occ.index != null ? " " + RS_DOT + " AI-Exposure Index " + occ.index + "/100" : ""}
              {Array.isArray(occ.zRange) ? " " + RS_DOT + " range " + occ.zRange[0] + " to " + occ.zRange[1] : ""}
            </PbRow>
          ) : null}
          {empType ? <PbRow label="Engagement type" chip="from posting">{empType.obs}</PbRow> : null}
          {salaryPos ? <PbRow label="Salary read" chip="computed">{salaryPos.obs}</PbRow> : null}
          {triage.length > 0 ? (
            <PbRow label="Demand / triage" chip="computed">{triage.map((t) => t.obs).join(" " + RS_DOT + " ")}</PbRow>
          ) : null}
          <PbEmployerRow employerName={employerName} />
          {blindSpots.length > 0 ? (
            <PbRow label="Missing facts" chip="computed">The ad is silent on: {blindSpots.map((b) => b.label).join(", ")}.</PbRow>
          ) : null}
          <p style={{ margin: "10px 0 0", fontSize: "0.6875rem", color: "#6b6357", lineHeight: 1.5, fontStyle: "italic" }}>AI-assisted; human decides. Structural facts from MyCareersFuture, careers.gov.sg and ACRA; interpretation is the candidate's.</p>
        </div>
      )}
    </div>
  );
}

// ── W4a slice 1 (blueprint §10.3 "AI trace"): the AIOE exposure trace, deterministic.
// Occupation index (engine AIOE chain) -> per-duty engine bands on a labelled 4-stop
// track (position = band, no fabricated numbers) -> skill-level mix. No LLM anywhere in
// this visual; every row withholds when its engine signal is absent.
export const AIT_STOPS = ["human", "assisted", "augmented", "auto"];
export function AITracePanel({ result }) {
  const occ = result && result.occExposure;
  const duties = (result && result.jobAnatomy && !result.jobAnatomy.fallback && Array.isArray(result.jobAnatomy.duties)) ? result.jobAnatomy.duties : [];
  const skills = Array.isArray(result && result.skills) ? result.skills : [];
  const dutyRows = duties.map((d, i) => ({ id: "t" + i, text: d.text, band: RS_EXP_BAND[d.exposureNow] || null, band2y: RS_EXP_BAND[d.exposure2y] || null, layer: d.layer || "", basis: d.levelBasis || "" })).slice(0, 14);
  const classified = dutyRows.filter((d) => d.band);
  const mix = {}; skills.forEach((sk) => { const k = sk.level || "unclassified"; mix[k] = (mix[k] || 0) + 1; });
  if (!occ && !classified.length && !skills.length) {
    return <p style={{ fontSize: "0.875rem", color: "#94a0b0" }}>The AI trace appears once the engine classifies this role - no exposure signals yet, so nothing is drawn (withhold over guess).</p>;
  }
  const col = (b) => AIT_STOPS.indexOf(b);
  return (
    <div>
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".12em", color: "#6b6357", marginBottom: 6 }}>AI TRACE {RS_DOT} OCCUPATION {String.fromCharCode(0x2192)} DUTIES {String.fromCharCode(0x2192)} SKILLS</div>
      {/* Occupation row */}
      <div style={{ background: "#fbfaf8", border: "1px solid #eceae2", borderRadius: 10, padding: "10px 13px", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#b3ab9c", marginBottom: 4 }}>OCCUPATION EXPOSURE (AIOE ENGINE)</div>
        {occ && (occ.band || occ.index != null)
          ? <p style={{ margin: 0, fontSize: "0.875rem", color: "#16202e" }}><strong>{occ.band || "band withheld"}</strong>{occ.index != null ? " " + RS_DOT + " index " + occ.index + "/100" : ""} <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>{RS_DOT} occupation{String.fromCharCode(0x2192)}SOC{String.fromCharCode(0x2192)}AIOE {RS_DOT} computed</span></p>
          : <p style={{ margin: 0, fontSize: "0.8125rem", color: "#9a6113" }}>Occupation exposure withheld - the AIOE engine returned no score for this occupation.</p>}
      </div>
      {/* Duty track */}
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#b3ab9c", marginBottom: 4 }}>DUTIES ON THE EXPOSURE TRACK (SLE-C ENGINE BANDS {RS_DOT} POSITION = BAND, NOT A SCORE)</div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) repeat(4, 74px)", gap: 0, alignItems: "center", border: "1px solid #eceae2", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "6px 10px", background: "#f4f6fa", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>duty</div>
        {AIT_STOPS.map((b) => <div key={b} style={{ padding: "6px 4px", background: "#f4f6fa", textAlign: "center", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: BANDS[b].ink }}>{BANDS[b].label}</div>)}
        {dutyRows.map((d) => (
          <Fragment key={d.id}>
            {/* PR 3 (Part C.2 item 6): the trace row is a connector endpoint - "tN" indexes
                the same jobAnatomy.duties array as the O-I-A card "sN", a real id join. */}
            <div title={d.text} data-trace-anchor={d.id} style={{ padding: "7px 10px", borderTop: "1px solid #f0eee7", fontSize: "0.75rem", color: "#3a4456", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.text}</div>
            {AIT_STOPS.map((b, ci) => (
              <div key={b} style={{ borderTop: "1px solid #f0eee7", textAlign: "center", padding: "7px 0", background: d.band && ci === col(d.band) ? BANDS[b].bg : "transparent" }}>
                {d.band && ci === col(d.band)
                  ? <span title={BANDS[b].label + (d.band2y && d.band2y !== d.band ? " - rising to " + (BANDS[d.band2y] ? BANDS[d.band2y].label : d.band2y) + " in ~2y" : "")} style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: BANDS[b].dot }} />
                  : (ci === 0 && !d.band ? <span title="Exposure withheld - no engine signal" style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#9a6113" }}>w/h</span> : null)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
      {/* Skill mix */}
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#b3ab9c", marginBottom: 4 }}>SKILL-LEVEL MIX ({skills.length} SKILLS {RS_DOT} SLE-A ENGINE)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {[["HIGH", "auto"], ["MEDIUM", "augmented"], ["LOW", "assisted"], ["HUMAN", "human"]].map(([lv, bk]) => (mix[lv] ? <span key={lv} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: BANDS[bk].ink, background: BANDS[bk].bg, border: "1px solid " + BANDS[bk].border, borderRadius: 6, padding: "3px 9px" }}>{BANDS[bk].label}: {mix[lv]}</span> : null))}
        {mix.unclassified ? <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#9a6113", background: "#fff4e6", border: "1px solid #f5dcb0", borderRadius: 6, padding: "3px 9px" }}>withheld: {mix.unclassified}</span> : null}
      </div>
      <p style={{ margin: 0, fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357", fontStyle: "italic" }}>All positions and counts from the deterministic engines (AIOE occupation index, SLE-C duty bands, SLE-A skill levels). No LLM in this visual. AI-assisted {RS_DOT} human decides.</p>
    </div>
  );
}

