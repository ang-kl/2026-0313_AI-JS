// v3/src/review/windows/Critical.jsx - PR 1 (Part B.4): window body moved VERBATIM from
// ReviewStudio.jsx; ctx carries the component-state closure (built once per render
// in ReviewStudio, so renderWindow and all behaviour stay identical).
import { BANDS, PROV, LENS, PERSONA, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, AdvisoryCard, Chip, PreInterviewBrief, AITracePanel, manuH2, manuP, oiaKick, critH3 } from "../shared.jsx";
import { RS_DOT } from "../rs-rules.js";

export function renderWinCritical(ctx) {
  const { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus } = ctx;
  return (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>CRITICAL READ {RS_DOT} PLAIN-LANGUAGE CHECK</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 6px" }}>What the ad says {String.fromCharCode(0x2192)} what it leaves empty</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55, margin: "0 0 16px", maxWidth: 640 }}>Deterministic and verbatim-only: every flag is a phrase lifted straight from the posting. Empty or inflated wording gets a plain-language counter - the &quot;question-mark move&quot;.</p>
              {critical.noodles.length > 0 && <>
                <h3 style={critH3}>Word noodles {RS_DOT} shiny but empty</h3>
                {critical.noodles.map((n) => <CritCard key={n.id} tag={n.cat} obs={n.phrase} interp={n.why} appl={n.counter}
                  onExpand={(e) => openSheet("Word noodles", "critcard", { tag: n.cat, obs: n.phrase, interp: n.why, appl: n.counter }, e)} />)}
              </>}
              {critical.forensic.length > 0 && <>
                <h3 style={critH3}>Forensic reversal {RS_DOT} aspiration vs evidence</h3>
                {critical.forensic.map((f) => <CritCard key={f.id} tag="aspiration" obs={f.phrase} interp={f.why} appl={f.counter}
                  onExpand={(e) => openSheet("Forensic reversal", "critcard", { tag: "aspiration", obs: f.phrase, interp: f.why, appl: f.counter }, e)} />)}
              </>}
              {/* No.136 G2: the six deterministic lenses render severity-first (flex order =
                  deterministic rank) and are individually dismissible; hidden panels restore
                  from the chip row below. */}
              <div style={{ display: "flex", flexDirection: "column" }}>
              {hiddenPanels.length > 0 && (
                <div style={{ order: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, margin: "0 0 10px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.6875rem", color: "#6b6357" }}>hidden panels:</span>
                  {hiddenPanels.map((k) => (
                    <button key={k} type="button" onClick={() => setPanelHidden(k, false)} aria-label={"Restore panel: " + (G2_LABELS[k] || k)}
                      style={{ minHeight: 44, fontFamily: "monospace", fontSize: "0.6875rem", color: "#1d4ed8", background: "#eaf0ff", border: "1px solid #c7d6ff", borderRadius: 7, padding: "4px 10px", cursor: "pointer" }}>{(G2_LABELS[k] || k)} +</button>
                  ))}
                </div>
              )}
              <div style={{ order: g2Rank.blindSpots, display: "flex", flexDirection: "column" }}>
              {critical.blindSpots && critical.blindSpots.length > 0 && !hiddenPanels.includes("blindSpots") && <>
                <h3 style={critH3}>Blind spots {RS_DOT} what the ad does not say</h3>
                <WhyLine why={critical.blindSpots.length + " of 6 standard fields are absent from the ad text"} sec="spec No.135 AI-2" />
                {critical.blindSpots.map((b) => <CritCard key={b.id} tag={b.label} obs={"The ad is silent on " + b.label + "."} interp={"Checked the full ad text for any mention - none found. Silence on " + b.label + " is information: it is either unsettled or unfavourable."} appl={b.ask} persona="BLIND-SPOT SCAN" accent="#5b4bbd" obsChip="computed"
                  onExpand={(e) => openSheet("Blind spots", "critcard", { tag: b.label, obs: "The ad is silent on " + b.label + ".", interp: "Checked the full ad text for any mention - none found. Silence on " + b.label + " is information: it is either unsettled or unfavourable.", appl: b.ask, persona: "BLIND-SPOT SCAN", accent: "#5b4bbd", obsChip: "computed" }, e)} />)}
              <button type="button" onClick={() => setPanelHidden("blindSpots", true)} aria-label={"Hide panel: " + G2_LABELS.blindSpots} style={{ alignSelf: "flex-end", minHeight: 20, marginTop: -10, border: "none", background: "transparent", color: "#b3ab9c", fontFamily: "monospace", fontSize: "0.6875rem", cursor: "pointer", padding: "0 6px" }}>hide {String.fromCharCode(0x2715)}</button>
              </>}
              </div>
              <div style={{ order: g2Rank.contradictions, display: "flex", flexDirection: "column" }}>
              {critical.contradictions && critical.contradictions.length > 0 && !hiddenPanels.includes("contradictions") && <>
                <h3 style={critH3}>Contradictions {RS_DOT} lines that do not belong</h3>
                <WhyLine why={critical.contradictions.length + " duty line" + (critical.contradictions.length === 1 ? " sits" : "s sit") + " outside the ad's majority domain"} sec="spec No.135 AI-2" />
                {critical.contradictions.map((x) => <CritCard key={x.id} tag="mash-up" obs={x.obs} interp={"This line reads as " + x.foreign + ", but the ad's majority domain is " + x.majority + " - a role mash-up or template splice."} appl="Ask which of the two jobs the hire actually owns - and which one performance is judged on." persona="CONTRADICTION SCAN" accent="#0e7490" obsChip="derived"
                  onExpand={(e) => openSheet("Contradictions", "critcard", { tag: "mash-up", obs: x.obs, interp: "This line reads as " + x.foreign + ", but the ad's majority domain is " + x.majority + " - a role mash-up or template splice.", appl: "Ask which of the two jobs the hire actually owns - and which one performance is judged on.", persona: "CONTRADICTION SCAN", accent: "#0e7490", obsChip: "derived" }, e)} />)}
              <button type="button" onClick={() => setPanelHidden("contradictions", true)} aria-label={"Hide panel: " + G2_LABELS.contradictions} style={{ alignSelf: "flex-end", minHeight: 20, marginTop: -10, border: "none", background: "transparent", color: "#b3ab9c", fontFamily: "monospace", fontSize: "0.6875rem", cursor: "pointer", padding: "0 6px" }}>hide {String.fromCharCode(0x2715)}</button>
              </>}
              </div>
              
              
              
              
              </div>
              {critical.falsification.length > 0 && <>
                <h3 style={critH3}>Falsification {RS_DOT} before you trust this read</h3>
                {critical.falsification.map((f) => <CritCard key={f.id} tag={f.tag} obs={f.obs} interp={f.interp} appl={f.appl} persona="FALSIFICATION LENS" accent="#5b4bbd" obsChip="computed"
                  onExpand={(e) => openSheet("Falsification", "critcard", { tag: f.tag, obs: f.obs, interp: f.interp, appl: f.appl, persona: "FALSIFICATION LENS", accent: "#5b4bbd", obsChip: "computed" }, e)} />)}
              </>}
              {cr && (
                (cr.devilsAdvocate && (cr.devilsAdvocate.counterCase || (cr.devilsAdvocate.challenges && cr.devilsAdvocate.challenges.length))) ||
                cr.realDemand || (cr.teleology && (cr.teleology.whyExists || cr.teleology.problem)) ||
                (cr.proWorker && (cr.proWorker.verdict || cr.proWorker.reasoning))
              ) && <>
                <h3 style={critH3}>Deep read {RS_DOT} challenged</h3>
                {cr.devilsAdvocate && (cr.devilsAdvocate.counterCase || (cr.devilsAdvocate.challenges && cr.devilsAdvocate.challenges.length > 0)) && (
                  <AdvisoryCard persona="SKEPTIC / DEVIL'S ADVOCATE">
                    {cr.devilsAdvocate.counterCase && <p style={{ margin: "0 0 8px", fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.devilsAdvocate.counterCase}</p>}
                    {cr.devilsAdvocate.challenges && cr.devilsAdvocate.challenges.length > 0 && <ul style={{ margin: 0, paddingLeft: 18 }}>{cr.devilsAdvocate.challenges.map((c, i) => <li key={i} style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, marginBottom: 4 }}>{c}</li>)}</ul>}
                  </AdvisoryCard>
                )}
                {cr.ach && cr.ach.likely && (
                  <AdvisoryCard persona="COMPETING HYPOTHESES (ACH)">
                    <p style={{ margin: "0 0 6px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75rem", color: "#16202e" }}>most consistent with the evidence {RS_DOT} <strong style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>{cr.ach.likely}</strong></p>
                    {cr.ach.read && <p style={{ margin: "0 0 8px", fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.ach.read}</p>}
                    {cr.ach.hypotheses && cr.ach.hypotheses.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {cr.ach.hypotheses.map((h, i) => <li key={i} style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, marginBottom: 4 }}><strong style={{ color: "#16202e" }}>{h.name}:</strong> {h.signal}</li>)}
                      </ul>
                    )}
                  </AdvisoryCard>
                )}
                {cr.realDemand && (
                  <AdvisoryCard persona="FALSIFICATION / REAL DEMAND">
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.realDemand}</p>
                  </AdvisoryCard>
                )}
                {cr.teleology && (cr.teleology.whyExists || cr.teleology.problem) && (
                  <AdvisoryCard persona="VACANCY TELEOLOGY">
                    {cr.teleology.whyExists && <p style={{ margin: "0 0 6px", fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}><strong style={{ color: "#16202e" }}>Why this job exists:</strong> {cr.teleology.whyExists}</p>}
                    {cr.teleology.problem && <p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}><strong style={{ color: "#16202e" }}>Problem it solves:</strong> {cr.teleology.problem}</p>}
                  </AdvisoryCard>
                )}
                {cr.proWorker && (cr.proWorker.verdict || cr.proWorker.reasoning) && (
                  <AdvisoryCard persona="PRO-WORKER TEST">
                    {cr.proWorker.verdict && <p style={{ margin: "0 0 6px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75rem", color: "#16202e" }}>verdict {RS_DOT} <strong style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>{cr.proWorker.verdict}</strong></p>}
                    {cr.proWorker.reasoning && <p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.proWorker.reasoning}</p>}
                  </AdvisoryCard>
                )}
              </>}
              {(cr && cr.hiring && (cr.hiring.recruiter || cr.hiring.hiringManager || cr.hiring.interviewCoach)) && <>
                <h3 style={critH3}>The other side of the table</h3>
                {cr && cr.hiring && cr.hiring.recruiter && <AdvisoryCard persona="RECRUITER"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.recruiter}</p></AdvisoryCard>}
                {cr && cr.hiring && cr.hiring.hiringManager && <AdvisoryCard persona="HIRING MANAGER"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.hiringManager}</p></AdvisoryCard>}
                {cr && cr.hiring && cr.hiring.interviewCoach && <AdvisoryCard persona="INTERVIEW COACH"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.interviewCoach}</p></AdvisoryCard>}
              </>}
              {!critical.noodles.length && !critical.forensic.length && !critical.falsification.length && !critical.hiringFilter.length && !(critical.blindSpots && critical.blindSpots.length) && !(critical.contradictions && critical.contradictions.length) && !(critical.qoi && critical.qoi.length) && !(critical.indicators && critical.indicators.length) && !critical.trajectory && !critical.salaryPos && !cr && <p style={manuP}>{critical.adText ? "This posting reads plainly - no empty phrasing, inflated language, or template/mash-up/compliance signals flagged. The challenged deep read (AI-assisted) appears here once it finishes." : "No posting text available to run the plain-language check."}</p>}
            </div>
  );
}
