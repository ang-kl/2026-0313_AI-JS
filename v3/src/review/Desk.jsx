// v3/src/review/Desk.jsx - PR 1 (Part B.4): the layout engine JSX, moved verbatim -
// splitter, float layer, pinned edge strip + slide-over, bottom sheet, connector
// overlay. Option 1 (Human Lead, PR 1 gate): ALL user/persistent state stays in
// ReviewStudio.jsx and arrives as props.
// PR 2 (Part B.3): WIN_LABELS / TAB_WINDOWS derive from the declarative registry.
// PR 3 (Part C.2, LC1): the single connLine grew into a link SET. The measurement
// state (lines/stubs) lives HERE - it is ephemeral DOM-derived geometry recomputed
// every paint, not user state, so Option 1's "persistent state stays up" rule holds.
import { useState, useLayoutEffect } from "react";
import { RS_LAYERS } from "./rs-rules.js";
import { WIN_LABELS, TAB_WINDOWS, deriveLinks } from "./registry.jsx";

// One cubic-bezier path string (same curve family as the #358 single line).
const bez = (l) => "M " + l.x1 + " " + l.y1 + " C " + ((l.x1 + l.x2) / 2) + " " + l.y1 + ", " + ((l.x1 + l.x2) / 2) + " " + l.y2 + ", " + l.x2 + " " + l.y2;

// P2: resolve a TextQuote anchor to a DOM Range inside `host`. The quote was captured
// from whitespace-normalised text, so match raw text first, then fall back to a
// whitespace-flexible regex; walk text nodes to place the Range. Returns null if the
// verbatim text is no longer present (the link simply doesn't draw - never mis-points).
function findQuoteRange(host, quote) {
  if (!host || !quote) return null;
  const raw = host.textContent || "";
  let idx = raw.indexOf(quote);
  let q = quote;
  if (idx < 0) {
    try {
      const rx = new RegExp(quote.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"));
      const m = rx.exec(raw);
      if (m) { idx = m.index; q = m[0]; }
    } catch (_) { /* bad regex - give up */ }
  }
  if (idx < 0) return null;
  const end = idx + q.length;
  const range = document.createRange();
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
  let acc = 0, started = false, node;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (!started && acc + len > idx) { range.setStart(node, idx - acc); started = true; }
    if (started && acc + len >= end) { range.setEnd(node, end - acc); return range; }
    acc += len;
  }
  return null;
}

