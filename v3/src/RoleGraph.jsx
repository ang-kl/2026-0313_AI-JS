// v3/src/RoleGraph.jsx -- ?view=graph
// TWO modes:
//   BAKED mode (default): a left->right MINDMAP for ONE MyCareersFuture posting, reading
//     the static graph-data.json baked by engine-data/build-graph-data.mjs.
//   KG mode (new, KG1): a cluster-lane knowledge-graph rendered when window.__kgPayload
//     is present (set by getKnowledgeGraph in App.jsx before navigating to ?view=graph).
//     Cluster lanes: Individual / Department / Organisation / Competition (only present ones).
//     Verb-labelled edges from the KG_VERBS closed set.
//
// Honesty contract (locked v3): no red/green; colour never carries meaning alone;
// provenance chip on every node; 44px targets; "AI-assisted; human decides" footer.
// No LLM: same payload => same graph. Graceful fallback to baked mode when no KG payload.
import { useState, useRef, useLayoutEffect, useEffect, useCallback } from "react";
import DATA from "./graph-data.json";

const P = {
  bg: "#f5f7fa", surface: "#ffffff", border: "#dde3ec", text: "#1a202c",
  textSub: "#4a5568", muted: "#6b7a8d", accent: "#1a56db", accentSoft: "#e8f0fe", dim: 0.3,
};
const PROV = {
  mcf:      { icon: "●", color: "#0f766e", bg: "#ecfeff", label: "from MCF" },
  computed: { icon: "✓", color: "#1e40af", bg: "#eef2ff", label: "computed" },
  inferred: { icon: "≈", color: "#b45309", bg: "#fffbeb", label: "inferred" },
  none:     { icon: "?",      color: "#64748b", bg: "#f1f5f9", label: "unverified" },
};
const BAND = {
  high:     { color: "#9a3412", bg: "#fff7ed", label: "high" },
  moderate: { color: "#b45309", bg: "#fffbeb", label: "moderate" },
  low:      { color: "#0e7490", bg: "#ecfeff", label: "low" },
};
const SIDE = { left: "#0f766e", right: "#1e40af" };

