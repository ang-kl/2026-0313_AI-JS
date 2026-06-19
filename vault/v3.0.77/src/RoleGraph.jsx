// v3/src/RoleGraph.jsx — ?view=graph
// A left→right MINDMAP for ONE 🇸🇬 MyCareersFuture posting:
//   LEFT  = the published job ad (skills + responsibilities, verbatim ● from MCF)
//   CENTRE= the role hub
//   RIGHT = the AI filter (computed AI-exposure lens, ✓ computed by /api/engine offline)
// Curved branches radiate from the hub; click/hover a branch to light its path and dim the rest.
//
// Honesty (locked v3 contract): the AI-Exposure Index is OCCUPATION-LEVEL (AIOE) — one real
// number for the role, never a fabricated per-skill bar. The ad text is verbatim. No LLM here:
// same posting ⇒ same numbers. Colour never carries meaning alone (icon+label always present;
// blue/orange palette, no red/green).
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
  none:     { icon: "?", color: "#64748b", bg: "#f1f5f9", label: "unverified" },
};
const BAND = {
  high:     { color: "#9a3412", bg: "#fff7ed", label: "high" },
  moderate: { color: "#b45309", bg: "#fffbeb", label: "moderate" },
  low:      { color: "#0e7490", bg: "#ecfeff", label: "low" },
};
const SIDE = { left: "#0f766e", right: "#1e40af" }; // ad = teal, AI filter = blue

const fmtSalary = (a) => (a && a[0] != null ? `S$${a[0].toLocaleString()}–${a[1].toLocaleString()}/mo` : null);
const node = (id) => DATA.nodes.find((n) => n.id === id);

