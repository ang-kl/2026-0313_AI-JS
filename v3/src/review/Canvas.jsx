// v3/src/review/Canvas.jsx - PR 1 "Step 3 Working Canvas" (Human Lead, 30-07 '26 §2.1),
// revised 30-07 '26 after the first look at the live build.
//
//   Persistent Step 3 canvas
//   |-- Main document: Job Advertisement          (the manuscript window, unchanged)
//   |-- Floating window: Role Graph               (rolePane / RoleGraphPanel, unchanged)
//   |-- Right drawer: Company Information         (ACRA + employer reality)
//   |-- Bottom drawer: Evidence / Explanation     (the inspector window, unchanged)
//   +-- Floating navigator (bottom-left) + minimise tray
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
//
// REVISION (Human Lead, first live look): "more space given to the intention than all these
// buttons and cues". Three changes, all chrome - no behaviour or data touched:
//   1. The floating window opens at HALF THE VIEWPORT, computed per session, not a fixed
//      560x470 box that read as a cramped preview of the graph.
//   2. Its full-width title bar is gone. The title is now a small dark CLIP tab pinched onto
//      the panel's top-left corner - it is also the drag handle and the keyboard move target.
//      Window controls float top-right over the content instead of occupying their own row.
//   3. The full-width WORKSPACE toolbar and TRAY strip are both gone, replaced by ONE
//      floating navigator at bottom-left: a compass button that opens a popover holding the
//      workspace actions, the document's read modes and "More analysis". Minimised tools
//      appear as chips beside it, so §3.6/§3.7's tray survives without a permanent strip.
import { useEffect, useRef } from "react";
import { RS_LAYERS } from "./rs-rules.js";

// Tool ids this canvas manages. PR 1 is deliberately three - no Company Graph, no GCN (§2.3).
export const WS_TOOLS = ["roleGraph", "company", "evidence"];
export const WS_LABELS = { roleGraph: "Role Graph", company: "Company Information", evidence: "Evidence / Explanation" };
// Short forms for the tray chips - the long labels do not fit a quiet corner cluster.
export const WS_SHORT = { roleGraph: "Role Graph", company: "Company", evidence: "Evidence" };
// Placement per tool: "window" = the managed floating window (4 states); "right"/"bottom"
// = edge drawers (open | minimized). Kept as data so PR 2 can add tools without new branches.
export const WS_PLACEMENT = { roleGraph: "window", company: "right", evidence: "bottom" };

const DOCK_W = 420;      // docked-window column width
const RIGHT_W_MIN = 300;
const BOTTOM_H_MIN = 160;
const CLIP_GUTTER = 30;  // top padding that keeps content clear of the clip + controls

// wsDefaultSize(): the managed window opens at HALF the viewport (Human Lead, 30-07 '26).
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

// The initial workspace (what "Reset workspace" returns to, §3.1). The ad is the document;
// the graph floats over it; the two drawers wait in the tray so the first read is quiet.
export function wsInitial() {
  const g = wsDefaultSize();
  return {
    roleGraph: { state: "floating", x: null, y: null, w: g.w, h: g.h },
    company: { state: "minimized", w: WS_DEFAULT_GEOM.company.w },
    evidence: { state: "minimized", h: WS_DEFAULT_GEOM.evidence.h },
  };
}

const mono = "'Spline Sans Mono',monospace";
const sans = "'Spline Sans',sans-serif";