// KG node type palette -- blue/orange/cyan (no red/green)
const KG_TYPE_STYLE = {
  role:             { color: "#1e40af", bg: "#dbeafe", border: "#93c5fd", label: "Role" },
  duty:             { color: "#b45309", bg: "#fef3c7", border: "#fcd34d", label: "Duty" },
  skill:            { color: "#0e7490", bg: "#cffafe", border: "#67e8f9", label: "Skill" },
  occupation:       { color: "#5b21b6", bg: "#ede9fe", border: "#c4b5fd", label: "Occupation" },
  qualification:    { color: "#0f766e", bg: "#ecfeff", border: "#99f6e4", label: "Qualification" },
  organisation:     { color: "#1e40af", bg: "#eef2ff", border: "#a5b4fc", label: "Organisation" },
  "mirror-occupation": { color: "#b45309", bg: "#fff7ed", border: "#fed7aa", label: "Mirror role" },
};
// KG source -> PROV key mapping
const KG_SRC_PROV = { mcf: "mcf", esco: "computed", computed: "computed", derived: "inferred" };
// KG cluster lane colours (blue/orange/cyan -- no red/green)
const KG_CLUSTER_COLOR = {
  individual:   { color: "#0e7490", bg: "#ecfeff", border: "#67e8f9" },
  department:   { color: "#1e40af", bg: "#eef2ff", border: "#93c5fd" },
  organisation: { color: "#5b21b6", bg: "#ede9fe", border: "#c4b5fd" },
  competition:  { color: "#b45309", bg: "#fff7ed", border: "#fed7aa" },
  unscoped:     { color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" },
};

const fmtSalary = (a) => (a && a[0] != null ? `S$${a[0].toLocaleString()}-${a[1].toLocaleString()}/mo` : null);
const node = (id) => DATA.nodes.find((n) => n.id === id);

// Read the KG payload if present (set by getKnowledgeGraph before navigation)
function readKgPayload() {
  try {
    const raw = window.__kgPayload;
    if (raw && raw.version === "kg1" && Array.isArray(raw.nodes) && Array.isArray(raw.edges)) return raw;
  } catch (_) {}
  return null;
}

export default function RoleGraph() {
  const kgPayload = readKgPayload();
  if (kgPayload) return <KGGraph kg={kgPayload} />;
  return <BakedGraph />;
}

// ── Baked mode (byte-frozen, original mindmap) ──────────────────────────────
function BakedGraph() {
  const role = node("role");
  const eng = DATA.engine;
  const exp = eng?.ok ? eng.exposure : null;
  const occ = eng?.ok ? eng.occupation : null;
  const skills = DATA.nodes.filter((n) => n.col === "skill");
  const resps = DATA.nodes.filter((n) => n.col === "responsibility");

  const branches = [
    { id: "b-skills", side: "left", prov: "mcf", title: "Skills", sub: "as advertised", items: skills, expandable: true },
    { id: "b-resp", side: "left", prov: "mcf", title: "Responsibilities", sub: "as advertised", items: resps, expandable: true },
    { id: "b-exposure", side: "right", prov: "computed", title: "AI-Exposure", sub: exp ? `${exp.index}/100 - ${exp.band}` : "--", kind: "exposure", needsEng: true },
    { id: "b-occ", side: "right", prov: "computed", title: "Occupation", sub: occ ? `ISCO ${occ.isco.join("/")}` : "--", kind: "occupation", needsEng: true },
    { id: "b-chain", side: "right", prov: "computed", title: "How it's computed", sub: "SSOC->ISCO->SOC->AIOE", kind: "chain", needsEng: true },
    { id: "b-aiable", side: "right", prov: "none", title: "AI-able vs human", sub: "occupation-level only*", kind: "aiable" },
    { id: "b-mirror", side: "right", prov: "none", title: "Mirror roles", sub: "next*", kind: "mirror" },
  ].filter((b) => (b.needsEng ? eng?.ok : true));

  const [active, setActive] = useState(null);
  const [hover, setHover] = useState(null);
  const [open, setOpen] = useState({});
  const [wide, setWide] = useState(true);
  const [lines, setLines] = useState([]);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const stageRef = useRef(null);
  const hubRef = useRef(null);
  const cardEls = useRef({});
  const setCard = useCallback((id) => (el) => { if (el) cardEls.current[id] = el; else delete cardEls.current[id]; }, []);

  const focus = hover || active;

  useLayoutEffect(() => {
    const cont = stageRef.current, hub = hubRef.current;
    if (!cont || !hub) return;
    const cr = cont.getBoundingClientRect();
    setBox({ w: cont.clientWidth, h: cont.clientHeight });
    const hr = hub.getBoundingClientRect();
    const out = [];
    for (const b of branches) {
      const el = cardEls.current[b.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      let x1, y1, x2, y2;
      if (wide) {
        if (b.side === "left") { x1 = hr.left - cr.left; y1 = hr.top + hr.height / 2 - cr.top; x2 = r.right - cr.left; y2 = r.top + r.height / 2 - cr.top; }
        else { x1 = hr.right - cr.left; y1 = hr.top + hr.height / 2 - cr.top; x2 = r.left - cr.left; y2 = r.top + r.height / 2 - cr.top; }
      } else {
        x1 = hr.left + hr.width / 2 - cr.left; x2 = r.left + r.width / 2 - cr.left;
        if (b.side === "left") { y1 = hr.top - cr.top; y2 = r.bottom - cr.top; }
        else { y1 = hr.bottom - cr.top; y2 = r.top - cr.top; }
      }
      out.push({ id: b.id, side: b.side, x1, y1, x2, y2 });
    }
    setLines(out);
  }, [wide, open, focus, eng]);

  useEffect(() => {
    const onResize = () => { setWide(window.innerWidth >= 820); setOpen((o) => ({ ...o })); };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setActive(null); setHover(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const leftBr = branches.filter((b) => b.side === "left");
  const rightBr = branches.filter((b) => b.side === "right");
  const dimmed = (id) => focus && focus !== id && id !== "role";

  return (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.text, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif", padding: "clamp(12px,3vw,28px)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <Header role={role} />

        <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 2px 10px", gap: 8, flexWrap: "wrap" }}>
          <span style={chip(SIDE.left, "#ecfeff")}>Published job ad - from MCF</span>
          <span style={chip(SIDE.right, "#eef2ff")}>AI filter - computed</span>
        </div>

        <div ref={stageRef} style={{ position: "relative", display: wide ? "grid" : "flex", flexDirection: wide ? undefined : "column",
          gridTemplateColumns: wide ? "1fr minmax(180px, 220px) 1fr" : undefined, gap: wide ? "clamp(10px,2vw,26px)" : 12, alignItems: wide ? "center" : "stretch" }}>

          <svg width={box.w} height={box.h} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }} aria-hidden="true">
            {lines.map((l) => {
              const on = focus === l.id || focus === "role" || !focus;
              const lit = focus === l.id;
              const col = lit ? SIDE[l.side] : "#cfd8e6";
              let d;
              if (wide) { const dx = (l.x2 - l.x1) * 0.45; d = `M ${l.x1} ${l.y1} C ${l.x1 + dx} ${l.y1}, ${l.x2 - dx} ${l.y2}, ${l.x2} ${l.y2}`; }
              else { const dy = (l.y2 - l.y1) * 0.45; d = `M ${l.x1} ${l.y1} C ${l.x1} ${l.y1 + dy}, ${l.x2} ${l.y2 - dy}, ${l.x2} ${l.y2}`; }
              return <path key={l.id} d={d} fill="none" stroke={col} strokeWidth={lit ? 3 : 2} opacity={on ? 0.9 : 0.25} />;
            })}
          </svg>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: wide ? "flex-end" : "stretch", zIndex: 2, order: wide ? 0 : 0 }}>
            {leftBr.map((b) => (
              <GroupCard key={b.id} b={b} setEl={setCard(b.id)} side="left" dim={dimmed(b.id)} selected={active === b.id}
                openItems={!!open[b.id]} onToggle={() => setOpen((o) => ({ ...o, [b.id]: !o[b.id] }))}
                onSelect={() => setActive((a) => (a === b.id ? null : b.id))} onHover={(v) => setHover(v ? b.id : null)} />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", zIndex: 2 }}>
            <button ref={hubRef} onClick={() => { setActive(null); }} onMouseEnter={() => setHover("role")} onMouseLeave={() => setHover(null)}
              aria-label={`${role.label}. Central role. ${role.meta.employer}.`}
              style={{ cursor: "pointer", textAlign: "center", border: `2px solid ${P.accent}`, background: "#fff",
                borderRadius: 16, padding: "14px 16px", minWidth: 160, maxWidth: 260, boxShadow: "0 4px 16px rgba(26,86,219,.16)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0f766e" }}>MyCareersFuture role</div>
              <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, margin: "4px 0" }}>{role.label}</div>
              <div style={{ fontSize: 11.5, color: P.muted }}>{role.meta.employer}</div>
              {exp && <div style={{ marginTop: 8 }}><span style={chip(BAND[exp.band].color, BAND[exp.band].bg)}>AI-exposure {exp.index}/100 - {exp.band}</span></div>}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: wide ? "flex-start" : "stretch", zIndex: 2 }}>
            {rightBr.map((b) => (
              <GroupCard key={b.id} b={b} setEl={setCard(b.id)} side="right" dim={dimmed(b.id)} selected={active === b.id}
                eng={eng} openItems={!!open[b.id]} onToggle={() => setOpen((o) => ({ ...o, [b.id]: !o[b.id] }))}
                onSelect={() => setActive((a) => (a === b.id ? null : b.id))} onHover={(v) => setHover(v ? b.id : null)} />
            ))}
          </div>
        </div>

        {!eng?.ok && <Withheld eng={eng} />}
        <BakedFooter eng={eng} />
      </div>
    </div>
  );
}