export default function RoleGraph() {
  const role = node("role");
  const eng = DATA.engine;
  const exp = eng?.ok ? eng.exposure : null;
  const occ = eng?.ok ? eng.occupation : null;
  const skills = DATA.nodes.filter((n) => n.col === "skill");
  const resps = DATA.nodes.filter((n) => n.col === "responsibility");

  // branch model: each branch is a card hanging off the hub (left = ad, right = AI filter)
  // RIGHT side = the approved "AI filter" (do not rework): Exposure → Occupation → via-chain
  // → AI-able vs human* → mirror roles*  (* = honest, occupation-level only).
  // LEFT side = the published job ad (added): Skills + Responsibilities, verbatim ● from MCF.
  const branches = [
    { id: "b-skills", side: "left", prov: "mcf", title: "Skills", sub: "as advertised", items: skills, expandable: true },
    { id: "b-resp", side: "left", prov: "mcf", title: "Responsibilities", sub: "as advertised", items: resps, expandable: true },
    { id: "b-exposure", side: "right", prov: "computed", title: "AI-Exposure", sub: exp ? `${exp.index}/100 · ${exp.band}` : "—", kind: "exposure", needsEng: true },
    { id: "b-occ", side: "right", prov: "computed", title: "Occupation", sub: occ ? `ISCO ${occ.isco.join("/")}` : "—", kind: "occupation", needsEng: true },
    { id: "b-chain", side: "right", prov: "computed", title: "How it's computed", sub: "SSOC→ISCO→SOC→AIOE", kind: "chain", needsEng: true },
    { id: "b-aiable", side: "right", prov: "none", title: "AI-able vs human", sub: "occupation-level only*", kind: "aiable" },
    { id: "b-mirror", side: "right", prov: "none", title: "Mirror roles", sub: "next*", kind: "mirror" },
  ].filter((b) => (b.needsEng ? eng?.ok : true));

  const [active, setActive] = useState(null);   // selected branch id
  const [hover, setHover] = useState(null);
  const [open, setOpen] = useState({});         // expandable groups
  const [wide, setWide] = useState(true);
  const [lines, setLines] = useState([]);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const stageRef = useRef(null);
  const hubRef = useRef(null);
  const cardEls = useRef({});
  const setCard = useCallback((id) => (el) => { if (el) cardEls.current[id] = el; else delete cardEls.current[id]; }, []);

  const focus = hover || active;

  // measure + draw the hub→branch curves
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
        // stacked: hub in the middle, ad above / AI filter below → vertical anchors
        x1 = hr.left + hr.width / 2 - cr.left; x2 = r.left + r.width / 2 - cr.left;
        if (b.side === "left") { y1 = hr.top - cr.top; y2 = r.bottom - cr.top; }
        else { y1 = hr.bottom - cr.top; y2 = r.top - cr.top; }
      }
      out.push({ id: b.id, side: b.side, x1, y1, x2, y2 });
    }
    setLines(out);
  }, [wide, open, focus, eng]);

  // resize → remeasure + flip layout
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

        {/* zone labels */}
        <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 2px 10px", gap: 8, flexWrap: "wrap" }}>
          <span style={chip(SIDE.left, "#ecfeff")}>◀ Published job ad · ● from MCF</span>
          <span style={chip(SIDE.right, "#eef2ff")}>AI filter · ✓ computed ▶</span>
        </div>

        {/* mindmap stage */}
        <div ref={stageRef} style={{ position: "relative", display: wide ? "grid" : "flex", flexDirection: wide ? undefined : "column",
          gridTemplateColumns: wide ? "1fr minmax(180px, 220px) 1fr" : undefined, gap: wide ? "clamp(10px,2vw,26px)" : 12, alignItems: wide ? "center" : "stretch" }}>

          {/* branch curves */}
          <svg width={box.w} height={box.h} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }} aria-hidden>
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

          {/* LEFT zone: the published ad */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: wide ? "flex-end" : "stretch", zIndex: 2, order: wide ? 0 : 0 }}>
            {leftBr.map((b) => (
              <GroupCard key={b.id} b={b} setEl={setCard(b.id)} side="left" dim={dimmed(b.id)} selected={active === b.id}
                openItems={!!open[b.id]} onToggle={() => setOpen((o) => ({ ...o, [b.id]: !o[b.id] }))}
                onSelect={() => setActive((a) => (a === b.id ? null : b.id))} onHover={(v) => setHover(v ? b.id : null)} />
            ))}
          </div>

          {/* CENTRE: role hub */}
          <div style={{ display: "flex", justifyContent: "center", zIndex: 2 }}>
            <button ref={hubRef} onClick={() => { setActive(null); }} onMouseEnter={() => setHover("role")} onMouseLeave={() => setHover(null)}
              aria-label={`${role.label}. Central role. ${role.meta.employer}.`}
              style={{ cursor: "pointer", textAlign: "center", border: `2px solid ${P.accent}`, background: "#fff",
                borderRadius: 16, padding: "14px 16px", minWidth: 160, maxWidth: 260, boxShadow: "0 4px 16px rgba(26,86,219,.16)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0f766e" }}>🇸🇬 MCF role</div>
              <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, margin: "4px 0" }}>{role.label}</div>
              <div style={{ fontSize: 11.5, color: P.muted }}>{role.meta.employer}</div>
              {exp && <div style={{ marginTop: 8 }}><span style={chip(BAND[exp.band].color, BAND[exp.band].bg)}>AI-exposure {exp.index}/100 · {exp.band}</span></div>}
            </button>
          </div>

          {/* RIGHT zone: the AI filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: wide ? "flex-start" : "stretch", zIndex: 2 }}>
            {rightBr.map((b) => (
              <GroupCard key={b.id} b={b} setEl={setCard(b.id)} side="right" dim={dimmed(b.id)} selected={active === b.id}
                eng={eng} openItems={!!open[b.id]} onToggle={() => setOpen((o) => ({ ...o, [b.id]: !o[b.id] }))}
                onSelect={() => setActive((a) => (a === b.id ? null : b.id))} onHover={(v) => setHover(v ? b.id : null)} />
            ))}
          </div>
        </div>

        {!eng?.ok && <Withheld eng={eng} />}
        <Footer eng={eng} />
      </div>
    </div>
  );
}

function Header({ role }) {
  return (
    <header style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>Role × AI-exposure mindmap</div>
      <h1 style={{ fontSize: "clamp(19px,3.6vw,26px)", margin: "3px 0 2px", lineHeight: 1.15 }}>{role.label}</h1>
      <div style={{ color: P.textSub, fontSize: 13.5 }}>
        {role.meta.employer}
        {role.meta.seniority ? ` · ${role.meta.seniority}` : ""}
        {fmtSalary(role.meta.salary) ? ` · ${fmtSalary(role.meta.salary)}` : ""}
        {role.meta.ssoc ? ` · SSOC ${role.meta.ssoc}` : ""}
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
      <span aria-hidden style={{ color: pv.color, fontWeight: 800, fontSize: 12 }}>{pv.icon}</span>
      <span style={{ fontWeight: 800, fontSize: 14 }}>{b.title}</span>
      {b.items && <span style={{ fontSize: 11, color: P.muted }}>({b.items.length})</span>}
      <span style={{ fontSize: 11, color: P.muted, marginLeft: side === "left" ? 0 : "auto", marginRight: side === "left" ? "auto" : 0 }}>{b.sub}</span>
    </button>
  );

  return (
    <div ref={setEl} style={base}>
      {head}
      <div style={{ padding: "0 13px 12px", textAlign: align }}>
        {/* expandable ad groups */}
        {b.items && (
          <>
            {b.kind !== "exposure" && (
              <button onClick={onToggle} aria-expanded={openItems} style={{ cursor: "pointer", border: `1px solid ${P.border}`, background: "#fff", color: P.textSub, borderRadius: 8, padding: "4px 9px", fontSize: 11.5, fontWeight: 700, minHeight: 32 }}>
                {openItems ? "▾ hide" : `▸ show ${b.items.length}`}
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

        {/* AI-filter (right side, approved) */}
        {b.kind === "exposure" && eng?.ok && <ExposureBody exp={eng.exposure} occ={eng.occupation} />}
        {b.kind === "occupation" && eng?.ok && (
          <div style={{ fontSize: 12.5, color: P.textSub, lineHeight: 1.5 }}>
            <b>{eng.occupation.label}</b><br />
            <span style={{ color: P.muted }}>ISCO {eng.occupation.isco.join("/")} · ✓ computed, not from the ad text.</span>
          </div>
        )}
        {b.kind === "chain" && eng?.ok && (
          <div style={{ fontSize: 12, color: P.textSub, lineHeight: 1.5 }}>
            SSOC {eng.occupation.ssoc} → ISCO {eng.occupation.isco.join("/")} → SOC {eng.occupation.soc.join(", ")} → AIOE.<br />
            <span style={{ color: P.muted }}>AIOE z-mean {eng.exposure.zMean} (range {eng.exposure.zRange[0]}–{eng.exposure.zRange[1]}); percentile of 774 occupations.</span>
          </div>
        )}
        {b.kind === "aiable" && (
          <div style={{ fontSize: 12, color: P.textSub, lineHeight: 1.5 }}>
            <span style={{ color: PROV.none.color, fontWeight: 700 }}>*occupation-level only.</span> Per-skill "survives AI vs automatable" isn't computed — AIOE has no per-skill source, so no skill gets a fake bar.
          </div>
        )}
        {b.kind === "mirror" && (
          <div style={{ fontSize: 12, color: P.textSub, lineHeight: 1.5 }}>
            <span style={{ color: PROV.none.color, fontWeight: 700 }}>*coming next.</span> Other roles sharing this exposure (ESCO blend %) — not yet computed; shown honestly as pending, not faked.
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
        AIOE z-mean {exp.zMean} (range {exp.zRange[0]}–{exp.zRange[1]}); percentile of 774 occupations. Confidence {exp.confidence}.
      </div>
    </div>
  );
}

function Withheld({ eng }) {
  return (
    <div style={{ marginTop: 14, background: "#fff", border: `1px dashed ${PROV.none.color}`, borderRadius: 12, padding: 14 }}>
      <b style={{ color: PROV.none.color }}>? AI-Exposure withheld</b>
      <div style={{ fontSize: 13, color: P.textSub, marginTop: 4 }}>{eng?.reason || "Could not compute from verified data."} — not faked.</div>
    </div>
  );
}

function Footer({ eng }) {
  const p = eng?.provenance;
  return (
    <footer style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${P.border}`, fontSize: 11.5, color: P.muted, lineHeight: 1.6 }}>
      <div><b>Computed (deterministic):</b> AIOE — {p?.aioe?.citation || "Felten, Raj & Seamans 2021"}; SSOC↔ISCO — {p?.ssocIsco?.source || "SingStat"}; ISCO↔SOC — {p?.iscoSoc?.source || "U.S. BLS"}. No LLM: same posting ⇒ same numbers.</div>
      {DATA.role?.source_url && <div style={{ marginTop: 4 }}><a href={DATA.role.source_url} target="_blank" rel="noopener noreferrer" style={{ color: P.accent }}>View the posting on MyCareersFuture ↗</a></div>}
    </footer>
  );
}

function chip(color, bg) {
  return { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color, background: bg, border: `1px solid ${color}33`, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" };
}