// A popover row button. 44px min target (house rule, CLAUDE.md section 4).
function navBtn(extra) {
  return {
    width: "100%", minHeight: 44, padding: "0 12px", display: "flex", alignItems: "center", gap: 8,
    fontFamily: sans, fontSize: "0.8125rem", fontWeight: 600, whiteSpace: "nowrap", textAlign: "left",
    color: "#25324a", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer",
    ...(extra || {}),
  };
}
// Window control: 44x44 hit area (house rule) with a small quiet glyph, transparent ground so
// it reads as floating over the graph rather than as another bar.
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
  toolEl,                    // { roleGraph, company, evidence } -> JSX (rendered once, never swapped)
  trayNote,                  // { roleGraph: "ESCO" | "SSOC" | ... } -> clip + chip sub-label
  ws, setWinState, setGeom,  // workspace state + setters (owned by ReviewStudio)
  onArrange, onMinimiseAll, onResetWorkspace,
  moreOpen, setMoreOpen, moreEl, barRef,
  navOpen, setNavOpen, onOpenJobAd,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const winRef = useRef(null);
  const navRef = useRef(null);
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

  const rg = ws.roleGraph || {};
  const co = ws.company || {};
  const ev = ws.evidence || {};
  const rightOpen = co.state !== "minimized";
  const bottomOpen = ev.state !== "minimized";
  const rightW = Math.max(RIGHT_W_MIN, co.w || WS_DEFAULT_GEOM.company.w);
  // A docked graph shares the canvas with the document, so the document's own box has to
  // give up the room - padding rather than a flex sibling, because the window is one
  // absolutely-positioned element in every state (see HIDE, DO NOT UNMOUNT above).
  const mainPadRight = (!isNarrow && rg.state === "docked" ? DOCK_W : 0) + (!isNarrow && rightOpen ? rightW : 0);
  const mainPadBottom = !isNarrow && bottomOpen ? Math.max(BOTTOM_H_MIN, ev.h || WS_DEFAULT_GEOM.evidence.h) : 0;

  // Default upper-right (§3.4), resolved at paint so it tracks the real canvas width.
  const rgPos = (() => {
    if (isNarrow) return null;
    const box = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
    const w = rg.w || wsDefaultSize().w;
    const x = rg.x == null ? Math.max(12, (box ? box.width : 1200) - w - 20 - (rightOpen ? rightW : 0)) : rg.x;
    const y = rg.y == null ? 14 : rg.y;
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
  // Keyboard move: the clip is focusable and arrow-steppable, so a window can be positioned
  // without a pointer.
  const keyMove = (e) => {
    if (isNarrow || rg.state !== "floating") return;
    const step = e.shiftKey ? 40 : 16;
    const p = rgPos || { x: 0, y: 0 };
    if (e.key === "ArrowLeft") { e.preventDefault(); setGeom("roleGraph", { x: Math.max(0, p.x - step), y: p.y }); }
    if (e.key === "ArrowRight") { e.preventDefault(); setGeom("roleGraph", { x: p.x + step, y: p.y }); }
    if (e.key === "ArrowUp") { e.preventDefault(); setGeom("roleGraph", { x: p.x, y: Math.max(0, p.y - step) }); }
    if (e.key === "ArrowDown") { e.preventDefault(); setGeom("roleGraph", { x: p.x, y: p.y + step }); }
  };

  // Managed-window shell per state. Narrow screens never get a draggable box: every open
  // tool becomes a full-screen sheet (§5.2 item 10).
  const winShell = (() => {
    const base = { background: "#fbfaf8", display: "flex", flexDirection: "column", overflow: "hidden" };
    if (rg.state === "minimized") return { ...base, display: "none" };
    if (isNarrow) return { ...base, position: "fixed", inset: 0, zIndex: RS_LAYERS.float, animation: "wisSlideIn .25s ease" };
    if (rg.state === "expanded") return { ...base, position: "absolute", left: 8, top: 8, right: 8 + (rightOpen ? rightW : 0), bottom: 8 + mainPadBottom, zIndex: 12, border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)" };
    if (rg.state === "docked") return { ...base, position: "absolute", top: 0, bottom: mainPadBottom, right: rightOpen ? rightW : 0, width: DOCK_W, zIndex: 8, borderLeft: "1px solid #d9dee6" };
    return { ...base, position: "absolute", left: (rgPos && rgPos.x) || 0, top: (rgPos && rgPos.y) || 0, width: rg.w || wsDefaultSize().w, height: rg.h || wsDefaultSize().h, zIndex: 12, border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)", resize: "both", minWidth: 300, minHeight: 220, maxWidth: "98%", maxHeight: "96%" };
  })();

  const drawerShell = (kind, open) => {
    const base = { background: "#fbfaf8", display: "flex", flexDirection: "column", overflow: "hidden" };
    if (!open) return { ...base, display: "none" };
    if (isNarrow) return { ...base, position: "fixed", inset: 0, zIndex: RS_LAYERS.sheet, animation: "wisSlideIn .25s ease" };
    if (kind === "right") return { ...base, position: "absolute", top: 0, right: 0, bottom: 0, width: rightW, zIndex: 10, borderLeft: "1px solid #d9dee6", boxShadow: "-10px 0 30px rgba(15,23,42,.10)" };
    return { ...base, position: "absolute", left: 0, right: rightOpen ? rightW : 0, bottom: 0, height: Math.max(BOTTOM_H_MIN, ev.h || WS_DEFAULT_GEOM.evidence.h), zIndex: 9, borderTop: "1px solid #d9dee6", boxShadow: "0 -10px 30px rgba(15,23,42,.10)" };
  };

  // The CLIP: a small dark tab pinched onto a panel's top-left corner, carrying the title.
  // Replaces the full-width title bar (Human Lead: "cut the title text header to just a chip
  // corner like a black-metal-clip"). On the managed window it is also the drag handle.
  const clip = (label, note, draggable) => (
    <div
      onPointerDown={draggable ? startDrag : undefined} onPointerMove={draggable ? moveDrag : undefined}
      onPointerUp={draggable ? stopDrag : undefined} onPointerCancel={draggable ? stopDrag : undefined}
      onKeyDown={draggable ? keyMove : undefined} tabIndex={draggable ? 0 : undefined}
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

  const minimised = WS_TOOLS.filter((id) => (ws[id] || {}).state === "minimized");
  const navAct = (fn) => () => { fn(); setNavOpen(false); };
  const navDivider = <div aria-hidden="true" style={{ height: 1, background: "#e6e9f0", margin: "5px 0" }} />;
  const navHead = (t) => <div style={{ fontFamily: mono, fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".13em", color: "#8a8272", padding: "6px 12px 2px" }}>{t}</div>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#e9edf3" }}>

      {/* ── The canvas: document + managed window + two edge drawers ──────────── */}
      <div ref={canvasRef} style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>

        {/* Main document (§3.2): the job advertisement, always present, never a tab. Its own
            eyebrow label is gone - the manuscript already names itself, and the row it used
            belongs to the ad. */}
        <div className="wis-scroll" aria-label={mainLabel}
          style={{ position: "absolute", inset: 0, paddingRight: mainPadRight, paddingBottom: mainPadBottom, overflowY: "auto", background: "#e9e7e0", transition: "padding .12s ease" }}>
          <div style={{ padding: "12px 16px 72px" }}>{mainEl}</div>
        </div>

        {/* Managed floating window: Role Graph. ONE element in every state - see the
            HIDE, DO NOT UNMOUNT note at the top of this file. */}
        <div ref={winRef} role={isNarrow && rg.state !== "minimized" ? "dialog" : undefined}
          aria-modal={isNarrow && rg.state !== "minimized" ? "true" : undefined}
          aria-label={WS_LABELS.roleGraph + (isNarrow ? " (full-screen)" : " (" + rg.state + " window)")}
          aria-hidden={rg.state === "minimized" ? "true" : undefined}
          style={winShell}>
          {clip(WS_LABELS.roleGraph, trayNote && trayNote.roleGraph, !isNarrow && rg.state === "floating")}
          {/* Controls float over the content, top-right, instead of owning a row (§ revision 2). */}
          <div style={{ position: "absolute", right: 6, top: 4, zIndex: 3, display: "flex", gap: 3 }}>
            {!isNarrow && (
              <>
                <button type="button" onClick={() => setWinState("roleGraph", rg.state === "docked" ? "floating" : "docked")}
                  aria-pressed={rg.state === "docked"} style={ctlBtn(rg.state === "docked")}
                  aria-label={rg.state === "docked" ? "Float the Role Graph window" : "Dock the Role Graph to the side"}
                  title={rg.state === "docked" ? "Float" : "Dock"}>{rg.state === "docked" ? "float" : "dock"}</button>
                <button type="button" onClick={() => setWinState("roleGraph", rg.state === "expanded" ? "floating" : "expanded")}
                  aria-pressed={rg.state === "expanded"} style={ctlBtn(rg.state === "expanded")}
                  aria-label={rg.state === "expanded" ? "Shrink the Role Graph back to a floating window" : "Expand the Role Graph to fill the canvas"}
                  title={rg.state === "expanded" ? "Restore" : "Expand"}>{rg.state === "expanded" ? String.fromCharCode(0x2921) : String.fromCharCode(0x2922)}</button>
              </>
            )}
            <button type="button" onClick={() => setWinState("roleGraph", "minimized")} style={ctlBtn(false)}
              aria-label="Minimise the Role Graph to the tray" title="Minimise to tray">{String.fromCharCode(0x2013)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: CLIP_GUTTER + "px 12px 12px" }}>{toolEl.roleGraph}</div>
        </div>

        {/* Right drawer: Company Information (§3.8). Organisation/ACRA/employer facts only -
            no Company Graph in this PR (§2.3). */}
        <div role={isNarrow && rightOpen ? "dialog" : undefined} aria-modal={isNarrow && rightOpen ? "true" : undefined}
          aria-label={WS_LABELS.company} aria-hidden={rightOpen ? undefined : "true"} style={drawerShell("right", rightOpen)}>
          {clip(WS_SHORT.company, null, false)}
          <div style={{ position: "absolute", right: 6, top: 4, zIndex: 3 }}>
            <button type="button" onClick={() => setWinState("company", "minimized")} style={ctlBtn(false)}
              aria-label={"Minimise " + WS_LABELS.company + " to the tray"} title="Minimise to tray">{String.fromCharCode(0x2013)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: CLIP_GUTTER + "px 12px 24px" }}>{toolEl.company}</div>
        </div>

        {/* Bottom drawer: Evidence / Explanation (§3.9). Opens on a duty / requirement /
            graph-node selection and carries source wording, passage, explanation,
            confidence, provenance and the supporting graph relationship. */}
        <div role={isNarrow && bottomOpen ? "dialog" : undefined} aria-modal={isNarrow && bottomOpen ? "true" : undefined}
          aria-label={WS_LABELS.evidence} aria-hidden={bottomOpen ? undefined : "true"} style={drawerShell("bottom", bottomOpen)}>
          {clip(WS_SHORT.evidence, null, false)}
          <div style={{ position: "absolute", right: 6, top: 4, zIndex: 3 }}>
            <button type="button" onClick={() => setWinState("evidence", "minimized")} style={ctlBtn(false)}
              aria-label={"Minimise " + WS_LABELS.evidence + " to the tray"} title="Minimise to tray">{String.fromCharCode(0x2013)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: CLIP_GUTTER + "px 14px 20px" }}>{toolEl.evidence}</div>
        </div>

        {/* ── Floating navigator (bottom-left) + minimise tray ───────────────────
            Replaces the full-width WORKSPACE toolbar and TRAY strip: two permanent rows of
            chrome become one compass button plus a chip per minimised tool. */}
        <div ref={navRef} style={{ position: "absolute", left: 12, bottom: 12, zIndex: 14, display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "calc(100% - 24px)" }}>
          <div style={{ position: "relative", flex: "none" }}>
            {navOpen && (
              <div role="menu" aria-label="Workspace navigator"
                style={{ position: "absolute", left: 0, bottom: 52, width: 248, maxHeight: "60vh", overflowY: "auto", padding: "4px 0 6px", background: "#fff", border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 16px 44px rgba(15,23,42,.24)" }}>
                {navHead("Read the ad as")}
                {/* Revision (Human Lead question): "Read clean / Evidence view / Comments" were
                    three peer tabs for two different things - a binary (marks on/off) and an
                    additive layer. They are now one switch plus one toggle, off the document. */}
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
                {/* The old bottom-left "Job ad" FAB was a second round control in exactly
                    this corner, and in the canvas the ad IS the main document - so its
                    drawer moves in here rather than competing with the navigator. */}
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
                    onClick={navAct(() => setWinState(id, WS_PLACEMENT[id] === "window" ? "floating" : "open"))}
                    style={navBtn()}>
                    <span style={{ width: 14, flex: "none", color: "#8a8272" }}>+</span>
                    Open {WS_SHORT[id]}
                  </button>
                ))}
                <button type="button" role="menuitem" onClick={navAct(onArrange)} style={navBtn()}><span style={{ width: 14, flex: "none" }} />Arrange all</button>
                <button type="button" role="menuitem" onClick={navAct(onMinimiseAll)} style={navBtn()}><span style={{ width: 14, flex: "none" }} />Clear to the ad</button>
                <button type="button" role="menuitem" onClick={navAct(onResetWorkspace)} style={navBtn()}><span style={{ width: 14, flex: "none" }} />Reset workspace</button>
                {navDivider}
                {/* §4.1: the six analysis tabs are NOT deleted - they live here while their
                    components migrate in PR 2. */}
                <button type="button" role="menuitem" onClick={navAct(() => setMoreOpen(true))} style={navBtn({ fontWeight: 700, color: "#142a8e" })}>
                  <span style={{ width: 14, flex: "none" }} />More analysis {String.fromCharCode(0x2192)}
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
                boxShadow: "0 6px 18px rgba(15,23,42,.22)", filter: navOpen ? "brightness(1.05)" : "none",
              }}>
              <span aria-hidden="true" style={{ filter: navOpen ? "grayscale(1) brightness(3)" : "none" }}>{String.fromCodePoint(0x1f9ed)}</span>
            </button>
          </div>
          {/* §3.6/§3.7 tray: a chip per MINIMISED tool, so restoring stays one tap without a
              permanent strip. Nothing minimised -> nothing here. */}
          {minimised.length > 0 && (
            <div className="wis-scroll" role="toolbar" aria-label="Minimised windows"
              style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflowX: "auto", paddingBottom: 2 }}>
              {minimised.map((id) => {
                const note = trayNote && trayNote[id];
                return (
                  <button key={id} type="button"
                    onClick={() => setWinState(id, WS_PLACEMENT[id] === "window" ? "floating" : "open")}
                    aria-label={"Restore " + WS_LABELS[id] + (note ? " (" + note + ")" : "")}
                    style={{
                      flex: "none", minHeight: 44, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 5,
                      fontFamily: mono, fontSize: "0.6875rem", fontWeight: 700, whiteSpace: "nowrap",
                      color: "#25324a", background: "rgba(251,250,248,0.96)", border: "1px solid #c9cfda", borderRadius: 999,
                      boxShadow: "0 4px 12px rgba(15,23,42,.14)", cursor: "pointer",
                    }}>
                    {WS_SHORT[id]}
                    {note && <span style={{ fontWeight: 600, color: "#6b7280" }}>{String.fromCharCode(0x00b7)} {note}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* §4.1: "More analysis" - the existing six-tab desk, intact, one click away. */}
      {moreOpen && moreEl}
    </div>
  );
}
