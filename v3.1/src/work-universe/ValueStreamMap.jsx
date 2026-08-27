import React, { useMemo, useState } from "react";
import { buildValueStreamMapData } from "./valueStreamMapData.js";

function EvidenceButtons({ ids, onSelect }) {
  if (!ids.length) return <span className="vsm-noEvidence">No source-span link supplied</span>;
  return <span className="vsm-evidenceLinks">{ids.map((id) => <button key={id} type="button" onClick={() => onSelect?.(id)}>{id}</button>)}</span>;
}

export default function ValueStreamMap({ result, roleTitle, organisationName, onBack, onEvidenceSelect }) {
  const data = useMemo(() => buildValueStreamMapData(result), [result]);
  const [selectedId, setSelectedId] = useState(null);
  const selected = data.stages.find((stage) => stage.id === selectedId) || null;

  return (
    <section className="vsm-root" data-testid="value-stream-map" aria-label="Value Stream Map">
      <style>{`
        .vsm-root{height:100%;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;background:#f5f7fa;color:#1a202c;font-family:Inter,Arial,sans-serif}.vsm-root *{box-sizing:border-box;min-width:0}.vsm-root button{font:inherit;color:inherit}
        .vsm-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #e7edf4;background:#fff}.vsm-eyebrow{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#1a56db;font-weight:900}.vsm-title{font-family:Georgia,serif;font-size:clamp(18px,2vw,28px);font-weight:800;line-height:1.1;margin-top:2px}.vsm-meta{font-size:10px;color:#6b7a8d}.vsm-action{min-height:44px;border:1px solid #dde3ec;border-radius:8px;background:#fff;padding:0 12px;font-size:11px;font-weight:900;cursor:pointer}.vsm-action:hover{border-color:#1a56db}.vsm-action:focus-visible,.vsm-stage:focus-visible,.vsm-evidenceLinks button:focus-visible{outline:3px solid #1a56db;outline-offset:2px}
        .vsm-contract{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 16px;border-bottom:1px solid #e7edf4;background:#fff}.vsm-boundary{font-size:11px;color:#64748b;line-height:1.4}.vsm-chips{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.vsm-chip{display:inline-flex;align-items:center;min-height:25px;border:1px solid #cbd5e1;border-radius:999px;padding:3px 8px;background:#f8fafc;color:#475569;font-size:9px;font-weight:900}.vsm-chip.available{border-color:#1a56db;background:#eef4ff;color:#1a56db}.vsm-chip.withheld{border-style:dashed;background:#fffbeb;color:#92400e}
        .vsm-body{min-height:0;overflow:auto;scrollbar-gutter:stable;padding:16px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.vsm-body::-webkit-scrollbar{width:9px;height:9px}.vsm-body::-webkit-scrollbar-thumb{background:#98a8b7;border:2px solid #f5f7fa;border-radius:999px}.vsm-question{width:min(820px,100%);margin:0 auto 14px;text-align:center}.vsm-question b{font-family:Georgia,serif;font-size:18px}.vsm-question p{margin:4px 0 0;color:#64748b;font-size:10px}.vsm-summary{width:min(920px,100%);margin:0 auto 12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:7px}.vsm-summaryItem{border:1px solid #dde3ec;border-radius:9px;background:#fff;padding:9px}.vsm-summaryItem b{display:block;font-size:12px}.vsm-summaryItem span{font-size:9px;color:#64748b}.vsm-stream{display:grid;gap:8px;width:min(920px,100%);margin:0 auto}.vsm-stage{min-height:78px;width:100%;border:1px solid #dde3ec;border-left:5px solid #94a3b8;border-radius:9px;background:#fff;padding:11px 12px;text-align:left;cursor:pointer}.vsm-stage.value{border-left-color:#1a56db}.vsm-stage.wait,.vsm-stage.handoff,.vsm-stage.waste,.vsm-stage.rework{border-left-color:#b7791f}.vsm-stage:hover,.vsm-stage.active{box-shadow:0 0 0 2px rgba(26,86,219,.08);border-top-color:#1a56db;border-right-color:#1a56db;border-bottom-color:#1a56db}.vsm-stageHead{display:flex;justify-content:space-between;gap:10px;align-items:start}.vsm-stageTitle{font-size:12px;font-weight:900;line-height:1.35}.vsm-class{font-family:"Spline Sans Mono",monospace;font-size:8px;font-weight:900;color:#475569}.vsm-stageMeta{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.vsm-stageMeta span{display:inline-flex;align-items:center;min-height:22px;border:1px solid #cbd5e1;border-radius:999px;padding:2px 7px;background:#f8fafc;font-size:8px;font-weight:900}.vsm-empty{width:min(820px,100%);margin:0 auto;border:1px dashed #d6b66d;border-radius:12px;background:#fffbeb;padding:20px;color:#6b7280;font-size:12px;line-height:1.55}.vsm-withheld{display:inline-flex;align-items:center;border:1px dashed #d6b66d;border-radius:999px;padding:3px 8px;margin-top:10px;background:#fff;color:#92400e;font-size:9px;font-weight:900}
        .vsm-detail{width:min(920px,100%);margin:14px auto 0;border:1px solid #dde3ec;border-radius:10px;background:#fff;padding:13px}.vsm-detailTitle{font-family:Georgia,serif;font-size:17px;font-weight:800}.vsm-detail p{font-size:10px;color:#64748b;line-height:1.5}.vsm-detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.vsm-detailItem{border:1px solid #e7edf4;border-radius:8px;background:#f8fafc;padding:8px;font-size:9px}.vsm-blocked{border:1px dashed #d6b66d;border-radius:8px;background:#fffbeb;color:#92400e;padding:8px;margin-top:8px;font-size:9px;font-weight:900}.vsm-evidenceLinks{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}.vsm-evidenceLinks button{min-width:44px;min-height:44px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1a56db;font-size:9px;font-weight:900;cursor:pointer}.vsm-noEvidence{display:block;color:#64748b;font-size:9px;margin-top:7px}.vsm-footer{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 16px;border-top:1px solid #e7edf4;background:#fff;color:#64748b;font-size:9px}
        @media(max-width:700px){.vsm-head,.vsm-contract,.vsm-footer{display:grid;grid-template-columns:1fr}.vsm-action{width:100%}.vsm-chips{justify-content:flex-start}.vsm-detailGrid{grid-template-columns:1fr}.vsm-body{padding:12px}.vsm-stage{min-width:270px}}
        @media(prefers-reduced-motion:reduce){.vsm-root *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>
      <header className="vsm-head">
        <div><div className="vsm-eyebrow">Organisation Work Graph · BPR visual</div><div className="vsm-title">Value Stream Map</div><div className="vsm-meta">{organisationName || "Organisation evidence pending"} · role anchor: {roleTitle || "Role evidence pending"}</div></div>
        <button data-testid="value-stream-map-back" type="button" className="vsm-action" onClick={onBack}>← Five-graph universe</button>
      </header>
      <div className="vsm-contract">
        <div className="vsm-boundary"><b>Evidence boundary:</b> {data.boundary}</div>
        <div className="vsm-chips"><span className={`vsm-chip ${data.status}`}>{data.status === "available" ? "SUPPLIED" : "WITHHELD"}</span><span className="vsm-chip">{data.stages.length} stages</span><span className="vsm-chip">{data.timedStages} timed</span><span className="vsm-chip">{data.hypothesisLabel || "BPR hypothesis"}</span></div>
      </div>
      <div className="vsm-body">
        <div className="vsm-question"><b>Where does time go?</b><p>Time, waste, handoff and AI leverage appear only when the value-stream payload states them.</p></div>
        {data.summary.length ? <div className="vsm-summary" data-testid="value-stream-summary">{data.summary.map((item) => <div className="vsm-summaryItem" key={item.label}><b>{item.value}</b><span>{item.label}</span></div>)}</div> : null}
        {data.stages.length ? (
          <div className="vsm-stream" data-testid="value-stream-flow">
            {data.stages.map((stage) => (
              <button key={stage.id} data-testid={`value-stream-stage-${stage.id}`} type="button" className={`vsm-stage ${stage.classification} ${selectedId === stage.id ? "active" : ""}`} onClick={() => setSelectedId(selectedId === stage.id ? null : stage.id)} aria-expanded={selectedId === stage.id}>
                <span className="vsm-stageHead"><span className="vsm-stageTitle">{stage.label}</span><span className="vsm-class">{stage.classificationLabel}</span></span>
                <span className="vsm-stageMeta">{stage.duration && <span>Time · {stage.duration}</span>}{stage.waitTime && <span>Wait · {stage.waitTime}</span>}{stage.owner && <span>Owner · {stage.owner}</span>}{stage.scenario && <span>{stage.scenario}</span>}</span>
              </button>
            ))}
          </div>
        ) : <div className="vsm-empty" data-testid="value-stream-map-empty">{data.empty}<br /><span className="vsm-withheld">WITHHELD</span></div>}
        {selected && (
          <section className="vsm-detail" data-testid="value-stream-map-detail" aria-live="polite">
            <div className="vsm-eyebrow">Selected supplied stage</div><div className="vsm-detailTitle">{selected.label}</div>
            {selected.description && <p>{selected.description}</p>}
            <div className="vsm-detailGrid">
              <div className="vsm-detailItem"><b>Value-stream state</b><br />{selected.classificationLabel}</div>
              <div className="vsm-detailItem"><b>Owner / handoff owner</b><br />{selected.owner || "Not supplied"}{selected.handoffOwner ? ` / ${selected.handoffOwner}` : ""}</div>
              <div className="vsm-detailItem"><b>Time / wait</b><br />{selected.duration || "Not supplied"}{selected.waitTime ? ` / ${selected.waitTime}` : ""}</div>
              <div className="vsm-detailItem"><b>Handoff cost</b><br />{selected.handoffCost || "Not supplied"}</div>
              <div className="vsm-detailItem"><b>Friction / customer impact</b><br />{selected.friction || "Not supplied"}{selected.customerImpact ? ` / ${selected.customerImpact}` : ""}</div>
              <div className="vsm-detailItem"><b>AI leverage proposal</b><br />{selected.aiLeverage || "Not supplied"}</div>
              <div className="vsm-detailItem"><b>Agent candidate</b><br />{selected.agentCandidate || "Not promoted"}</div>
              <div className="vsm-detailItem"><b>Do not automate</b><br />{selected.doNotAutomate ? "Explicitly supplied" : selected.automationBoundary || "Not supplied"}</div>
              <div className="vsm-detailItem"><b>Human validation</b><br />{selected.humanValidation || "Not supplied"}</div>
              <div className="vsm-detailItem"><b>Governance reference</b><br />{selected.governanceId || "Not supplied"}</div>
              <div className="vsm-detailItem"><b>Provenance</b><br />{selected.provenance} · confidence {selected.confidence}</div>
            </div>
            {selected.agentCandidateWithheld && <div className="vsm-blocked">AGENT CANDIDATE WITHHELD · a human owner and governance reference are both required.</div>}
            <EvidenceButtons ids={selected.evidenceIds} onSelect={onEvidenceSelect} />
          </section>
        )}
      </div>
      <footer className="vsm-footer"><span>Blueprint: UI §1.5 / §4.5 / §6.4 · BPR remains a hypothesis.</span><span>AI-assisted · human decides</span></footer>
    </section>
  );
}
