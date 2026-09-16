import React, { useState } from "react";
import { validateBlueprintTrace } from "./blueprintTraceData.js";

export default function BlueprintTracePanel({ traces, label = "Blueprint trace" }) {
  const [dismissed, setDismissed] = useState(false);
  const valid = (Array.isArray(traces) ? traces : []).filter((trace) => validateBlueprintTrace(trace).ok);
  if (dismissed) return <button type="button" className="bpt-restore" data-testid="blueprint-trace-restore" onClick={() => setDismissed(false)}>Restore {label.toLowerCase()}</button>;
  return (
    <aside className="bpt-root" data-testid="blueprint-trace" data-trace-count={valid.length} aria-label={label}>
      <style>{`.bpt-root{margin:8px 0;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;padding:8px;color:#1e293b}.bpt-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.bpt-head b{font-size:9px}.bpt-head button,.bpt-restore{min-height:44px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;padding:0 9px;font-size:8px;font-weight:900;color:#1e293b}.bpt-list{display:grid;gap:6px;margin-top:6px}.bpt-entry{border-left:3px solid #1a56db;padding-left:7px;font-size:8px;line-height:1.45}.bpt-entry[data-status="WITHHELD"],.bpt-entry[data-status="STALE"],.bpt-entry[data-status="ERROR"]{border-left-style:dashed;border-left-color:#b7791f}.bpt-id{font:7px/1.4 ui-monospace,monospace;color:#64748b;overflow-wrap:anywhere}.bpt-gap{color:#92400e}.bpt-restore{margin:8px 0}`}</style>
      <div className="bpt-head"><b>{label} · agent-readable · v1.0.0</b><button type="button" data-testid="blueprint-trace-dismiss" onClick={() => setDismissed(true)}>Dismiss</button></div>
      <div className="bpt-list">{valid.map((trace) => <article className="bpt-entry" data-testid="blueprint-trace-entry" data-requirement={trace.requirement} data-status={trace.status} key={trace.id}><b>{trace.requirement} · {trace.component} · {trace.status}</b><div>{trace.rule}</div><div className="bpt-id">sources: {trace.sourceIds.length ? trace.sourceIds.join(" · ") : "WITHHELD"}</div>{trace.knownGap && <div className="bpt-gap">known gap: {trace.knownGap}</div>}</article>)}</div>
    </aside>
  );
}
