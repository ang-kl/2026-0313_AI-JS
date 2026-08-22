// v3/src/review/windows/Inspector.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";

export function renderWinInspector(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus } = ctx;
  return (
    <div>
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".13em", color: "#6b6357", marginBottom: 10 }}>INSPECTOR {RS_DOT} O-I-A</div>
            {/* AI-1: focused O-I-A card for the tapped span/pill - the "door" every element opens. */}
            {(() => {
              const sp = activeSpan ? dissection.spans.find((x) => x.id === activeSpan) : null;
              const so = (focusSkill != null && skillObjs[focusSkill]) ? skillObjs[focusSkill] : null;
              const f = so ? rsSkillFocus(so, dissection.spans) : (sp ? rsSpanFocus(sp, skillObjs, skillTermRe, skills) : null);
              if (!f) return null;
              const chip = (k, label) => { const c = PROV[k] || PROV.unverified; return <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, color: c.ink, background: c.bg, border: "1px solid " + c.border, borderRadius: 4, padding: "1px 6px" }}>{label || k}</span>; };
              return (
                <div style={{ border: "1.5px solid #1a56db", background: "#f5f8ff", borderRadius: 10, padding: "12px 13px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", color: "#142a8e" }}>{f.title.toUpperCase()} {RS_DOT} O-I-A</span>
                    <button onClick={() => { setActiveSpan(null); setFocusSkill(null); }} aria-label="Close analysis card" style={{ marginLeft: "auto", minHeight: 44, minWidth: 44, border: "1px solid #cdd9ff", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
                  </div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#6b6357", marginBottom: 3 }}>OBSERVATION</div>
                  <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.45, margin: "0 0 4px" }}>{String.fromCharCode(0x201c)}{f.obs}{String.fromCharCode(0x201d)}</p>
                  <div style={{ marginBottom: 9 }}>{chip(f.obsChip, f.obsChipLabel)}</div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#6b6357", marginBottom: 3 }}>INTERPRETATION</div>
                  {f.interp.map((ln, i) => <p key={i} style={{ fontSize: "0.75rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 3px" }}>{ln}</p>)}
                  {/* Reciprocity (Human Lead): the card links BACK into the ad - each invoking
                      duty is a jump link that highlights its line in the manuscript. */}
                  {f.invokedBy && f.invokedBy.length > 0 && (
                    <div style={{ margin: "2px 0 3px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#3a4456" }}>Invoked by: </span>
                      {f.invokedBy.map((iv) => (
                        <button key={iv.id} type="button"
                          aria-label={"Jump to duty in the ad: " + iv.text.slice(0, 70)}
                          onClick={() => { setActiveSpan(iv.id); const el = document.getElementById("li-" + iv.id); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                          style={{ display: "block", width: "100%", textAlign: "left", minHeight: 44, background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "4px 6px", cursor: "pointer", fontSize: "0.75rem", color: "#1a56db", textDecoration: "underline", textUnderlineOffset: 2, lineHeight: 1.4 }}>
                          {String.fromCharCode(0x201c)}{iv.text.slice(0, 70)}{iv.text.length > 70 ? String.fromCharCode(0x2026) : ""}{String.fromCharCode(0x201d)}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ margin: "3px 0 9px" }}>{chip(f.interpChip)}</div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#6b6357", marginBottom: 3 }}>APPLICATION</div>
                  <p style={{ fontSize: "0.75rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 4px" }}>{f.appl}</p>
                  {chip(f.applChip)}
                </div>
              );
            })()}
      {!activeSpan && focusSkill == null && <p style={{ fontSize: "0.8125rem", color: "#94a0b0", lineHeight: 1.5 }}>Tap any skill pill, evidence phrase or duty line - its Observation {RS_DOT} Interpretation {RS_DOT} Application card opens here.</p>}
    </div>
  );
}
