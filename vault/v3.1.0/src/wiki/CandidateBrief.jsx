// CandidateBrief.jsx - PR3: Candidate Brief printable one-pager
// Wired to REAL result fields from the v3 engine - no invented values.
// Every row carries a Prov chip matching spec §2 tier.
// R007: ASCII only. R006: no multi-line async arrow in JSX props.
// No red/green - blue/amber/teal/purple only. 44px touch targets.

// ── palette (mirrors App.jsx C) ──────────────────────────────────────────────
const C = {
  bg:         "#e6ebf2",
  surface:    "#ffffff",
  border:     "#e3e9f1",
  accent:     "#1a56db",
  accentSoft: "#e8f0fe",
  muted:      "#5b6878",
  text:       "#1a202c",
  textSub:    "#4a5568",
  amber:      "#b45309",
  amberBg:    "#fffbeb",
  amberBdr:   "#fcd9a0",
  teal:       "#0e7490",
  tealBg:     "#ecfeff",
  tealBdr:    "#a5f3fc",
  purple:     "#7c3aed",
  purpleBg:   "#f3e8ff",
  purpleBdr:  "#ddd6fe",
};

// NEO tokens (mirrors App.jsx NEO)
const NEO = {
  raise:   "6px 6px 14px rgba(174,189,212,0.55), -6px -6px 13px rgba(255,255,255,0.9)",
  raiseSm: "4px 4px 9px rgba(174,189,212,0.5), -4px -4px 9px rgba(255,255,255,0.9)",
};

// Prov chip - mirrors PROV in App.jsx exactly (colour-blind-safe, icon+label)
const PROV_META = {
  mcf:        { icon: "●", label: "from posting",  bg: "#f0fdfa", bdr: "#99f6e4", fg: "#0f766e" },
  computed:   { icon: "✓", label: "computed",       bg: "#eef2ff", bdr: "#c7d2fe", fg: "#1e40af" },
  derived:    { icon: "◐", label: "derived",        bg: "#ecfeff", bdr: "#a5f3fc", fg: "#0e7490" },
  ai:         { icon: "~",      label: "AI estimate",    bg: "#fffbeb", bdr: "#fde68a", fg: "#b45309" },
  unverified: { icon: "?",      label: "unverified",     bg: "#f5f7fa", bdr: "#dde3ec", fg: "#5b6878" },
};

function ProvChip({ kind }) {
  const m = PROV_META[kind] || PROV_META.unverified;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: "0.5625rem", fontWeight: 700,
      borderRadius: 999, padding: "1px 7px",
      background: m.bg, border: `1px solid ${m.bdr}`, color: m.fg,
      whiteSpace: "nowrap", verticalAlign: "middle",
    }}>
      <span aria-hidden="true">{m.icon}</span> {m.label}
    </span>
  );
}

// Withhold placeholder - used when a source field is absent (non-inventive contract)
function Withheld({ reason }) {
  return (
    <span style={{ color: C.muted, fontStyle: "italic", fontSize: "0.75rem" }}>
      not enough evidence{reason ? ` (${reason})` : ""}
    </span>
  );
}

// Print CSS - injected once into the document head via a <style> tag in JSX
const PRINT_STYLE = `
@media print {
  body > #root > * { display: none !important; }
  .wiki-candidate-brief-print { display: block !important; position: static !important; }
  .wiki-brief-no-print { display: none !important; }
}
@media screen {
  .wiki-candidate-brief-print { display: block; }
}
`;

