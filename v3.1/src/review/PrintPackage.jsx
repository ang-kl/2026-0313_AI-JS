import { useEffect } from "react";
import { createPortal } from "react-dom";

const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
const list = (value) => Array.isArray(value) ? value : [];

function skillName(skill) {
  return clean(typeof skill === "string" ? skill : skill && (skill.skill || skill.name || skill.label || skill.preferredLabel));
}

function personSkillsOf(result) {
  const person = result && (result.personEvidence || result.person || result.candidate || result.userProfile || result.profile);
  return list(person && (person.skills || person.capabilities || person.skillEvidence)).map(skillName).filter(Boolean);
}

function Withheld({ children }) {
  return <p className="v31-print-withheld"><b>WITHHELD</b> · {children}</p>;
}

function PrintMeta({ source, confidence }) {
  return (
    <div className="v31-print-meta">
      <span>Source · {source || "source withheld"}</span>
      <span>Confidence · {confidence || "withheld"}</span>
      <span>Time-window · snapshot at analysis</span>
    </div>
  );
}

function Section({ number, title, children, pageBreak }) {
  return (
    <section className={`v31-print-section ${pageBreak ? "page-break" : ""}`}>
      <div className="v31-print-section-head"><span>{number}</span><h2>{title}</h2></div>
      {children}
    </section>
  );
}

