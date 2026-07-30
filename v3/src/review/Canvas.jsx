// v3/src/review/Canvas.jsx - PR 1 "Step 3 Working Canvas" (Human Lead, 30-07 '26 §2.1).
//
// A PERSISTENT workspace shell for Step 3:
//
//   Persistent Step 3 canvas
//   |-- Main document: Job Advertisement          (the manuscript window, unchanged)
//   |-- Floating window: Role Graph               (rolePane / RoleGraphPanel, unchanged)
//   |-- Right drawer: Company Information         (ACRA + employer reality)
//   |-- Bottom drawer: Evidence / Explanation     (the inspector window, unchanged)
//   +-- Minimise tray
//
// The point of the PR (§1.1) is to prove the canvas reduces the present complexity: the
// core review (read ad -> inspect graph -> check company -> read evidence) happens WITHOUT
// changing tabs. Nothing is deleted - the six analysis tabs stay one click away behind
// "More analysis", and every window body is the SAME renderWindow(id) output as before.
//
// Option 1 (the standing Step 3 rule, see Desk.jsx): ALL user/persistent state lives in
// ReviewStudio.jsx and arrives here as props. This file is layout + interaction only.
//
// HIDE, DO NOT UNMOUNT (the load-bearing decision). §3.5 requires that reopening the Role
// Graph preserves its ESCO/SSOC selection and its selected node - both of which are state
// INSIDE RoleGraphPanel, which §2.2 forbids changing. So a minimised tool is never removed
// from the tree: its container is styled display:none. React keeps the subtree mounted, so
// the graph's internal state survives minimise/restore/dock/expand for free, with zero
// changes to the graph component.
import { useEffect, useRef } from "react";
import { RS_LAYERS } from "./rs-rules.js";

// Tool ids this canvas manages. PR 1 is deliberately three - no Company Graph, no GCN (§2.3).
export const WS_TOOLS = ["roleGraph", "company", "evidence"];
export const WS_LABELS = { roleGraph: "Role Graph", company: "Company Information", evidence: "Evidence / Explanation" };
// Placement per tool: "window" = the managed floating window (4 states); "right"/"bottom"
// = edge drawers (open | minimized). Kept as data so PR 2 can add tools without new branches.
export const WS_PLACEMENT = { roleGraph: "window", company: "right", evidence: "bottom" };

// Default geometry for the managed floating window. §3.4: upper-right on desktop.
export const WS_DEFAULT_GEOM = { roleGraph: { w: 560, h: 470 }, company: { w: 400 }, evidence: { h: 320 } };
const DOCK_W = 380;      // docked-window column width
const RIGHT_W_MIN = 300;
const BOTTOM_H_MIN = 160;

// The initial workspace (what "Reset workspace" returns to, §3.1). The ad is the document;
// the graph floats over it; the two drawers wait in the tray so the first read is quiet.
export function wsInitial() {
  return {
    roleGraph: { state: "floating", x: null, y: null, w: WS_DEFAULT_GEOM.roleGraph.w, h: WS_DEFAULT_GEOM.roleGraph.h },
    company: { state: "minimized", w: WS_DEFAULT_GEOM.company.w },
    evidence: { state: "minimized", h: WS_DEFAULT_GEOM.evidence.h },
  };
}

const mono = "'Spline Sans Mono',monospace";
const sans = "'Spline Sans',sans-serif";

// A workspace toolbar button. 44px min target (house rule, CLAUDE.md section 4).
function wsBtn(extra) {
  return {
    minHeight: 44, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6,
    fontFamily: sans, fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap",
    color: "#25324a", background: "#fff", border: "1px solid #d9dee6", borderRadius: 8,
    cursor: "pointer", flexShrink: 0, ...(extra || {}),
  };
}
// Window chrome button (smaller, still >=44 on the touch axis via minHeight).
function chromeBtn(on) {
  return {
    flex: "none", minHeight: 44, minWidth: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontFamily: mono, fontSize: "0.6875rem", fontWeight: 700,
    color: on ? "#fff" : "#4a5568", background: on ? "#142a8e" : "#fff",
    border: "1px solid " + (on ? "#142a8e" : "#e2e0d8"), borderRadius: 7, cursor: "pointer",
  };
}

