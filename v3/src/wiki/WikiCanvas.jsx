// WikiCanvas.jsx - the CENTRE "canvas" of the O-I-A: relationships shown by TEXT, not a node graph
// (Human Lead's Obsidian-Canvas reference: theme groups holding duty cards, with [[wikilink]] interlinks).
// Each THEME is a coloured group box; each DUTY is a card carrying its key-term [[wikilinks]], the skills
// it depends on (-> [[skill]] from the deterministic edges), and its [work-mode][AI-exposure] tags. Plus
// reference cards for the role's occupation + organisation (the "embedded note" analog).
// Render-only over the themed payload + edges (deterministic); the LLM gloss only renames a theme label.
// R007: ASCII only in JSX strings. No red/green - group tints are decorative (blue/teal/purple/amber/slate).

const C = {
  surface: "#ffffff", border: "#e3e9f1", text: "#1a202c", textSub: "#4a5568", muted: "#5b6878",
};
const NEO = { raiseSm: "4px 4px 9px rgba(174,189,212,0.5), -4px -4px 9px rgba(255,255,255,0.9)" };

// Decorative group tints (colour-blind safe rotation; carry no state meaning - the label is the cue).
const GROUP_TINTS = [
  { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1e40af" },
  { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0e7490" },
  { bg: "#f5f3ff", bd: "#ddd6fe", fg: "#6d28d9" },
  { bg: "#fff7ed", bd: "#fed7aa", fg: "#c2410c" },
  { bg: "#f0fdfa", bd: "#99f6e4", fg: "#0f766e" },
  { bg: "#fdf4ff", bd: "#f5d0fe", fg: "#a21caf" },
];

const MODE_COLOUR = {
  Activity:       { bg: "#fff7ed", bd: "#fed7aa", fg: "#c2410c" },
  Coordination:   { bg: "#fffbeb", bd: "#fde68a", fg: "#b45309" },
  Accountability: { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0e7490" },
  Relational:     { bg: "#eef2ff", bd: "#c7d2fe", fg: "#1e40af" },
  Judgment:       { bg: "#f3e8ff", bd: "#ddd6fe", fg: "#7c3aed" },
};
const LEVEL_LABEL = { HUMAN: "Human-Led", LOW: "AI-Assisted", MEDIUM: "AI-Augmented", HIGH: "Full Automation" };
const LEVEL_COLOUR = {
  HUMAN:  { bg: "#eef2ff", bd: "#c7d2fe", fg: "#1e40af" },
  LOW:    { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0e7490" },
  MEDIUM: { bg: "#fffbeb", bd: "#fde68a", fg: "#b45309" },
  HIGH:   { bg: "#fff7ed", bd: "#fed7aa", fg: "#c2410c" },
};

function Tag({ c, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.625rem", fontWeight: 700, borderRadius: 6, padding: "1px 7px", background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// A [[wikilink]] chip - the text interlink. variant "term" (plain key term) or "skill" (-> linked skill).
function WikiLink({ label, variant }) {
  const teal = { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0e7490" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "0.6875rem", fontWeight: 700, borderRadius: 6, padding: "1px 7px", background: teal.bg, border: `1px solid ${teal.bd}`, color: teal.fg, whiteSpace: "nowrap" }}>
      {variant === "skill" ? <span aria-hidden="true" style={{ opacity: 0.7 }}>{"-> "}</span> : null}
      {label}
    </span>
  );
}

export default function WikiCanvas({ topics, dutyMeta, nodeMap, glosses, edges, nodes }) {
  if (!topics || !topics.length) return null;

  // duty -> the skills it depends on (deterministic "depends-on" edges), for the -> [[skill]] interlinks
  const dutySkills = {};
  (edges || []).forEach(e => {
    if (e && e.verb === "depends-on" && nodeMap[e.target] && nodeMap[e.target].type === "skill") {
      (dutySkills[e.source] = dutySkills[e.source] || []).push(nodeMap[e.target].label);
    }
  });

  // reference cards (the "embedded note" analog) - the role's occupation + organisation, if present
  const occ = (nodes || []).find(n => n.type === "occupation");
  const org = (nodes || []).find(n => n.type === "organisation");

  return (
    <div>
      {/* Theme groups laid out as a card board (reflows responsively) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {topics.map(function(tp, i) {
          const tint = GROUP_TINTS[i % GROUP_TINTS.length];
          const gloss = glosses && glosses[tp.seed];
          return (
            <section
              key={tp.id}
              aria-label={"Theme: " + (gloss || tp.label)}
              style={{ background: tint.bg, border: `1.5px solid ${tint.bd}`, borderRadius: 14, padding: 12 }}
            >
              <header style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 800, color: tint.fg }}>{gloss || tp.label}</h4>
                {gloss ? <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "0 5px" }}>~ AI label</span> : null}
                <span style={{ fontSize: "0.625rem", color: C.muted }}>{tp.dutyIds.length} {tp.dutyIds.length === 1 ? "duty" : "duties"}</span>
              </header>

              {tp.dutyIds.map(function(did) {
                const m = dutyMeta[did] || {};
                const text = (nodeMap[did] && nodeMap[did].label) || did;
                const mc = m.layer && MODE_COLOUR[m.layer];
                const lc = m.level && LEVEL_COLOUR[m.level];
                const terms = (m.keywords || []).slice(0, 4);
                const skills = (dutySkills[did] || []).slice(0, 3);
                return (
                  <article key={did} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 11px", marginBottom: 8, boxShadow: NEO.raiseSm }}>
                    <p style={{ margin: "0 0 7px", fontSize: "0.8125rem", color: C.text, lineHeight: 1.45 }}>{text}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                      {mc ? <Tag c={mc}>{m.layer}</Tag> : null}
                      {lc ? <Tag c={lc}>{LEVEL_LABEL[m.level] || m.level}</Tag> : null}
                      {terms.map(function(t) { return <WikiLink key={"t" + t} label={t} variant="term" />; })}
                      {skills.map(function(s) { return <WikiLink key={"s" + s} label={s} variant="skill" />; })}
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>

      {/* Reference cards - the role's occupation + organisation (embedded-note analog) */}
      {(occ || org) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
          {occ && (
            <div style={{ flex: "1 1 240px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, boxShadow: NEO.raiseSm }}>
              <p style={{ margin: "0 0 3px", fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#0e7490" }}>Occupation (ESCO / ISCO)</p>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: C.text }}>{occ.label}</p>
              {occ.ref && occ.ref.iscoCode ? <p style={{ margin: "2px 0 0", fontSize: "0.6875rem", color: C.muted }}>ISCO {occ.ref.iscoCode}</p> : null}
            </div>
          )}
          {org && (
            <div style={{ flex: "1 1 240px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, boxShadow: NEO.raiseSm }}>
              <p style={{ margin: "0 0 3px", fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#7c3aed" }}>Organisation</p>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: C.text }}>{org.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.6875rem", color: C.muted }}>from the posting</p>
            </div>
          )}
        </div>
      )}

      <p style={{ margin: "12px 2px 0", fontSize: "0.6875rem", color: C.muted, lineHeight: 1.5 }}>
        Each card is a duty from the posting; the <strong style={{ color: C.text }}>[[chips]]</strong> are its
        key terms and the skills it depends on (the interlinks, by text). Themes are grouped deterministically;
        the theme name may carry an <strong style={{ color: C.text }}>AI label</strong> (~) for readability. The
        visual node-graph of the same ecosystem is in the panel on the right.
      </p>
    </div>
  );
}
