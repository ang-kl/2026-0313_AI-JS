// v3/src/review/windows/OIA.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";

export function renderWinOIA(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus } = ctx;
  return (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>JOB AD DISSECTION {String.fromCharCode(0x00b7)} O-I-A LENS</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 6px" }}>Observation {String.fromCharCode(0x2192)} Interpretation {String.fromCharCode(0x2192)} Application</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55, margin: "0 0 16px", maxWidth: 640 }}>Nothing is interpreted that was not first observed; nothing applied that was not first interpreted. Every read traces back to a verbatim span.</p>
              {dissection.spans.map((s) => { const b = BANDS[s.band]; const lc = LENS[s.lens]; const oiaOn = activeSpan === s.id; return (
                <div key={s.id} data-oia-anchor={s.id} onClick={() => setActiveSpan(oiaOn ? null : s.id)}
                  style={{ background: "#fff", border: "1px solid " + (oiaOn ? "#1a56db" : "#e6e3db"), borderRadius: 12, overflow: "hidden", marginBottom: 8, cursor: "pointer", ...(oiaOn ? { outline: "2px solid #c7d6ff", outlineOffset: 2 } : {}) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fbfaf8", borderBottom: "1px solid #f0eee7" }}>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".05em", color: "#fff", background: lc, borderRadius: 4, padding: "2px 7px" }}>{s.lens} LENS</span>
                    {b && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: b.ink, background: b.bg, border: "1px solid " + b.border, borderRadius: 5, padding: "1px 7px" }}>{b.label}</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
                      <div style={oiaKick}>OBSERVATION</div>
                      <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.45, margin: "0 0 8px" }}>{String.fromCharCode(0x201c)}{s.text}{String.fromCharCode(0x201d)}</p>
                      {/* s.text is an AI-extracted duty (jobAnatomy / responsibilitiesData
                          from the LLM's normalise-and-dedupe pass, App.jsx SYSTEM_RESP), not
                          verbatim posting text - so the chip must not say "from posting".
                          Trust-loop rule 4. */}
                      <Chip kind="derived">derived · AI-extracted</Chip>
                    </div>
                    <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
                      <div style={oiaKick}>INTERPRETATION</div>
                      <p style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{s.layer ? s.layer + " work; " : ""}{b ? <>exposure reads <strong style={{ color: b.ink }}>{b.label}</strong>.</> : <>exposure <strong style={{ color: "#9a6113" }}>withheld</strong> - the engine did not classify this duty.</>}</p>
                      <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#5b4bbd" }}>method {String.fromCharCode(0x00b7)} {s.exposure ? "rule (engine)" : "none"} {String.fromCharCode(0x00b7)} conf {s.exposure ? "high" : "withheld"}</span>
                    </div>
                    <div style={{ padding: "12px 13px" }}>
                      <div style={oiaKick}>APPLICATION</div>
                      <p style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{b ? <>AIOE: {b.label} {String.fromCharCode(0x00b7)} route {String.fromCharCode(0x2192)} {s.band === "human" ? "candidate edge (proof)" : s.band === "auto" ? "governance check" : "AI-assist, human verify"}</> : <>AIOE withheld {String.fromCharCode(0x00b7)} no route emitted</>}</p>
                      <Chip kind={b ? "computed" : "unverified"}>{b ? "computed" : "unverified"}</Chip>
                    </div>
                  </div>
                </div>
              ); })}
              {!dissection.spans.length && <p style={manuP}>No duty spans to dissect yet.</p>}
            </div>
  );
}
