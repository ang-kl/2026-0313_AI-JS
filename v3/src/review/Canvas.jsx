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
  ws, setWinState, setGeom, bringToFront, onClose,
  onArrange, onMinimiseAll, onResetWorkspace,
  moreOpen, setMoreOpen, moreEl, barRef,
  navOpen, setNavOpen, onOpenJobAd,
  settingsEl, settingsFor, setSettingsFor,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const navRef = useRef(null);
  const menuRef = useRef(null);

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

  // §3.5's "preserve window size" used to need a ResizeObserver, because the size lived in
  // the DOM (CSS `resize: both`) and had to be read back into state. The eight edge handles
  // replaced that: they write w/h straight to state, so state is now the single source and
  // the observer would only be a second writer racing the first. Removed rather than left
  // running - a feedback loop between the two is exactly the sort of bug that is invisible
  // until a window jitters under the cursor.

  // The navigator popover closes on Escape and on a click outside it - the same dismissal
  // contract the rest of Step 3's overlays use.
  // FOCUS (a11y audit, 30-07 '26): the popover unmounts on close rather than hiding, so if
  // focus were inside it when it went, focus would drop silently to <body>. Move focus to
  // the first item on open and return it to the trigger on close.
  const closeNav = () => { setNavOpen(false); if (barRef && barRef.current) barRef.current.focus(); };
  useEffect(() => {
    if (!navOpen) return undefined;
    const first = menuRef.current && menuRef.current.querySelector("button");
    if (first) first.focus();
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeNav(); } };
    const onDown = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setNavOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navOpen]);
  // role="menu" carries an expectation of arrow-key navigation; Tab alone would be an ARIA
  // pattern mismatch that screen readers announce but the widget does not honour.
  const menuKeys = (e) => {
    const items = menuRef.current ? Array.from(menuRef.current.querySelectorAll("button")) : [];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); items[(i <= 0 ? items.length : i) - 1].focus(); }
    if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
    if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
  };

  // Default position for a window whose x/y is still unset: upper-right of the canvas.
  // Coordinates are VIEWPORT coordinates now that floating windows are position:fixed
  // (Human Lead: a window "is block within the panel of the result" - it was absolutely
  // positioned inside the canvas, so it could never be dragged outside that box). The
  // default still opens over the canvas, but the window is free to go anywhere after that.
  const posOf = (id) => {
    const g = ws[id] || {};
    if (isNarrow) return { x: 0, y: 0 };
    const box = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
    const w = g.w || wsDefaultSize().w;
    const left = box ? box.left : 0, top = box ? box.top : 0, cw = box ? box.width : 1200;
    const x = g.x == null ? Math.max(8, left + cw - w - 20 - (rightOpen ? rightW : 0)) : g.x;
    const y = g.y == null ? top + 14 : g.y;
    return { x, y };
  };

  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    // Clamped to the VIEWPORT, not the canvas: a window may be dragged anywhere on screen,
    // but never so far that its clip and controls leave the screen with it.
    setGeom(d.id, {
      x: Math.max(-d.w + 160, Math.min(window.innerWidth - 120, d.ox + e.clientX - d.sx)),
      y: Math.max(0, Math.min(window.innerHeight - 60, d.oy + e.clientY - d.sy)),
    });
  };
  // Same document-level listeners as the resize handles, for the same reason: a drag that
  // outruns the pointer leaves the clip behind, and capture alone did not hold.
  const startDrag = (id) => (e) => {
    if (isNarrow || (ws[id] || {}).state !== "floating") return;
    if (e.target && e.target.closest && e.target.closest("button")) return;
    const p = posOf(id);
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, w: (ws[id] || {}).w || wsDefaultSize().w };
    bringToFront(id);
    const onMove = (ev) => moveDrag(ev);
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  };
  // Edge and corner resize (Human Lead: "border resize"). The native CSS resize corner is
  // one grip in one corner; these are the eight a window is expected to have. Pointer only
  // by nature - the keyboard path is Shift+arrow on the clip.
  // Handles sit ENTIRELY INSIDE the window. Straddling the border (the obvious first
  // instinct) puts half of each handle outside a container with overflow:hidden, which
  // clips it away - the grab area collapsed to about 4px and the edge became a pixel hunt.
  // 8px inside, 18px at the corners, is a normal window's target.
  const RESIZE_EDGES = [
    { k: "n", cur: "ns-resize", s: { top: 0, left: 18, right: 18, height: 8 } },
    { k: "s", cur: "ns-resize", s: { bottom: 0, left: 18, right: 18, height: 8 } },
    { k: "w", cur: "ew-resize", s: { left: 0, top: 18, bottom: 18, width: 8 } },
    { k: "e", cur: "ew-resize", s: { right: 0, top: 18, bottom: 18, width: 8 } },
    { k: "nw", cur: "nwse-resize", s: { top: 0, left: 0, width: 18, height: 18 } },
    { k: "ne", cur: "nesw-resize", s: { top: 0, right: 0, width: 18, height: 18 } },
    { k: "sw", cur: "nesw-resize", s: { bottom: 0, left: 0, width: 18, height: 18 } },
    { k: "se", cur: "nwse-resize", s: { bottom: 0, right: 0, width: 18, height: 18 } },
  ];
  // DOCUMENT-LEVEL listeners for the duration of a resize, not setPointerCapture. Dragging
  // an edge outward takes the cursor OFF the window almost immediately - that is the whole
  // gesture - and if capture does not hold, every later pointermove lands on whatever is
  // underneath instead. The window then stops following the cursor after a few pixels.
  // Caught by a real mouse drag in the browser: synthetic events dispatched straight at the
  // handle resized correctly and hid the bug completely.
  const moveResize = (e) => {
    const r = resizeRef.current;
    if (!r) return;
    const dx = e.clientX - r.sx, dy = e.clientY - r.sy;
    const patch = {};
    if (r.k.includes("e")) patch.w = Math.max(300, r.w + dx);
    if (r.k.includes("s")) patch.h = Math.max(220, r.h + dy);
    // Dragging a west or north edge moves the origin as well as the size, otherwise the
    // opposite edge walks across the screen instead of staying put.
    if (r.k.includes("w")) { const w = Math.max(300, r.w - dx); patch.w = w; patch.x = r.x + (r.w - w); }
    if (r.k.includes("n")) { const h = Math.max(220, r.h - dy); patch.h = h; patch.y = r.y + (r.h - h); }
    setGeom(r.id, patch);
  };
  const startResize = (id, k) => (e) => {
    e.preventDefault(); e.stopPropagation();
    const g = ws[id] || {}; const p = posOf(id);
    resizeRef.current = { id, k, sx: e.clientX, sy: e.clientY, w: g.w || wsDefaultSize().w, h: g.h || wsDefaultSize().h, x: p.x, y: p.y };
    bringToFront(id);
    const onMove = (ev) => moveResize(ev);
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  };
  // Keyboard move: the clip is focusable and arrow-steppable, so a window can be positioned
  // without a pointer. The native CSS resize corner is pointer-only, so SHIFT+arrow on the
  // same handle resizes - otherwise a keyboard-only reader can move, dock, expand and
  // minimise a window but never resize one (a11y audit, 30-07 '26).
  const keyMove = (id) => (e) => {
    if (isNarrow || (ws[id] || {}).state !== "floating") return;
    const g = ws[id] || {};
    const d = wsDefaultSize();
    if (e.shiftKey) {
      const w = g.w || d.w, h = g.h || d.h;
      if (e.key === "ArrowLeft") { e.preventDefault(); setGeom(id, { w: Math.max(300, w - 40) }); }
      if (e.key === "ArrowRight") { e.preventDefault(); setGeom(id, { w: w + 40 }); }
      if (e.key === "ArrowUp") { e.preventDefault(); setGeom(id, { h: Math.max(220, h - 40) }); }
      if (e.key === "ArrowDown") { e.preventDefault(); setGeom(id, { h: h + 40 }); }
      return;
    }
    const p = posOf(id);
    if (e.key === "ArrowLeft") { e.preventDefault(); setGeom(id, { x: Math.max(0, p.x - 16), y: p.y }); }
    if (e.key === "ArrowRight") { e.preventDefault(); setGeom(id, { x: p.x + 16, y: p.y }); }
    if (e.key === "ArrowUp") { e.preventDefault(); setGeom(id, { x: p.x, y: Math.max(0, p.y - 16) }); }
    if (e.key === "ArrowDown") { e.preventDefault(); setGeom(id, { x: p.x, y: p.y + 16 }); }
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
    // FLOATING is position:fixed - the window belongs to the screen, not to the result
    // panel. `resize: both` is gone; the eight edge handles below replace it.
    const p = posOf(id);
    return { ...base, position: "fixed", left: p.x, top: p.y, width: g.w || wsDefaultSize().w, height: g.h || wsDefaultSize().h, zIndex: RS_LAYERS.float + (g.z || 1), border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)", minWidth: 300, minHeight: 220 };
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
      onPointerDown={draggable ? startDrag(id) : undefined}
      onKeyDown={draggable ? keyMove(id) : undefined} tabIndex={draggable ? 0 : undefined}
      aria-label={draggable ? "Move the " + label + " window - arrow keys to move, Shift plus arrow keys to resize, or drag" : undefined}
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
  const navAct = (fn) => () => { fn(); closeNav(); };
  // An EXPANDED window fills the canvas exactly like a modal, so it needs a modal's
  // semantics: without them a keyboard user tabs into duty lines and other windows that are
  // visually covered (a11y audit, 30-07 '26). Only one can be expanded at a time in
  // practice, but the check is over the set so it stays true if that changes.
  const expandedId = winIds.find((id) => ws[id].state === "expanded" && !isNarrow) || null;
  const coveredByExpanded = !!expandedId;
  const navDivider = <div aria-hidden="true" style={{ height: 1, background: "#e6e9f0", margin: "5px 0" }} />;
  const navHead = (t) => <div style={{ fontFamily: mono, fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".13em", color: "#8a8272", padding: "6px 12px 2px" }}>{t}</div>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#e9edf3" }}>
      <div ref={canvasRef} style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>

        {/* Main document: the job advertisement, always present, never a tab. */}
        <div className="wis-scroll" aria-label={mainLabel} aria-hidden={coveredByExpanded ? "true" : undefined}
          style={{ position: "absolute", inset: 0, paddingRight: mainPadRight, paddingBottom: mainPadBottom, overflowY: "auto", background: "#e9e7e0", transition: "padding .12s ease" }}>
          <div style={{ padding: "12px 16px 72px" }} inert={coveredByExpanded ? "" : undefined}>{mainEl}</div>
        </div>

        {/* Managed windows. Each is ONE element in every state - see HIDE, DO NOT UNMOUNT. */}
        {winIds.map((id) => {
          const g = ws[id] || {};
          const label = labelOf(id);
          return (
            <div key={id} data-ws-id={id}
              onPointerDown={isNarrow || g.state !== "floating" ? undefined : () => bringToFront(id)}
              role={(isNarrow || g.state === "expanded") && g.state !== "minimized" ? "dialog" : undefined}
              aria-modal={(isNarrow || g.state === "expanded") && g.state !== "minimized" ? "true" : undefined}
              aria-label={label + (isNarrow ? " (full-screen)" : " (" + g.state + " window)")}
              // Minimised windows are display:none, which already removes them from the tab
              // order - aria-hidden just keeps the two signals in agreement. A window that
              // is merely COVERED by an expanded sibling needs the stronger treatment.
              aria-hidden={g.state === "minimized" || (coveredByExpanded && id !== expandedId) ? "true" : undefined}
              inert={coveredByExpanded && id !== expandedId && g.state !== "minimized" ? "" : undefined}
              style={winShell(id)}>
              {clip(id, shortOf(id), trayNote && trayNote[id], !isNarrow && g.state === "floating")}
              {/* Standard window controls (Human Lead: "the standard buttons of min, max").
                  Dock stays as a labelled word - it is this workspace's own idea, not a
                  convention - then the three every window is expected to have. */}
              <div style={{ position: "absolute", right: 6, top: 4, zIndex: 4, display: "flex", gap: 2 }}>
                {!isNarrow && (
                  <button type="button" onClick={() => setWinState(id, g.state === "docked" ? "floating" : "docked")}
                    aria-pressed={g.state === "docked"} style={{ ...ctlBtn(g.state === "docked"), marginRight: 4 }}
                    aria-label={g.state === "docked" ? "Float the " + label + " window" : "Dock the " + label + " to the side"}
                    title={g.state === "docked" ? "Float" : "Dock"}>{g.state === "docked" ? "float" : "dock"}</button>
                )}
                <button type="button" onClick={() => setWinState(id, "minimized")} style={ctlBtn(false)}
                  aria-label={"Minimise the " + label + " to the tray - it stays open, parked"} title="Minimise">{String.fromCharCode(0x2013)}</button>
                {!isNarrow && (
                  <button type="button" onClick={() => setWinState(id, g.state === "expanded" ? "floating" : "expanded")}
                    aria-pressed={g.state === "expanded"} style={ctlBtn(g.state === "expanded")}
                    aria-label={g.state === "expanded" ? "Restore the " + label + " to a floating window" : "Maximise the " + label}
                    title={g.state === "expanded" ? "Restore" : "Maximise"}>{g.state === "expanded" ? String.fromCharCode(0x2750) : String.fromCharCode(0x25a1)}</button>
                )}
                <button type="button" onClick={() => onClose(id)} style={ctlBtn(false)}
                  aria-label={"Close the " + label + (WS_CORE.includes(id) ? " - it returns to the tray" : " - it returns to the navigator's add list")}
                  title="Close">{String.fromCharCode(0x2715)}</button>
              </div>
              {/* Eight resize handles, floating state only. */}
              {!isNarrow && g.state === "floating" && RESIZE_EDGES.map((r) => (
                <div key={r.k} onPointerDown={startResize(id, r.k)} aria-hidden="true"
                  style={{ position: "absolute", zIndex: 5, cursor: r.cur, touchAction: "none", ...r.s }} />
              ))}
              <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: CLIP_GUTTER + "px 12px 8px" }}>{toolEl[id]}</div>
              {/* Bottom strip (Human Lead, 30-07 '26): a window's own tool rail. The gear is
                  the first tenant - it carries the text-size control that used to sit
                  permanently in the masthead. More icons land here as PR 3 moves the ad and
                  its section tabs into a window of their own. */}
              <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", borderTop: "1px solid #e2e0d8", background: "#f4f6fa" }}>
                <button type="button" onClick={() => setSettingsFor(settingsFor === id ? null : id)}
                  aria-expanded={settingsFor === id} aria-label={"Settings for the " + label + " window"} title="Settings"
                  style={{ ...ctlBtn(settingsFor === id), background: settingsFor === id ? "#142a8e" : "transparent", border: "none", fontSize: "0.875rem" }}>
                  <span aria-hidden="true">{String.fromCharCode(0x2699)}</span>
                </button>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: mono, fontSize: "0.625rem", color: "#8a8272", paddingRight: 4 }}>{g.state}</span>
              </div>
              {settingsFor === id && (
                <div role="group" aria-label={"Settings for the " + label + " window"}
                  style={{ flex: "none", padding: "8px 12px 10px", borderTop: "1px solid #e2e0d8", background: "#fbfaf8" }}>
                  {settingsEl}
                </div>
              )}
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
            {/* The trigger renders BEFORE the popover so Tab moves forward from the
                button INTO the menu. The popover is position:absolute, so DOM order is
                free - putting the menu first (for visual convenience) made a freshly
                opened menu reachable only by Shift+Tab, last item first (a11y audit). */}
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
            {navOpen && (
              <div ref={menuRef} role="menu" aria-label="Workspace navigator" onKeyDown={menuKeys}
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
