// WikiGraphView.jsx - PR5: + Ecotone overlay
// Lens toggle (Candidate / Organisation) over the radial focus-browser graph;
// CandidateJourney + CandidateBrief; OrgJourney value stream.
// PR5 adds the ECOTONE overlay (toggle): nodes tinted by realm (internal / edge / external)
// from the deterministic wikiRealmOf rule (computeRealmMap, tier "derived"), realm encoded by
// BOTH colour AND shape (thin solid / thick + amber glow / dashed), cross-realm links amber
// dashed, a realm legend with present/withheld state, and an edge-zone callout on selection.
// Consumes a {nodes, edges} payload from getKnowledgeGraph() + the live result object.
// R007: ASCII only in JSX strings. R006: no multi-line async arrow in JSX props.
// No red/green - blue/amber/teal/purple only. 44px touch targets. aria-labels on SVG.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import CandidateJourney from "./CandidateJourney.jsx";
import OrgJourney from "./OrgJourney.jsx";
import { computeRealmMap } from "./wikiRealmOf.js";
import { nodeImportance, impToScale } from "./graphMetrics.js";
import NeuralGraph from "./NeuralGraph.jsx";

// ── palette mirrors C in App.jsx ─────────────────────────────────────────────
const C = {
  bg:         "#e6ebf2",
  surface:    "#ffffff",
  border:     "#e3e9f1",
  accent:     "#1a56db",
  accentSoft: "#e8f0fe",
  eu:         "#003399",
  muted:      "#5b6878",
  text:       "#1a202c",
  textSub:    "#4a5568",
  teal:       "#0e7490",
  tealBg:     "#ecfeff",
  tealBdr:    "#a5f3fc",
  amber:      "#b45309",
  amberBg:    "#fffbeb",
  amberBdr:   "#fcd9a0",
  purple:     "#7c3aed",
  purpleBg:   "#f3e8ff",
  purpleBdr:  "#ddd6fe",
};

// NEO tokens mirror App.jsx NEO
const NEO = {
  raise:   "6px 6px 14px rgba(174,189,212,0.55), -6px -6px 13px rgba(255,255,255,0.9)",
  raiseSm: "4px 4px 9px rgba(174,189,212,0.5), -4px -4px 9px rgba(255,255,255,0.9)",
  inset:   "inset 3px 3px 7px rgba(174,189,212,0.5), inset -3px -3px 7px rgba(255,255,255,0.85)",
};

// Prov chip kinds - colours aligned exactly to App.jsx PROV (the canonical palette)
const PROV_META = {
  mcf:        { icon: "●", label: "from posting",  bg: "#f0fdfa", bdr: "#99f6e4", fg: "#0f766e" },
  computed:   { icon: "✓", label: "computed",       bg: "#eef2ff", bdr: "#c7d2fe", fg: "#1e40af" },
  derived:    { icon: "◐", label: "derived",        bg: "#ecfeff", bdr: "#a5f3fc", fg: "#0e7490" },
  ai:         { icon: "~", label: "AI estimate",    bg: "#fffbeb", bdr: "#fde68a", fg: "#b45309" },
  unverified: { icon: "?", label: "unverified",     bg: "#f5f7fa", bdr: "#dde3ec", fg: "#5b6878" },
};

// Node-type colours keyed to the cluster field the KG uses.
// Blue/teal/purple/amber families only - no red/green.
const CLUSTER_COLOUR = {
  individual:   { fill: "#e8f0fe", stroke: "#c7d2fe", text: "#1a56db" },
  department:   { fill: "#ecfeff", stroke: "#a5f3fc", text: "#0e7490" },
  organisation: { fill: "#f3e8ff", stroke: "#ddd6fe", text: "#7c3aed" },
  competition:  { fill: "#fffbeb", stroke: "#fcd9a0", text: "#b45309" },
  unscoped:     { fill: "#f1f5f9", stroke: "#cbd5e1", text: "#5b6878" },
};