// ── KG mode (KG1): cluster-lane knowledge-graph ──────────────────────────────
// Renders the buildKnowledgeGraph payload in cluster lanes with verb-labelled edges.
// Each node carries a Prov chip (mcf/computed/inferred). Edges are drawn as curved
// paths labelled with their verb (from KG_VERBS closed set). Tap a node to highlight
// its edges and dim the rest. No red/green; 44px targets; aria-labels on all nodes.
function KGGraph({ kg }) {
  const [traced, setTraced] = useState(null); // id of the tapped node
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 700);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setTraced(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const presentClusters = kg.clusters.filter((c) => c.present);
  // Group nodes by cluster
  const byCluster = {};
  presentClusters.forEach((c) => { byCluster[c.id] = []; });
  kg.nodes.forEach((n) => {
    const cid = n.cluster;
    if (byCluster[cid]) byCluster[cid].push(n);
    else if (byCluster["individual"]) byCluster["individual"].push(n); // unscoped -> individual
  });

  // Build adjacency for tap-to-trace
  const edgeSet = new Set();
  kg.edges.forEach((e) => { edgeSet.add(e.source + "|" + e.target); edgeSet.add(e.target + "|" + e.source); });
  const isConnected = (a, b) => edgeSet.has(a + "|" + b);
  const isHighlighted = (n) => !traced || n.id === traced || isConnected(traced, n.id);

  const handleNodeClick = (id) => setTraced((t) => (t === id ? null : id));

  return (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.text, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif", padding: "clamp(12px,3vw,28px)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>

        <header style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>Knowledge graph - wired structure of the role</div>
          <h1 style={{ fontSize: "clamp(17px,3vw,24px)", margin: "3px 0 2px", lineHeight: 1.15 }}>
            {kg.nodes.find((n) => n.type === "role")?.label || "Role"}
          </h1>
          <div style={{ fontSize: 12, color: P.muted }}>
            {kg.stats.nodes} nodes - {kg.stats.edges} edges - {kg.stats.clustersPresent} cluster lanes present - KG version {kg.version}
          </div>
        </header>

        {/* Prov legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {Object.entries(PROV).map(([k, v]) => (
            <span key={k} style={chip(v.color, v.bg)}>{v.icon} {v.label}</span>
          ))}
        </div>

        {/* Cluster lanes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {presentClusters.map((cl) => {
            const clNodes = byCluster[cl.id] || [];
            const cc = KG_CLUSTER_COLOR[cl.id] || KG_CLUSTER_COLOR.unscoped;
            return (
              <section key={cl.id} aria-label={`${cl.label} cluster`}
                style={{ border: `1px solid ${cc.border}`, borderRadius: 12, padding: "12px 14px", background: cc.bg }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: cc.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  {cl.label}
                </div>
                {clNodes.length === 0 && (
                  <div style={{ fontSize: 12, color: P.muted }}>No nodes in this cluster for this role.</div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {clNodes.map((n) => (
                    <KGNodeCard key={n.id} node={n} traced={traced} highlighted={isHighlighted(n)} onClick={handleNodeClick} wide={wide} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Edges panel: verb-labelled connections, filtered by tap-to-trace */}
        <KGEdgesPanel kg={kg} traced={traced} wide={wide} />

        {/* Withheld notice */}
        {kg.withheld && kg.withheld.length > 0 && (
          <div style={{ marginTop: 18, background: "#fff", border: `1px dashed ${PROV.none.color}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: PROV.none.color, marginBottom: 6 }}>
              ? Withheld (not faked)
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {kg.withheld.map((w, i) => (
                <li key={i} style={{ fontSize: 12.5, color: P.textSub, marginBottom: 4 }}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <KGFooter kg={kg} />
      </div>
    </div>
  );
}

function KGNodeCard({ node, traced, highlighted, onClick, wide }) {
  const st = KG_TYPE_STYLE[node.type] || KG_TYPE_STYLE.skill;
  const provKey = KG_SRC_PROV[node.source] || "none";
  const pv = PROV[provKey];
  const isTraced = traced === node.id;
  const handleClick = () => onClick(node.id);
  return (
    <button
      onClick={handleClick}
      aria-pressed={isTraced}
      aria-label={`${node.type}: ${node.label}. Source: ${pv.label}. Confidence: ${node.confidence || "unset"}. ${isTraced ? "Tap again to clear." : "Tap to trace connections."}`}
      style={{
        cursor: "pointer", border: `${isTraced ? 2 : 1}px solid ${isTraced ? st.color : st.border}`,
        borderRadius: 10, background: isTraced ? st.bg : P.surface, padding: "9px 12px",
        textAlign: "left", minHeight: 44, maxWidth: wide ? 320 : "100%",
        opacity: highlighted ? 1 : P.dim, transition: "opacity .15s, border-color .15s",
        boxShadow: isTraced ? `0 3px 12px ${st.color}33` : "0 1px 3px rgba(16,24,40,.06)",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span aria-hidden="true" style={{ fontSize: 10, fontWeight: 800, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 6, padding: "1px 6px" }}>{st.label}</span>
        <span aria-hidden="true" style={{ fontSize: 10, fontWeight: 700, color: pv.color, background: pv.bg, borderRadius: 6, padding: "1px 6px" }}>{pv.icon} {pv.label}</span>
        {node.confidence && <span aria-hidden="true" style={{ fontSize: 10, color: P.muted }}>{node.confidence}</span>}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: st.color, lineHeight: 1.4, overflowWrap: "anywhere" }}>{node.label}</div>
      {node.level && node.level !== "HUMAN" && (
        <div style={{ fontSize: 10, color: P.muted }}>AI level: {node.level}</div>
      )}
    </button>
  );
}

// Edge panel: shows the verb-labelled edges as a list.
function KGEdgesPanel({ kg, traced }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((v) => !v);

  const edges = traced
    ? kg.edges.filter((e) => e.source === traced || e.target === traced)
    : kg.edges;
  const nodeById = {};
  kg.nodes.forEach((n) => { nodeById[n.id] = n; });

  return (
    <div style={{ marginTop: 18, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, padding: "12px 14px" }}>
      <button
        onClick={toggle}
        aria-expanded={expanded}
        style={{ cursor: "pointer", border: "none", background: "transparent", padding: 0, textAlign: "left", minHeight: 44, display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: P.text }}>
          Verb-labelled edges {traced ? `(${edges.length} for selected node)` : `(${edges.length} total)`}
        </span>
        <span aria-hidden="true" style={{ color: P.muted, fontSize: 12 }}>{expanded ? "hide" : "show"}</span>
      </button>
      {expanded && (
        <div style={{ marginTop: 10 }}>
          {edges.length === 0 && <div style={{ fontSize: 12, color: P.muted }}>No edges to display.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {edges.map((e, i) => {
              const src = nodeById[e.source];
              const tgt = nodeById[e.target];
              const provKey = KG_SRC_PROV[e.source_tag] || "none";
              const pv = PROV[provKey];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: P.textSub, borderBottom: `1px solid ${P.border}`, paddingBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: P.text, maxWidth: 220, overflowWrap: "anywhere" }}>{src ? src.label : e.source}</span>
                  <span style={{ fontWeight: 800, color: "#1e40af", background: "#eef2ff", borderRadius: 6, padding: "1px 8px", whiteSpace: "nowrap" }}>{e.verb}</span>
                  <span style={{ fontWeight: 600, color: P.text, maxWidth: 220, overflowWrap: "anywhere" }}>{tgt ? tgt.label : e.target}</span>
                  <span aria-hidden="true" style={{ color: P.muted }}>w={e.weight}</span>
                  <span aria-hidden="true" style={{ fontSize: 10, color: pv.color, background: pv.bg, borderRadius: 4, padding: "1px 5px" }}>{pv.icon} {pv.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KGFooter({ kg }) {
  return (
    <footer style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${P.border}`, fontSize: 11.5, color: P.muted, lineHeight: 1.6 }}>
      <div>
        <b>Source:</b> duties from MCF posting (verbatim); skills from ESCO; occupation from ESCO/ISCO-08.
        <b> Confidence:</b> high = verified; medium = inferred from ESCO overlap; low = sparse evidence.
        <b> Time-window:</b> snapshot of the analysed posting.
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: P.muted }}>
        AI-assisted; human decides. Knowledge graph is computed deterministically from the MCF posting data - no LLM authoring any node, edge, verb, or cluster.
        Version: {kg.version}. Generated: {kg.generatedAt ? kg.generatedAt.slice(0, 10) : "unknown"}.
      </div>
      {kg.withheld && kg.withheld.length > 0 && (
        <div style={{ marginTop: 4 }}>Withheld: {kg.withheld.join("; ")}.</div>
      )}
    </footer>
  );
}

