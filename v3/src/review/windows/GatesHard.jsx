// v3/src/review/windows/GatesHard.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";

export function renderWinGatesHard(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus } = ctx;
  return (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>REQUIREMENTS &amp; GATES {RS_DOT} WHAT FILTERS YOU OUT</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 14px" }}>Can each claim be tested {String.fromCharCode(0x2014)} and what auto-rejects?</h2>
              {critical.hiringFilter.length > 0 && <>
                <h3 style={critH3}>Hard gates</h3>
                {critical.hiringFilter.map((h) => <CritCard key={h.id} tag={h.label} obs={h.obs} interp={h.why} appl="Meet it, show the equivalent, or expect an auto-reject before a human reads your CV." persona="HIRING FILTER" accent="#0e7490" obsChip={h.obsChip || "from posting"}
                  onExpand={(e) => openSheet("Hard gates", "critcard", { tag: h.label, obs: h.obs, interp: h.why, appl: "Meet it, show the equivalent, or expect an auto-reject before a human reads your CV.", persona: "HIRING FILTER", accent: "#0e7490", obsChip: h.obsChip || "from posting" }, e)} />)}
              </>}
              {!critical.hiringFilter.length && !critical.qoi.length && <p style={manuP}>No gate lines or gradeable requirement claims were found in this ad{critical.adText ? "" : " (no ad text available)"} - nothing is graded that was not written.</p>}
            </div>
  );
}
