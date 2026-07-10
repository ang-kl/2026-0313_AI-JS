// v3/src/review/Desk.jsx - PR 1 (Part B.4): the layout engine JSX, moved verbatim -
// splitter, float layer, pinned edge strip + slide-over, bottom sheet, connector
// overlay. Option 1 (Human Lead, PR 1 gate): ALL user/persistent state stays in
// ReviewStudio.jsx and arrives as props.
// PR 2 (Part B.3): WIN_LABELS / TAB_WINDOWS derive from the declarative registry.
// PR 3 (Part C.2, LC1): the single connLine grew into a link SET. The measurement
// state (lines/stubs) lives HERE - it is ephemeral DOM-derived geometry recomputed
// every paint, not user state, so Option 1's "persistent state stays up" rule holds.
import { useState, useLayoutEffect } from "react";
import { WIN_LABELS, TAB_WINDOWS, deriveLinks } from "./registry.jsx";

// One cubic-bezier path string (same curve family as the #358 single line).
const bez = (l) => "M " + l.x1 + " " + l.y1 + " C " + ((l.x1 + l.x2) / 2) + " " + l.y1 + ", " + ((l.x1 + l.x2) / 2) + " " + l.y2 + ", " + l.x2 + " " + l.y2;

export default function Desk({ deskRef, linkData, onStubActivate, splitPct, setSplitPct, splitDragRef, persistFloats, floats, tab, overrides, pinned, activeWin, setActiveWin, dockHover, renderWindow, tearOff, startFloatDrag, moveFloatDrag, stopFloatDrag, bringToFront, dockBack, setPinned, slideOpen, setSlideOpen, sheet, setSheet, sheetCloseRef, renderSheet }) {
  // PR 3 (Part C.2 items 3-5): measure ALL of the tab's derived links each paint.
  // Both endpoints visible -> a bezier line (active: 2px full-opacity; siblings: 1px,
  // 30% opacity). Exactly one endpoint visible -> an edge STUB at that endpoint's
  // panel border with a count badge, replacing the old vanish behaviour (the honesty
  // rule survives: a stub points at a REAL off-screen/off-tab partner, and clicking
  // it activates that window; nothing is drawn for links with no live endpoint).
  const [conn, setConn] = useState({ lines: [], stubs: [] });
  const links = deriveLinks(tab, linkData || {});
  const linkKey = links.map((l) => l.id + (l.active ? "!" : "")).join("|");
  useLayoutEffect(() => {
    const desk = deskRef.current;
    if (!desk || !links.length) { setConn({ lines: [], stubs: [] }); return; }
    let raf = 0;
    const measure = () => {
      raf = 0;
      const deskRect = desk.getBoundingClientRect();
      // Visible = has layout AND intersects the viewport AND (for desk content)
      // intersects the desk band - floats/slide-overs are position:fixed outside the
      // desk div, so for those the viewport test is the right bound.
      const rectOf = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return null;
        const inViewport = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
        if (!inViewport) return { offscreen: true, r };
        const inFloat = !desk.contains(el);
        if (!inFloat && (r.bottom < deskRect.top || r.top > deskRect.bottom)) return { offscreen: true, r };
        return { offscreen: false, r };
      };
      const lines = [];
      const stubAgg = {}; // key: targetWin|side -> { side, y, count, targetWin }
      links.forEach((l) => {
        const a = rectOf(l.fromSel), b = rectOf(l.toSel);
        const aOn = a && !a.offscreen, bOn = b && !b.offscreen;
        if (aOn && bOn) {
          lines.push({ id: l.id, active: l.active,
            x1: a.r.right, y1: a.r.top + a.r.height / 2,
            x2: b.r.left, y2: b.r.top + b.r.height / 2 });
        } else if ((aOn || bOn) && l.active) {
          // Part C.2 item 4, tightened (Human Lead 11-07 '26, "Step 3 - meeting
          // information"): only the ACTIVE link degrades to an edge stub. Stubbing
          // every dimmed sibling produced a permanent floating count badge in empty
          // panels that read as a broken control, not an affordance. The stub pins to
          // the PANEL BOUNDARY (the splitter x) at the visible endpoint's height, so
          // it visibly points across at where the partner would be.
          const vis = aOn ? a : b;
          const targetWin = aOn ? l.toWin : l.fromWin;
          const side = aOn ? "right" : "left"; // stub points toward the missing partner
          const key = targetWin + "|" + side;
          if (!stubAgg[key]) {
            const boundary = deskRect.left + (deskRect.width * splitPct) / 100;
            const x = side === "right" ? boundary - 30 : boundary + 30;
            const y = Math.min(Math.max(vis.r.top + vis.r.height / 2, deskRect.top + 14), deskRect.bottom - 14);
            stubAgg[key] = { id: "stub-" + key, side, x, y, count: 0, targetWin, active: true };
          }
          stubAgg[key].count += 1;
        }
        // neither endpoint live: nothing is drawn (never point at nothing).
      });
      setConn({ lines, stubs: Object.values(stubAgg) });
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };
    schedule();
    window.addEventListener("resize", schedule);
    desk.addEventListener("scroll", schedule, true); // capture: fires for the scrolling panel too
    // Part C.2 item 5: observe the panel scrollers instead of guessing layout once -
    // late layout (fonts, images, async window content) re-measures automatically.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    if (ro) desk.querySelectorAll(".wis-panel .wis-scroll").forEach((el) => ro.observe(el));
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", schedule); desk.removeEventListener("scroll", schedule, true); if (ro) ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkKey, tab, floats, pinned, overrides, activeWin, splitPct]);
  return (
    <>
      {/* Body: No.138 U2 - the two-panel study desk. Each panel hosts tabbed windows;
          the top tab selects the view-set (window assignment per TAB_WINDOWS). */}
      <div ref={deskRef} className="wis-desk" style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        {/* PR 3: connector overlay - FIXED and viewport-spanning so floated windows are
            valid endpoints (Part C.2 item 4); under the floats (z 1400+), sheet (1394)
            and pinned strip (1395+), above the desk. pointer-events none except the
            clickable stubs. All coordinates are viewport coordinates. */}
        {(conn.lines.length > 0 || conn.stubs.length > 0) && (
          <svg aria-hidden="true" style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 1389, pointerEvents: "none", overflow: "visible" }}>
            {conn.lines.map((l) => (
              <g key={l.id} style={{ transition: "opacity .2s" }} opacity={l.active ? 0.85 : 0.3}>
                <path d={bez(l)} fill="none" stroke="#1a56db" strokeWidth={l.active ? 2 : 1} />
                <circle cx={l.x1} cy={l.y1} r={l.active ? 4 : 2.5} fill="#1a56db" />
                <circle cx={l.x2} cy={l.y2} r={l.active ? 4 : 2.5} fill="#1a56db" />
              </g>
            ))}
            {conn.stubs.map((s) => (
              <g key={s.id} style={{ pointerEvents: "auto", cursor: "pointer" }} opacity={s.active ? 0.95 : 0.55}
                onClick={() => onStubActivate && onStubActivate(s.targetWin)}
                aria-hidden="false" role="button" tabIndex={-1}>
                <title>{"Open " + (WIN_LABELS[s.targetWin] || s.targetWin) + " (" + s.count + " link" + (s.count === 1 ? "" : "s") + ")"}</title>
                <line x1={s.x} y1={s.y} x2={s.side === "right" ? s.x + 14 : s.x - 14} y2={s.y} stroke="#1a56db" strokeWidth={2} />
                <circle cx={s.side === "right" ? s.x + 22 : s.x - 22} cy={s.y} r={9} fill="#1a56db" />
                <text x={s.side === "right" ? s.x + 22 : s.x - 22} y={s.y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff" fontFamily="'Spline Sans Mono',monospace">{s.count}</text>
              </g>
            ))}
          </svg>
        )}
        {/* U4-C: draggable splitter sits between the mapped panels (absolute at splitPct). */}
        <div role="separator" aria-orientation="vertical" aria-label="Resize panels" tabIndex={0}
          onPointerDown={(e) => { splitDragRef.current = { sx: e.clientX, s0: splitPct }; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { const d = splitDragRef.current; if (!d || !deskRef.current) return; const w = deskRef.current.getBoundingClientRect().width; setSplitPct(Math.max(30, Math.min(75, d.s0 + ((e.clientX - d.sx) / w) * 100))); }}
          onPointerUp={() => { if (splitDragRef.current) { splitDragRef.current = null; persistFloats(floats); } }}
          onKeyDown={(e) => { if (e.key === "ArrowLeft") setSplitPct((v) => Math.max(30, v - 2)); if (e.key === "ArrowRight") setSplitPct((v) => Math.min(75, v + 2)); }}
          style={{ position: "absolute", top: 0, bottom: 0, left: "calc(" + splitPct + "% - 4px)", width: 8, cursor: "col-resize", zIndex: 6, background: "transparent", touchAction: "none" }} />
        {["left", "right"].map((side) => {
          const base = (TAB_WINDOWS[tab] || TAB_WINDOWS.overview)[side];
          const ov = overrides[tab] || {};
          const winsAll = base.filter((w) => !ov[w] || ov[w] === side)
            .concat(Object.keys(ov).filter((w) => ov[w] === side && !base.includes(w)));
          const wins = winsAll.filter((w) => !floats.some((f) => f.id === w) && !pinned.includes(w));
          const actPref = (activeWin[tab] && activeWin[tab][side]) || winsAll[0];
          const act = wins.includes(actPref) ? actPref : wins[0];
          return (
            <div key={side} className="wis-panel" style={{ flex: side === "left" ? "0 0 " + splitPct + "%" : "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", borderLeft: side === "right" ? "1px solid #e2e0d8" : "none", background: side === "right" ? "#f4f6fa" : "#e9edf3", outline: dockHover === side ? "3px solid #1a56db" : "none", outlineOffset: -3, transition: "outline-color .1s" }}>
              <div className="wis-scroll" role="tablist" aria-label={side + " panel windows"} style={{ flex: "none", display: "flex", gap: 4, padding: "4px 8px 0", overflowX: "auto", borderBottom: "1px solid #e2e0d8", background: "#fbfaf7" }}>
                {wins.map((w) => { const on = act === w; return (
                  <button key={w} type="button" role="tab" aria-selected={on}
                    onClick={() => setActiveWin((prev) => ({ ...prev, [tab]: { ...(prev[tab] || {}), [side]: w } }))}
                    style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: on ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer", minHeight: 40, padding: "6px 12px", background: on ? (side === "right" ? "#f4f6fa" : "#e9edf3") : "#fff", color: on ? "#142a8e" : "#5b6878", border: "1px solid " + (on ? "#d9dee6" : "#e3e8ef"), borderBottom: on ? "1px solid transparent" : "1px solid #d9dee6", borderRadius: "9px 9px 0 0", marginBottom: -1, position: "relative", zIndex: on ? 2 : 1 }}>{WIN_LABELS[w]}</button>
                ); })}
                {/* U3: tear off the ACTIVE window into the float layer. Subtle by design
                    (Human Lead, 08-07 '26): icon-only, muted, small footprint - the panel
                    strip should not read as one more big tab. Meaning still carried via
                    aria-label + title, not lost, just not shouting visually. */}
                {act && (
                  <button type="button" onClick={() => tearOff(act)} aria-label={"Float this window: " + WIN_LABELS[act]}
                    title={"Tear off " + WIN_LABELS[act] + " into a floating window"}
                    style={{ flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 30, padding: "6px 6px", marginBottom: -1, border: "none", borderBottom: "1px solid transparent", background: "transparent", color: "#a8a193", cursor: "pointer", fontSize: "0.8125rem", opacity: 0.7 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "#5b6878"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.color = "#a8a193"; }}>
                    <span aria-hidden="true">{String.fromCharCode(0x29c9)}</span>
                  </button>
                )}
              </div>
              <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px 48px", position: "relative" }}>
                {dockHover === side && <div aria-hidden="true" style={{ position: "sticky", top: 0, zIndex: 5, textAlign: "center", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#1a56db", background: "#eaf0ff", border: "1px dashed #1a56db", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>drop to dock here as a tab</div>}
                {act ? renderWindow(act) : <p style={{ fontSize: "0.8125rem", color: "#94a0b0", lineHeight: 1.5 }}>All of this panel's windows are floating or pinned - close or unpin one to dock it back here.</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* No.138 U3: the float layer - torn-off windows live here, above the desk. */}
      {floats.map((f) => (
        <div key={f.id} role="dialog" aria-label={WIN_LABELS[f.id] + " (floating window)"}
          onPointerDown={() => bringToFront(f.id)}
          style={{ position: "fixed", left: f.x, top: f.y, width: f.w, height: f.h, zIndex: f.z, background: "#fbfaf8", border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)", display: "flex", flexDirection: "column", resize: "both", overflow: "hidden", minWidth: 300, minHeight: 200 }}>
          <div onPointerDown={(e) => startFloatDrag(e, f.id)} onPointerMove={moveFloatDrag} onPointerUp={stopFloatDrag} onPointerCancel={stopFloatDrag}
            style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8", cursor: "move", touchAction: "none" }}>
            <span style={{ flex: 1, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{WIN_LABELS[f.id]}</span>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357", flex: "none" }}>drag {String.fromCharCode(0x00b7)} resize corner</span>
            <button type="button" onClick={() => { setPinned((prev) => prev.includes(f.id) ? prev : prev.concat(f.id)); dockBack(f.id); }} aria-label={"Pin " + WIN_LABELS[f.id] + " to the right edge (auto-hide)"}
              title="Pin to edge (auto-hide)"
              style={{ flex: "none", minHeight: 32, minWidth: 40, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem" }}>pin</button>
            <button type="button" onClick={() => dockBack(f.id)} aria-label={"Close and dock " + WIN_LABELS[f.id] + " back to its panel"}
              style={{ flex: "none", minHeight: 32, minWidth: 40, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>{renderWindow(f.id)}</div>
        </div>
      ))}

      {/* U4-B: pinned edge strip (auto-hide) + the slide-over panel. */}
      {pinned.length > 0 && (
        <div style={{ position: "fixed", right: 0, top: "30%", zIndex: 1395, display: "flex", flexDirection: "column", gap: 4 }}>
          {pinned.map((id) => (
            <button key={id} type="button" onClick={() => setSlideOpen(slideOpen === id ? null : id)} aria-expanded={slideOpen === id}
              aria-label={"Slide out pinned window: " + WIN_LABELS[id]}
              style={{ writingMode: "vertical-rl", minWidth: 44, minHeight: 88, padding: "10px 6px", fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#142a8e", background: "#eaf0ff", border: "1px solid #c7d6ff", borderRight: "none", borderRadius: "9px 0 0 9px", cursor: "pointer" }}>{WIN_LABELS[id]}</button>
          ))}
        </div>
      )}
      {slideOpen && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(460px, 92vw)", zIndex: 1396, background: "#fbfaf8", borderLeft: "1px solid #d9dee6", boxShadow: "-14px 0 40px rgba(15,23,42,.22)", display: "flex", flexDirection: "column", animation: "wisSlideIn .3s ease" }}>
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8" }}>
            <span style={{ flex: 1, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e" }}>{WIN_LABELS[slideOpen]}</span>
            <button type="button" onClick={() => { setPinned((prev) => prev.filter((x) => x !== slideOpen)); setSlideOpen(null); }} aria-label="Unpin - dock this window back to its panel" style={{ flex: "none", minHeight: 32, padding: "0 10px", border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem" }}>unpin</button>
            <button type="button" onClick={() => setSlideOpen(null)} aria-label="Slide the pinned window away (Esc)" style={{ flex: "none", minHeight: 32, minWidth: 40, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>{renderWindow(slideOpen)}</div>
        </div>
      )}

      {/* Bottom drawer: cramped/overflow content (tables, long explain cards) with no
          connector partner - mounted outside deskRef so it never perturbs connector
          geometry. Sits below the pinned slide-over (1394 < 1395/1396) so both can be
          open together; floats (high z) stay draggable above everything. Non-blocking
          (aria-modal false) - the desk stays interactive underneath. */}
      {sheet && (
        <div role="dialog" aria-modal="false" aria-label={sheet.title}
          style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1394,
            maxHeight: "min(60vh, 560px)", background: "#fbfaf8",
            borderTop: "1px solid #d9dee6", borderRadius: "14px 14px 0 0",
            boxShadow: "0 -14px 40px rgba(15,23,42,.22)",
            display: "flex", flexDirection: "column", animation: "wisSlideUp .3s ease" }}>
          <div style={{ position: "relative", flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8" }}>
            <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: 6, transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "#d9dee6" }} />
            <span style={{ flex: 1, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e", marginLeft: 6 }}>{sheet.title}</span>
            <button type="button" ref={sheetCloseRef} onClick={() => setSheet(null)} aria-label="Close the detail drawer (Esc)"
              style={{ flex: "none", minHeight: 44, minWidth: 44, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
          </div>
          <div style={{ overflowY: "auto", padding: "4px 16px 20px" }}>{renderSheet(sheet)}</div>
        </div>
      )}
    </>
  );
}