// ── CandidateBrief export ────────────────────────────────────────────────────
// Props:
//   result  - the live v3 result object (App.jsx state)
//   title   - role title string
//
// Result fields consumed (all wired to real engine output, never invented):
//   result.jobAnatomy.aiResilienceScore  - COMPUTED
//   result.jobAnatomy.automatabilityIndex - COMPUTED
//   result.skills[].level               - COMPUTED (AI-level classification)
//   result.foundationData               - ~ AI estimate (LLM, persona-gated)
//   result.progressionData              - ~ AI estimate (LLM)
//   result.crossoverData                - ~ AI estimate (LLM)
//   demandProof output via result.responsibilitiesData.jobs - DERIVED
export default function CandidateBrief({ result, title }) {
  if (!result) return null;

  // 1. AI-readiness: resilience score + exposure level (COMPUTED)
  const ja = result.jobAnatomy;
  const hasAnatomy = ja && !ja.fallback && typeof ja.aiResilienceScore === "number";
  const resilienceScore = hasAnatomy ? ja.aiResilienceScore : null;
  const autoIndex       = hasAnatomy ? ja.automatabilityIndex : null;

  // 2. Your edge: Human-Led skills (DERIVED - deterministic filter over COMPUTED skill levels)
  const skills = Array.isArray(result.skills) ? result.skills : [];
  const humanLed = skills.filter(function(s) { return s.level === "HUMAN"; });
  const edgeSkills = humanLed.slice(0, 5).map(function(s) { return s.skill; });

  // 3. Build next: first 3 foundation skills from foundationData (~ AI estimate)
  const fd = result.foundationData;
  const buildNext = fd && Array.isArray(fd.foundations)
    ? fd.foundations.filter(function(f) { return f.priority === "Must-Have"; }).slice(0, 3)
    : null;

  // 4. Progression - next up-move (~ AI estimate from LLM)
  const prog = Array.isArray(result.progressionData) ? result.progressionData : [];
  const nextUp = prog.find(function(p) { return p.dir === "up"; });

  // 5. Crossover - top lateral pivot (~ AI estimate from LLM)
  const cross = Array.isArray(result.crossoverData) ? result.crossoverData : [];
  const topCross = cross[0] || null;

  // Demand proof count (derived from MCF jobs, if present)
  const jobs = ((result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs))
    ? result.responsibilitiesData.jobs : []).filter(function(j) { return j && j.source !== "careers.gov.sg"; });
  const demandCount = jobs.length;

  function handlePrint() { window.print(); }

  const boxStyle = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
    padding: "18px 20px", marginBottom: 16, boxShadow: NEO.raise,
  };

  const rowStyle = {
    display: "flex", gap: 10, alignItems: "flex-start",
    padding: "10px 0", borderBottom: `1px solid ${C.border}`,
  };
  const keyStyle = {
    minWidth: 130, fontSize: "0.6875rem", fontWeight: 800, color: C.text,
    textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
    paddingTop: 2,
  };
  const valStyle = { fontSize: "0.8125rem", color: C.textSub, lineHeight: 1.6, flex: 1 };

  return (
    <>
      <style>{PRINT_STYLE}</style>
      <div className="wiki-candidate-brief-print" style={boxStyle} aria-label="Candidate Brief - printable one-pager">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `2px solid ${C.border}` }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>
              Candidate Brief
            </p>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: C.text }}>
              {title || "This role"}
            </h3>
          </div>
          <button
            type="button"
            className="wiki-brief-no-print"
            onClick={handlePrint}
            aria-label="Print or save Candidate Brief as PDF"
            style={{
              minHeight: 44, padding: "8px 16px", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.accentSoft,
              color: C.accent, fontWeight: 700, fontSize: "0.8125rem",
              cursor: "pointer", boxShadow: NEO.raiseSm,
            }}>
            Print / save as PDF
          </button>
        </div>

        {/* Row 1: AI-readiness */}
        <div style={rowStyle}>
          <span style={keyStyle}>AI-readiness</span>
          <span style={valStyle}>
            {hasAnatomy ? (
              <>
                Resilience <strong>{resilienceScore}/100</strong> (higher = more human-led) - automatability now{" "}
                <strong>{autoIndex}/100</strong>{" "}
                <ProvChip kind="computed" />
              </>
            ) : (
              <Withheld reason="Job Anatomy not yet loaded" />
            )}
          </span>
        </div>

        {/* Row 2: Your edge */}
        <div style={rowStyle}>
          <span style={keyStyle}>Your edge</span>
          <span style={valStyle}>
            {edgeSkills.length > 0 ? (
              <>
                {edgeSkills.join(", ")} - the Human-Led core AI cannot own{" "}
                <ProvChip kind="derived" />
              </>
            ) : (
              <Withheld reason="no Human-Led skills classified yet" />
            )}
          </span>
        </div>

        {/* Row 3: Build next */}
        <div style={rowStyle}>
          <span style={keyStyle}>Build next</span>
          <span style={valStyle}>
            {buildNext && buildNext.length > 0 ? (
              <>
                {buildNext.map(function(f) { return f.skill; }).join(" - ")}{" "}
                <ProvChip kind="ai" />
              </>
            ) : fd ? (
              <>
                {(fd.foundations || []).slice(0, 3).map(function(f) { return f.skill; }).join(" - ")}{" "}
                <ProvChip kind="ai" />
              </>
            ) : (
              <Withheld reason="Foundation plan not loaded (select a persona on the result page)" />
            )}
          </span>
        </div>

        {/* Row 4: Positioning / next move */}
        <div style={rowStyle}>
          <span style={keyStyle}>Next move</span>
          <span style={valStyle}>
            {nextUp ? (
              <>
                <strong>{nextUp.role}</strong>
                {nextUp.note ? ` - ${nextUp.note}` : ""}{" "}
                <ProvChip kind="ai" />
              </>
            ) : (
              <Withheld reason="Progression data not loaded" />
            )}
          </span>
        </div>

        {/* Row 5: Crossover */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={keyStyle}>Crossover</span>
          <span style={valStyle}>
            {topCross ? (
              <>
                <strong>{topCross.role}</strong>
                {topCross.bridge ? ` via ${topCross.bridge}` : ""}{" "}
                <ProvChip kind="ai" />
              </>
            ) : (
              <Withheld reason="Crossover data not loaded" />
            )}
          </span>
        </div>

        {/* Row 6: Demand (if available) */}
        {demandCount >= 4 && (
          <div style={{ ...rowStyle, borderTop: `1px solid ${C.border}`, borderBottom: "none", marginTop: 4 }}>
            <span style={keyStyle}>Demand sample</span>
            <span style={valStyle}>
              {demandCount} live SG postings sampled{" "}
              <ProvChip kind="derived" />
            </span>
          </div>
        )}

        {/* Footer - mandatory per spec */}
        <div style={{
          marginTop: 14, padding: "10px 0 0",
          borderTop: `1px solid ${C.border}`,
          fontSize: "0.6875rem", color: C.muted, lineHeight: 1.6,
        }}>
          <strong style={{ color: C.text }}>AI-assisted; human decides.</strong>{" "}
          Source: computed from live SG role data (ESCO / ISCO / MCF) -{" "}
          Confidence: varies per row (see badge) -{" "}
          Time-window: current session. Build your proof, then re-read.
        </div>
      </div>
    </>
  );
}
