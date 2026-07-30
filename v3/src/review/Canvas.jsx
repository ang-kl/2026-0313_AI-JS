// v3/src/review/Canvas.jsx - the persistent Step 3 workspace shell.
//
//   Persistent Step 3 canvas
//   |-- Main document: Job Advertisement          (the manuscript window, unchanged)
//   |-- Managed windows: Role Graph + any analysis window   (4 states each)
//   |-- Right drawer: Company Information         (ACRA + employer reality)
//   |-- Bottom drawer: Evidence / Explanation     (the inspector window, unchanged)
//   +-- Floating navigator (bottom-left) + minimise tray
//
// PR 1 (30-07 '26 §2.1) built the shell around three fixed tools. PR 2 (§6.1
// "consolidate existing features into drawers/windows") generalises it: ANY window in
// the registry can now be opened as a managed window from the navigator, so the eleven
// analysis windows that were reachable only by leaving for the six-tab view are on the
// canvas itself. §4.1 still holds - the tabs are not deleted, they remain behind
// "More analysis" as the fallback surface while migration settles.
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
//
// LAZY MOUNT, THEN KEEP (PR 2). Mounting all fourteen registry windows up front would run
// every window's effects on arrival - Verdict alone fires an ACRA lookup - so a tool is
// mounted on FIRST open and then never unmounted. Nothing runs before the reader asks for
// it, and once asked for, its state is preserved exactly as above.
import { useEffect, useRef } from "react";
import { RS_LAYERS } from "./rs-rules.js";

// The three tools the canvas ships with. Everything else is a registry window opened on
// demand; PR 1's fixed list becomes the CORE list.
export const WS_CORE = ["roleGraph", "company", "evidence"];
export const WS_LABELS = { roleGraph: "Role Graph", company: "Company Information", evidence: "Evidence / Explanation" };
// Short forms for the tray chips and clips - long labels do not fit a quiet corner cluster.
export const WS_SHORT = { roleGraph: "Role Graph", company: "Company", evidence: "Evidence" };
// Placement: "window" = a managed window (4 states); "right"/"bottom" = an edge drawer
// (open | minimized). Anything not named here is a registry window, so it is a window.
const WS_CORE_PLACEMENT = { roleGraph: "window", company: "right", evidence: "bottom" };
export function wsPlacementOf(id) { return WS_CORE_PLACEMENT[id] || "window"; }
// Registry windows already surfaced elsewhere on the canvas - offering them again would
// mount the same element twice. manuscript IS the document, inspector IS the evidence
// drawer, graphs IS the Role Graph window.
export const WS_ALREADY_PLACED = ["manuscript", "inspector", "graphs"];

const DOCK_W = 420;
const RIGHT_W_MIN = 300;
const BOTTOM_H_MIN = 160;
const CLIP_GUTTER = 30;  // top padding that keeps content clear of the clip + controls

// wsDefaultSize(): a managed window opens at HALF the viewport (Human Lead, 30-07 '26).
// Computed rather than constant so a 13" laptop and a 27" display both get a window that
// reads as a working surface. Clamped so it always fits with room for the document behind.
export function wsDefaultSize() {
  const vw = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" && window.innerHeight ? window.innerHeight : 900;
  return {
    w: Math.round(Math.max(340, Math.min(vw - 48, vw * 0.5))),
    h: Math.round(Math.max(280, Math.min(vh - 180, vh * 0.5))),
  };
}
export const WS_DEFAULT_GEOM = { company: { w: 400 }, evidence: { h: 320 } };

// The initial workspace (what "Reset workspace" returns to). The ad is the document; the
// graph floats over it; the two drawers wait in the tray so the first read is quiet.
export function wsInitial() {
  const g = wsDefaultSize();
  return {
    roleGraph: { state: "floating", x: null, y: null, w: g.w, h: g.h, z: 1 },
    company: { state: "minimized", w: WS_DEFAULT_GEOM.company.w },
    evidence: { state: "minimized", h: WS_DEFAULT_GEOM.evidence.h },
  };
}
// A freshly opened registry window: half-size, cascaded off the windows already open so a
// second and third window do not land exactly on top of the first.
export function wsNewWindow(openCount) {
  const g = wsDefaultSize();
  const n = openCount || 0;
  return { state: "floating", x: 24 + n * 34, y: 16 + n * 30, w: g.w, h: g.h };
}

