import React, { useEffect, useRef } from "react";

export default function VisualWorkspaceFrame({ id, label, layout, onLayoutChange, linear, children }) {
  const rootRef = useRef(null);
  const effective = linear ? "linear" : layout;
  const setLayout = (next) => {
    onLayoutChange(next);
    requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
  };
  useEffect(() => {
    const onKey = (event) => {
      if (!event.altKey || !event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (key === "f" && !linear) { event.preventDefault(); setLayout("floating"); }
      if (key === "d") { event.preventDefault(); setLayout("docked"); }
      if (key === "r") { event.preventDefault(); setLayout("docked"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <section ref={rootRef} tabIndex={-1} className={`vwf-root ${effective}`} data-testid={`visual-workspace-${id}`} data-layout={effective} aria-label={`${label} visual workspace`}>
      <style>{`
        .vwf-root{position:absolute;inset:0;z-index:12;min-height:0;display:grid;grid-template-rows:40px minmax(0,1fr);background:#f5f7fa;outline:none}.vwf-root.floating{inset:12px;border:1px solid #94a3b8;border-radius:12px;box-shadow:0 18px 50px rgba(15,23,42,.28);overflow:hidden}.vwf-chrome{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 8px;border-bottom:1px solid #cbd5e1;background:#fff}.vwf-title{font-size:9px;font-weight:900;color:#475569}.vwf-actions{display:flex;gap:5px}.vwf-actions button{min-height:30px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;padding:0 8px;font-size:8px;font-weight:900;cursor:pointer}.vwf-actions button[aria-pressed="true"]{border-color:#1a56db;background:#eef4ff;color:#1a56db}.vwf-actions button:disabled{opacity:.45;cursor:not-allowed}.vwf-actions button:focus-visible{outline:3px solid #1a56db;outline-offset:2px}.vwf-content{min-height:0;overflow:hidden}.vwf-content>*{height:100%}.vwf-root.linear{position:relative;inset:auto;min-height:1080px;grid-template-rows:auto minmax(0,1fr);box-shadow:none}.vwf-root.linear .vwf-chrome{align-items:flex-start;flex-direction:column}.vwf-root.linear .vwf-actions{width:100%}.vwf-root.linear .vwf-actions button{min-height:44px;flex:1}.vwf-root.linear .vwf-content{overflow:visible}.vwf-root.linear .vwf-content>*{height:auto;min-height:980px}
      `}</style>
      <header className="vwf-chrome"><span className="vwf-title">{label} · {effective === "linear" ? "mobile linear view" : `${effective} workspace`}</span><div className="vwf-actions" role="group" aria-label={`${label} workspace placement`}>
        <button type="button" data-testid={`visual-workspace-${id}-dock`} aria-pressed={effective === "docked"} onClick={() => setLayout("docked")}>Dock</button>
        <button type="button" data-testid={`visual-workspace-${id}-float`} aria-pressed={effective === "floating"} disabled={linear} onClick={() => setLayout("floating")}>Float</button>
        <button type="button" data-testid={`visual-workspace-${id}-restore`} onClick={() => setLayout("docked")}>Restore</button>
      </div></header>
      <div className="vwf-content">{children}</div>
    </section>
  );
}
