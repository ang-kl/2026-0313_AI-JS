// NeuralGraph.jsx - the "neural" force-directed view of the WikiGraph (Obsidian-style).
// Dark-galaxy canvas, force simulation over the WHOLE graph at once. Readability levers
// taken from the Obsidian references the Human Lead shared:
//   - SIZE      = node importance (hubs bigger)
//   - BRIGHTNESS= importance (minor / supporting nodes are DIMMED; major named nodes pop)
//   - SHAPE     = node type (diamond = occupation, square = organisation, triangle =
//                 competitor role, big circle = the role hub, circle = skill/duty/qual)
//   - COLOUR    = cluster (vivid but colour-blind safe: blue/teal/purple/amber/slate)
// The Obsidian sample used RED for a category; the Human Lead is red-green colour-blind, so
// we carry the same "a little signal helps you read it" idea with SHAPE (a non-colour cue)
// plus safe hues - never red/green. Interactive: drag, pan, zoom, hover-to-highlight.
// Deterministic initial layout (phyllotaxis by index - no Math.random). aria + keyboard kept.
// R007: ASCII only in JSX strings. R006: no multi-line async arrow in JSX props.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { nodeImportance } from "./graphMetrics.js";

const W = 1000, H = 620, CX = W / 2, CY = H / 2;

// canonical undirected edge key
function ek(a, b) { return a < b ? a + "|" + b : b + "|" + a; }

// Force constants (module scope so the tick callback can stay stable).
const REP = 5200, LINK_K = 0.035, LINK_LEN = 86, CENTER = 0.016, DAMP = 0.85, COOL = 0.972;

// Vivid dot colours for the dark canvas - blue / teal / purple / amber / slate (no red/green).
const DOT = {
  individual:   "#60a5fa",
  department:   "#22d3ee",
  organisation: "#c084fc",
  competition:  "#fbbf24",
  theme:        "#34d399",
  unscoped:     "#94a3b8",
};
const REALM_DOT = { internal: "#60a5fa", edge: "#fbbf24", external: "#22d3ee" };

function dotColour(node, ecotone, realm) {
  if (ecotone && realm) return REALM_DOT[realm] || "#94a3b8";
  return DOT[node.cluster] || "#94a3b8";
}

// Shape family per type - the non-colour cue that carries the node category.
function shapeOf(type) {
  if (type === "role") return "hub";
  if (type === "theme") return "hexagon";
  if (type === "occupation" || type === "iscoOccupation") return "diamond";
  if (type === "organisation") return "square";
  if (type === "mirror-occupation") return "triangle";
  return "circle"; // skill / duty / qualification / fallback
}

const SHAPE_LABEL = {
  hub: "role (hub)", hexagon: "theme group", diamond: "occupation", square: "organisation",
  triangle: "competitor role", circle: "skill / duty / detail",
};

// A node glyph: shape by type, radius by importance. Rendered in node-local coords.
function NodeGlyph({ shape, r, fill, stroke, strokeWidth, opacity }) {
  const common = { fill, stroke, strokeWidth, opacity };
  if (shape === "square") {
    return <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={Math.max(2, r * 0.28)} {...common} />;
  }
  if (shape === "diamond") {
    return <rect x={-r} y={-r} width={2 * r} height={2 * r} transform="rotate(45)" rx={2} {...common} />;
  }
  if (shape === "triangle") {
    const a = r * 1.15;
    return <polygon points={`0,${-a} ${a * 0.87},${a * 0.5} ${-a * 0.87},${a * 0.5}`} {...common} />;
  }
  if (shape === "hexagon") {
    const a = r * 1.12;
    const pts = [];
    for (let i = 0; i < 6; i++) { const ang = Math.PI / 6 + i * Math.PI / 3; pts.push(`${(a * Math.cos(ang)).toFixed(1)},${(a * Math.sin(ang)).toFixed(1)}`); }
    return <polygon points={pts.join(" ")} {...common} />;
  }
  return <circle r={r} {...common} />; // hub + circle are both circles (hub is just larger via r)
}

// importance -> radius (px). minor ~4 .. major ~15, hub a touch larger.
function impRadius(imp, isHub) {
  const base = 4 + Math.max(0, Math.min(1.3, imp - 0.2)) * 8.5;
  return isHub ? base + 3 : base;
}
// importance -> brightness (opacity). minor dimmed, major full - the "dim the marginalia" idea.
function impOpacity(imp) {
  const t = Math.max(0, Math.min(1, (imp - 0.3) / 0.9));
  return 0.4 + t * 0.6; // 0.4 (dim minor) .. 1.0 (bright major)
}

