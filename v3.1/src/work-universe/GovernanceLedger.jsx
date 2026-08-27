import React, { useMemo, useState } from "react";
import { buildGovernanceLedgerData, GOVERNANCE_HUMAN_STATES } from "./governanceLedgerData.js";

const STATE_LABELS = {
  open: "Open",
  accepted: "Accepted",
  rejected: "Rejected",
  resolved: "Resolved",
  escalated: "Escalated",
};

function EvidenceLinks({ ids, onEvidenceSelect }) {
  if (!ids.length) return <span className="gl-withheldText">WITHHELD</span>;
  return <span className="gl-evidenceLinks">{ids.map((id) => <button key={id} type="button" onClick={() => onEvidenceSelect?.(id)}>{id}</button>)}</span>;
}

function HumanDecision({ item, onDecisionChange }) {
  return (
    <label className="gl-decision">
      <span>Human decision</span>
      <select value={item.humanState} onChange={(event) => onDecisionChange?.(item.key, event.target.value)}>
        {GOVERNANCE_HUMAN_STATES.map((state) => <option key={state} value={state}>{STATE_LABELS[state]}</option>)}
      </select>
    </label>
  );
}

function AuditTrail({ item }) {
  return (
    <details className="gl-details">
      <summary>Control detail and audit trail</summary>
      <div className="gl-detailGrid">
        <div><b>Scope</b><p>{item.scope || "WITHHELD"}</p></div>
        <div><b>Override path</b><p>{item.overridePath || "WITHHELD"}</p></div>
        <div><b>Guardrails</b>{item.guardrails.length ? <ul>{item.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}</ul> : <p>WITHHELD</p>}</div>
        <div><b>Transparency note</b><p>{item.transparencyNote || "WITHHELD"}</p></div>
      </div>
      <div className="gl-audit">
        <b>Supplied audit trail</b>
        {item.auditTrail.length ? item.auditTrail.map((event) => <div key={event.key}><span>{event.action}</span><small>{[event.actor, event.at].filter(Boolean).join(" · ") || "actor / time not supplied"}</small></div>) : <p>WITHHELD · no audit event was supplied.</p>}
        <div className="gl-sessionEvent"><span>Current session review state · {STATE_LABELS[item.humanState]}</span><small>Decision actor identity and timestamp are not inferred.</small></div>
      </div>
      {item.aiInterpretation && (
        <div className="gl-agent">
          <b>Agent identity disclosure</b>
          {item.agentIdentity.complete ? (
            <dl>
              <div><dt>Name</dt><dd>{item.agentIdentity.name}</dd></div>
              <div><dt>Purpose</dt><dd>{item.agentIdentity.purpose}</dd></div>
              <div><dt>Lens</dt><dd>{item.agentIdentity.lens}</dd></div>
              <div><dt>Deterministic code</dt><dd>{item.agentIdentity.deterministicUse ? "Used" : "Not used"}</dd></div>
              <div><dt>LLM judgement</dt><dd>{item.agentIdentity.llmJudgement ? "Used" : "Not used"}</dd></div>
              <div><dt>Can decide</dt><dd>{item.agentIdentity.canDecide}</dd></div>
              <div><dt>Cannot decide</dt><dd>{item.agentIdentity.cannotDecide}</dd></div>
              <div><dt>Review condition</dt><dd>{item.agentIdentity.reviewCondition}</dd></div>
              <div><dt>Stop condition</dt><dd>{item.agentIdentity.stopCondition}</dd></div>
            </dl>
          ) : <p className="gl-blockedCopy">WITHHELD · the supplied AI interpretation has no complete agent identity disclosure.</p>}
        </div>
      )}
    </details>
  );
}

