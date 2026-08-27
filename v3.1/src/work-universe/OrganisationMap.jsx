import React, { useMemo, useState } from "react";
import { buildOrganisationMapData } from "./organisationMapData.js";

function EvidenceButtons({ ids, onSelect }) {
  if (!ids.length) return <span className="om-noEvidence">No source-span link supplied</span>;
  return (
    <span className="om-evidenceLinks">
      {ids.map((id) => (
        <button key={id} type="button" onClick={() => onSelect?.(id)}>{id}</button>
      ))}
    </span>
  );
}

export default function OrganisationMap({ result, roleTitle, organisationName, onBack, onEvidenceSelect, onOpenCompanyEvidence, onOpenAiMoments }) {
  const data = useMemo(() => buildOrganisationMapData(result), [result]);
  const [selected, setSelected] = useState(null);
  const selectedDimension = data.dimensions.find((dimension) => dimension.key === selected) || null;

  return (
    <section className="om-root" data-testid="organisation-map" aria-label="Organisation Map">
      <style>{`
        .om-root{height:100%;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;background:#f5f7fa;color:#1a202c;font-family:Inter,Arial,sans-serif}
        .om-root *{box-sizing:border-box;min-width:0}.om-root button{font:inherit;color:inherit}
        .om-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #e7edf4;background:#fff}.om-eyebrow{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#1a56db;font-weight:900}.om-title{font-family:Georgia,serif;font-size:clamp(18px,2vw,28px);font-weight:800;line-height:1.1;margin-top:2px}.om-meta{font-size:10px;color:#6b7a8d}.om-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.om-action{min-height:44px;border:1px solid #dde3ec;border-radius:8px;background:#fff;padding:0 12px;font-size:11px;font-weight:900;cursor:pointer}.om-action.primary{border-color:#1a56db;background:#e8f0fe;color:#1a56db}.om-action:hover{border-color:#1a56db}.om-action:focus-visible,.om-card:focus-visible,.om-item button:focus-visible,.om-evidenceLinks button:focus-visible{outline:3px solid #1a56db;outline-offset:2px}
        .om-contract{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 16px;border-bottom:1px solid #e7edf4;background:#fff}.om-boundary{font-size:11px;color:#64748b;line-height:1.4}.om-coverage{display:flex;gap:6px;align-items:center;white-space:nowrap}.om-chip{display:inline-flex;align-items:center;min-height:25px;border:1px solid #cbd5e1;border-radius:999px;padding:3px 8px;background:#f8fafc;color:#475569;font-size:9px;font-weight:900}.om-chip.available{border-color:#1a56db;background:#eef4ff;color:#1a56db}.om-chip.withheld{border-style:dashed;background:#fffbeb;color:#92400e}
        .om-map{min-height:0;overflow-y:scroll;scrollbar-gutter:stable;padding:14px 16px 18px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.om-map::-webkit-scrollbar{width:9px}.om-map::-webkit-scrollbar-thumb{background:#98a8b7;border:2px solid #f5f7fa;border-radius:999px}.om-anchor{width:min(520px,92%);margin:0 auto 12px;border:2px solid #1a56db;border-radius:12px;background:#e8f0fe;padding:12px 16px;text-align:center;box-shadow:0 1px 3px rgba(16,24,40,.08)}.om-anchorLabel{font-size:9px;letter-spacing:.08em;color:#1a56db;font-weight:900}.om-anchorTitle{font-family:Georgia,serif;font-size:18px;font-weight:800;margin:2px 0}.om-anchorMeta{font-size:10px;color:#64748b}
        .om-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;position:relative}.om-card{min-height:154px;border:1px solid #dde3ec;border-radius:10px;background:#fff;padding:11px;text-align:left;cursor:pointer;box-shadow:0 1px 2px rgba(16,24,40,.04)}.om-card:hover,.om-card.active{border-color:#1a56db;box-shadow:0 0 0 2px rgba(26,86,219,.08)}.om-card.withheld{border-style:dashed;background:#fffbeb}.om-cardHead{display:flex;justify-content:space-between;gap:8px;align-items:start;border-bottom:1px solid #e7edf4;padding-bottom:8px}.om-cardTitle{font-size:11px;font-weight:900}.om-count{font-family:"Spline Sans Mono",monospace;font-size:10px;color:#1a56db;font-weight:900}.om-list{display:grid;gap:6px;margin-top:8px}.om-item{border-radius:7px;background:#f8fafc;padding:7px 8px;font-size:10px;line-height:1.3}.om-item button{width:100%;min-height:36px;border:0;background:transparent;text-align:left;padding:0;cursor:pointer}.om-itemMeta{margin-top:3px;color:#64748b;font-size:8px}.om-empty{font-size:10px;line-height:1.45;color:#6b7280;padding-top:10px}.om-withheldLabel{display:inline-flex;align-items:center;border:1px dashed #d6b66d;border-radius:999px;padding:2px 7px;margin-top:7px;background:#fff;font-size:8px;font-weight:900;color:#92400e}
        .om-detail{margin-top:12px;border:1px solid #dde3ec;border-radius:10px;background:#fff;padding:12px}.om-detailTitle{font-family:Georgia,serif;font-size:16px;font-weight:800}.om-detail p{font-size:10px;color:#64748b;line-height:1.45}.om-evidenceLinks{display:inline-flex;gap:4px;flex-wrap:wrap;margin-top:4px}.om-evidenceLinks button{min-width:44px;min-height:44px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1a56db;font-size:9px;font-weight:900;cursor:pointer}.om-noEvidence{display:block;color:#64748b;font-size:9px;margin-top:5px}.om-relationship{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center;border-top:1px solid #e7edf4;padding:8px 0;font-size:10px}.om-arrow{color:#1a56db;font-weight:900;text-align:center}.om-footer{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 16px;border-top:1px solid #e7edf4;background:#fff;color:#64748b;font-size:9px}
        @media(max-width:900px){.om-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.om-head{align-items:flex-start}.om-actions{max-width:48%}}
        @media(max-width:600px){.om-head,.om-contract,.om-footer{grid-template-columns:1fr;display:grid}.om-actions{max-width:none;justify-content:stretch}.om-action{width:100%}.om-grid{grid-template-columns:1fr}.om-card{min-height:0}.om-coverage{white-space:normal}.om-relationship{grid-template-columns:1fr}.om-arrow{text-align:left}}
        @media(prefers-reduced-motion:reduce){.om-root *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>
      <header className="om-head">
        <div>
          <div className="om-eyebrow">Organisation Work Graph · dedicated visual</div>
          <div className="om-title">Organisation Map</div>
          <div className="om-meta">{organisationName || "Organisation evidence pending"} · role anchor: {roleTitle || "Role evidence pending"}</div>
        </div>
        <div className="om-actions">
          <button data-testid="organisation-map-back" type="button" className="om-action" onClick={onBack}>← Five-graph universe</button>
          <button data-testid="organisation-map-company-evidence" type="button" className="om-action" onClick={onOpenCompanyEvidence}>Company evidence</button>
          <button data-testid="organisation-map-ai-moments" type="button" className="om-action primary" onClick={onOpenAiMoments}>AI Moments · Cards | Neural →</button>
        </div>
      </header>
      <div className="om-contract">
        <div className="om-boundary"><b>Evidence boundary:</b> {data.boundary}</div>
        <div className="om-coverage"><span className={`om-chip ${data.status}`}>{data.status === "available" ? "SUPPLIED" : "WITHHELD"}</span><span className="om-chip">{data.coverageLabel} dimensions evidenced</span></div>
      </div>
      <div className="om-map">
        <div className="om-anchor">
          <div className="om-anchorLabel">ROLE EVIDENCE ANCHOR</div>
          <div className="om-anchorTitle">{roleTitle || "Role evidence pending"}</div>
          <div className="om-anchorMeta">The role centres the supplied map; it does not prove the organisation's complete structure.</div>
        </div>
        <div className="om-grid">
          {data.dimensions.map((dimension) => (
            <button
              key={dimension.key}
              data-testid={`organisation-map-${dimension.key}`}
              type="button"
              className={`om-card ${dimension.status} ${selected === dimension.key ? "active" : ""}`}
              onClick={() => setSelected(selected === dimension.key ? null : dimension.key)}
              aria-expanded={selected === dimension.key}
            >
              <span className="om-cardHead"><span className="om-cardTitle">{dimension.label}</span><span className="om-count">{dimension.items.length || "—"}</span></span>
              {dimension.items.length ? (
                <span className="om-list">
                  {dimension.items.slice(0, 3).map((item) => <span key={item.id} className="om-item"><b>{item.label}</b>{item.direction && <span className="om-itemMeta">{item.direction}</span>}</span>)}
                  {dimension.items.length > 3 && <span className="om-itemMeta">+ {dimension.items.length - 3} more supplied item{dimension.items.length - 3 === 1 ? "" : "s"}</span>}
                </span>
              ) : <span className="om-empty">{dimension.empty}<span className="om-withheldLabel">WITHHELD</span></span>}
            </button>
          ))}
        </div>
        {selectedDimension && (
          <section className="om-detail" data-testid="organisation-map-detail" aria-live="polite">
            <div className="om-eyebrow">Selected map dimension</div>
            <div className="om-detailTitle">{selectedDimension.label}</div>
            {selectedDimension.items.length ? selectedDimension.items.map((item) => (
              <div key={item.id} className="om-item">
                <b>{item.label}</b>
                {item.description && <p>{item.description}</p>}
                {item.owner && <div className="om-itemMeta">Owner · {item.owner}</div>}
                <div className="om-itemMeta">{item.provenance} · confidence {item.confidence}</div>
                <EvidenceButtons ids={item.evidenceIds} onSelect={onEvidenceSelect} />
              </div>
            )) : <div className="om-empty">{selectedDimension.empty}</div>}
          </section>
        )}
        <section className="om-detail" data-testid="organisation-map-relationships">
          <div className="om-eyebrow">Explicit relationship paths</div>
          <div className="om-detailTitle">Reporting and collaboration links</div>
          {data.relationships.length ? data.relationships.map((relationship) => (
            <div key={relationship.id} className="om-relationship">
              <b>{relationship.from}</b><span className="om-arrow">— {relationship.label} →</span><b>{relationship.to}</b>
              <EvidenceButtons ids={relationship.evidenceIds} onSelect={onEvidenceSelect} />
            </div>
          )) : <div className="om-empty">No explicit relationship edge was supplied. The map does not connect functions, owners or reporting lines by assumption. <span className="om-withheldLabel">WITHHELD</span></div>}
        </section>
      </div>
      <footer className="om-footer"><span>Blueprint: UI §4.5 / §6.2 · Graph question: who owns, reports, depends and collaborates?</span><span>AI-assisted · human decides</span></footer>
    </section>
  );
}
