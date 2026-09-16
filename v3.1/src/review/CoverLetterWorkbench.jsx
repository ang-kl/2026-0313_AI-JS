import React, { useMemo } from "react";
import { buildCoverLetterWorkbench } from "./coverLetterData.js";
import OutputActions from "./OutputActions.jsx";
import { outputReleaseGate } from "./outputReleasePolicy.js";
import BlueprintTracePanel from "../blueprint/BlueprintTracePanel.jsx";
import { createBlueprintTrace } from "../blueprint/blueprintTraceData.js";

export default function CoverLetterWorkbench({ ledger, bundle }) {
  const workbench = useMemo(() => buildCoverLetterWorkbench(ledger, bundle), [ledger, bundle]);
  const gate = outputReleaseGate(workbench.output, { currentSourceRefs: workbench.trace.flatMap((item) => item.sourceRefs) });
  const trace = createBlueprintTrace({ id: "trace:cover-letter", requirement: "BLP-019", component: "Cover-letter workbench", sourceIds: workbench.output.sourceRefs, status: workbench.sentences.length ? "AVAILABLE" : "WITHHELD", rule: workbench.sentences.length ? "Shown because every included sentence is user-authored and traces to approved candidate proof plus current job evidence." : "Withheld until a sentence traces to approved candidate proof and current job evidence.", knownGap: workbench.withheld.length ? `${workbench.withheld.length} sentence candidates do not pass every gate` : null });
  return (
    <section className="clw-root" data-testid="cover-letter-workbench" aria-label="Cover-letter workbench" data-sentence-count={workbench.sentences.length} data-withheld-count={workbench.withheld.length}>
      <style>{`
        .clw-root{margin:12px clamp(14px,1.05vw,28px);border:1px solid #cbd5e1;border-radius:9px;background:#fff;padding:11px 12px;color:#1a202c}.clw-root *{box-sizing:border-box;min-width:0}.clw-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.clw-head h3{font-size:12px;margin:2px 0}.clw-meta{font-size:8px;line-height:1.45;color:#475569}.clw-body{margin-top:8px;border:1px solid #cbd5e1;border-radius:8px;padding:9px;background:#f8fafc}.clw-sentence{font-size:9px;line-height:1.55;margin:0 0 7px}.clw-sentence:last-child{margin-bottom:0}.clw-trace{display:block;margin-top:2px;font:7px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#475569;overflow-wrap:anywhere}.clw-root details summary{min-height:44px;display:flex;align-items:center;font-size:8px;font-weight:900;cursor:pointer}.clw-root details ul{margin:2px 0 0;padding-left:16px;font-size:8px;line-height:1.45}.clw-root summary:focus-visible{outline:3px solid #1a56db;outline-offset:2px}
      `}</style>
      <div className="clw-head"><div><div className="wu-srcid">SENTENCE-LEVEL EVIDENCE TRACE</div><h3>Cover-letter workbench</h3></div><div className="clw-meta">{workbench.sentences.length} eligible · {workbench.withheld.length} withheld</div></div>
      <p className="clw-meta">Only your approved wording is assembled. Every sentence must cite confirmed candidate proof and job evidence that stands now.</p>
      <BlueprintTracePanel traces={[trace]} label="Cover-letter blueprint trace" />
      {workbench.sentences.length ? <div className="clw-body" data-testid="cover-letter-body">{workbench.sentences.map((sentence, index) => <p className="clw-sentence" data-testid="cover-letter-sentence" data-proof-id={sentence.proofId} key={sentence.id}>{sentence.text}<span className="clw-trace" data-testid="cover-letter-trace">sentence {index + 1} · {sentence.sourceRefs.join(" · ")}</span></p>)}</div> : <p className="clw-meta" data-testid="cover-letter-empty">No cover-letter sentence passes every gate.</p>}
      {workbench.withheld.length > 0 && <details data-testid="cover-letter-withheld"><summary>Withheld sentences · {workbench.withheld.length}</summary><ul>{workbench.withheld.map((sentence) => <li key={sentence.id}>{sentence.proofId}: {sentence.reasons.join("; ")}</li>)}</ul></details>}
      <OutputActions label="cover-letter" output={workbench.output} trace={workbench.trace} gate={gate} />
    </section>
  );
}
