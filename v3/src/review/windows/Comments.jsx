// v3/src/review/windows/Comments.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";

export function renderWinComments(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus, setPreviewSpan } = ctx;
  const dutySpansC = dissection.spans.filter((x) => x.sec !== "req");
  const nDone = marginComments.filter((c) => commentStatus[c.id]).length;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".13em", color: "#6b6357" }}>REVIEWER COMMENTS</span>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>{nDone}/{marginComments.length} decided</span>
      </div>
      {marginComments.length === 0 && <p style={{ fontSize: "0.8125rem", color: "#586474" }}>No comments for this analysis yet.</p>}


            {marginComments.map((c) => {
              const pcol = PERSONA[c.persona] || "#64748b"; const st = commentStatus[c.id]; const active = activeSpan === c.anchor;
              const cb = c.band && BANDS[c.band] ? BANDS[c.band] : null; const anchorText = (dissection.spans.find((s) => s.id === c.anchor) || {}).text || "";
              const dutyNo = dutySpansC.findIndex((s) => s.id === c.anchor) + 1; // 0 = not a duty line
              return (
                <div key={c.id} data-comment-anchor={c.anchor} role="button" tabIndex={0}
                  aria-label={c.persona + "'s " + c.type + " comment" + (dutyNo > 0 ? ", linked to highlighted duty " + dutyNo : "") + (st ? ". Decision: " + st + "." : ". Pending decision.")}
                  onClick={() => setActiveSpan(c.anchor)}
                  onMouseEnter={() => setPreviewSpan && setPreviewSpan(c.anchor)}
                  onMouseLeave={() => setPreviewSpan && setPreviewSpan(null)}
                  onFocus={() => setPreviewSpan && setPreviewSpan(c.anchor)}
                  onBlur={() => setPreviewSpan && setPreviewSpan(null)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSpan(c.anchor); } }}
                  style={{ cursor: "pointer", border: "1.5px solid " + (active ? "#1a56db" : st === "accepted" ? "#cce6d4" : st === "rejected" ? "#ecdada" : "#eceae2"), background: active ? "#f5f8ff" : "#fff", borderRadius: 10, padding: "12px 13px", marginBottom: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: "50%", background: pcol, color: "#fff", fontSize: 10, lineHeight: "18px", textAlign: "center", flex: "none" }}>{String.fromCharCode(0x2726)}</span>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: pcol }}>{c.persona}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#64748b", background: "#f1f4f8", border: "1px solid #e3e8ef", borderRadius: 5, padding: "1px 6px" }}>{c.type}</span>
                  </div>
                  {cb && <div style={{ marginBottom: 7 }}><span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: cb.ink, background: cb.bg, border: "1px solid " + cb.border, borderRadius: 5, padding: "1px 6px" }}>{cb.label}</span></div>}
                  {anchorText && <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#52607a", borderLeft: "2px solid #d9d6cd", paddingLeft: 9, margin: "0 0 8px", lineHeight: 1.4 }}>{String.fromCharCode(0x201c)}{anchorText}{String.fromCharCode(0x201d)}</p>}
                  <p style={{ fontSize: "0.8rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{c.reason}</p>
                  {c.type === "suggested rewrite" && (
                    <div style={{ background: "#f6fbf7", border: "1px solid #d8ecdd", borderRadius: 8, padding: "8px 9px", marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#9a6113", textDecoration: "line-through", lineHeight: 1.4, marginBottom: 3 }}>{c.original}</div>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#0e7490", lineHeight: 1.4 }}>{String.fromCharCode(0x2192)} {c.suggested}</div>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: st ? 0 : 9 }}>
                    <Chip kind={c.prov}>{c.prov}</Chip>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#a8a193" }}>conf {String.fromCharCode(0x00b7)} {c.conf}</span>
                  </div>
                  {/* Accept/Reject as REVERSIBLE toggles (goal §10 / handoff): both stay
                      visible; the chosen one renders solid with a check + aria-pressed;
                      clicking it again returns the comment to pending. Text labels +
                      shape carry the state - never colour alone. Decisions persist per
                      posting on this device (localStorage), disclosed inline. */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <button aria-pressed={st === "accepted"}
                      onClick={(e) => { e.stopPropagation(); setCommentStatus((m) => ({ ...m, [c.id]: m[c.id] === "accepted" ? undefined : "accepted" })); }}
                      style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.6875rem", fontWeight: 700, color: st === "accepted" ? "#fff" : "#142a8e", background: st === "accepted" ? "#142a8e" : "#fff", border: "1.5px solid #142a8e", borderRadius: 7, padding: "6px 11px", cursor: "pointer", minHeight: 44 }}>
                      {st === "accepted" ? "Accepted " + String.fromCharCode(0x2713) : "Accept"}</button>
                    <button aria-pressed={st === "rejected"}
                      onClick={(e) => { e.stopPropagation(); setCommentStatus((m) => ({ ...m, [c.id]: m[c.id] === "rejected" ? undefined : "rejected" })); }}
                      style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.6875rem", fontWeight: 700, color: st === "rejected" ? "#fff" : "#92450a", background: st === "rejected" ? "#92450a" : "#fff", border: "1.5px solid " + (st === "rejected" ? "#92450a" : "#d9b96a"), borderRadius: 7, padding: "6px 11px", cursor: "pointer", minHeight: 44 }}>
                      {st === "rejected" ? "Rejected " + String.fromCharCode(0x2717) : "Reject"}</button>
                    {st && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#586474" }}>saved on this device {String.fromCharCode(0x00b7)} tap again to undo</span>}
                  </div>
                  {/* This decision applies to THIS comment only - it does not validate
                      or reject the analysis as a whole (goal §10 last rule). */}
                </div>
              );
            })}
    </div>
  );
}
