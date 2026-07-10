// v3/src/review/windows/Verdict.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";

export function renderWinVerdict(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus } = ctx;
  return (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>OVERVIEW {RS_DOT} THE 10-SECOND READ</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 14px" }}>Verdict first {String.fromCharCode(0x2014)} every chip is a door</h2>
              <PreInterviewBrief result={result} title={title} employer={employer} posting={posting} critical={critical} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(250px,100%), 1fr))", gap: 12 }}>
                {[
                  bandTok ? { k: "duties", kick: "AI EXPOSURE (ROLE READ)", val: bandTok.label, sub: duties.length + " duties " + RS_DOT + " " + skills.length + " skills", chipK: "computed" } : null,
                  critical.trajectory ? { k: "duties", kick: "AROUND THE CORNER", val: critical.trajectory.grade, sub: critical.trajectory.obs.slice(0, 64) + String.fromCharCode(0x2026), chipK: "computed" } : null,
                  critical.salaryPos ? { k: "market", kick: "MARKET POSITION", val: critical.salaryPos.pct + "th percentile", sub: "vs salary-stating ads in this result", chipK: "computed" } : null,
                  (critical.qoi.length || critical.hiringFilter.length) ? { k: "gates", kick: "GATES", val: (critical.qoi.length + critical.hiringFilter.length) + " to clear", sub: critical.hiringFilter.map((h) => h.label).slice(0, 3).join(" " + RS_DOT + " ") || "requirement lines graded", chipK: "computed" } : null,
                  (critical.contradictions.length || critical.blindSpots.length) ? { k: "critical", kick: "BIGGEST FLAG", val: critical.contradictions.length ? "role mash-up signals" : "silent on " + critical.blindSpots[0].label, sub: (critical.contradictions.length + critical.blindSpots.length) + " findings in Critical Read", chipK: "derived" } : null,
                ].filter(Boolean).map((c, i) => (
                  <button key={i} type="button" onClick={() => setTab(c.k)} aria-label={c.kick + ": " + c.val + ". Open its tab."}
                    style={{ textAlign: "left", minHeight: 96, background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, padding: "14px 16px", cursor: "pointer", boxShadow: "0 1px 3px rgba(20,32,46,.05)" }}>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".12em", color: "#b3ab9c", marginBottom: 6 }}>{c.kick}</div>
                    <div style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.125rem", color: "#16202e", marginBottom: 4 }}>{c.val}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.45, marginBottom: 6 }}>{c.sub}</div>
                    <Chip kind={c.chipK}>{c.chipK}</Chip>
                  </button>
                ))}
              </div>
              {!bandTok && !critical.trajectory && !critical.salaryPos && !critical.qoi.length && !critical.hiringFilter.length && !critical.contradictions.length && !critical.blindSpots.length && (
                <p style={manuP}>The verdict chips appear as the engines classify this role - nothing is summarised before it is computed.</p>
              )}
            </div>
  );
}