// Ecotone realm tokens (spec section 2.1). Blue / amber / teal only - NO red/green.
// Each realm ALSO carries a non-colour SHAPE cue (stroke style) so the overlay is
// readable without relying on hue (colour-blind safe).
const REALM = {
  internal: { c: "#1a56db", label: "Internal",       cue: "thin solid edge",  dash: "none", w: 1.8, glow: false },
  edge:     { c: "#b45309", label: "Edge (ecotone)", cue: "thick edge + glow", dash: "none", w: 3.2, glow: true },
  external: { c: "#0e7490", label: "External",       cue: "dashed edge",      dash: "5 4",  w: 2.2, glow: false },
};

// Fallback when cluster is unknown
const DEFAULT_COLOUR = CLUSTER_COLOUR.unscoped;

function clusterColour(node) {
  return CLUSTER_COLOUR[node.cluster] || DEFAULT_COLOUR;
}

// Prov chip (inline - mirrors App.jsx Prov for use inside SVG tooltips and panel)
function ProvChip({ kind }) {
  const m = PROV_META[kind] || PROV_META.unverified;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: "0.6875rem", fontWeight: 700,
      borderRadius: 999, padding: "2px 8px",
      background: m.bg, border: `1px solid ${m.bdr}`, color: m.fg,
      whiteSpace: "nowrap",
    }}>
      {m.icon} {m.label}
    </span>
  );
}