function LedgerView({ entries, onEvidenceSelect, onDecisionChange }) {
  if (!entries.length) return <div className="gl-empty" data-testid="governance-ledger-empty"><b>GOVERNANCE LEDGER WITHHELD</b><p>No governance records were supplied. A role or posting is not used to invent an owner, risk class, control boundary, or autonomous action.</p></div>;
  return (
    <div className="gl-tableWrap">
      <table className="gl-table">
        <thead><tr><th>Decision under review</th><th>Evidence and results</th><th>Owner and risk</th><th>Action boundary</th><th>Control</th><th>Review</th></tr></thead>
        <tbody>{entries.map((item) => (
          <tr key={item.key} data-testid="governance-ledger-row">
            <td><span className="gl-recordId">{item.suppliedId || "RECORD ID WITHHELD"}</span><strong>{item.decision || "Decision withheld"}</strong><AuditTrail item={item} /></td>
            <td><EvidenceLinks ids={item.evidenceIds} onEvidenceSelect={onEvidenceSelect} /><div className="gl-cellBlock"><b>Deterministic</b><p>{item.deterministicResult || "WITHHELD"}</p></div><div className="gl-cellBlock"><b>AI interpretation</b><p>{item.aiInterpretation || "WITHHELD"}</p></div></td>
            <td><b>{item.humanOwner || "OWNER WITHHELD"}</b><p>{item.riskClass || "RISK WITHHELD"}</p></td>
            <td><div className="gl-allow"><b>Allowed</b><p>{item.allowedAction || "WITHHELD"}</p></div><div className="gl-forbid"><b>Forbidden</b><p>{item.forbiddenAction || "WITHHELD"}</p></div></td>
            <td><span className={`gl-status ${item.controlState}`}>{item.controlState.toUpperCase()}</span>{item.missing.length ? <p className="gl-missing">Missing: {item.missing.join(" · ")}</p> : <p className="gl-ready">All required controls supplied.</p>}</td>
            <td><HumanDecision item={item} onDecisionChange={onDecisionChange} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function DisagreementView({ disagreements, onEvidenceSelect, onDecisionChange }) {
  if (!disagreements.length) return <div className="gl-empty" data-testid="governance-disagreement-empty"><b>DISAGREEMENT WITHHELD</b><p>No competing reviewer claims were supplied. The interface does not manufacture conflict or consensus.</p></div>;
  return <div className="gl-conflicts">{disagreements.map((item) => (
    <article key={item.key} className={`gl-conflict ${item.ready ? "ready" : "withheld"}`} data-testid="governance-disagreement">
      <header><div><span>{item.suppliedId || "CONFLICT ID WITHHELD"}</span><h3>{item.topic || "Reviewer disagreement"}</h3></div><span className={`gl-status ${item.ready ? "allowed" : "blocked"}`}>{item.ready ? "REVIEWABLE" : "WITHHELD"}</span></header>
      <div className="gl-positions">{item.positions.length ? item.positions.map((position) => (
        <section key={position.key}><b>{position.reviewer || "REVIEWER WITHHELD"}</b><p>{position.claim || "Claim withheld"}</p><small>{position.lens || "Lens withheld"}{position.provenance ? ` · ${position.provenance}` : ""}</small><EvidenceLinks ids={position.evidenceIds} onEvidenceSelect={onEvidenceSelect} /></section>
      )) : <p className="gl-blockedCopy">No reviewer positions were supplied.</p>}</div>
      <footer><div><b>Human decision question</b><p>{item.question || "WITHHELD"}</p>{item.missing.length ? <small>Missing: {item.missing.join(" · ")}</small> : null}</div><HumanDecision item={item} onDecisionChange={onDecisionChange} /></footer>
    </article>
  ))}</div>;
}

export default function GovernanceLedger({ result, initialView = "ledger", onBack, onEvidenceSelect, onDecisionChange }) {
  const [view, setView] = useState(initialView === "disagreements" ? "disagreements" : "ledger");
  const data = useMemo(() => buildGovernanceLedgerData(result), [result]);
  return (
    <section className="gl-root" data-testid="governance-ledger">
      <style>{`
        .gl-root{height:100%;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;background:#f3f6fb;color:#20213f;font-family:Inter,Arial,sans-serif}.gl-root *{box-sizing:border-box;min-width:0}.gl-root button,.gl-root select{font:inherit;color:inherit}
        .gl-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 16px;border-bottom:1px solid #e1e7f0;background:#fff}.gl-eyebrow,.gl-recordId{display:block;font:900 9px/1.35 "Spline Sans Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#1a56db}.gl-head h2{font:800 clamp(20px,2vw,28px)/1.1 Georgia,serif;margin:3px 0}.gl-head p{margin:4px 0 0;color:#687087;font-size:10px;line-height:1.45}.gl-back{min-height:44px;border:1px solid #cfd7e4;border-radius:9px;background:#fff;padding:0 13px;font-size:11px;font-weight:900;cursor:pointer}
        .gl-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:9px 16px;border-bottom:1px solid #e1e7f0;background:#fff}.gl-summary{display:flex;gap:7px;flex-wrap:wrap}.gl-summary span,.gl-status{display:inline-flex;align-items:center;min-height:25px;border:1px solid #cfd7e4;border-radius:999px;padding:3px 8px;background:#f8fafc;font:900 9px/1.2 "Spline Sans Mono",monospace}.gl-tabs{display:flex;gap:5px}.gl-tabs button{min-height:44px;border:1px solid #cfd7e4;border-radius:8px;background:#fff;padding:0 12px;font-size:10px;font-weight:900;cursor:pointer}.gl-tabs button.on{border-color:#1a56db;background:#e8f0fe;color:#1a56db}
        .gl-body{min-height:0;overflow-y:scroll;scrollbar-gutter:stable;padding:14px 16px 22px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.gl-tableWrap{overflow:auto;scrollbar-gutter:stable;border:1px solid #dce2ec;border-radius:12px;background:#fff;box-shadow:0 6px 22px rgba(46,52,89,.06);scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.gl-body::-webkit-scrollbar,.gl-tableWrap::-webkit-scrollbar{width:9px;height:9px}.gl-body::-webkit-scrollbar-thumb,.gl-tableWrap::-webkit-scrollbar-thumb{background:#98a8b7;border:2px solid #f3f6fb;border-radius:999px}.gl-table{width:100%;min-width:1120px;border-collapse:collapse;table-layout:fixed;font-size:10px}.gl-table th{padding:9px;border-bottom:1px solid #ccd5e2;background:#eef2f7;text-align:left;font:900 8px/1.3 "Spline Sans Mono",monospace;letter-spacing:.05em;text-transform:uppercase;color:#596078}.gl-table td{padding:10px;border-right:1px solid #e3e8f0;border-bottom:1px solid #e3e8f0;vertical-align:top;line-height:1.4}.gl-table th:nth-child(1){width:21%}.gl-table th:nth-child(2){width:20%}.gl-table th:nth-child(3){width:12%}.gl-table th:nth-child(4){width:19%}.gl-table th:nth-child(5){width:14%}.gl-table th:nth-child(6){width:14%}.gl-table strong{display:block;font-size:12px;margin:4px 0 8px}.gl-table p{margin:3px 0;color:#687087}.gl-cellBlock{border-top:1px solid #e8ecf3;margin-top:7px;padding-top:7px}.gl-allow,.gl-forbid{border-left:3px solid #1a56db;padding-left:7px;margin-bottom:9px}.gl-forbid{border-left-color:#a76318}.gl-status.allowed{border-color:#1a56db;background:#e8f0fe;color:#1747af}.gl-status.blocked{border-style:dashed;border-color:#c49542;background:#fff9eb;color:#8a540e}.gl-missing{font-size:8px;color:#8a540e!important}.gl-ready{font-size:8px}.gl-decision{display:grid;gap:5px}.gl-decision span{font:900 8px/1.3 "Spline Sans Mono",monospace;text-transform:uppercase;color:#596078}.gl-decision select{min-height:44px;width:100%;border:1px solid #cfd7e4;border-radius:8px;background:#fff;padding:0 8px;font-size:10px;font-weight:800}
        .gl-evidenceLinks{display:flex;gap:4px;flex-wrap:wrap}.gl-evidenceLinks button{min-width:44px;min-height:44px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1a56db;font-size:9px;font-weight:900;cursor:pointer}.gl-withheldText{font:900 8px/1.3 "Spline Sans Mono",monospace;color:#8a540e}.gl-details{margin-top:8px;border-top:1px solid #e8ecf3;padding-top:7px}.gl-details summary{min-height:44px;display:flex;align-items:center;color:#1a56db;font-size:9px;font-weight:900;cursor:pointer}.gl-detailGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gl-detailGrid>div,.gl-agent{border:1px solid #e2e7ef;border-radius:8px;background:#f8fafc;padding:7px}.gl-detailGrid ul{margin:4px 0;padding-left:16px}.gl-audit{margin-top:8px}.gl-audit>div{display:grid;gap:2px;border-top:1px solid #e8ecf3;padding:6px 0}.gl-audit small,.gl-agent dt{color:#747991;font-size:8px}.gl-sessionEvent{border-left:3px solid #1a56db;padding-left:7px!important}.gl-agent{margin-top:8px}.gl-agent dl{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:7px 0 0}.gl-agent dl>div{border-top:1px solid #e2e7ef;padding-top:4px}.gl-agent dd{margin:2px 0;font-size:9px}.gl-blockedCopy{color:#8a540e!important}
        .gl-empty{width:min(680px,100%);margin:30px auto;border:1px dashed #b7c3d2;border-radius:12px;background:#fff;padding:22px;text-align:center}.gl-empty b{font:900 10px/1.3 "Spline Sans Mono",monospace;color:#8a540e}.gl-empty p{font-size:11px;line-height:1.55;color:#687087}.gl-conflicts{display:grid;gap:12px}.gl-conflict{border:1px solid #dce2ec;border-radius:12px;background:#fff;box-shadow:0 5px 18px rgba(46,52,89,.05);overflow:hidden}.gl-conflict.withheld{border-style:dashed}.gl-conflict>header,.gl-conflict>footer{display:flex;justify-content:space-between;align-items:start;gap:12px;padding:11px 13px}.gl-conflict>header{border-bottom:1px solid #e8ecf3}.gl-conflict>footer{border-top:1px solid #e8ecf3}.gl-conflict h3{margin:3px 0;font:800 17px/1.2 Georgia,serif}.gl-conflict header span:first-child{font:900 8px/1.3 "Spline Sans Mono",monospace;color:#1a56db}.gl-conflict footer p{margin:4px 0;font-size:11px}.gl-positions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px}.gl-positions section{border:1px solid #e2e7ef;border-radius:9px;background:#f8fafc;padding:10px}.gl-positions p{font-size:11px;line-height:1.5;color:#3a4456}.gl-positions small{display:block;margin-bottom:7px;color:#747991;font-size:8px}.gl-footer{display:flex;justify-content:space-between;gap:10px;padding:8px 16px;border-top:1px solid #e1e7f0;background:#fff;color:#747991;font-size:9px}
        .gl-root button:focus-visible,.gl-root select:focus-visible,.gl-root summary:focus-visible{outline:3px solid #1a56db;outline-offset:2px}@media(max-width:760px){.gl-head,.gl-toolbar,.gl-conflict>footer{display:grid;grid-template-columns:1fr}.gl-back{width:100%}.gl-tabs{width:100%;overflow:auto}.gl-tabs button{flex:1 0 auto}.gl-detailGrid,.gl-agent dl,.gl-positions{grid-template-columns:1fr}.gl-body{padding:10px}.gl-footer{display:grid}.gl-conflict>header{align-items:flex-start}}@media(prefers-reduced-motion:reduce){.gl-root *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>
      <header className="gl-head"><div><span className="gl-eyebrow">Governance · blueprint §11</span><h2>Governance Ledger</h2><p>Owner, risk, action boundary, evidence and audit remain explicit. Supplied status cannot bypass an incomplete control record.</p></div><button type="button" className="gl-back" onClick={onBack}>← Work Universe</button></header>
      <div className="gl-toolbar"><div className="gl-summary"><span>{data.counts.allowed} ALLOWED</span><span>{data.counts.blocked} BLOCKED</span><span>{data.counts.readyDisagreements} REVIEWABLE DISAGREEMENTS</span><span>{data.counts.withheldDisagreements} WITHHELD DISAGREEMENTS</span></div><div className="gl-tabs" role="tablist" aria-label="Governance views"><button data-testid="governance-tab-ledger" type="button" role="tab" aria-selected={view === "ledger"} className={view === "ledger" ? "on" : ""} onClick={() => setView("ledger")}>Decision ledger</button><button data-testid="governance-tab-disagreements" type="button" role="tab" aria-selected={view === "disagreements"} className={view === "disagreements" ? "on" : ""} onClick={() => setView("disagreements")}>Reviewer disagreement</button></div></div>
      <div className="gl-body">{view === "ledger" ? <LedgerView entries={data.ledger} onEvidenceSelect={onEvidenceSelect} onDecisionChange={onDecisionChange} /> : <DisagreementView disagreements={data.disagreements} onEvidenceSelect={onEvidenceSelect} onDecisionChange={onDecisionChange} />}</div>
      <footer className="gl-footer"><span>Evidence contract · no owner, evidence, risk, scope, action boundary, audit or override path → BLOCKED</span><span>AI-assisted · human decides</span></footer>
    </section>
  );
}