export default function PrintPackage({
  open, variant, setVariant, onClose, result, title, employer, source,
  confidence, dissection, comments, decisions, critical,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const spans = list(dissection && dissection.spans);
  const dutySpans = spans.filter((span) => span.sec !== "req");
  const requirementSpans = spans.filter((span) => span.sec === "req");
  const reviewComments = list(comments);
  const accepted = reviewComments.filter((comment) => decisions[comment.id] === "accepted");
  const rejected = reviewComments.filter((comment) => decisions[comment.id] === "rejected");
  const pending = reviewComments.filter((comment) => !decisions[comment.id]);
  const interviewRows = [
    ...list(critical && critical.blindSpots).map((item) => ({ text: item.ask, provenance: "computed from an absent field" })),
    ...list(critical && critical.falsification).map((item) => ({ text: item.appl, provenance: "computed falsification check" })),
    ...list(critical && critical.hiringFilter).map((item) => ({ text: `Confirm how the ${item.label} is applied: ${item.obs}`, provenance: item.obsChip || "derived" })),
  ].filter((row) => clean(row.text)).slice(0, 10);
  const advisoryQuestion = clean(result && result.criticalRead && result.criticalRead.hiring && result.criticalRead.hiring.interviewCoach);
  if (advisoryQuestion) interviewRows.unshift({ text: advisoryQuestion, provenance: "AI-assisted interview coaching" });

  const roleSkills = list(result && result.skills).map(skillName).filter(Boolean);
  const personSkills = personSkillsOf(result);
  const personSet = new Set(personSkills.map((skill) => skill.toLowerCase()));
  const missingSkills = personSkills.length ? roleSkills.filter((skill) => !personSet.has(skill.toLowerCase())) : [];
  const roleName = clean(title) || "Role evidence withheld";
  const orgName = clean(employer) || "Organisation evidence withheld";

  return createPortal((
    <div className="v31-print-overlay" role="dialog" aria-modal="true" aria-label="Print review package">
      <style>{`
        .v31-print-overlay{position:fixed;inset:0;z-index:100100;background:rgba(17,24,39,.7);display:grid;grid-template-rows:auto minmax(0,1fr);font-family:"Spline Sans",Arial,sans-serif;color:#172033}
        .v31-print-controls{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 18px;background:#14204f;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.22)}
        .v31-print-controls h2{font:600 18px/1.2 "Newsreader",Georgia,serif;margin:0}.v31-print-controls p{font-size:11px;color:#c9d2ee;margin:2px 0 0}
        .v31-print-actions,.v31-print-switch{display:flex;align-items:center;gap:7px}.v31-print-controls button{min-height:44px;border:1px solid #8ea4db;border-radius:7px;background:#fff;color:#14204f;padding:0 13px;font-size:12px;font-weight:800;cursor:pointer}.v31-print-controls button.on{background:#dbe5ff;border-color:#fff}.v31-print-controls .primary{background:#fff;color:#14204f}.v31-print-controls .close{background:transparent;color:#fff}
        .v31-print-scroll{overflow:auto;padding:26px;background:#e6ebf2}.v31-print-package{width:min(920px,100%);margin:0 auto;background:#fff;box-shadow:0 12px 42px rgba(30,45,75,.2);padding:54px 62px}
        .v31-print-kicker{font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#1a56db;margin:0 0 8px}.v31-print-package h1{font:700 36px/1.04 "Newsreader",Georgia,serif;margin:0;color:#172033}.v31-print-subtitle{font-size:14px;color:#586474;margin:8px 0 20px}.v31-print-meta{display:flex;flex-wrap:wrap;gap:8px 18px;border-top:2px solid #172033;border-bottom:1px solid #cbd5e1;padding:9px 0;font:700 9px/1.4 "Spline Sans Mono",monospace;color:#465268}
        .v31-print-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}.v31-print-stat{border:1px solid #cbd5e1;padding:10px}.v31-print-stat b{display:block;font:700 22px/1 "Newsreader",Georgia,serif;margin-bottom:4px}.v31-print-stat span{font-size:10px;color:#586474}
        .v31-print-section{margin-top:28px}.v31-print-section-head{display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #172033;padding-bottom:6px;margin-bottom:12px}.v31-print-section-head>span{font:800 10px/1 "Spline Sans Mono",monospace;color:#1a56db}.v31-print-section h2{font:700 21px/1.2 "Newsreader",Georgia,serif;margin:0}.v31-print-section h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 7px;color:#465268}
        .v31-print-list{margin:0;padding-left:19px}.v31-print-list li{font-size:11px;line-height:1.5;margin:0 0 7px}.v31-print-list li::marker{font-family:"Spline Sans Mono",monospace;color:#1a56db}.v31-print-markup{border-left:2px solid #d8e1ef;padding:0 0 0 12px;margin:0 0 12px}.v31-print-markup>p{font:italic 12px/1.5 "Newsreader",Georgia,serif;margin:0 0 6px}.v31-print-note{border-top:1px solid #e2e8f0;padding:7px 0;font-size:10px;line-height:1.45}.v31-print-note b{font-family:"Spline Sans Mono",monospace;color:#1a56db}.v31-print-state{display:inline-block;border:1px solid #94a3b8;padding:1px 5px;margin-left:5px;font:800 8px/1.4 "Spline Sans Mono",monospace;text-transform:uppercase}.v31-print-withheld{border:1px dashed #b45309;background:#fffbeb;color:#74420c;padding:10px 12px;font-size:10px;line-height:1.5}.v31-print-ledger{width:100%;border-collapse:collapse;font-size:9px}.v31-print-ledger th,.v31-print-ledger td{border:1px solid #cbd5e1;padding:6px;vertical-align:top;text-align:left}.v31-print-ledger th{background:#eef2f7;font-family:"Spline Sans Mono",monospace;text-transform:uppercase;letter-spacing:.04em}.v31-print-standing{margin:30px 0 0;border-top:1px solid #cbd5e1;padding-top:9px;font:800 9px/1.4 "Spline Sans Mono",monospace;color:#465268}
        @media(max-width:760px){.v31-print-controls{align-items:flex-start;flex-direction:column}.v31-print-controls>div:last-child{width:100%;flex-wrap:wrap}.v31-print-scroll{padding:8px}.v31-print-package{padding:28px 20px}.v31-print-summary{grid-template-columns:1fr 1fr}}
        @media print{
          @page{size:A4;margin:13mm}
          body *{visibility:hidden!important}
          .v31-print-overlay,.v31-print-overlay *{visibility:visible!important}
          .v31-print-overlay{position:absolute;inset:0;display:block;background:#fff}
          .v31-print-controls{display:none!important}.v31-print-scroll{overflow:visible;padding:0;background:#fff}.v31-print-package{width:auto;margin:0;padding:0;box-shadow:none}
          .v31-print-section.page-break{break-before:page}.v31-print-section,.v31-print-markup,.v31-print-note,.v31-print-stat{break-inside:avoid}.v31-print-ledger tr{break-inside:avoid}
          .v31-print-package h1{font-size:28pt}.v31-print-section h2{font-size:16pt}
        }
      `}</style>
      <header className="v31-print-controls">
        <div><h2>Editorial review package</h2><p>Choose what to include, then print or save as PDF.</p></div>
        <div className="v31-print-actions">
          <div className="v31-print-switch" role="group" aria-label="Print package mode">
            <button type="button" className={variant === "clean" ? "on" : ""} aria-pressed={variant === "clean"} onClick={() => setVariant("clean")}>Clean package</button>
            <button type="button" className={variant === "review" ? "on" : ""} aria-pressed={variant === "review"} onClick={() => setVariant("review")}>Full review</button>
          </div>
          <button data-testid="print-package-action" type="button" className="primary" onClick={() => window.print()}>Print / save PDF</button>
          <button type="button" className="close" onClick={onClose}>Close</button>
        </div>
      </header>
      <div className="v31-print-scroll">
        <article className="v31-print-package" data-testid="print-package-preview" data-variant={variant}>
          <p className="v31-print-kicker">V3 · reviewable work intelligence</p>
          <h1>{roleName}</h1>
          <p className="v31-print-subtitle">{orgName} · {variant === "review" ? "full evidence and decision review" : "clean role and candidate preparation brief"}</p>
          <PrintMeta source={source} confidence={confidence} />
          <div className="v31-print-summary">
            <div className="v31-print-stat"><b>{dutySpans.length || "—"}</b><span>source duties</span></div>
            <div className="v31-print-stat"><b>{roleSkills.length || "—"}</b><span>role skills</span></div>
            <div className="v31-print-stat"><b>{accepted.length}</b><span>accepted decisions</span></div>
            <div className="v31-print-stat"><b>{pending.length}</b><span>pending decisions</span></div>
          </div>

          <Section number="01" title="Clean role read">
            <h3>Responsibilities</h3>
            {dutySpans.length ? <ol className="v31-print-list">{dutySpans.map((span) => <li key={span.id}>{span.text}</li>)}</ol> : <Withheld>No source duties were supplied for this role.</Withheld>}
            <h3>Requirements</h3>
            {requirementSpans.length ? <ul className="v31-print-list">{requirementSpans.map((span) => <li key={span.id}>{span.text}</li>)}</ul> : <Withheld>The source does not expose a separate requirements set.</Withheld>}
          </Section>

          {variant === "review" && (
            <Section number="02" title="All-markup review" pageBreak>
              {spans.length ? spans.map((span) => {
                const linked = reviewComments.filter((comment) => comment.anchor === span.id);
                return (
                  <div key={span.id} className="v31-print-markup">
                    <p>{span.text}</p>
                    {linked.length ? linked.map((comment) => <div key={comment.id} className="v31-print-note"><b>{comment.persona}</b> · {comment.reason}<span className="v31-print-state">{decisions[comment.id] || "pending"}</span></div>) : <div className="v31-print-note">No reviewer note linked to this source span.</div>}
                  </div>
                );
              }) : <Withheld>No source spans are available for markup.</Withheld>}
            </Section>
          )}

          {variant === "review" && (
            <Section number="03" title="Reviewer summary and decision ledger">
              {reviewComments.length ? (
                <table className="v31-print-ledger"><thead><tr><th>Reviewer</th><th>Claim / action</th><th>Provenance</th><th>Confidence</th><th>Decision</th></tr></thead><tbody>{reviewComments.map((comment) => <tr key={comment.id}><td>{comment.persona}</td><td>{comment.reason}</td><td>{comment.prov || "unverified"}</td><td>{comment.conf || "withheld"}</td><td>{decisions[comment.id] || "pending"}</td></tr>)}</tbody></table>
              ) : <Withheld>No reviewer comments were produced for this evidence.</Withheld>}
              <p className="v31-print-standing">Decision state · {accepted.length} accepted · {rejected.length} rejected · {pending.length} pending</p>
            </Section>
          )}

          <Section number={variant === "review" ? "04" : "02"} title="Candidate action brief" pageBreak={variant === "clean"}>
            {accepted.length ? <ol className="v31-print-list">{accepted.map((comment) => <li key={comment.id}><b>{comment.persona}:</b> {comment.type === "suggested rewrite" && comment.suggested ? comment.suggested : comment.reason}</li>)}</ol> : <Withheld>No reviewer actions have been accepted. Pending suggestions are not promoted into the candidate brief.</Withheld>}
          </Section>

          <Section number={variant === "review" ? "05" : "03"} title="Interview question sheet">
            {interviewRows.length ? <ol className="v31-print-list">{interviewRows.map((row, index) => <li key={`${index}-${row.text}`}>{row.text}<br /><small>{row.provenance}</small></li>)}</ol> : <Withheld>The current source does not provide enough posting evidence for interview questions.</Withheld>}
          </Section>

          <Section number={variant === "review" ? "06" : "04"} title="Resume alignment rationale">
            {personSkills.length ? (
              <>
                <p>{personSkills.length} person-supplied skills were compared with {roleSkills.length} target-role skills using a case-normalised set difference.</p>
                {missingSkills.length ? <ul className="v31-print-list">{missingSkills.map((skill) => <li key={skill}>{skill} · not evidenced in the supplied person profile</li>)}</ul> : <p>No target-role skill is absent from the supplied person skill list.</p>}
                <p className="v31-print-withheld">Boundary · absence from the supplied profile is not proof that the person lacks a skill.</p>
              </>
            ) : <Withheld>No person or CV evidence was supplied. Role requirements cannot be presented as personal strengths or gaps.</Withheld>}
          </Section>

          <p className="v31-print-standing">AI-assisted · human decides · generated from the evidence and decisions visible at print time</p>
        </article>
      </div>
    </div>
  ), document.body);
}
