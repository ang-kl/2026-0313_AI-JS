// v3/src/review/windows/OIA.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";
import { SkillSuggest } from "../SkillSuggest.jsx";
import { SimilarRoles } from "../SimilarRoles.jsx";

export function renderWinOIA(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus, linkMode, linkDraft, onLinkPick, onLinkDragStart, rsTermSpans, focusTerm, setFocusTerm } = ctx;
  const T = (txt) => (rsTermSpans ? rsTermSpans(txt, skillTermRe, focusTerm, setFocusTerm) : txt);
  return (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>JOB AD DISSECTION {String.fromCharCode(0x00b7)} O-I-A LENS</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 6px" }}>Observation {String.fromCharCode(0x2192)} Interpretation {String.fromCharCode(0x2192)} Application</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55, margin: "0 0 16px", maxWidth: 640 }}>Nothing is interpreted that was not first observed; nothing applied that was not first interpreted. Every read traces back to a verbatim span.</p>
              {dissection.spans.map((s) => { const b = BANDS[s.band]; const lc = LENS[s.lens]; const oiaOn = activeSpan === s.id; return (
                <div key={s.id} data-oia-anchor={s.id} onClick={() => setActiveSpan(oiaOn ? null : s.id)}
                  style={{ background: "#fff", border: "1px solid " + (oiaOn ? "#1a56db" : "#e6e3db"), borderRadius: 12, overflow: "hidden", marginBottom: 8, cursor: "pointer", ...(oiaOn ? { outline: "2px solid #c7d6ff", outlineOffset: 2 } : {}) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fbfaf8", borderBottom: "1px solid #f0eee7" }}>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".05em", color: lc, background: `color-mix(in srgb, ${lc} 14%, white)`, border: `1px solid color-mix(in srgb, ${lc} 38%, white)`, borderRadius: 4, padding: "2px 7px" }}>{s.lens} LENS</span>
                    {b && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: b.ink, background: b.bg, border: "1px solid " + b.border, borderRadius: 5, padding: "1px 7px" }}>{b.label}</span>}
                    {linkMode && onLinkPick && (() => { const on = linkDraft && linkDraft.t === "oia" && linkDraft.id === s.id; return (
                      <button type="button" onClick={(e) => { e.stopPropagation(); onLinkPick({ t: "oia", id: s.id, quote: s.text }); }}
                        onPointerDown={onLinkDragStart ? (e) => { e.stopPropagation(); onLinkDragStart({ t: "oia", id: s.id, quote: s.text }, e); } : undefined}
                        aria-label={"Lock a link to this O-I-A card"} title="Drag to a responsibility to draw a locked link - or click to pick, then click a responsibility"
                        style={{ marginLeft: "auto", flex: "none", minHeight: 30, minWidth: 34, border: "1px solid " + (on ? "#1d4ed8" : "#c7d6ff"), background: on ? "#dbe6ff" : "#eef2ff", color: "#1d4ed8", borderRadius: 7, cursor: "grab", fontSize: "0.8125rem", touchAction: "none" }}>{String.fromCharCode(0x1f517)}</button>
                    ); })()}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
                      <div style={oiaKick}>OBSERVATION</div>
                      <p data-anchor-block={"oiaobs-" + s.id} style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.45, margin: "0 0 8px" }}>{String.fromCharCode(0x201c)}{T(s.text)}{String.fromCharCode(0x201d)}</p>
                      {/* s.text is an AI-extracted duty (jobAnatomy / responsibilitiesData
                          from the LLM's normalise-and-dedupe pass, App.jsx SYSTEM_RESP), not
                          verbatim posting text - so the chip must not say "from posting".
                          Trust-loop rule 4. */}
                      <Chip kind="derived">derived · AI-extracted</Chip>
                    </div>
                    <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
                      <div style={oiaKick}>INTERPRETATION</div>
                      <p style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{s.layer ? s.layer + " work; " : ""}{b ? <>exposure reads <strong style={{ color: b.ink }}>{b.label}</strong>.</> : <>AI-exposure <strong style={{ color: "#9a6113" }}>not scored</strong> for this duty.</>}</p>
                      {/* #2: the method/confidence line is engine provenance for a REAL band -
                          when nothing was scored it is just boilerplate, so it is hidden. */}
                      {s.exposure && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#5b4bbd" }}>method {String.fromCharCode(0x00b7)} rule (engine) {String.fromCharCode(0x00b7)} conf high</span>}
                    </div>
                    <div style={{ padding: "12px 13px" }}>
                      <div style={oiaKick}>APPLICATION</div>
                      {/* #1 plain language + #2 no boilerplate: with a real band, show the
                          AIOE read + routing and its computed chip; with nothing scored, say
                          so in plain words and drop the "no route emitted" jargon + the
                          unverified chip (there is no figure to attest). */}
                      {b ? (
                        <>
                          <p style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>AIOE: {b.label} {String.fromCharCode(0x00b7)} route {String.fromCharCode(0x2192)} {s.band === "human" ? "candidate edge (proof)" : s.band === "auto" ? "governance check" : "AI-assist, human verify"}</p>
                          <Chip kind="computed">computed</Chip>
                        </>
                      ) : (
                        <p style={{ fontSize: "0.6875rem", color: "#94a0b0", lineHeight: 1.5, margin: 0 }}>No AI-exposure score for this duty, so there{String.fromCharCode(0x2019)}s nothing to route yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ); })}
              {!dissection.spans.length && <p style={manuP}>No duty spans to dissect yet.</p>}
              {/* Brick 2: adjacent-skill suggestions from the GCN substrate service, at the
                  bottom of the dissection. Self-contained; renders nothing if the service is
                  unreachable or returns no suggestions (withhold-over-invent). */}
              <SkillSuggest skills={skills} />
              {/* Brick 3: adjacent-role suggestions from the substrate service, just below
                  the adjacent-skills panel. Self-contained; withholds when the service is
                  unreachable or returns no confident matches. */}
              <SimilarRoles skills={skills} />
            </div>
  );
}
