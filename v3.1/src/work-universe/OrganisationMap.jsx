import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildOrganisationMapData } from "./organisationMapData.js";

function EvidenceButtons({ ids, onSelect }) {
  if (!ids.length) return <span className="om-noEvidence">No source-span link supplied</span>;
  return <span className="om-evidenceLinks">{ids.map((id) => <button key={id} type="button" onClick={() => onSelect?.(id)}>{id}</button>)}</span>;
}

function economyLabel(status) {
  return { governed: "GOVERNED", blocked: "BLOCKED", reserved: "RESERVED", unconfirmed: "UNCONFIRMED", withheld: "WITHHELD" }[status] || "WITHHELD";
}

function EconomyBand({ label, items, status, kind }) {
  return (
    <span className={`om-nodeEconomy ${kind} ${status}`}>
      <span><b>{label}</b><small>{items.length ? `${items.length} supplied` : "No classification supplied"}</small></span>
      <strong>{economyLabel(status)}</strong>
    </span>
  );
}

function EconomySummary({ label, items, status, kind }) {
  return (
    <section className={`om-economySummary ${kind}`} data-testid={`organisation-economy-${kind}`}>
      <div><div className="om-eyebrow">Organisation work allocation</div><div className="om-economyTitle">{label}</div></div>
      <span className={`om-chip ${status}`}>{economyLabel(status)}</span>
      <div className="om-economyCopy">{items.length ? `${items.length} explicit work classification${items.length === 1 ? "" : "s"}. No share or maturity score is calculated.` : `No ${label.toLowerCase()} classification was supplied. The map does not derive one from role or posting text.`}</div>
    </section>
  );
}

function EconomyItem({ item, onEvidenceSelect }) {
  return (
    <div className={`om-economyItem ${item.kind} ${item.status}`}>
      <div className="om-itemLine"><b>{item.label}</b><span className={`om-miniStatus ${item.status}`}>{economyLabel(item.status)}</span></div>
      {item.description && <p>{item.description}</p>}
      {item.kind === "agent" ? <><div className="om-itemMeta">Human owner · {item.humanOwner || "WITHHELD"}</div><div className="om-itemMeta">Governance reference · {item.governanceReference || "WITHHELD"}</div></> : <div className="om-itemMeta">Reserved reason · {item.reason || "WITHHELD"}</div>}
      <EvidenceButtons ids={item.evidenceIds} onSelect={onEvidenceSelect} />
    </div>
  );
}