export default function Desk({ deskRef, linkData, onStubActivate, splitPct, setSplitPct, splitDragRef, persistFloats, floats, tab, overrides, setOverrides, pinned, activeWin, setActiveWin, dockHover, renderWindow, tearOff, startFloatDrag, moveFloatDrag, stopFloatDrag, bringToFront, dockBack, resetFloat, setPinned, slideOpen, setSlideOpen, sheet, setSheet, sheetCloseRef, renderSheet, isNarrow, userLinks, linkDrag, autoLinks, suggestLinks }) {
  // PR 3 (Part C.2 items 3-5): measure ALL of the tab's derived links each paint.
  // Both endpoints visible -> a bezier line (active: 2px full-opacity; siblings: 1px,
  // 30% opacity). Exactly one endpoint visible -> an edge STUB at that endpoint's
  // panel border with a count badge, replacing the old vanish behaviour (the honesty
  // rule survives: a stub points at a REAL off-screen/off-tab partner, and clicking
  // it activates that window; nothing is drawn for links with no live endpoint).
  const [conn, setConn] = useState({ lines: [], stubs: [], user: [], auto: [], suggest: [] });
  const links = deriveLinks(tab, linkData || {});
  const linkKey = links.map((l) => l.id + (l.active ? "!" : "")).join("|");
  // P1 user-authored locked links (blue), measured with the same DOM geometry as the
  // derived amber connector but never gated on the active span - a lock stays drawn.
  const userKey = (userLinks || []).map((l) => l.id).join("|");
  // Layer 1 auto-connections (grey): same DOM geometry, painted only when both endpoints
  // resolve live - so requirement spans with no on-screen duty line simply don't draw.
  const autoKey = (autoLinks || []).map((l) => l.id).join("|");
  const suggestKey = (suggestLinks || []).map((l) => l.id).join("|");
  useLayoutEffect(() => {
    const desk = deskRef.current;
    if (!desk || (!links.length && !(userLinks && userLinks.length) && !(autoLinks && autoLinks.length) && !(suggestLinks && suggestLinks.length))) { setConn({ lines: [], stubs: [], user: [], auto: [], suggest: [] }); return; }
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
      // P2: an anchor is an element (duty line / O-I-A card) OR a text-quote phrase.
      // Legacy P1 links carry no `t` - read them as duty(from)->oia(to).
      const rectOfAnchor = (a, role) => {
        if (!a) return null;
        const t = a.t || (role === "from" ? "duty" : "oia");
        if (t === "phrase") {
          const host = document.querySelector('[data-anchor-block="' + String(a.block).replace(/"/g, '\\"') + '"]');
          const range = findQuoteRange(host, a.quote);
          if (!range) return null;
          const r = range.getBoundingClientRect();
          if (!r || (!r.width && !r.height)) return null;
          const inViewport = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
          if (!inViewport) return { offscreen: true, r };
          const inFloat = host && !desk.contains(host);
          if (!inFloat && (r.bottom < deskRect.top || r.top > deskRect.bottom)) return { offscreen: true, r };
          return { offscreen: false, r };
        }
        const sel = t === "duty" ? ("#li-" + a.id) : ('[data-oia-anchor="' + String(a.id).replace(/"/g, '\\"') + '"]');
        return rectOf(sel);
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
      // P1: user links draw only when BOTH endpoints are live (both panels on-screen);
      // off-screen ones simply don't render this frame - the Locked-links bar still
      // manages them. No stub (a user link is not a derived-coverage affordance).
      const userLines = [];
      (userLinks || []).forEach((l) => {
        const a = rectOfAnchor(l.from, "from"), b = rectOfAnchor(l.to, "to");
        if (a && !a.offscreen && b && !b.offscreen) {
          userLines.push({ id: l.id, x1: a.r.right, y1: a.r.top + a.r.height / 2, x2: b.r.left, y2: b.r.top + b.r.height / 2 });
        }
      });
      // Layer 1: auto-connections, same both-endpoints-live rule as user links.
      const autoLines = [];
      (autoLinks || []).forEach((l) => {
        const a = rectOfAnchor(l.from, "from"), b = rectOfAnchor(l.to, "to");
        if (a && !a.offscreen && b && !b.offscreen) {
          autoLines.push({ id: l.id, x1: a.r.right, y1: a.r.top + a.r.height / 2, x2: b.r.left, y2: b.r.top + b.r.height / 2 });
        }
      });
      // Layer 3: AI-suggested links, same both-endpoints-live rule (an unresolved anchor
      // draws nothing - the mis-point guard). Rendered dashed so it never reads committed.
      const suggestLines = [];
      (suggestLinks || []).forEach((l) => {
        const a = rectOfAnchor(l.from, "from"), b = rectOfAnchor(l.to, "to");
        if (a && !a.offscreen && b && !b.offscreen) {
          suggestLines.push({ id: l.id, x1: a.r.right, y1: a.r.top + a.r.height / 2, x2: b.r.left, y2: b.r.top + b.r.height / 2 });
        }
      });
      setConn({ lines, stubs: Object.values(stubAgg), user: userLines, auto: autoLines, suggest: suggestLines });
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
  }, [linkKey, userKey, autoKey, suggestKey, tab, floats, pinned, overrides, activeWin, splitPct]);
  return (
    <>
      {/* Body: No.138 U2 - the two-panel study desk. Each panel hosts tabbed windows;
          the top tab selects the view-set (window assignment per TAB_WINDOWS). */}
      <div ref={deskRef} className="wis-desk" style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        {/* PR 3: connector overlay - FIXED and viewport-spanning so floated windows are
            valid endpoints (Part C.2 item 4); under the floats (z 1400+), sheet (1394)
            and pinned strip (1395+), above the desk. pointer-events none except the
            clickable stubs. All coordinates are viewport coordinates. */}
        {/* Goal §9: on narrow screens panels stack full-width and float into
            full-screen surfaces, so a curved connector between them would cross the
            whole viewport and confuse rather than trace. Hide it there - the comment
            card's aria-label ("linked to highlighted duty N") still carries the link. */}
        {!isNarrow && (conn.lines.length > 0 || conn.stubs.length > 0 || conn.user.length > 0 || conn.auto.length > 0 || conn.suggest.length > 0 || (linkDrag && linkDrag.moved)) && (
          <svg aria-hidden="true" style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: RS_LAYERS.connector, pointerEvents: "none", overflow: "visible" }}>
            {/* Layer 1 - auto-drawn provenance (GREY, thin, faint), painted UNDER the amber
                trace and the blue locks so the user's own work always reads on top. These
                are engine-owned facts (card is duty), never inference - hence quiet, always
                shown while the toggle is on, never gated on hover. */}
            {(conn.auto || []).map((l) => (
              <g key={l.id} opacity={0.55}>
                <path d={bez(l)} fill="none" stroke="#8792a3" strokeWidth={1.6} />
                <circle cx={l.x1} cy={l.y1} r={2.8} fill="#8792a3" />
                <circle cx={l.x2} cy={l.y2} r={2.8} fill="#8792a3" />
              </g>
            ))}
            {/* Layer 3 - AI-suggested links: DASHED violet, so it never reads as a solid
                committed line. Advisory inference; the textual Accept/Dismiss cards are the
                accessible surface (this SVG is aria-hidden). Painted above grey but below the
                amber trace and blue locks so the user's own committed work reads on top. */}
            {(conn.suggest || []).map((l) => (
              <g key={l.id} opacity={0.85}>
                <path d={bez(l)} fill="none" stroke="#6d28d9" strokeWidth={2} strokeDasharray="6 5" />
                <circle cx={l.x1} cy={l.y1} r={3} fill="#6d28d9" />
                <circle cx={l.x2} cy={l.y2} r={3} fill="#fff" stroke="#6d28d9" strokeWidth={1.6} />
              </g>
            ))}
            {/* Design handoff: the Word-style connector is AMBER. The handoff's #f5a623
                fails non-text contrast on the light desk (~2.1:1) - #b45309 keeps the
                amber identity at >=4.5:1 (goal §2 non-text contrast, recorded conflict). */}
            {conn.lines.map((l) => (
              <g key={l.id} style={{ transition: "opacity .2s" }} opacity={0.95}>
                <path d={bez(l)} fill="none" stroke="#b45309" strokeWidth={2.2} />
                <circle cx={l.x1} cy={l.y1} r={4} fill="#b45309" />
                <circle cx={l.x2} cy={l.y2} r={4} fill="#b45309" />
              </g>
            ))}
            {conn.stubs.map((s) => (
              <g key={s.id} style={{ pointerEvents: "auto", cursor: "pointer" }} opacity={s.active ? 0.95 : 0.55}
                onClick={() => onStubActivate && onStubActivate(s.targetWin)}
                aria-hidden="false" role="button" tabIndex={-1}>
                <title>{"Open " + (WIN_LABELS[s.targetWin] || s.targetWin) + " (" + s.count + " link" + (s.count === 1 ? "" : "s") + ")"}</title>
                <line x1={s.x} y1={s.y} x2={s.side === "right" ? s.x + 14 : s.x - 14} y2={s.y} stroke="#b45309" strokeWidth={2} />
                <circle cx={s.side === "right" ? s.x + 22 : s.x - 22} cy={s.y} r={9} fill="#b45309" />
                <text x={s.side === "right" ? s.x + 22 : s.x - 22} y={s.y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff" fontFamily="'Spline Sans Mono',monospace">{s.count}</text>
              </g>
            ))}
            {/* P1 user-authored LOCKED links - blue, to read as distinct from the amber
                engine connector; persistent (not hover-gated) so a lock stays visible. */}
            {(conn.user || []).map((l) => (
              <g key={l.id} opacity={0.95}>
                <path d={bez(l)} fill="none" stroke="#1d4ed8" strokeWidth={2.2} />
                <circle cx={l.x1} cy={l.y1} r={4} fill="#1d4ed8" />
                <circle cx={l.x2} cy={l.y2} r={4} fill="#1d4ed8" />
              </g>
            ))}
            {/* P3 drag-to-connect: the live rubber-band from the grabbed handle to the
                cursor. Dashed while hunting; the cursor dot turns solid + larger once
                it is over a valid drop target (linkDrag.overKey set), so the drop reads
                as "will land here". Ephemeral - never persisted, never an engine fact. */}
            {linkDrag && linkDrag.moved && (
              <g opacity={0.95}>
                <path d={bez({ x1: linkDrag.sx, y1: linkDrag.sy, x2: linkDrag.x, y2: linkDrag.y })}
                  fill="none" stroke="#1d4ed8" strokeWidth={2.2} strokeDasharray={linkDrag.overKey ? "0" : "5 5"} />
                <circle cx={linkDrag.sx} cy={linkDrag.sy} r={4} fill="#1d4ed8" />
                <circle cx={linkDrag.x} cy={linkDrag.y} r={linkDrag.overKey ? 7 : 5} fill={linkDrag.overKey ? "#1d4ed8" : "#fff"} stroke="#1d4ed8" strokeWidth={2} />
              </g>
            )}
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
          // "+ Add panel" (design handoff / goal §6): any registry window can join this
          // tab's strip via the existing overrides mechanism - no new state model. A
          // window ADDED this way (not in the tab's base set) can be removed again.
          const tabBase = TAB_WINDOWS[tab] || TAB_WINDOWS.overview;
          const shownSet = new Set([...tabBase.left, ...tabBase.right, ...Object.keys(ov)]);
          const addable = Object.keys(WIN_LABELS).filter((w) => !shownSet.has(w));
          const actIsAdded = !!act && !base.includes(act) && ov[act] === side;
          return (
            <div key={side} className="wis-panel" style={{ flex: side === "left" ? "0 0 " + splitPct + "%" : "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", borderLeft: side === "right" ? "1px solid #e2e0d8" : "none", background: side === "right" ? "#dedbd0" : "#e9e7e0", outline: dockHover === side ? "3px solid #1a56db" : "none", outlineOffset: -3, transition: "outline-color .1s" }}>
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
                    style={{ flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 30, padding: "6px 6px", marginBottom: -1, border: "none", borderBottom: "1px solid transparent", background: "transparent", color: "#6b6456", cursor: "pointer", fontSize: "0.8125rem", opacity: 0.85 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "#5b6878"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.85; e.currentTarget.style.color = "#6b6456"; }}>
                    <span aria-hidden="true">{String.fromCharCode(0x29c9)}</span>
                  </button>
                )}
                {actIsAdded && setOverrides && (
                  <button type="button" aria-label={"Remove " + WIN_LABELS[act] + " from this tab (added panel)"}
                    title={"Remove " + WIN_LABELS[act] + " from this tab"}
                    onClick={() => { setOverrides((prev) => { const t = { ...(prev[tab] || {}) }; delete t[act]; return { ...prev, [tab]: t }; }); }}
                    style={{ flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 30, padding: "6px 6px", marginBottom: -1, border: "none", borderBottom: "1px solid transparent", background: "transparent", color: "#586474", cursor: "pointer", fontSize: "0.875rem" }}>
                    <span aria-hidden="true">{String.fromCharCode(0x00d7)}</span>
                  </button>
                )}
                {addable.length > 0 && setOverrides && (
                  <select value="" aria-label={"Add a panel to the " + (side === "left" ? "left" : "right") + " side"}
                    onChange={(e) => { const w = e.target.value; if (!w) return;
                      setOverrides((prev) => ({ ...prev, [tab]: { ...(prev[tab] || {}), [w]: side } }));
                      setActiveWin((prev) => ({ ...prev, [tab]: { ...(prev[tab] || {}), [side]: w } })); }}
                    style={{ flex: "none", marginLeft: "auto", marginBottom: 3, minHeight: 36, maxWidth: 130, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#14204f", background: "transparent", border: "1px dashed #b9b3a4", borderRadius: 8, padding: "2px 6px", cursor: "pointer" }}>
                    <option value="">+ Add panel</option>
                    {addable.map((w) => <option key={w} value={w}>{WIN_LABELS[w]}</option>)}
                  </select>
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

      {/* No.138 U3: the float layer - torn-off windows live here, above the desk.
          Goal §7/§11: on a narrow screen a floated window is NOT a cramped fixed box -
          it becomes a full-screen slide-over (fixed inset:0, aria-modal), drag/resize
          suppressed, so it stays usable at 320-375px. On desktop it is the draggable,
          resizable, cascade-positioned window with a Reset-position control. */}
      {floats.map((f) => {
        const shell = isNarrow
          ? { position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: f.z, background: "#fbfaf8", display: "flex", flexDirection: "column", overflow: "hidden", animation: "wisSlideIn .25s ease" }
          : { position: "fixed", left: f.x, top: f.y, width: f.w, height: f.h, zIndex: f.z, background: "#fbfaf8", border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)", display: "flex", flexDirection: "column", resize: "both", overflow: "hidden", minWidth: 300, minHeight: 200, maxWidth: "96vw", maxHeight: "92vh" };
        return (
        <div key={f.id} role="dialog" aria-modal={isNarrow ? "true" : undefined} aria-label={WIN_LABELS[f.id] + (isNarrow ? " (full-screen window)" : " (floating window)")}
          onPointerDown={isNarrow ? undefined : () => bringToFront(f.id)}
          style={shell}>
          <div onPointerDown={isNarrow ? undefined : (e) => startFloatDrag(e, f.id)} onPointerMove={isNarrow ? undefined : moveFloatDrag} onPointerUp={isNarrow ? undefined : stopFloatDrag} onPointerCancel={isNarrow ? undefined : stopFloatDrag}
            style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8", cursor: isNarrow ? "default" : "move", touchAction: "none" }}>
            <span style={{ flex: 1, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{WIN_LABELS[f.id]}</span>
            {!isNarrow && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357", flex: "none" }}>drag {String.fromCharCode(0x00b7)} resize corner</span>}
            {!isNarrow && resetFloat && (
              <button type="button" onClick={() => resetFloat(f.id)} aria-label={"Reset " + WIN_LABELS[f.id] + " to its default position and size"}
                title="Reset position"
                style={{ flex: "none", minHeight: 32, minWidth: 40, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem" }}>reset</button>
            )}
            {!isNarrow && (
              <button type="button" onClick={() => { setPinned((prev) => prev.includes(f.id) ? prev : prev.concat(f.id)); dockBack(f.id); }} aria-label={"Pin " + WIN_LABELS[f.id] + " to the right edge (auto-hide)"}
                title="Pin to edge (auto-hide)"
                style={{ flex: "none", minHeight: 32, minWidth: 40, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem" }}>pin</button>
            )}
            <button type="button" onClick={() => dockBack(f.id)} aria-label={(isNarrow ? "Close " : "Close and dock ") + WIN_LABELS[f.id] + " back to its panel"}
              style={{ flex: "none", minHeight: isNarrow ? 44 : 32, minWidth: 44, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>{renderWindow(f.id)}</div>
        </div>
        );
      })}

      {/* U4-B: pinned edge strip (auto-hide) + the slide-over panel. */}
      {pinned.length > 0 && (
        <div style={{ position: "fixed", right: 0, top: "30%", zIndex: RS_LAYERS.pinned, display: "flex", flexDirection: "column", gap: 4 }}>
          {pinned.map((id) => (
            <button key={id} type="button" onClick={() => setSlideOpen(slideOpen === id ? null : id)} aria-expanded={slideOpen === id}
              aria-label={"Slide out pinned window: " + WIN_LABELS[id]}
              style={{ writingMode: "vertical-rl", minWidth: 44, minHeight: 88, padding: "10px 6px", fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#142a8e", background: "#eaf0ff", border: "1px solid #c7d6ff", borderRight: "none", borderRadius: "9px 0 0 9px", cursor: "pointer" }}>{WIN_LABELS[id]}</button>
          ))}
        </div>
      )}
      {slideOpen && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(460px, 92vw)", zIndex: RS_LAYERS.pinned + 1, background: "#fbfaf8", borderLeft: "1px solid #d9dee6", boxShadow: "-14px 0 40px rgba(15,23,42,.22)", display: "flex", flexDirection: "column", animation: "wisSlideIn .3s ease" }}>
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
          style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: RS_LAYERS.sheet,
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