// Word-wrap a string into lines of at most maxChars characters.
// Mirrors the demo wrapLabel function exactly.
function wrapLabel(s, maxChars) {
  const words = String(s || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    let rem = w;
    while (rem.length > maxChars) {
      if (cur) { lines.push(cur); cur = ""; }
      lines.push(rem.slice(0, maxChars));
      rem = rem.slice(maxChars);
    }
    if (!cur) {
      cur = rem;
    } else if ((cur + " " + rem).length <= maxChars) {
      cur += " " + rem;
    } else {
      lines.push(cur);
      cur = rem;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

// Compute pill geometry for a node label. Smaller, lighter pills (the major/minor
// distinction is carried by the per-node scale, not by a chunky base size).
function pillOf(label, count) {
  const txt = label + (count ? " (" + count + ")" : "");
  const MAX_CHARS = 16;
  const lines = wrapLabel(txt, MAX_CHARS);
  const longest = Math.max(1, ...lines.map(l => l.length));
  const LH = 13;
  return {
    lines,
    w: Math.max(54, longest * 6.2 + 22),
    h: Math.max(27, lines.length * LH + 11),
    lh: LH,
    fs: 11,
  };
}

// nodeImportance + impToScale now live in graphMetrics.js (shared with the neural view).

// Gentle curved spoke (a perpendicular bow) for the organic, neural-graph look.
function curvePath(a, b, bow) {
  if (!bow) return `M${a.x},${a.y} L${b.x},${b.y}`;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2 + (-dy / len) * bow;
  const cy = (a.y + b.y) / 2 + (dx / len) * bow;
  return `M${a.x},${a.y} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x},${b.y}`;
}

// ── Radial graph layout ───────────────────────────────────────────────────────
const CX = 500, CY = 300;
const RING_SINGLE = 200, RING_MAJOR = 158, RING_MINOR = 274;
const MAJOR_T = 0.7; // importance threshold that splits major (inner) vs minor (outer)

function layoutRadial(nodeMap, centreId, stack) {
  const centre = nodeMap[centreId] || {};
  const rawKids = (centre.children || []).filter(k => nodeMap[k]);
  const trail = stack.slice(0, -1);
  const order = [];
  const target = {};
  const scaleT = {};
  const parentOf = {};
  const impById = {};

  trail.forEach((id, i) => {
    target[id] = { x: 120 + i * 86, y: 44 };
    scaleT[id] = 0.5;
    impById[id] = 0.5;
    if (i > 0) parentOf[id] = trail[i - 1];
    order.push(id);
  });

  target[centreId] = { x: CX, y: CY };
  scaleT[centreId] = 1.24;
  impById[centreId] = 1.6;
  if (trail.length) parentOf[centreId] = trail[trail.length - 1];
  order.push(centreId);

  // rank children by importance (keeps original order index for stable jitter)
  const ranked = rawKids.map((k, i) => ({ k, i, imp: nodeImportance(nodeMap[k], nodeMap) }));
  ranked.forEach(o => { impById[o.k] = o.imp; });

  // place a set of children on a ring; angular span is weighted by importance so
  // major nodes get breathing room and minor nodes pack tighter (declutters).
  const placeRing = (arr, radius, angOffset) => {
    const weights = arr.map(o => 0.55 + o.imp);
    const tot = weights.reduce((s, w) => s + w, 0) || 1;
    let acc = 0;
    arr.forEach((o, idx) => {
      const w = weights[idx];
      const frac = (acc + w / 2) / tot;
      acc += w;
      const ang = frac * Math.PI * 2 - Math.PI / 2 + angOffset;
      const jitter = (((o.i * 41) % 17) - 8) * 1.4; // deterministic, organic wobble
      const r = radius + jitter + o.imp * 12;        // heavier nodes sit a touch further out
      target[o.k] = { x: CX + Math.cos(ang) * r, y: CY + Math.sin(ang) * r };
      scaleT[o.k] = impToScale(o.imp);
      parentOf[o.k] = centreId;
      order.push(o.k);
    });
  };

  if (ranked.length <= 8) {
    placeRing(ranked, RING_SINGLE, 0);
  } else {
    const major = ranked.filter(o => o.imp >= MAJOR_T);
    const minor = ranked.filter(o => o.imp < MAJOR_T);
    if (!major.length || !minor.length) {
      placeRing(ranked, RING_SINGLE, 0); // avoid an empty ring
    } else {
      placeRing(major, RING_MAJOR, 0);
      placeRing(minor, RING_MINOR, Math.PI / Math.max(1, minor.length)); // offset so minors sit between majors
    }
  }

  const edges = [];
  for (let i = 1; i < stack.length; i++) edges.push([stack[i - 1], stack[i]]);
  rawKids.forEach(k => edges.push([centreId, k]));

  return { order, target, scaleT, parentOf, edges, impById };
}

// ── Animated positions state machine ─────────────────────────────────────────
function useGraphAnim(target, scaleT, order, fromRef, parentOf) {
  const [pos, setPos] = useState({});
  const rafRef = useRef(null);

  useEffect(() => {
    const prev = fromRef.current || {};
    // Seed: existing nodes start from their last spot; brand-new children start
    // tiny at their parent's last position, so they grow OUT (the neural expand).
    const from = {};
    order.forEach(id => {
      if (prev[id]) { from[id] = prev[id]; return; }
      const par = parentOf && parentOf[id];
      const pf = par && prev[par];
      const t = target[id] || { x: CX, y: CY };
      from[id] = pf ? { x: pf.x, y: pf.y, s: 0.22 } : { x: t.x, y: t.y, s: 0.3 };
    });
    const t0 = Date.now();
    function animate() {
      const p = Math.min(1, (Date.now() - t0) / 440);
      const e = 1 - Math.pow(1 - p, 3);
      const next = {};
      order.forEach(id => {
        const f = from[id] || target[id] || { x: CX, y: CY, s: 0.3 };
        const t = target[id] || { x: CX, y: CY };
        const st = scaleT[id] != null ? scaleT[id] : 1;
        const fs = f.s != null ? f.s : st;
        next[id] = {
          x: f.x + (t.x - f.x) * e,
          y: f.y + (t.y - f.y) * e,
          s: fs + (st - fs) * e,
        };
      });
      setPos(next);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
      }
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, scaleT, order]);

  return pos;
}

// ── SVG radial graph inner component ─────────────────────────────────────────
function RadialSVG({ nodeMap, stack, onNodeTap, selectedId, ecotone, realmById, realms, withheld }) {
  const { order, target, scaleT, parentOf, edges, impById } = layoutRadial(
    nodeMap, stack[stack.length - 1] || "", stack
  );
  const fromRef = useRef({});
  const pos = useGraphAnim(target, scaleT, order, fromRef, parentOf);
  const stackSet = new Set(stack);

  // Save positions so next layout can pick up from them
  useEffect(() => {
    fromRef.current = pos;
  }, [pos]);

  // Pan + zoom state
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const panRef = useRef(null);
  const svgRef = useRef(null);

  const handlePointerDown = useCallback(e => {
    if (e.target.closest("[data-node]")) return;
    const f = 1000 / (svgRef.current ? svgRef.current.clientWidth || 1000 : 1000);
    panRef.current = { ox: e.clientX, oy: e.clientY, vx: view.x, vy: view.y, f };
    try { svgRef.current && svgRef.current.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
  }, [view]);

  const handlePointerMove = useCallback(e => {
    if (!panRef.current) return;
    const { ox, oy, vx, vy, f } = panRef.current;
    setView(v => ({ ...v, x: vx + (e.clientX - ox) * f, y: vy + (e.clientY - oy) * f }));
  }, []);

  const handlePointerUp = useCallback(() => { panRef.current = null; }, []);

  const handleWheel = useCallback(e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    setView(v => {
      const k2 = Math.max(0.4, Math.min(2.8, v.k * factor));
      const wx = (CX - v.x) / v.k;
      const wy = (CY - v.y) / v.k;
      return { k: k2, x: CX - wx * k2, y: CY - wy * k2 };
    });
  }, []);

  function zoomIn() {
    setView(v => {
      const k2 = Math.min(2.8, v.k * 1.2);
      const wx = (CX - v.x) / v.k;
      const wy = (CY - v.y) / v.k;
      return { k: k2, x: CX - wx * k2, y: CY - wy * k2 };
    });
  }
  function zoomOut() {
    setView(v => {
      const k2 = Math.max(0.4, v.k / 1.2);
      const wx = (CX - v.x) / v.k;
      const wy = (CY - v.y) / v.k;
      return { k: k2, x: CX - wx * k2, y: CY - wy * k2 };
    });
  }
  function resetView() {
    setView({ x: 0, y: 0, k: 1 });
  }

  const svgTransform = `translate(${view.x},${view.y}) scale(${view.k})`;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "8px 0 4px" }}>
        <span style={{ fontSize: "0.75rem", color: C.muted, flex: 1 }}>
          Centre = where you are - tap a bubble to dive in, tap trail to go back
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={zoomIn}
          style={{ minHeight: 44, minWidth: 44, padding: "6px 11px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 700, fontSize: "0.8125rem", color: C.text, boxShadow: NEO.raiseSm, cursor: "pointer" }}>
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={zoomOut}
          style={{ minHeight: 44, minWidth: 44, padding: "6px 11px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 700, fontSize: "0.8125rem", color: C.text, boxShadow: NEO.raiseSm, cursor: "pointer" }}>
          -
        </button>
        <button
          type="button"
          aria-label="Reset graph view to centre"
          onClick={resetView}
          style={{ minHeight: 44, padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 700, fontSize: "0.8125rem", color: C.text, boxShadow: NEO.raiseSm, cursor: "pointer" }}>
          Reset
        </button>
      </div>

      {/* SVG canvas */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 8, boxShadow: NEO.raise }}>
        <svg
          ref={svgRef}
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Career WikiGraph - radial ecosystem - one centre, tap a bubble to dive in"
          style={{ display: "block", width: "100%", height: "clamp(380px,60vh,580px)", touchAction: "none", cursor: "grab" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Amber glow for edge-species nodes (ecotone overlay) - non-colour cue is the halo itself */}
          <defs>
            <filter id="wikiEdgeGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#b45309" floodOpacity="0.75" />
            </filter>
          </defs>
          <g transform={svgTransform}>
            {/* Edges - curved spokes; major branches heavier + darker, minor faint */}
            {edges.map(([a, b], ei) => {
              const pa = pos[a], pb = pos[b];
              if (!pa || !pb) return null;
              const crosses = ecotone && realmById && realmById[a] && realmById[b] && realmById[a] !== realmById[b];
              const spoke = !(stackSet.has(a) && stackSet.has(b)); // trail edges stay straight
              const wgt = impById[b] != null ? impById[b] : 0.5;
              const baseW = 0.9 + wgt * 2.3;                       // ~1.1 (minor) .. ~3.3 (major)
              const sw = crosses ? Math.max(2.6, baseW) : baseW;
              const op = crosses ? 1 : (0.3 + wgt * 0.48);         // minor faint, major solid
              const bow = spoke ? ((ei % 2 ? 1 : -1) * Math.hypot(pb.x - pa.x, pb.y - pa.y) * 0.13) : 0;
              return (
                <path
                  key={a + ">" + b}
                  fill="none"
                  stroke={crosses ? "#b45309" : "#c3cedd"}
                  strokeWidth={sw.toFixed(2)}
                  strokeOpacity={op.toFixed(2)}
                  strokeLinecap="round"
                  strokeDasharray={crosses ? "6 4" : "none"}
                  d={curvePath(pa, pb, bow)}
                />
              );
            })}

            {/* Nodes */}
            {order.map(id => {
              const n = nodeMap[id];
              if (!n) return null;
              const p = pos[id];
              if (!p) return null;
              const col = clusterColour(n);
              const pill = pillOf(n.label || n.id || id, n.count);
              const isSel = id === selectedId;
              const sy = -((pill.lines.length - 1) * pill.lh) / 2;

              // Ecotone overlay: stroke encodes realm by BOTH colour and shape (solid / thick+glow / dashed)
              const rk = ecotone && realmById ? (realmById[id] || "internal") : null;
              const rt = rk ? REALM[rk] : null;
              const strokeCol = rt ? rt.c : (isSel ? col.text : col.stroke);
              const strokeW = rt ? rt.w : (isSel ? 3 : 1.6);
              const strokeDash = rt && rt.dash !== "none" ? rt.dash : undefined;
              const rectFilter = rt && rt.glow ? "url(#wikiEdgeGlow)" : undefined;

              return (
                <g
                  key={id}
                  data-node="1"
                  tabIndex={0}
                  role="button"
                  aria-label={(n.label || id) + " - " + (n.type || "node") + (rk ? " - realm: " + REALM[rk].label : "") + " - press Enter to select"}
                  aria-pressed={isSel}
                  transform={`translate(${p.x},${p.y}) scale(${p.s || 1})`}
                  style={{ cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); onNodeTap(id); }}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onNodeTap(id);
                    }
                  }}
                >
                  <rect
                    x={-pill.w / 2}
                    y={-pill.h / 2}
                    width={pill.w}
                    height={pill.h}
                    rx={Math.min(16, pill.h / 2)}
                    fill={col.fill}
                    stroke={strokeCol}
                    strokeWidth={strokeW}
                    strokeDasharray={strokeDash}
                    filter={rectFilter}
                  />
                  <text
                    textAnchor="middle"
                    fill={col.text}
                    fontSize={pill.fs}
                    fontWeight="700"
                    style={{ pointerEvents: "none" }}
                  >
                    {pill.lines.map((ln, li) => (
                      <tspan key={li} x={0} y={sy + li * pill.lh} dy="0.32em">
                        {ln}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend - cluster colours by default; realm legend when the ecotone overlay is on */}
      {ecotone ? (
        <div style={{ margin: "8px 2px 0", fontSize: "0.6875rem", color: C.textSub }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: C.text }}>Ecotone realm (edge = shape):</span>
            {["internal", "edge", "external"].map(k => {
              const r = REALM[k];
              const present = (realms || []).find(x => x.id === k);
              const isPresent = present ? present.present : false;
              return (
                <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, opacity: isPresent ? 1 : 0.45 }}>
                  <i style={{
                    width: 13, height: 13, borderRadius: 3, background: "#fff",
                    border: `${k === "edge" ? 3 : 2}px ${k === "external" ? "dashed" : "solid"} ${r.c}`,
                    boxShadow: k === "edge" ? `0 0 5px 1px ${r.c}` : "none",
                    display: "inline-block",
                  }} />
                  {r.label} <span style={{ color: C.muted }}>({r.cue}{isPresent ? "" : " - none here"})</span>
                </span>
              );
            })}
          </div>
          <p style={{ margin: "5px 0 0", color: C.muted, lineHeight: 1.5 }}>
            The <strong style={{ color: C.amber }}>edge (amber glow)</strong> is where internal meets external -
            richest value, least automatable. Amber dashed links cross the boundary.
          </p>
          {(withheld || []).length > 0 && (
            <p style={{ margin: "4px 0 0", color: C.muted, lineHeight: 1.5 }}>
              <strong style={{ color: C.text }}>Withheld (not invented):</strong> {(withheld || []).join("; ")}.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", margin: "8px 2px 0", fontSize: "0.6875rem", color: C.textSub }}>
          <span style={{ fontWeight: 700, color: C.text }}>Colour = cluster layer:</span>
          {Object.entries(CLUSTER_COLOUR).map(([k, col]) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <i style={{ width: 10, height: 10, borderRadius: 3, background: col.fill, border: `1px solid ${col.stroke}`, display: "inline-block" }} />
              {k}
            </span>
          ))}
          <span style={{ fontWeight: 700, color: C.text }}>Bigger bubble + heavier spoke = more central (role, occupations); smaller = supporting detail.</span>
        </div>
      )}

      {/* Provenance legend - what each source chip means (incl. the unverified fallback) */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", margin: "6px 2px 0", fontSize: "0.6875rem", color: C.textSub }}>
        <span style={{ fontWeight: 700, color: C.text }}>Source:</span>
        {Object.keys(PROV_META).map(k => <ProvChip key={k} kind={k} />)}
      </div>
    </div>
  );
}

// ── Selected node detail panel ────────────────────────────────────────────────
function NodeDetail({ node, nodeId, realm }) {
  if (!node) return null;
  const col = clusterColour(node);
  const prov = node.source || "unverified";
  const r = realm ? REALM[realm] : null;

  return (
    <div style={{ marginTop: 14, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, boxShadow: NEO.raiseSm }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: "0.6875rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderRadius: 999, padding: "3px 9px", background: col.fill, color: col.text }}>
          {node.type || node.cluster || "node"}
        </span>
        <ProvChip kind={prov} />
        {r && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.6875rem", fontWeight: 700, borderRadius: 999, padding: "2px 9px", background: "#fff", border: `2px ${realm === "external" ? "dashed" : "solid"} ${r.c}`, color: r.c, boxShadow: realm === "edge" ? `0 0 4px 0 ${r.c}` : "none" }}>
            Realm: {r.label}
          </span>
        )}
        {r && <ProvChip kind="derived" />}
        {node.level && (
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, borderRadius: 999, padding: "2px 8px", background: C.amberBg, border: `1px solid ${C.amberBdr}`, color: C.amber }}>
            AI exposure: {node.level}
          </span>
        )}
      </div>
      {realm === "edge" && (
        <div style={{ margin: "0 0 10px", padding: "9px 11px", borderRadius: 10, background: C.amberBg, border: `1px solid ${C.amberBdr}`, fontSize: "0.8125rem", color: C.text, lineHeight: 1.5 }}>
          <strong style={{ color: C.amber }}>Edge zone (ecotone).</strong> This sits where the organisation
          meets the outside world - the boundary where value and interaction are richest, and where work
          is least automatable. Candidate: stand here. Organisation: the edge of the core is where growth hides.
        </div>
      )}
      <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 800, color: C.text }}>
        {node.label || nodeId}
      </h3>
      {node.description && (
        <p style={{ margin: "0 0 8px", fontSize: "0.875rem", color: C.textSub, lineHeight: 1.55 }}>
          {node.description}
        </p>
      )}
      {node.confidence && (
        <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted }}>
          Confidence: {node.confidence}
        </p>
      )}
    </div>
  );
}