export default function NeuralGraph({ nodes = [], edges = [], selectedId, onNodeTap, ecotone, realmById }) {
  // Stable signature so the sim only rebuilds when the graph actually changes.
  const sig = useMemo(
    () => (nodes || []).map(n => n.id).join("|") + "##" + (edges || []).length,
    [nodes, edges]
  );

  // id-keyed node map (with children for the importance hub bump)
  const nodeMap = useMemo(() => {
    const m = {};
    (nodes || []).forEach(n => { m[n.id] = { ...n, children: [] }; });
    (edges || []).forEach(e => {
      if (m[e.source] && !m[e.source].children.includes(e.target)) m[e.source].children.push(e.target);
    });
    return m;
  }, [nodes, edges]);

  const simRef = useRef({ nodes: [], links: [], alpha: 0, byId: {} });
  const [, setTick] = useState(0);
  const rafRef = useRef(null);
  const dragRef = useRef(null);
  const panRef = useRef(null);
  const svgRef = useRef(null);
  const [hoverId, setHoverId] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });

  // One stable physics tick; self-reschedules until the sim cools.
  const tick = useCallback(() => {
    const s = simRef.current, ns = s.nodes;
    if (s.alpha <= 0.02) { rafRef.current = null; return; }
    for (let i = 0; i < ns.length; i++) {
      const a = ns[i];
      for (let j = i + 1; j < ns.length; j++) {
        const b = ns[j];
        let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < 0.01) { dx = (i - j) || 1; dy = 1; d2 = 2; }
        const d = Math.sqrt(d2), f = (REP * s.alpha) / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    for (const l of s.links) {
      const dx = l.t.x - l.s.x, dy = l.t.y - l.s.y, d = Math.hypot(dx, dy) || 1;
      const f = (d - LINK_LEN) * LINK_K * s.alpha, fx = (dx / d) * f, fy = (dy / d) * f;
      l.s.vx += fx; l.s.vy += fy; l.t.vx -= fx; l.t.vy -= fy;
    }
    for (const a of ns) {
      a.vx += (CX - a.x) * CENTER * s.alpha; a.vy += (CY - a.y) * CENTER * s.alpha;
      if (a.fixed) { a.vx = 0; a.vy = 0; continue; }
      a.vx *= DAMP; a.vy *= DAMP; a.x += a.vx; a.y += a.vy;
    }
    s.alpha *= COOL;
    setTick(t => (t + 1) & 0xffff);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const ensureRunning = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // Build / rebuild the simulation when the graph changes.
  useEffect(() => {
    const list = (nodes || []).filter(n => n && n.id);
    const GOLDEN = 2.399963229;
    const simNodes = list.map((n, i) => {
      const imp = nodeImportance(nodeMap[n.id], nodeMap);
      const ang = i * GOLDEN, rad = 22 * Math.sqrt(i + 1);
      return {
        id: n.id, node: n, imp,
        x: CX + Math.cos(ang) * rad, y: CY + Math.sin(ang) * rad,
        vx: 0, vy: 0, fixed: false, r: impRadius(imp, n.type === "role"),
      };
    });
    const byId = {};
    simNodes.forEach(s => { byId[s.id] = s; });
    const links = (edges || [])
      .filter(e => e && byId[e.source] && byId[e.target])
      .map(e => ({ s: byId[e.source], t: byId[e.target] }));
    simRef.current = { nodes: simNodes, links, alpha: 1, byId };
    ensureRunning();
    return () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  // screen -> world coords
  const toWorld = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = (clientX - rect.left) / rect.width * W;
    const sy = (clientY - rect.top) / rect.height * H;
    return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k };
  }, [view]);

  const onPointerDownNode = useCallback((e, id) => {
    e.stopPropagation();
    const n = simRef.current.byId[id];
    if (!n) return;
    n.fixed = true;
    dragRef.current = { id };
    simRef.current.alpha = Math.max(simRef.current.alpha, 0.5);
    ensureRunning();
    try { svgRef.current && svgRef.current.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
  }, [ensureRunning]);

  const onPointerDownBg = useCallback(e => {
    if (e.target.closest("[data-node]")) return;
    panRef.current = { ox: e.clientX, oy: e.clientY, vx: view.x, vy: view.y };
    try { svgRef.current && svgRef.current.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
  }, [view]);

  const onPointerMove = useCallback(e => {
    if (dragRef.current) {
      const n = simRef.current.byId[dragRef.current.id];
      if (n) {
        const w = toWorld(e.clientX, e.clientY);
        n.x = w.x; n.y = w.y; n.vx = 0; n.vy = 0;
        simRef.current.alpha = Math.max(simRef.current.alpha, 0.35);
        ensureRunning();
      }
      return;
    }
    if (panRef.current) {
      const f = W / (svgRef.current ? svgRef.current.clientWidth || W : W);
      const { ox, oy, vx, vy } = panRef.current;
      setView(v => ({ ...v, x: vx + (e.clientX - ox) * f, y: vy + (e.clientY - oy) * f }));
    }
  }, [toWorld, ensureRunning]);

  const onPointerUp = useCallback(() => {
    if (dragRef.current) {
      const n = simRef.current.byId[dragRef.current.id];
      if (n) n.fixed = false; // release - let it settle back into the web
      dragRef.current = null;
    }
    panRef.current = null;
  }, []);

  const onWheel = useCallback(e => {
    if (e.preventDefault) e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    setView(v => {
      const k2 = Math.max(0.4, Math.min(3.2, v.k * factor));
      const wx = (CX - v.x) / v.k, wy = (CY - v.y) / v.k;
      return { k: k2, x: CX - wx * k2, y: CY - wy * k2 };
    });
  }, []);

  const sim = simRef.current;
  // adjacency straight from the edges prop (stable; not from the async-built sim)
  const neighbours = useMemo(() => {
    const map = {};
    (edges || []).forEach(e => {
      if (!e || e.source == null || e.target == null) return;
      (map[e.source] = map[e.source] || new Set()).add(e.target);
      (map[e.target] = map[e.target] || new Set()).add(e.source);
    });
    return map;
  }, [edges]);

  // Root = the role node (or first node) - the centre every path traces back to.
  const rootId = useMemo(() => {
    const r = (nodes || []).find(n => n && n.type === "role");
    return r ? r.id : (nodes && nodes[0] ? nodes[0].id : null);
  }, [nodes]);

  // Shortest path (BFS over the link graph) from the selected node back to the root.
  const pathInfo = useMemo(() => {
    if (!selectedId) return { nodeSet: new Set(), edgeSet: new Set(), order: [] };
    if (!rootId || selectedId === rootId) return { nodeSet: new Set([selectedId]), edgeSet: new Set(), order: [selectedId] };
    const prev = {}, seen = new Set([selectedId]), q = [selectedId];
    while (q.length) {
      const cur = q.shift();
      if (cur === rootId) break;
      const nb = neighbours[cur];
      if (!nb) continue;
      nb.forEach(n => { if (!seen.has(n)) { seen.add(n); prev[n] = cur; q.push(n); } });
    }
    if (!seen.has(rootId)) return { nodeSet: new Set([selectedId]), edgeSet: new Set(), order: [selectedId] };
    const order = [];
    let c = rootId;
    while (c != null) { order.push(c); if (c === selectedId) break; c = prev[c]; }
    const nodeSet = new Set(order), edgeSet = new Set();
    for (let i = 0; i < order.length - 1; i++) edgeSet.add(ek(order[i], order[i + 1]));
    return { nodeSet, edgeSet, order };
  }, [selectedId, rootId, neighbours]);

  // Hovering a DIFFERENT node previews its neighbours; hovering the selected node (e.g. the
  // cursor resting on it right after a click) must NOT hide that node's path-back.
  const activeHover = hoverId && hoverId !== selectedId ? hoverId : null;
  // Lit rules: a foreign hover -> that node + its neighbours; else a selection -> path back; else all.
  const isLit = id => {
    if (activeHover) return id === activeHover || (neighbours[activeHover] && neighbours[activeHover].has(id));
    if (selectedId && pathInfo.nodeSet.size) return pathInfo.nodeSet.has(id);
    return true;
  };
  const onPathEdge = (a, b) => selectedId && !activeHover && pathInfo.edgeSet.has(ek(a, b));
  const labelOf = id => { const s = sim.byId[id]; return (s && s.node && s.node.label) || id; };
  const focusId = hoverId || selectedId; // the actively focused node (for label + ring emphasis)
  const transform = `translate(${view.x},${view.y}) scale(${view.k})`;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "8px 0 4px" }}>
        <span style={{ fontSize: "0.75rem", color: "#5b6878", flex: 1, minWidth: 150 }}>
          The whole ecosystem at once - drag a node, scroll to zoom, hover to trace its links
        </span>
        <button type="button" aria-label="Zoom in" onClick={() => onWheel({ deltaY: -1 })} style={btn}>+</button>
        <button type="button" aria-label="Zoom out" onClick={() => onWheel({ deltaY: 1 })} style={btn}>-</button>
        <button type="button" aria-label="Reset graph view" onClick={() => setView({ x: 0, y: 0, k: 1 })} style={{ ...btn, minWidth: 0, padding: "6px 14px" }}>Reset</button>
      </div>

      {/* Dark-galaxy canvas */}
      <div style={{ background: "radial-gradient(ellipse at center, #0c1426 0%, #060912 75%)", border: "1px solid #1e293b", borderRadius: 16, padding: 6, boxShadow: "inset 0 1px 20px rgba(0,0,0,0.6)" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Career WikiGraph - neural view - the whole role ecosystem as a force-directed web; drag, zoom and hover to explore"
          style={{ display: "block", width: "100%", height: "clamp(400px,64vh,620px)", touchAction: "none", cursor: "grab" }}
          onPointerDown={onPointerDownBg}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <defs>
            <filter id="neuralBloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          <g transform={transform}>
            {/* Starfield bloom - a blurred glow halo behind every node, brighter for central ones */}
            <g filter="url(#neuralBloom)" style={{ pointerEvents: "none" }}>
              {(sim.nodes || []).map(s => {
                const realm = ecotone && realmById ? (realmById[s.id] || "internal") : null;
                const col = dotColour(s.node, ecotone, realm);
                const lit = isLit(s.id);
                const baseOp = impOpacity(s.imp);
                const go = (lit ? baseOp : baseOp * 0.3) * 0.6;
                return <circle key={"glow" + s.id} cx={s.x} cy={s.y} r={s.r * 1.8 + 4} fill={col} opacity={go} />;
              })}
            </g>
            {/* Links - path-back links glow bright cyan when a node is selected */}
            {(sim.links || []).map((l, i) => {
              const crosses = ecotone && realmById && realmById[l.s.id] && realmById[l.t.id] && realmById[l.s.id] !== realmById[l.t.id];
              const onPath = onPathEdge(l.s.id, l.t.id);
              const lit = isLit(l.s.id) && isLit(l.t.id);
              const stroke = onPath ? "#67e8f9" : (crosses ? "#fbbf24" : "#475569");
              const sw = onPath ? 2.6 : (crosses ? 1.8 : 1);
              const op = onPath ? 0.98 : (lit ? (crosses ? 0.95 : 0.5) : 0.1);
              return (
                <line
                  key={i}
                  x1={l.s.x} y1={l.s.y} x2={l.t.x} y2={l.t.y}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeOpacity={op}
                  strokeLinecap="round"
                  strokeDasharray={crosses && !onPath ? "5 4" : "none"}
                  filter={onPath ? "url(#neuralBloom)" : undefined}
                />
              );
            })}
            {/* a crisp overlay of the path links on top of the glow */}
            {selectedId && !activeHover && (sim.links || []).map((l, i) => (
              onPathEdge(l.s.id, l.t.id) ? (
                <line key={"p" + i} x1={l.s.x} y1={l.s.y} x2={l.t.x} y2={l.t.y}
                  stroke="#a5f3fc" strokeWidth="1.4" strokeOpacity="0.95" strokeLinecap="round" />
              ) : null
            ))}

            {/* Nodes */}
            {(sim.nodes || []).map(s => {
              const n = s.node;
              const realm = ecotone && realmById ? (realmById[s.id] || "internal") : null;
              const col = dotColour(n, ecotone, realm);
              const shape = shapeOf(n.type);
              const isSel = s.id === selectedId;
              const lit = isLit(s.id);
              const baseOp = impOpacity(s.imp);
              const op = lit ? baseOp : baseOp * 0.28;
              const major = s.imp >= 0.7;
              const showLabel = (major || s.id === focusId || isSel) && lit;
              const labelText = n.label || s.id;
              const glow = major || (realm === "edge");
              return (
                <g
                  key={s.id}
                  data-node="1"
                  tabIndex={0}
                  role="button"
                  aria-label={labelText + " - " + SHAPE_LABEL[shape] + (realm ? " - realm: " + realm : "") + " - press Enter to select"}
                  aria-pressed={isSel}
                  transform={`translate(${s.x},${s.y})`}
                  style={{ cursor: "pointer", outline: "none" }}
                  onPointerDown={e => onPointerDownNode(e, s.id)}
                  onClick={e => { e.stopPropagation(); onNodeTap && onNodeTap(s.id); }}
                  onPointerEnter={() => setHoverId(s.id)}
                  onPointerLeave={() => setHoverId(h => (h === s.id ? null : h))}
                  onFocus={() => setHoverId(s.id)}
                  onBlur={() => setHoverId(h => (h === s.id ? null : h))}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNodeTap && onNodeTap(s.id); } }}
                >
                  <NodeGlyph
                    shape={shape}
                    r={s.r}
                    fill={col}
                    stroke={isSel ? "#ffffff" : (s.id === focusId ? "#e2e8f0" : "#0b1120")}
                    strokeWidth={isSel ? 2.4 : 1.2}
                    opacity={op}
                  />
                  {/* bright inner core - the "star" centre */}
                  {(glow || lit) && (
                    <circle r={Math.max(1.5, s.r * 0.42)} fill="#f8fbff" opacity={op * (major ? 0.85 : 0.55)} style={{ pointerEvents: "none" }} />
                  )}
                  {showLabel && (
                    <text
                      x={0}
                      y={s.r + 11}
                      textAnchor="middle"
                      fill={lit ? "#cbd5e1" : "#64748b"}
                      fontSize={major ? 11 : 9.5}
                      fontWeight={major ? 700 : 600}
                      style={{ pointerEvents: "none" }}
                    >
                      {labelText.length > 26 ? labelText.slice(0, 25) + "..." : labelText}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Path back - the chain of links from the clicked node home to the role centre */}
      {selectedId && pathInfo.order.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", margin: "8px 2px 0", fontSize: "0.75rem", color: "#5b6878" }}>
          <span style={{ fontWeight: 700, color: "#0e7490" }}>Path back:</span>
          {pathInfo.order.map(function(id, i) {
            return (
              <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <span aria-hidden="true" style={{ color: "#94a3b8" }}>{"->"}</span>}
                <button
                  type="button"
                  onClick={function() { onNodeTap && onNodeTap(id); }}
                  aria-label={"Select " + labelOf(id)}
                  style={{
                    background: id === selectedId ? "#ecfeff" : "none",
                    border: id === selectedId ? "1px solid #a5f3fc" : "1px solid transparent",
                    color: "#0e7490", fontWeight: 700, padding: "5px 8px", borderRadius: 7,
                    cursor: "pointer", fontSize: "0.75rem", minHeight: 44,
                  }}>
                  {labelOf(id)}
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Legend - shape = type, size + brightness = importance, colour = cluster */}
      <div style={{ margin: "8px 2px 0", fontSize: "0.6875rem", color: "#4a5568" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "#1a202c" }}>Shape = type:</span>
          <ShapeKey shape="hub" label="role" />
          <ShapeKey shape="hexagon" label="theme" />
          <ShapeKey shape="diamond" label="occupation" />
          <ShapeKey shape="square" label="organisation" />
          <ShapeKey shape="triangle" label="competitor" />
          <ShapeKey shape="circle" label="skill / detail" />
        </div>
        <p style={{ margin: "5px 0 0", color: "#5b6878", lineHeight: 1.5 }}>
          <strong style={{ color: "#1a202c" }}>Bigger + brighter</strong> = more central; minor / supporting nodes are dimmed so the
          main structure reads. Colour = cluster layer. {ecotone ? "Ecotone on: colour + amber glow mark the realm." : "Hover a node to trace its links."}
        </p>
      </div>
    </div>
  );
}

const btn = {
  minHeight: 44, minWidth: 44, padding: "6px 11px", borderRadius: 8,
  border: "1px solid #e3e9f1", background: "#ffffff", fontWeight: 700,
  fontSize: "0.8125rem", color: "#1a202c",
  boxShadow: "4px 4px 9px rgba(174,189,212,0.5), -4px -4px 9px rgba(255,255,255,0.9)", cursor: "pointer",
};

// small legend swatch drawing the actual shape (non-colour type cue)
function ShapeKey({ shape, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true">
        <NodeGlyph shape={shape} r={shape === "hub" ? 6 : 5} fill="#64748b" stroke="#334155" strokeWidth={1} opacity={1} />
      </svg>
      {label}
    </span>
  );
}
