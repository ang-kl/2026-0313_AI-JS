import React, { useMemo } from "react";
import { buildResumeClaimWorkbench } from "./resumeClaimData.js";
import OutputActions from "./OutputActions.jsx";
import { outputReleaseGate } from "./outputReleasePolicy.js";
import BlueprintTracePanel from "../blueprint/BlueprintTracePanel.jsx";
import { createBlueprintTrace } from "../blueprint/blueprintTraceData.js";

export default function ResumeClaimWorkbench({ ledger, bundle }) {
  const workbench = useMemo(() => buildResumeClaimWorkbench(ledger, bundle), [ledger, bundle]);
  const output = workbench.output;
  const refs = output?.sourceRefs || [];
  const gate = outputReleaseGate(output, { currentSourceRefs: refs });
  const trace = createBlueprintTrace({ id: "trace:resume-claim", requirement: "BLP-017", component: "Resume claim workbench", sourceIds: refs, status: workbench.proposed.length ? "AVAILABLE" : "WITHHELD", rule: workbench.proposed.length ? "Shown because accepted candidate proof, explicit resume approval and a live job-evidence link all pass." : "Withheld until accepted candidate proof, explicit resume approval and a live job-evidence link all pass.", knownGap: workbench.withheld.length ? `${workbench.withheld.length} candidate claim records do not pass every gate` : null });
  return (
    <section className="rcw-root" data-testid="resume-claim-workbench" aria-label="Resume claim workbench" data-proposed-count={workbench.proposed.length} data-withheld-count={workbench.withheld.length}>
      <style>{`
        .rcw-root{margin:12px clamp(14px,1.05vw,28px);border:1px solid #cbd5e1;border-radius:9px;background:#f8fafc;padding:11px 12px;color:#1a202c}.rcw-root *{box-sizing:border-box;min-width:0}.rcw-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.rcw-head h3{font-size:12px;margin:2px 0}.rcw-meta{font-size:8px;line-height:1.45;color:#475569}.rcw-list{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.rcw-card{border:1px solid #cbd5e1;border-left:4px solid #1a56db;border-radius:8px;background:#fff;padding:8px;display:grid;gap:5px}.rcw-card[data-state="WITHHELD"]{border-left-color:#92400e;border-style:dotted}.rcw-label{font-size:8px;font-weight:900;color:#475569}.rcw-quote{margin:0;border-left:2px solid #94a3b8;padding-left:7px;font-size:9px;line-height:1.4}.rcw-id{font:7px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#475569;overflow-wrap:anywhere}.rcw-root details summary{min-height:44px;display:flex;align-items:center;font-size:8px;font-weight:900;cursor:pointer}.rcw-root details ul{margin:2px 0 0;padding-left:16px;font-size:8px;line-height:1.45}.rcw-root summary:focus-visible{outline:3px solid #1a56db;outline-offset:2px}
      `}</style>
      <div className="rcw-head"><div><div className="wu-srcid">EVIDENCE-GATED OUTPUT</div><h3>Résumé claim workbench</h3></div><div className="rcw-meta">{workbench.proposed.length} proposed · {workbench.withheld.length} withheld</div></div>
      <p className="rcw-meta">A proposal needs accepted candidate proof, your explicit résumé approval, and a job-evidence link that stands now. Wording stays exactly as you wrote it. Reviewer status is shown, never invented.</p>
      <BlueprintTracePanel traces={[trace]} label="Résumé claim blueprint trace" />
      {!workbench.proposed.length && <p className="rcw-meta" data-testid="resume-claim-empty">No résumé claim passes every gate.</p>}
      <ul className="rcw-list" aria-label="Proposed resume claims">
        {workbench.proposed.map((claim) => <li className="rcw-card" data-testid="resume-claim-proposed" data-proof-id={claim.proofId} key={claim.id}>
          <div className="rcw-label">PROPOSED · pending human review</div>
          <blockquote className="rcw-quote" data-testid="resume-claim-wording">{claim.wording}</blockquote>
          <div className="rcw-meta" data-testid="resume-claim-rationale">{claim.rationale}</div>
          <div className="rcw-meta" data-testid="resume-claim-reviewer">Reviewer: not assigned · decision pending</div>
          <div className="rcw-id" data-testid="resume-claim-refs">{claim.sourceRefs.join(" · ")}</div>
          <details><summary>Inspect evidence and overclaim risk</summary><ul><li>candidate excerpt: {claim.candidateEvidence.excerptText}</li>{claim.jobEvidence.map((target) => <li key={target.targetId}>{target.targetKind}: {target.text}</li>)}<li>authorship: {claim.authorship.origin} · {claim.authorship.actorId}</li><li>overclaim: {claim.overclaim.state}{claim.overclaim.unsupportedWords.length ? ` · review ${claim.overclaim.unsupportedWords.join(", ")}` : ""}</li></ul></details>
        </li>)}
      </ul>
      {workbench.withheld.length > 0 && <details data-testid="resume-claim-withheld"><summary>Withheld claims · {workbench.withheld.length}</summary><ul>{workbench.withheld.map((claim) => <li key={claim.id} data-proof-id={claim.proofId}>{claim.proofId}: {claim.reasons.join("; ")}</li>)}</ul></details>}
      <OutputActions label="resume-claim" output={output} trace={workbench.trace} gate={gate} />
    </section>
  );
}