// ── Shared helpers (used by BakedGraph) ─────────────────────────────────────

function Header({ role }) {
  return (
    <header style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>Role x AI-exposure mindmap</div>
      <h1 style={{ fontSize: "clamp(19px,3.6vw,26px)", margin: "3px 0 2px", lineHeight: 1.15 }}>{role.label}</h1>
      <div style={{ color: P.textSub, fontSize: 13.5 }}>
        {role.meta.employer}
        {role.meta.seniority ? ` - ${role.meta.seniority}` : ""}
        {fmtSalary(role.meta.salary) ? ` - ${fmtSalary(role.meta.salary)}` : ""}
        {role.meta.ssoc ? ` - SSOC ${role.meta.ssoc}` : ""}
      </div>
    </header>
  );
}

function GroupCard({ b, setEl, side, dim, selected, openItems, onToggle, onSelect, onHover, eng }) {
  const pv = PROV[b.prov] || PROV.none;
  const align = side === "left" ? "right" : "left";
  const base = {
    width: "100%", maxWidth: 320, textAlign: align, background: P.surface,
    border: `${selected ? 2 : 1}px solid ${selected ? SIDE[side] : P.border}`, borderRadius: 12,
    boxShadow: selected ? `0 3px 12px ${SIDE[side]}22` : "0 1px 2px rgba(16,24,40,.05)",
    opacity: dim ? P.dim : 1, transition: "opacity .15s, border-color .15s",
  };
  const head = (
    <button onClick={onSelect} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)} onBlur={() => onHover(false)} aria-pressed={selected}
      aria-label={`${b.title}${b.items ? `, ${b.items.length} items` : ""}, ${pv.label}`}
      style={{ cursor: "pointer", width: "100%", border: "none", background: "transparent", padding: "11px 13px", textAlign: align, minHeight: 44, display: "flex",
        flexDirection: side === "left" ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
      <span aria-hidden="true" style={{ color: pv.color, fontWeight: 800, fontSize: 12 }}>{pv.icon}</span>
      <span style={{ fontWeight: 800, fontSize: 14 }}>{b.title}</span>
      {b.items && <span style={{ fontSize: 11, color: P.muted }}>({b.items.length})</span>}
      <span style={{ fontSize: 11, color: P.muted, marginLeft: side === "left" ? 0 : "auto", marginRight: side === "left" ? "auto" : 0 }}>{b.sub}</span>
    </button>
  );

  return (
    <div ref={setEl} style={base}>
      {head}
      <div style={{ padding: "0 13px 12px", textAlign: align }}>
        {b.items && (
          <>
            {b.kind !== "exposure" && (
              <button onClick={onToggle} aria-expanded={openItems} style={{ cursor: "pointer", border: `1px solid ${P.border}`, background: "#fff", color: P.textSub, borderRadius: 8, padding: "4px 9px", fontSize: 11.5, fontWeight: 700, minHeight: 32 }}>
                {openItems ? "hide" : `show ${b.items.length}`}
              </button>
            )}
            {openItems && (
              b.title === "Skills"
                ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: side === "left" ? "flex-end" : "flex-start", marginTop: 8 }}>
                    {b.items.map((n) => <span key={n.id} style={chip(SIDE.left, "#ecfeff")}>{n.label}</span>)}
                  </div>
                : <ul style={{ margin: "8px 0 0", paddingLeft: side === "left" ? 0 : 16, paddingRight: side === "left" ? 16 : 0, listStylePosition: "inside", fontSize: 12.5, color: P.textSub, lineHeight: 1.45 }}>
                    {b.items.map((n) => <li key={n.id} style={{ marginBottom: 4 }}>{n.label}</li>)}
                  </ul>
            )}
          </>
        )}

        {b.kind === "exposure" && eng?.ok && <ExposureBody exp={eng.exposure} occ={eng.occupation} />}
        {b.kind === "occupation" && eng?.ok && (
          <div style={{ fontSize: 12.5, color: P.textSub, lineHeight: 1.5 }}>
            <b>{eng.occupation.label}</b><br />
            <span style={{ color: P.muted }}>ISCO {eng.occupation.isco.join("/")} - computed, not from the ad text.</span>
          </div>
        )}
        {b.kind === "chain" && eng?.ok && (
          <div style={{ fontSize: 12, color: P.textSub, lineHeight: 1.5 }}>
            SSOC {eng.occupation.ssoc} - ISCO {eng.occupation.isco.join("/")} - SOC {eng.occupation.soc.join(", ")} - AIOE.<br />
            <span style={{ color: P.muted }}>AIOE z-mean {eng.exposure.zMean} (range {eng.exposure.zRange[0]}-{eng.exposure.zRange[1]}); percentile of 774 occupations.</span>
          </div>
        )}
        {b.kind === "aiable" && (
          <div style={{ fontSize: 12, color: P.textSub, lineHeight: 1.5 }}>
            <span style={{ color: PROV.none.color, fontWeight: 700 }}>occupation-level only.</span> Per-skill "survives AI vs automatable" is not computed -- AIOE has no per-skill source, so no skill gets a fake bar.
          </div>
        )}
        {b.kind === "mirror" && (
          <div style={{ fontSize: 12, color: P.textSub, lineHeight: 1.5 }}>
            <span style={{ color: PROV.none.color, fontWeight: 700 }}>coming next.</span> Other roles sharing this exposure (ESCO blend %) -- not yet computed; shown honestly as pending, not faked.
          </div>
        )}
      </div>
    </div>
  );
}