export default function Canvas({
  isNarrow,
  mainEl, mainLabel, mainToolbar,
  toolEl,                    // { roleGraph, company, evidence } -> JSX (rendered once, never swapped)
  trayNote,                  // { roleGraph: "ESCO" | "SSOC" | ... } -> tray sub-label
  ws, setWinState, setGeom,  // workspace state + setters (owned by ReviewStudio)
  onArrange, onMinimiseAll, onResetWorkspace,
  moreOpen, setMoreOpen, moreEl, barRef,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const winRef = useRef(null);
  // §3.5: preserve WINDOW SIZE. The window is CSS-resizable (resize:both, same affordance
  // the existing float layer uses), so the authoritative size lives in the DOM, not in
  // state. Observe it and write it back, guarded so the state->style->observer round trip
  // settles instead of looping.
  useEffect(() => {
    const el = winRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const g = ws.roleGraph;
        if (!g || g.state !== "floating") return;
        const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
        if (!w || !h) return;
        if (Math.abs(w - g.w) > 2 || Math.abs(h - g.h) > 2) setGeom("roleGraph", { w, h });
      });
    });
    ro.observe(el);
    return () => { if (raf) cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.roleGraph && ws.roleGraph.state, ws.roleGraph && ws.roleGraph.w, ws.roleGraph && ws.roleGraph.h]);

  const rg = ws.roleGraph || {};
  const co = ws.company || {};
  const ev = ws.evidence || {};
  const rightOpen = co.state !== "minimized";
  const bottomOpen = ev.state !== "minimized";
  // A docked/expanded graph shares the canvas with the document, so the document's own
  // box has to give up the room - padding rather than a flex sibling, because the window
  // is one absolutely-positioned element in every state (see HIDE, DO NOT UNMOUNT above).
  const graphTakesRoom = !isNarrow && rg.state === "docked";
  const mainPadRight = (graphTakesRoom ? DOCK_W : 0) + (!isNarrow && rightOpen ? Math.max(RIGHT_W_MIN, co.w || WS_DEFAULT_GEOM.company.w) : 0);
  const mainPadBottom = !isNarrow && bottomOpen ? Math.max(BOTTOM_H_MIN, ev.h || WS_DEFAULT_GEOM.evidence.h) : 0;

  // Default upper-right (§3.4), resolved at paint so it tracks the real canvas width.
  const rgPos = (() => {
    if (isNarrow) return null;
    const box = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
    const w = rg.w || WS_DEFAULT_GEOM.roleGraph.w;
    const x = rg.x == null ? Math.max(12, (box ? box.width : 1200) - w - 24 - (rightOpen ? Math.max(RIGHT_W_MIN, co.w || 400) : 0)) : rg.x;
    const y = rg.y == null ? 16 : rg.y;
    return { x, y };
  })();

  const startDrag = (e) => {
    if (isNarrow || rg.state !== "floating") return;
    if (e.target && e.target.closest && e.target.closest("button")) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: (rgPos && rgPos.x) || 0, oy: (rgPos && rgPos.y) || 0 };
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d || !canvasRef.current) return;
    const box = canvasRef.current.getBoundingClientRect();
    // Clamp inside the canvas so a dragged window is always recoverable without a reset
    // (the same guard the existing float layer applies on resize).
    setGeom("roleGraph", {
      x: Math.max(0, Math.min(box.width - 120, d.ox + e.clientX - d.sx)),
      y: Math.max(0, Math.min(box.height - 60, d.oy + e.clientY - d.sy)),
    });
  };
  const stopDrag = () => { dragRef.current = null; };
  // Keyboard move (§5.2 item 9): the drag handle is focusable and arrow-steppable, so a
  // window can be positioned without a pointer.
  const keyMove = (e) => {
    if (isNarrow || rg.state !== "floating") return;
    const step = e.shiftKey ? 40 : 16;
    const p = rgPos || { x: 0, y: 0 };
    if (e.key === "ArrowLeft") { e.preventDefault(); setGeom("roleGraph", { x: Math.max(0, p.x - step), y: p.y }); }
    if (e.key === "ArrowRight") { e.preventDefault(); setGeom("roleGraph", { x: p.x + step, y: p.y }); }
    if (e.key === "ArrowUp") { e.preventDefault(); setGeom("roleGraph", { x: p.x, y: Math.max(0, p.y - step) }); }
    if (e.key === "ArrowDown") { e.preventDefault(); setGeom("roleGraph", { x: p.x, y: p.y + step }); }
  };

  // Managed-window shell style per state. Narrow screens never get a draggable box:
  // every open tool becomes a full-screen sheet (§5.2 item 10).
  const winShell = (() => {
    const base = { background: "#fbfaf8", display: "flex", flexDirection: "column", overflow: "hidden" };
    if (rg.state === "minimized") return { ...base, display: "none" };
    if (isNarrow) return { ...base, position: "fixed", inset: 0, zIndex: RS_LAYERS.float, animation: "wisSlideIn .25s ease" };
    if (rg.state === "expanded") return { ...base, position: "absolute", left: 8, top: 8, right: 8 + (rightOpen ? Math.max(RIGHT_W_MIN, co.w || 400) : 0), bottom: 8 + mainPadBottom, zIndex: 12, border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)" };
    if (rg.state === "docked") return { ...base, position: "absolute", top: 0, bottom: mainPadBottom, right: rightOpen ? Math.max(RIGHT_W_MIN, co.w || 400) : 0, width: DOCK_W, zIndex: 8, borderLeft: "1px solid #d9dee6" };
    return { ...base, position: "absolute", left: (rgPos && rgPos.x) || 0, top: (rgPos && rgPos.y) || 0, width: rg.w || WS_DEFAULT_GEOM.roleGraph.w, height: rg.h || WS_DEFAULT_GEOM.roleGraph.h, zIndex: 12, border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)", resize: "both", minWidth: 300, minHeight: 220, maxWidth: "96%", maxHeight: "92%" };
  })();

  const drawerShell = (kind, open) => {
    const base = { background: "#fbfaf8", display: "flex", flexDirection: "column", overflow: "hidden" };
    if (!open) return { ...base, display: "none" };
    if (isNarrow) return { ...base, position: "fixed", inset: 0, zIndex: RS_LAYERS.sheet, animation: "wisSlideIn .25s ease" };
    if (kind === "right") return { ...base, position: "absolute", top: 0, right: 0, bottom: 0, width: Math.max(RIGHT_W_MIN, co.w || WS_DEFAULT_GEOM.company.w), zIndex: 10, borderLeft: "1px solid #d9dee6", boxShadow: "-10px 0 30px rgba(15,23,42,.10)" };
    return { ...base, position: "absolute", left: 0, right: rightOpen ? Math.max(RIGHT_W_MIN, co.w || 400) : 0, bottom: 0, height: Math.max(BOTTOM_H_MIN, ev.h || WS_DEFAULT_GEOM.evidence.h), zIndex: 9, borderTop: "1px solid #d9dee6", boxShadow: "0 -10px 30px rgba(15,23,42,.10)" };
  };

  const titleBar = (id, extra) => (
    <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "5px 8px 5px 12px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8" }}>
      <span style={{ flex: 1, minWidth: 0, fontFamily: sans, fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{WS_LABELS[id]}</span>
      {extra}
      <button type="button" onClick={() => setWinState(id, "minimized")} style={chromeBtn(false)}
        aria-label={"Minimise " + WS_LABELS[id] + " to the tray"} title="Minimise to tray">{String.fromCharCode(0x2013)}</button>
    </div>
  );

  const minimised = WS_TOOLS.filter((id) => (ws[id] || {}).state === "minimized");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#e9edf3" }}>

      {/* ── §3.1 workspace frame toolbar ─────────────────────────────────────── */}
      <div ref={barRef} className="wis-scroll" role="toolbar" aria-label="Workspace controls"
        style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "#f3f1ea", borderBottom: "1px solid #dcd8cc", overflowX: "auto" }}>
        <span style={{ fontFamily: mono, fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".12em", color: "#6b6357", flexShrink: 0 }}>WORKSPACE</span>
        {/* + Add window: reopens any tool currently in the tray. When nothing is minimised
            it is disabled rather than hidden, so the control doesn't move around. */}
        <label style={{ flexShrink: 0, display: "inline-flex" }}>
          <span style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>Add a window to the workspace</span>
          <select value="" disabled={minimised.length === 0}
            onChange={(e) => { const v = e.target.value; if (v) setWinState(v, WS_PLACEMENT[v] === "window" ? "floating" : "open"); }}
            style={wsBtn({ opacity: minimised.length === 0 ? 0.5 : 1, cursor: minimised.length === 0 ? "not-allowed" : "pointer", paddingRight: 8 })}>
            <option value="">+ Add window</option>
            {minimised.map((id) => <option key={id} value={id}>{WS_LABELS[id]}</option>)}
          </select>
        </label>
        <button type="button" onClick={onArrange} style={wsBtn()} title="Open every tool in a tidy default arrangement">Arrange</button>
        <button type="button" onClick={onMinimiseAll} style={wsBtn()} title="Send every tool to the tray - document only">Minimise all</button>
        <button type="button" onClick={onResetWorkspace} style={wsBtn()} title="Back to the starting workspace: ad plus a floating Role Graph">Reset workspace</button>
        {/* §4.1: the six analysis tabs are NOT deleted - they move behind this menu while
            their components migrate. */}
        <button type="button" onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen}
          style={wsBtn({ marginLeft: "auto", color: moreOpen ? "#fff" : "#25324a", background: moreOpen ? "#142a8e" : "#fff", border: "1px solid " + (moreOpen ? "#142a8e" : "#d9dee6") })}>
          More analysis {String.fromCharCode(moreOpen ? 0x25b2 : 0x25bc)}
        </button>
      </div>

      {/* ── The canvas: document + managed window + two edge drawers ──────────── */}
      <div ref={canvasRef} style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>

        {/* Main document (§3.2): the job advertisement, always present, never a tab. */}
        <div className="wis-scroll" aria-label={mainLabel}
          style={{ position: "absolute", inset: 0, paddingRight: mainPadRight, paddingBottom: mainPadBottom, overflowY: "auto", background: "#e9e7e0", transition: "padding .12s ease" }}>
          <div style={{ padding: "12px 16px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontFamily: mono, fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".14em", color: "#6b6357" }}>
                MAIN DOCUMENT {String.fromCharCode(0x00b7)} {String(mainLabel || "").toUpperCase()}
              </span>
              {/* §2.1 "preserve every existing feature": the ad's own read modes (clean /
                  evidence / comments) travel with the document instead of being stranded on
                  the old tab toolbar. */}
              {mainToolbar}
            </div>
            {mainEl}
          </div>
        </div>

        {/* Managed floating window: Role Graph. ONE element in every state - see the
            HIDE, DO NOT UNMOUNT note at the top of this file. */}
        <div ref={winRef} role={isNarrow && rg.state !== "minimized" ? "dialog" : undefined}
          aria-modal={isNarrow && rg.state !== "minimized" ? "true" : undefined}
          aria-label={WS_LABELS.roleGraph + (isNarrow ? " (full-screen)" : " (" + rg.state + " window)")}
          aria-hidden={rg.state === "minimized" ? "true" : undefined}
          style={winShell}>
          <div onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}
            onKeyDown={keyMove} tabIndex={rg.state === "floating" && !isNarrow ? 0 : -1}
            aria-label={rg.state === "floating" && !isNarrow ? "Move the Role Graph window - arrow keys, or drag" : undefined}
            style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "5px 8px 5px 12px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8", cursor: !isNarrow && rg.state === "floating" ? "move" : "default", touchAction: "none" }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: sans, fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {WS_LABELS.roleGraph}
              {trayNote && trayNote.roleGraph && <span style={{ fontFamily: mono, fontSize: "0.6875rem", fontWeight: 600, color: "#6b6357", marginLeft: 7 }}>{String.fromCharCode(0x00b7)} {trayNote.roleGraph}</span>}
            </span>
            {/* §3.3 four states, each reachable by one labelled control. */}
            {!isNarrow && (
              <>
                <button type="button" onClick={() => setWinState("roleGraph", rg.state === "docked" ? "floating" : "docked")}
                  aria-pressed={rg.state === "docked"} style={chromeBtn(rg.state === "docked")}
                  aria-label={rg.state === "docked" ? "Float the Role Graph window" : "Dock the Role Graph to the side"}
                  title={rg.state === "docked" ? "Float" : "Dock"}>{rg.state === "docked" ? "float" : "dock"}</button>
                <button type="button" onClick={() => setWinState("roleGraph", rg.state === "expanded" ? "floating" : "expanded")}
                  aria-pressed={rg.state === "expanded"} style={chromeBtn(rg.state === "expanded")}
                  aria-label={rg.state === "expanded" ? "Shrink the Role Graph back to a floating window" : "Expand the Role Graph to fill the canvas"}
                  title={rg.state === "expanded" ? "Restore" : "Expand"}>{rg.state === "expanded" ? String.fromCharCode(0x2921) : String.fromCharCode(0x2922)}</button>
              </>
            )}
            <button type="button" onClick={() => setWinState("roleGraph", "minimized")} style={chromeBtn(false)}
              aria-label="Minimise the Role Graph to the tray" title="Minimise to tray">{String.fromCharCode(0x2013)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>{toolEl.roleGraph}</div>
        </div>

        {/* Right drawer: Company Information (§3.8). Organisation/ACRA/employer facts only -
            no Company Graph in this PR (§2.3). */}
        <div role={isNarrow && rightOpen ? "dialog" : undefined} aria-modal={isNarrow && rightOpen ? "true" : undefined}
          aria-label={WS_LABELS.company} aria-hidden={rightOpen ? undefined : "true"} style={drawerShell("right", rightOpen)}>
          {titleBar("company")}
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 12px 24px" }}>{toolEl.company}</div>
        </div>

        {/* Bottom drawer: Evidence / Explanation (§3.9). Opens on a duty / requirement /
            graph-node selection and carries source wording, passage, explanation,
            confidence, provenance and the supporting graph relationship. */}
        <div role={isNarrow && bottomOpen ? "dialog" : undefined} aria-modal={isNarrow && bottomOpen ? "true" : undefined}
          aria-label={WS_LABELS.evidence} aria-hidden={bottomOpen ? undefined : "true"} style={drawerShell("bottom", bottomOpen)}>
          {titleBar("evidence")}
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 14px 20px" }}>{toolEl.evidence}</div>
        </div>
      </div>

      {/* ── §3.6 minimised-window tray ───────────────────────────────────────── */}
      <div role="toolbar" aria-label="Minimised windows" className="wis-scroll"
        style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", background: "#f3f1ea", borderTop: "1px solid #dcd8cc", overflowX: "auto", minHeight: 46 }}>
        <span style={{ fontFamily: mono, fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".12em", color: "#6b6357", flexShrink: 0 }}>TRAY</span>
        {WS_TOOLS.map((id) => {
          const st = (ws[id] || {}).state;
          const isMin = st === "minimized";
          const note = trayNote && trayNote[id];
          return (
            <button key={id} type="button"
              onClick={() => setWinState(id, isMin ? (WS_PLACEMENT[id] === "window" ? "floating" : "open") : "minimized")}
              aria-pressed={!isMin}
              aria-label={(isMin ? "Restore " : "Minimise ") + WS_LABELS[id] + (note ? " (" + note + ")" : "")}
              style={wsBtn({
                color: isMin ? "#5b6878" : "#fff", background: isMin ? "#fff" : "#142a8e",
                border: "1px solid " + (isMin ? "#d9dee6" : "#142a8e"), fontWeight: 700,
              })}>
              {WS_LABELS[id]}
              {note && <span style={{ fontFamily: mono, fontSize: "0.625rem", fontWeight: 600, opacity: 0.85 }}>{String.fromCharCode(0x00b7)} {note}</span>}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", flexShrink: 0, fontFamily: mono, fontSize: "0.625rem", color: "#8a8272" }}>
          click a tray item to restore it
        </span>
      </div>

      {/* §4.1: "More analysis" - the existing six-tab desk, intact, one click away. */}
      {moreOpen && moreEl}
    </div>
  );
}