// OrgLensPlaceholder removed in PR4 - replaced by OrgJourney (real implementation)

// ── Main WikiGraphView export ─────────────────────────────────────────────────
// Props:
//   nodes    - array of KG node objects (from getKnowledgeGraph payload)
//   edges    - array of KG edge objects
//   title    - string, the searched role title
//   result   - the live v3 result object (App.jsx state); used by the Candidate lens
//   onBack   - function, called when user taps "New search"
//   embedded - bool, hides the in-view back button when mounted as a result-page tab
export default function WikiGraphView({ nodes = [], edges = [], title = "", result = null, onBack, embedded = false }) {
  // Lens state: "candidate" (default) | "organisation"
  const [lens, setLens] = useState("candidate");
  // Graph mode: "focus" (radial focus-browser) | "neural" (force-directed whole graph)
  const [graphMode, setGraphMode] = useState("focus");
  // Ecotone overlay state (off by default - the plain cluster view is the resting state)
  const [ecotone, setEcotone] = useState(false);
  // Deterministic realm map over the WHOLE graph (spec section 2.1) - derived tier
  const realmMap = useMemo(() => computeRealmMap(nodes, edges), [nodes, edges]);
  // Build an id-keyed map and attach children lists from edges
  const nodeMap = {};
  (nodes || []).forEach(n => {
    nodeMap[n.id] = { ...n, children: [] };
  });
  (edges || []).forEach(e => {
    if (nodeMap[e.source]) {
      if (!nodeMap[e.source].children.includes(e.target)) {
        nodeMap[e.source].children.push(e.target);
      }
    }
  });

  // Find the root: the node with type "role" or the first node
  const rootId = (nodes.find(n => n.type === "role") || nodes[0] || { id: "" }).id;

  const [stack, setStack] = useState(rootId ? [rootId] : []);
  const [selectedId, setSelectedId] = useState(rootId || null);

  // When rootId changes (e.g. new search result), reset stack
  useEffect(() => {
    if (rootId) {
      setStack([rootId]);
      setSelectedId(rootId);
    }
  }, [rootId]);

  function handleNodeTap(id) {
    setSelectedId(id);
    setStack(prev => {
      const idx = prev.indexOf(id);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, id];
    });
  }

  const centreId = stack[stack.length - 1] || rootId;
  const selectedNode = nodeMap[selectedId];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Back button (hidden when embedded as a result-page tab - the page has its own nav) */}
      {!embedded && (
      <button
        type="button"
        aria-label="Back to new search"
        onClick={onBack}
        style={{
          marginBottom: 12, background: "transparent", border: "none", padding: 0,
          fontSize: "0.8125rem", fontWeight: 700, color: C.accent, cursor: "pointer",
          minHeight: 44, display: "inline-flex", alignItems: "center",
        }}>
        {"<-"} New search
      </button>
      )}

      {/* Header */}
      <div style={{
        background: `linear-gradient(100deg,#0a2a5e,${C.eu})`,
        borderRadius: 14, padding: "16px 20px", marginBottom: 14,
        boxShadow: NEO.raise,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Career WikiGraph
            </p>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#fff", lineHeight: 1.25 }}>
              {title || "Role ecosystem"}
            </h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <ProvChip kind="computed" />
            <ProvChip kind="derived" />
          </div>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
          One centre, tap a bubble to dive in - the path shrinks into a trail at the top. Tap the trail to go back.
        </p>
      </div>

      {/* ── Lens toggle: Candidate / Organisation ── */}
      <div
        role="tablist"
        aria-label="Switch view lens"
        style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}
      >
        {[
          { key: "candidate",    label: "Candidate view",    desc: "Seven-step career journey wired to engine output" },
          { key: "organisation", label: "Organisation view", desc: "Value-stream perspective: value stream, capability map, future state" },
        ].map(function(opt) {
          const active = lens === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={opt.label + " - " + opt.desc}
              onClick={function() { setLens(opt.key); }}
              style={{
                minHeight: 44, padding: "8px 18px", borderRadius: 10,
                border: `2px solid ${active ? C.accent : C.border}`,
                background: active ? C.accentSoft : C.surface,
                color: active ? C.accent : C.textSub,
                fontWeight: active ? 800 : 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
                boxShadow: active ? NEO.raiseSm : "none",
                transition: "border-color 0.15s, background 0.15s",
              }}>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Lens content: Candidate journey (above graph) ── */}
      {lens === "candidate" && (
        <CandidateJourney result={result} title={title} />
      )}
      {lens === "organisation" && (
        <OrgJourney result={result} title={title} />
      )}

      {/* Graph section header + mode toggle + ecotone overlay toggle */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 8, marginTop: 4 }}>
        <p style={{ margin: 0, flex: 1, minWidth: 120, fontSize: "0.75rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Role ecosystem graph
        </p>
        {/* Focus (radial) vs Neural (force-directed) view toggle */}
        <div role="tablist" aria-label="Graph view mode" style={{ display: "inline-flex", borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: NEO.raiseSm }}>
          {[
            { key: "focus", label: "Focus", desc: "Radial - one centre, tap to dive in" },
            { key: "neural", label: "Neural", desc: "Force-directed - the whole web at once" },
          ].map(function(opt) {
            const active = graphMode === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={opt.label + " view - " + opt.desc}
                onClick={function() { setGraphMode(opt.key); }}
                style={{
                  minHeight: 44, padding: "8px 16px", border: "none",
                  background: active ? C.accentSoft : C.surface,
                  color: active ? C.accent : C.textSub,
                  fontWeight: active ? 800 : 600, fontSize: "0.8125rem", cursor: "pointer",
                }}>
                {opt.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={ecotone}
          aria-label={"Ecotone overlay - tint nodes by realm internal, edge, external - currently " + (ecotone ? "on" : "off")}
          onClick={function() { setEcotone(function(v) { return !v; }); }}
          style={{
            minHeight: 44, padding: "8px 16px", borderRadius: 10,
            border: `2px solid ${ecotone ? C.amber : C.border}`,
            background: ecotone ? C.amberBg : C.surface,
            color: ecotone ? C.amber : C.textSub,
            fontWeight: ecotone ? 800 : 600, fontSize: "0.8125rem",
            cursor: "pointer", boxShadow: ecotone ? NEO.raiseSm : "none",
            display: "inline-flex", alignItems: "center", gap: 7,
          }}>
          <span aria-hidden="true" style={{
            width: 12, height: 12, borderRadius: 3, background: "#fff",
            border: `3px solid ${C.amber}`,
            boxShadow: ecotone ? `0 0 5px 1px ${C.amber}` : "none", display: "inline-block",
          }} />
          Ecotone overlay {ecotone ? "on" : "off"}
        </button>
      </div>

      {/* Breadcrumb trail (focus mode only) */}
      {graphMode === "focus" && stack.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8, fontSize: "0.75rem", color: C.muted }}>
          <span style={{ fontWeight: 700 }}>Path:</span>
          {stack.map(function(id, i) {
            return (
              <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <span style={{ color: C.muted }}>/</span>}
                <button
                  type="button"
                  onClick={function() {
                    setStack(function(prev) { return prev.slice(0, i + 1); });
                    setSelectedId(id);
                  }}
                  style={{
                    background: "none", border: "none", color: C.accent, fontWeight: 700,
                    padding: "8px 8px", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem",
                    minHeight: 44,
                  }}>
                  {(nodeMap[id] && nodeMap[id].label) || id}
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Graph or empty state */}
      {nodes.length === 0 ? (
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: 32, textAlign: "center", boxShadow: NEO.raiseSm,
        }}>
          <p style={{ margin: 0, color: C.muted, fontSize: "0.875rem" }}>
            No graph data available for this role yet.
          </p>
          <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "0.75rem" }}>
            [UNVERIFIED: insufficient data to build the ecosystem]
          </p>
        </div>
      ) : graphMode === "neural" ? (
        <NeuralGraph
          nodes={nodes}
          edges={edges}
          selectedId={selectedId}
          onNodeTap={setSelectedId}
          ecotone={ecotone}
          realmById={realmMap.realm}
        />
      ) : (
        <RadialSVG
          nodeMap={nodeMap}
          stack={stack}
          onNodeTap={handleNodeTap}
          selectedId={selectedId}
          ecotone={ecotone}
          realmById={realmMap.realm}
          realms={realmMap.realms}
          withheld={realmMap.withheld}
        />
      )}

      {/* Selected node detail */}
      <NodeDetail node={selectedNode} nodeId={selectedId} realm={ecotone ? realmMap.realm[selectedId] : null} />

      {/* Footer - "AI-assisted; human decides" - mandatory per spec */}
      <footer style={{
        marginTop: 18, padding: "12px 14px", borderRadius: 12,
        background: "#f1f5f9", border: `1px solid ${C.border}`,
        fontSize: "0.75rem", color: C.textSub,
      }}>
        <strong style={{ color: C.text }}>AI-assisted; human decides.</strong>{" "}
        Source: computed from role data (ESCO / ISCO / MCF) -{" "}
        Confidence: shown per node -{" "}
        Time-window: current session.
        Node size + spoke weight = how central the item is (major branches heavier, minor lighter); colour = cluster layer. Links appear only where evidence exists.
      </footer>
    </div>
  );
}
