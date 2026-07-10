// v3/src/review/windows/Manuscript.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";

export function renderWinManuscript(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus } = ctx;
  return (

            <div style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, padding: "18px 22px 24px", boxShadow: "0 1px 3px rgba(20,32,46,.05)" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 8 }}>MANUSCRIPT {String.fromCharCode(0x00b7)} {(employer || "LIVE POSTING").toUpperCase()}</div>
              <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.55rem", lineHeight: 1.18, color: "#16202e", margin: "0 0 10px" }}>{title || "this role"}</h1>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {/* Chip scopes to the overview paragraph only. The Responsibilities heading
                    below carries its OWN provenance chip so a page mixing verbatim intro +
                    synthesis bullets never lies about either half. Trust-loop rule 4. */}
                <Chip kind={hasVerbatimOverview ? "from MCF" : "AI estimate"}>{String.fromCharCode(0x25cf)} {source || "from MCF"} {String.fromCharCode(0x00b7)} overview {hasVerbatimOverview ? "verbatim" : "synthesis · AI-authored"}</Chip>
                {bandTok && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: bandTok.ink, background: bandTok.bg, border: "1px solid " + bandTok.border, borderRadius: 5, padding: "2px 7px" }}>{bandTok.label}</span>}
              </div>
              {/* Composite (PR #306 x v3.0.228): verbatim-first overview (trust-loop rule 4 -
                  posting's own words when present, skill terms underlined for emphasis only),
                  falling back to the sectioniser, then the ESCO taxonomy description (verbatim,
                  deterministic - the role path's real data when no live ads exist), then the
                  corpus summary. */}
              {(() => {
                if (hasVerbatimOverview) return <><h2 style={manuH2}>Role overview</h2><p style={manuP}>{rsUnderlineSkillTerms(overview, skillTermRe)}</p></>;
                const ov = adSections.find((sec) => sec.canon === "Role overview" && sec.lines.length > 0);
                if (ov) return <><h2 style={manuH2}>Role overview</h2>{ov.lines.map((ln, i) => <p key={i} style={manuP}>{rsUnderlineSkillTerms(ln, skillTermRe)}</p>)}</>;
                if (overview) return <><h2 style={manuH2}>Role overview</h2><p style={manuP}>{overview}</p></>;
                const escoDesc = String((result && result.description) || "").trim();
                if (escoDesc) return <><h2 style={manuH2}>Role overview <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>verbatim · ESCO taxonomy</span></h2><p style={manuP}>{rsUnderlineSkillTerms(escoDesc, skillTermRe)}</p></>;
                return null;
              })()}
              {/* LOOP-1 diagnosis (Human Lead: "step 3 keeps having issues to show ads and
                  diagnosis"): when the live-postings pipeline fell back, SAY WHY - the reason
                  was previously swallowed and the page just went quiet. Deterministic reason
                  map + retry, never a silent dead end. */}
              {(() => {
                const rdd = result && result.responsibilitiesData;
                if (!rdd || !rdd.fallback) return null;
                const REASONS = {
                  no_jobs: "No live SG postings found for this title right now (MyCareersFuture + careers.gov.sg were searched).",
                  mcf_error: "The live-postings fetch failed (network or source error).",
                  thin_corpus: "Live ads were found, but their text was too thin to analyse" + (rdd.jobCount ? " (" + rdd.jobCount + " ad" + (rdd.jobCount === 1 ? "" : "s") + " sampled)" : "") + ".",
                  analysis_error: "The duty-analysis step failed on the sampled ads.",
                  empty_analysis: "The analysis returned no usable duty lines from the sampled ads.",
                };
                return (
                  <div style={{ background: "#fdf3dc", border: "1px solid #f0e1b3", borderRadius: 10, padding: "12px 14px", margin: "0 0 18px" }}>
                    <p style={{ margin: "0 0 4px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", color: "#7a5a17" }}>WHY THERE ARE NO DUTY LINES HERE</p>
                    <p style={{ margin: "0 0 8px", fontSize: "0.8125rem", color: "#7a5a17", lineHeight: 1.55 }}>{REASONS[rdd.reason] || "The live-postings pipeline returned no duties (reason: " + (rdd.reason || "unknown") + ")."} The skills below and the taxonomy overview above are still real, named-source data.</p>
                    {onRetryDuties && (
                      <button type="button" onClick={onRetryDuties} style={{ minHeight: 44, padding: "8px 14px", borderRadius: 8, border: "1px solid #d9b96a", background: "#fff", color: "#7a5a17", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>Retry live postings</button>
                    )}
                  </div>
                );
              })()}
              {dissection.spans.filter((x) => x.sec !== "req").length > 0 && <>
                {/* Interactive duty spans (nucleus highlights, band-styled, tappable) - the
                    text is AI-extracted (jobAnatomy normalise pass), so the heading chip says
                    so rather than claiming verbatim. Trust-loop rule 4. */}
                <h2 style={manuH2}>Responsibilities <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#9a6113", background: "#fff4e6", border: "1px solid #f5dcb0", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>AI-extracted · tap a phrase</span></h2>
                <ul style={{ margin: "0 0 18px", paddingLeft: 18 }}>
                  {dissection.spans.filter((x) => x.sec !== "req").map((s) => {
                    if (showClean) return <li key={s.id} style={{ ...manuP, marginBottom: 7 }}>{s.text}</li>;
                    // RS-EV: highlight only an EVIDENCE-linked phrase (skill match / gate);
                    // no evidence -> the line renders fully plain (Human Lead doctrine).
                    const ev = rsEvidencePhrase(s.text, skillTermRe, skills);
                    const navOn = activeSpan === s.id; // reciprocal jump feedback (nav ring, not decoration)
                    if (!ev) return <li key={s.id} id={"li-" + s.id} style={{ ...manuP, marginBottom: 8, ...(navOn ? { outline: "2px solid #c7d6ff", outlineOffset: 3, borderRadius: 6 } : {}) }}>{s.text}</li>;
                    const withheld = !s.band; const st = s.band ? SPAN_STYLE[s.band] : SPAN_STYLE_WITHHELD; const on = activeSpan === s.id;
                    const mark = (
                      <span role="button" tabIndex={0} aria-pressed={on}
                        aria-label={s.text + ". " + ev.why + ". " + (withheld ? "Exposure withheld." : (BANDS[s.band] ? "Exposure " + BANDS[s.band].label + "." : ""))}
                        title={ev.why + (withheld ? " - exposure withheld" : (BANDS[s.band] ? " - " + BANDS[s.band].label : "")) + " - click to analyse"}
                        onClick={() => setActiveSpan(on ? null : s.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSpan(on ? null : s.id); } }}
                        style={{ cursor: "pointer", background: st.bg, color: st.color, borderBottom: "2px " + (withheld ? "dashed " : "solid ") + st.under, borderRadius: 3, padding: "0 2px", boxShadow: on ? "0 0 0 3px rgba(26,86,219,.28)" : "none" }}>{ev.phrase}</span>
                    );
                    return (
                      <li key={s.id} id={"li-" + s.id} style={{ ...manuP, marginBottom: 8, ...(navOn ? { outline: "2px solid #c7d6ff", outlineOffset: 3, borderRadius: 6 } : {}) }}>
                        {ev.pre ? ev.pre + " " : ""}{mark}{ev.post || ""}
                      </li>
                    );
                  })}
                </ul>
              </>}
              {/* RS-SEC: the ad's OTHER sections (Requirements, Qualifications, Benefits, and any
                  section the ad names itself) - verbatim, with the ad's own heading + a chip that
                  says so; skill terms underlined for emphasis (words untouched). Requirement
                  lines that joined the analysis are tappable like duties (exposure withheld). */}
              {adSections.filter((sec) => sec.canon !== "Role overview" && sec.canon !== "Responsibilities" && sec.lines.length > 0).map((sec, si) => (
                <div key={"sec" + si}>
                  <h2 style={manuH2}>{sec.canon || sec.title} <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>verbatim · from posting</span></h2>
                  <ul style={{ margin: "0 0 18px", paddingLeft: 18 }}>
                    {sec.lines.map((ln, li) => {
                      const sp = dissection.spans.find((x) => x.sec === "req" && x.text === ln);
                      if (!sp || showClean) return <li key={li} style={{ ...manuP, marginBottom: 7 }}>{ln}</li>;
                      // RS-EV: same doctrine as duties - evidence phrase or fully plain.
                      const ev = rsEvidencePhrase(ln, skillTermRe, skills);
                      if (!ev) return <li key={li} style={{ ...manuP, marginBottom: 8 }}>{ln}</li>;
                      const on = activeSpan === sp.id; const st = SPAN_STYLE_WITHHELD;
                      const mark = (
                        <span role="button" tabIndex={0} aria-pressed={on}
                          aria-label={ln + ". " + ev.why + ". In the analysis; exposure withheld (requirements are not duty spans)."}
                          title={ev.why + " - click to analyse"}
                          onClick={() => setActiveSpan(on ? null : sp.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSpan(on ? null : sp.id); } }}
                          style={{ cursor: "pointer", background: st.bg, color: st.color, borderBottom: "2px dashed " + st.under, borderRadius: 3, padding: "0 2px", boxShadow: on ? "0 0 0 3px rgba(26,86,219,.28)" : "none" }}>{ev.phrase}</span>
                      );
                      return <li key={li} style={{ ...manuP, marginBottom: 8 }}>{ev.pre ? ev.pre + " " : ""}{mark}{ev.post || ""}</li>;
                    })}
                  </ul>
                </div>
              ))}
              {skills.length > 0 && <>
                <h2 style={manuH2}>Skills the posting asks for <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>tap a skill to analyse</span>
                  {/* W2: say HOW the skill set was anchored - SG-first when SSOC steered it. */}
                  {result && result.ssocResolution && <span title={"Occupation resolved in SSOC 2024 (" + result.ssocResolution.code + " " + result.ssocResolution.title + ", confidence " + result.ssocResolution.confidence + "), crosswalked to ISCO-08 " + result.ssocResolution.iscoTitle + ", then ESCO skills fetched on that clean occupation name - not a blind title match."} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#1d4ed8", background: "#eaf0ff", border: "1px solid #c7d6ff", borderRadius: 5, padding: "1px 6px", marginLeft: 6, verticalAlign: "middle" }}>{String.fromCodePoint(0x1f1f8, 0x1f1ec)} anchored via SSOC {result.ssocResolution.code}</span>}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.slice(0, 24).map((s, i) => { const on = focusSkill === i; return (
                  <button key={i} type="button" aria-pressed={on} aria-label={"Analyse skill: " + s}
                    title={(skillObjs[i] && skillObjs[i].level ? "engine level " + skillObjs[i].level + " - " : "") + "click to analyse (O-I-A)"}
                    onClick={() => { setFocusSkill(on ? null : i); if (!on) setActiveSpan(null); }}
                    style={{ minHeight: 44, fontSize: "0.8125rem", fontFamily: "inherit", color: on ? "#fff" : "#0b5e74", background: on ? "#0e7490" : "#e3f5fb", border: "1px solid " + (on ? "#0e7490" : "#bce6f0"), borderRadius: 14, padding: "6px 12px", cursor: "pointer" }}>{s}</button>
                ); })}</div>
              </>}
              {!overview && !dissection.spans.length && <p style={manuP}>The analysed posting did not yield responsibilities text to render as a manuscript.</p>}
            </div>
  );
}
