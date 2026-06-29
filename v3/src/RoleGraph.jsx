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
import { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from "react";
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
  high:     { color: "#c2410c", bg: "#fff7ed", label: "high" },
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
  // CO2: agent candidate node type (additive)
  agent:            { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc", label: "Agent candidate" },
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
  // CO2 tier lanes (additive -- blue/orange/cyan)
  functions:    { color: "#1e40af", bg: "#eef2ff", border: "#93c5fd" },
  duties:       { color: "#b45309", bg: "#fff7ed", border: "#fed7aa" },
  agents:       { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
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
  const live = readLivePosting();
  if (live) return <LiveGraph posting={live} />;
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

// ── Live mode (LIVE1): deterministic role graph from a handed-off posting ────
// The slim App stores the posting picked in step 2 under LIVE_GRAPH_KEY, then opens
// ?view=graph. LiveGraph reads it and runs the DETERMINISTIC ingest pipeline
// (ESCO occupation fingerprint -> SSOC 5-digit -> computeEngine occupation + AIOE).
// No LLM: same posting -> same graph. Renders the SAME 4-column mindmap grammar as
// BakedGraph (reusing Header/GroupCard/ExposureBody/Withheld) plus window controls
// (expand / float / close-to-puck). BakedGraph stays byte-frozen and untouched.
const LIVE_GRAPH_KEY = "tara_graph_role";

function readLivePosting() {
  try {
    const raw = sessionStorage.getItem(LIVE_GRAPH_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj && obj.title ? obj : null;
  } catch (_) { return null; }
}

async function postJsonRG(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { const e = new Error("HTTP " + res.status); e.status = res.status; throw e; }
  return res.json();
}

function stripHtmlRG(s) {
  const raw = String(s || "");
  if (!raw) return "";
  if (typeof DOMParser !== "undefined" && /<[^>]+>/.test(raw)) {
    try { return String(new DOMParser().parseFromString(raw, "text/html").body.textContent || raw).replace(/\s+/g, " ").trim(); } catch (_) {}
  }
  return raw.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

// Deterministic responsibility lines from posting text: split on bullets / newlines /
// sentence ends, keep substantive lines. No invention, no reordering of meaning.
function splitRespRG(text) {
  const raw = String(text || "");
  if (!raw) return [];
  const parts = raw
    .split(/\r?\n|•|·|‣|◦|•|;|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.replace(/^[\s\-–—*]+/, "").trim())
    .filter((s) => s.length >= 12 && s.length <= 240);
  const seen = new Set();
  const out = [];
  for (const p of parts) { const k = p.toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(p); }
  return out;
}

// Run the deterministic pipeline and assemble the DATA-shaped object the mindmap renders.
async function buildLiveGraphData(posting) {
  const title = String(posting.title || "").trim();
  const postingText = stripHtmlRG(posting.responsibilitiesText || posting.description || "");
  const skillTags = Array.isArray(posting.skills) ? posting.skills.filter(Boolean) : [];

  // 1. ESCO occupation fingerprint -> ISCO candidates (feeds the engine's reconcile)
  //    AND the ESCO essential-skill layer for the deep chain.
  let fingerprintIscos = null;
  let escoCandidates = [];
  try {
    const esco = await postJsonRG("/api/esco", { action: "occupationFingerprint", title, skillPhrases: skillTags });
    if (esco && Array.isArray(esco.candidates) && esco.candidates.length) {
      escoCandidates = esco.candidates;
      fingerprintIscos = esco.candidates.map((c) => ({ code: c.code, ratio: c.ratio })).filter((c) => c.code);
    }
  } catch (_) { /* fingerprint is optional evidence */ }

  // 2. SSOC 2024 occupation code + title by title (verbatim from the SSOC service).
  let ssoc = posting.ssoc || posting.ssocCode || null;
  let ssocTitle = null;
  if (!ssoc) {
    try {
      const s = await postJsonRG("/api/ssoc", { action: "search", query: title, limit: 8 });
      const results = Array.isArray(s.results) ? s.results : [];
      const lower = title.toLowerCase();
      const occ = results.find((r) => r.kind === "occupation" && String(r.title || "").toLowerCase() === lower)
        || results.find((r) => r.kind === "occupation" && (String(r.title || "").toLowerCase().includes(lower) || lower.includes(String(r.title || "").toLowerCase())))
        || results.find((r) => r.kind === "occupation") || null;
      if (occ) { ssoc = occ.code; ssocTitle = occ.title || null; }
    } catch (_) { /* SSOC optional; engine can still run on fingerprint */ }
  }

  // 3. Engine: occupation + AIOE exposure, deterministic. Withheld honestly on no evidence.
  let engine = { ok: false, reason: "No SSOC code or ESCO evidence resolved for this posting." };
  try {
    engine = await postJsonRG("/api/engine", { ssoc, title, skills: skillTags, fingerprintIscos });
  } catch (e) {
    engine = { ok: false, reason: e && e.status === 401 ? "login-required" : "engine unavailable", error: e && e.message };
  }

  const role = {
    id: "role", col: "role", label: title, status: "stated", prov: "mcf",
    meta: {
      employer: posting.employer || posting.hiringCompanyName || posting.postedCompanyName || "",
      salary: [posting.salaryMin ?? null, posting.salaryMax ?? null],
      seniority: (Array.isArray(posting.seniority) && posting.seniority[0]) || (Array.isArray(posting.positionLevels) && posting.positionLevels[0]) || posting.employmentType || null,
      ssoc: (engine.ok && engine.occupation && engine.occupation.ssoc) || ssoc || null,
      vacancies: posting.numberOfVacancies ?? null,
      categories: Array.isArray(posting.categories) ? posting.categories : [],
    },
  };
  const skills = skillTags.slice(0, 24).map((s, i) => ({ id: "sk" + i, col: "skill", label: String(s), status: "stated", prov: "mcf" }));
  const resps = splitRespRG(postingText).slice(0, 18).map((r, i) => ({ id: "re" + i, col: "responsibility", label: r, status: "stated", prov: "mcf" }));

  return {
    role, engine, nodes: [...skills, ...resps], resps, skills,
    ssoc: { code: ssoc || null, title: ssocTitle },
    esco: { candidates: escoCandidates },
    sourceUrl: posting.mcfUrl || posting.source_url || null,
  };
}

// Window-control bar: Expand (fullscreen) / Float (draggable) / Close (collapse to puck).
function LiveControls({ mode, onExpand, onFloat, onClose }) {
  const btn = { cursor: "pointer", minWidth: 36, minHeight: 36, border: `1px solid ${P.border}`, background: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 800, color: P.textSub, lineHeight: 1 };
  const on = { ...btn, background: P.accentSoft, borderColor: P.accent, color: P.accent };
  return (
    <div style={{ display: "inline-flex", gap: 6 }}>
      <button type="button" style={mode === "expanded" ? on : btn} aria-pressed={mode === "expanded"} aria-label="Expand graph to fullscreen" title="Expand" onClick={onExpand}>{String.fromCharCode(0x2922)}</button>
      <button type="button" style={mode === "float" ? on : btn} aria-pressed={mode === "float"} aria-label="Float graph as a movable panel" title="Float" onClick={onFloat}>{String.fromCharCode(0x25a2)}</button>
      <button type="button" style={btn} aria-label="Close graph to a small panel" title="Close" onClick={onClose}>{String.fromCharCode(0x00d7)}</button>
    </div>
  );
}

function LiveGraph({ posting }) {
  const [state, setState] = useState({ status: "loading", data: null, message: "Analysing posting: occupation, SSOC and AI-exposure..." });
  // mode: 'normal' (inline) | 'expanded' (fullscreen overlay) | 'float' (draggable) | 'min' (puck)
  const [mode, setMode] = useState("normal");
  const [view, setView] = useState("chain"); // 'chain' (deep MCF->SSOC->ISCO->ESCO->AIOE) | 'map' (hub mindmap)
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: null, message: "Analysing posting: occupation, SSOC and AI-exposure..." });
    buildLiveGraphData(posting)
      .then((data) => { if (!cancelled) setState({ status: "ready", data, message: "" }); })
      .catch((e) => { if (!cancelled) setState({ status: "error", data: null, message: (e && e.message) || "Could not build the graph." }); });
    return () => { cancelled = true; };
  }, [posting]);

  function onDragStart(e) {
    if (mode !== "float") return;
    const start = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y };
    dragRef.current = start;
    const move = (ev) => { const d = dragRef.current; if (!d) return; setPos({ x: d.x + (ev.clientX - d.mx), y: d.y + (ev.clientY - d.my) }); };
    const up = () => { dragRef.current = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function backToSearch() {
    try { sessionStorage.removeItem(LIVE_GRAPH_KEY); } catch (_) {}
    window.location.href = "/";
  }

  // Minimised puck: a small fixed control top-right that restores the graph.
  if (mode === "min") {
    return (
      <button type="button" onClick={() => setMode("normal")} aria-label="Reopen role graph"
        style={{ position: "fixed", top: 14, right: 14, zIndex: 1200, cursor: "pointer", border: `1px solid ${P.accent}`, background: "#fff", color: P.accent, borderRadius: 12, padding: "10px 14px", minHeight: 44, fontWeight: 800, boxShadow: "0 6px 20px rgba(26,86,219,.20)" }}>
        {String.fromCharCode(0x25c8)} Role graph
      </button>
    );
  }

  const floatStyle = mode === "float"
    ? { position: "fixed", top: 70, right: 18, width: "min(460px, 92vw)", maxHeight: "78vh", overflow: "auto", zIndex: 1100, transform: `translate(${pos.x}px, ${pos.y}px)`, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, boxShadow: "0 12px 40px rgba(16,24,40,.22)" }
    : mode === "expanded"
    ? { position: "fixed", inset: 0, overflow: "auto", zIndex: 1100, background: P.bg }
    : { minHeight: "100vh", background: P.bg };

  const barStyle = {
    position: mode === "float" ? "sticky" : "sticky", top: 0, zIndex: 5,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
    padding: "10px 14px", background: "rgba(255,255,255,.92)", borderBottom: `1px solid ${P.border}`,
    cursor: mode === "float" ? "grab" : "default", backdropFilter: "saturate(1.2) blur(4px)",
  };

  return (
    <div style={floatStyle}>
      <div style={barStyle} onPointerDown={onDragStart}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button type="button" onClick={backToSearch} aria-label="Back to search" title="Back to search"
            style={{ cursor: "pointer", minHeight: 36, border: `1px solid ${P.border}`, background: "#fff", color: P.textSub, borderRadius: 8, padding: "0 10px", fontWeight: 700, fontSize: 12.5 }}>
            {String.fromCharCode(0x2190)} Search
          </button>
          <span style={{ fontWeight: 800, fontSize: 13, color: P.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{posting.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div role="group" aria-label="Graph view" style={{ display: "inline-flex", border: `1px solid ${P.border}`, borderRadius: 8, overflow: "hidden" }}>
            {[["chain", "Chain"], ["map", "Map"]].map(([k, lbl]) => (
              <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}
                style={{ cursor: "pointer", minHeight: 36, padding: "0 12px", border: "none", borderRight: k === "chain" ? `1px solid ${P.border}` : "none", background: view === k ? P.accent : "#fff", color: view === k ? "#fff" : P.textSub, fontWeight: 800, fontSize: 12.5 }}>
                {lbl}
              </button>
            ))}
          </div>
          <LiveControls mode={mode} onExpand={() => setMode(mode === "expanded" ? "normal" : "expanded")} onFloat={() => { setMode(mode === "float" ? "normal" : "float"); setPos({ x: 0, y: 0 }); }} onClose={() => setMode("min")} />
        </div>
      </div>

      {state.status === "loading" && (
        <div style={{ padding: "28px 18px", color: P.muted, fontSize: 14 }} role="status">{state.message}</div>
      )}
      {state.status === "error" && (
        <div style={{ padding: "28px 18px", color: P.textSub, fontSize: 14 }} role="status">
          Could not build the role graph: {state.message}. The posting evidence may be thin, or the engine is unavailable.
        </div>
      )}
      {state.status === "ready" && state.data && (view === "chain"
        ? <ChainGraph data={state.data} />
        : <LiveMindmap data={state.data} compact={mode === "float"} />)}
    </div>
  );
}

// chainColumns: assemble the deterministic deep chain (the PR #23 structure) from the
// pipeline output. Columns: Responsibilities -> Role -> SSOC 2024 -> ISCO-08 (ILO) ->
// ESCO skills -> AI-exposure (AIOE). Every node is sourced; no LLM, no invented edges.
function chainColumns(data) {
  const eng = data.engine;
  const exp = eng && eng.ok ? eng.exposure : null;
  const occ = eng && eng.ok ? eng.occupation : null;
  const mirror = eng && Array.isArray(eng.mirrorRoles) ? eng.mirrorRoles : null;

  const respNodes = (data.resps || []).slice(0, 8).map((r, i) => ({ id: "c-resp" + i, label: r.label }));
  const roleNode = { id: "c-role", label: data.role.label, sub: data.role.meta.employer || null };
  const ssocCode = (data.ssoc && data.ssoc.code) || (occ && occ.ssoc) || null;
  const ssocNode = ssocCode ? { id: "c-ssoc", label: "SSOC " + ssocCode, sub: (data.ssoc && data.ssoc.title) || (occ && occ.label) || "SSOC 2024" } : null;
  const iscoNodes = (mirror && mirror.length)
    ? mirror.slice(0, 5).map((m, i) => ({ id: "c-isco" + i, label: m.title || ("ISCO " + m.isco), sub: "ISCO " + m.isco + (m.sharePct != null ? " - " + m.sharePct + "%" : "") }))
    : (occ ? occ.isco.slice(0, 5).map((c, i) => ({ id: "c-isco" + i, label: occ.label || ("ISCO " + c), sub: "ISCO " + c })) : []);
  const escoSeen = new Set(); const escoList = [];
  ((data.esco && data.esco.candidates) || []).forEach((c) => (c.matchedSkills || []).forEach((s) => { const k = String(s).toLowerCase(); if (!escoSeen.has(k)) { escoSeen.add(k); escoList.push(String(s)); } }));
  const escoNodes = escoList.slice(0, 12).map((s, i) => ({ id: "c-esco" + i, label: s }));
  const aioeNode = exp ? { id: "c-aioe", label: exp.index + "/100", sub: exp.band + " AI-exposure", band: exp.band } : null;

  const cols = [
    { key: "resp", title: "Job ad - responsibilities", prov: "mcf", nodes: respNodes },
    { key: "role", title: "Role", prov: "mcf", nodes: [roleNode] },
    { key: "ssoc", title: "SSOC 2024", prov: "computed", nodes: ssocNode ? [ssocNode] : [] },
    { key: "isco", title: "ISCO-08 (ILO)", prov: "computed", nodes: iscoNodes },
    { key: "esco", title: "ESCO skills", prov: "computed", nodes: escoNodes },
    { key: "aioe", title: "AI-exposure (AIOE)", prov: "computed", nodes: aioeNode ? [aioeNode] : [] },
  ].filter((c) => c.nodes.length);

  const edges = [];
  const afterRole = ssocNode ? "c-ssoc" : "c-role";
  const iscoAnchor = iscoNodes.length ? iscoNodes[0].id : afterRole;
  respNodes.forEach((n) => edges.push([n.id, "c-role"]));
  if (ssocNode) edges.push(["c-role", "c-ssoc"]);
  iscoNodes.forEach((n) => edges.push([afterRole, n.id]));
  escoNodes.forEach((n) => edges.push([iscoAnchor, n.id]));
  if (aioeNode) edges.push([iscoAnchor, "c-aioe"]);

  return { cols, edges };
}

function ChainGraph({ data }) {
  const built = useMemo(() => chainColumns(data), [data]);
  const cols = built.cols, edges = built.edges;
  const [traced, setTraced] = useState(null);
  const [lines, setLines] = useState([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [tick, setTick] = useState(0);
  const stageRef = useRef(null);
  const els = useRef({});
  const setEl = useCallback((id) => (el) => { if (el) els.current[id] = el; else delete els.current[id]; }, []);

  // adjacency for tap-to-trace
  const adj = useMemo(() => {
    const m = {};
    edges.forEach(([a, b]) => { (m[a] = m[a] || new Set()).add(b); (m[b] = m[b] || new Set()).add(a); });
    return m;
  }, [edges]);
  const lit = (id) => !traced || id === traced || (adj[traced] && adj[traced].has(id));

  useLayoutEffect(() => {
    const cont = stageRef.current; if (!cont) return;
    const cr = cont.getBoundingClientRect();
    setBox({ w: cont.scrollWidth, h: cont.scrollHeight });
    const out = [];
    edges.forEach(([a, b]) => {
      const ea = els.current[a], eb = els.current[b];
      if (!ea || !eb) return;
      const ra = ea.getBoundingClientRect(), rb = eb.getBoundingClientRect();
      out.push({
        id: a + ">" + b, a, b,
        x1: ra.right - cr.left + cont.scrollLeft, y1: ra.top + ra.height / 2 - cr.top + cont.scrollTop,
        x2: rb.left - cr.left + cont.scrollLeft, y2: rb.top + rb.height / 2 - cr.top + cont.scrollTop,
      });
    });
    setLines(out);
  }, [cols, edges, traced, tick]);

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setTraced(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const COLOR = { mcf: SIDE.left, computed: SIDE.right };
  return (
    <div style={{ color: P.text, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif", padding: "clamp(12px,3vw,26px)" }}>
      <div style={{ fontSize: 12.5, color: P.textSub, marginBottom: 12, lineHeight: 1.5 }}>
        Deterministic chain - <b>job ad</b> {String.fromCharCode(0x2192)} <b>role</b> {String.fromCharCode(0x2192)} <b>SSOC</b> {String.fromCharCode(0x2192)} <b>ISCO-08 (ILO)</b> {String.fromCharCode(0x2192)} <b>ESCO skills</b> {String.fromCharCode(0x2192)} <b>AI-exposure (AIOE)</b>. Tap a node to trace its links. No LLM.
      </div>
      <div ref={stageRef} style={{ position: "relative", display: "flex", gap: "clamp(28px,5vw,72px)", alignItems: "flex-start", overflowX: "auto", paddingBottom: 8 }}>
        <svg width={box.w} height={box.h} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "visible" }} aria-hidden="true">
          {lines.map((l) => {
            const on = !traced || l.a === traced || l.b === traced;
            const dx = (l.x2 - l.x1) * 0.45;
            const d = `M ${l.x1} ${l.y1} C ${l.x1 + dx} ${l.y1}, ${l.x2 - dx} ${l.y2}, ${l.x2} ${l.y2}`;
            return <path key={l.id} d={d} fill="none" stroke={on && traced ? P.accent : "#cfd8e6"} strokeWidth={on && traced ? 2.4 : 1.6} opacity={on ? 0.85 : 0.18} />;
          })}
        </svg>
        {cols.map((col) => (
          <div key={col.key} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 150, maxWidth: 210 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span aria-hidden="true" style={{ color: (PROV[col.prov] || PROV.none).color, fontWeight: 800, fontSize: 11 }}>{(PROV[col.prov] || PROV.none).icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: P.muted }}>{col.title}</span>
            </div>
            {col.nodes.map((n) => {
              const isAioe = col.key === "aioe";
              const bd = isAioe && n.band ? (BAND[n.band] || BAND.moderate) : null;
              const litNode = lit(n.id);
              return (
                <button key={n.id} ref={setEl(n.id)} type="button"
                  onClick={() => setTraced((t) => (t === n.id ? null : n.id))}
                  aria-pressed={traced === n.id}
                  aria-label={`${col.title}: ${n.label}${n.sub ? ". " + n.sub : ""}. Tap to trace links.`}
                  style={{
                    textAlign: "left", cursor: "pointer", borderRadius: 10, padding: "9px 11px", minHeight: 44,
                    border: `${traced === n.id ? 2 : 1}px solid ${traced === n.id ? COLOR[col.prov] : (bd ? bd.color : P.border)}`,
                    background: bd ? bd.bg : (col.key === "role" ? "#fff" : P.surface),
                    opacity: litNode ? 1 : P.dim, transition: "opacity .15s, border-color .15s",
                    boxShadow: traced === n.id ? `0 3px 12px ${COLOR[col.prov]}22` : "0 1px 2px rgba(16,24,40,.05)",
                  }}>
                  <span style={{ display: "block", fontWeight: isAioe ? 900 : 700, fontSize: isAioe ? 17 : 13, lineHeight: 1.25, color: bd ? bd.color : P.text }}>{n.label}</span>
                  {n.sub && <span style={{ display: "block", fontSize: 11, color: P.muted, marginTop: 3, lineHeight: 1.35 }}>{n.sub}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {!(data.engine && data.engine.ok) && <Withheld eng={data.engine} />}
      <footer style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${P.border}`, fontSize: 11.5, color: P.muted, lineHeight: 1.6 }}>
        <div><b>Computed (deterministic):</b> SSOC/ISCO - SingStat &amp; ILO; ESCO skills - EU ESCO occupationFingerprint; AIOE - Felten, Raj and Seamans 2021. No LLM: same posting, same chain. AI-assisted; human decides.</div>
        {data.sourceUrl && <div style={{ marginTop: 4 }}><a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: P.accent }}>View the source posting</a></div>}
      </footer>
    </div>
  );
}

// The 4-column mindmap stage for live data. Mirrors BakedGraph's grammar (which stays
// frozen) but reads a passed-in `data` object instead of the baked DATA import, and
// reuses the shared leaf components (Header, GroupCard, Withheld).
function LiveMindmap({ data, compact }) {
  const role = data.role;
  const eng = data.engine;
  const exp = eng && eng.ok ? eng.exposure : null;
  const occ = eng && eng.ok ? eng.occupation : null;
  const skills = data.nodes.filter((n) => n.col === "skill");
  const resps = data.nodes.filter((n) => n.col === "responsibility");

  const branches = [
    { id: "b-skills", side: "left", prov: "mcf", title: "Skills", sub: "as advertised", items: skills, expandable: true },
    { id: "b-resp", side: "left", prov: "mcf", title: "Responsibilities", sub: "as advertised", items: resps, expandable: true },
    { id: "b-exposure", side: "right", prov: "computed", title: "AI-Exposure", sub: exp ? `${exp.index}/100 - ${exp.band}` : "--", kind: "exposure", needsEng: true },
    { id: "b-occ", side: "right", prov: "computed", title: "Occupation", sub: occ ? `ISCO ${occ.isco.join("/")}` : "--", kind: "occupation", needsEng: true },
    { id: "b-chain", side: "right", prov: "computed", title: "How it's computed", sub: "SSOC->ISCO->SOC->AIOE", kind: "chain", needsEng: true },
    { id: "b-aiable", side: "right", prov: "none", title: "AI-able vs human", sub: "occupation-level only*", kind: "aiable" },
  ].filter((b) => (b.needsEng ? eng && eng.ok : true));

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
  const wideBreak = compact ? 100000 : 820; // float panel always stacks vertically

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
    const onResize = () => { setWide(window.innerWidth >= wideBreak); setOpen((o) => ({ ...o })); };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [wideBreak]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setActive(null); setHover(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const leftBr = branches.filter((b) => b.side === "left");
  const rightBr = branches.filter((b) => b.side === "right");
  const dimmed = (id) => focus && focus !== id && id !== "role";

  return (
    <div style={{ color: P.text, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif", padding: compact ? "10px 14px 18px" : "clamp(12px,3vw,28px)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <Header role={role} />

        <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 2px 10px", gap: 8, flexWrap: "wrap" }}>
          <span style={chip(SIDE.left, "#ecfeff")}>Published job ad - from the posting</span>
          <span style={chip(SIDE.right, "#eef2ff")}>AI filter - computed</span>
        </div>

        <div ref={stageRef} style={{ position: "relative", display: wide ? "grid" : "flex", flexDirection: wide ? undefined : "column",
          gridTemplateColumns: wide ? "1fr minmax(180px, 220px) 1fr" : undefined, gap: wide ? "clamp(10px,2vw,26px)" : 12, alignItems: wide ? "center" : "stretch" }}>

          <svg width={box.w} height={box.h} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }} aria-hidden="true">
            {lines.map((l) => {
              const onLine = focus === l.id || focus === "role" || !focus;
              const lit = focus === l.id;
              const col = lit ? SIDE[l.side] : "#cfd8e6";
              let d;
              if (wide) { const dx = (l.x2 - l.x1) * 0.45; d = `M ${l.x1} ${l.y1} C ${l.x1 + dx} ${l.y1}, ${l.x2 - dx} ${l.y2}, ${l.x2} ${l.y2}`; }
              else { const dy = (l.y2 - l.y1) * 0.45; d = `M ${l.x1} ${l.y1} C ${l.x1} ${l.y1 + dy}, ${l.x2} ${l.y2 - dy}, ${l.x2} ${l.y2}`; }
              return <path key={l.id} d={d} fill="none" stroke={col} strokeWidth={lit ? 3 : 2} opacity={onLine ? 0.9 : 0.25} />;
            })}
          </svg>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: wide ? "flex-end" : "stretch", zIndex: 2 }}>
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
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0f766e" }}>Live role</div>
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

        {!(eng && eng.ok) && <Withheld eng={eng} />}
        <footer style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${P.border}`, fontSize: 11.5, color: P.muted, lineHeight: 1.6 }}>
          <div><b>Computed (deterministic):</b> AIOE - Felten, Raj and Seamans 2021; SSOC/ISCO - SingStat; ISCO/SOC - U.S. BLS. No LLM: same posting, same numbers. AI-assisted; human decides.</div>
          {data.sourceUrl && <div style={{ marginTop: 4 }}><a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: P.accent }}>View the source posting</a></div>}
        </footer>
      </div>
    </div>
  );
}

// ── CO2.2 zoom / LOD / workflow consts (R005-greppable) ─────────────────────
// Pan/zoom interaction model: one viewport transform on a single parent wrapping
// both the SVG edge layer and the node-button layer so they stay registered.
// (Single-parent-transform pattern: never apply the same transform to two sibling
// layers independently -- rounding + reflow desync them. Proposed as R012 to the
// Human Lead; not adopted as a numbered rule until confirmed.)
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.2;
const ZOOM_WHEEL_K = 0.12;

// LOD_BANDS: { lo, hi } inclusive ranges -> band 0/1/2.
const LOD_BANDS = [
  { band: 0, loInclusive: ZOOM_MIN, hiExclusive: 0.9 },  // L0 overview: hubs only
  { band: 1, loInclusive: 0.9,      hiExclusive: 1.6 },  // L1 structure: +duties
  { band: 2, loInclusive: 1.6,      hiExclusive: ZOOM_MAX + 0.001 }, // L2 detail: all
];
// _lodBand(z): pure z -> 0|1|2 band selector.
function _lodBand(z) {
  if (z < 0.9) return 0;
  if (z < 1.6) return 1;
  return 2;
}

// LOD_NODE_CEILING: if kg.nodes.length > ceiling, open at L0; else open at L1.
const LOD_NODE_CEILING = 60;

// KG_TIER_OF_CLUSTER: CO2 cluster -> LOD tier (0=hub, 1=mid, 2=leaf).
// CO2 agents map to tier 0 (hub) on the LOD axis (headline candidates).
// _workflowLayout uses _workflowColumn instead for left-to-right column order.
const KG_TIER_OF_CLUSTER = {
  functions: 0, agents: 0, duties: 1,
  individual: 0, department: 0, organisation: 0, competition: 1, unscoped: 1,
};
// _nodeTier(n): maps a node to 0|1|2 for LOD eligibility.
function _nodeTier(n) {
  if (n.cluster != null && KG_TIER_OF_CLUSTER[n.cluster] != null) {
    return KG_TIER_OF_CLUSTER[n.cluster];
  }
  // role-KG type fallback
  if (n.type === "role" || n.type === "occupation" || n.type === "organisation") return 0;
  if (n.type === "duty") return 1;
  return 2; // skill, qualification, mirror-occupation -> leaf
}

// Workflow layout column assignment (separate from LOD tier):
// functions(0) | duties(1) | agents(2).
const WORKFLOW_COL_OF_CLUSTER = {
  functions: 0, duties: 1, agents: 2,
  individual: 0, department: 0, organisation: 0, competition: 1, unscoped: 1,
};
function _workflowColumn(n) {
  if (n.cluster != null && WORKFLOW_COL_OF_CLUSTER[n.cluster] != null) {
    return WORKFLOW_COL_OF_CLUSTER[n.cluster];
  }
  return _nodeTier(n); // role-KG fallback: tier == column
}

// Workflow layout spacing consts (R005-greppable).
const WORKFLOW_COL_GAP = 300; // px between column centres
const WORKFLOW_ROW_GAP = 80;  // px between row centres

// _workflowLayout(nodes, edges, width, height): deterministic tier->column DAG.
// Pure function; no Math.random; no Date/performance read.
// Presentation-only; coords excluded from R-SNAPSHOT comparisons.
function _workflowLayout(nodes, edges, width, height) {
  if (!nodes || nodes.length === 0) return {};

  // Assign column per node.
  const colOf = {};
  nodes.forEach(function(n) { colOf[n.id] = _workflowColumn(n); });
  const colCount = Math.max(1, Math.max.apply(null, Object.values(colOf)) + 1);

  // Column X centre: evenly spaced, capped to width.
  const effectiveGap = Math.min(WORKFLOW_COL_GAP, width / colCount);
  function colX(c) { return effectiveGap * (c + 0.5); }

  // Build adjacency (out-degree) and incoming-edge weight maps for ranking.
  const outDegree = {};
  const inWeightMax = {};
  nodes.forEach(function(n) { outDegree[n.id] = 0; inWeightMax[n.id] = 0; });
  edges.forEach(function(e) {
    if (outDegree[e.source] != null) outDegree[e.source]++;
    if (inWeightMax[e.target] != null) {
      const w = typeof e.weight === "number" ? e.weight : 0;
      if (w > inWeightMax[e.target]) inWeightMax[e.target] = w;
    }
  });

  // Within each column: primary rank = inWeightMax (recurrence/score) then outDegree,
  // both descending; tie-break = id.localeCompare (ascending, total order, no Math.random).
  function rankKey(n) {
    // Higher rank values -> earlier in column (sorted desc).
    const w = inWeightMax[n.id] || 0;
    const d = outDegree[n.id] || 0;
    return { w, d, id: n.id };
  }

  const byCol = {};
  for (let c = 0; c < colCount; c++) byCol[c] = [];
  nodes.forEach(function(n) { byCol[colOf[n.id]].push(n); });

  const pos = {};
  for (let c = 0; c < colCount; c++) {
    const col = byCol[c].slice().sort(function(a, b) {
      const ra = rankKey(a), rb = rankKey(b);
      if (rb.w !== ra.w) return rb.w - ra.w;        // inWeight desc
      if (rb.d !== ra.d) return rb.d - ra.d;        // outDegree desc
      return ra.id.localeCompare(rb.id);             // id asc tie-break
    });
    const cx = colX(c);
    const effectiveRowGap = Math.min(WORKFLOW_ROW_GAP, height / Math.max(1, col.length));
    col.forEach(function(n, r) {
      pos[n.id] = { x: cx, y: effectiveRowGap * (r + 0.5) };
    });
  }
  return pos;
}

// ── Force layout helpers (CO2, deterministic, no Math.random) ─────────────────
// Fixed-seed, capped-iteration spring simulation. Positions are computed once
// from deterministic initial positions; layout is presentation only and excluded
// from R-SNAPSHOT comparisons.
function _forceLayout(nodes, edges, width, height) {
  const n = nodes.length;
  if (n === 0) return {};
  // Deterministic initial positions: place nodes in a grid ordered by id string.
  const sorted = nodes.slice().sort((a, b) => a.id.localeCompare(b.id));
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const cellW = width / cols;
  const cellH = height / Math.max(1, Math.ceil(n / cols));
  const pos = {};
  sorted.forEach((nd, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    pos[nd.id] = { x: cellW * (col + 0.5), y: cellH * (row + 0.5), vx: 0, vy: 0 };
  });
  // Build adjacency map for spring forces.
  const adj = {};
  nodes.forEach(nd => { adj[nd.id] = []; });
  edges.forEach(e => {
    if (pos[e.source] && pos[e.target]) {
      adj[e.source].push(e.target);
      adj[e.target].push(e.source);
    }
  });
  const SPRING_LEN = Math.min(cellW, cellH) * 1.4;
  const SPRING_K = 0.04;
  const REPEL_K = SPRING_LEN * SPRING_LEN * 0.6;
  const DAMPING = 0.85;
  const ITER = 120;
  const ids = Object.keys(pos);
  for (let iter = 0; iter < ITER; iter++) {
    const fx = {}, fy = {};
    ids.forEach(id => { fx[id] = 0; fy[id] = 0; });
    // Repulsion between all pairs.
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos[ids[i]], b = pos[ids[j]];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = REPEL_K / (dist * dist);
        const nx = (dx / dist) * f, ny = (dy / dist) * f;
        fx[ids[i]] += nx; fy[ids[i]] += ny;
        fx[ids[j]] -= nx; fy[ids[j]] -= ny;
      }
    }
    // Spring attraction along edges.
    edges.forEach(e => {
      if (!pos[e.source] || !pos[e.target]) return;
      const a = pos[e.source], b = pos[e.target];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = SPRING_K * (dist - SPRING_LEN);
      const nx = (dx / dist) * f, ny = (dy / dist) * f;
      fx[e.source] += nx; fy[e.source] += ny;
      fx[e.target] -= nx; fy[e.target] -= ny;
    });
    // Integrate.
    ids.forEach(id => {
      const p = pos[id];
      p.vx = (p.vx + fx[id]) * DAMPING;
      p.vy = (p.vy + fy[id]) * DAMPING;
      p.x = Math.max(40, Math.min(width - 40, p.x + p.vx));
      p.y = Math.max(40, Math.min(height - 40, p.y + p.vy));
    });
  }
  return pos;
}

// ── KG mode (KG1): cluster-lane knowledge-graph ──────────────────────────────
// Renders the buildKnowledgeGraph payload in cluster lanes with verb-labelled edges.
// Each node carries a Prov chip (mcf/computed/inferred). Edges are drawn as curved
// paths labelled with their verb (from KG_VERBS closed set). Tap a node to highlight
// its edges and dim the rest. No red/green; 44px targets; aria-labels on all nodes.
// CO2 additive props:
//   onNodeTap(id) - optional; called when a node is tapped (default noop).
//                   Existing tap-to-trace (traced) is untouched.
//   layout        - optional; "lanes" (default), "force" (neural/spring), or "workflow"
//                   (deterministic left-to-right DAG). Back-compatible: omitting layout
//                   defaults to "lanes". The lanes view is the a11y/keyboard path.
export function KGGraph({ kg, onNodeTap, layout, embedded }) {
  const effectiveLayout = layout === "force" ? "force" : layout === "workflow" ? "workflow" : "lanes";
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

  // CO2: wire onNodeTap alongside the existing tap-to-trace. The traced highlight
  // logic is untouched; onNodeTap is an additional notification to the host.
  const tapCallback = typeof onNodeTap === "function" ? onNodeTap : function() {};
  function handleNodeClick(id) {
    setTraced(function(t) { return t === id ? null : id; });
    tapCallback(id);
  }
  const hasEdges = Array.isArray(kg.edges) && kg.edges.length > 0;

  return (
    <div style={{ minHeight: embedded ? "auto" : "100vh", background: embedded ? "transparent" : P.bg, color: P.text, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif", padding: embedded ? 0 : "clamp(12px,3vw,28px)" }}>
      <div style={{ maxWidth: embedded ? "none" : 1240, margin: "0 auto" }}>

        <header style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>{hasEdges ? "Knowledge graph - wired structure of the role" : "Knowledge graph - grouped role map"}</div>
          <h1 style={{ fontSize: "clamp(17px,3vw,24px)", margin: "3px 0 2px", lineHeight: 1.15 }}>
            {kg.nodes.find((n) => n.type === "role")?.label || "Role"}
          </h1>
          <div style={{ fontSize: 12, color: P.muted }}>
            {kg.stats.nodes} nodes - {kg.stats.edges} edges - {kg.stats.clustersPresent} cluster lanes present - KG version {kg.version}
          </div>
          {!hasEdges && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px", lineHeight: 1.45 }}>
              No relationships could be wired from this role's data yet - showing the grouped nodes only. Wiring appears once the role resolves duties (responsibilities) alongside its skills.
            </div>
          )}
        </header>

        {/* Prov legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {Object.entries(PROV).map(([k, v]) => (
            <span key={k} style={chip(v.color, v.bg)}>{v.icon} {v.label}</span>
          ))}
        </div>

        {/* CO2.2: force (neural) view with pan/zoom + LOD */}
        {effectiveLayout === "force" && (
          <KGForceView kg={kg} traced={traced} onNodeClick={handleNodeClick} isHighlighted={isHighlighted} wide={wide} />
        )}

        {/* CO2.2: workflow (streamline) view */}
        {effectiveLayout === "workflow" && (
          <KGWorkflowView kg={kg} traced={traced} onNodeClick={handleNodeClick} isHighlighted={isHighlighted} wide={wide} />
        )}

        {/* Cluster lanes (default + a11y path) */}
        {effectiveLayout === "lanes" && (
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
        )}

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

// CO2.2: shared pan/zoom + LOD viewport hook.
// Returns { zoom, panX, panY, band, containerRef, viewportHandlers, resetFit, zoomIn, zoomOut }
// initialBand computed from node count (LOD_NODE_CEILING).
function _useViewport(nodeCount) {
  const initialZoom = nodeCount > LOD_NODE_CEILING ? 0.7 : 1.0; // L0 or L1 opening
  const [vp, setVp] = useState({ zoom: initialZoom, panX: 0, panY: 0 });
  const band = _lodBand(vp.zoom);
  const containerRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, startPanX, startPanY, moved }
  const pinchRef = useRef(null); // { dist, zoom }

  // Reduced-motion: zero transition duration when preferred.
  const prefersReduced = typeof window !== "undefined" && window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transDur = prefersReduced ? "0s" : "0.18s";

  function clampZoom(z) { return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)); }

  // R006: named handler functions (no multi-line async arrow in JSX props).
  function handleWheel(e) {
    if (!containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setVp(function(prev) {
      const factor = 1 + Math.sign(-e.deltaY) * ZOOM_WHEEL_K;
      const nextZoom = clampZoom(prev.zoom * factor);
      const scale = nextZoom / prev.zoom;
      // Keep the cursor point fixed: adjust pan so (cx,cy) in viewport coords stays.
      return {
        zoom: nextZoom,
        panX: cx - scale * (cx - prev.panX),
        panY: cy - scale * (cy - prev.panY),
      };
    });
  }

  function handlePointerDown(e) {
    if (e.touches || e.button !== 0) return; // pointer events only for mouse
    // Pinch: two active pointers -> handled by onPointerMove
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: vp.panX, startPanY: vp.panY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.sqrt(dx * dx + dy * dy) <= 4) return;
    dragRef.current.moved = true;
    setVp(function(prev) {
      return { zoom: prev.zoom, panX: dragRef.current.startPanX + dx, panY: dragRef.current.startPanY + dy };
    });
  }

  function handlePointerUp(e) {
    dragRef.current = null;
  }

  // Touch pinch (two-pointer).
  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom: vp.zoom };
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchRef.current.dist;
      setVp(function(prev) { return { ...prev, zoom: clampZoom(pinchRef.current.zoom * ratio) }; });
    }
  }

  function handleTouchEnd() { pinchRef.current = null; }

  function handleKeyDown(e) {
    if (e.key === "+" || e.key === "=") { e.preventDefault(); setVp(function(p) { return { ...p, zoom: clampZoom(p.zoom + ZOOM_STEP) }; }); }
    if (e.key === "-") { e.preventDefault(); setVp(function(p) { return { ...p, zoom: clampZoom(p.zoom - ZOOM_STEP) }; }); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); setVp(function(p) { return { ...p, panX: p.panX + 40 }; }); }
    if (e.key === "ArrowRight") { e.preventDefault(); setVp(function(p) { return { ...p, panX: p.panX - 40 }; }); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setVp(function(p) { return { ...p, panY: p.panY + 40 }; }); }
    if (e.key === "ArrowDown")  { e.preventDefault(); setVp(function(p) { return { ...p, panY: p.panY - 40 }; }); }
  }

  function resetFit() { setVp({ zoom: initialZoom, panX: 0, panY: 0 }); }
  function zoomIn()  { setVp(function(p) { return { ...p, zoom: clampZoom(p.zoom + ZOOM_STEP) }; }); }
  function zoomOut() { setVp(function(p) { return { ...p, zoom: clampZoom(p.zoom - ZOOM_STEP) }; }); }

  const viewportHandlers = {
    onWheel: handleWheel,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onKeyDown: handleKeyDown,
    tabIndex: 0,
  };

  return { zoom: vp.zoom, panX: vp.panX, panY: vp.panY, band, transDur, containerRef, viewportHandlers, resetFit, zoomIn, zoomOut };
}

// Zoom toolbar (shared by force and workflow views).
function _ZoomToolbar({ onZoomIn, onZoomOut, onFit, zoom }) {
  const btnStyle = {
    minWidth: 44, minHeight: 44, border: "1px solid " + P.border, borderRadius: 8,
    background: P.surface, color: P.text, fontSize: 16, fontWeight: 700,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", flexDirection: "column", gap: 4, zIndex: 10 }}>
      <button onClick={onZoomIn}  aria-label="Zoom in"  style={btnStyle}>+</button>
      <button onClick={onZoomOut} aria-label="Zoom out" style={btnStyle}>-</button>
      <button onClick={onFit}     aria-label="Reset and fit graph to view" style={{ ...btnStyle, fontSize: 11, fontWeight: 700, padding: "0 6px" }}>fit</button>
      <span style={{ fontSize: 10, color: P.muted, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
    </div>
  );
}

// CO2.2: force-directed layout view with pan/zoom viewport and LOD.
// Renders the SAME nodes/edges as the lane view, positioned by _forceLayout.
// Layout is presentation-only; data and provenance chips are unchanged.
function KGForceView({ kg, traced, onNodeClick, isHighlighted, wide }) {
  const W = 900, H = 560;
  // _forceLayout is byte-frozen; memoize so a pan/zoom re-render only updates the
  // viewport transform - not re-run the 120-iteration simulation (perf, Codex P2).
  const pos = useMemo(function() { return _forceLayout(kg.nodes, kg.edges, W, H); }, [kg, W, H]);
  const nodeById = {};
  kg.nodes.forEach(function(n) { nodeById[n.id] = n; });

  const { zoom, panX, panY, band, transDur, containerRef, viewportHandlers, resetFit, zoomIn, zoomOut } =
    _useViewport(kg.nodes.length);

  // Small graphs ignore LOD so zooming just SCALES (no confusing vanish/appear of nodes).
  const smallGraph = kg.nodes.length <= LOD_NODE_CEILING;
  // Edge LOD: show edge only when both endpoints' tier <= band (skipped on small graphs).
  function edgeEligible(e) {
    const sa = nodeById[e.source], ta = nodeById[e.target];
    if (!sa || !ta) return false;
    return smallGraph || (_nodeTier(sa) <= band && _nodeTier(ta) <= band);
  }

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto", marginBottom: 14 }}>
      {/* Container: intercepts wheel + drag; tabIndex for keyboard zoom/pan. */}
      <div ref={containerRef} {...viewportHandlers}
        aria-label="Force-directed graph. Use +/- to zoom, arrow keys to pan, or drag and scroll. Switch to Lanes for keyboard navigation."
        style={{ width: W, height: H, position: "relative", background: P.bg, border: "1px solid " + P.border, borderRadius: 12, overflow: "hidden", cursor: "grab", outline: "none" }}>

        {/* Single transformed parent: SVG edge layer + node-button layer share one transform
            so edges and nodes stay registered under pan/zoom. */}
        <div style={{
          position: "absolute", left: 0, top: 0, width: W, height: H,
          transform: "translate(" + panX + "px," + panY + "px) scale(" + zoom + ")",
          transformOrigin: "0 0",
        }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
            {kg.edges.map(function(e, i) {
              const a = pos[e.source], b = pos[e.target];
              if (!a || !b) return null;
              const eli = edgeEligible(e);
              const active = !traced || e.source === traced || e.target === traced;
              const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2 - 18;
              return (
                <g key={i} style={{ opacity: eli ? (active ? 0.8 : 0.15) : 0, transition: "opacity " + transDur + " ease" }}>
                  <path d={"M " + a.x + " " + a.y + " Q " + midX + " " + midY + " " + b.x + " " + b.y} fill="none" stroke="#93c5fd" strokeWidth={active ? 2 : 1} />
                  <text x={midX} y={midY} textAnchor="middle" fontSize={9} fill="#64748b">{e.verb}</text>
                </g>
              );
            })}
          </svg>
          {kg.nodes.map(function(n) {
            const p = pos[n.id];
            if (!p) return null;
            const st = KG_TYPE_STYLE[n.type] || KG_TYPE_STYLE.skill;
            const hi = isHighlighted(n);
            const isT = traced === n.id;
            const eligible = smallGraph || _nodeTier(n) <= band;
            // Tapped node EXPANDS in place to full readable text (tap again to collapse).
            const boxW = isT ? 236 : 118;
            // Ineligible nodes: opacity 0, removed from tab order (hidden keyboard trap guard).
            return (
              <button key={n.id}
                onClick={function() { if (eligible) onNodeClick(n.id); }}
                tabIndex={eligible ? 0 : -1}
                aria-pressed={isT}
                aria-hidden={!eligible}
                aria-label={n.type + ": " + n.label + (isT ? ". Tap to collapse." : ". Tap to read in full.")}
                style={{
                  position: "absolute",
                  left: Math.round(p.x - boxW / 2), top: Math.round(p.y - 20),
                  width: boxW, minHeight: 44, maxWidth: "none",
                  border: (isT ? 2 : 1) + "px solid " + (isT ? st.color : st.border),
                  borderRadius: 10, background: isT ? "#ffffff" : P.surface,
                  fontSize: isT ? 12 : 10.5, fontWeight: 600, color: st.color,
                  cursor: eligible ? "pointer" : "default", padding: isT ? "9px 11px" : "5px 7px",
                  textAlign: isT ? "left" : "center",
                  opacity: eligible ? (hi ? 1 : P.dim) : 0,
                  transition: "opacity " + transDur + " ease",
                  boxShadow: isT ? "0 8px 22px rgba(2,6,23,0.22)" : "none",
                  zIndex: isT ? 30 : 1,
                  lineHeight: 1.4, wordBreak: "normal", overflowWrap: "anywhere",
                  overflow: isT ? "visible" : "hidden",
                  display: isT ? "block" : "-webkit-box",
                  WebkitLineClamp: isT ? "unset" : 3,
                  WebkitBoxOrient: "vertical",
                  pointerEvents: eligible ? "auto" : "none",
                }}>
                {isT ? (
                  <span>
                    <span style={{ display: "block", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.65, marginBottom: 4 }}>{n.type}</span>
                    {n.label}
                    <span style={{ display: "block", marginTop: 6, fontSize: 10, fontWeight: 700, color: "#1e40af" }}>tap to collapse</span>
                  </span>
                ) : n.label}
              </button>
            );
          })}
        </div>

        <_ZoomToolbar onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={resetFit} zoom={zoom} />
      </div>
      <p style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>Neural graph - <strong>tap a node to expand it and read the full text</strong> (tap again to collapse). Tap also traces its connections. Wheel/pinch or +/- to zoom; drag or arrow keys to pan. Prefer reading? Switch to <strong>Cards</strong>.</p>
    </div>
  );
}

// CO2.2: workflow (streamline) view - deterministic left->right column DAG.
// Three columns: functions | duties | agent candidates.
// Orthogonal left->right edge paths with verb labels. Same LOD + pan/zoom as force view.
function KGWorkflowView({ kg, traced, onNodeClick, isHighlighted, wide }) {
  const COL_COUNT = 3;
  const W = Math.max(900, WORKFLOW_COL_GAP * COL_COUNT + 80);
  const H = 560;
  const pos = useMemo(function() { return _workflowLayout(kg.nodes, kg.edges, W, H); }, [kg, W, H]);
  const nodeById = {};
  kg.nodes.forEach(function(n) { nodeById[n.id] = n; });

  const { zoom, panX, panY, transDur, containerRef, viewportHandlers, resetFit, zoomIn, zoomOut } =
    _useViewport(kg.nodes.length);
  // CO2.2 fix: the structured Workflow ALWAYS shows all 3 columns (Functions |
  // Recurring Duties | Agent Candidates). The semantic-zoom LOD collapse-to-hubs
  // is a Neural-view declutter only; hiding the middle column would break the
  // function -> duty -> agent flow that is the whole point of this view.
  const WF_BAND = 2;

  // Orthogonal left->right edge path: M x1 y1 H midX V y2 H x2.
  function edgePath(a, b) {
    const midX = (a.x + b.x) / 2;
    return "M " + a.x + " " + a.y + " H " + midX + " V " + b.y + " H " + b.x;
  }

  function edgeEligible(e) {
    const sa = nodeById[e.source], ta = nodeById[e.target];
    if (!sa || !ta) return false;
    return _nodeTier(sa) <= WF_BAND && _nodeTier(ta) <= WF_BAND;
  }

  // Column header labels.
  const colLabels = ["Functions", "Recurring Duties", "Agent Candidates"];

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto", marginBottom: 14 }}>
      <div ref={containerRef} {...viewportHandlers}
        aria-label="Workflow layout: three columns left to right - Functions, Recurring Duties, Agent Candidates. Switch to Lanes for keyboard navigation."
        style={{ width: "100%", height: H, position: "relative", background: P.bg, border: "1px solid " + P.border, borderRadius: 12, overflow: "hidden", cursor: "grab", outline: "none" }}>

        {/* Column header labels (outside the transform so they stay fixed). */}
        {colLabels.map(function(lbl, c) {
          const cx = WORKFLOW_COL_GAP * (c + 0.5) + panX;
          return (
            <div key={c} aria-hidden="true" style={{
              position: "absolute", top: 8,
              left: cx - 70, width: 140, textAlign: "center",
              fontSize: 10, fontWeight: 800, color: P.muted, textTransform: "uppercase", letterSpacing: "0.06em",
              pointerEvents: "none",
            }}>{lbl}</div>
          );
        })}

        {/* Single transformed parent: SVG edge layer + node-button layer. */}
        <div style={{
          position: "absolute", left: 0, top: 0, width: W, height: H,
          transform: "translate(" + panX + "px," + panY + "px) scale(" + zoom + ")",
          transformOrigin: "0 0",
        }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
            {/* Column divider lines */}
            {[1, 2].map(function(c) {
              const x = WORKFLOW_COL_GAP * c;
              return <line key={c} x1={x} y1={0} x2={x} y2={H} stroke={P.border} strokeWidth={1} strokeDasharray="4 4" />;
            })}
            {kg.edges.map(function(e, i) {
              const a = pos[e.source], b = pos[e.target];
              if (!a || !b) return null;
              const eli = edgeEligible(e);
              const active = !traced || e.source === traced || e.target === traced;
              const midX = (a.x + b.x) / 2;
              const labelY = (a.y + b.y) / 2;
              return (
                <g key={i} style={{ opacity: eli ? (active ? 0.8 : 0.15) : 0, transition: "opacity " + transDur + " ease" }}>
                  <path d={edgePath(a, b)} fill="none" stroke="#93c5fd" strokeWidth={active ? 2 : 1} />
                  <text x={midX} y={labelY - 4} textAnchor="middle" fontSize={9} fill="#64748b">{e.verb}</text>
                </g>
              );
            })}
          </svg>
          {kg.nodes.map(function(n) {
            const p = pos[n.id];
            if (!p) return null;
            const st = KG_TYPE_STYLE[n.type] || KG_TYPE_STYLE.skill;
            const hi = isHighlighted(n);
            const isT = traced === n.id;
            const eligible = _nodeTier(n) <= WF_BAND;
            return (
              <button key={n.id}
                onClick={function() { if (eligible) onNodeClick(n.id); }}
                tabIndex={eligible ? 0 : -1}
                aria-pressed={isT}
                aria-hidden={!eligible}
                aria-label={n.type + ": " + n.label + ". Tap to trace."}
                style={{
                  position: "absolute",
                  left: Math.round(p.x - 52), top: Math.round(p.y - 20),
                  width: 104, minHeight: 44,
                  border: (isT ? 2 : 1) + "px solid " + (isT ? st.color : st.border),
                  borderRadius: 8, background: isT ? st.bg : P.surface,
                  fontSize: 10, fontWeight: 600, color: st.color,
                  cursor: eligible ? "pointer" : "default", padding: "4px 6px", textAlign: "center",
                  opacity: eligible ? (hi ? 1 : P.dim) : 0,
                  transition: "opacity " + transDur + " ease, transform " + transDur + " ease",
                  transform: eligible ? "scale(1)" : "scale(0.85)",
                  boxShadow: isT ? "0 2px 8px " + st.color + "44" : "none",
                  overflow: "hidden", lineHeight: 1.3, wordBreak: "break-word",
                  pointerEvents: eligible ? "auto" : "none",
                }}>
                {n.label}
              </button>
            );
          })}
        </div>

        <_ZoomToolbar onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={resetFit} zoom={zoom} />
      </div>
      <p style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>Workflow layout: functions | recurring duties | agent candidates, left to right. Edges flow left to right. Positions are deterministic. Tap a node to trace connections.</p>
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