function useChartPaths(boardRef, nodeRefs, nodes, edges) {
  const [geometry, setGeometry] = useState({ width: 0, height: 0, paths: [] });
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;
    const measure = () => {
      const boardRect = board.getBoundingClientRect();
      const paths = edges.flatMap((edge) => {
        const from = nodeRefs.current.get(edge.fromId)?.getBoundingClientRect();
        const to = nodeRefs.current.get(edge.toId)?.getBoundingClientRect();
        if (!from || !to) return [];
        if (to.top >= from.bottom - 4) {
          const x1 = from.left - boardRect.left + from.width / 2;
          const y1 = from.bottom - boardRect.top;
          const x2 = to.left - boardRect.left + to.width / 2;
          const y2 = to.top - boardRect.top;
          const midY = y1 + (y2 - y1) / 2;
          return [{ ...edge, d: `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}` }];
        }
        const leftToRight = to.left >= from.right;
        const x1 = (leftToRight ? from.right : from.left) - boardRect.left;
        const y1 = from.top - boardRect.top + from.height / 2;
        const x2 = (leftToRight ? to.left : to.right) - boardRect.left;
        const y2 = to.top - boardRect.top + to.height / 2;
        const midX = x1 + (x2 - x1) / 2;
        return [{ ...edge, d: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}` }];
      });
      setGeometry({ width: board.scrollWidth, height: board.scrollHeight, paths });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    nodes.forEach((node) => { const element = nodeRefs.current.get(node.id); if (element) observer.observe(element); });
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [boardRef, nodeRefs, nodes, edges]);
  return geometry;
}

export default function OrganisationMap({ result, roleTitle, organisationName, onBack, onEvidenceSelect, onOpenCompanyEvidence, onOpenAiMoments }) {
  const data = useMemo(() => buildOrganisationMapData(result), [result]);
  const [selectedDimensionKey, setSelectedDimensionKey] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const boardRef = useRef(null);
  const chartViewportRef = useRef(null);
  const nodeRefs = useRef(new Map());
  const selectedDimension = data.dimensions.find((dimension) => dimension.key === selectedDimensionKey) || null;
  const selectedNode = data.chartNodes.find((node) => node.id === selectedNodeId) || null;
  const depthRows = useMemo(() => {
    const rows = new Map();
    data.chartNodes.forEach((node) => rows.set(node.depth, [...(rows.get(node.depth) || []), node]));
    return [...rows.entries()].sort(([left], [right]) => left - right);
  }, [data.chartNodes]);
  const chartGeometry = useChartPaths(boardRef, nodeRefs, data.chartNodes, data.chartEdges);

  useEffect(() => {
    const viewport = chartViewportRef.current;
    if (!viewport || !data.chartNodes.length || !chartGeometry.width) return;
    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
  }, [chartGeometry.width, data.chartNodes.length]);

  return (
    <section className="om-root" data-testid="organisation-map" aria-label="Organisation Map">
      <style>{`
        .om-root{height:100%;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;background:#f3f6fb;color:#20213f;font-family:Inter,Arial,sans-serif}.om-root *{box-sizing:border-box;min-width:0}.om-root button{font:inherit;color:inherit}
        .om-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #e1e7f0;background:#fff}.om-eyebrow{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#4f46c7;font-weight:900}.om-title{font-family:Georgia,serif;font-size:clamp(18px,2vw,27px);font-weight:800;line-height:1.1;margin-top:2px}.om-meta{font-size:10px;color:#747991}.om-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.om-action{min-height:44px;border:1px solid #dce2ec;border-radius:9px;background:#fff;padding:0 12px;font-size:11px;font-weight:900;cursor:pointer}.om-action.primary{border-color:#625ae8;background:#f0efff;color:#4f46c7}.om-action:hover{border-color:#625ae8}.om-action:focus-visible,.om-card:focus-visible,.om-nodeSelect:focus-visible,.om-evidenceLinks button:focus-visible{outline:3px solid #635bdf;outline-offset:2px}
        .om-contract{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 16px;border-bottom:1px solid #e1e7f0;background:#fff}.om-boundary{font-size:11px;color:#687087;line-height:1.4}.om-coverage{display:flex;gap:6px;align-items:center;white-space:nowrap}.om-chip{display:inline-flex;align-items:center;min-height:25px;border:1px solid #cfd7e4;border-radius:999px;padding:3px 8px;background:#f8fafc;color:#596078;font-size:9px;font-weight:900}.om-chip.available,.om-chip.governed,.om-chip.reserved{border-color:#635bdf;background:#f0efff;color:#4f46c7}.om-chip.withheld,.om-chip.blocked,.om-chip.unconfirmed{border-style:dashed;background:#fff9eb;color:#9a5b10}
        .om-map{min-height:0;overflow-y:scroll;scrollbar-gutter:stable;padding:14px 16px 20px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.om-map::-webkit-scrollbar,.om-chartViewport::-webkit-scrollbar{width:9px;height:9px}.om-map::-webkit-scrollbar-thumb,.om-chartViewport::-webkit-scrollbar-thumb{background:#98a8b7;border:2px solid #f3f6fb;border-radius:999px}
        .om-economyGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}.om-economySummary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;align-items:start;border:1px solid #dce2ec;border-radius:12px;background:#fff;padding:11px 13px;box-shadow:0 4px 14px rgba(46,52,89,.05)}.om-economySummary.agent{border-top:3px solid #635bdf}.om-economySummary.human{border-top:3px solid #45a8d8}.om-economyTitle{font-size:13px;font-weight:900;margin-top:2px}.om-economyCopy{grid-column:1/-1;color:#747991;font-size:9px;line-height:1.4}
        .om-economyLedger{margin:-2px 0 12px;border:1px solid #dce2ec;border-radius:11px;background:#fff;overflow:hidden}.om-economyLedger summary{min-height:42px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;cursor:pointer;font-size:10px;font-weight:900;list-style:none}.om-economyLedger summary::-webkit-details-marker{display:none}.om-economyLedger summary::after{content:"+";color:#4f46c7;font-size:15px}.om-economyLedger[open] summary::after{content:"−"}.om-economyLedgerBody{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 12px 12px;border-top:1px solid #e8ecf3}.om-economyLedgerColumn{padding-top:10px}.om-economyLedgerColumn .om-economyItem{margin-top:6px}
        .om-chartSection{border:1px solid #dce2ec;border-radius:14px;background:#fff;box-shadow:0 7px 24px rgba(46,52,89,.06);overflow:hidden}.om-chartHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 13px;border-bottom:1px solid #e8ecf3}.om-chartTitle{font-size:12px;font-weight:900}.om-roleAnchor{border:1px solid #cbc8f9;border-radius:9px;background:#f5f4ff;padding:6px 9px;text-align:right}.om-roleAnchor b{display:block;font-size:10px}.om-roleAnchor small{display:block;color:#747991;font-size:8px}.om-chartViewport{min-height:220px;max-height:540px;overflow:auto;scrollbar-gutter:stable;background-color:#f9fbfe;background-image:radial-gradient(circle,#dbe2ed 1px,transparent 1px);background-size:18px 18px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.om-chartBoard{position:relative;min-width:760px;min-height:220px}.om-chartSvg{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:visible}.om-chartPath{fill:none;stroke:#78a8d9;stroke-width:1.6;vector-effect:non-scaling-stroke}.om-chartPath.unlinked{stroke:#aab7c8;stroke-dasharray:5 5}.om-chartRows{position:relative;z-index:2;display:grid;gap:54px;padding:28px 34px 34px}.om-chartRow{display:flex;justify-content:center;align-items:flex-start;gap:28px}.om-node{flex:0 0 244px;width:244px;border:1px solid #d7deea;border-radius:12px;background:rgba(255,255,255,.98);box-shadow:0 7px 20px rgba(46,52,89,.08);overflow:hidden}.om-node.selected{border-color:#635bdf;box-shadow:0 0 0 3px rgba(99,91,223,.11),0 8px 24px rgba(46,52,89,.1)}.om-nodeSelect{width:100%;border:0;background:transparent;padding:10px 11px;text-align:left;cursor:pointer}.om-nodeTop{display:flex;justify-content:space-between;gap:8px;align-items:start}.om-nodeKind{display:block;color:#747991;font-size:8px;text-transform:uppercase;letter-spacing:.07em}.om-nodeTitle{display:block;font-size:12px;font-weight:900;line-height:1.2;margin-top:2px}.om-nodeSource{color:#635bdf;font-size:8px;font-weight:900}.om-nodeEconomy{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:7px;margin-top:7px;border:1px solid #e3e7ef;border-radius:7px;padding:5px 6px}.om-nodeEconomy.agent{background:#f6f4ff}.om-nodeEconomy.human{background:#f0f9fd}.om-nodeEconomy b{display:block;font-size:8px}.om-nodeEconomy small{display:block;margin-top:1px;color:#747991;font-size:7px}.om-nodeEconomy strong{font-size:7px;color:#4f46c7}.om-nodeEconomy.blocked strong,.om-nodeEconomy.unconfirmed strong,.om-nodeEconomy.withheld strong{color:#9a5b10}.om-chartEmpty{margin:34px auto;width:min(520px,calc(100% - 48px));border:1px dashed #bac5d4;border-radius:11px;background:#fff;padding:18px;text-align:center;color:#687087;font-size:10px;line-height:1.5}
        .om-gridLabel{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:15px 1px 8px}.om-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;position:relative}.om-card{min-height:144px;border:1px solid #dce2ec;border-radius:11px;background:#fff;padding:11px;text-align:left;cursor:pointer;box-shadow:0 3px 12px rgba(46,52,89,.04)}.om-card:hover,.om-card.active{border-color:#635bdf;box-shadow:0 0 0 2px rgba(99,91,223,.08)}.om-card.withheld{border-style:dashed;background:#fffbf1}.om-cardHead{display:flex;justify-content:space-between;gap:8px;align-items:start;border-bottom:1px solid #e8ecf3;padding-bottom:8px}.om-cardTitle{font-size:11px;font-weight:900}.om-count{font-family:"Spline Sans Mono",monospace;font-size:10px;color:#4f46c7;font-weight:900}.om-list{display:grid;gap:6px;margin-top:8px}.om-item,.om-economyItem{border-radius:8px;background:#f8fafc;padding:8px;font-size:10px;line-height:1.3}.om-itemMeta{margin-top:3px;color:#747991;font-size:8px}.om-empty{font-size:10px;line-height:1.45;color:#6b7280;padding-top:10px}.om-withheldLabel{display:inline-flex;align-items:center;border:1px dashed #d6b66d;border-radius:999px;padding:2px 7px;margin-top:7px;background:#fff;font-size:8px;font-weight:900;color:#9a5b10}
        .om-detail{margin-top:12px;border:1px solid #dce2ec;border-radius:11px;background:#fff;padding:12px}.om-detailTitle{font-family:Georgia,serif;font-size:16px;font-weight:800}.om-detail p,.om-economyItem p{font-size:10px;color:#687087;line-height:1.45}.om-detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}.om-economyItem.agent{border-left:3px solid #635bdf}.om-economyItem.human{border-left:3px solid #45a8d8}.om-itemLine{display:flex;justify-content:space-between;gap:8px}.om-miniStatus{font-size:7px;font-weight:900;color:#4f46c7}.om-miniStatus.blocked,.om-miniStatus.unconfirmed{color:#9a5b10}.om-evidenceLinks{display:inline-flex;gap:4px;flex-wrap:wrap;margin-top:4px}.om-evidenceLinks button{min-width:44px;min-height:44px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#4f46c7;font-size:9px;font-weight:900;cursor:pointer}.om-noEvidence{display:block;color:#747991;font-size:9px;margin-top:5px}.om-relationship{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center;border-top:1px solid #e8ecf3;padding:8px 0;font-size:10px}.om-arrow{color:#4f46c7;font-weight:900;text-align:center}.om-footer{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 16px;border-top:1px solid #e1e7f0;background:#fff;color:#747991;font-size:9px}
        @media(max-width:900px){.om-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.om-head{align-items:flex-start}.om-actions{max-width:48%}.om-chartViewport{max-height:470px}}
        @media(max-width:600px){.om-head,.om-contract,.om-footer{grid-template-columns:1fr;display:grid}.om-actions{max-width:none;justify-content:stretch}.om-action{width:100%}.om-economyGrid,.om-economyLedgerBody,.om-grid,.om-detailGrid{grid-template-columns:1fr}.om-card{min-height:0}.om-coverage{white-space:normal}.om-relationship{grid-template-columns:1fr}.om-arrow{text-align:left}.om-chartHead{align-items:flex-start}.om-roleAnchor{max-width:48%}.om-chartViewport{max-height:430px}}
        @media(prefers-reduced-motion:reduce){.om-root *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>
      <header className="om-head"><div><div className="om-eyebrow">Organisation Work Graph · dedicated visual</div><div className="om-title">Organisation Map</div><div className="om-meta">{organisationName || "Organisation evidence pending"} · role anchor: {roleTitle || "Role evidence pending"}</div></div><div className="om-actions"><button data-testid="organisation-map-back" type="button" className="om-action" onClick={onBack}>← Five-graph universe</button><button data-testid="organisation-map-company-evidence" type="button" className="om-action" onClick={onOpenCompanyEvidence}>Company evidence</button><button data-testid="organisation-map-ai-moments" type="button" className="om-action primary" onClick={onOpenAiMoments}>AI Moments · Cards | Neural →</button></div></header>
      <div className="om-contract"><div className="om-boundary"><b>Evidence boundary:</b> {data.boundary}</div><div className="om-coverage"><span className={`om-chip ${data.status}`}>{data.status === "available" ? "SUPPLIED" : "WITHHELD"}</span><span className="om-chip">{data.coverageLabel} dimensions evidenced</span></div></div>
      <div className="om-map">
        <div className="om-economyGrid"><EconomySummary label="Agent economy" items={data.economy.agent} status={data.economy.agentStatus} kind="agent" /><EconomySummary label="Human-reserved economy" items={data.economy.humanReserved} status={data.economy.humanReservedStatus} kind="human" /></div>
        {(data.economy.agent.length > 0 || data.economy.humanReserved.length > 0) && <details className="om-economyLedger" data-testid="organisation-economy-ledger"><summary>Review supplied economy classifications <span className="om-meta">owner · governance / reason · source</span></summary><div className="om-economyLedgerBody"><div className="om-economyLedgerColumn"><div className="om-economyTitle">Agent economy</div>{data.economy.agent.length ? data.economy.agent.map((item) => <EconomyItem key={`ledger-${item.id}`} item={item} onEvidenceSelect={onEvidenceSelect} />) : <div className="om-empty">No agent-economy classification supplied.</div>}</div><div className="om-economyLedgerColumn"><div className="om-economyTitle">Human-reserved economy</div>{data.economy.humanReserved.length ? data.economy.humanReserved.map((item) => <EconomyItem key={`ledger-${item.id}`} item={item} onEvidenceSelect={onEvidenceSelect} />) : <div className="om-empty">No human-reserved classification supplied.</div>}</div></div></details>}
        <section className="om-chartSection" data-testid="organisation-chart">
          <div className="om-chartHead"><div><div className="om-eyebrow">Supplied structure</div><div className="om-chartTitle">Functions, teams, roles and explicit boundaries</div></div><div className="om-roleAnchor"><b>{roleTitle || "Role evidence pending"}</b><small>View anchor · not an organisation node</small></div></div>
          <div className="om-chartViewport" ref={chartViewportRef}><div className="om-chartBoard" ref={boardRef}>
            {chartGeometry.width > 0 && <svg className="om-chartSvg" width={chartGeometry.width} height={chartGeometry.height} viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`} aria-hidden="true">{chartGeometry.paths.map((path) => <path key={path.id} data-edge-id={path.id} className={`om-chartPath ${path.linked ? "linked" : "unlinked"}`} d={path.d} />)}</svg>}
            {depthRows.length ? <div className="om-chartRows">{depthRows.map(([depth, nodes]) => <div key={depth} className="om-chartRow" data-depth={depth}>{nodes.map((node) => <article key={node.id} ref={(element) => { if (element) nodeRefs.current.set(node.id, element); else nodeRefs.current.delete(node.id); }} className={`om-node ${selectedNodeId === node.id ? "selected" : ""}`} data-testid={`organisation-node-${node.id}`}><button type="button" className="om-nodeSelect" onClick={() => setSelectedNodeId(selectedNodeId === node.id ? null : node.id)} aria-expanded={selectedNodeId === node.id}><span className="om-nodeTop"><span><span className="om-nodeKind">{node.kind}</span><span className="om-nodeTitle">{node.label}</span></span><span className="om-nodeSource">{node.evidenceIds.length ? `${node.evidenceIds.length} source` : "UNLINKED"}</span></span><EconomyBand label="Agent economy" items={node.agentEconomy} status={node.agentEconomy.length ? (node.agentEconomy.every((item) => item.status === "governed") ? "governed" : "blocked") : "withheld"} kind="agent" /><EconomyBand label="Human-reserved" items={node.humanReservedEconomy} status={node.humanReservedEconomy.length ? (node.humanReservedEconomy.every((item) => item.status === "reserved") ? "reserved" : "unconfirmed") : "withheld"} kind="human" /></button></article>)}</div>)}</div> : <div className="om-chartEmpty">No organisation node or function was supplied. Reporting lines, teams and hierarchy remain withheld; the role title is not converted into an organisation chart.</div>}
          </div></div>
        </section>
        {selectedNode && <section className="om-detail" data-testid="organisation-node-detail" aria-live="polite"><div className="om-eyebrow">Selected organisation node</div><div className="om-detailTitle">{selectedNode.label}</div>{selectedNode.description && <p>{selectedNode.description}</p>}<EvidenceButtons ids={selectedNode.evidenceIds} onSelect={onEvidenceSelect} /><div className="om-detailGrid"><div><div className="om-economyTitle">Agent economy</div>{selectedNode.agentEconomy.length ? selectedNode.agentEconomy.map((item) => <EconomyItem key={item.id} item={item} onEvidenceSelect={onEvidenceSelect} />) : <div className="om-empty">No agent-economy classification supplied. <span className="om-withheldLabel">WITHHELD</span></div>}</div><div><div className="om-economyTitle">Human-reserved economy</div>{selectedNode.humanReservedEconomy.length ? selectedNode.humanReservedEconomy.map((item) => <EconomyItem key={item.id} item={item} onEvidenceSelect={onEvidenceSelect} />) : <div className="om-empty">No human-reserved classification supplied. <span className="om-withheldLabel">WITHHELD</span></div>}</div></div></section>}
        <div className="om-gridLabel"><div><div className="om-eyebrow">Blueprint coverage</div><div className="om-chartTitle">Six organisation evidence dimensions</div></div><span className="om-meta">Select a dimension for trace detail</span></div>
        <div className="om-grid">{data.dimensions.map((dimension) => <button key={dimension.key} data-testid={`organisation-map-${dimension.key}`} type="button" className={`om-card ${dimension.status} ${selectedDimensionKey === dimension.key ? "active" : ""}`} onClick={() => setSelectedDimensionKey(selectedDimensionKey === dimension.key ? null : dimension.key)} aria-expanded={selectedDimensionKey === dimension.key}><span className="om-cardHead"><span className="om-cardTitle">{dimension.label}</span><span className="om-count">{dimension.items.length || "—"}</span></span>{dimension.items.length ? <span className="om-list">{dimension.items.slice(0, 3).map((item) => <span key={item.id} className="om-item"><b>{item.label}</b>{item.direction && <span className="om-itemMeta">{item.direction}</span>}</span>)}{dimension.items.length > 3 && <span className="om-itemMeta">+ {dimension.items.length - 3} more supplied item{dimension.items.length - 3 === 1 ? "" : "s"}</span>}</span> : <span className="om-empty">{dimension.empty}<span className="om-withheldLabel">WITHHELD</span></span>}</button>)}</div>
        {selectedDimension && <section className="om-detail" data-testid="organisation-map-detail" aria-live="polite"><div className="om-eyebrow">Selected map dimension</div><div className="om-detailTitle">{selectedDimension.label}</div>{selectedDimension.items.length ? selectedDimension.items.map((item) => <div key={item.id} className="om-item"><b>{item.label}</b>{item.description && <p>{item.description}</p>}{item.owner && <div className="om-itemMeta">Owner · {item.owner}</div>}<div className="om-itemMeta">{item.provenance} · confidence {item.confidence}</div><EvidenceButtons ids={item.evidenceIds} onSelect={onEvidenceSelect} /></div>) : <div className="om-empty">{selectedDimension.empty}</div>}</section>}
        <section className="om-detail" data-testid="organisation-map-relationships"><div className="om-eyebrow">Explicit relationship paths</div><div className="om-detailTitle">Reporting and collaboration links</div>{data.relationships.length ? data.relationships.map((relationship) => <div key={relationship.id} className="om-relationship"><b>{relationship.from}</b><span className="om-arrow">— {relationship.label} →</span><b>{relationship.to}</b><EvidenceButtons ids={relationship.evidenceIds} onSelect={onEvidenceSelect} /></div>) : <div className="om-empty">No explicit relationship edge was supplied. The map does not connect functions, owners or reporting lines by assumption. <span className="om-withheldLabel">WITHHELD</span></div>}</section>
      </div>
      <footer className="om-footer"><span>Blueprint: UI §4.5 / §6.2 · Supplied structure and work allocation only</span><span>AI-assisted · human decides</span></footer>
    </section>
  );
}
