// v3/src/review/windows/Shortcuts.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";

export function renderWinShortcuts(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus } = ctx;
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 8 }}>WORKSPACE SHORTCUTS</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[["Sources", "ad", "the verbatim ad and its provenance"], ["Trace", "duties", "duty-by-duty O-I-A dissection"], ["Skilling", "duties", "skills and the AI trace"], ["Advisory", "critical", "the challenged deep read"]].map(([lbl, dest, gloss]) => (
          <button key={lbl} type="button" onClick={() => setTab(dest)} aria-label={lbl + ": opens " + gloss}
            style={{ minHeight: 44, textAlign: "left", background: "#fff", border: "1px solid #e6e3db", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
            <span style={{ display: "block", fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e" }}>{lbl}</span>
            <span style={{ display: "block", fontSize: "0.6875rem", color: "#6b6357" }}>{gloss}</span>
          </button>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "0.6875rem", color: "#6b6357", lineHeight: 1.5 }}>Cover letter, Boards and Saved retired from the rail - they were placeholder drawers; they return as real windows when built (trust-loop: no dead controls).</p>
    </div>
  );
}