const mono = "'Spline Sans Mono',monospace";
const sans = "'Spline Sans',sans-serif";

function navBtn(extra) {
  return {
    width: "100%", minHeight: 44, padding: "0 12px", display: "flex", alignItems: "center", gap: 8,
    fontFamily: sans, fontSize: "0.8125rem", fontWeight: 600, whiteSpace: "nowrap", textAlign: "left",
    color: "#25324a", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer",
    ...(extra || {}),
  };
}
// Window control: 44x44 hit area (house rule) with a small quiet glyph, transparent ground
// so it reads as floating over the content rather than as another bar.
function ctlBtn(on) {
  return {
    flex: "none", minHeight: 44, minWidth: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontFamily: mono, fontSize: "0.6875rem", fontWeight: 700,
    color: on ? "#fff" : "#4a5568", background: on ? "#142a8e" : "rgba(255,255,255,0.88)",
    border: "1px solid " + (on ? "#142a8e" : "rgba(0,0,0,0.10)"), borderRadius: 8, cursor: "pointer",
  };
}

export default function Canvas({
  isNarrow,
  mainEl, mainLabel, readMode, setReadMode,
  toolEl,                    // id -> JSX. Rendered once per mounted tool, never swapped.
  labelOf, shortOf,          // id -> display name (core labels + the registry's own)
  addable,                   // [{ id, label }] registry windows not yet open
  trayNote,                  // { roleGraph: "ESCO" | "SSOC" | ... }
  ws, setWinState, setGeom, bringToFront,
  onArrange, onMinimiseAll, onResetWorkspace,
  moreOpen, setMoreOpen, moreEl, barRef,
  navOpen, setNavOpen, onOpenJobAd,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const navRef = useRef(null);
  const roRef = useRef(null);

  const ids = Object.keys(ws);
  const co = ws.company || {};
  const ev = ws.evidence || {};
  const rightOpen = co.state !== "minimized";
  const bottomOpen = ev.state !== "minimized";
  const rightW = Math.max(RIGHT_W_MIN, co.w || WS_DEFAULT_GEOM.company.w);
  const bottomH = Math.max(BOTTOM_H_MIN, ev.h || WS_DEFAULT_GEOM.evidence.h);
  // Windows, in the order they should stack.
  const winIds = ids.filter((id) => wsPlacementOf(id) === "window");
  const dockedIds = winIds.filter((id) => ws[id].state === "docked");
  const mainPadRight = (!isNarrow && dockedIds.length ? DOCK_W : 0) + (!isNarrow && rightOpen ? rightW : 0);
  const mainPadBottom = !isNarrow && bottomOpen ? bottomH : 0;

  // §3.5: preserve WINDOW SIZE. Windows are CSS-resizable (resize:both, the same affordance
  // the original float layer used), so the authoritative size lives in the DOM. One observer
  // watches every window and writes its size back, guarded so the state -> style -> observer
  // round trip settles instead of looping.
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return undefined;
    let raf = 0;
    const pending = new Set();
    const ro = new ResizeObserver((entries) => {
      entries.forEach((e) => pending.add(e.target));
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        pending.forEach((el) => {
          const id = el.getAttribute("data-ws-id");
          const g = id && ws[id];
          if (!g || g.state !== "floating") return;
          const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
          if (!w || !h) return;
          if (Math.abs(w - g.w) > 2 || Math.abs(h - g.h) > 2) setGeom(id, { w, h });
        });
        pending.clear();
      });
    });
    roRef.current = ro;
    document.querySelectorAll("[data-ws-id]").forEach((el) => ro.observe(el));
    return () => { if (raf) cancelAnimationFrame(raf); ro.disconnect(); roRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winIds.join("|"), winIds.map((id) => ws[id].state).join("|")]);

  // The navigator popover closes on Escape and on a click outside it - the same dismissal
  // contract the rest of Step 3's overlays use.
  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setNavOpen(false); };
    const onDown = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setNavOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown, true); };
  }, [navOpen, setNavOpen]);

  // Default position for a window whose x/y is still unset: upper-right (§3.4), resolved at
  // paint so it tracks the real canvas width.
  const posOf = (id) => {
    const g = ws[id] || {};
    if (isNarrow) return { x: 0, y: 0 };
    const box = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
    const w = g.w || wsDefaultSize().w;
    const x = g.x == null ? Math.max(12, (box ? box.width : 1200) - w - 20 - (rightOpen ? rightW : 0)) : g.x;
    const y = g.y == null ? 14 : g.y;
    return { x, y };
  };

  const startDrag = (id) => (e) => {
    if (isNarrow || (ws[id] || {}).state !== "floating") return;
    if (e.target && e.target.closest && e.target.closest("button")) return;
    const p = posOf(id);
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
    bringToFront(id);
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d || !canvasRef.current) return;
    const box = canvasRef.current.getBoundingClientRect();
    // Clamp inside the canvas so a dragged window is always recoverable without a reset.
    setGeom(d.id, {
      x: Math.max(0, Math.min(box.width - 120, d.ox + e.clientX - d.sx)),
      y: Math.max(0, Math.min(box.height - 60, d.oy + e.clientY - d.sy)),
    });
  };
  const stopDrag = () => { dragRef.current = null; };
  // Keyboard move: the clip is focusable and arrow-steppable, so a window can be positioned
  // without a pointer.
  const keyMove = (id) => (e) => {
    if (isNarrow || (ws[id] || {}).state !== "floating") return;
    const step = e.shiftKey ? 40 : 16;
    const p = posOf(id);
    if (e.key === "ArrowLeft") { e.preventDefault(); setGeom(id, { x: Math.max(0, p.x - step), y: p.y }); }
    if (e.key === "ArrowRight") { e.preventDefault(); setGeom(id, { x: p.x + step, y: p.y }); }
    if (e.key === "ArrowUp") { e.preventDefault(); setGeom(id, { x: p.x, y: Math.max(0, p.y - step) }); }
    if (e.key === "ArrowDown") { e.preventDefault(); setGeom(id, { x: p.x, y: p.y + step }); }
  };

  // Managed-window shell per state. Narrow screens never get a draggable box: every open
  // tool becomes a full-screen sheet (§5.2 item 10). Docked windows share the dock column,
  // stacked, so a second dock does not silently hide the first.
  const winShell = (id) => {
    const g = ws[id] || {};
    const base = { background: "#fbfaf8", display: "flex", flexDirection: "column", overflow: "hidden" };
    if (g.state === "minimized") return { ...base, display: "none" };
    if (isNarrow) return { ...base, position: "fixed", inset: 0, zIndex: RS_LAYERS.float + (g.z || 1), animation: "wisSlideIn .25s ease" };
    if (g.state === "expanded") return { ...base, position: "absolute", left: 8, top: 8, right: 8 + (rightOpen ? rightW : 0), bottom: 8 + mainPadBottom, zIndex: 12 + (g.z || 1), border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)" };
    if (g.state === "docked") {
      const k = dockedIds.indexOf(id), n = dockedIds.length || 1;
      return { ...base, position: "absolute", right: rightOpen ? rightW : 0, width: DOCK_W, zIndex: 8,
        top: "calc((100% - " + mainPadBottom + "px) * " + (k / n) + ")",
        height: "calc((100% - " + mainPadBottom + "px) / " + n + ")",
        borderLeft: "1px solid #d9dee6", borderTop: k > 0 ? "1px solid #d9dee6" : "none" };
    }
    const p = posOf(id);
    return { ...base, position: "absolute", left: p.x, top: p.y, width: g.w || wsDefaultSize().w, height: g.h || wsDefaultSize().h, zIndex: 12 + (g.z || 1), border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)", resize: "both", minWidth: 300, minHeight: 220, maxWidth: "98%", maxHeight: "96%" };
  };

  const drawerShell = (kind, open) => {
    const base = { background: "#fbfaf8", display: "flex", flexDirection: "column", overflow: "hidden" };
    if (!open) return { ...base, display: "none" };
    if (isNarrow) return { ...base, position: "fixed", inset: 0, zIndex: RS_LAYERS.sheet, animation: "wisSlideIn .25s ease" };
    if (kind === "right") return { ...base, position: "absolute", top: 0, right: 0, bottom: 0, width: rightW, zIndex: 10, borderLeft: "1px solid #d9dee6", boxShadow: "-10px 0 30px rgba(15,23,42,.10)" };
    return { ...base, position: "absolute", left: 0, right: rightOpen ? rightW : 0, bottom: 0, height: bottomH, zIndex: 9, borderTop: "1px solid #d9dee6", boxShadow: "0 -10px 30px rgba(15,23,42,.10)" };
  };

  // The CLIP: a small dark tab pinched onto a panel's top-left corner, carrying the title.
  // Replaces the full-width title bar (Human Lead: "cut the title text header to just a chip
  // corner like a black-metal-clip"). On a managed window it is also the drag handle.
  const clip = (id, label, note, draggable) => (
    <div
      onPointerDown={draggable ? startDrag(id) : undefined} onPointerMove={draggable ? moveDrag : undefined}
      onPointerUp={draggable ? stopDrag : undefined} onPointerCancel={draggable ? stopDrag : undefined}
      onKeyDown={draggable ? keyMove(id) : undefined} tabIndex={draggable ? 0 : undefined}
      aria-label={draggable ? "Move the " + label + " window - arrow keys, or drag" : undefined}
      style={{
        position: "absolute", left: 10, top: 8, zIndex: 3,
        display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "62%",
        padding: "3px 10px", borderRadius: 6,
        background: "linear-gradient(#3a4356, #1c2333)",
        border: "1px solid #0d1119", boxShadow: "0 2px 5px rgba(15,23,42,.35), inset 0 1px 0 rgba(255,255,255,.22)",
        fontFamily: mono, fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".08em",
        color: "#eef1f7", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden",
        cursor: draggable ? "move" : "default", touchAction: "none",
      }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      {note && <span style={{ fontWeight: 600, color: "#a9b4c9" }}>{String.fromCharCode(0x00b7)} {note}</span>}
    </div>
  );

  const minimised = ids.filter((id) => (ws[id] || {}).state === "minimized");
  const navAct = (fn) => () => { fn(); setNavOpen(false); };
  const navDivider = <div aria-hidden="true" style={{ height: 1, background: "#e6e9f0", margin: "5px 0" }} />;
  const navHead = (t) => <div style={{ fontFamily: mono, fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".13em", color: "#8a8272", padding: "6px 12px 2px" }}>{t}</div>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#e9edf3" }}>
      <div ref={canvasRef} style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>

        {/* Main document: the job advertisement, always present, never a tab. */}
        <div className="wis-scroll" aria-label={mainLabel}
          style={{ position: "absolute", inset: 0, paddingRight: mainPadRight, paddingBottom: mainPadBottom, overflowY: "auto", background: "#e9e7e0", transition: "padding .12s ease" }}>
          <div style={{ padding: "12px 16px 72px" }}>{mainEl}</div>
        </div>

        {/* Managed windows. Each is ONE element in every state - see HIDE, DO NOT UNMOUNT. */}
        {winIds.map((id) => {
          const g = ws[id] || {};
          const label = labelOf(id);
          return (
            <div key={id} data-ws-id={id}
              onPointerDown={isNarrow || g.state !== "floating" ? undefined : () => bringToFront(id)}
              role={isNarrow && g.state !== "minimized" ? "dialog" : undefined}
              aria-modal={isNarrow && g.state !== "minimized" ? "true" : undefined}
              aria-label={label + (isNarrow ? " (full-screen)" : " (" + g.state + " window)")}
              aria-hidden={g.state === "minimized" ? "true" : undefined}
              style={winShell(id)}>
              {clip(id, shortOf(id), trayNote && trayNote[id], !isNarrow && g.state === "floating")}
              <div style={{ position: "absolute", right: 6, top: 4, zIndex: 3, display: "flex", gap: 3 }}>
                {!isNarrow && (
                  <>
                    <button type="button" onClick={() => setWinState(id, g.state === "docked" ? "floating" : "docked")}
                      aria-pressed={g.state === "docked"} style={ctlBtn(g.state === "docked")}
                      aria-label={g.state === "docked" ? "Float the " + label + " window" : "Dock the " + label + " to the side"}
                      title={g.state === "docked" ? "Float" : "Dock"}>{g.state === "docked" ? "float" : "dock"}</button>
                    <button type="button" onClick={() => setWinState(id, g.state === "expanded" ? "floating" : "expanded")}
                      aria-pressed={g.state === "expanded"} style={ctlBtn(g.state === "expanded")}
                      aria-label={g.state === "expanded" ? "Shrink the " + label + " back to a floating window" : "Expand the " + label + " to fill the canvas"}
                      title={g.state === "expanded" ? "Restore" : "Expand"}>{g.state === "expanded" ? String.fromCharCode(0x2921) : String.fromCharCode(0x2922)}</button>
                  </>
                )}
                <button type="button" onClick={() => setWinState(id, "minimized")} style={ctlBtn(false)}
                  aria-label={"Minimise the " + label + " to the tray"} title="Minimise to tray">{String.fromCharCode(0x2013)}</button>
              </div>
              <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: CLIP_GUTTER + "px 12px 12px" }}>{toolEl[id]}</div>
            </div>
          );
        })}

        {/* Right drawer: Company Information. */}
        <div role={isNarrow && rightOpen ? "dialog" : undefined} aria-modal={isNarrow && rightOpen ? "true" : undefined}
          aria-label={WS_LABELS.company} aria-hidden={rightOpen ? undefined : "true"} style={drawerShell("right", rightOpen)}>
          {clip("company", WS_SHORT.company, null, false)}
          <div style={{ position: "absolute", right: 6, top: 4, zIndex: 3 }}>
            <button type="button" onClick={() => setWinState("company", "minimized")} style={ctlBtn(false)}
              aria-label={"Minimise " + WS_LABELS.company + " to the tray"} title="Minimise to tray">{String.fromCharCode(0x2013)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: CLIP_GUTTER + "px 12px 24px" }}>{toolEl.company}</div>
        </div>

        {/* Bottom drawer: Evidence / Explanation. Opens on a duty / requirement / graph-node
            selection and carries source wording, passage, explanation, confidence,
            provenance and the supporting graph relationship. */}
        <div role={isNarrow && bottomOpen ? "dialog" : undefined} aria-modal={isNarrow && bottomOpen ? "true" : undefined}
          aria-label={WS_LABELS.evidence} aria-hidden={bottomOpen ? undefined : "true"} style={drawerShell("bottom", bottomOpen)}>
          {clip("evidence", WS_SHORT.evidence, null, false)}
          <div style={{ position: "absolute", right: 6, top: 4, zIndex: 3 }}>
            <button type="button" onClick={() => setWinState("evidence", "minimized")} style={ctlBtn(false)}
              aria-label={"Minimise " + WS_LABELS.evidence + " to the tray"} title="Minimise to tray">{String.fromCharCode(0x2013)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: CLIP_GUTTER + "px 14px 20px" }}>{toolEl.evidence}</div>
        </div>

        {/* Floating navigator (bottom-left) + minimise tray. */}
        <div ref={navRef} style={{ position: "absolute", left: 12, bottom: 12, zIndex: 14, display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "calc(100% - 24px)" }}>
          <div style={{ position: "relative", flex: "none" }}>
            {navOpen && (
              <div role="menu" aria-label="Workspace navigator"
                style={{ position: "absolute", left: 0, bottom: 52, width: 264, maxHeight: "62vh", overflowY: "auto", padding: "4px 0 6px", background: "#fff", border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 16px 44px rgba(15,23,42,.24)" }}>
                {navHead("Read the ad as")}
                {/* "Read clean / Evidence view / Comments" were three peer tabs for two
                    different things - a binary (marks on/off) and an additive layer. They
                    are one switch plus one toggle here, off the document. */}
                <button type="button" role="menuitemradio" aria-checked={readMode === "suggestions"}
                  onClick={() => setReadMode("suggestions")} style={navBtn({ background: readMode === "suggestions" ? "#eef2ff" : "transparent" })}>
                  <span style={{ width: 14, flex: "none", color: "#1a56db" }}>{readMode === "suggestions" ? String.fromCharCode(0x2713) : ""}</span>
                  With evidence marks
                </button>
                <button type="button" role="menuitemradio" aria-checked={readMode === "clean"}
                  onClick={() => setReadMode("clean")} style={navBtn({ background: readMode === "clean" ? "#eef2ff" : "transparent" })}>
                  <span style={{ width: 14, flex: "none", color: "#1a56db" }}>{readMode === "clean" ? String.fromCharCode(0x2713) : ""}</span>
                  Clean, as published
                </button>
                <button type="button" role="menuitemcheckbox" aria-checked={readMode === "comments"}
                  onClick={() => setReadMode(readMode === "comments" ? "suggestions" : "comments")}
                  style={navBtn({ background: readMode === "comments" ? "#eef2ff" : "transparent" })}>
                  <span style={{ width: 14, flex: "none", color: "#1a56db" }}>{readMode === "comments" ? String.fromCharCode(0x2713) : ""}</span>
                  Reviewer comments
                </button>
                {onOpenJobAd && (
                  <button type="button" role="menuitem" onClick={navAct(onOpenJobAd)} style={navBtn()}>
                    <span style={{ width: 14, flex: "none", color: "#8a8272" }}>{String.fromCharCode(0x2197)}</span>
                    Original ad, unsectioned
                  </button>
                )}
                {navDivider}
                {navHead("Workspace")}
                {minimised.map((id) => (
                  <button key={id} type="button" role="menuitem"
                    onClick={navAct(() => setWinState(id, wsPlacementOf(id) === "window" ? "floating" : "open"))}
                    style={navBtn()}>
                    <span style={{ width: 14, flex: "none", color: "#8a8272" }}>+</span>
                    Open {shortOf(id)}
                  </button>
                ))}
                <button type="button" role="menuitem" onClick={navAct(onArrange)} style={navBtn()}><span style={{ width: 14, flex: "none" }} />Arrange all</button>
                <button type="button" role="menuitem" onClick={navAct(onMinimiseAll)} style={navBtn()}><span style={{ width: 14, flex: "none" }} />Clear to the ad</button>
                <button type="button" role="menuitem" onClick={navAct(onResetWorkspace)} style={navBtn()}><span style={{ width: 14, flex: "none" }} />Reset workspace</button>
                {/* PR 2 (§6.1): every analysis window can be opened here as a managed window,
                    so the reader no longer has to leave the canvas to reach one. */}
                {addable.length > 0 && (
                  <>
                    {navDivider}
                    {navHead("Add an analysis window")}
                    {addable.map((w) => (
                      <button key={w.id} type="button" role="menuitem"
                        onClick={navAct(() => setWinState(w.id, "floating"))} style={navBtn()}>
                        <span style={{ width: 14, flex: "none", color: "#8a8272" }}>+</span>
                        {w.label}
                      </button>
                    ))}
                  </>
                )}
                {navDivider}
                {/* §4.1: the six analysis tabs are NOT deleted - they remain the fallback
                    surface while the migration above settles. */}
                <button type="button" role="menuitem" onClick={navAct(() => setMoreOpen(true))} style={navBtn({ fontWeight: 700, color: "#142a8e" })}>
                  <span style={{ width: 14, flex: "none" }} />More analysis (all six views) {String.fromCharCode(0x2192)}
                </button>
              </div>
            )}
            <button ref={barRef} type="button" onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen}
              aria-label={navOpen ? "Close the workspace navigator" : "Open the workspace navigator"}
              title="Workspace navigator"
              style={{
                width: 48, height: 48, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem", lineHeight: 1, cursor: "pointer",
                background: navOpen ? "#142a8e" : "#fbfaf8", border: "1px solid " + (navOpen ? "#142a8e" : "#c9cfda"),
                boxShadow: "0 6px 18px rgba(15,23,42,.22)",
              }}>
              <span aria-hidden="true" style={{ filter: navOpen ? "grayscale(1) brightness(3)" : "none" }}>{String.fromCodePoint(0x1f9ed)}</span>
            </button>
          </div>
          {/* Tray: a chip per MINIMISED tool, so restoring stays one tap without a permanent
              strip. Nothing minimised -> nothing here. */}
          {minimised.length > 0 && (
            <div className="wis-scroll" role="toolbar" aria-label="Minimised windows"
              style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflowX: "auto", paddingBottom: 2 }}>
              {minimised.map((id) => {
                const note = trayNote && trayNote[id];
                return (
                  <button key={id} type="button"
                    onClick={() => setWinState(id, wsPlacementOf(id) === "window" ? "floating" : "open")}
                    aria-label={"Restore " + labelOf(id) + (note ? " (" + note + ")" : "")}
                    style={{
                      flex: "none", minHeight: 44, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 5,
                      fontFamily: mono, fontSize: "0.6875rem", fontWeight: 700, whiteSpace: "nowrap",
                      color: "#25324a", background: "rgba(251,250,248,0.96)", border: "1px solid #c9cfda", borderRadius: 999,
                      boxShadow: "0 4px 12px rgba(15,23,42,.14)", cursor: "pointer",
                    }}>
                    {shortOf(id)}
                    {note && <span style={{ fontWeight: 600, color: "#6b7280" }}>{String.fromCharCode(0x00b7)} {note}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {moreOpen && moreEl}
    </div>
  );
}
