import React, { useMemo, useState } from "react";
import { buildWorkflowMapData } from "./workflowMapData.js";

function EvidenceButtons({ ids, onSelect }) {
  if (!ids.length) return <span className="wm-noEvidence">No source-span link supplied</span>;
  return (
    <span className="wm-evidenceLinks">
      {ids.map((id) => <button key={id} type="button" onClick={() => onSelect?.(id)}>{id}</button>)}
    </span>
  );
}

function StepTags({ step }) {
  const tags = [
    step.decision && "DECISION",
    step.queue && "QUEUE",
    step.bottleneck && "BOTTLENECK",
    step.scenario,
  ].filter(Boolean);
  if (!tags.length) return null;
  return <span className="wm-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</span>;
}

export default function WorkflowMap({ result, roleTitle, organisationName, onBack, onEvidenceSelect }) {
  const data = useMemo(() => buildWorkflowMapData(result), [result]);
  const [selectedId, setSelectedId] = useState(null);
  const selected = data.steps.find((step) => step.id === selectedId) || null;

  return (
    <section className="wm-root" data-testid="workflow-map" aria-label="Workflow Map">
      <style>{`
        .wm-root{height:100%;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;background:#f5f7fa;color:#1a202c;font-family:Inter,Arial,sans-serif}.wm-root *{box-sizing:border-box;min-width:0}.wm-root button{font:inherit;color:inherit}
        .wm-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #e7edf4;background:#fff}.wm-eyebrow{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#1a56db;font-weight:900}.wm-title{font-family:Georgia,serif;font-size:clamp(18px,2vw,28px);font-weight:800;line-height:1.1;margin-top:2px}.wm-meta{font-size:10px;color:#6b7a8d}.wm-action{min-height:44px;border:1px solid #dde3ec;border-radius:8px;background:#fff;padding:0 12px;font-size:11px;font-weight:900;cursor:pointer}.wm-action:hover{border-color:#1a56db}.wm-action:focus-visible,.wm-step:focus-visible,.wm-evidenceLinks button:focus-visible{outline:3px solid #1a56db;outline-offset:2px}
        .wm-contract{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 16px;border-bottom:1px solid #e7edf4;background:#fff}.wm-boundary{font-size:11px;color:#64748b;line-height:1.4}.wm-chips{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.wm-chip{display:inline-flex;align-items:center;min-height:25px;border:1px solid #cbd5e1;border-radius:999px;padding:3px 8px;background:#f8fafc;color:#475569;font-size:9px;font-weight:900}.wm-chip.available{border-color:#1a56db;background:#eef4ff;color:#1a56db}.wm-chip.withheld{border-style:dashed;background:#fffbeb;color:#92400e}
        .wm-body{min-height:0;overflow:auto;scrollbar-gutter:stable;padding:16px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.wm-body::-webkit-scrollbar{width:9px;height:9px}.wm-body::-webkit-scrollbar-thumb{background:#98a8b7;border:2px solid #f5f7fa;border-radius:999px}.wm-question{width:min(760px,100%);margin:0 auto 14px;text-align:center}.wm-question b{font-family:Georgia,serif;font-size:18px}.wm-question p{margin:4px 0 0;color:#64748b;font-size:10px}.wm-flow{display:grid;gap:8px;width:min(900px,100%);margin:0 auto}.wm-stepWrap{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;position:relative}.wm-stepWrap:not(:last-child)::after{content:"";position:absolute;left:16px;top:44px;bottom:-8px;border-left:2px solid #cbd5e1}.wm-index{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#1a56db;color:#fff;font-family:"Spline Sans Mono",monospace;font-size:10px;font-weight:900;z-index:1}.wm-step{min-height:76px;width:100%;border:1px solid #dde3ec;border-radius:10px;background:#fff;padding:11px 12px;text-align:left;cursor:pointer;box-shadow:0 1px 2px rgba(16,24,40,.04)}.wm-step:hover,.wm-step.active{border-color:#1a56db;box-shadow:0 0 0 2px rgba(26,86,219,.08)}.wm-stepHead{display:flex;justify-content:space-between;gap:10px;align-items:start}.wm-stepTitle{font-size:12px;font-weight:900;line-height:1.35}.wm-actor{font-size:9px;color:#1a56db;font-weight:900;text-align:right}.wm-stepMeta{margin-top:5px;color:#64748b;font-size:9px}.wm-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}.wm-tags span{display:inline-flex;min-height:22px;align-items:center;border:1px solid #cbd5e1;border-radius:999px;padding:2px 7px;background:#f8fafc;font-size:8px;font-weight:900}.wm-empty{width:min(760px,100%);margin:0 auto;border:1px dashed #d6b66d;border-radius:12px;background:#fffbeb;padding:20px;color:#6b7280;font-size:12px;line-height:1.55}.wm-withheld{display:inline-flex;align-items:center;border:1px dashed #d6b66d;border-radius:999px;padding:3px 8px;margin-top:10px;background:#fff;color:#92400e;font-size:9px;font-weight:900}
        .wm-detail{width:min(900px,100%);margin:14px auto 0;border:1px solid #dde3ec;border-radius:10px;background:#fff;padding:13px}.wm-detailTitle{font-family:Georgia,serif;font-size:17px;font-weight:800}.wm-detail p{font-size:10px;color:#64748b;line-height:1.5}.wm-detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.wm-detailItem{border:1px solid #e7edf4;border-radius:8px;background:#f8fafc;padding:8px;font-size:9px}.wm-evidenceLinks{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}.wm-evidenceLinks button{min-width:44px;min-height:44px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1a56db;font-size:9px;font-weight:900;cursor:pointer}.wm-noEvidence{display:block;color:#64748b;font-size:9px;margin-top:7px}.wm-connections{width:min(900px,100%);margin:14px auto 0;border:1px solid #dde3ec;border-radius:10px;background:#fff;padding:13px}.wm-connection{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center;border-top:1px solid #e7edf4;padding:9px 0;font-size:10px}.wm-arrow{color:#1a56db;font-weight:900;text-align:center}.wm-footer{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 16px;border-top:1px solid #e7edf4;background:#fff;color:#64748b;font-size:9px}
        @media(max-width:700px){.wm-head,.wm-contract,.wm-footer{display:grid;grid-template-columns:1fr}.wm-action{width:100%}.wm-chips{justify-content:flex-start}.wm-detailGrid{grid-template-columns:1fr}.wm-connection{grid-template-columns:1fr}.wm-arrow{text-align:left}.wm-body{padding:12px}.wm-stepWrap{grid-template-columns:30px minmax(260px,1fr)}.wm-index{width:30px;height:30px}.wm-stepWrap:not(:last-child)::after{left:14px}}
        @media(prefers-reduced-motion:reduce){.wm-root *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>
      <header className="wm-head">
        <div><div className="wm-eyebrow">Role Work Universe · dedicated visual</div><div className="wm-title">Workflow Map</div><div className="wm-meta">{organisationName || "Organisation evidence pending"} · role anchor: {roleTitle || "Role evidence pending"}</div></div>
        <button data-testid="workflow-map-back" type="button" className="wm-action" onClick={onBack}>← Five-graph universe</button>
      </header>
      <div className="wm-contract">
        <div className="wm-boundary"><b>Evidence boundary:</b> {data.boundary}</div>
        <div className="wm-chips"><span className={`wm-chip ${data.status}`}>{data.status === "available" ? "SUPPLIED" : "WITHHELD"}</span><span className="wm-chip">{data.steps.length} stages</span><span className="wm-chip">{data.actorCount} actors</span><span className="wm-chip">{data.connections.length} explicit links</span></div>
      </div>
      <div className="wm-body">
        <div className="wm-question"><b>Who acts when?</b><p>Order and decisions are shown only when the workflow payload states them.</p></div>
        {data.steps.length ? (
          <div className="wm-flow" data-testid="workflow-map-flow">
            {data.steps.map((step, index) => (
              <div className="wm-stepWrap" key={step.id}>
                <span className="wm-index" aria-hidden="true">{index + 1}</span>
                <button data-testid={`workflow-step-${step.id}`} type="button" className={`wm-step ${selectedId === step.id ? "active" : ""}`} onClick={() => setSelectedId(selectedId === step.id ? null : step.id)} aria-expanded={selectedId === step.id}>
                  <span className="wm-stepHead"><span className="wm-stepTitle">{step.label}</span>{step.actor && <span className="wm-actor">{step.actor}</span>}</span>
                  {(step.owner || step.description) && <span className="wm-stepMeta">{step.owner ? `Owner · ${step.owner}` : step.description}</span>}
                  <StepTags step={step} />
                </button>
              </div>
            ))}
          </div>
        ) : <div className="wm-empty" data-testid="workflow-map-empty">{data.empty}<br /><span className="wm-withheld">WITHHELD</span></div>}
        {selected && (
          <section className="wm-detail" data-testid="workflow-map-detail" aria-live="polite">
            <div className="wm-eyebrow">Selected supplied stage</div><div className="wm-detailTitle">{selected.label}</div>
            {selected.description && <p>{selected.description}</p>}
            <div className="wm-detailGrid">
              <div className="wm-detailItem"><b>Actor / lane</b><br />{selected.actor || "Not supplied"}</div>
              <div className="wm-detailItem"><b>Human owner</b><br />{selected.owner || "Not supplied"}</div>
              <div className="wm-detailItem"><b>Scenario</b><br />{selected.scenario || "Not supplied"}</div>
              <div className="wm-detailItem"><b>Friction</b><br />{selected.friction || "Not supplied"}</div>
              <div className="wm-detailItem"><b>Agent candidate</b><br />{selected.agentCandidate || "Not supplied"}</div>
              <div className="wm-detailItem"><b>Provenance</b><br />{selected.provenance} · confidence {selected.confidence}</div>
            </div>
            <EvidenceButtons ids={selected.evidenceIds} onSelect={onEvidenceSelect} />
          </section>
        )}
        <section className="wm-connections" data-testid="workflow-map-connections">
          <div className="wm-eyebrow">Explicit workflow links</div><div className="wm-detailTitle">Transitions, handoffs and dependencies</div>
          {data.connections.length ? data.connections.map((connection) => (
            <div className="wm-connection" key={connection.id}><b>{connection.fromLabel}</b><span className="wm-arrow">— {connection.label} →</span><b>{connection.toLabel}</b><EvidenceButtons ids={connection.evidenceIds} onSelect={onEvidenceSelect} /></div>
          )) : <p>No explicit transition, handoff or dependency resolved between supplied stages.</p>}
          {data.unresolvedConnections > 0 && <p><b>{data.unresolvedConnections} supplied link{data.unresolvedConnections === 1 ? "" : "s"} withheld:</b> an endpoint did not resolve to a supplied stage.</p>}
        </section>
      </div>
      <footer className="wm-footer"><span>Blueprint: UI §1.5 / §4.5 · Workflow answers order and decisions.</span><span>AI-assisted · human decides</span></footer>
    </section>
  );
}