function ExposureBody({ exp, occ }) {
  const bd = BAND[exp.band] || BAND.moderate;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 30, fontWeight: 900, color: bd.color, lineHeight: 1 }}>{exp.index}<span style={{ fontSize: 14, color: P.muted }}>/100</span></span>
        <span style={chip(bd.color, bd.bg)}>{bd.label}</span>
      </div>
      <div style={{ height: 9, background: "#eef2f7", borderRadius: 6, overflow: "hidden", margin: "9px 0 7px" }} role="img" aria-label={`AI-Exposure ${exp.index} of 100, ${exp.band}`}>
        <div style={{ width: `${exp.index}%`, height: "100%", background: bd.color }} />
      </div>
      <div style={{ fontSize: 11.5, color: P.muted, lineHeight: 1.45 }}>
        AIOE z-mean {exp.zMean} (range {exp.zRange[0]}-{exp.zRange[1]}); percentile of 774 occupations. Confidence {exp.confidence}.
      </div>
    </div>
  );
}

function Withheld({ eng }) {
  return (
    <div style={{ marginTop: 14, background: "#fff", border: `1px dashed ${PROV.none.color}`, borderRadius: 12, padding: 14 }}>
      <b style={{ color: PROV.none.color }}>? AI-Exposure withheld</b>
      <div style={{ fontSize: 13, color: P.textSub, marginTop: 4 }}>{eng?.reason || "Could not compute from verified data."} -- not faked.</div>
    </div>
  );
}

function BakedFooter({ eng }) {
  const p = eng?.provenance;
  return (
    <footer style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${P.border}`, fontSize: 11.5, color: P.muted, lineHeight: 1.6 }}>
      <div><b>Computed (deterministic):</b> AIOE -- {p?.aioe?.citation || "Felten, Raj and Seamans 2021"}; SSOC/ISCO -- {p?.ssocIsco?.source || "SingStat"}; ISCO/SOC -- {p?.iscoSoc?.source || "U.S. BLS"}. No LLM: same posting, same numbers.</div>
      {DATA.role?.source_url && <div style={{ marginTop: 4 }}><a href={DATA.role.source_url} target="_blank" rel="noopener noreferrer" style={{ color: P.accent }}>View the posting on MyCareersFuture</a></div>}
    </footer>
  );
}

function chip(color, bg) {
  return { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color, background: bg, border: `1px solid ${color}33`, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" };
}
